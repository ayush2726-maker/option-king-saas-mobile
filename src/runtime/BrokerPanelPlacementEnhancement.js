const React = require("react");
const { ScrollView } = require("react-native");
const SelectedBrokerPanelModule = require("../components/SelectedBrokerOverlay");
const SelectedBrokerPanel =
  SelectedBrokerPanelModule.default || SelectedBrokerPanelModule;

let installed = false;
let injecting = false;

function textFromNode(node, depth = 0) {
  if (depth > 7 || node == null || node === false) return "";
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
  if (depth > 5 || node == null) return false;
  if (Array.isArray(node)) {
    return node.some((item) => containsBrokerPanel(item, depth + 1));
  }
  if (React.isValidElement(node)) {
    if (node.type === SelectedBrokerPanel) return true;
    return containsBrokerPanel(node.props?.children, depth + 1);
  }
  return false;
}

function isBrokerToolsScroll(children) {
  const text = textFromNode(children).toLowerCase();
  return (
    text.includes("connect broker") ||
    text.includes("broker connect karo")
  );
}

function prependPanel(children, originalCreateElement) {
  if (containsBrokerPanel(children)) return children;
  injecting = true;
  let panel;
  try {
    panel = originalCreateElement(SelectedBrokerPanel, {
      key: "okai-selected-broker-panel",
    });
  } finally {
    injecting = false;
  }
  return Array.isArray(children) ? [panel, ...children] : [panel, children];
}

function patchAutomaticRuntime(moduleName, originalCreateElement) {
  try {
    const runtime = require(moduleName);
    for (const functionName of ["jsx", "jsxs", "jsxDEV"]) {
      const original = runtime?.[functionName];
      if (typeof original !== "function") continue;

      runtime[functionName] = function brokerPanelAwareJsx(type, props, ...rest) {
        const children = props?.children;
        if (
          !injecting &&
          type === ScrollView &&
          isBrokerToolsScroll(children) &&
          !containsBrokerPanel(children)
        ) {
          return original(
            type,
            {
              ...(props || {}),
              children: prependPanel(children, originalCreateElement),
            },
            ...rest
          );
        }
        return original(type, props, ...rest);
      };
    }
  } catch (_) {
    // The classic React.createElement path below still covers older Expo builds.
  }
}

function installBrokerPanelPlacementEnhancement() {
  if (installed) return;
  installed = true;

  const originalCreateElement = React.createElement.bind(React);

  React.createElement = function brokerPanelAwareCreateElement(
    type,
    props,
    ...children
  ) {
    if (
      !injecting &&
      type === ScrollView &&
      isBrokerToolsScroll(children) &&
      !containsBrokerPanel(children)
    ) {
      const nextChildren = prependPanel(children, originalCreateElement);
      return originalCreateElement(type, props, ...nextChildren);
    }

    return originalCreateElement(type, props, ...children);
  };

  patchAutomaticRuntime("react/jsx-runtime", originalCreateElement);
  patchAutomaticRuntime("react/jsx-dev-runtime", originalCreateElement);
}

module.exports = {
  installBrokerPanelPlacementEnhancement,
};
