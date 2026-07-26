const React = require("react");
const ReactNative = require("react-native");
const HelpScreenModule = require("../screens/HelpScreen");

const HelpScreen = HelpScreenModule.default || HelpScreenModule;

let automaticJsxRuntime = null;
let automaticJsxDevRuntime = null;
try {
  automaticJsxRuntime = require("react/jsx-runtime");
} catch (_) {}
try {
  automaticJsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

let installed = false;
let transforming = false;

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function textFromNode(node, depth = 0) {
  if (depth > 8 || node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    return node.map((item) => textFromNode(item, depth + 1)).join(" ");
  }
  if (React.isValidElement(node)) {
    return textFromNode(node.props?.children, depth + 1);
  }
  return "";
}

function flattenChildren(node, output = []) {
  if (node == null || node === false) return output;
  if (Array.isArray(node)) {
    node.forEach((item) => flattenChildren(item, output));
    return output;
  }
  output.push(node);
  return output;
}

function exactHelpLabel(value) {
  const map = {
    Guide: "Help",
    "App Guide": "Help",
    "Guide & Language": "Help",
    "Guide + Language": "Help",
    "गाइड": "मदद",
    "ऐप गाइड": "मदद",
    "गाइड और भाषा": "मदद",
    "गाइड + भाषा": "मदद",
  };
  return Object.prototype.hasOwnProperty.call(map, value) ? map[value] : value;
}

function mapHomeRoute(value) {
  return value === "home" ? "bot" : value;
}

function tabKind(node) {
  const text = ` ${textFromNode(node).replace(/\s+/g, " ").trim()} `;
  if (/\s(बॉट|Bot)\s/i.test(text)) return "bot";
  if (/\s(ट्रेड|Trade)\s/i.test(text)) return "trade";
  if (/\s(टूल्स|Tools)\s/i.test(text)) return "tools";
  if (/\s(अधिक|More)\s/i.test(text)) return "more";
  if (/\s(खाता|Account)\s/i.test(text)) return "account";
  if (/\s(होम|Home)\s/i.test(text)) return "old-home";
  return "other";
}

function replaceNodeText(node, replacements, depth = 0) {
  if (depth > 10 || node == null || node === false) return node;
  if (typeof node === "string") {
    return Object.prototype.hasOwnProperty.call(replacements, node)
      ? replacements[node]
      : node;
  }
  if (typeof node === "number") return node;
  if (Array.isArray(node)) {
    return node.map((item) => replaceNodeText(item, replacements, depth + 1));
  }
  if (!React.isValidElement(node)) return node;

  const nextChildren = replaceNodeText(node.props?.children, replacements, depth + 1);
  const nextProps = { ...(node.props || {}), children: nextChildren };

  if (typeof nextProps.accessibilityLabel === "string") {
    nextProps.accessibilityLabel = exactHelpLabel(nextProps.accessibilityLabel);
  }
  if (typeof nextProps.label === "string") {
    nextProps.label = exactHelpLabel(nextProps.label);
  }

  return React.cloneElement(node, nextProps);
}

function transformTabItem(node, kind) {
  const isHi = /बॉट|टूल्स|ट्रेड|अधिक|खाता/.test(textFromNode(node));
  const common = {
    "🧾": "📈",
    "🤖": "🏠",
    "🧰": "⚙️",
    "⚙️": "🧩",
  };

  if (kind === "bot") {
    return replaceNodeText(node, {
      ...common,
      Bot: "Home",
      "बॉट": "होम",
    });
  }
  if (kind === "tools") {
    return replaceNodeText(node, {
      ...common,
      Tools: "Settings",
      "टूल्स": "सेटिंग्स",
    });
  }
  if (kind === "trade") {
    return replaceNodeText(node, common);
  }
  if (kind === "more") {
    return replaceNodeText(node, { "⚙️": "🧩" });
  }
  if (kind === "account") {
    return replaceNodeText(node, isHi ? { Account: "खाता" } : {});
  }
  return node;
}

function styleObject(style) {
  try {
    return ReactNative.StyleSheet?.flatten
      ? ReactNative.StyleSheet.flatten(style) || {}
      : style || {};
  } catch (_) {
    return style || {};
  }
}

function isBottomNavigation(type, props, children) {
  if (type !== ReactNative.View && componentName(type).toLowerCase() !== "view") {
    return false;
  }
  const style = styleObject(props?.style);
  if (style.position !== "absolute" || Number(style.bottom) !== 0) return false;

  const flat = flattenChildren(children);
  const kinds = new Set(flat.map(tabKind));
  return (
    kinds.has("old-home") &&
    kinds.has("bot") &&
    kinds.has("trade") &&
    kinds.has("tools") &&
    kinds.has("account")
  );
}

function transformedBottomNavigation(children) {
  const flat = flattenChildren(children);
  const byKind = {};
  flat.forEach((item) => {
    const kind = tabKind(item);
    if (!byKind[kind]) byKind[kind] = item;
  });

  return ["bot", "trade", "tools", "more", "account"]
    .map((kind) => (byKind[kind] ? transformTabItem(byKind[kind], kind) : null))
    .filter(Boolean);
}

function isGuideComponent(type) {
  const name = componentName(type).toLowerCase();
  return name === "guidetab" || name === "guidepage" || name === "guidescreen";
}

function transformProps(type, props) {
  if (!props || typeof props !== "object") return props;
  let changed = false;
  const next = { ...props };

  if (typeof next.label === "string") {
    const mapped = exactHelpLabel(next.label);
    if (mapped !== next.label) {
      next.label = mapped;
      changed = true;
    }
  }
  if (typeof next.title === "string") {
    const mapped = exactHelpLabel(next.title);
    if (mapped !== next.title) {
      next.title = mapped;
      changed = true;
    }
  }
  if (typeof next.accessibilityLabel === "string") {
    const mapped = exactHelpLabel(next.accessibilityLabel);
    if (mapped !== next.accessibilityLabel) {
      next.accessibilityLabel = mapped;
      changed = true;
    }
  }
  if (type === ReactNative.Text && typeof next.children === "string") {
    const mapped = exactHelpLabel(next.children);
    if (mapped !== next.children) {
      next.children = mapped;
      changed = true;
    }
  }

  return changed ? next : props;
}

function patchHooks() {
  if (React.__OKAI_HOME_HOOKS_PATCHED__) return;

  const baseUseState = React.useState.bind(React);
  const baseUseRef = React.useRef.bind(React);

  React.useState = function okaiHomeUseState(initialValue) {
    if (initialValue !== "home") return baseUseState(initialValue);

    const pair = baseUseState("bot");
    const value = pair[0];
    const setValue = pair[1];
    const mappedSetter = (nextValue) => {
      setValue((current) => {
        const resolved = typeof nextValue === "function"
          ? nextValue(current)
          : nextValue;
        return mapHomeRoute(resolved);
      });
    };
    return [mapHomeRoute(value), mappedSetter];
  };

  React.useRef = function okaiHomeUseRef(initialValue) {
    if (
      Array.isArray(initialValue) &&
      initialValue.length === 1 &&
      initialValue[0] === "home"
    ) {
      return baseUseRef(["bot"]);
    }
    return baseUseRef(initialValue);
  };

  React.__OKAI_HOME_HOOKS_PATCHED__ = true;
}

function patchAutomaticRuntime(runtime, baseCreateElement) {
  if (!runtime || typeof runtime !== "object") return;

  for (const functionName of ["jsx", "jsxs", "jsxDEV"]) {
    const original = runtime?.[functionName];
    if (typeof original !== "function" || original.__OKAI_NAV_HELP_PATCHED__) continue;

    const wrapped = function okaiNavigationAwareJsx(type, props, ...rest) {
      if (!transforming && isGuideComponent(type)) {
        return original(HelpScreen, props || {}, ...rest);
      }

      let nextProps = transformProps(type, props || {});
      const children = nextProps?.children;
      if (!transforming && isBottomNavigation(type, nextProps, children)) {
        transforming = true;
        try {
          nextProps = {
            ...(nextProps || {}),
            children: transformedBottomNavigation(children),
          };
        } finally {
          transforming = false;
        }
      }

      return original(type, nextProps, ...rest);
    };
    wrapped.__OKAI_NAV_HELP_PATCHED__ = true;
    runtime[functionName] = wrapped;
  }
}

function installNavigationHelpEnhancement() {
  if (installed) return;
  installed = true;

  patchHooks();

  const baseCreateElement = React.createElement.bind(React);
  React.createElement = function okaiNavigationAwareCreateElement(
    type,
    props,
    ...children
  ) {
    if (!transforming && isGuideComponent(type)) {
      return baseCreateElement(HelpScreen, props || {});
    }

    let nextProps = transformProps(type, props || {});
    let nextChildren = children;

    if (!transforming && isBottomNavigation(type, nextProps, children)) {
      transforming = true;
      try {
        nextChildren = transformedBottomNavigation(children);
      } finally {
        transforming = false;
      }
    } else if (
      type === ReactNative.Text &&
      children.length === 1 &&
      typeof children[0] === "string"
    ) {
      nextChildren = [exactHelpLabel(children[0])];
    }

    return baseCreateElement(type, nextProps, ...nextChildren);
  };

  patchAutomaticRuntime(automaticJsxRuntime, baseCreateElement);
  patchAutomaticRuntime(automaticJsxDevRuntime, baseCreateElement);
}

module.exports = {
  installNavigationHelpEnhancement,
  exactHelpLabel,
  mapHomeRoute,
  transformedBottomNavigation,
};
