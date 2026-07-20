from pathlib import Path

path = Path("App.js")
app = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global app
    if old not in app:
        raise RuntimeError(f"{label} marker not found")
    app = app.replace(old, new, 1)


replace_once(
    '''  const [chartInstrument, setChartInstrument] = useState("NIFTY");
  const chartInstrumentRef = useRef("NIFTY");
  const chartSelectionInitializedRef = useRef(false);
  const [chartLoading, setChartLoading] = useState(false);
''',
    '''  const [chartInstrument, setChartInstrument] = useState("NIFTY");
  const chartInstrumentRef = useRef("NIFTY");
  const chartSelectionInitializedRef = useRef(false);
  const [chartRangeDays, setChartRangeDays] = useState(1);
  const chartRangeRef = useRef(1);
  const [chartLoading, setChartLoading] = useState(false);
''',
    "chart range state",
)

replace_once(
    '''      const chart = await apiGet(
        `/bot/chart-data?instrument=${encodeURIComponent(selected)}`,
        token
      );
''',
    '''      const chart = await apiGet(
        `/bot/chart-data?instrument=${encodeURIComponent(selected)}&days=${chartRangeRef.current}`,
        token
      );
''',
    "chart range API",
)

replace_once(
    '''      const hist = await apiGet(
        "/bot/signal-history?limit=200",
        token
      );
      if (hist && hist.points) {
        setHistory(hist.points);
      }

      await loadChart(
        chartInstrumentRef.current,
        true
      );

      const trades = await apiGet("/history/paper", token);
      if (trades && trades.paper_trades) setPaperTrades(trades.paper_trades);
''',
    '''      if (!silent || chartRangeRef.current === 1) {
        const historyLimit = chartRangeRef.current === 1 ? 600 : 6000;
        const hist = await apiGet(
          `/bot/signal-history?limit=${historyLimit}&days=${chartRangeRef.current}&instrument=${encodeURIComponent(chartInstrumentRef.current)}`,
          token
        );
        if (hist && hist.points) {
          setHistory(hist.points);
        }

        await loadChart(
          chartInstrumentRef.current,
          true
        );

        const trades = await apiGet("/history/paper", token);
        if (trades && trades.paper_trades) setPaperTrades(trades.paper_trades);
      }
''',
    "history range load",
)

replace_once(
    '''  async function setChartOnly(sym) {
    if (!settings) return;

    if (
      !(settings.enabled_instruments || [])
        .includes(sym)
    ) {
      return;
    }

    chartInstrumentRef.current = sym;
    setChartInstrument(sym);
    setChartCandles([]);
    setChartMeta({
      instrument: sym,
      status: "LOADING",
      message: `${sym} chart load ho raha hai...`,
    });

    await loadChart(sym);
  }
''',
    '''  async function setChartOnly(sym) {
    if (!settings) return;

    if (
      !(settings.enabled_instruments || [])
        .includes(sym)
    ) {
      return;
    }

    chartInstrumentRef.current = sym;
    setChartInstrument(sym);
    setChartCandles([]);
    setHistory([]);
    setChartMeta({
      instrument: sym,
      range_days: chartRangeRef.current,
      status: "LOADING",
      message: `${sym} chart load ho raha hai...`,
    });

    await load(false);
  }

  async function selectChartRange(days) {
    const nextDays = Number(days || 1);
    if (![1, 7, 30].includes(nextDays)) return;
    chartRangeRef.current = nextDays;
    setChartRangeDays(nextDays);
    setChartCandles([]);
    setHistory([]);
    setChartMeta({
      instrument: chartInstrumentRef.current,
      range_days: nextDays,
      status: "LOADING",
      message: `${nextDays === 1 ? "Today" : `${nextDays} days`} history load ho rahi hai...`,
    });
    await load(false);
  }
''',
    "range selector function",
)

