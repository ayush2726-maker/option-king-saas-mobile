const React = require("react");
const ReactNative = require("react-native");

let appTheme = null;
try { appTheme = require("./AppThemeEnhancement"); } catch (_) {}

let jsxRuntime = null;
let jsxDevRuntime = null;
try { jsxRuntime = require("react/jsx-runtime"); } catch (_) {}
try { jsxDevRuntime = require("react/jsx-dev-runtime"); } catch (_) {}

let installed = false;

const DARK_LOW_CONTRAST = {
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

const LIGHT_LOW_CONTRAST = {
  "#ffffff": "#0f172a",
  "#f4f4fb": "#0f172a",
  "#eeeeff": "#0f172a",
  "#e8e8f0": "#0f172a",
  "#e2e2f2": "#1e293b",
  "#ddddf2": "#334155",
  "#d4d4ea": "#334155",
  "#c9c9df": "#475569",
  "#c7c7dd": "#475569",
  "#c7bdff": "#4c1d95",
  "#d8d2ff": "#4c1d95",
  "#e0c6ff": "#581c87",
  "#606080": "#475569",
  "#70708e": "#475569",
  "#737391": "#475569",
  "#777d98": "#475569",
  "#80809f": "#334155",
  "#9090ad": "#334155",
  "#a0a0c0": "#1e293b",
  "#7c6deb": "#5b21b6",
  "#8b7cf6": "#5b21b6",
  "#b06deb": "#7e22ce",
};

function currentTheme() {
  try {
    return appTheme?.getAppTheme?.() || "midnight";
  } catch (_) {
    return "midnight";
  }
}

function isLightTheme() {
  return currentTheme() === "light";
}

function baseHex(value) {
  if (typeof value !== "string") return "";
  const key = value.trim().toLowerCase();
  if (key.length === 9 && key.startsWith("#")) return key.slice(0, 7);
  return key;
}

function normalizeColor(value, role = "color") {
  if (typeof value !== "string") return value;
  const key = value.trim().toLowerCase();
  const base = baseHex(key);
  const table = isLightTheme() ? LIGHT_LOW_CONTRAST : DARK_LOW_CONTRAST;
  const mapped = table[base] || table[key];
  if (!mapped) return value;

  // Text on light theme must not keep old alpha; old alpha made many labels unreadable.
  if (isLightTheme() && (role === "color" || role === "placeholderTextColor")) {
    return mapped;
  }

  if (key.length === 9 && key.startsWith("#") && role !== "color") {
    return mapped + key.slice(7);
  }
  return mapped;
}

function normalizeStyle(style, roleHint = "style") {
  if (!style) return style;

  if (Array.isArray(style)) {
    return style.map((item) => normalizeStyle(item, roleHint));
  }

  if (typeof style !== "object") return style;

  const next = { ...style };

  for (const key of [
    "color",
    "backgroundColor",
    "borderColor",
    "borderTopColor",
    "borderBottomColor",
    "borderLeftColor",
    "borderRightColor",
    "shadowColor",
    "placeholderTextColor",
  ]) {
    if (next[key]) next[key] = normalizeColor(next[key], key);
  }

  if (next.opacity != null && Number(next.opacity) < 0.82) {
    next.opacity = isLightTheme() ? 1 : 0.88;
  }

  return next;
}

function improveProps(type, props) {
  if (!props || typeof props !== "object") return props;

  const name = String(type?.displayName || type?.name || "").toLowerCase();
  const isText = type === ReactNative.Text || name === "text";
  const isInput = type === ReactNative.TextInput || name === "textinput";

  const next = { ...props };

  if (next.style) {
    next.style = normalizeStyle(next.style);
  }

  if (typeof next.placeholderTextColor === "string") {
    next.placeholderTextColor = normalizeColor(next.placeholderTextColor, "placeholderTextColor");
  }

  if (isInput) {
    next.placeholderTextColor = isLightTheme() ? "#475569" : "#aaaad0";
    next.style = [
      next.style,
      { color: isLightTheme() ? "#0f172a" : "#ffffff" },
    ];
  }

  if (isText) {
    const txt = String(next.children || "");
    const boostLink = (
      /register|account|forgot|login id|password|log in|sign in|open|active|use/i.test(txt) ||
      /रजिस्टर|खाता|पासवर्ड|लॉगिन|आईडी|खोलें/i.test(txt)
    );

    if (boostLink) {
      next.style = [
        next.style,
        { color: isLightTheme() ? "#0f172a" : "#ffffff", opacity: 1 },
      ];
    } else if (isLightTheme()) {
      next.style = [next.style, { opacity: 1 }];
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
