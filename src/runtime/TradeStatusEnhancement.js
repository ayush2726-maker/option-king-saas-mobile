const React = require("react");
const {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const {
  updateTradeLiveSnapshot,
  useTradeLiveSnapshot,
} = require("./TradeLivePriceEnhancement");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  bg: "#0a0a0f",
  card: "#13131f",
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

async function apiGet(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    throw new Error(`Invalid server response for ${path}`);
  }
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || data?.detail || `Request failed: ${path}`);
  }
  return data;
}

async function loadHistory(token) {
  try {
    return await apiGet("/bot/trade-history", token);
  } catch (_) {
    const legacy = await apiGet("/history/paper", token);
    return {
      ...legacy,
      paper_trades: Array.isArray(legacy?.paper_trades)
        ? legacy.paper_trades
        : [],
    };
  }
}

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
  if (
    /^\d{4}-\d{2}-\d{2}T/.test(text) &&
    !/(Z|[+-]\d{2}:?\d{2})$/.test(text)
  ) {
    text += "Z";
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function istParts(value) {
  const parsed = parseBackendDate(value);
  if (!parsed) return null;
  const ist = new Date(parsed.getTime() + 330 * 60 * 1000);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    day: ist.getUTCDate(),
    hour: ist.getUTCHours(),
    minute: ist.getUTCMinutes(),
  };
}

