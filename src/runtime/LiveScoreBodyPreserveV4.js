const React = require("react");
const ReactNative = require("react-native");
const jsxRuntime = require("react/jsx-runtime");

let jsxDevRuntime = null;
try {
  jsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

const { Text, TouchableOpacity, View } = ReactNative;
const C = {
  card: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#70708e",
  blue: "#4d9fff",
};

let installed = false;

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function componentSource(type) {
  if (typeof type !== "function") return "";
  try {
    return Function.prototype.toString.call(type);
  } catch (_) {
    return "";
  }
}

function textOf(value, depth = 0) {
  if (value == null || value === false || depth > 10) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((item) => textOf(item, depth + 1)).join(" ");
  if (!React.isValidElement(value)) return "";
  return [
    textOf(value.props?.children, depth + 1),
    textOf(value.props?.label, depth + 1),
    textOf(value.props?.title, depth + 1),
  ].join(" ");
}

function safeBodyChildren(children) {
  const items = React.Children.toArray(children);

  // Production LiveStrategyScoreCard keeps the heading and all score rows inside
  // one top-level container. Removing that container makes the accordion blank.
  // Only remove a standalone heading when other top-level body rows are present.
  if (items.length <= 1) return children;

  const firstText = textOf(items[0]).replace(/\s+/g, " ").trim().toLowerCase();
  if (!firstText.includes("live strategy score")) return children;
  return items.slice(1);
}

function looksLikeBrokenLiveScoreWrapper(type, props) {
  if (props?.__okaiLiveScoreBodyPreserveBypass) return false;
  if (!props || typeof props.originalType !== "function" || !props.originalProps) {
    return false;
  }

  const source = componentSource(type);
  return (
    componentName(type) === "LiveScoreAccordionPanel" ||
    (source.includes("Tap to close live score") &&
      source.includes("__okaiLiveScoreV3Bypass"))
  );
}

function originalIsSelfContainedLiveScore(originalType, originalProps) {
  const name = componentName(originalType);
  const source = componentSource(originalType);
  const propsText = textOf(originalProps?.children).replace(/\s+/g, " ").toLowerCase();
  return (
    name === "LiveStrategyScoreCard" ||
    (source.includes("Live Strategy Score") && source.includes("scan_results")) ||
    propsText.includes("tap to view live strategy score") ||
    propsText.includes("tap to close live score")
  );
}

function FixedLiveScoreAccordionPanel({ originalType, originalProps }) {
  // Newer LiveStrategyScoreCard already owns its accordion header, score value,
  // chevron and expanded body. Wrapping it again creates the duplicated heading
  // seen on the Trade screen. Let that modern card render itself directly.
  if (originalIsSelfContainedLiveScore(originalType, originalProps)) {
    return React.createElement(originalType, {
      ...(originalProps || {}),
      __okaiAccordionV3Bypass: true,
      __okaiLiveScoreV3Bypass: true,
      __okaiLiveScoreBodyPreserveBypass: true,
    });
  }

  const [open, setOpen] = React.useState(false);
  const bodyChildren = safeBodyChildren(originalProps?.children);

  return React.createElement(
    View,
    {
      __okaiLiveScoreBodyPreserveBypass: true,
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: open ? C.blue + "88" : C.border,
        overflow: "hidden",
      },
    },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => setOpen((value) => !value),
        activeOpacity: 0.82,
        accessibilityRole: "button",
        accessibilityState: { expanded: open },
        style: {
          minHeight: 64,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 10 } },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 16, fontWeight: "900" } },
          "📊 Live Strategy Score"
        ),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 10, marginTop: 4 } },
          open ? "Tap to close live score" : "Tap to view live strategy score"
        )
      ),
      React.createElement(
        Text,
        { style: { color: C.blue, fontSize: 19, fontWeight: "900" } },
        open ? "⌃" : "⌄"
      )
    ),
    open
      ? React.createElement(originalType, {
          ...(originalProps || {}),
          __okaiAccordionV3Bypass: true,
          __okaiLiveScoreV3Bypass: true,
          glow: undefined,
          style: [
            originalProps?.style,
            {
              borderWidth: 0,
              borderRadius: 0,
              backgroundColor: "transparent",
              shadowOpacity: 0,
              elevation: 0,
              paddingTop: 4,
            },
          ],
          children: bodyChildren,
        })
      : null
  );
}

function transform(previous, type, props, reactKey, rest) {
  if (!looksLikeBrokenLiveScoreWrapper(type, props || {})) {
    return previous(type, props, reactKey, ...(rest || []));
  }

  return previous(
    FixedLiveScoreAccordionPanel,
    {
      originalType: props.originalType,
      originalProps: props.originalProps,
      __okaiLiveScoreBodyPreserveBypass: true,
    },
    reactKey,
    ...(rest || [])
  );
}

function patchRuntime(runtime) {
  if (!runtime) return;
  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__okaiLiveScoreBodyPreserveV4) {
      return;
    }
    const wrapped = function okaiLiveScoreBodyPreserveJsx(
      type,
      props,
      reactKey,
      ...rest
    ) {
      return transform(previous, type, props || {}, reactKey, rest);
    };
    wrapped.__okaiLiveScoreBodyPreserveV4 = true;
    runtime[key] = wrapped;
  });
}

function installLiveScoreBodyPreserveV4() {
  if (installed || React.__OKAI_LIVE_SCORE_BODY_PRESERVE_V4_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiLiveScoreBodyPreserveCreateElement(
    type,
    props,
    ...children
  ) {
    const suppliedProps = children.length
      ? {
          ...(props || {}),
          children: children.length === 1 ? children[0] : children,
        }
      : props || {};

    if (looksLikeBrokenLiveScoreWrapper(type, suppliedProps)) {
      return previousCreateElement(FixedLiveScoreAccordionPanel, {
        originalType: suppliedProps.originalType,
        originalProps: suppliedProps.originalProps,
        __okaiLiveScoreBodyPreserveBypass: true,
      });
    }

    return previousCreateElement(type, suppliedProps);
  };

  patchRuntime(jsxRuntime);
  patchRuntime(jsxDevRuntime);
  React.__OKAI_LIVE_SCORE_BODY_PRESERVE_V4_PATCHED__ = true;
}

module.exports = {
  installLiveScoreBodyPreserveV4,
  safeBodyChildren,
  OKAI_LIVE_SCORE_BODY_MARKER: "OKAI-LIVE-SCORE-BODY-PRESERVE-V5-NO-DUPLICATE-HEADER",
};
