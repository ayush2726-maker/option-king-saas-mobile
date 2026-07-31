const React = require("react");
const {
  ActivityIndicator,
  Alert,
  AppState,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const POLL_MS = 3000;

const C = {
  card: "#13131f",
  card2: "#0f0f1a",
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

function rowValue(trade, key, fallback = null) {
  const value = trade?.[key];
  return value == null ? fallback : value;
}

function tradePnl(trade) {
  return number(
    trade?.net_pnl ?? trade?.unrealized_pnl ?? trade?.pnl,
    0
  );
}

function tradeId(trade) {
  return String(trade?.id ?? `${trade?.symbol || "trade"}-${trade?.created_at || ""}`);
}

function normalizeOpenTrades(history, live) {
  const rows = Array.isArray(history?.paper_trades)
    ? history.paper_trades
    : Array.isArray(history?.trades)
    ? history.trades
    : [];

  const open = rows.filter(
    (trade) => String(trade?.status || "").toUpperCase() === "OPEN"
  );

  const liveRows = Array.isArray(live?.trades)
    ? live.trades
    : live?.open && live?.trade
    ? [live.trade]
    : [];

  const merged = open.map((trade) => {
    const match = liveRows.find(
      (candidate) =>
        (candidate?.id != null &&
          trade?.id != null &&
          String(candidate.id) === String(trade.id)) ||
        (candidate?.symbol &&
          trade?.symbol &&
          String(candidate.symbol) === String(trade.symbol))
    );
    return match ? { ...trade, ...match } : trade;
  });

  for (const liveTrade of liveRows) {
    const exists = merged.some(
      (trade) => tradeId(trade) === tradeId(liveTrade)
    );
    if (
      !exists &&
      String(liveTrade?.status || "").toUpperCase() === "OPEN"
    ) {
      merged.push(liveTrade);
    }
  }

  merged.sort((a, b) => {
    const slotA = number(a?.capital_slot, 99);
    const slotB = number(b?.capital_slot, 99);
    if (slotA !== slotB) return slotA - slotB;
    return number(a?.id, 0) - number(b?.id, 0);
  });
  return merged;
}

async function readJson(response) {
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    throw new Error("Server response read nahi hui.");
  }
  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.message || data?.detail || "Server request failed."
    );
  }
  return data;
}

async function loadHistory(token) {
  try {
    const response = await fetch(SAAS_URL + "/bot/trade-history", {
      headers: { Authorization: "Bearer " + token },
    });
    return await readJson(response);
  } catch (_) {
    const response = await fetch(SAAS_URL + "/history/paper", {
      headers: { Authorization: "Bearer " + token },
    });
    return await readJson(response);
  }
}

async function loadLive(token) {
  const response = await fetch(SAAS_URL + "/bot/trade-live", {
    headers: { Authorization: "Bearer " + token },
  });
  return await readJson(response);
}

function ValueRow({ label, value, color = C.text }) {
  return React.createElement(
    View,
    {
      style: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      },
    },
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 13 } },
      label
    ),
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

function SelectorButton({ label, disabled, onPress }) {
  return React.createElement(
    TouchableOpacity,
    {
      disabled,
      onPress,
      activeOpacity: 0.8,
      style: {
        minWidth: 38,
        height: 34,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: disabled ? C.border : C.blue + "88",
        backgroundColor: disabled ? C.card2 : C.blue + "18",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
      },
    },
    React.createElement(
      Text,
      {
        style: {
          color: disabled ? C.muted : C.blue,
          fontWeight: "900",
          fontSize: 13,
        },
      },
      label
    )
  );
}

