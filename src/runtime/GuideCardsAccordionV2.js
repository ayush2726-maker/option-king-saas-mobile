const React = require("react");
const ReactNative = require("react-native");

const { Text, TouchableOpacity, View } = ReactNative;

let jsxRuntime = null;
let jsxDevRuntime = null;
try { jsxRuntime = require("react/jsx-runtime"); } catch (_) {}
try { jsxDevRuntime = require("react/jsx-dev-runtime"); } catch (_) {}

let installed = false;
let baseCreateElement = null;
let activeId = "";
const listeners = new Set();

function nodeText(node, depth = 0) {
  if (depth > 12 || node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((item) => nodeText(item, depth + 1)).join(" ");
  if (React.isValidElement(node)) return nodeText(node.props?.children, depth + 1);
  return "";
}

function cleanText(node) {
  return nodeText(node).replace(/\s+/g, " ").trim().toLowerCase();
}

function typeName(type) {
  return String(type?.displayName || type?.name || "").toLowerCase();
}

function metaFor(type, props, children) {
  if (props?.__okaiGuideV2Internal) return null;

  const name = typeName(type);
  const text = cleanText(children ?? props?.children);

  if (name === "upstoxsetupguide") {
    return {
      id: "upstox-guide",
      icon: "🅄",
      colour: "#00d4a0",
      title: "Upstox Setup Guide",
      hint: "Tap to open the complete Upstox setup guide.",
    };
  }

  if (name !== "card") return null;

  const isHindi = /[\u0900-\u097f]/.test(text);
  const appGuide =
    text.includes("simple step-by-step guide to use option king ai") ||
    text.includes("option king ai उपयोग करने की सरल चरण-दर-चरण गाइड") ||
    (text.includes("1. login") && text.includes("8. live mode")) ||
    (text.includes("1. लॉगिन") && text.includes("8. वास्तविक मोड"));

  if (appGuide) {
    return {
      id: "app-guide",
      icon: "📘",
      colour: "#f5c842",
      title: isHindi ? "ऐप गाइड" : "App Guide",
      hint: isHindi
        ? "पूरी चरण-दर-चरण जानकारी देखने के लिए दबाएँ।"
        : "Tap to open the complete step-by-step app guide.",
    };
  }

  const brokerGuide =
    text.includes("full steps from registration to filling in credentials") ||
    text.includes("हर ब्रोकर के लिए रजिस्ट्रेशन से लेकर क्रेडेंशियल्स भरने तक पूरे चरण") ||
    text.includes("broker setup guide") ||
    text.includes("ब्रोकर सेटअप गाइड");

  if (brokerGuide) {
    return {
      id: "broker-guide",
      icon: "🔗",
      colour: "#4d9fff",
      title: isHindi ? "ब्रोकर सेटअप गाइड" : "Broker Setup Guide",
      hint: isHindi
        ? "Angel One, Zerodha और Upstox की जानकारी देखने के लिए दबाएँ।"
        : "Tap to open Angel One, Zerodha, and Upstox setup details.",
    };
  }

  return null;
}

function toggle(id) {
  activeId = activeId === id ? "" : id;
  Array.from(listeners).forEach((listener) => {
    try { listener(activeId); } catch (_) {}
  });
}

function GuideDropdown({ meta, originalType, originalProps, originalChildren }) {
  const [current, setCurrent] = React.useState(activeId);

  React.useEffect(() => {
    listeners.add(setCurrent);
    return () => listeners.delete(setCurrent);
  }, []);

  const open = current === meta.id;
  const safeProps = { ...(originalProps || {}), __okaiGuideV2Internal: true };
  delete safeProps.children;

  return React.createElement(
    View,
    { style: { width: "100%" } },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => toggle(meta.id),
        activeOpacity: 0.82,
        accessibilityRole: "button",
        accessibilityState: { expanded: open },
        style: {
          minHeight: 72,
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: open ? meta.colour : "#252540",
          backgroundColor: "#13131f",
          flexDirection: "row",
          alignItems: "center",
        },
      },
      React.createElement(
        View,
        {
          style: {
            width: 42,
            height: 42,
            borderRadius: 12,
            marginRight: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: meta.colour + "18",
            borderWidth: 1,
            borderColor: meta.colour + "55",
          },
        },
        React.createElement(Text, { style: { fontSize: 21 } }, meta.icon)
      ),
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 8 } },
        React.createElement(Text, {
          style: { color: "#e8e8f0", fontSize: 15, fontWeight: "900" },
        }, meta.title),
        React.createElement(Text, {
          style: { color: "#737391", fontSize: 10, lineHeight: 15, marginTop: 3 },
        }, meta.hint)
      ),
      React.createElement(Text, {
        style: {
          color: meta.colour,
          fontSize: 21,
          fontWeight: "900",
          transform: [{ rotate: open ? "180deg" : "0deg" }],
        },
      }, "⌄")
    ),
    open
      ? React.createElement(
          View,
          { style: { marginTop: 9 } },
          baseCreateElement(
            originalType,
            safeProps,
            ...(Array.isArray(originalChildren) ? originalChildren : [originalChildren])
          )
        )
      : null
  );
}

function transformed(original, type, props, children, rest = []) {
  const meta = metaFor(type, props, children);
  if (!meta) return null;
  return original(GuideDropdown, {
    meta,
    originalType: type,
    originalProps: props || {},
    originalChildren: children,
  }, ...rest);
}

function patchRuntime(runtime) {
  if (!runtime) return;
  ["jsx", "jsxs", "jsxDEV"].forEach((name) => {
    const original = runtime[name];
    if (typeof original !== "function" || original.__OKAI_GUIDE_V2__) return;
    const wrapped = function guideV2Jsx(type, props, ...rest) {
      const result = transformed(original, type, props || {}, props?.children, rest);
      return result || original(type, props, ...rest);
    };
    wrapped.__OKAI_GUIDE_V2__ = true;
    runtime[name] = wrapped;
  });
}

function installGuideCardsAccordionV2() {
  if (installed) return;
  installed = true;
  baseCreateElement = React.createElement.bind(React);

  React.createElement = function guideV2CreateElement(type, props, ...children) {
    const result = transformed(baseCreateElement, type, props || {}, children);
    return result || baseCreateElement(type, props, ...children);
  };

  patchRuntime(jsxRuntime);
  patchRuntime(jsxDevRuntime);
}

module.exports = { installGuideCardsAccordionV2 };
