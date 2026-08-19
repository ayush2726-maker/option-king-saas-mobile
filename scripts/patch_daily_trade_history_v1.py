from pathlib import Path

APP = Path("App.js")
MARKER = "OKAI-DAILY-TRADE-HISTORY-V1"

STATE_ANCHOR = '  const [busyTradeId, setBusyTradeId] = useState("");\n'
TIME_ANCHOR = '''  function timeLabel(value) {\n    if (!value) return "--:--";\n    const parsed = new Date(value);\n    if (Number.isNaN(parsed.getTime())) return "--:--";\n    return parsed.toLocaleTimeString("en-IN", {\n      hour: "2-digit",\n      minute: "2-digit",\n      second: "2-digit",\n      hour12: false,\n      timeZone: "Asia/Kolkata",\n    });\n  }\n'''
HISTORY_START = '''      <Card>\n        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>\n          📜 Trade History\n        </Text>\n'''
HISTORY_END = '''      </Card>\n    </ScrollView>\n  );\n}\n'''

HELPERS = r'''

  // OKAI-DAILY-TRADE-HISTORY-V1
  function tradeDateValue(trade) {
    return trade?.exit_time || trade?.closed_at || trade?.entry_time || trade?.created_at || trade?.timestamp || null;
  }

  function istDateKey(value) {
    if (!value) return "UNKNOWN";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10) || "UNKNOWN";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(parsed);
    const lookup = {};
    parts.forEach(part => { if (part.type !== "literal") lookup[part.type] = part.value; });
    return `${lookup.year}-${lookup.month}-${lookup.day}`;
  }

  function dateLabel(dateKey) {
    if (!dateKey || dateKey === "UNKNOWN") return "Unknown Date";
    const parsed = new Date(`${dateKey}T00:00:00+05:30`);
    if (Number.isNaN(parsed.getTime())) return dateKey;
    return parsed.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric"
    });
  }

  function executionCostValue(trade) {
    const candidates = [
      trade?.total_charges,
      trade?.execution_cost,
      trade?.execution_costs,
      trade?.charges,
      trade?.brokerage_and_charges,
    ];
    for (const candidate of candidates) {
      const value = Number(candidate);
      if (Number.isFinite(value)) return Math.max(0, value);
    }
    return 0;
  }

  function buildDailyHistory(rows) {
    const groups = new Map();
    (rows || []).forEach((trade, index) => {
      const key = istDateKey(tradeDateValue(trade));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ trade, index });
    });

    return Array.from(groups.entries()).map(([date, items]) => {
      items.sort((a, b) => parseTradeTime(tradeDateValue(b.trade)) - parseTradeTime(tradeDateValue(a.trade)));
      const trades = items.map(item => item.trade);
      const pnl = trades.reduce((sum, trade) => sum + pnlValue(trade), 0);
      const executionCost = trades.reduce((sum, trade) => sum + executionCostValue(trade), 0);
      const wins = trades.filter(trade => pnlValue(trade) > 0).length;
      const losses = trades.filter(trade => pnlValue(trade) < 0).length;
      return { date, trades, pnl, executionCost, wins, losses };
    }).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }
'''