function istDayKey(value) {
  const parts = istParts(value);
  if (!parts) return "";
  return `${parts.year}-${String(parts.month + 1).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function todayIstKey(offsetDays = 0) {
  const now = new Date(Date.now() + 330 * 60 * 1000 + offsetDays * 86400000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function tradeTimestamp(trade, preferExit = false) {
  const exitValue =
    trade?.exit_time || trade?.closed_at || trade?.updated_at || null;
  const entryValue =
    trade?.entry_time ||
    trade?.created_at ||
    trade?.timestamp ||
    trade?.time ||
    trade?.date ||
    null;
  return preferExit ? exitValue || entryValue : entryValue || exitValue;
}

function tradePnl(trade) {
  return number(
    trade?.net_pnl ?? trade?.unrealized_pnl ?? trade?.pnl,
    0
  );
}

function dateLabel(value) {
  const parts = istParts(value);
  if (!parts) return "DATE NOT AVAILABLE";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const key = `${parts.year}-${String(parts.month + 1).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const relative = key === todayIstKey(0)
    ? "TODAY"
    : key === todayIstKey(-1)
    ? "YESTERDAY"
    : "";
  const full = `${String(parts.day).padStart(2, "0")} ${months[parts.month]} ${parts.year}`;
  return relative ? `${relative} • ${full}` : full;
}

function timeLabel(value) {
  const parts = istParts(value);
  if (!parts) return "--:--";
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function Card({ children, glow, style }) {
  return React.createElement(
    View,
    {
      style: [
        {
          backgroundColor: C.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.border,
          padding: 16,
          ...(glow
            ? {
                shadowColor: glow,
                shadowOpacity: 0.22,
                shadowRadius: 10,
                elevation: 7,
              }
            : {}),
        },
        style,
      ],
    },
    children
  );
}

function Row({ children, style }) {
  return React.createElement(
    View,
    { style: [{ flexDirection: "row", alignItems: "center" }, style] },
    children
  );
}

function StatusTag({ label, color }) {
  return React.createElement(
    View,
    {
      style: {
        backgroundColor: color + "20",
        borderColor: color + "66",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 9,
        paddingVertical: 4,
      },
    },
    React.createElement(
      Text,
      { style: { color, fontSize: 10, fontWeight: "900" } },
      label
    )
  );
}

function ValueRow({ label, value, color = C.text }) {
  return React.createElement(
    Row,
    {
      style: {
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      },
    },
    React.createElement(Text, { style: { color: C.muted, fontSize: 13 } }, label),
    React.createElement(
      Text,
      {
        style: {
          color,
          fontSize: 13,
          fontWeight: "900",
          maxWidth: "68%",
          textAlign: "right",
        },
      },
      value
    )
  );
}

function openOnly(trade) {
  return String(trade?.status || "").toUpperCase() === "OPEN"
    ? trade
    : null;
}

function mergeLiveTrade(signalTrade, snapshot) {
  const baseTrade = openOnly(signalTrade);
  const liveTrade = snapshot?.open ? openOnly(snapshot?.trade) : null;
  if (!liveTrade) return baseTrade;
  if (!baseTrade) return liveTrade;

  const sameTrade =
    (liveTrade.id && baseTrade.id && String(liveTrade.id) === String(baseTrade.id)) ||
    (liveTrade.symbol && baseTrade.symbol && String(liveTrade.symbol) === String(baseTrade.symbol));

  return sameTrade ? { ...baseTrade, ...liveTrade } : liveTrade;
}

function EnhancedTradeTab({ token }) {
  const snapshot = useTradeLiveSnapshot();
  const [signal, setSignal] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [msg, setMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const loadTrade = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setMsg("");
    try {
      const [sig, hist, live] = await Promise.all([
        apiGet("/bot/signal", token),
        loadHistory(token),
        apiGet("/bot/trade-live", token),
      ]);
      setSignal(sig || {});
      if (Array.isArray(hist?.paper_trades)) {
        setHistory(hist.paper_trades);
      }
      if (live && typeof live === "object") {
        updateTradeLiveSnapshot(live);
      }
    } catch (error) {
      if (!silent) setMsg(error?.message || "Trade data load failed");
    }
    if (!silent) setLoading(false);
  }, [token]);

  React.useEffect(() => {
    loadTrade(false);
    const timer = setInterval(() => loadTrade(true), 15000);
    return () => clearInterval(timer);
  }, [loadTrade]);

  const trade = mergeLiveTrade(signal?.active_trade, snapshot);
  const isLiveMode = (trade?.trading_mode || signal?.trading_mode || "paper") === "live";
  const pnl = tradePnl(trade);
  const isOpen = !!trade;
  const lastUpdate = snapshot?.as_of ? timeLabel(snapshot.as_of) : "--:--";

  return React.createElement(
    ScrollView,
    {
      style: { flex: 1, backgroundColor: C.bg },
      contentContainerStyle: { padding: 16, gap: 12, paddingBottom: 110 },
      refreshControl: React.createElement(RefreshControl, {
        refreshing: loading,
        onRefresh: () => loadTrade(false),
        tintColor: C.blue,
        colors: [C.blue],
      }),
    },
    React.createElement(
      Card,
      { glow: isOpen ? C.green : C.blue },
      React.createElement(
        Row,
        { style: { justifyContent: "space-between", marginBottom: 10 } },
        React.createElement(
          View,
          { style: { flex: 1, paddingRight: 10 } },
          React.createElement(
            Text,
            { style: { color: C.text, fontSize: 20, fontWeight: "900" } },
            `🧾 ${isLiveMode ? "Active Live Trade" : "Active Paper Trade"}`
          ),
          React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 9, marginTop: 4 } },
            isOpen
              ? `Live price + SL refresh together • Updated ${lastUpdate} IST`
              : "Closed trade ko active position nahi dikhaya jayega."
          )
        ),
        React.createElement(
          TouchableOpacity,
          {
            onPress: () => loadTrade(false),
            disabled: loading,
            style: { paddingVertical: 8, paddingLeft: 8 },
          },
          loading
            ? React.createElement(ActivityIndicator, { color: C.blue, size: "small" })
            : React.createElement(Text, { style: { color: C.blue, fontWeight: "900" } }, "Refresh")
        )
      ),
      !trade
        ? React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 13, lineHeight: 19 } },
            "Abhi koi active trade nahi hai. Sirf fully qualified signal par nayi trade create hogi."
          )
        : React.createElement(
            View,
            null,
            React.createElement(ValueRow, { label: "Symbol", value: trade.symbol || "--" }),
            React.createElement(ValueRow, { label: "Side / Qty", value: `${trade.side || "--"} / ${trade.qty ?? "--"}` }),
            React.createElement(ValueRow, { label: "Entry", value: price(trade.entry_price) }),
            React.createElement(ValueRow, {
              label: "Live Price",
              value: price(trade.live_price ?? trade.current_price),
              color: C.green,
            }),
            React.createElement(ValueRow, {
              label: "Live SL",
              value: price(trade.sl_price),
              color: C.red,
            }),
            React.createElement(ValueRow, { label: "Target", value: price(trade.target_price), color: C.green }),
            React.createElement(ValueRow, {
              label: "Net P&L",
              value: money(pnl, true),
              color: pnl >= 0 ? C.green : C.red,
            }),
            trade?.total_charges != null
              ? React.createElement(ValueRow, {
                  label: "Est. Charges",
                  value: money(trade.total_charges, false),
                  color: C.gold,
                })
              : null,
            React.createElement(ValueRow, {
              label: "Status",
              value: "OPEN",
              color: C.green,
            }),
            trade.reason
              ? React.createElement(
                  Text,
                  { style: { color: C.muted, fontSize: 12, marginTop: 10, lineHeight: 17 } },
                  trade.reason
                )
              : null
          ),
      msg
        ? React.createElement(Text, { style: { color: C.red, marginTop: 10, fontWeight: "900" } }, msg)
        : null
    ),
    React.createElement(
      Card,
      null,
      React.createElement(
        Row,
        { style: { justifyContent: "space-between", marginBottom: 10 } },
        React.createElement(Text, { style: { color: C.text, fontSize: 18, fontWeight: "900" } }, "📜 Trade History"),
        React.createElement(Text, { style: { color: C.muted, fontSize: 10 } }, `${history.length} trades`)
      ),
      history.length === 0
        ? React.createElement(Text, { style: { color: C.muted } }, "History load nahi hui. Pull-down refresh karein.")
        : history.slice(0, 100).map((item, index) => {
            const itemPnl = tradePnl(item);
            const itemStatus = String(item?.status || "--").toUpperCase();
            const entryTime = item?.entry_time || item?.created_at || item?.timestamp || item?.time || item?.date;
            const exitTime = item?.exit_time || item?.closed_at || item?.updated_at;
            const dateSource = tradeTimestamp(item, false);
            return React.createElement(
              View,
              {
                key: item?.id || `${item?.symbol || "trade"}-${index}`,
                style: {
                  paddingVertical: 11,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                },
              },
              React.createElement(
                Row,
                { style: { justifyContent: "space-between", alignItems: "flex-start" } },
                React.createElement(
                  View,
                  { style: { flex: 1, paddingRight: 8 } },
                  React.createElement(Text, { style: { color: C.text, fontWeight: "900", fontSize: 13 } }, item?.symbol || "PAPER TRADE"),
                  React.createElement(
                    Text,
                    { style: { color: C.blue, fontSize: 10, fontWeight: "900", marginTop: 4 } },
                    dateLabel(dateSource)
                  ),
                  React.createElement(
                    Text,
                    { style: { color: C.muted, fontSize: 10, marginTop: 3 } },
                    `Entry ${timeLabel(entryTime)}${exitTime ? ` • Exit ${timeLabel(exitTime)}` : itemStatus === "OPEN" ? " • OPEN" : ""} IST`
                  )
                ),
                React.createElement(StatusTag, {
                  label: itemStatus,
                  color: itemStatus === "OPEN" ? C.green : C.gold,
                })
              ),
              React.createElement(
                Text,
                { style: { color: C.muted, fontSize: 11, marginTop: 6 } },
                `${item?.side || "--"} • Qty ${item?.qty ?? "--"} • Entry ${price(item?.entry_price)} • Exit ${price(item?.exit_price)}`
              ),
              React.createElement(
                Text,
                {
                  style: {
                    color: itemPnl >= 0 ? C.green : C.red,
                    fontWeight: "900",
                    fontSize: 12,
                    marginTop: 4,
                    lineHeight: 17,
                  },
                },
                `${money(itemPnl, true)} NET • ${item?.reason || "--"}`
              )
            );
          })
    )
  );
}