function MultiActiveTradesCard({
  trades,
  selectedIndex,
  setSelectedIndex,
  refreshing,
  busyId,
  onRefresh,
  onExit,
}) {
  const count = trades.length;
  const safeIndex = count ? Math.min(selectedIndex, count - 1) : 0;
  const trade = count ? trades[safeIndex] : null;
  const pnl = tradePnl(trade);
  const mode = String(trade?.trading_mode || "paper").toLowerCase();
  const isLive = mode === "live";
  const currentId = trade ? tradeId(trade) : "";

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: count ? C.green + "66" : C.border,
        padding: 16,
        marginBottom: 12,
        shadowColor: count ? C.green : C.blue,
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
          marginBottom: 10,
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 10 } },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 20, fontWeight: "900" } },
          `🧾 Active ${isLive ? "Live" : "Paper"} Trades`
        ),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 10, marginTop: 4 } },
          count
            ? `${count} open position${count > 1 ? "s" : ""} • Har trade ka alag Exit button`
            : "Abhi koi active trade nahi hai."
        )
      ),
      React.createElement(
        TouchableOpacity,
        {
          onPress: onRefresh,
          disabled: refreshing,
          style: { paddingVertical: 7, paddingLeft: 8 },
        },
        refreshing
          ? React.createElement(ActivityIndicator, {
              color: C.blue,
              size: "small",
            })
          : React.createElement(
              Text,
              { style: { color: C.blue, fontWeight: "900" } },
              "Refresh"
            )
      )
    ),
    count > 1
      ? React.createElement(
          View,
          {
            style: {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: C.card2,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              padding: 8,
              marginBottom: 10,
            },
          },
          React.createElement(SelectorButton, {
            label: "‹",
            disabled: safeIndex <= 0,
            onPress: () => setSelectedIndex(Math.max(0, safeIndex - 1)),
          }),
          React.createElement(
            View,
            { style: { alignItems: "center", flex: 1, paddingHorizontal: 8 } },
            React.createElement(
              Text,
              { style: { color: C.text, fontWeight: "900", fontSize: 12 } },
              `Trade ${safeIndex + 1} / ${count}`
            ),
            React.createElement(
              Text,
              {
                numberOfLines: 1,
                style: { color: C.muted, fontSize: 9, marginTop: 2 },
              },
              trade?.symbol || "Open trade"
            )
          ),
          React.createElement(SelectorButton, {
            label: "›",
            disabled: safeIndex >= count - 1,
            onPress: () =>
              setSelectedIndex(Math.min(count - 1, safeIndex + 1)),
          })
        )
      : null,
    !trade
      ? React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 13, lineHeight: 19 } },
          "Sirf fully qualified signal par nayi trade create hogi."
        )
      : React.createElement(
          View,
          null,
          React.createElement(ValueRow, {
            label: "Symbol",
            value: trade?.symbol || "--",
          }),
          React.createElement(ValueRow, {
            label: "Side / Qty",
            value: `${trade?.side || "--"} / ${trade?.qty ?? "--"}`,
          }),
          React.createElement(ValueRow, {
            label: "Entry",
            value: price(trade?.entry_price),
          }),
          React.createElement(ValueRow, {
            label: "Live Price",
            value: price(
              rowValue(
                trade,
                "live_price",
                rowValue(trade, "current_price", rowValue(trade, "last_ltp"))
              )
            ),
            color: C.green,
          }),
          React.createElement(ValueRow, {
            label: "Live SL",
            value: price(trade?.sl_price),
            color: C.red,
          }),
          React.createElement(ValueRow, {
            label: "Net P&L",
            value: money(pnl, true),
            color: pnl >= 0 ? C.green : C.red,
          }),
          trade?.total_charges != null
            ? React.createElement(ValueRow, {
                label: "Est. Charges",
                value: money(trade.total_charges),
                color: C.gold,
              })
            : null,
          React.createElement(
            TouchableOpacity,
            {
              onPress: () => onExit(trade),
              disabled: busyId === currentId,
              activeOpacity: 0.85,
              style: {
                marginTop: 14,
                minHeight: 48,
                borderRadius: 13,
                backgroundColor: C.red + "dd",
                borderWidth: 1,
                borderColor: "#ff6b82",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              },
            },
            busyId === currentId
              ? React.createElement(ActivityIndicator, {
                  color: "#ffffff",
                  size: "small",
                })
              : React.createElement(
                  Text,
                  {
                    style: {
                      color: "#ffffff",
                      fontWeight: "900",
                      fontSize: 13,
                    },
                  },
                  `⛔ EXIT THIS TRADE${count > 1 ? ` (${safeIndex + 1}/${count})` : ""}`
                )
          )
        )
  );
}

function textFromNode(node) {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(textFromNode).join(" ");
  if (React.isValidElement(node)) {
    return textFromNode(node.props?.children);
  }
  return "";
}

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function replaceActiveCard(node, replacement, state) {
  if (node == null || node === false) return node;
  if (Array.isArray(node)) {
    return node.map((item) => replaceActiveCard(item, replacement, state));
  }
  if (!React.isValidElement(node)) return node;

  const name = componentName(node.type);
  const text = textFromNode(node);
  if (
    !state.replaced &&
    name === "Card" &&
    (text.includes("Active Paper Trade") || text.includes("Active Live Trade"))
  ) {
    state.replaced = true;
    return replacement;
  }

  const children = React.Children.toArray(node.props?.children);
  if (!children.length) return node;
  const nextChildren = children.map((child) =>
    replaceActiveCard(child, replacement, state)
  );
  return React.cloneElement(node, undefined, ...nextChildren);
}

function prependWhenCardNotFound(tree, replacement) {
  if (!React.isValidElement(tree)) {
    return React.createElement(View, { style: { flex: 1 } }, replacement, tree);
  }
  const children = React.Children.toArray(tree.props?.children);
  return React.cloneElement(tree, undefined, replacement, ...children);
}

