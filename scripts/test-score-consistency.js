const assert = require("assert");
const {
  marketTimeReason,
  marketTimeLabel,
  executionBlockReason,
} = require("../src/runtime/EntryWindowStatus");

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
  [64, 76, 64],
  "every public display score must equal the engine decision score"
);

for (const item of patched.scan_results) {
  assert.strictEqual(item.score, item.decision_score);
  assert.strictEqual(item.live_score_breakdown.score, item.decision_score);
  assert.strictEqual(item.signal_data.score, item.decision_score);
}

assert.strictEqual(patched.score, 76);
assert.strictEqual(patched.decision_score, 76);
assert.strictEqual(patched.display_score, 76);
assert.strictEqual(patched.visual_strength_score, 76);
assert.strictEqual(patched.diagnostic_visual_strength_score, 69);

const normalizedProfile = {
  profile_key: "okai_default_82",
  name: "OKAI Default 82",
  config: {
    entry_threshold: 82,
    adx_threshold: 25,
    volume_threshold: 1.2,
    weights: {
      vwap: 11,
      supertrend: 11,
      ema_trend: 11,
      orb: 11,
      momentum: 11,
      adx: 20,
      volume: 15,
      mtf: 10,
    },
    enabled: {},
  },
};

const normalizedComponents = [
  ["vwap", 11, 11],
  ["supertrend", 11, 11],
  ["ema_trend", 11, 11],
  ["orb", 11, 11],
  ["momentum", 0, 11],
  ["adx", 15, 20],
  ["volume", 7, 7],
  ["availability_normalization", 7, 8],
  ["mtf", 10, 10],
].map(([key, value, max]) => ({
  key,
  score: value,
  decision_score: value,
  max_score: max,
  passed: value > 0,
  preserve_backend_scale:
    key === "volume" || key === "availability_normalization",
  detail:
    key === "volume"
      ? "Index volume unavailable: neutral 7-point contribution"
      : "",
}));

const normalizedScan = {
  underlying: "BANKNIFTY",
  score: 83,
  decision_score: 83,
  min_score: 82,
  volume_ratio: 0,
  score_components: normalizedComponents,
  live_score_breakdown: {
    score: 83,
    decision_score: 83,
    availability_normalized: true,
    components: normalizedComponents,
  },
};

const normalizedPatched = patchSignalData(
  { score: 83, decision_score: 83, scan_results: [normalizedScan] },
  normalizedProfile
);
const normalizedRows = Object.fromEntries(
  normalizedPatched.scan_results[0].score_components.map((item) => [item.key, item])
);

assert.strictEqual(normalizedPatched.score, 83);
assert.strictEqual(normalizedRows.volume.score, 7);
assert.strictEqual(normalizedRows.volume.decision_score, 7);
assert.strictEqual(normalizedRows.volume.max_score, 7);
assert.strictEqual(normalizedRows.availability_normalization.score, 7);
assert.strictEqual(normalizedRows.availability_normalization.max_score, 8);
assert.strictEqual(
  normalizedRows.volume.detail,
  "Index volume unavailable: neutral 7-point contribution"
);
assert.strictEqual(
  normalizedPatched.scan_results[0].live_score_breakdown.decision_component_total,
  83
);

// Explicit UTC timestamps map to the stated IST entry-window boundaries.
assert.strictEqual(marketTimeReason(Date.parse("2026-08-11T09:14:00Z")), "");
assert.strictEqual(
  marketTimeReason(Date.parse("2026-08-11T09:15:00Z")),
  "AUTO_ENTRY_CUTOFF_1445_IST"
);
assert.strictEqual(
  marketTimeReason(Date.parse("2026-08-11T10:00:00Z")),
  "MARKET_CLOSED_AFTER_1530_IST"
);
assert.strictEqual(marketTimeLabel("AUTO_ENTRY_CUTOFF_1445_IST"), "ENTRY CUTOFF");
assert.strictEqual(marketTimeLabel("MARKET_CLOSED_AFTER_1530_IST"), "MARKET CLOSED");
assert.strictEqual(
  executionBlockReason(
    {},
    { execution_block_reason: "SERVER_ENTRY_CLOSED" },
    Date.parse("2026-08-11T04:30:00Z")
  ),
  "SERVER_ENTRY_CLOSED"
);

console.log("PASS decision score is identical across Live Score and AUTO Portfolio");