NEW_HISTORY = r'''      <Card __okaiDailyTradeHistoryV1={true}>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 4 }}>
          📜 Daily Trade History
        </Text>
        <Text style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
          Date par tap karke us din ki poori trades, net P&L aur execution cost dekho.
        </Text>

        {history.length === 0 && (
          <Text style={{ color: C.muted }}>Abhi trade history nahi hai.</Text>
        )}

        {buildDailyHistory(history).map((day) => {
          const expanded = expandedHistoryDate === day.date;
          return (
            <View key={`history-day-${day.date}`} style={{
              backgroundColor: C.s1,
              borderWidth: 1,
              borderColor: day.pnl >= 0 ? C.green + "55" : C.red + "55",
              borderRadius: 14,
              marginTop: 10,
              overflow: "hidden",
            }}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => setExpandedHistoryDate(expanded ? "" : day.date)}
                style={{ padding: 13 }}>
                <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ color: C.text, fontSize: 15, fontWeight: "900" }}>
                      {dateLabel(day.date)}
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
                      {day.trades.length} Trades • {day.wins} Win • {day.losses} Loss
                    </Text>
                  </View>
                  <Text style={{ color: C.blue, fontSize: 16, fontWeight: "900" }}>
                    {expanded ? "▲" : "▼"}
                  </Text>
                </Row>

                <Row style={{ justifyContent: "space-between", marginTop: 10 }}>
                  <View>
                    <Text style={{ color: C.muted, fontSize: 10, fontWeight: "800" }}>NET P&L</Text>
                    <Text style={{ color: day.pnl >= 0 ? C.green : C.red, fontSize: 15, fontWeight: "900", marginTop: 2 }}>
                      {day.pnl >= 0 ? "+" : ""}{money(day.pnl)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: C.muted, fontSize: 10, fontWeight: "800" }}>EXECUTION COST</Text>
                    <Text style={{ color: C.gold, fontSize: 15, fontWeight: "900", marginTop: 2 }}>
                      {money(day.executionCost)}
                    </Text>
                  </View>
                </Row>
              </TouchableOpacity>

              {expanded && (
                <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 12, paddingBottom: 8 }}>
                  {day.trades.map((trade, index) => {
                    const pnl = pnlValue(trade);
                    const cost = executionCostValue(trade);
                    return (
                      <View key={`${tradeIdentity(trade, index)}-${day.date}-${index}`}
                        style={{ paddingVertical: 11, borderBottomWidth: index === day.trades.length - 1 ? 0 : 1, borderBottomColor: C.border }}>
                        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={{ color: C.text, fontWeight: "900", fontSize: 13 }}>
                              {trade?.symbol || "--"}
                            </Text>
                            <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>
                              {trade?.side || "--"} • Qty {trade?.qty ?? "--"} • {timeLabel(tradeDateValue(trade))} IST
                            </Text>
                          </View>
                          <Text style={{ color: String(trade?.status || "CLOSED").toUpperCase() === "OPEN" ? C.green : C.gold, fontWeight: "900", fontSize: 11 }}>
                            {trade?.status || "CLOSED"}
                          </Text>
                        </Row>

                        <Text style={{ color: C.sub, fontSize: 11, marginTop: 6 }}>
                          Entry {money(trade?.entry_price)} • Exit {money(trade?.exit_price)}
                        </Text>
                        <Row style={{ justifyContent: "space-between", marginTop: 6 }}>
                          <Text style={{ color: pnl >= 0 ? C.green : C.red, fontWeight: "900", fontSize: 12 }}>
                            Net P&L {pnl >= 0 ? "+" : ""}{money(pnl)}
                          </Text>
                          <Text style={{ color: C.gold, fontWeight: "900", fontSize: 12 }}>
                            Cost {money(cost)}
                          </Text>
                        </Row>
                        {!!trade?.reason && (
                          <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 6 }}>
                            {trade.reason}
                          </Text>
                        )}
                      </View>
                    );
                  })}

                  <Row style={{ justifyContent: "space-between", paddingTop: 10, paddingBottom: 4 }}>
                    <Text style={{ color: C.sub, fontWeight: "900", fontSize: 11 }}>DAY TOTAL</Text>
                    <Text style={{ color: C.gold, fontWeight: "900", fontSize: 11 }}>
                      Cost {money(day.executionCost)}
                    </Text>
                  </Row>
                  <Text style={{ color: day.pnl >= 0 ? C.green : C.red, fontWeight: "900", fontSize: 13, textAlign: "right" }}>
                    Net P&L {day.pnl >= 0 ? "+" : ""}{money(day.pnl)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </Card>
'''


def main():
    text = APP.read_text(encoding="utf-8")
    if MARKER in text:
        print(f"{MARKER} already installed")
        return

    if STATE_ANCHOR not in text:
        raise SystemExit("TradeTab state anchor not found")
    text = text.replace(
        STATE_ANCHOR,
        STATE_ANCHOR + '  const [expandedHistoryDate, setExpandedHistoryDate] = useState("");\n',
        1,
    )

    if TIME_ANCHOR not in text:
        raise SystemExit("timeLabel anchor not found")
    text = text.replace(TIME_ANCHOR, TIME_ANCHOR + HELPERS, 1)

    start = text.find(HISTORY_START)
    if start < 0:
        raise SystemExit("Trade History card start not found")
    end = text.find(HISTORY_END, start)
    if end < 0:
        raise SystemExit("Trade History card end not found")
    text = text[:start] + NEW_HISTORY + text[end + len('      </Card>\n'):]

    APP.write_text(text, encoding="utf-8")
    print(f"Installed {MARKER}")


if __name__ == "__main__":
    main()
