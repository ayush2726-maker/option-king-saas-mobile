const React = require("react");
const { View, Text } = require("react-native");

const COLORS = {
  muted: "#606080",
  gold: "#f5c842",
  green: "#00d4a0",
  red: "#ff4d6d",
  text: "#e8e8f0",
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

function textFromChildren(value) {
  if (Array.isArray(value)) return value.map(textFromChildren).join("");
  if (value == null || value === false) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (React.isValidElement(value)) return textFromChildren(value.props?.children);
  return "";
}

function nodeText(node) {
  return textFromChildren(node?.props?.children);
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
  const valueText = nodeText(children[1]).trim();
  const valueStyle = flattenStyle(children[1]?.props?.style);
  const color = String(valueStyle.color || "").toLowerCase();

  if (label === "Current" && color === COLORS.gold) return "PRICE_HIGH";
  if (label === "SL" && color === COLORS.red) return "SL";
  if (label === "Entry" && valueText.includes("₹")) return "ENTRY_TIME";
  if (label === "Exit" && valueText.includes("₹")) return "EXIT_TIME";
  return null;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatPrice(value) {
  const number = numberOrNull(value);
  if (number == null) return "--";
  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTime(value) {
  if (!value) return "--";
  const parsed = new Date(String(value).replace(" ", "T"));
  if (!Number.isFinite(parsed.getTime())) return "--";
  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function activeTrade(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return null;
  return snapshot?.trade || snapshot?.latest_trade || null;
}

function highPnl(trade, high) {
  const entry = numberOrNull(trade?.entry_price);
  const qty = numberOrNull(trade?.qty);
  if (entry == null || qty == null || high == null) return null;
  return Math.max(0, (high - entry) * qty);
}

function ValueBlock({ main, sub, color }) {
  return React.createElement(
    View,
    { style: { alignItems: "flex-end", maxWidth: "62%" } },
    React.createElement(
      Text,
      { style: { color: color || COLORS.text, fontWeight: "900", textAlign: "right" } },
      main
    ),
    sub
      ? React.createElement(
          Text,
          { style: { color: COLORS.muted, fontSize: 10, fontWeight: "800", marginTop: 2, textAlign: "right" } },
          sub
        )
      : null
  );
}

function TradeLiveValueRow({ originalProps, kind }) {
  const snapshot = useTradeLiveSnapshot();
  const trade = activeTrade(snapshot);
  const isOpen = Boolean(snapshot?.open && trade);

  let label = kind;
  let main = "--";
  let sub = "";
  let color = COLORS.text;

  if (kind === "SL") {
    const value = isOpen ? trade?.sl_price : null;
    const available = Number.isFinite(Number(value));
    label = "Live SL";
    main = available ? formatPrice(value) : "--";
    color = COLORS.red;
  } else if (kind === "PRICE_HIGH") {
    const live = isOpen ? trade?.live_price ?? trade?.current_price : null;
    const high = numberOrNull(trade?.high_price ?? trade?.peak_price ?? live);
    const maxProfit = numberOrNull(trade?.high_net_pnl ?? trade?.high_pnl) ?? highPnl(trade, high);
    label = "Live / High";
    main = formatPrice(live);
    sub = `High ${formatPrice(high)}${maxProfit != null ? ` • Max +₹${maxProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : ""}`;
    color = numberOrNull(live) != null ? COLORS.green : COLORS.gold;
  } else if (kind === "ENTRY_TIME") {
    label = "Entry / Time";
    main = formatPrice(trade?.entry_price);
    sub = `${formatTime(trade?.entry_time || trade?.created_at)} IST`;
    color = COLORS.text;
  } else if (kind === "EXIT_TIME") {
    label = "Exit / Time";
    const exit = trade?.exit_price;
    main = exit != null ? formatPrice(exit) : "--";
    sub = trade?.exit_time ? `${formatTime(trade.exit_time)} IST` : "--";
    color = exit != null ? COLORS.text : COLORS.muted;
  }

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
    React.createElement(ValueBlock, { main, sub, color })
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