function MultiTradeAwareLiveScoreTab({
  __okaiOriginalLiveScoreType: Original,
  ...props
}) {
  const token = props?.token;
  const [trades, setTrades] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const [busyId, setBusyId] = React.useState("");
  const aliveRef = React.useRef(true);
  const requestRef = React.useRef(false);
  const appStateRef = React.useRef(AppState.currentState);

  const refreshTrades = React.useCallback(
    async (showLoader = false) => {
      if (!token || requestRef.current || appStateRef.current !== "active") {
        return;
      }
      requestRef.current = true;
      if (showLoader && aliveRef.current) setRefreshing(true);
      try {
        const [history, live] = await Promise.all([
          loadHistory(token),
          loadLive(token).catch(() => null),
        ]);
        const next = normalizeOpenTrades(history, live);
        if (aliveRef.current) {
          setTrades(next);
          setSelectedIndex((current) =>
            next.length ? Math.min(current, next.length - 1) : 0
          );
        }
      } catch (_) {
        // Original Trade tab remains visible if this focused multi-trade read fails.
      } finally {
        requestRef.current = false;
        if (showLoader && aliveRef.current) setRefreshing(false);
      }
    },
    [token]
  );

  React.useEffect(() => {
    aliveRef.current = true;
    appStateRef.current = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") refreshTrades(false);
    });
    refreshTrades(true);
    const timer = setInterval(() => refreshTrades(false), POLL_MS);
    return () => {
      aliveRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [refreshTrades]);

  const executeExit = React.useCallback(
    async (trade) => {
      const id = tradeId(trade);
      if (!token || !trade?.id || busyId) return;
      setBusyId(id);
      try {
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
          data?.success ? "Trade Exited" : "Exit Not Confirmed",
          data?.message || `${trade?.symbol || "Selected trade"} exit request complete.`
        );
        await refreshTrades(false);
      } catch (error) {
        Alert.alert(
          "Exit Failed",
          error?.message || "Selected trade ka exit confirm nahi hua."
        );
      } finally {
        if (aliveRef.current) setBusyId("");
      }
    },
    [token, busyId, refreshTrades]
  );

  const confirmExit = React.useCallback(
    (trade) => {
      if (!trade || busyId) return;
      const live =
        trade?.live_price ??
        trade?.current_price ??
        trade?.last_ltp ??
        trade?.entry_price;
      Alert.alert(
        "Exit This Trade?",
        `${trade?.symbol || "Selected trade"}\nLive: ${price(live)}\n\nSirf ye selected trade exit hogi.`,
        [
          { text: "Cancel", style: "cancel" },
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

  // The original component is called unconditionally so its hook order remains
  // stable. We only replace its first Active Trade card; score/history stay intact.
  const originalTree = Original({
    ...props,
    __okaiMultiTradeBypass: true,
  });

  const replacement = React.createElement(MultiActiveTradesCard, {
    trades,
    selectedIndex,
    setSelectedIndex,
    refreshing,
    busyId,
    onRefresh: () => refreshTrades(true),
    onExit: confirmExit,
  });

  const state = { replaced: false };
  const transformed = replaceActiveCard(originalTree, replacement, state);
  return state.replaced
    ? transformed
    : prependWhenCardNotFound(transformed, replacement);
}

function sourceOf(type) {
  try {
    return Function.prototype.toString.call(type);
  } catch (_) {
    return "";
  }
}

function isLiveScoreTradeTab(type, props) {
  if (!type || typeof type !== "function" || props?.__okaiMultiTradeBypass) {
    return false;
  }
  const name = componentName(type);
  if (name === "LiveScoreTradeTab") return true;
  const source = sourceOf(type);
  return (
    source.includes("LiveStrategyScoreCard") &&
    source.includes("Trade History") &&
    source.includes("Active Paper Trade")
  );
}

function shouldHideGlobalManualExit(type) {
  return componentName(type) === "ManualExitOverlay";
}

function installMultiOpenTradeEnhancement() {
  if (installed || React.__OKAI_MULTI_OPEN_TRADE_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiMultiOpenTradeCreateElement(
    type,
    props,
    ...children
  ) {
    if (shouldHideGlobalManualExit(type)) return null;
    if (isLiveScoreTradeTab(type, props)) {
      return previousCreateElement(MultiTradeAwareLiveScoreTab, {
        ...(props || {}),
        __okaiOriginalLiveScoreType: type,
      });
    }
    return previousCreateElement(type, props, ...children);
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;
      jsxRuntime[key] = function okaiMultiOpenTradeJsx(
        type,
        props,
        reactKey
      ) {
        if (shouldHideGlobalManualExit(type)) return null;
        if (isLiveScoreTradeTab(type, props)) {
          return previous(
            MultiTradeAwareLiveScoreTab,
            {
              ...(props || {}),
              __okaiOriginalLiveScoreType: type,
            },
            reactKey
          );
        }
        return previous(type, props, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_MULTI_OPEN_TRADE_PATCHED__ = true;
}

module.exports = { installMultiOpenTradeEnhancement };
