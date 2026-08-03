const React = require("react");
const ReactNative = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;

const {
  ActivityIndicator,
  Alert,
  AppState,
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
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
};

let installed = false;

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

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const parsed = new Date(value < 100000000000 ? value * 1000 : value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  let text = String(value).trim();
  if (!text) return null;
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
  const parsed = parseDate(value);
  if (!parsed) return "--:--";
  const ist = new Date(parsed.getTime() + 330 * 60 * 1000);
  return `${String(ist.getUTCHours()).padStart(2, "0")}:${String(
    ist.getUTCMinutes()
  ).padStart(2, "0")}`;
}

function tradeId(trade) {
  return String(
    trade?.id ?? `${trade?.symbol || "trade"}-${trade?.entry_time || trade?.created_at || ""}`
  );
}

function isOpen(trade) {
  const status = String(trade?.status || "OPEN").toUpperCase();
  return status === "OPEN";
}

function looksLikeTrade(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.symbol &&
      (value.id != null || value.qty != null || value.entry_price != null)
  );
}

function collectTradeRows(payload) {
  const output = [];
  const queue = [{ value: payload, depth: 0 }];
  const visited = new Set();
  const keys = [
    "trade",
    "active_trade",
    "latest_trade",
    "trades",
    "paper_trades",
    "active_trades",
    "active_positions",
    "open_positions",
    "positions",
    "data",
    "portfolio",
    "auto_portfolio",
  ];

  while (queue.length) {
    const { value, depth } = queue.shift();
    if (value == null || depth > 4) continue;

    if (Array.isArray(value)) {
      value.forEach((item) => queue.push({ value: item, depth: depth + 1 }));
      continue;
    }

    if (typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);

    if (looksLikeTrade(value)) output.push(value);
    keys.forEach((key) => {
      if (value[key] != null) queue.push({ value: value[key], depth: depth + 1 });
    });
  }

  return output;
}

function sameTrade(left, right) {
  if (!left || !right) return false;
  if (left.id != null && right.id != null && String(left.id) === String(right.id)) {
    return true;
  }
  return Boolean(
    left.symbol &&
      right.symbol &&
      String(left.symbol).toUpperCase() === String(right.symbol).toUpperCase()
  );
}

function normalizeOpenTrades(historyPayload, livePayload, signalPayload) {
  const history = collectTradeRows(historyPayload).filter(isOpen);
  const supplemental = [
    ...collectTradeRows(livePayload),
    ...collectTradeRows(signalPayload),
  ]
    .map((trade) => ({ ...trade, status: trade?.status || "OPEN" }))
    .filter(isOpen);

  const merged = history.map((trade) => {
    const matching = supplemental.filter((candidate) => sameTrade(trade, candidate));
    return matching.reduce(
      (result, candidate) => ({ ...result, ...candidate, status: "OPEN" }),
      { ...trade, status: "OPEN" }
    );
  });

  supplemental.forEach((trade) => {
    const existingIndex = merged.findIndex((candidate) => sameTrade(candidate, trade));
    if (existingIndex >= 0) {
      merged[existingIndex] = { ...merged[existingIndex], ...trade, status: "OPEN" };
    } else {
      merged.push({ ...trade, status: "OPEN" });
    }
  });

  const deduped = [];
  merged.forEach((trade) => {
    const existingIndex = deduped.findIndex((candidate) => sameTrade(candidate, trade));
    if (existingIndex >= 0) {
      deduped[existingIndex] = { ...deduped[existingIndex], ...trade };
    } else {
      deduped.push(trade);
    }
  });

  deduped.sort((left, right) => {
    const leftSlot = number(left?.capital_slot, 99);
    const rightSlot = number(right?.capital_slot, 99);
    if (leftSlot !== rightSlot) return leftSlot - rightSlot;
    const leftTime = parseDate(left?.entry_time || left?.created_at)?.getTime() || 0;
    const rightTime = parseDate(right?.entry_time || right?.created_at)?.getTime() || 0;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return number(left?.id, 0) - number(right?.id, 0);
  });

  return deduped;
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

function livePrice(trade) {
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

function TradeCard({ trade, index, total, busyId, onExit }) {
  const id = tradeId(trade);
  const pnl = tradePnl(trade);
  const slot = number(trade?.capital_slot, index + 1);
  const allocation = number(
    trade?.allocation_pct,
    slot === 1 ? 50 : slot === 2 ? 40 : 0
  );
  const mode = String(trade?.trading_mode || "paper").toUpperCase();
  const busy = busyId === id;

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.panel,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.green + "66",
        padding: 12,
        marginTop: 11,
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
          `TRADE ${index + 1} OF ${total} • SLOT ${slot}${allocation ? ` (${allocation}%)` : ""}`
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
      value: `${price(trade?.entry_price)} • ${timeLabel(
        trade?.entry_time || trade?.created_at
      )} IST`,
    }),
    React.createElement(DataRow, {
      label: "Live Price",
      value: price(livePrice(trade)),
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
            `⛔ EXIT THIS TRADE (${index + 1}/${total})`
          )
    )
  );
}

