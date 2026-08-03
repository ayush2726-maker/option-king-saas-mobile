const React = require("react");
const ReactNative = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const jsxRuntime = require("react/jsx-runtime");

let jsxDevRuntime = null;
try {
  jsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

const {
  ActivityIndicator,
  Alert,
  AppState,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} = ReactNative;

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const POLL_MS = 3000;

const C = {
  card: "#13131f",
  panel: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#777793",
  sub: "#a0a0c0",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
};

let installed = false;
let injecting = false;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value, signed = false) {
  const parsed = number(value, 0);
  const sign = signed && parsed > 0 ? "+" : "";
  return `${sign}₹${parsed.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function price(value) {
  if (value == null || value === "") return "--";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  return `₹${parsed.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseBackendDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const millis = value < 100000000000 ? value * 1000 : value;
    const parsed = new Date(millis);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  let text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text += "T00:00:00Z";
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(text)) {
    text = text.replace(/\s+/, "T");
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(text) && !/(Z|[+-]\d{2}:?\d{2})$/.test(text)) {
    text += "Z";
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function timeLabel(value) {
  const parsed = parseBackendDate(value);
  if (!parsed) return "--:--";
  const ist = new Date(parsed.getTime() + 330 * 60 * 1000);
  return `${String(ist.getUTCHours()).padStart(2, "0")}:${String(
    ist.getUTCMinutes()
  ).padStart(2, "0")}`;
}

function tradeId(trade) {
  return String(
    trade?.id ?? `${trade?.symbol || "trade"}-${trade?.created_at || trade?.entry_time || ""}`
  );
}

function isOpenTrade(trade) {
  return String(trade?.status || "").toUpperCase() === "OPEN";
}

function sameTrade(a, b) {
  if (!a || !b) return false;
  if (a.id != null && b.id != null && String(a.id) === String(b.id)) return true;
  return Boolean(
    a.symbol && b.symbol && String(a.symbol).toUpperCase() === String(b.symbol).toUpperCase()
  );
}

function historyRows(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["paper_trades", "trades", "history", "data"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function liveRows(payload) {
  const rows = [];
  for (const key of ["trades", "active_trades", "open_positions"]) {
    if (Array.isArray(payload?.[key])) rows.push(...payload[key]);
  }
  if (payload?.open && payload?.trade) rows.push(payload.trade);
  if (payload?.active_trade) rows.push(payload.active_trade);
  return rows;
}

function normalizeOpenTrades(history, live) {
  const openHistory = historyRows(history).filter(isOpenTrade);
  const openLive = liveRows(live)
    .filter(Boolean)
    .map((trade) => ({ ...trade, status: trade?.status || "OPEN" }))
    .filter(isOpenTrade);

  const merged = openHistory.map((trade) => {
    const liveMatch = openLive.find((candidate) => sameTrade(trade, candidate));
    return liveMatch ? { ...trade, ...liveMatch, status: "OPEN" } : trade;
  });

  for (const liveTrade of openLive) {
    if (!merged.some((trade) => sameTrade(trade, liveTrade))) {
      merged.push({ ...liveTrade, status: "OPEN" });
    }
  }

  const deduped = [];
  for (const trade of merged) {
    const index = deduped.findIndex((candidate) => sameTrade(candidate, trade));
    if (index >= 0) deduped[index] = { ...deduped[index], ...trade };
    else deduped.push(trade);
  }

  deduped.sort((a, b) => {
    const slotA = number(a?.capital_slot, 99);
    const slotB = number(b?.capital_slot, 99);
    if (slotA !== slotB) return slotA - slotB;
    const timeA = parseBackendDate(a?.entry_time || a?.created_at)?.getTime() || 0;
    const timeB = parseBackendDate(b?.entry_time || b?.created_at)?.getTime() || 0;
    if (timeA !== timeB) return timeA - timeB;
    return number(a?.id, 0) - number(b?.id, 0);
  });
  return deduped;
}

function tradeLivePrice(trade) {
  return (
    trade?.live_price ??
    trade?.current_price ??
    trade?.last_ltp ??
    trade?.ltp ??
    trade?.entry_price
  );
}

function tradePnl(trade) {
  return number(trade?.net_pnl ?? trade?.unrealized_pnl ?? trade?.pnl, 0);
}

async function readJson(response) {
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    throw new Error("Server response read nahi hui.");
  }
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || data?.detail || "Server request failed.");
  }
  return data;
}

async function apiGet(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  return readJson(response);
}

async function loadHistory(token) {
  try {
    return await apiGet("/bot/trade-history", token);
  } catch (_) {
    return apiGet("/history/paper", token);
  }
}

function DataRow({ label, value, color = C.text }) {
  return React.createElement(
    View,
    {
      style: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      },
    },
    React.createElement(Text, { style: { color: C.muted, fontSize: 12 } }, label),
    React.createElement(
      Text,
      {
        numberOfLines: 2,
        style: {
          color,
          fontSize: 12,
          fontWeight: "900",
          maxWidth: "69%",
          textAlign: "right",
        },
      },
      value
    )
  );
}

