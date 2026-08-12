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
  "MISSED-TRADE AI V2 • APPLIED",
  "मिस्ड-ट्रेड AI V2 • लागू है",
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

const appSource = fs.readFileSync(path.resolve(__dirname, "../App.js"), "utf8");
[
  "MISSED-TRADE-AI-V2",
  "Retrying app update",
  "Update check failed • TAP TO RETRY",
  "AppState.addEventListener",
].forEach((marker) => {
  if (!appSource.includes(marker)) {
    throw new Error(`Missing reliable OTA marker: ${marker}`);
  }
});

console.log("PASS OKAI-MISSED-TRADE-LEARNING-UI-V2");
