const React = require("react");
const { View, Text } = require("react-native");

const COLORS = {
  muted: "#606080",
  gold: "#f5c842",
  green: "#00d4a0",
};

let installed = false;
let liveSnapshot = null;
const listeners = new Set();

function updateTradeLiveSnapshot(next) {
  liveSnapshot = next && typeof next === "object" ? next : null;
  listeners.forEach((listener) => {
    try {
      listener(liveSnapshot);
    } catch (_) {}
  });
}

function useTradeLiveSnapshot() {
  const [snapshot, setSnapshot] = React.useState(liveSnapshot);

  React.useEffect(() => {
    listeners.add(setSnapshot);
    return () => listeners.delete(setSnapshot);
  }, []);

  return snapshot;
}

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

function nodeText(node) {
  const value = node?.props?.children;
  if (Array.isArray(value)) return value.join("");
  return value == null ? "" : String(value);
}

function rowChildren(props, childArgs) {
  if (Array.isArray(childArgs) && childArgs.length) return childArgs;
  const fromProps = props?.children;
  if (Array.isArray(fromProps)) return fromProps;
  return fromProps == null ? [] : [fromProps];
}

function isTradeCurrentRow(type, props, childArgs) {
  if (!type || props?.__okaiTradeLivePriceBypass) return false;
  if (typeof type !== "function") return false;

  const children = rowChildren(props, childArgs);
  if (children.length < 2) return false;

  const label = nodeText(children[0]).trim();
  if (label !== "Current") return false;

  const valueStyle = flattenStyle(children[1]?.props?.style);
  return String(valueStyle.color || "").toLowerCase() === COLORS.gold;
}

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function TradeLivePriceRow({ originalProps }) {
  const snapshot = useTradeLiveSnapshot();
  const livePrice = snapshot?.open
    ? snapshot?.trade?.live_price ?? snapshot?.live_price
    : null;
  const available = Number.isFinite(Number(livePrice));

  return React.createElement(
    View,
    {
      style: [
        {
          flexDirection: "row",
          alignItems: "center",
        },
        originalProps?.style,
      ],
      __okaiTradeLivePriceBypass: true,
    },
    React.createElement(
      Text,
      { style: { color: COLORS.muted } },
      "Live Price"
    ),
    React.createElement(
      Text,
      {
        style: {
          color: available ? COLORS.green : COLORS.gold,
          fontWeight: "900",
        },
      },
      available ? formatPrice(livePrice) : "--"
    )
  );
}

function installCreateElementPatch() {
  if (React.__OKAI_TRADE_LIVE_PRICE_CREATE_PATCHED__) return;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiTradeLiveCreateElement(
    type,
    props,
    ...children
  ) {
    if (isTradeCurrentRow(type, props, children)) {
      return previousCreateElement(TradeLivePriceRow, {
        originalProps: props || {},
      });
    }
    return previousCreateElement(type, props, ...children);
  };

  React.__OKAI_TRADE_LIVE_PRICE_CREATE_PATCHED__ = true;
}

function installJsxRuntimePatch() {
  try {
    const jsxRuntime = require("react/jsx-runtime");
    if (jsxRuntime.__OKAI_TRADE_LIVE_PRICE_PATCHED__) return;

    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;

      jsxRuntime[key] = function okaiTradeLiveJsx(type, props, reactKey) {
        if (isTradeCurrentRow(type, props, [])) {
          return previous(
            TradeLivePriceRow,
            { originalProps: props || {} },
            reactKey
          );
        }
        return previous(type, props, reactKey);
      };
    });

    jsxRuntime.__OKAI_TRADE_LIVE_PRICE_PATCHED__ = true;
  } catch (_) {}
}

function installTradeLivePriceEnhancement() {
  if (installed) return;
  installed = true;
  installCreateElementPatch();
  installJsxRuntimePatch();
}

module.exports = {
  installTradeLivePriceEnhancement,
  updateTradeLiveSnapshot,
};