function TradePositionCard({ trade, index, count, busyId, onExit }) {
  const id = tradeId(trade);
  const pnl = tradePnl(trade);
  const live = tradeLivePrice(trade);
  const mode = String(trade?.trading_mode || "paper").toUpperCase();
  const slot = number(trade?.capital_slot, index + 1);
  const allocation = number(trade?.allocation_pct, slot === 1 ? 50 : slot === 2 ? 40 : 0);
  const entryTime = timeLabel(trade?.entry_time || trade?.created_at);
  const busy = busyId === id;

  return React.createElement(
    View,
    {
      key: id,
      style: {
        backgroundColor: C.panel,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.green + "55",
        padding: 12,
        marginTop: 10,
      },
    },
    React.createElement(
      View,
      {
        style: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 5,
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 8 } },
        React.createElement(
          Text,
          { style: { color: C.blue, fontSize: 11, fontWeight: "900" } },
          `TRADE ${index + 1} OF ${count} • SLOT ${slot}${allocation ? ` (${allocation}%)` : ""}`
        ),
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 15, fontWeight: "900", marginTop: 4 } },
          trade?.symbol || "OPEN TRADE"
        )
      ),
      React.createElement(
        View,
        {
          style: {
            borderRadius: 8,
            borderWidth: 1,
            borderColor: C.green + "66",
            backgroundColor: C.green + "16",
            paddingHorizontal: 8,
            paddingVertical: 4,
          },
        },
        React.createElement(
          Text,
          { style: { color: C.green, fontSize: 9, fontWeight: "900" } },
          `${mode} • OPEN`
        )
      )
    ),
    React.createElement(DataRow, {
      label: "Side / Quantity",
      value: `${trade?.side || "--"} / ${trade?.qty ?? "--"}`,
    }),
    React.createElement(DataRow, {
      label: "Entry / Time",
      value: `${price(trade?.entry_price)} • ${entryTime} IST`,
    }),
    React.createElement(DataRow, {
      label: "Live Price",
      value: price(live),
      color: C.green,
    }),
    React.createElement(DataRow, {
      label: "Live SL",
      value: price(trade?.sl_price),
      color: C.red,
    }),
    trade?.target_price != null
      ? React.createElement(DataRow, {
          label: "Target",
          value: price(trade.target_price),
          color: C.green,
        })
      : null,
    React.createElement(DataRow, {
      label: "Net P&L",
      value: money(pnl, true),
      color: pnl >= 0 ? C.green : C.red,
    }),
    trade?.total_charges != null
      ? React.createElement(DataRow, {
          label: "Est. Charges",
          value: money(trade.total_charges),
          color: C.gold,
        })
      : null,
    trade?.reason
      ? React.createElement(
          Text,
          {
            numberOfLines: 3,
            style: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 9 },
          },
          trade.reason
        )
      : null,
    React.createElement(
      TouchableOpacity,
      {
        __okaiPerTradeExitButton: true,
        onPress: () => onExit(trade),
        disabled: busy,
        activeOpacity: 0.84,
        accessibilityRole: "button",
        accessibilityLabel: `Exit ${trade?.symbol || `trade ${index + 1}`}`,
        style: {
          minHeight: 48,
          borderRadius: 13,
          marginTop: 12,
          backgroundColor: C.red + "dd",
          borderWidth: 1,
          borderColor: "#ff6b82",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        },
      },
      busy
        ? React.createElement(ActivityIndicator, { color: "#ffffff", size: "small" })
        : React.createElement(
            Text,
            { style: { color: "#ffffff", fontSize: 13, fontWeight: "900" } },
            `⛔ EXIT THIS TRADE (${index + 1}/${count})`
          )
    )
  );
}

