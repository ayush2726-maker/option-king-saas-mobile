const React = require("react");
const ReactNative = require("react-native");

let jsxRuntime = null;
let jsxDevRuntime = null;
try { jsxRuntime = require("react/jsx-runtime"); } catch (_) {}
try { jsxDevRuntime = require("react/jsx-dev-runtime"); } catch (_) {}

let installed = false;
let transforming = false;

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function flatten(node, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) {
    node.forEach(x => flatten(x, out));
    return out;
  }
  out.push(node);
  return out;
}

function textFromNode(node, depth = 0) {
  if (depth > 10 || node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(x => textFromNode(x, depth + 1)).join(" ");
  if (React.isValidElement(node)) {
    return [
      textFromNode(node.props?.children, depth + 1),
      textFromNode(node.props?.label, depth + 1),
      textFromNode(node.props?.title, depth + 1),
    ].filter(Boolean).join(" ");
  }
  return "";
}

function styleObject(style) {
  try {
    return ReactNative.StyleSheet?.flatten(style) || {};
  } catch (_) {
    return {};
  }
}

function stripFloatingStyle(props, childrenText) {
  const text = String(childrenText || "");
  if (!/TODAY NET P&L|Today Net P&L|Net P&L|आज/.test(text)) return props;

  const flat = styleObject(props?.style);
  if (flat.position !== "absolute" && flat.position !== "sticky") return props;

  const nextStyle = {
    ...flat,
    position: "relative",
    top: undefined,
    left: undefined,
    right: undefined,
    bottom: undefined,
    zIndex: undefined,
  };

  return {
    ...(props || {}),
    style: nextStyle,
  };
}

function looksLikeHomeScroll(children) {
  const text = textFromNode(children);
  return (
    /Start Bot|Bot Start|Bot Start Karo|Stop Bot|Bot Stop|Refresh Status|Status Refresh/.test(text) &&
    /TODAY NET P&L|Today Net P&L|Net P&L|Active Positions|ACTIVE POSITIONS/.test(text)
  );
}

function isControlNode(node) {
  const text = textFromNode(node);
  return (
    /Start Bot|Bot Start|Bot Start Karo|Stop Bot|Bot Stop|Refresh Status|Status Refresh/.test(text) &&
    !/Graph History|Score History|Price Movement/.test(text)
  );
}

function isSharedAiNode(node) {
  const text = textFromNode(node);
  return /Shared AI Decision/i.test(text);
}

function rearrangeHomeChildren(children) {
  const items = flatten(children);
  if (!looksLikeHomeScroll(items)) return children;

  const controls = [];
  const rest = [];

  for (const item of items) {
    if (isSharedAiNode(item)) continue;
    if (isControlNode(item)) controls.push(item);
    else rest.push(item);
  }

  if (!controls.length) return rest;

  // Requested Home order: Start/Stop first, Refresh next, then every dashboard card.
  return [...controls, ...rest];
}

function transformElement(type, props, children) {
  if (transforming) return { type, props, children };

  const text = textFromNode(children);
  let nextProps = stripFloatingStyle(props || {}, text);
  let nextChildren = children;

  const name = componentName(type).toLowerCase();
  const isScroll = type === ReactNative.ScrollView || name === "scrollview";

  if (isScroll && looksLikeHomeScroll(children)) {
    transforming = true;
    try {
      nextChildren = rearrangeHomeChildren(children);
      nextProps = {
        ...nextProps,
        stickyHeaderIndices: undefined,
      };
    } finally {
      transforming = false;
    }
  }

  return { type, props: nextProps, children: nextChildren };
}

function patchRuntime(runtime) {
  if (!runtime || typeof runtime !== "object") return;

  for (const fn of ["jsx", "jsxs", "jsxDEV"]) {
    const original = runtime[fn];
    if (typeof original !== "function" || original.__OKAI_HOME_LAYOUT_PATCHED__) continue;

    const wrapped = function(type, props, ...rest) {
      const result = transformElement(type, props || {}, props?.children);
      return original(
        result.type,
        { ...(result.props || {}), children: result.children },
        ...rest
      );
    };

    wrapped.__OKAI_HOME_LAYOUT_PATCHED__ = true;
    runtime[fn] = wrapped;
  }
}

function installHomeLayoutEnhancement() {
  if (installed) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);

  React.createElement = function(type, props, ...children) {
    const result = transformElement(type, props || {}, children);
    const nextChildren = Array.isArray(result.children)
      ? result.children
      : [result.children];

    return previousCreateElement(result.type, result.props, ...nextChildren);
  };

  patchRuntime(jsxRuntime);
  patchRuntime(jsxDevRuntime);
}

module.exports = { installHomeLayoutEnhancement };
