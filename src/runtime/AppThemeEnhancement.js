const React = require("react");
const ReactNative = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;

let jsxRuntime = null;
let jsxDevRuntime = null;
try { jsxRuntime = require("react/jsx-runtime"); } catch (_) {}
try { jsxDevRuntime = require("react/jsx-dev-runtime"); } catch (_) {}

const STORAGE_KEY = "okai_app_theme_v1";
let installed = false;
let currentTheme = "midnight";
const listeners = new Set();

const THEMES = {
  midnight: {
    label: "Midnight Black",
    icon: "🌑",
    map: {
      "#0a0a0f": "#0a0a0f",
      "#0f0f1a": "#11111d",
      "#10121d": "#11131f",
      "#13131f": "#161625",
      "#1a1a2e": "#1b1b31",
      "#252540": "#38385a",
      "#606080": "#c9c9df",
      "#70708e": "#c9c9df",
      "#80809f": "#ddddf2",
      "#a0a0c0": "#eeeeff",
      "#7c6deb": "#c7bdff",
      "#b06deb": "#e2c5ff",
    },
  },
  royal: {
    label: "Royal Purple",
    icon: "👑",
    map: {
      "#0a0a0f": "#0b0617",
      "#0f0f1a": "#120b22",
      "#10121d": "#151026",
      "#13131f": "#19102b",
      "#1a1a2e": "#22153a",
      "#252540": "#4b357c",
      "#606080": "#d6ccf4",
      "#70708e": "#d6ccf4",
      "#80809f": "#eee7ff",
      "#a0a0c0": "#f5f0ff",
      "#4d9fff": "#9ec7ff",
      "#7c6deb": "#c7a8ff",
      "#b06deb": "#e7c7ff",
    },
  },
  ocean: {
    label: "Ocean Blue",
    icon: "🌊",
    map: {
      "#0a0a0f": "#041018",
      "#0f0f1a": "#081824",
      "#10121d": "#0b1d2a",
      "#13131f": "#0e2433",
      "#1a1a2e": "#123048",
      "#252540": "#23506f",
      "#606080": "#c7dcec",
      "#70708e": "#c7dcec",
      "#80809f": "#e3f3ff",
      "#a0a0c0": "#eff9ff",
      "#4d9fff": "#65d4ff",
      "#7c6deb": "#8ab4ff",
      "#b06deb": "#b8d8ff",
    },
  },
  emerald: {
    label: "Emerald",
    icon: "💚",
    map: {
      "#0a0a0f": "#04130f",
      "#0f0f1a": "#082019",
      "#10121d": "#0a241c",
      "#13131f": "#0d2a20",
      "#1a1a2e": "#103627",
      "#252540": "#246b50",
      "#606080": "#c7e9dc",
      "#70708e": "#c7e9dc",
      "#80809f": "#e6fff5",
      "#a0a0c0": "#f0fff8",
      "#00d4a0": "#21e6a9",
      "#4d9fff": "#7cd7ff",
      "#7c6deb": "#6ee7b7",
      "#b06deb": "#9af5cf",
    },
  },
  light: {
    label: "Light",
    icon: "☀️",
    map: {
      "#0a0a0f": "#f6f7ff",
      "#0f0f1a": "#eef1ff",
      "#10121d": "#eef1ff",
      "#13131f": "#ffffff",
      "#1a1a2e": "#f3f5ff",
      "#252540": "#d6d9ee",
      "#e8e8f0": "#111827",
      "#606080": "#4b5563",
      "#70708e": "#4b5563",
      "#80809f": "#374151",
      "#a0a0c0": "#1f2937",
      "#4d9fff": "#2563eb",
      "#7c6deb": "#6d28d9",
      "#b06deb": "#7e22ce",
    },
  },
};

function baseTheme() {
  return THEMES[currentTheme] ? currentTheme : "midnight";
}

function palette() {
  return THEMES[baseTheme()];
}

async function loadTheme() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && THEMES[saved]) {
      currentTheme = saved;
      listeners.forEach((fn) => fn(currentTheme));
    }
  } catch (_) {}
}

function getAppTheme() {
  return baseTheme();
}

async function setAppTheme(theme) {
  if (!THEMES[theme]) return;
  currentTheme = theme;
  try { await AsyncStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  listeners.forEach((fn) => fn(currentTheme));
}

function subscribeTheme(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function mapColor(value) {
  if (typeof value !== "string") return value;
  const raw = value.trim();
  const lower = raw.toLowerCase();

  if (lower.length === 9 && lower.startsWith("#")) {
    const base = lower.slice(0, 7);
    const alpha = lower.slice(7);
    const mapped = palette().map[base];
    return mapped ? mapped + alpha : value;
  }

  return palette().map[lower] || value;
}

function mapStyle(style) {
  if (!style) return style;
  if (Array.isArray(style)) return style.map(mapStyle);
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
    if (next[key]) next[key] = mapColor(next[key]);
  }

  if (next.opacity != null && Number(next.opacity) < 0.72) {
    next.opacity = 0.88;
  }

  return next;
}

function improveProps(type, props) {
  if (!props || typeof props !== "object") return props;

  const next = { ...props };
  if (next.style) next.style = mapStyle(next.style);
  if (typeof next.placeholderTextColor === "string") {
    next.placeholderTextColor = mapColor(next.placeholderTextColor);
  }

  const name = String(type?.displayName || type?.name || "").toLowerCase();

  if (type === ReactNative.TextInput || name === "textinput") {
    next.placeholderTextColor = currentTheme === "light" ? "#6b7280" : "#aaaad0";
    next.style = [
      next.style,
      { color: currentTheme === "light" ? "#111827" : "#ffffff" },
    ];
  }

  return next;
}

function patchRuntime(runtime) {
  if (!runtime || typeof runtime !== "object") return;

  for (const fn of ["jsx", "jsxs", "jsxDEV"]) {
    const old = runtime[fn];
    if (typeof old !== "function" || old.__OKAI_APP_THEME__) continue;

    const wrapped = function(type, props, ...rest) {
      return old(type, improveProps(type, props), ...rest);
    };

    wrapped.__OKAI_APP_THEME__ = true;
    runtime[fn] = wrapped;
  }
}

function AppThemeRoot({ children }) {
  const [theme, setTheme] = React.useState(getAppTheme());

  React.useEffect(() => {
    loadTheme();
    return subscribeTheme(setTheme);
  }, []);

  const bg = THEMES[theme]?.map?.["#0a0a0f"] || "#0a0a0f";

  return React.createElement(
    ReactNative.View,
    { style: { flex: 1, backgroundColor: bg }, key: theme },
    children
  );
}

function installAppThemeEnhancement() {
  if (installed || React.__OKAI_APP_THEME_PATCHED__) return;
  installed = true;
  loadTheme();

  const oldCreateElement = React.createElement.bind(React);
  React.createElement = function(type, props, ...children) {
    return oldCreateElement(type, improveProps(type, props), ...children);
  };

  patchRuntime(jsxRuntime);
  patchRuntime(jsxDevRuntime);

  React.__OKAI_APP_THEME_PATCHED__ = true;
}

module.exports = {
  THEMES,
  STORAGE_KEY,
  AppThemeRoot,
  getAppTheme,
  setAppTheme,
  subscribeTheme,
  installAppThemeEnhancement,
};