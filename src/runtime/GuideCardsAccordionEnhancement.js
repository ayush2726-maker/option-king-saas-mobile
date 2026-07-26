const React = require("react");
const ReactNative = require("react-native");

const { Text, TouchableOpacity, View } = ReactNative;

let automaticJsxRuntime = null;
let automaticJsxDevRuntime = null;
try {
  automaticJsxRuntime = require("react/jsx-runtime");
} catch (_) {}
try {
  automaticJsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

let installed = false;
let baseCreateElement = null;
let activeGuideId = "";
const listeners = new Set();

function componentName(type) {
  return String(type?.displayName || type?.name || "").toLowerCase();
}

function textFromNode(node, depth = 0) {
  if (depth > 12 || node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    return node.map((item) => textFromNode(item, depth + 1)).join(" ");
  }
  if (React.isValidElement(node)) {
    return textFromNode(node.props?.children, depth + 1);
  }
  return "";
}

function normalizedText(node) {
  return textFromNode(node).replace(/\s+/g, " ").trim().toLowerCase();
}

function guideMeta(type, props, children) {
  if (props?.__okaiGuideAccordionInternal) return null;

  const name = componentName(type);
  const text = normalizedText(children ?? props?.children);

  if (name === "upstoxsetupguide") {
    return {
      id: "upstox-setup-guide",
      icon: "🅄",
      title: /[\u0900-\u097f]/.test(text) ? "Upstox सेटअप गाइड" : "Upstox Setup Guide",
      subtitle: /[\u0900-\u097f]/.test(text)
        ? "पूरी जानकारी देखने के लिए दबाएँ।"
        : "Tap to view the complete setup steps.",
      colour: "#00d4a0",
    };
  }

  if (name !== "card") return null;

  const isAppGuide =
    text.includes("app guide") ||
    text.includes("ऐप गाइड");

  if (isAppGuide) {
    const hi = text.includes("ऐप गाइड");
    return {
      id: "app-guide",
      icon: "📘",
      title: hi ? "ऐप गाइड" : "App Guide",
      subtitle: hi
        ? "जिस चरण की जानकारी चाहिए, उसे देखने के लिए खोलें।"
        : "Open only when you need the step-by-step instructions.",
      colour: "#f5c842",
    };
  }

  const isBrokerGuide =
    text.includes("broker setup guide") ||
    text.includes("ब्रोकर सेटअप गाइड");

  if (isBrokerGuide) {
    const hi = text.includes("ब्रोकर सेटअप गाइड");
    return {
      id: "broker-setup-guide",
      icon: "🔗",
      title: hi ? "ब्रोकर सेटअप गाइड" : "Broker Setup Guide",
      subtitle: hi
        ? "Angel One, Zerodha और Upstox की पूरी प्रक्रिया देखने के लिए खोलें।"
        : "Open to view the complete Angel One, Zerodha, and Upstox setup.",
      colour: "#4d9fff",
    };
  }

  return null;
}

function setActiveGuide(nextId) {
  activeGuideId = activeGuideId === nextId ? "" : nextId;
  for (const listener of Array.from(listeners)) {
    try {
      listener(activeGuideId);
    } catch (_) {}
  }
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function GuideAccordionCard({
  meta,
  originalType,
  originalProps,
  originalChildren,
}) {
  const [activeId, setActiveId] = React.useState(activeGuideId);

  React.useEffect(() => subscribe(setActiveId), []);

  const expanded = activeId === meta.id;
  const nextProps = {
    ...(originalProps || {}),
    __okaiGuideAccordionInternal: true,
  };
  delete nextProps.children;

  return React.createElement(
    View,
    { style: { width: "100%" } },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => setActiveGuide(meta.id),
        activeOpacity: 0.82,
        accessibilityRole: "button",
        accessibilityLabel: meta.title,
        accessibilityState: { expanded },
        style: {
          minHeight: 76,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: expanded ? meta.colour : "#252540",
          backgroundColor: "#13131f",
          paddingHorizontal: 14,
          paddingVertical: 13,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: expanded ? meta.colour : "#000000",
          shadowOpacity: expanded ? 0.18 : 0.08,
          shadowRadius: 9,
          elevation: expanded ? 6 : 2,
        },
      },
      React.createElement(
        View,
        {
          style: {
            width: 44,
            height: 44,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
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
        React.createElement(
          Text,
          {
            style: {
              color: "#e8e8f0",
              fontSize: 15,
              fontWeight: "900",
            },
          },
          meta.title
        ),
        React.createElement(
          Text,
          {
            style: {
              color: "#737391",
              fontSize: 10,
              lineHeight: 15,
              marginTop: 4,
            },
          },
          meta.subtitle
        )
      ),
      React.createElement(
        Text,
        {
          style: {
            color: meta.colour,
            fontSize: 21,
            fontWeight: "900",
            transform: [{ rotate: expanded ? "180deg" : "0deg" }],
          },
        },
        "⌄"
      )
    ),
    expanded
      ? React.createElement(
          View,
          { style: { marginTop: 9 } },
          baseCreateElement(
            originalType,
            nextProps,
            ...(Array.isArray(originalChildren)
              ? originalChildren
              : [originalChildren])
          )
        )
      : null
  );
}

function accordionElement(original, type, props, children, rest) {
  const meta = guideMeta(type, props, children);
  if (!meta) return null;

  return original(
    GuideAccordionCard,
    {
      meta,
      originalType: type,
      originalProps: props || {},
      originalChildren: children,
    },
    ...(rest || [])
  );
}

function patchAutomaticRuntime(runtime) {
  if (!runtime || typeof runtime !== "object") return;

  for (const functionName of ["jsx", "jsxs", "jsxDEV"]) {
    const original = runtime[functionName];
    if (typeof original !== "function" || original.__OKAI_GUIDE_ACCORDION_PATCHED__) {
      continue;
    }

    const wrapped = function okaiGuideAccordionJsx(type, props, ...rest) {
      const children = props?.children;
      const transformed = accordionElement(
        original,
        type,
        props || {},
        children,
        rest
      );
      if (transformed) return transformed;
      return original(type, props, ...rest);
    };

    wrapped.__OKAI_GUIDE_ACCORDION_PATCHED__ = true;
    runtime[functionName] = wrapped;
  }
}

function installGuideCardsAccordionEnhancement() {
  if (installed) return;
  installed = true;

  baseCreateElement = React.createElement.bind(React);

  React.createElement = function okaiGuideAccordionCreateElement(
    type,
    props,
    ...children
  ) {
    const transformed = accordionElement(
      baseCreateElement,
      type,
      props || {},
      children,
      []
    );
    if (transformed) return transformed;
    return baseCreateElement(type, props, ...children);
  };

  patchAutomaticRuntime(automaticJsxRuntime);
  patchAutomaticRuntime(automaticJsxDevRuntime);
}

module.exports = {
  installGuideCardsAccordionEnhancement,
};
