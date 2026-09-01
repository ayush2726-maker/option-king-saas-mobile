const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/screens/AdvancedAiTabScreen.js"),
  "utf8"
);

const required = [
  "recent_limit=${missedLimit}",
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
  "missed.recent.map((item, index) =>",
  "Load 20 more",
  "recent_pagination",
];

required.forEach((marker) => {
  if (!source.includes(marker)) {
    throw new Error(`Missing missed-trade UI marker: ${marker}`);
  }
});

if (source.includes("missed.recent.slice(0, 5).map")) {
  throw new Error("Missed-trade list must not be capped at five rows");
}

if (!source.includes("Trade blocking OFF") || !source.includes("Order execution OFF")) {
  throw new Error("Existing monitor-only safety copy must remain visible");
}

const appSource = fs.readFileSync(path.resolve(__dirname, "../App.js"), "utf8");

// Runtime OTA polling is intentionally disabled. CI/EAS still publishes OTA,
// but App.js must not poll/download/reload updates while the user is active.
[
  "MISSED-TRADE-AI-V2",
  "OKAI-INAPP-OTA-DISABLED-V2",
  "function OtaStatusBanner()",
].forEach((marker) => {
  if (!appSource.includes(marker)) {
    throw new Error(`Missing disabled OTA marker: ${marker}`);
  }
});

const otaStart = appSource.indexOf("function OtaStatusBanner()");
const otaEnd = appSource.indexOf("// ── Main App", otaStart);
if (otaStart < 0 || otaEnd < 0) {
  throw new Error("OTA banner block not found");
}
const otaBlock = appSource.slice(otaStart, otaEnd);
[
  "checkForUpdateAsync",
  "fetchUpdateAsync",
  "reloadAsync",
  "AppState.addEventListener",
  "checkOta(",
].forEach((forbidden) => {
  if (otaBlock.includes(forbidden)) {
    throw new Error(`In-app OTA polling must stay disabled: ${forbidden}`);
  }
});
if (!otaBlock.includes("return null;")) {
  throw new Error("OTA banner must remain inert");
}

console.log("PASS OKAI-MISSED-TRADE-LEARNING-UI-V3");
