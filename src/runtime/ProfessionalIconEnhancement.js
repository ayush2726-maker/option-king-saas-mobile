const React = require("react");
const ReactNative = require("react-native");

let IconPack = {};
try { IconPack = require("@expo/vector-icons"); } catch (_) {}

let themeApi = {};
try { themeApi = require("./AppThemeEnhancement"); } catch (_) {}

let jsxRuntime = null;
let jsxDevRuntime = null;
try { jsxRuntime = require("react/jsx-runtime"); } catch (_) {}
try { jsxDevRuntime = require("react/jsx-dev-runtime"); } catch (_) {}

const Ionicons = IconPack.Ionicons;
const MaterialCommunityIcons = IconPack.MaterialCommunityIcons;
const MaterialIcons = IconPack.MaterialIcons;

let installed = false;

const ICONS = {
  "🙈": ["Ionicons", "eye-off-outline"],
  "🎁": ["Ionicons", "gift-outline"],
  "⏰": ["Ionicons", "time-outline"],
  "💰": ["Ionicons", "cash-outline"],
  "🚪": ["Ionicons", "exit-outline"],
  "⚡": ["Ionicons", "flash-outline"],
  "🕐": ["Ionicons", "time-outline"],

  "👑": ["Ionicons", "diamond-outline"],
  "💎": ["Ionicons", "diamond-outline"],
  "🏠": ["Ionicons", "home-outline"],
  "📈": ["Ionicons", "trending-up-outline"],
  "📉": ["Ionicons", "trending-down-outline"],
  "⚙️": ["Ionicons", "settings-outline"],
  "⚙": ["Ionicons", "settings-outline"],
  "🧩": ["Ionicons", "apps-outline"],
  "👤": ["Ionicons", "person-outline"],
  "❓": ["Ionicons", "help-circle-outline"],
  "🔔": ["Ionicons", "notifications-outline"],
  "📣": ["Ionicons", "notifications-outline"],
  "🔗": ["Ionicons", "link-outline"],
  "🧠": ["MaterialCommunityIcons", "brain"],
  "🧬": ["MaterialCommunityIcons", "dna"],
  "🧪": ["MaterialCommunityIcons", "test-tube"],
  "💼": ["Ionicons", "briefcase-outline"],
  "📊": ["Ionicons", "bar-chart-outline"],
  "📅": ["Ionicons", "calendar-outline"],
  "📆": ["Ionicons", "calendar-outline"],
  "💹": ["Ionicons", "analytics-outline"],
  "🎯": ["Ionicons", "locate-outline"],
  "🤖": ["Ionicons", "hardware-chip-outline"],
  "▶️": ["Ionicons", "play-circle-outline"],
  "▶": ["Ionicons", "play-circle-outline"],
  "⏹️": ["Ionicons", "stop-circle-outline"],
  "⏹": ["Ionicons", "stop-circle-outline"],
  "🔄": ["Ionicons", "refresh-outline"],
  "💾": ["Ionicons", "save-outline"],
  "🧾": ["Ionicons", "document-text-outline"],
  "📜": ["Ionicons", "receipt-outline"],
  "🚨": ["Ionicons", "warning-outline"],
  "⚠️": ["Ionicons", "warning-outline"],
  "⚠": ["Ionicons", "warning-outline"],
  "✅": ["Ionicons", "checkmark-circle-outline"],
  "❌": ["Ionicons", "close-circle-outline"],
  "🧰": ["Ionicons", "construct-outline"],
  "🛠️": ["Ionicons", "construct-outline"],
  "📡": ["Ionicons", "radio-outline"],
  "💻": ["Ionicons", "desktop-outline"],
  "🛡️": ["Ionicons", "shield-checkmark-outline"],
  "🛡": ["Ionicons", "shield-checkmark-outline"],
  "🔍": ["Ionicons", "search-outline"],
  "🔎": ["Ionicons", "search-outline"],
  "☀️": ["Ionicons", "sunny-outline"],
  "🌑": ["Ionicons", "moon-outline"],
  "🌊": ["Ionicons", "water-outline"],
  "💚": ["Ionicons", "leaf-outline"],
  "🎨": ["Ionicons", "color-palette-outline"],
  "🔑": ["Ionicons", "key-outline"],
  "👁️": ["Ionicons", "eye-outline"],
  "👁": ["Ionicons", "eye-outline"],
  "🚀": ["Ionicons", "rocket-outline"],
  "🅰️": ["MaterialIcons", "app-registration"],
  "🅰": ["MaterialIcons", "app-registration"],
  "📝": ["Ionicons", "create-outline"],
  "🏦": ["Ionicons", "business-outline"],
  "🔐": ["Ionicons", "lock-closed-outline"],
  "📍": ["Ionicons", "pin-outline"],
  "📌": ["Ionicons", "pin-outline"],
  "🔴": ["Ionicons", "ellipse-outline"],
  "🇮🇳": ["Ionicons", "language-outline"],
  "🇬🇧": ["Ionicons", "language-outline"],
};

const EMOJI_RE = /^(🙈|🎁|⏰|💰|🚪|⚡|🕐|👑|💎|🏠|📈|📉|⚙️|⚙|🧩|👤|❓|🔔|📣|🔗|🧠|🧬|🧪|💼|📊|📅|📆|💹|🎯|🤖|▶️|▶|⏹️|⏹|🔄|💾|🧾|📜|🚨|⚠️|⚠|✅|❌|🧰|🛠️|📡|💻|🛡️|🛡|🔍|🔎|☀️|🌑|🌊|💚|🎨|🔑|👁️|👁|🚀|🅰️|🅰|📝|🏦|🔐|📍|📌|🔴|🇮🇳|🇬🇧)\s*/;