function DirectMultiTradePanel() {
  const [trades, setTrades] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState("");
  const [error, setError] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState(null);
  const requestRef = React.useRef(false);
  const aliveRef = React.useRef(true);
  const appStateRef = React.useRef(AppState.currentState);

  const refresh = React.useCallback(async (showLoader = false) => {
    if (requestRef.current || appStateRef.current !== "active") return;
    requestRef.current = true;
    if (showLoader && aliveRef.current) setLoading(true);
    try {
      const token = await AsyncStorage.getItem("saas_token");
      if (!token) throw new Error("Login session nahi mili.");
      const [history, live, signal] = await Promise.all([
        loadHistory(token),
        apiGet("/bot/trade-live", token).catch(() => null),
        apiGet("/bot/signal", token).catch(() => null),
      ]);
      const next = normalizeOpenTrades(history, live, signal);
      if (aliveRef.current) {
        setTrades(next);
        setUpdatedAt(new Date());
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
      if (trade?.id == null || busyId) return;
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
          livePrice(trade)
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
      __okaiDirectMultiOpenPanelV3: true,
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
            ? `${trades.length} open positions • Har trade ka apna Exit button • Updated ${timeLabel(
                updatedAt
              )} IST`
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
          React.createElement(TradeCard, {
            key: tradeId(trade),
            trade,
            index,
            total: trades.length,
            busyId,
            onExit: confirmExit,
          })
        )
      : React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 12 } },
          loading
            ? "Open trades load ho rahi hain..."
            : "Abhi koi active trade nahi hai. Sirf fully qualified signal par nayi trade create hogi."
        )
  );
}

function collectText(value, output = [], depth = 0) {
  if (value == null || value === false || depth > 16) return output;
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
  return output;
}

function signature(value) {
  return collectText(value)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isLegacyActiveTradeCard(type, props) {
  if (
    typeof type !== "function" ||
    props?.__okaiDirectMultiOpenPanelV3 ||
    props?.__okaiFinalMultiOpenPanel ||
    props?.__okaiMultiOpenTradeCard
  ) {
    return false;
  }
  const text = signature(props?.children);
  const hasTitle =
    text.includes("active paper trade") ||
    text.includes("active live trade");
  const hasLegacyBody =
    text.includes("live price + sl refresh together") ||
    text.includes("closed trade ko active position") ||
    (text.includes("side / quantity") && text.includes("live sl"));
  return hasTitle && hasLegacyBody;
}

function patchJsxRuntime(runtime) {
  if (!runtime) return;
  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__okaiDirectMultiTradeV3) return;
    const wrapped = function okaiDirectMultiTradeJsx(type, props, reactKey, ...rest) {
      if (isLegacyActiveTradeCard(type, props || {})) {
        return previous(
          DirectMultiTradePanel,
          { __okaiDirectMultiOpenPanelV3: true },
          reactKey,
          ...rest
        );
      }
      return previous(type, props, reactKey, ...rest);
    };
    wrapped.__okaiDirectMultiTradeV3 = true;
    runtime[key] = wrapped;
  });
}

function installDirectActiveTradeCardV3() {
  if (installed || React.__OKAI_DIRECT_MULTI_TRADE_CARD_V3__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiDirectMultiTradeCreateElement(
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

    if (isLegacyActiveTradeCard(type, suppliedProps)) {
      return previousCreateElement(DirectMultiTradePanel, {
        __okaiDirectMultiOpenPanelV3: true,
      });
    }
    return previousCreateElement(type, suppliedProps);
  };

  try {
    patchJsxRuntime(require("react/jsx-runtime"));
  } catch (_) {}
  try {
    patchJsxRuntime(require("react/jsx-dev-runtime"));
  } catch (_) {}

  React.__OKAI_DIRECT_MULTI_TRADE_CARD_V3__ = true;
}

module.exports = {
  installDirectActiveTradeCardV3,
  normalizeOpenTrades,
  DIRECT_MULTI_TRADE_CARD_V3_MARKER: "OKAI-DIRECT-MULTI-TRADE-CARD-V3",
};
