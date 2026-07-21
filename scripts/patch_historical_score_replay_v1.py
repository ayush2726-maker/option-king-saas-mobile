from pathlib import Path

path = Path("App.js")
app = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global app
    if old not in app:
        raise RuntimeError(f"{label} marker not found")
    app = app.replace(old, new, 1)


replace_once(
    '''  const chartHistory = history
    .filter((point) => (
      Number.isFinite(Number(point?.score)) ||
      Number.isFinite(Number(point?.price))
    ))
    .slice(-80);

  const scorePoints = chartHistory
    .filter((point) =>
      Number.isFinite(Number(point?.score))
    )
    .map((point) => ({
      value: Number(point.score),
      label: chartDateTimeLabel(
        chartPointTimestamp(point)
      ),
    }));
''',
    '''  const chartPointLimit = chartRangeDays === 1 ? 120 : 320;
  const chartHistory = history
    .filter((point) => (
      Number.isFinite(Number(point?.score)) ||
      Number.isFinite(Number(point?.price))
    ))
    .slice(-chartPointLimit);

  const savedScorePoints = chartHistory
    .filter((point) =>
      Number.isFinite(Number(point?.score))
    )
    .map((point) => ({
      value: Number(point.score),
      label: chartDateTimeLabel(
        chartPointTimestamp(point)
      ),
      source: "LIVE_SAVED",
    }));

  const replayScorePoints = chartCandles
    .filter((candle) =>
      Number.isFinite(Number(candle?.score))
    )
    .slice(-chartPointLimit)
    .map((candle) => ({
      value: Number(candle.score),
      label: chartDateTimeLabel(candle.time),
      source: candle.score_source || "HISTORICAL_REPLAY",
      signal: candle.signal || "WAIT",
    }));

  const scorePoints = (
    chartRangeDays > 1 && replayScorePoints.length > 0
      ? replayScorePoints
      : savedScorePoints.length > 0
      ? savedScorePoints
      : replayScorePoints
  );

  const scoreSourceLabel = (
    scorePoints.length > 0 && scorePoints[0]?.source === "HISTORICAL_REPLAY"
      ? "HISTORICAL REPLAY"
      : "LIVE SAVED"
  );
''',
    "score point source fallback",
)

replace_once(
    '''              {`Signal quality • Entry line ${activeEntryThreshold}`}
''',
    '''              {`Signal quality • Entry line ${activeEntryThreshold} • ${scoreSourceLabel}`}
''',
    "score source subtitle",
)

replace_once(
    '''          emptyMessage={
            "Bot start hone aur real signal points aane ke baad score line dikhegi."
          }
''',
    '''          emptyMessage={
            chartRangeDays > 1
              ? "Historical candles par strategy replay score prepare ho raha hai. Pull-down refresh karein."
              : "Bot start hone aur real signal points aane ke baad score line dikhegi."
          }
''',
    "score empty message",
)

replace_once(
    '''            : `${chartMeta?.count || chartCandles.length || 0} candles • ${chartMeta?.source || "LIVE"}`}
''',
    '''            : `${chartMeta?.count || chartCandles.length || 0} candles • ${chartMeta?.score_count || replayScorePoints.length || savedScorePoints.length || 0} score points • ${chartMeta?.source || "LIVE"}`}
''',
    "history card score count",
)

path.write_text(app, encoding="utf-8")
print("Historical score replay mobile patch applied")
