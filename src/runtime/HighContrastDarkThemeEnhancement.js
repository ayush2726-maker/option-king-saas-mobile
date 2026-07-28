const React = require("react");
const ReactNative = require("react-native");

let jsxRuntime = null;
let jsxDevRuntime = null;
try { jsxRuntime = require("react/jsx-runtime"); } catch (_) {}
try { jsxDevRuntime = require("react/jsx-dev-runtime"); } catch (_) {}

let installed = false;

const LOW_CONTRAST = {
  "#606080": "#c7c7dd",
  "#70708e": "#c7c7dd",
  "#737391": "#c7c7dd",
  "#777d98": "#c7c7dd",
  "#80809f": "#d4d4ea",
  "#9090ad": "#d4d4ea",
  "#a0a0c0": "#e2e2f2",
  "#7c6deb": "#c9c3ff",
  "#8b7cf6": "#d8d2ff",
  "#b06deb": "#e0c6ff",
};

function normalizeColor(value) {
  if (typeof value !== "string") return value;
  const key = value.trim().toLowerCase();
  return LOW_CONTRAST[key] || value;
}

function normalizeStyle(style) {
  if (!style) return style;

  if (Array.isArray(style)) {
    return style.map(normalizeStyle);
  }

  if (typeof style !== "object") return style;

  const next = { ...style };

  if (next.color) next.color = normalizeColor(next.color);
  if (next.placeholderTextColor) next.placeholderTextColor = normalizeColor(next.placeholderTextColor);

  // Dark theme me low opacity text/readable card borders ko readable rakho.
  if (next.opacity != null && Number(next.opacity) < 0.72) {
    next.opacity = 0.86;
  }

  return next;
}

function improveProps(type, props) {
  if (!props || typeof props !== "object") return props;

  const name = String(type?.displayName || type?.name || "").toLowerCase();
  const isText =
    type === ReactNative.Text ||
    name === "text";

  const next = { ...props };

  if (next.style) {
    next.style = normalizeStyle(next.style);
  }

  if (typeof next.placeholderTextColor === "string") {
    next.placeholderTextColor = normalizeColor(next.placeholderTextColor);
  }

  // TextInput placeholder aur typed text ko dark bg par readable karo.
  if (type === ReactNative.TextInput || name === "textinput") {
    next.placeholderTextColor = "#9f9fbd";
    next.style = [
      next.style,
      { color: "#f4f4fb" },
    ];
  }

  // Login/Register/forgot links jaise clickable text ko ज्यादा clear करो.
  if (isText) {
    const txt = String(next.children || "");
    if (
      /register|account|forgot|login id|password|log in|sign in/i.test(txt) ||
      /रजिस्टर|खाता|पासवर्ड|लॉगिन|आईडी/i.test(txt)
    ) {
      next.style = [
        next.style,
        { color: "#ffffff" },
      ];
    }
  }

  return next;
}

function patchRuntime(runtime) {
  if (!runtime || typeof runtime !== "object") return;

  for (const fn of ["jsx", "jsxs", "jsxDEV"]) {
    const old = runtime[fn];
    if (typeof old !== "function" || old.__OKAI_HIGH_CONTRAST__) continue;

    const wrapped = function(type, props, ...rest) {
      return old(type, improveProps(type, props), ...rest);
    };

    wrapped.__OKAI_HIGH_CONTRAST__ = true;
    runtime[fn] = wrapped;
  }
}

function installHighContrastDarkThemeEnhancement() {
  if (installed || React.__OKAI_HIGH_CONTRAST_DARK_THEME__) return;
  installed = true;

  const oldCreateElement = React.createElement.bind(React);
  React.createElement = function(type, props, ...children) {
    const nextProps = improveProps(type, {
      ...(props || {}),
      ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}),
    });

    const finalChildren = children.length
      ? children
      : nextProps?.children != null
      ? [nextProps.children]
      : [];

    if (nextProps && Object.prototype.hasOwnProperty.call(nextProps, "children")) {
      delete nextProps.children;
    }

    return oldCreateElement(type, nextProps, ...finalChildren);
  };

  patchRuntime(jsxRuntime);
  patchRuntime(jsxDevRuntime);

  React.__OKAI_HIGH_CONTRAST_DARK_THEME__ = true;
}

module.exports = { installHighContrastDarkThemeEnhancement };
