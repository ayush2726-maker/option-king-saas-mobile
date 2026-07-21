from pathlib import Path

path = Path("App.js")
app = path.read_text(encoding="utf-8")


def replace_once(old, new, label):
    global app
    if old not in app:
        raise RuntimeError(f"{label} marker not found")
    app = app.replace(old, new, 1)


replace_once(
    '''  function tradeExit(t) {
    return t.exit_price ?? t.exit ?? "--";
  }

  return (
''',
    '''  function tradeExit(t) {
    return t.exit_price ?? t.exit ?? "--";
  }

  const autoIndexBreakdown = (() => {
    if (instrument !== "AUTO") return [];
    const symbols = ["NIFTY", "BANKNIFTY", "SENSEX"];
    const rows = Object.fromEntries(symbols.map((symbol) => [symbol, {
      instrument: symbol,
      tested_days: 0,
      candles: 0,
      generated_trades: 0,
      selected_trades: 0,
      max_score: null,
      volume_available_days: 0,
      volume_neutral_days: 0,
    }]));

    for (const day of result?.days || []) {
      const per = day?.per_instrument || {};
      for (const symbol of symbols) {
        const info = per?.[symbol];
        if (!info || typeof info !== "object") continue;
        const row = rows[symbol];
        row.tested_days += 1;
        row.candles += Number(info.candles || 0);
        row.generated_trades += Number(info.trades || 0);
        row.selected_trades += Number(info.selected_trades || 0);
        if (info.max_score != null) {
          row.max_score = row.max_score == null
            ? Number(info.max_score)
            : Math.max(row.max_score, Number(info.max_score));
        }
        if (info.volume_available === true) row.volume_available_days += 1;
        if (info.volume_available === false) row.volume_neutral_days += 1;
      }
    }
    return symbols.map((symbol) => rows[symbol]);
  })();

  return (
''',
    "AUTO breakdown computation",
)

replace_once(
    '''      {isMonthlyResult && result?.days?.length > 0 && (
        <Card>
''',
    '''      {isMonthlyResult && instrument === "AUTO" && autoIndexBreakdown.some(
        (row) => row.tested_days > 0
      ) && (
        <Card glow={C.blue}>
          <Text style={{
            color: C.text,
            fontSize: 16,
            fontWeight: "900",
            marginBottom: 5,
          }}>
            📊 AUTO Index Breakdown
          </Text>
          <Text style={{
            color: C.muted,
            fontSize: 10,
            lineHeight: 16,
            marginBottom: 11,
          }}>
            Generated = index strategy ne banayi trades • Selected = overlap hata kar monthly result me li gayi trades
          </Text>

          {autoIndexBreakdown.map((row) => (
            <View
              key={row.instrument}
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Row style={{ justifyContent: "space-between" }}>
                <Text style={{ color: C.text, fontWeight: "900", fontSize: 13 }}>
                  {row.instrument}
                </Text>
                <Tag
                  label={`Selected ${row.selected_trades}`}
                  color={row.selected_trades > 0 ? C.green : C.gold}
                />
              </Row>
              <Text style={{ color: C.sub, fontSize: 10, marginTop: 6 }}>
                Generated {row.generated_trades} • Max Score {row.max_score ?? "--"} • Candles {row.candles}
              </Text>
              <Text style={{ color: C.muted, fontSize: 9, marginTop: 4 }}>
                Volume: {row.volume_available_days > 0
                  ? `${row.volume_available_days} day available`
                  : row.volume_neutral_days > 0
                  ? `${row.volume_neutral_days} day neutral fallback`
                  : "not reported"}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {isMonthlyResult && result?.days?.length > 0 && (
        <Card>
''',
    "AUTO breakdown card",
)

path.write_text(app, encoding="utf-8")
print("AUTO index breakdown UI patch applied")