replace_once(
    '''  const todayIstKey = chartIstDayKey(
    new Date()
  );

  const closedPaperTrades = paperTrades
    .filter((trade) => (
      String(trade?.status || "").toUpperCase()
        !== "OPEN" &&
      Number.isFinite(Number(trade?.pnl))
    ));

  const todayPaperTrades = closedPaperTrades
    .filter((trade) => (
      chartIstDayKey(
        chartTradeTimestamp(trade)
      ) === todayIstKey
    ));

  const pnlSource = (
    todayPaperTrades.length > 0
      ? todayPaperTrades
      : closedPaperTrades
  )
    .slice(0, 40)
    .reverse();
''',
    '''  const todayIstKey = chartIstDayKey(
    new Date()
  );

  const closedPaperTrades = paperTrades
    .filter((trade) => (
      String(trade?.status || "").toUpperCase()
        !== "OPEN" &&
      Number.isFinite(Number(trade?.pnl))
    ));

  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(
    rangeStart.getDate() - Math.max(chartRangeDays - 1, 0)
  );

  const rangePaperTrades = closedPaperTrades
    .filter((trade) => {
      const timestamp = new Date(chartTradeTimestamp(trade));
      return Number.isFinite(timestamp.getTime()) && timestamp >= rangeStart;
    });

  const todayPaperTrades = rangePaperTrades
    .filter((trade) => (
      chartIstDayKey(
        chartTradeTimestamp(trade)
      ) === todayIstKey
    ));

  const pnlSource = rangePaperTrades
    .slice(0, chartRangeDays === 1 ? 80 : 500)
    .reverse();
''',
    "P&L range",
)

replace_once(
    '''  const displayCandles =
    aggregateChartCandles(
      chartCandles,
      3
    );
''',
    '''  const displayCandles =
    aggregateChartCandles(
      chartCandles,
      chartRangeDays === 1 ? 3 : 1
    );
''',
    "candle aggregation range",
)

# Add graph range card before chart cards.
replace_once(
    '''      <Btn label={hi ? "Status Refresh Karo" : "Refresh Status"} icon="🔄" color={C.blue} loading={loading} onPress={load} />

      {/* Detailed intraday charts */}
''',
    '''      <Btn label={hi ? "Status Refresh Karo" : "Refresh Status"} icon="🔄" color={C.blue} loading={loading} onPress={load} />

      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 15, fontWeight: "900", marginBottom: 4 }}>
          📅 {hi ? "Graph History" : "Graph History"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 10, lineHeight: 16, marginBottom: 11 }}>
          {hi
            ? "Aaj ya pichhle 7/30 din ka Score, Price aur P&L data dekho."
            : "View Score, Price and P&L for today or the previous 7/30 days."}
        </Text>
        <Row style={{ gap: 8 }}>
          {[
            [1, hi ? "AAJ" : "TODAY"],
            [7, "7 DAYS"],
            [30, "30 DAYS"],
          ].map(([days, label]) => {
            const active = chartRangeDays === days;
            return (
              <TouchableOpacity
                key={days}
                disabled={chartLoading || loading}
                onPress={() => selectChartRange(days)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: active ? C.blue + "28" : C.s2,
                  borderWidth: 1,
                  borderColor: active ? C.blue : C.border,
                  opacity: chartLoading || loading ? 0.65 : 1,
                }}>
                <Text style={{
                  color: active ? C.blue : C.muted,
                  fontSize: 10,
                  fontWeight: "900",
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Row>
        <Text style={{ color: C.muted, fontSize: 9, marginTop: 9, textAlign: "center" }}>
          {chartLoading
            ? "History load ho rahi hai..."
            : `${chartMeta?.count || chartCandles.length || 0} candles • ${chartMeta?.source || "LIVE"}`}
        </Text>
      </Card>

      {/* Detailed intraday charts */}
''',
    "graph range UI",
)

replace_once(
    '''              3-minute candles • Swipe left/right
''',
    '''              {chartRangeDays === 1
                ? "3-minute candles • Swipe left/right"
                : `${String(chartMeta?.interval || "HISTORICAL").replaceAll("_", " ")} • Last ${chartRangeDays} days`}
''',
    "price range subtitle",
)

replace_once(
    '''              {todayPaperTrades.length > 0
                ? "Today cumulative"
                : "Recent cumulative"}
''',
    '''              {chartRangeDays === 1
                ? "Today cumulative"
                : `Last ${chartRangeDays} days cumulative`}
''',
    "P&L subtitle",
)

path.write_text(app, encoding="utf-8")
print("Historical graph mobile patch applied")
