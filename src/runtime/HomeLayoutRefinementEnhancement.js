const React = require("react");
const {
  Text,
  TouchableOpacity,
  View,
} = require("react-native");

const LIVE_SCORE_DROPDOWN_V2 = true;

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

function sourceOf(type) {
  try {
    return Function.prototype.toString.call(type);
  } catch (_) {
    return "";
  }
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
            __okaiLiveScoreDropdownBypass: true,
          })
        )
      : null
  );
}

function shouldWrapLiveScore(type, props) {
  if (props?.__okaiLiveScoreDropdownBypass) return false;

  const name = componentName(type);
  if (name === "LiveStrategyScoreCard") return true;

  const source = sourceOf(type);
  return (
    source.includes("Live Strategy Score") &&
    source.includes("MiniScanRow") &&
    source.includes("scan_results")
  );
}

function installHomeLayoutRefinementEnhancement() {
  if (installed || React.__OKAI_LIVE_SCORE_DROPDOWN_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);

  React.createElement = function okaiLiveScoreDropdownCreateElement(
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

    if (shouldWrapLiveScore(type, nextProps)) {
      return previousCreateElement(LiveStrategyScoreDropdown, {
        originalType: type,
        originalProps: nextProps,
      });
    }

    return previousCreateElement(type, nextProps);
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");

    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;

      jsxRuntime[key] = function okaiLiveScoreDropdownJsx(
        type,
        props,
        reactKey
      ) {
        const nextProps = props || {};

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

        return previous(type, nextProps, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_LIVE_SCORE_DROPDOWN_PATCHED__ = LIVE_SCORE_DROPDOWN_V2;
}

module.exports = { installHomeLayoutRefinementEnhancement };
