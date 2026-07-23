const React = require("react");
const { View, Text } = require("react-native");

const COLORS = {
  muted: "#606080",
  gold: "#f5c842",
  green: "#00d4a0",
  red: "#ff4d6d",
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

function tradeLiveRowKind(type, props, childArgs) {
  if (!type || props?.__okaiTradeLivePriceBypass) return null;
  if (typeof type !== "function") return null;

  const children = rowChildren(props, childArgs);
  if (children.length < 2) return null;

  const label = nodeText(children[0]).trim();
  const valueStyle = flattenStyle(children[1]?.props?.style);
  const color = String(valueStyle.color || "").toLowerCase();

  if (label === "Current" && color === COLORS.gold) return "PRICE";
  if (label === "SL" && color === COLORS.red) return "SL";
  return null;
}

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function TradeLiveValueRow({ originalProps, kind }) {
  const snapshot = useTradeLiveSnapshot();
  const value = snapshot?.open
    ? kind === "SL"
      ? snapshot?.trade?.sl_price
      : snapshot?.trade?.live_price ?? snapshot?.live_price
    : null;
  const available = Number.isFinite(Number(value));
  const label = kind === "SL" ? "Live SL" : "Live Price";
  const color = kind === "SL"
    ? COLORS.red
    : available
    ? COLORS.green
    : COLORS.gold;

  return React.createElement(
    View,
    {
      style: [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        originalProps?.style,
      ],
      __okaiTradeLivePriceBypass: true,
    },
    React.createElement(
      Text,
      { style: { color: COLORS.muted } },
      label
    ),
    React.createElement(
      Text,
      {
        style: {
          color,
          fontWeight: "900",
        },
      },
      available ? formatPrice(value) : "--"
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
    const kind = tradeLiveRowKind(type, props, children);
    if (kind) {
      return previousCreateElement(TradeLiveValueRow, {
        originalProps: props || {},
        kind,
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
        const kind = tradeLiveRowKind(type, props, []);
        if (kind) {
          return previous(
            TradeLiveValueRow,
            { originalProps: props || {}, kind },
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
  useTradeLiveSnapshot,
};