function TodayPerformanceStrip({ token }) {
  const snapshot = useTradeLiveSnapshot();
  const [history, setHistory] = React.useState([]);
  const [serverToday, setServerToday] = React.useState(null);

  const load = React.useCallback(async () => {
    try {
      const data = await loadHistory(token);
      if (Array.isArray(data?.paper_trades)) {
        setHistory(data.paper_trades);
      }
      setServerToday(data?.today || null);
    } catch (_) {}
  }, [token]);

  React.useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const todayKey = todayIstKey(0);
  const todayTrades = history.filter((trade) => {
    const value = tradeTimestamp(trade, false);
    return istDayKey(value) === todayKey;
  });
  const closedToday = todayTrades.filter(
    (trade) => String(trade?.status || "").toUpperCase() !== "OPEN"
  );
  const computedRealized = closedToday.reduce(
    (sum, trade) => sum + tradePnl(trade),
    0
  );
  const computedOpen = snapshot?.open ? tradePnl(snapshot?.trade) : 0;

  const realized = serverToday
    ? number(serverToday.closed_pnl, computedRealized)
    : computedRealized;
  const openPnl = serverToday
    ? number(serverToday.open_pnl, computedOpen)
    : computedOpen;
  const tradeCount = serverToday
    ? number(serverToday.trades, todayTrades.length)
    : todayTrades.length;
  const total = serverToday
    ? number(serverToday.total_pnl, realized + openPnl)
    : realized + openPnl;
  const color = total >= 0 ? C.green : C.red;

  return React.createElement(
    View,
    {
      style: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 2,
        backgroundColor: C.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: color + "66",
        paddingHorizontal: 13,
        paddingVertical: 10,
        shadowColor: color,
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
      },
    },
    React.createElement(
      Row,
      { style: { justifyContent: "space-between" } },
      React.createElement(
        View,
        null,
        React.createElement(Text, { style: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 } }, "TODAY NET P&L"),
        React.createElement(Text, { style: { color, fontSize: 20, fontWeight: "900", marginTop: 2 } }, money(total, true))
      ),
      React.createElement(
        View,
        { style: { alignItems: "flex-end" } },
        React.createElement(Text, { style: { color: C.sub, fontSize: 10, fontWeight: "800" } }, `Trades ${tradeCount}`),
        React.createElement(Text, { style: { color: C.muted, fontSize: 9, marginTop: 3 } }, `Closed ${money(realized, true)} • Open ${money(openPnl, true)}`)
      )
    )
  );
}

