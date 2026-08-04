from pathlib import Path

APP_PATH = Path("App.js")
MARKER = "OKAI-MULTI-ACTIVE-TRADE-TAB-V7"
START_MARKER = "// ── Trade Tab ────────────────────────────────────────"
END_MARKER = "\n\nfunction HeroZeroTab"


def main() -> None:
    text = APP_PATH.read_text(encoding="utf-8")
    if MARKER in text:
        print(f"{MARKER} already present")
        return

    start = text.find(START_MARKER)
    end = text.find(END_MARKER, start + 1)
    if start < 0 or end < 0:
        raise SystemExit("TradeTab source markers were not found")

    replacement = r'''// ── Trade Tab ────────────────────────────────────────
// OKAI-MULTI-ACTIVE-TRADE-TAB-V7
function TradeTab({ token }) {
  const [signal, setSignal] = useState(null);
  const [history, setHistory] = useState([]);
  const [openTrades, setOpenTrades] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyTradeId, setBusyTradeId] = useState("");
  const requestRef = useRef(false);

  function explicitTradeId(trade) {
    return trade?.id ?? trade?.trade_id ?? trade?.position_id ?? null;
  }

  function tradeIdentity(trade, index = 0) {
    const id = explicitTradeId(trade);
    if (id != null) return `id:${String(id)}`;
    return [
      "fallback",
      String(trade?.symbol || "TRADE").toUpperCase(),
      String(trade?.capital_slot ?? ""),
      String(trade?.entry_time || trade?.created_at || ""),
      String(trade?.entry_price ?? ""),
      String(trade?.qty ?? ""),
      String(index),
    ].join("|");
  }

  function parseTradeTime(value) {
    if (!value) return 0;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  function collectTradeRows(payload) {
    const output = [];
    const queue = [{ value: payload, depth: 0 }];
    const visited = new Set();
    const keys = [
      "trade", "active_trade", "latest_trade", "trades", "paper_trades",
      "history", "active_trades", "active_positions", "open_positions",
      "positions", "data", "portfolio", "auto_portfolio"
    ];

    while (queue.length) {
      const { value, depth } = queue.shift();
      if (value == null || depth > 5) continue;
      if (Array.isArray(value)) {
        value.forEach(item => queue.push({ value: item, depth: depth + 1 }));
        continue;
      }
      if (typeof value !== "object" || visited.has(value)) continue;
      visited.add(value);

      const looksLikeTrade = Boolean(
        value.symbol &&
        (explicitTradeId(value) != null || value.qty != null || value.entry_price != null)
      );
      if (looksLikeTrade) output.push(value);

      keys.forEach(key => {
        if (value[key] != null) queue.push({ value: value[key], depth: depth + 1 });
      });
    }
    return output;
  }

  function isOpenTrade(trade, supplemental = false) {
    const status = String(trade?.status || "").toUpperCase();
    if (status) return status === "OPEN";
    return supplemental && Boolean(
      trade?.symbol &&
      (trade?.live_price != null || trade?.current_price != null || trade?.ltp != null)
    );
  }

  function sameTrade(left, right) {
    if (!left || !right) return false;
    const leftId = explicitTradeId(left);
    const rightId = explicitTradeId(right);
    if (leftId != null && rightId != null) {
      return String(leftId) === String(rightId);
    }

    const leftSymbol = String(left?.symbol || "").toUpperCase();
    const rightSymbol = String(right?.symbol || "").toUpperCase();
    if (!leftSymbol || leftSymbol !== rightSymbol) return false;

    const leftSlot = left?.capital_slot;
    const rightSlot = right?.capital_slot;
    if (leftSlot != null && rightSlot != null) {
      return String(leftSlot) === String(rightSlot);
    }

    const leftTime = String(left?.entry_time || left?.created_at || "");
    const rightTime = String(right?.entry_time || right?.created_at || "");
    if (leftTime && rightTime) return leftTime === rightTime;

    return (
      left?.entry_price != null &&
      right?.entry_price != null &&
      Number(left.entry_price) === Number(right.entry_price) &&
      Number(left?.qty || 0) === Number(right?.qty || 0)
    );
  }

  function normalizeOpenTrades(historyPayloads, supplementalPayloads) {
    const primary = historyPayloads
      .flatMap(payload => collectTradeRows(payload))
      .filter(trade => isOpenTrade(trade, false));

    const supplemental = supplementalPayloads
      .flatMap(payload => collectTradeRows(payload))
      .map(trade => ({ ...trade, status: trade?.status || "OPEN" }))
      .filter(trade => isOpenTrade(trade, true));

    const merged = [];
    primary.forEach(trade => {
      const existingIndex = merged.findIndex(candidate => sameTrade(candidate, trade));
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...trade, status: "OPEN" };
      } else {
        merged.push({ ...trade, status: "OPEN" });
      }
    });

    supplemental.forEach(trade => {
      const existingIndex = merged.findIndex(candidate => sameTrade(candidate, trade));
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...trade, status: "OPEN" };
      } else {
        merged.push({ ...trade, status: "OPEN" });
      }
    });

    merged.sort((left, right) => {
      const leftSlot = Number(left?.capital_slot ?? 99);
      const rightSlot = Number(right?.capital_slot ?? 99);
      if (leftSlot !== rightSlot) return leftSlot - rightSlot;
      const leftTime = parseTradeTime(left?.entry_time || left?.created_at);
      const rightTime = parseTradeTime(right?.entry_time || right?.created_at);
      if (leftTime !== rightTime) return leftTime - rightTime;
      return Number(explicitTradeId(left) || 0) - Number(explicitTradeId(right) || 0);
    });

    return merged;
  }

  function uniqueHistoryRows(payloads) {
    const rows = payloads.flatMap(payload => collectTradeRows(payload));
    const result = [];
    rows.forEach((trade, index) => {
      const id = explicitTradeId(trade);
      const found = result.findIndex((candidate, candidateIndex) => {
        const candidateId = explicitTradeId(candidate);
        if (id != null && candidateId != null) return String(id) === String(candidateId);
        return tradeIdentity(candidate, candidateIndex) === tradeIdentity(trade, index);
      });
      if (found >= 0) result[found] = { ...result[found], ...trade };
      else result.push(trade);
    });
    result.sort((a, b) => parseTradeTime(b?.entry_time || b?.created_at) - parseTradeTime(a?.entry_time || a?.created_at));
    return result;
  }

  async function loadTrade() {
    if (requestRef.current) return;
    requestRef.current = true;
    setLoading(true);
    setMsg("");
    try {
      const [sigResult, paperResult, botHistoryResult, liveResult] = await Promise.allSettled([
        apiGet("/bot/signal", token),
        apiGet("/history/paper", token),
        apiGet("/bot/trade-history", token),
        apiGet("/bot/trade-live", token),
      ]);

      const sig = sigResult.status === "fulfilled" ? (sigResult.value || {}) : {};
      const paperHistory = paperResult.status === "fulfilled" ? (paperResult.value || {}) : {};
      const botHistory = botHistoryResult.status === "fulfilled" ? (botHistoryResult.value || {}) : {};
      const live = liveResult.status === "fulfilled" ? (liveResult.value || {}) : {};

      setSignal(sig);
      setOpenTrades(normalizeOpenTrades([paperHistory, botHistory], [live, sig]));
      setHistory(uniqueHistoryRows([paperHistory, botHistory]));
    } catch (error) {
      setMsg("Trade data load failed: " + String(error?.message || error));
    } finally {
      requestRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrade();
    const timer = setInterval(loadTrade, 3000);
    return () => clearInterval(timer);
  }, []);

  function livePrice(trade) {
    return trade?.live_price ?? trade?.current_price ?? trade?.last_ltp ?? trade?.ltp ?? trade?.entry_price;
  }

  function pnlValue(trade) {
    const value = Number(trade?.net_pnl ?? trade?.unrealized_pnl ?? trade?.pnl ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  function money(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "--";
    return `₹${parsed.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function timeLabel(value) {
    if (!value) return "--:--";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "--:--";
    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  }

  async function executeManualExit(trade) {
    const tradeId = explicitTradeId(trade);
    if (tradeId == null || busyTradeId) return;
    setBusyTradeId(String(tradeId));
    try {
      const result = await apiPostAuth("/bot/manual-exit", { trade_id: tradeId }, token);
      if (result?.success === false) throw new Error(result?.message || result?.detail || "Exit failed");
      Alert.alert("Trade Exited", result?.message || `${trade?.symbol || "Selected trade"} exit ho gayi.`);
      await loadTrade();
    } catch (error) {
      Alert.alert("Exit Failed", String(error?.message || error || "Trade exit nahi hui"));
    } finally {
      setBusyTradeId("");
    }
  }

  function confirmManualExit(trade) {
    const tradeId = explicitTradeId(trade);
    if (tradeId == null) {
      Alert.alert("Exit unavailable", "Is trade ka trade_id nahi mila.");
      return;
    }
    Alert.alert(
      "Exit This Trade?",
      `${trade?.symbol || "Selected trade"}\nQty: ${trade?.qty ?? "--"}\nLive: ${money(livePrice(trade))}\n\nSirf selected trade exit hogi.`,
      [
        { text: "CANCEL", style: "cancel" },
        { text: "EXIT THIS TRADE", style: "destructive", onPress: () => executeManualExit(trade) },
      ]
    );
  }

  const isLiveMode = openTrades.some(trade => String(trade?.trading_mode || "").toLowerCase() === "live") ||
    String(signal?.trading_mode || "paper").toLowerCase() === "live";

  return (
    <ScrollView
      __okaiManualExitInjectedV5={true}
      __okaiFinalMultiOpenInjected={true}
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={loadTrade} tintColor={C.blue} colors={[C.blue]} />}>

      <Card
        __okaiDirectMultiOpenPanelV3={true}
        glow={openTrades.length > 0 ? C.green : C.blue}>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: "900" }}>
              🧾 {isLiveMode ? "Active Live Trades" : "Active Paper Trades"} ({openTrades.length})
            </Text>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
              Har open trade alag card me • Live price, SL aur P&L 3 sec me refresh
            </Text>
          </View>
          <TouchableOpacity onPress={loadTrade} disabled={loading}>
            <Text style={{ color: C.blue, fontWeight: "900" }}>
              {loading ? "Loading..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </Row>

        {openTrades.length === 0 && (
          <Text style={{ color: C.muted, fontSize: 13 }}>
            Abhi koi active trade nahi hai. Score 82+ hone par real signal ke basis par trade create hogi.
          </Text>
        )}

        {openTrades.map((trade, index) => {
          const id = tradeIdentity(trade, index);
          const pnl = pnlValue(trade);
          const busy = busyTradeId === String(explicitTradeId(trade));
          const slot = trade?.capital_slot ?? index + 1;
          const allocation = trade?.allocation_pct ?? (Number(slot) === 1 ? 50 : Number(slot) === 2 ? 40 : null);

          return (
            <View key={`${id}-${index}`} style={{
              backgroundColor: C.s1,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: pnl >= 0 ? C.green + "66" : C.red + "66",
              padding: 13,
              marginTop: 12,
            }}>
              <Row style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ color: C.blue, fontSize: 11, fontWeight: "900" }}>
                    TRADE {index + 1} OF {openTrades.length} • SLOT {slot}{allocation != null ? ` (${allocation}%)` : ""}
                  </Text>
                  <Text style={{ color: C.text, fontSize: 15, fontWeight: "900", marginTop: 5 }}>
                    {trade?.symbol || `OPEN TRADE ${index + 1}`}
                  </Text>
                </View>
                <Tag label="OPEN" color={C.green} />
              </Row>

              {[
                ["Side / Quantity", `${trade?.side || "--"} / ${trade?.qty ?? "--"}`, C.text],
                ["Entry / Time", `${money(trade?.entry_price)} • ${timeLabel(trade?.entry_time || trade?.created_at)} IST`, C.text],
                ["Live Price", money(livePrice(trade)), C.green],
                ["Live SL", money(trade?.sl_price), C.red],
                ["Target", money(trade?.target_price), C.green],
                ["Net P&L", `${pnl >= 0 ? "+" : ""}${money(pnl)}`, pnl >= 0 ? C.green : C.red],
                ["Est. Charges", money(trade?.total_charges), C.gold],
              ].map(([label, value, color]) => (
                <Row key={label} style={{ justifyContent: "space-between", paddingVertical: 8,
                  borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
                  <Text style={{ color, fontWeight: "900", fontSize: 13, maxWidth: "69%", textAlign: "right" }}>
                    {value}
                  </Text>
                </Row>
              ))}

              {!!trade?.reason && (
                <View style={{ marginTop: 10, backgroundColor: C.s2, borderRadius: 10,
                  borderWidth: 1, borderColor: C.border, padding: 10 }}>
                  <Text style={{ color: C.blue, fontWeight: "900", fontSize: 12, marginBottom: 5 }}>
                    Why Trade Taken
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 11, lineHeight: 17 }}>
                    {trade.reason}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                __okaiPerTradeExitButton={true}
                onPress={() => confirmManualExit(trade)}
                disabled={busy || explicitTradeId(trade) == null}
                activeOpacity={0.84}
                style={{
                  minHeight: 50,
                  borderRadius: 13,
                  marginTop: 12,
                  backgroundColor: C.red,
                  borderWidth: 1,
                  borderColor: "#ff91a1",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: busy || explicitTradeId(trade) == null ? 0.55 : 1,
                }}>
                {busy
                  ? <ActivityIndicator color="#ffffff" />
                  : <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                      ⛔ EXIT THIS TRADE ({index + 1}/{openTrades.length})
                    </Text>}
              </TouchableOpacity>
            </View>
          );
        })}

        {!!msg && (
          <Text style={{ color: C.red, marginTop: 10, fontWeight: "900" }}>{msg}</Text>
        )}
      </Card>

      <Card>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
          📜 Trade History
        </Text>

        {history.length === 0 && (
          <Text style={{ color: C.muted }}>Abhi trade history nahi hai.</Text>
        )}

        {history.slice(0, 20).map((trade, index) => (
          <View key={`${tradeIdentity(trade, index)}-history-${index}`}
            style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Text style={{ color: C.text, fontWeight: "900" }}>{trade?.symbol || "--"}</Text>
              <Text style={{ color: String(trade?.status).toUpperCase() === "OPEN" ? C.green : C.gold, fontWeight: "900" }}>
                {trade?.status || "--"}
              </Text>
            </Row>

            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
              {trade?.side || "--"} • Qty {trade?.qty ?? "--"} • Entry {money(trade?.entry_price)} • Exit {money(trade?.exit_price)}
            </Text>

            <Text style={{
              color: pnlValue(trade) >= 0 ? C.green : C.red,
              fontWeight: "900",
              marginTop: 4
            }}>
              P&L {money(trade?.pnl ?? trade?.net_pnl ?? 0)} • {trade?.reason || ""}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}'''

    APP_PATH.write_text(text[:start] + replacement + text[end:], encoding="utf-8")
    print(f"Installed {MARKER}")


if __name__ == "__main__":
    main()
