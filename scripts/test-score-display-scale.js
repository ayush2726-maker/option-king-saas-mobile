const assert = require("assert");
const {
  directionalMaximum,
  scoreMaximum,
  simpleReasonText,
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
    "AUDIT: INTERNAL CHECK",
    "VOLUME_UNAVAILABLE_NEUTRAL",
    "VOLUME_AVAILABILITY_NORMALIZED:81/92->88/100",
    "VWAP_FALLBACK_ACTIVE:VWAP_CHASE_DISABLED",
  ]),
  [
    "Volume data available nahi hai; neutral score use hua.",
    "Volume data nahi mila, isliye score 81/92 se 88/100 par adjust hua.",
    "VWAP ka backup method active hai; price-chase rule trade ko block nahi karega.",
  ]
);
assert.strictEqual(
  simpleReasonText("POST_ATR_SL_SAME_SIDE_COOLDOWN_15M"),
  "Loss ya SL ke baad isi index aur side me 15 minute ka wait hai."
);
assert.strictEqual(
  simpleReasonText("REAL_BLOCK_REASON"),
  "Real block reason"
);

console.log("PASS score maximum is 100 and reasons use simple language");
