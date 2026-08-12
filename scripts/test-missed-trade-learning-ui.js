const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/screens/AdvancedAiTabScreen.js"),
  "utf8"
);

const required = [
  "/bot/ai-missed-trades?recent_limit=8",
  "function normalizeMissedReport(data)",
  "would_have_profited_15m",
  "block_avoided_loss_15m",
  "training_samples_added_15m",
  "MISSED_PROFIT",
  "BLOCK_AVOIDED_LOSS",
  "Counterfactual shadow report only",
  "यह केवल शैडो तुलना है",
  "module.exports.normalizeMissedReport",
];

required.forEach((marker) => {
  if (!source.includes(marker)) {
    throw new Error(`Missing missed-trade UI marker: ${marker}`);
  }
});

if (!source.includes("Trade blocking OFF") || !source.includes("Order execution OFF")) {
  throw new Error("Existing monitor-only safety copy must remain visible");
}

console.log("PASS OKAI-MISSED-TRADE-LEARNING-UI-V1");
