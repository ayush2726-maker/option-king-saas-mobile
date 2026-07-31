const React = require("react");
const {
  Text,
  TouchableOpacity,
  View,
} = require("react-native");

const C = {
  card: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#70708e",
  blue: "#4d9fff",
};

const KEEP_HOME_DROPDOWNS = new Set([
  "Trading Mode",
  "Auto Scan Instruments",
]);

let installed = false;

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function collectText(value, output = []) {
  if (value == null || value === false) return output;

  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output));
    return output;
  }

  if (React.isValidElement(value)) {
    collectText(value.props?.children, output);
    collectText(value.props?.label, output);
    collectText(value.props?.title, output);
  }

  return output;
}

function textOf(value) {
  return collectText(value).join(" ").replace(/\s+/g, " ").trim();
}

function isStartStopControl(element) {
  const text = textOf(element);
  const hasStart =
    text.includes("Start Bot") ||
    text.includes("Bot Start") ||
    text.includes("Bot Start Karo");
  const hasStop =
    text.includes("Stop Bot") ||
    text.includes("Bot Stop") ||
    text.includes("Bot Stop Karo");
  return hasStart && hasStop;
}

function isRefreshControl(element) {
  const text = textOf(element);
  return (
    text.includes("Refresh Status") ||
    text.includes("Status Refresh") ||
    text.includes("Status Refresh Karo")
  );
}

function isHomeDashboard(children) {
  const text = textOf(children);
  return (
    text.includes("TODAY NET P&L") &&
    text.includes("AUTO Portfolio") &&
    (text.includes("Start Bot") || text.includes("Bot Start"))
  );
}

function moveBotControlsToTop(children) {
  const items = React.Children.toArray(children);
  if (!items.length || !isHomeDashboard(items)) return children;

  const startStop = [];
  const refresh = [];
  const rest = [];

  items.forEach((item) => {
    if (isStartStopControl(item)) {
      startStop.push(item);
    } else if (isRefreshControl(item)) {
      refresh.push(item);
    } else {
      rest.push(item);
    }
  });

  if (!startStop.length && !refresh.length) return children;
  return [...startStop, ...refresh, ...rest];
}

function scoreSummary(signal) {
  const scans = Array.isArray(signal?.scan_results)
    ? signal.scan_results
    : [];

  const selected = scans
    .slice()
    .sort(
      (a, b) =>
        Number(b?.score || b?.live_score_breakdown?.score || 0) -
        Number(a?.score || a?.live_score_breakdown?.score || 0)
    )[0];

  const score = Number(
    selected?.score ??
      selected?.live_score_breakdown?.score ??
      signal?.score ??
      0
  );
  const minimum = Number(
    selected?.min_score ??
      selected?.live_score_breakdown?.min_score ??
      signal?.min_score ??
      82
  );

  return {
    score: Number.isFinite(score) ? score : 0,
    minimum: Number.isFinite(minimum) ? minimum : 82,
  };
}

function LiveStrategyScoreDropdown({ originalType, originalProps }) {
  const [open, setOpen] = React.useState(false);
  const summary = scoreSummary(originalProps?.signal || {});

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: open ? C.blue + "88" : C.border,
        overflow: "hidden",
        marginTop: 12,
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
          gap: 10,
        },
      },
      React.createElement(
        View,
        { style: { flex: 1 } },
        React.createElement(
          Text,
          {
            style: {
              color: C.text,
              fontSize: 15,
              fontWeight: "900",
            },
          },
          "📊 Live Strategy Score"
        ),
        React.createElement(
          Text,
          {
            style: {
              color: C.muted,
              fontSize: 10,
              marginTop: 4,
            },
          },
          open ? "Tap to close live score" : "Tap to view live strategy score"
        )
      ),
      React.createElement(
        View,
        {
          style: {
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
          },
        },
        React.createElement(
          Text,
          {
            style: {
              color: C.blue,
              fontSize: 13,
              fontWeight: "900",
            },
          },
          `${summary.score}/${summary.minimum}`
        ),
        React.createElement(
          Text,
          {
            style: {
              color: C.blue,
              fontSize: 18,
              fontWeight: "900",
            },
          },
          open ? "⌃" : "⌄"
        )
      )
    ),
    open
      ? React.createElement(
          View,
          {
            style: {
              paddingHorizontal: 10,
              paddingBottom: 10,
            },
          },
          React.createElement(originalType, {
            ...(originalProps || {}),
            __okaiHomeLayoutBypass: true,
          })
        )
      : null
  );
}

function unwrapHomeAccordion(type, props, originalCreateElement) {
  if (componentName(type) !== "AccordionCard") return null;

  const match = String(props?.section?.match || "");
  if (KEEP_HOME_DROPDOWNS.has(match)) return null;

  const OriginalCard = props?.originalType;
  if (!OriginalCard) return null;

  return originalCreateElement(OriginalCard, {
    ...(props?.originalProps || {}),
    __okaiAccordionBypass: true,
  });
}

function shouldWrapLiveScore(type, props) {
  return (
    !props?.__okaiHomeLayoutBypass &&
    componentName(type) === "LiveStrategyScoreCard"
  );
}

function refineProps(type, props) {
  const name = componentName(type);
  if (name !== "ScrollView") return props;

  const nextChildren = moveBotControlsToTop(props?.children);
  if (nextChildren === props?.children) return props;

  return {
    ...(props || {}),
    children: nextChildren,
  };
}

function installHomeLayoutRefinementEnhancement() {
  if (installed || React.__OKAI_HOME_LAYOUT_REFINEMENT_PATCHED__) return;
  installed = true;

  const originalCreateElement = React.createElement.bind(React);

  React.createElement = function okaiHomeLayoutRefinementCreateElement(
    type,
    props,
    ...children
  ) {
    const nextProps =
      children.length > 0
        ? {
            ...(props || {}),
            children: children.length === 1 ? children[0] : children,
          }
        : props || {};

    const unwrapped = unwrapHomeAccordion(
      type,
      nextProps,
      originalCreateElement
    );
    if (unwrapped) return unwrapped;

    if (shouldWrapLiveScore(type, nextProps)) {
      return originalCreateElement(LiveStrategyScoreDropdown, {
        originalType: type,
        originalProps: nextProps,
      });
    }

    const refined = refineProps(type, nextProps);
    return originalCreateElement(type, refined);
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");

    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;

      jsxRuntime[key] = function okaiHomeLayoutRefinementJsx(
        type,
        props,
        reactKey
      ) {
        const nextProps = props || {};
        const unwrapped = unwrapHomeAccordion(
          type,
          nextProps,
          originalCreateElement
        );
        if (unwrapped) return unwrapped;

        if (shouldWrapLiveScore(type, nextProps)) {
          return previous(
            LiveStrategyScoreDropdown,
            {
              originalType: type,
              originalProps: nextProps,
            },
            reactKey
          );
        }

        return previous(type, refineProps(type, nextProps), reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_HOME_LAYOUT_REFINEMENT_PATCHED__ = true;
}

module.exports = { installHomeLayoutRefinementEnhancement };
