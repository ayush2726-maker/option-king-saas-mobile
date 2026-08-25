const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/screens/AdvancedAiTabScreen.js"),
  "utf8"
);

const required = [
  'fetchJson("/bot/ai-free-indicators")',
  "function normalizeFreeIndicatorReport(data)",
  "free_indicator_available",
  "choppiness_index",
  "squeeze_momentum",
  "squeeze_direction_ce",
  "squeeze_direction_pe",
  "Free AI indicators",
  "मुफ़्त AI इंडिकेटर",
  "FREE • BROKER CANDLES",
  "Baseline strategy unchanged • Trade blocking OFF",
  "बेसलाइन रणनीति में बदलाव नहीं • ट्रेड ब्लॉक बंद",
  "module.exports.normalizeFreeIndicatorReport",
];

required.forEach((marker) => {
  if (!source.includes(marker)) {
    throw new Error(`Missing free-indicator UI marker: ${marker}`);
  }
});

const cardPosition = source.indexOf("`📊 ${copy.freeTitle}`");
const missedPosition = source.indexOf("`🎯 ${copy.missedTitle}`");
if (cardPosition < 0 || missedPosition < 0 || cardPosition > missedPosition) {
  throw new Error("Free indicator card must be visible before missed-trade learning");
}

if (!source.includes("Promise.allSettled")) {
  throw new Error("Indicator request must not prevent the other AI reports from loading");
}

console.log("PASS OKAI-FREE-INDICATORS-UI-V1");
