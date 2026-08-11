const assert = require("assert");

const {
  __test: { patchSignalData },
} = require("../src/runtime/StrategyApplyCheckEnhancement");

const profile = {
  profile_key: "okai-default-82",
  name: "OKAI Default 82",
  config: {
    entry_threshold: 82,
    adx_threshold: 25,
    volume_threshold: 1.2,
    weights: {
      vwap: 100,
      supertrend: 0,
      ema_trend: 0,
      orb: 0,
      momentum: 0,
      adx: 0,
      volume: 0,
      mtf: 0,
    },
    enabled: {},
  },
};

function scan(underlying, decision, visual) {
  const components = [
    {
      key: "vwap",
      score: visual,
      display_score: visual,
      decision_score: decision,
      max_score: 100,
      passed: decision > 0,
    },
  ];

  return {
    underlying,
    score: visual,
    decision_score: decision,
    display_score: visual,
    min_score: 82,
    signal_data: {
      score: decision,
      decision_score: decision,
      display_score: visual,
    },
    score_components: components,
    live_score_breakdown: {
      score: visual,
      decision_score: decision,
      display_score: visual,
      components,
    },
  };
}

const patched = patchSignalData(
  {
    score: 69,
    min_score: 82,
    scan_results: [
      scan("NIFTY", 64, 63),
      scan("BANKNIFTY", 76, 69),
      scan("SENSEX", 64, 54),
    ],
  },
  profile
);

assert.deepStrictEqual(
  patched.scan_results.map((item) => item.score),
  [64, 76, 64],
  "all cards must expose the engine decision score as score"
);
assert.deepStrictEqual(
  patched.scan_results.map((item) => item.display_score),
  [63, 69, 54],
  "visual strength must remain available only as display_score"
);

for (const item of patched.scan_results) {
  assert.strictEqual(item.score, item.decision_score);
  assert.strictEqual(item.live_score_breakdown.score, item.decision_score);
  assert.strictEqual(item.signal_data.score, item.decision_score);
}

assert.strictEqual(patched.score, 76);
assert.strictEqual(patched.decision_score, 76);
assert.strictEqual(patched.display_score, 69);

console.log("PASS decision score is identical across Live Score and AUTO Portfolio");
