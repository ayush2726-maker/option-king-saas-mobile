const assert = require("assert");
const {
  directionalMaximum,
  scoreMaximum,
  visibleWarnings,
} = require("../src/runtime/ScoreDisplayScale");

const scan = {
  decision_score: 55,
  min_score: 82,
  profile_weights: {
    vwap: 11,
    supertrend: 11,
    ema_trend: 11,
    orb: 11,
    momentum: 11,
    adx: 20,
    volume: 15,
    mtf: 10,
  },
  profile_enabled: {},
};

assert.strictEqual(scoreMaximum(scan), 100);
assert.strictEqual(directionalMaximum(scan), 55);
assert.strictEqual(scoreMaximum({ min_score: 82 }), 100);
assert.deepStrictEqual(
  visibleWarnings([
    "LIVE_USING_STRATEGY: OKAI Default 82",
    "APPLIED_WEIGHTS: VWAP 11",
    "CONFIG_MATCH: UNKNOWN | ENTRY 82",
    "REAL_BLOCK_REASON",
  ]),
  ["REAL_BLOCK_REASON"]
);

console.log("PASS score maximum is 100 and technical warnings stay hidden");
