const assert = require("assert");
const {
  enrichNewsPayload,
  PATCH_MARKER,
} = require("../src/runtime/HindiNewsResponsePatch");

const titles = [
  "Iran Ridicules Trump Warnings as Psychological Warfare After He Cancels Planned Strikes",
  "Saudi Crown Prince MBS urges Trump to prioritise dialogue in US - Iran war | US - Israel war on Iran News",
  "Trump : Iran strikes to stop after parameters reached to end war",
  "Trump Says He Will Order Halt to Iran Strikes After Parameters Reached for Deal to End War",
  "Trump says he will order halt to Iran strikes after parameters reached for deal to end war",
];

const input = {
  success: true,
  current_news: {
    top_headlines: titles.map((title) => ({ title, direction: "PE" })),
  },
};

const output = enrichNewsPayload(input);
const headlines = output.current_news.top_headlines;

assert.strictEqual(headlines.length, titles.length);
headlines.forEach((headline, index) => {
  assert(
    /[\u0900-\u097F]/.test(String(headline.title_hi || "")),
    `Headline ${index + 1} must have a Hindi title_hi value`
  );
  assert.strictEqual(headline.title, titles[index]);
});
assert.strictEqual(
  output.current_news.headline_language_support.source,
  PATCH_MARKER
);
assert.strictEqual(
  output.current_news.headline_language_support.translated_count,
  titles.length
);

console.log("PASS OKAI-HINDI-NEWS-RESPONSE-PATCH-V1");
