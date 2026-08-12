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
  "function pnlPresentation(value, copy, net = false)",
  "function MissedOutcomeBadges({ item, copy })",
  "PROFIT (+)",
  "LOSS (-)",
  "NET PROFIT (+)",
  "NET LOSS (-)",
  "[5, 15, 30].map",
  "Hypothetical trade P&L after all costs",
  "candidate_contract",
  "candidate_entry_price",
  "candidate_lot_size",
  "function missedContractTitle(item)",
  "function missedReasonText(value, copy)",
  "OLD RULE REMOVED",
  "Fixed EMA-distance rule no longer blocks new trades",
  "ORB/momentum is no longer mandatory for new trades",
  "shorten(missedReasonText(item.reasons?.[0] || item.decisionKind, copy), 145)",
  "function formatExpiry(value)",
  "function formatCapturedIst(value)",
  "Entry premium",
  "Exact option contract resolving",
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

console.log("PASS OKAI-MISSED-TRADE-LEARNING-UI-V3");
