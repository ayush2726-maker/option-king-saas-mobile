const React = require("react");
const { View, Text } = require("react-native");
const { useTradeLiveSnapshot } = require("./TradeLivePriceEnhancement");

const C = {
  card2: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#606080",
  sub: "#a0a0c0",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
  purple: "#7c6deb",
};

let installed = false;

function flattenStyle(style) {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce(
      (merged, item) => ({ ...merged, ...flattenStyle(item) }),
      {}
    );
  }
  return typeof style === "object" ? style : {};
}

function textFromChildren(value) {
  if (Array.isArray(value)) return value.map(textFromChildren).join("");
  if (value == null || value === false) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (React.isValidElement(value)) return textFromChildren(value.props?.children);
  return "";
}

function textFromArgs(props, children) {
  if (Array.isArray(children) && children.length) return textFromChildren(children);
  return textFromChildren(props?.children);
}

function isActiveReasonText(type, props, children) {
  if (type !== Text || props?.__okaiTradeExplanationBypass) return false;
  const style = flattenStyle(props?.style);
  const value = textFromArgs(props, children).trim();
  if (!value) return false;

  const color = String(style.color || "").toLowerCase();
  const looksLikeTradeReason =
    value.includes("Real entry score") ||
    value.includes("AUTO_PORTFOLIO") ||
    value.includes("DYNAMIC_PROFIT_LOCK") ||
    value.includes("Hero Zero real entry");

  return (
    looksLikeTradeReason &&
    color === C.muted &&
    Number(style.fontSize) === 12 &&
    Number(style.marginTop) === 10 &&
    Number(style.lineHeight) === 17
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function valueText(value) {
  if (value == null || value === "") return "--";
  return String(value);
}

function checkColor(status) {
  const text = String(status || "").toUpperCase();
  if (text === "PASS") return C.green;
  if (text === "WARN") return C.gold;
  if (text === "FAIL") return C.red;
  return C.blue;
}

function Pill({ text, color }) {
  return React.createElement(
    View,
    {
      style: {
        borderWidth: 1,
        borderColor: `${color || C.blue}66`,
        backgroundColor: `${color || C.blue}18`,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginRight: 6,
        marginBottom: 6,
      },
      __okaiTradeExplanationBypass: true,
    },
    React.createElement(
      Text,
      {
        style: {
          color: color || C.blue,
          fontSize: 10,
          fontWeight: "900",
        },
        __okaiTradeExplanationBypass: true,
      },
      text
    )
  );
}

function Line({ label, value, color }) {
  return React.createElement(
    View,
    {
      style: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        paddingVertical: 3,
      },
      __okaiTradeExplanationBypass: true,
    },
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 11 }, __okaiTradeExplanationBypass: true },
      label
    ),
    React.createElement(
      Text,
      {
        style: {
          color: color || C.text,
          fontSize: 11,
          fontWeight: "900",
          maxWidth: "64%",
          textAlign: "right",
        },
        __okaiTradeExplanationBypass: true,
      },
      valueText(value)
    )
  );
}

function buildFallback(trade, originalText) {
  const side = String(trade?.side || "").toUpperCase();
  return {
    selected_side_reason:
      side === "PE"
        ? "PE selected: bearish setup. PE premium index neeche jane par badhta hai."
        : side === "CE"
        ? "CE selected: bullish setup. CE premium index upar jane par badhta hai."
        : "Strategy score ne entry allow ki.",
    compact_lines: [originalText].filter(Boolean),
    data_note: "Detailed indicator breakdown next fresh trade se full milega.",
  };
}

