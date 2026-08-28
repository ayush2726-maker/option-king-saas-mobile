const fs = require("fs");

const app = fs.readFileSync("App.js", "utf8");
const runtimeTrade = fs.readFileSync(
  "src/runtime/TradeStatusEnhancement.js",
  "utf8"
);
const entry = fs.readFileSync("index.js", "utf8");
const card = fs.readFileSync("src/components/IndexReportCard.js", "utf8");

if (!app.includes('require("./src/components/IndexReportCard").default')) {
  throw new Error("Base TradeTab IndexReportCard import missing");
}
if (!app.includes("<IndexReportCard token={token} />")) {
  throw new Error("Base TradeTab IndexReportCard mount missing");
}
if (
  !runtimeTrade.includes(
    'const IndexReportCardModule = require("../components/IndexReportCard");'
  )
) {
  throw new Error("Enhanced TradeTab IndexReportCard import missing");
}
if (!runtimeTrade.includes("React.createElement(IndexReportCard, { token })")) {
  throw new Error("IndexReportCard is not mounted in the visible enhanced TradeTab");
}
if (
  entry.includes("installFinalDecisionReasonPanelV1") ||
  entry.includes("FinalDecisionReasonPanelV1")
) {
  throw new Error("Final Decision Reason runtime patch must stay disabled");
}
[
  "/bot/index-report-card?mode=all",
  "Aaj Tak Index Report Card",
  "BANKNIFTY ki new entries OFF",
  "realized_pnl",
  "win_rate",
  "average_pnl",
].forEach((value) => {
  if (!card.includes(value)) {
    throw new Error("Missing report-card contract: " + value);
  }
});

console.log("Visible index report card and removed decision panel contract OK");
