const fs = require("fs");

const app = fs.readFileSync("App.js", "utf8");
const card = fs.readFileSync("src/components/IndexReportCard.js", "utf8");

if (!app.includes('require("./src/components/IndexReportCard").default')) {
  throw new Error("IndexReportCard import missing");
}
if (!app.includes("<IndexReportCard token={token} />")) {
  throw new Error("IndexReportCard is not mounted in TradeTab");
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

console.log("Index report card UI contract OK");
