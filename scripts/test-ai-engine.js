const { evaluateMarket } = require("../src/ai");

const cases = [
  {
    name: "Bullish setup",
    snapshot: {
      symbol: "NIFTY",
      feedConnected: true,
      feedAgeMs: 500,
      price: 24520,
      ema20: 24505,
      ema50: 24472,
      vwap: 24490,
      adx: 31,
      rsi: 61,
      atrPercent: 0.42,
      volumeRatio: 1.45,
      spreadPercent: 0.18,
      supertrend: "BULLISH",
      structure: "BULLISH",
      mtfDirection: "BULLISH",
      mtfConfirmed: true,
      marketOpen: true,
    },
  },
  {
    name: "Bearish setup",
    snapshot: {
      symbol: "NIFTY",
      feedConnected: true,
      feedAgeMs: 700,
      price: 24380,
      ema20: 24405,
      ema50: 24442,
      vwap: 24420,
      adx: 29,
      rsi: 39,
      atrPercent: 0.48,
      volumeRatio: 1.35,
      spreadPercent: 0.2,
      supertrend: "BEARISH",
      structure: "BEARISH",
      mtfDirection: "BEARISH",
      mtfConfirmed: true,
      marketOpen: true,
    },
  },
  {
    name: "Stale feed blocked",
    snapshot: {
      symbol: "NIFTY",
      feedConnected: true,
      feedAgeMs: 9000,
      price: 24500,
      spreadPercent: 0.2,
      marketOpen: true,
    },
  },
];

for (const item of cases) {
  const result = evaluateMarket(item.snapshot);
  console.log(`\n=== ${item.name} ===`);
  console.log(JSON.stringify(result.prediction, null, 2));
}
