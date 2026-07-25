const React = require("react");
const ReactNative = require("react-native");
const SelectedBrokerPanelModule = require("../components/SelectedBrokerOverlay");
const SelectedBrokerPanel =
  SelectedBrokerPanelModule.default || SelectedBrokerPanelModule;

let installed = false;
let injecting = false;

function textFromNode(node, depth = 0) {
  if (depth > 8 || node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((item) => textFromNode(item, depth + 1)).join(" ");
  }
  if (React.isValidElement(node)) {
    return textFromNode(node.props?.children, depth + 1);
  }
  return "";
}

function containsBrokerPanel(node, depth = 0) {
  if (depth > 7 || node == null) return false;
  if (Array.isArray(node)) {
    return node.some((item) => containsBrokerPanel(item, depth + 1));
  }
  if (React.isValidElement(node)) {
    if (node.type === SelectedBrokerPanel) return true;
    return containsBrokerPanel(node.props?.children, depth + 1);
  }
  return false;
}

function isBrokerToolsContent(children) {
  const text = textFromNode(children).toLowerCase();
  return (
    text.includes("connect broker") ||
    text.includes("broker connect karo") ||
    text.includes("ब्रोकर कनेक्ट")
  );
}

function makePanel(createElement) {
  injecting = true;
  try {
    return createElement(SelectedBrokerPanel, {
      key: "okai-selected-broker-panel",
    });
  } finally {
    injecting = false;
  }
}

function prependPanel(children, createElement) {
  if (containsBrokerPanel(children)) return children;
  const panel = makePanel(createElement);
  return Array.isArray(children) ? [panel, ...children] : [panel, children];
}

function componentName(type) {
  return String(type?.displayName || type?.name || "").toLowerCase();
}

function isScrollViewType(type, originalScrollView) {
  if (type === originalScrollView || type === ReactNative.ScrollView) return true;
  return componentName(type).includes("scrollview");
}

function isCardType(type) {
  return typeof type === "function" && componentName(type) === "card";
}

function patchReactNativeScrollViewExport(baseCreateElement) {
  if (ReactNative.__OKAI_BROKER_SCROLLVIEW_PATCHED__) return;

  const OriginalScrollView = ReactNative.ScrollView;
  if (!OriginalScrollView) return;

  const BrokerAwareScrollView = React.forwardRef(function OkaiBrokerAwareScrollView(
    props,
    ref
  ) {
    const children = props?.children;
    const nextChildren =
      !injecting && isBrokerToolsContent(children) && !containsBrokerPanel(children)
        ? prependPanel(children, baseCreateElement)
        : children;

    return baseCreateElement(
      OriginalScrollView,
      { ...(props || {}), ref, children: nextChildren }
    );
  });
  BrokerAwareScrollView.displayName = "OkaiBrokerAwareScrollView";

  let replaced = false;
  try {
    ReactNative.ScrollView = BrokerAwareScrollView;
    replaced = ReactNative.ScrollView === BrokerAwareScrollView;
  } catch (_) {}

  if (!replaced) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(ReactNative, "ScrollView");
      if (!descriptor || descriptor.configurable) {
        Object.defineProperty(ReactNative, "ScrollView", {
          configurable: true,
          enumerable: true,
          writable: true,
          value: BrokerAwareScrollView,
        });
        replaced = ReactNative.ScrollView === BrokerAwareScrollView;
      }
    } catch (_) {}
  }

  ReactNative.__OKAI_BROKER_SCROLLVIEW_PATCHED__ = replaced;
}

function patchAutomaticRuntime(moduleName, baseCreateElement, originalScrollView) {
  try {
    const runtime = require(moduleName);
    for (const functionName of ["jsx", "jsxs", "jsxDEV"]) {
      const original = runtime?.[functionName];
      if (typeof original !== "function") continue;

      runtime[functionName] = function brokerPanelAwareJsx(type, props, ...rest) {
        const children = props?.children;
        if (
          !injecting &&
          !containsBrokerPanel(children) &&
          isBrokerToolsContent(children)
        ) {
          if (isScrollViewType(type, originalScrollView) || isCardType(type)) {
            return original(
              type,
              {
                ...(props || {}),
                children: prependPanel(children, baseCreateElement),
              },
              ...rest
            );
          }
        }
        return original(type, props, ...rest);
      };
    }
  } catch (_) {
    // React.createElement and react-native export fallbacks remain active.
  }
}

function installBrokerPanelPlacementEnhancement() {
  if (installed) return;
  installed = true;

  const originalScrollView = ReactNative.ScrollView;
  const baseCreateElement = React.createElement.bind(React);

  // App.js is required only after this installer runs, so its BrokerTab receives
  // this broker-aware ScrollView export directly whenever the export is writable.
  patchReactNativeScrollViewExport(baseCreateElement);

  React.createElement = function brokerPanelAwareCreateElement(
    type,
    props,
    ...children
  ) {
    if (
      !injecting &&
      !containsBrokerPanel(children) &&
      isBrokerToolsContent(children) &&
      (isScrollViewType(type, originalScrollView) || isCardType(type))
    ) {
      const nextChildren = prependPanel(children, baseCreateElement);
      return baseCreateElement(type, props, ...nextChildren);
    }

    return baseCreateElement(type, props, ...children);
  };

  patchAutomaticRuntime("react/jsx-runtime", baseCreateElement, originalScrollView);
  patchAutomaticRuntime("react/jsx-dev-runtime", baseCreateElement, originalScrollView);
}

module.exports = {
  installBrokerPanelPlacementEnhancement,
};