function MultiOpenTradePanel() {
  const [trades, setTrades] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState("");
  const [error, setError] = React.useState("");
  const aliveRef = React.useRef(true);
  const requestRef = React.useRef(false);
  const appStateRef = React.useRef(AppState.currentState);

  const refresh = React.useCallback(async (showLoader = false) => {
    if (requestRef.current || appStateRef.current !== "active") return;
    requestRef.current = true;
    if (showLoader && aliveRef.current) setLoading(true);
    try {
      const token = await AsyncStorage.getItem("saas_token");
      if (!token) throw new Error("Login session nahi mili.");
      const [history, live] = await Promise.all([
        loadHistory(token),
        apiGet("/bot/trade-live", token).catch(() => null),
      ]);
      const next = normalizeOpenTrades(history, live);
      if (aliveRef.current) {
        setTrades(next);
        setError("");
      }
    } catch (refreshError) {
      if (aliveRef.current) {
        setError(String(refreshError?.message || refreshError));
      }
    } finally {
      requestRef.current = false;
      if (showLoader && aliveRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    aliveRef.current = true;
    appStateRef.current = AppState.currentState;
    const subscription = AppState.addEventListener("change", (state) => {
      appStateRef.current = state;
      if (state === "active") refresh(false);
    });
    refresh(true);
    const timer = setInterval(() => refresh(false), POLL_MS);
    return () => {
      aliveRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh]);

  const executeExit = React.useCallback(
    async (trade) => {
      const id = tradeId(trade);
      if (!trade?.id || busyId) return;
      setBusyId(id);
      try {
        const token = await AsyncStorage.getItem("saas_token");
        if (!token) throw new Error("Login session nahi mili.");
        const response = await fetch(SAAS_URL + "/bot/manual-exit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ trade_id: trade.id }),
        });
        const data = await readJson(response);
        Alert.alert(
          "Trade Exited",
          data?.message || `${trade?.symbol || "Selected trade"} exit ho gayi.`
        );
        await new Promise((resolve) => setTimeout(resolve, 350));
        await refresh(false);
      } catch (exitError) {
        Alert.alert(
          "Exit Failed",
          exitError?.message || "Selected trade ka exit confirm nahi hua."
        );
      } finally {
        if (aliveRef.current) setBusyId("");
      }
    },
    [busyId, refresh]
  );

  const confirmExit = React.useCallback(
    (trade) => {
      if (!trade || busyId) return;
      Alert.alert(
        "Exit This Trade?",
        `${trade?.symbol || "Selected trade"}\nQty: ${trade?.qty ?? "--"}\nLive: ${price(
          tradeLivePrice(trade)
        )}\n\nSirf ye trade exit hogi. Dusri open trade par koi asar nahi padega.`,
        [
          { text: "CANCEL", style: "cancel" },
          {
            text: "EXIT THIS TRADE",
            style: "destructive",
            onPress: () => executeExit(trade),
          },
        ]
      );
    },
    [busyId, executeExit]
  );

  const allLive = trades.length > 0 && trades.every(
    (trade) => String(trade?.trading_mode || "paper").toLowerCase() === "live"
  );
  const allPaper = trades.every(
    (trade) => String(trade?.trading_mode || "paper").toLowerCase() !== "live"
  );
  const title = allLive
    ? "Active Live Trades"
    : allPaper
    ? "Active Paper Trades"
    : "Active Open Trades";

  return React.createElement(
    View,
    {
      __okaiFinalMultiOpenPanel: true,
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: trades.length ? C.green + "66" : C.border,
        padding: 16,
        marginBottom: 12,
        shadowColor: trades.length ? C.green : C.blue,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 7,
      },
    },
    React.createElement(
      View,
      {
        style: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 10 } },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 20, fontWeight: "900" } },
          `🧾 ${title}`
        ),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 } },
          trades.length
            ? `${trades.length} open position${trades.length > 1 ? "s" : ""} • Har trade ka apna Exit button`
            : "Closed trade active position mein nahi dikhegi."
        )
      ),
      React.createElement(
        TouchableOpacity,
        {
          onPress: () => refresh(true),
          disabled: loading,
          style: { paddingVertical: 7, paddingLeft: 8 },
        },
        loading
          ? React.createElement(ActivityIndicator, { color: C.blue, size: "small" })
          : React.createElement(
              Text,
              { style: { color: C.blue, fontSize: 13, fontWeight: "900" } },
              "Refresh"
            )
      )
    ),
    error
      ? React.createElement(
          Text,
          { style: { color: C.red, fontSize: 10, lineHeight: 15, marginTop: 9 } },
          error
        )
      : null,
    trades.length
      ? trades.map((trade, index) =>
          React.createElement(TradePositionCard, {
            key: tradeId(trade),
            trade,
            index,
            count: trades.length,
            busyId,
            onExit: confirmExit,
          })
        )
      : React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 12 } },
          "Abhi koi active trade nahi hai. Sirf fully qualified signal par nayi trade create hogi."
        )
  );
}

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

function flattenStyle(style) {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((merged, item) => ({ ...merged, ...flattenStyle(item) }), {});
  }
  return typeof style === "object" ? style : {};
}

