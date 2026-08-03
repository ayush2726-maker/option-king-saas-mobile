const assert = require("assert");
const {
  enrichNewsPayload,
  enrichNewsPayloadForLanguage,
  PATCH_MARKER,
} = require("../src/runtime/HindiNewsResponsePatch");

const knownTitles = [
  "Iran Ridicules Trump Warnings as Psychological Warfare After He Cancels Planned Strikes",
  "Saudi Crown Prince MBS urges Trump to prioritise dialogue in US - Iran war | US - Israel war on Iran News",
  "Trump : Iran strikes to stop after parameters reached to end war",
  "Trump Says He Will Order Halt to Iran Strikes After Parameters Reached for Deal to End War",
  "Trump says he will order halt to Iran strikes after parameters reached for deal to end war",
];

const knownInput = {
  success: true,
  current_news: {
    top_headlines: knownTitles.map((title) => ({ title, direction: "PE" })),
  },
};

const knownOutput = enrichNewsPayload(knownInput);
const knownHeadlines = knownOutput.current_news.top_headlines;

assert.strictEqual(knownHeadlines.length, knownTitles.length);
knownHeadlines.forEach((headline, index) => {
  assert(
    /[\u0900-\u097F]/.test(String(headline.title_hi || "")),
    `Known headline ${index + 1} must have a Hindi title_hi value`
  );
  assert.strictEqual(headline.title, knownTitles[index]);
});
assert.strictEqual(
  knownOutput.current_news.headline_language_support.source,
  PATCH_MARKER
);

async function run() {
  const liveTitles = [
    "Sudan : The Impact of the U.S.-Iran War On Sudan",
    "China Nostradamu makes chilling US-Iran war prediction as two forecasts come true",
    "Opinion : The War is Coming Home to Russians",
    "Iran déjà vu : Trump once again threatens massive escalation against Tehran only to walk back",
  ];

  const liveInput = {
    success: true,
    current_news: {
      top_headlines: liveTitles.map((title) => ({ title, direction: "PE" })),
    },
  };

  const mockTranslations = new Map(liveTitles.map((title, index) => [
    title,
    `हिंदी समाचार अनुवाद ${index + 1}`,
  ]));

  const mockFetch = async (url) => {
    const parsed = new URL(url);
    const source = parsed.searchParams.get("q");
    const translated = mockTranslations.get(source) || "हिंदी समाचार";
    return {
      ok: true,
      json: async () => [[[translated, source]]],
    };
  };

  const hindiOutput = await enrichNewsPayloadForLanguage(liveInput, "hi", mockFetch);
  const hindiHeadlines = hindiOutput.current_news.top_headlines;
  hindiHeadlines.forEach((headline, index) => {
    assert(
      /[\u0900-\u097F]/.test(String(headline.title || "")),
      `Live headline ${index + 1} must render in Hindi`
    );
    assert.strictEqual(headline.title_original, liveTitles[index]);
    assert.strictEqual(headline.title, headline.title_hi);
  });
  assert.strictEqual(
    hindiOutput.current_news.headline_language_support.rendered_language,
    "hi"
  );
  assert.strictEqual(
    hindiOutput.current_news.headline_language_support.translated_count,
    liveTitles.length
  );

  const englishOutput = await enrichNewsPayloadForLanguage(liveInput, "en", mockFetch);
  englishOutput.current_news.top_headlines.forEach((headline, index) => {
    assert.strictEqual(headline.title, liveTitles[index]);
  });

  console.log("PASS OKAI-HINDI-NEWS-RESPONSE-PATCH-V2");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