function getTheme() {
  try { return themeApi.getAppTheme ? themeApi.getAppTheme() : "midnight"; } catch (_) {}
  return "midnight";
}

function defaultIconColor() {
  return getTheme() === "light" ? "#111827" : "#f4f4fb";
}

function cleanDarkColor(color) {
  const c = String(color || "").toLowerCase();
  const theme = getTheme();

  if (theme !== "light" && (!c || c === "#111827" || c === "#000" || c === "#000000" || c === "black")) {
    return "#f4f4fb";
  }

  if (theme === "light" && (!c || c === "#fff" || c === "#ffffff" || c === "white")) {
    return "#111827";
  }

  return color || defaultIconColor();
}

function getIconComponent(family) {
  if (family === "MaterialCommunityIcons") return MaterialCommunityIcons || Ionicons || MaterialIcons;
  if (family === "MaterialIcons") return MaterialIcons || Ionicons || MaterialCommunityIcons;
  return Ionicons || MaterialCommunityIcons || MaterialIcons;
}

function flat(style) {
  try { return ReactNative.StyleSheet.flatten(style) || {}; } catch (_) {}
  return {};
}

function splitLeadingIcon(text) {
  const raw = String(text || "");
  const match = raw.match(EMOJI_RE);
  if (!match) return null;

  const emoji = match[1];
  const spec = ICONS[emoji];
  if (!spec) return null;

  return {
    emoji,
    family: spec[0],
    name: spec[1],
    text: raw.replace(EMOJI_RE, ""),
  };
}

function removeKnownEmoji(text) {
  return String(text || "").replace(EMOJI_RE, "");
}

function onlyText(children) {
  if (typeof children === "string") return children;
  if (Array.isArray(children) && children.length === 1 && typeof children[0] === "string") return children[0];
  return null;
}

function ProfessionalIconText({ originalProps, iconData }) {
  const base = flat(originalProps?.style);
  const color = cleanDarkColor(base.color || defaultIconColor());
  const fontSize = Number(base.fontSize || 16);
  const iconSize = Math.max(18, Math.min(30, fontSize + 3));
  const Icon = getIconComponent(iconData.family);
  const text = removeKnownEmoji(iconData.text || "");

  const textStyle = {
    ...base,
    color,
    opacity: 1,
  };

  if (!Icon) {
    return React.createElement(
      ReactNative.Text,
      { ...(originalProps || {}), style: textStyle },
      text
    );
  }

  if (!text.trim()) {
    return React.createElement(Icon, {
      name: iconData.name,
      size: iconSize,
      color,
      style: { opacity: 1 },
    });
  }

  return React.createElement(
    ReactNative.View,
    {
      style: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
      },
    },
    React.createElement(Icon, {
      name: iconData.name,
      size: iconSize,
      color,
      style: { marginRight: 7, opacity: 1 },
    }),
    React.createElement(
      ReactNative.Text,
      { ...(originalProps || {}), style: textStyle },
      text
    )
  );
}

function transform(previous, type, props, reactKey, rest) {
  const isText =
    type === ReactNative.Text ||
    String(type?.displayName || type?.name || "").toLowerCase() === "text";

  if (isText && props) {
    const txt = onlyText(props.children);
    const iconData = txt ? splitLeadingIcon(txt) : null;
    if (iconData) {
      return previous(
        ProfessionalIconText,
        { originalProps: props, iconData },
        reactKey,
        ...(rest || [])
      );
    }
  }

  return previous(type, props, reactKey, ...(rest || []));
}

function patchRuntime(runtime) {
  if (!runtime || typeof runtime !== "object") return;

  for (const key of ["jsx", "jsxs", "jsxDEV"]) {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__OKAI_PRO_ICONS_V2__) continue;

    const wrapped = function(type, props, reactKey, ...rest) {
      return transform(previous, type, props || {}, reactKey, rest);
    };

    wrapped.__OKAI_PRO_ICONS_V2__ = true;
    runtime[key] = wrapped;
  }
}

function installProfessionalIconEnhancement() {
  if (installed || React.__OKAI_PROFESSIONAL_ICONS_V2__) return;
  installed = true;

  const oldCreateElement = React.createElement.bind(React);
  React.createElement = function(type, props, ...children) {
    const nextProps = children.length
      ? { ...(props || {}), children: children.length === 1 ? children[0] : children }
      : props || {};

    const isText =
      type === ReactNative.Text ||
      String(type?.displayName || type?.name || "").toLowerCase() === "text";

    const txt = isText ? onlyText(nextProps.children) : null;
    const iconData = txt ? splitLeadingIcon(txt) : null;

    if (iconData) {
      return oldCreateElement(ProfessionalIconText, {
        originalProps: nextProps,
        iconData,
      });
    }

    return oldCreateElement(type, props, ...children);
  };

  patchRuntime(jsxRuntime);
  patchRuntime(jsxDevRuntime);

  React.__OKAI_PROFESSIONAL_ICONS__ = true;
  React.__OKAI_PROFESSIONAL_ICONS_V2__ = true;
}

module.exports = { installProfessionalIconEnhancement };