function collectText(value, output = [], depth = 0) {
  if (value == null || value === false || depth > 14) return output;
  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output, depth + 1));
    return output;
  }
  if (!React.isValidElement(value)) return output;
  collectText(value.props?.children, output, depth + 1);
  collectText(value.props?.label, output, depth + 1);
  collectText(value.props?.title, output, depth + 1);
  collectText(value.props?.accessibilityLabel, output, depth + 1);
  return output;
}

function signatureOf(value) {
  return collectText(value)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isScrollViewType(type) {
  return type === ScrollView || componentName(type) === "ScrollView";
}

function isActiveTradeCard(element) {
  if (!React.isValidElement(element)) return false;
  if (
    element.type === MultiOpenTradePanel ||
    element.props?.__okaiFinalMultiOpenPanel ||
    element.props?.__okaiMultiOpenTradeCard
  ) {
    return true;
  }
  const text = signatureOf(element);
  return [
    "active paper trade",
    "active paper trades",
    "active live trade",
    "active live trades",
    "active open trades",
  ].some((marker) => text.includes(marker));
}

function looksLikeTradeScreen(type, props) {
  if (
    injecting ||
    !isScrollViewType(type) ||
    props?.__okaiFinalMultiOpenInjected
  ) {
    return false;
  }
  const text = signatureOf(props?.children);
  const hasHistory = text.includes("trade history");
  const hasActive = [
    "active paper trade",
    "active live trade",
    "active open trade",
  ].some((marker) => text.includes(marker));
  return hasHistory && hasActive;
}

function injectMultiOpenPanel(props) {
  const items = React.Children.toArray(props?.children).filter(
    (item) => !isActiveTradeCard(item)
  );
  injecting = true;
  let panel = null;
  try {
    panel = React.createElement(MultiOpenTradePanel, {
      key: "okai-final-multi-open-trade-panel-v2",
      __okaiFinalMultiOpenPanel: true,
    });
  } finally {
    injecting = false;
  }
  return {
    ...(props || {}),
    __okaiFinalMultiOpenInjected: true,
    children: [panel, ...items],
  };
}

function shouldHideGlobalExit(type, props) {
  if (props?.__okaiPerTradeExitButton) return false;
  const name = componentName(type);
  const source = componentSource(type);
  if (
    name === "ManualExitOverlay" ||
    source.includes("function ManualExitOverlay") ||
    (source.includes("EXIT TRADE NOW") && source.includes("/bot/manual-exit"))
  ) {
    return true;
  }

  const text = signatureOf(props?.children || props?.label || props?.accessibilityLabel);
  if (!text.includes("exit trade now")) return false;
  const style = flattenStyle(props?.style);
  return (
    type === TouchableOpacity ||
    type === View ||
    componentName(type) === "TouchableOpacity" ||
    style.position === "absolute" ||
    style.bottom != null ||
    style.right != null
  );
}

function transform(previous, type, props, reactKey, rest) {
  if (shouldHideGlobalExit(type, props || {})) return null;
  const nextProps = looksLikeTradeScreen(type, props || {})
    ? injectMultiOpenPanel(props || {})
    : props;
  return previous(type, nextProps, reactKey, ...(rest || []));
}

function patchRuntime(runtime) {
  if (!runtime) return;
  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__okaiFinalMultiOpenV2) return;
    const wrapped = function okaiFinalMultiOpenTradeJsx(
      type,
      props,
      reactKey,
      ...rest
    ) {
      return transform(previous, type, props || {}, reactKey, rest);
    };
    wrapped.__okaiFinalMultiOpenV2 = true;
    runtime[key] = wrapped;
  });
}

function installFinalMultiOpenTradeScreenV2() {
  if (installed || React.__OKAI_FINAL_MULTI_OPEN_TRADE_V2_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiFinalMultiOpenTradeCreateElement(
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

    if (shouldHideGlobalExit(type, suppliedProps)) return null;
    const nextProps = looksLikeTradeScreen(type, suppliedProps)
      ? injectMultiOpenPanel(suppliedProps)
      : suppliedProps;
    return previousCreateElement(type, nextProps);
  };

  patchRuntime(jsxRuntime);
  patchRuntime(jsxDevRuntime);
  React.__OKAI_FINAL_MULTI_OPEN_TRADE_V2_PATCHED__ = true;
}

module.exports = {
  installFinalMultiOpenTradeScreenV2,
  normalizeOpenTrades,
  FINAL_MULTI_OPEN_TRADE_MARKER: "OKAI-FINAL-MULTI-OPEN-TRADE-CARDS-V2",
};