function BotWrapper(props) {
  const Original = props.__okaiTodayOriginal;
  const cleanProps = { ...props, __okaiTradeTodayBypass: true };
  delete cleanProps.__okaiTodayOriginal;
  return React.createElement(
    View,
    { style: { flex: 1, backgroundColor: C.bg } },
    React.createElement(TodayPerformanceStrip, { token: cleanProps.token }),
    React.createElement(Original, cleanProps)
  );
}

function componentSource(type) {
  try {
    return Function.prototype.toString.call(type);
  } catch (_) {
    return "";
  }
}

function isTradeTab(type, props) {
  if (!type || typeof type !== "function" || props?.__okaiTradeTodayBypass) return false;
  const name = String(type.displayName || type.name || "");
  if (name === "TradeTab") return true;
  const source = componentSource(type);
  return source.includes("/history/paper") && source.includes("Active Paper Trade") && source.includes("Trade History");
}

function isBotTab(type, props) {
  if (!type || typeof type !== "function" || props?.__okaiTradeTodayBypass) return false;
  const name = String(type.displayName || type.name || "");
  if (name === "BotTab") return true;
  const source = componentSource(type);
  return source.includes("/bot/chart-data") && source.includes("AUTO Portfolio") && source.includes("Bot Status");
}

function installTradeStatusEnhancement() {
  if (installed || React.__OKAI_TRADE_STATUS_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiTradeStatusCreateElement(type, props, ...children) {
    if (isTradeTab(type, props)) {
      return previousCreateElement(EnhancedTradeTab, props || {}, ...children);
    }
    if (isBotTab(type, props)) {
      return previousCreateElement(BotWrapper, { ...(props || {}), __okaiTodayOriginal: type }, ...children);
    }
    return previousCreateElement(type, props, ...children);
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;
      jsxRuntime[key] = function okaiTradeStatusJsx(type, props, reactKey) {
        if (isTradeTab(type, props)) {
          return previous(EnhancedTradeTab, props || {}, reactKey);
        }
        if (isBotTab(type, props)) {
          return previous(BotWrapper, { ...(props || {}), __okaiTodayOriginal: type }, reactKey);
        }
        return previous(type, props, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_TRADE_STATUS_PATCHED__ = true;
}

module.exports = { installTradeStatusEnhancement };
