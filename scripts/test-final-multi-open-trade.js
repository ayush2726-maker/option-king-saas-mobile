const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.js"), "utf8");
const patch = fs.readFileSync(
  path.join(root, "src/runtime/FinalMultiOpenTradeScreenV2.js"),
  "utf8"
);

function requireMarker(source, marker, label) {
  if (!source.includes(marker)) {
    throw new Error(`${label} missing marker: ${marker}`);
  }
}

requireMarker(index, "installFinalMultiOpenTradeScreenV2", "final runtime install");
requireMarker(patch, "normalizeOpenTrades", "all open trade normalization");
requireMarker(patch, 'apiGet("/bot/trade-live"', "live trade refresh");
requireMarker(patch, 'loadHistory(token)', "trade history refresh");
requireMarker(patch, "trades.map((trade, index)", "separate card per open trade");
requireMarker(patch, "TradePositionCard", "per-trade card");
requireMarker(patch, "__okaiPerTradeExitButton", "scoped exit button marker");
requireMarker(patch, "JSON.stringify({ trade_id: trade.id })", "scoped trade id exit");
requireMarker(patch, "Sirf ye trade exit hogi", "selected trade confirmation");
requireMarker(patch, "shouldHideGlobalExit", "floating exit suppression");
requireMarker(patch, "exit trade now", "legacy floating button signature");
requireMarker(patch, "__okaiFinalMultiOpenInjected", "final render-tree injection");
requireMarker(
  patch,
  "OKAI-FINAL-MULTI-OPEN-TRADE-CARDS-V2",
  "runtime release marker"
);

const appLoad = index.indexOf("require('./AppTradeExplanationPatched')");
const finalInstall = index.indexOf("installFinalMultiOpenTradeScreenV2();");
if (appLoad < 0 || finalInstall < 0 || finalInstall <= appLoad) {
  throw new Error("Final multi-open runtime must install after all app wrappers load");
}

if (patch.includes('JSON.stringify({ trade_id: trades[0].id })')) {
  throw new Error("Exit must use the pressed card trade, never the first trade");
}

console.log("Final multi-open trade cards and per-trade exit checks passed");
