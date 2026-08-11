from pathlib import Path

PATH = Path("src/runtime/LiveScoreTradeTabEnhancement.js")
source = PATH.read_text(encoding="utf-8")
MARKER = "OKAI-LIVE-SCORE-MULTI-TRADE-V8"

if MARKER in source:
    print(f"{MARKER} already applied")
    raise SystemExit(0)

if "  Alert,\n" not in source:
    source = source.replace(
        "  ActivityIndicator,\n",
        "  ActivityIndicator,\n  Alert,\n",
        1,
    )

start = source.index("function LiveScoreTradeTab({ token }) {")
end = source.index("\nfunction componentSource(type) {", start)

replacement = r'''// OKAI-LIVE-SCORE-MULTI-TRADE-V8
function explicitTradeId(trade) {
  return trade?.id ?? trade?.trade_id ?? trade?.position_id ?? null;
}

function openStatus(trade) {
  return String(trade?.status || "OPEN").toUpperCase() === "OPEN";
}

function livePriceValue(trade) {
  return (
    trade?.live_price ??
    trade?.current_price ??
    trade?.last_ltp ??
    trade?.ltp ??
    trade?.entry_price
  );
}

function tradeIdentityV8(trade, index = 0) {
  const id = explicitTradeId(trade);
  if (id != null) return `id:${String(id)}`;
  return [
    "fallback",
    trade?.symbol || "trade",
    trade?.entry_time || trade?.created_at || trade?.timestamp || "",
    trade?.capital_slot ?? "",
    trade?.qty ?? "",
    index,
  ].join("|");
}

function samePositionV8(left, right) {
  if (!left || !right) return false;
  const leftId = explicitTradeId(left);
  const rightId = explicitTradeId(right);

  // Two different trade IDs are always two different open positions, even when
  // the option symbol is the same (for example repeated entries in one contract).
  if (leftId != null && rightId != null) {
    return String(leftId) === String(rightId);
  }
  if (leftId != null || rightId != null) return false;

  const leftSymbol = String(left?.symbol || "").toUpperCase();
  const rightSymbol = String(right?.symbol || "").toUpperCase();
  if (!leftSymbol || leftSymbol !== rightSymbol) return false;

  const leftTime = String(left?.entry_time || left?.created_at || "");
  const rightTime = String(right?.entry_time || right?.created_at || "");
  if (leftTime && rightTime) return leftTime === rightTime;

  const leftSlot = left?.capital_slot;
  const rightSlot = right?.capital_slot;
  return leftSlot != null && rightSlot != null && String(leftSlot) === String(rightSlot);
}

function historyOpenRowsV8(history) {
  const rows = Array.isArray(history)
    ? history
    : Array.isArray(history?.paper_trades)
    ? history.paper_trades
    : Array.isArray(history?.trades)
    ? history.trades
    : Array.isArray(history?.history)
    ? history.history
    : [];
  return rows.filter(openStatus);
}

function liveRowsV8(payload) {
  const rows = [];
  if (!payload || typeof payload !== "object") return rows;
  for (const key of ["trades", "active_trades", "open_positions", "positions"]) {
    if (Array.isArray(payload?.[key])) rows.push(...payload[key]);
  }
  if (payload?.open && payload?.trade) rows.push(payload.trade);
  if (payload?.active_trade) rows.push(payload.active_trade);
  if (payload?.latest_trade && openStatus(payload.latest_trade)) rows.push(payload.latest_trade);
  return rows.filter(Boolean).filter(openStatus);
}

function mergeOpenPositionsV8(history, livePayload, signal, snapshot) {
  const merged = historyOpenRowsV8(history).map((trade) => ({ ...trade, status: "OPEN" }));
  const supplemental = [
    ...liveRowsV8(livePayload),
    ...liveRowsV8(snapshot),
    ...liveRowsV8(signal),
  ];

  for (const liveTrade of supplemental) {
    const index = merged.findIndex((trade) => samePositionV8(trade, liveTrade));
    if (index >= 0) {
      merged[index] = { ...merged[index], ...liveTrade, status: "OPEN" };
    } else {
      merged.push({ ...liveTrade, status: "OPEN" });
    }
  }

  const deduped = [];
  for (const trade of merged) {
    const id = explicitTradeId(trade);
    const index = id == null
      ? -1
      : deduped.findIndex((candidate) => {
          const candidateId = explicitTradeId(candidate);
          return candidateId != null && String(candidateId) === String(id);
        });
    if (index >= 0) deduped[index] = { ...deduped[index], ...trade, status: "OPEN" };
    else deduped.push(trade);
  }

  deduped.sort((left, right) => {
    const leftSlot = number(left?.capital_slot, 99);
    const rightSlot = number(right?.capital_slot, 99);
    if (leftSlot !== rightSlot) return leftSlot - rightSlot;
    const leftTime = parseBackendDate(left?.entry_time || left?.created_at)?.getTime() || 0;
    const rightTime = parseBackendDate(right?.entry_time || right?.created_at)?.getTime() || 0;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return number(explicitTradeId(left), 0) - number(explicitTradeId(right), 0);
  });
  return deduped;
}

function LiveScoreTradeTab({ token }) {
  const snapshot = useTradeLiveSnapshot();
  const [signal, setSignal] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [livePayload, setLivePayload] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [busyTradeId, setBusyTradeId] = React.useState("");
  const requestRef = React.useRef(false);
  const aliveRef = React.useRef(true);
  const appStateRef = React.useRef(AppState.currentState);
  const initialLoadRef = React.useRef(true);
  const historyLoadedAtRef = React.useRef(0);

  const loadTrade = React.useCallback(async (silent = false) => {
    if (requestRef.current || appStateRef.current !== "active") return;
    requestRef.current = true;
    const showLoader = !silent && !initialLoadRef.current;
    if (showLoader && aliveRef.current) setLoading(true);
    if (!silent && aliveRef.current) setMsg("");

    try {
      if (silent) {
        // The global watcher already refreshes /bot/trade-live. Refresh the
        // strategy snapshot every ten seconds and history only once a minute.
        const refreshHistory =
          Date.now() - historyLoadedAtRef.current >= HISTORY_POLL_MS;
        if (refreshHistory) historyLoadedAtRef.current = Date.now();
        const [sig, hist] = await Promise.all([
          apiGet("/bot/signal", token),
          refreshHistory ? loadHistory(token).catch(() => null) : null,
        ]);
        if (aliveRef.current) {
          setSignal(sig || {});
          const rows = Array.isArray(hist?.paper_trades)
            ? hist.paper_trades
            : Array.isArray(hist?.trades)
            ? hist.trades
            : null;
          if (rows) setHistory(rows);
        }
      } else {
        const [sig, hist, live] = await Promise.all([
          apiGet("/bot/signal", token),
          loadHistory(token).catch(() => null),
          apiGet("/bot/trade-live", token).catch(() => null),
        ]);
        if (aliveRef.current) {
          setSignal(sig || {});
          const rows = Array.isArray(hist?.paper_trades)
            ? hist.paper_trades
            : Array.isArray(hist?.trades)
            ? hist.trades
            : null;
          if (rows) {
            setHistory(rows);
            historyLoadedAtRef.current = Date.now();
          }
          setLivePayload(live || null);
          if (live && typeof live === "object") updateTradeLiveSnapshot(live);
        }
      }
    } catch (error) {
      if (!silent && aliveRef.current) {
        setMsg(error?.message || "Trade data load failed");
      }
    } finally {
      requestRef.current = false;
      initialLoadRef.current = false;
      if (showLoader && aliveRef.current) setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    aliveRef.current = true;
    appStateRef.current = AppState.currentState;
    loadTrade(false);
    const timer = setInterval(() => loadTrade(true), SIGNAL_POLL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      appStateRef.current = state;
      if (state === "active") loadTrade(true);
    });

    return () => {
      aliveRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [loadTrade]);

  const openTrades = React.useMemo(
    () => mergeOpenPositionsV8(history, livePayload, signal, snapshot),
    [history, livePayload, signal, snapshot]
  );
  const isLiveMode = openTrades.some(
    (trade) => String(trade?.trading_mode || "paper").toLowerCase() === "live"
  ) || String(signal?.trading_mode || "paper").toLowerCase() === "live";
  const lastUpdate = timeLabel(
    livePayload?.as_of || livePayload?.updated_at || snapshot?.as_of || signal?.updated_at
  );

  const executeManualExit = React.useCallback(async (trade) => {
    const id = explicitTradeId(trade);
    if (id == null || busyTradeId) return;
    setBusyTradeId(String(id));
    try {
      const response = await fetch(SAAS_URL + "/bot/manual-exit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ trade_id: id }),
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || data?.detail || "Exit failed");
      }
      Alert.alert(
        "Trade Exited",
        data?.message || `${trade?.symbol || "Selected trade"} exit ho gayi.`
      );
      await loadTrade(false);
    } catch (error) {
      Alert.alert("Exit Failed", String(error?.message || error || "Trade exit nahi hui"));
    } finally {
      setBusyTradeId("");
    }
  }, [busyTradeId, loadTrade, token]);

  const confirmManualExit = React.useCallback((trade) => {
    const id = explicitTradeId(trade);
    if (id == null || busyTradeId) {
      if (id == null) Alert.alert("Exit unavailable", "Is trade ka trade_id nahi mila.");
      return;
    }
    Alert.alert(
      "Exit This Trade?",
      `${trade?.symbol || "Selected trade"}\nQty: ${trade?.qty ?? "--"}\nLive: ${price(livePriceValue(trade))}\n\nSirf selected trade exit hogi.`,
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "EXIT THIS TRADE",
          style: "destructive",
          onPress: () => executeManualExit(trade),
        },
      ]
    );
  }, [busyTradeId, executeManualExit]);

  return React.createElement(
    ScrollView,
    {
      __okaiFinalMultiOpenInjected: true,
      __okaiManualExitInjectedV5: true,
      style: { flex: 1, backgroundColor: C.bg },
      contentContainerStyle: { padding: 16, paddingBottom: 120 },
      refreshControl: React.createElement(RefreshControl, {
        refreshing: loading,
        onRefresh: () => loadTrade(false),
        tintColor: C.blue,
        colors: [C.blue],
      }),
    },
    React.createElement(
      Card,
      {
        __okaiDirectMultiOpenPanelV3: true,
        glow: openTrades.length ? C.green : C.blue,
        style: { marginBottom: 12 },
      },
      React.createElement(
        Row,
        { style: { justifyContent: "space-between", marginBottom: 10 } },
        React.createElement(
          View,
          { style: { flex: 1, paddingRight: 10 } },
          React.createElement(
            Text,
            { style: { color: C.text, fontSize: 20, fontWeight: "900" } },
            `🧾 Active ${isLiveMode ? "Live" : "Paper"} Trades (${openTrades.length})`
          ),
          React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 9, marginTop: 4 } },
            openTrades.length
              ? `Har open trade alag card me • Updated ${lastUpdate} IST`
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
      openTrades.length === 0
        ? React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 13, lineHeight: 19 } },
            "Abhi koi active trade nahi hai. Sirf fully qualified signal par nayi trade create hogi."
          )
        : openTrades.map((trade, index) => {
            const pnl = tradePnl(trade);
            const id = explicitTradeId(trade);
            const busy = id != null && busyTradeId === String(id);
            const slot = trade?.capital_slot ?? index + 1;
            const allocation = trade?.allocation_pct ??
              (Number(slot) === 1 ? 50 : Number(slot) === 2 ? 40 : null);
            return React.createElement(
              View,
              {
                key: `${tradeIdentityV8(trade, index)}-${index}`,
                style: {
                  backgroundColor: C.card2,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: pnl >= 0 ? C.green + "66" : C.red + "66",
                  padding: 13,
                  marginTop: 12,
                },
              },
              React.createElement(
                Row,
                { style: { justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 } },
                React.createElement(
                  View,
                  { style: { flex: 1, paddingRight: 8 } },
                  React.createElement(
                    Text,
                    { style: { color: C.blue, fontSize: 11, fontWeight: "900" } },
                    `TRADE ${index + 1} OF ${openTrades.length} • SLOT ${slot}${allocation != null ? ` (${allocation}%)` : ""}`
                  ),
                  React.createElement(
                    Text,
                    { style: { color: C.text, fontSize: 15, fontWeight: "900", marginTop: 5 } },
                    trade?.symbol || `OPEN TRADE ${index + 1}`
                  )
                ),
                React.createElement(StatusTag, { label: "OPEN", color: C.green })
              ),
              React.createElement(ValueRow, {
                label: "Side / Quantity",
                value: `${trade?.side || "--"} / ${trade?.qty ?? "--"}`,
              }),
              React.createElement(ValueRow, {
                label: "Entry / Time",
                value: `${price(trade?.entry_price)} • ${timeLabel(trade?.entry_time || trade?.created_at)} IST`,
              }),
              React.createElement(ValueRow, {
                label: "Live Price",
                value: price(livePriceValue(trade)),
                color: C.green,
              }),
              React.createElement(ValueRow, {
                label: "Live SL",
                value: price(trade?.sl_price),
                color: C.red,
              }),
              React.createElement(ValueRow, {
                label: "Target",
                value: price(trade?.target_price),
                color: C.green,
              }),
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
              React.createElement(ValueRow, { label: "Status", value: "OPEN", color: C.green }),
              React.createElement(WhyTradeMini, { trade }),
              React.createElement(
                TouchableOpacity,
                {
                  __okaiPerTradeExitButton: true,
                  onPress: () => confirmManualExit(trade),
                  disabled: busy || id == null,
                  activeOpacity: 0.84,
                  style: {
                    minHeight: 50,
                    borderRadius: 13,
                    marginTop: 12,
                    backgroundColor: C.red,
                    borderWidth: 1,
                    borderColor: "#ff91a1",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: busy || id == null ? 0.55 : 1,
                  },
                },
                busy
                  ? React.createElement(ActivityIndicator, { color: "#ffffff" })
                  : React.createElement(
                      Text,
                      { style: { color: "#ffffff", fontSize: 13, fontWeight: "900" } },
                      `⛔ EXIT THIS TRADE (${index + 1}/${openTrades.length})`
                    )
              )
            );
          }),
      msg
        ? React.createElement(
            Text,
            { style: { color: C.red, marginTop: 10, fontWeight: "900" } },
            msg
          )
        : null
    ),
    React.createElement(LiveStrategyScoreCard, { signal: signal || {} }),
    React.createElement(TradeHistoryCard, { history })
  );
}
'''

source = source[:start] + replacement + source[end:]

source = source.replace(
    "return previousCreateElement(LiveScoreTradeTab, { ...(props || {}), __okaiLiveScoreBypass: true }, ...children);",
    "return previousCreateElement(LiveScoreTradeTab, { ...(props || {}), __okaiLiveScoreBypass: true, __okaiMultiTradeBypass: true }, ...children);",
)
source = source.replace(
    "return previous(LiveScoreTradeTab, { ...(props || {}), __okaiLiveScoreBypass: true }, reactKey);",
    "return previous(LiveScoreTradeTab, { ...(props || {}), __okaiLiveScoreBypass: true, __okaiMultiTradeBypass: true }, reactKey);",
)

PATH.write_text(source, encoding="utf-8")
print(f"Applied {MARKER} to {PATH}")
