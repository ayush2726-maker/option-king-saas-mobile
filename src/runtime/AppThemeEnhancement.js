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

const LIGHT_TEXT = "#111827";
const LIGHT_SUB = "#374151";
const LIGHT_BG = "#f5f7fb";
const LIGHT_CARD = "#ffffff";
const LIGHT_CARD_2 = "#f1f5f9";
const LIGHT_BORDER = "#111827";
const LIGHT_RED = "#dc2626";
const LIGHT_GREEN = "#16a34a";

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
    label: "Clean Light",
    icon: "☀️",
    map: {
      "#0a0a0f": LIGHT_BG,
      "#0f0f1a": LIGHT_CARD_2,
      "#10121d": LIGHT_CARD_2,
      "#13131f": LIGHT_CARD,
      "#1a1a2e": LIGHT_CARD_2,
      "#252540": LIGHT_BORDER,
      "#e8e8f0": LIGHT_TEXT,
      "#606080": LIGHT_SUB,
      "#70708e": LIGHT_SUB,
      "#737391": LIGHT_SUB,
      "#777d98": LIGHT_SUB,
      "#80809f": LIGHT_SUB,
      "#9090ad": LIGHT_SUB,
      "#a0a0c0": LIGHT_TEXT,
      "#00d4a0": LIGHT_GREEN,
      "#10b981": LIGHT_GREEN,
      "#22c55e": LIGHT_GREEN,
      "#16a34a": LIGHT_GREEN,
      "#ff4d6d": LIGHT_RED,
      "#ef4444": LIGHT_RED,
      "#dc2626": LIGHT_RED,
      "#4d9fff": LIGHT_TEXT,
      "#2563eb": LIGHT_TEXT,
      "#7c6deb": LIGHT_TEXT,
      "#8b7cf6": LIGHT_TEXT,
      "#b06deb": LIGHT_TEXT,
      "#f5c842": LIGHT_TEXT,
      "#f59e0b": LIGHT_TEXT,
    },
  },
};

function baseTheme() {
  return THEMES[currentTheme] ? currentTheme : "midnight";
}

function isLight() {
  return baseTheme() === "light";
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

function splitAlpha(value) {
  const lower = String(value || "").trim().toLowerCase();
  if (lower.length === 9 && lower.startsWith("#")) {
    return { base: lower.slice(0, 7), alpha: lower.slice(7) };
  }
  return { base: lower, alpha: "" };
}

function isRed(base) {
  return ["#ff4d6d", "#ef4444", "#dc2626", "#f87171", "#991b1b"].includes(base);
}

function isGreen(base) {
  return ["#00d4a0", "#10b981", "#22c55e", "#16a34a", "#059669"].includes(base);
}

function isDarkSurface(base) {
  return ["#0a0a0f", "#0f0f1a", "#10121d", "#13131f", "#1a1a2e"].includes(base);
}

function mapLightColor(value, styleKey = "") {
  if (typeof value !== "string") return value;
  const { base, alpha } = splitAlpha(value);
  const key = String(styleKey || "").toLowerCase();

  if (isRed(base)) return LIGHT_RED + alpha;
  if (isGreen(base)) return LIGHT_GREEN + alpha;

  if (key === "backgroundcolor") {
    if (base === "#0a0a0f") return LIGHT_BG;
    if (isDarkSurface(base)) return LIGHT_CARD;
    return alpha ? LIGHT_CARD : (palette().map[base] || LIGHT_CARD);
  }

  if (key.includes("border")) {
    return alpha ? LIGHT_BORDER + alpha : LIGHT_BORDER;
  }

  if (key === "shadowcolor") {
    return alpha ? LIGHT_TEXT + alpha : LIGHT_TEXT;
  }

  if (key === "placeholdertextcolor") {
    return LIGHT_SUB;
  }

  // Light theme rule: visible writing must be only black, red, or green.
  if (key === "color") {
    return LIGHT_TEXT;
  }

  return palette().map[base] || value;
}

function mapColor(value, styleKey = "") {
  if (typeof value !== "string") return value;

  if (isLight()) {
    return mapLightColor(value, styleKey);
  }

  const { base, alpha } = splitAlpha(value);
  const mapped = palette().map[base];
  return mapped ? mapped + alpha : value;
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
    if (next[key]) next[key] = mapColor(next[key], key);
  }

  if (next.opacity != null && Number(next.opacity) < 0.72) {
    next.opacity = isLight() ? 1 : 0.88;
  }

  return next;
}

function improveProps(type, props) {
  if (!props || typeof props !== "object") return props;

  const next = { ...props };
  if (next.style) next.style = mapStyle(next.style);
  if (typeof next.placeholderTextColor === "string") {
    next.placeholderTextColor = mapColor(next.placeholderTextColor, "placeholderTextColor");
  }

  const name = String(type?.displayName || type?.name || "").toLowerCase();

  if (type === ReactNative.TextInput || name === "textinput") {
    next.placeholderTextColor = isLight() ? LIGHT_SUB : "#aaaad0";
    next.style = [
      next.style,
      {
        color: isLight() ? LIGHT_TEXT : "#ffffff",
        backgroundColor: isLight() ? LIGHT_CARD : undefined,
        borderColor: isLight() ? LIGHT_BORDER : undefined,
      },
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