function TradeExplanationBlock({ originalText }) {
  const snapshot = useTradeLiveSnapshot();
  const trade = snapshot?.trade || snapshot?.latest_trade || snapshot?.active_trade || null;
  const explanation = trade?.entry_explanation || buildFallback(trade, originalText);
  const checks = asArray(explanation?.checks);
  const compact = asArray(explanation?.compact_lines).filter(Boolean).slice(0, 8);
  const side = String(trade?.side || explanation?.side || "").toUpperCase();

  return React.createElement(
    View,
    {
      style: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.card2,
        borderRadius: 12,
        padding: 12,
      },
      __okaiTradeExplanationBypass: true,
    },
    React.createElement(
      Text,
      {
        style: {
          color: C.text,
          fontSize: 13,
          fontWeight: "900",
          marginBottom: 6,
        },
        __okaiTradeExplanationBypass: true,
      },
      "Why Trade Taken"
    ),
    React.createElement(
      Text,
      {
        style: {
          color: side === "PE" ? C.red : side === "CE" ? C.green : C.blue,
          fontSize: 12,
          fontWeight: "900",
          lineHeight: 17,
          marginBottom: 8,
        },
        __okaiTradeExplanationBypass: true,
      },
      explanation?.selected_side_reason || "Strategy score ne entry allow ki."
    ),
    compact.length
      ? React.createElement(
          View,
          {
            style: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
            __okaiTradeExplanationBypass: true,
          },
          compact.map((line, index) =>
            React.createElement(Pill, {
              key: `compact-${index}`,
              text: String(line),
              color: index === 0 ? C.blue : C.purple,
            })
          )
        )
      : null,
    checks.slice(0, 6).map((item, index) =>
      React.createElement(Line, {
        key: `check-${index}`,
        label: item?.label || `Check ${index + 1}`,
        value: item?.value || item?.detail || item?.status || "--",
        color: checkColor(item?.status),
      })
    ),
    explanation?.vwap_direction
      ? React.createElement(Line, {
          label: "VWAP",
          value: explanation.vwap_direction,
          color: C.blue,
        })
      : null,
    explanation?.supertrend_direction
      ? React.createElement(Line, {
          label: "Supertrend",
          value: explanation.supertrend_direction,
          color: C.purple,
        })
      : null,
    explanation?.opposite_reject_reason
      ? React.createElement(
          Text,
          {
            style: {
              color: C.gold,
              fontSize: 11,
              lineHeight: 16,
              marginTop: 7,
              fontWeight: "800",
            },
            __okaiTradeExplanationBypass: true,
          },
          explanation.opposite_reject_reason
        )
      : null,
    explanation?.data_note
      ? React.createElement(
          Text,
          {
            style: {
              color: C.muted,
              fontSize: 10,
              lineHeight: 15,
              marginTop: 7,
            },
            __okaiTradeExplanationBypass: true,
          },
          explanation.data_note
        )
      : null,
    originalText
      ? React.createElement(
          Text,
          {
            style: {
              color: C.muted,
              fontSize: 10,
              lineHeight: 14,
              marginTop: 8,
            },
            __okaiTradeExplanationBypass: true,
          },
          `Raw: ${originalText}`
        )
      : null
  );
}

function installCreateElementPatch() {
  if (React.__OKAI_TRADE_EXPLANATION_CREATE_PATCHED__) return;
  const previousCreateElement = React.createElement.bind(React);

  React.createElement = function okaiTradeExplanationCreateElement(
    type,
    props,
    ...children
  ) {
    if (isActiveReasonText(type, props, children)) {
      return previousCreateElement(TradeExplanationBlock, {
        originalText: textFromArgs(props, children),
      });
    }
    return previousCreateElement(type, props, ...children);
  };

  React.__OKAI_TRADE_EXPLANATION_CREATE_PATCHED__ = true;
}

function installJsxRuntimePatch() {
  try {
    const jsxRuntime = require("react/jsx-runtime");
    if (jsxRuntime.__OKAI_TRADE_EXPLANATION_PATCHED__) return;

    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;
      jsxRuntime[key] = function okaiTradeExplanationJsx(type, props, reactKey) {
        if (isActiveReasonText(type, props, [])) {
          return previous(
            TradeExplanationBlock,
            { originalText: textFromArgs(props, []) },
            reactKey
          );
        }
        return previous(type, props, reactKey);
      };
    });

    jsxRuntime.__OKAI_TRADE_EXPLANATION_PATCHED__ = true;
  } catch (_) {}
}

function installTradeExplanationEnhancement() {
  if (installed) return;
  installed = true;
  installCreateElementPatch();
  installJsxRuntimePatch();
}

module.exports = { installTradeExplanationEnhancement };
