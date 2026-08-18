const fs = require("fs");

const source = fs.readFileSync("App.js", "utf8");

const required = [
  'apiGet("/bot/trade-history", token)',
  "const authoritativeLedger = signal?.ledger || serverLedger;",
  "const authoritativeToday = signal?.today || authoritativeLedger?.today || serverTodayLedger;",
  "authoritativeLedger?.realized_pnl",
  "authoritativeLedger?.current_capital",
];

for (const value of required) {
  if (!source.includes(value)) {
    throw new Error(`Missing authoritative ledger binding: ${value}`);
  }
}

const botTab = source.slice(source.indexOf("function BotTab"), source.indexOf("function BacktestTab"));
if (botTab.includes('apiGet("/history/paper", token)')) {
  throw new Error("Bot dashboard still reads the legacy paper-history ledger");
}

console.log("Authoritative dashboard ledger sync verified.");
