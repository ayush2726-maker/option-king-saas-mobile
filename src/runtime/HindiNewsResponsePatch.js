const { localizeNewsHeadline } = require("../i18n/professionalLocalizer");

const NEWS_MONITOR_PATH = "/bot/ai-news-monitor";
const PATCH_MARKER = "OKAI-HINDI-NEWS-RESPONSE-PATCH-V1";

function containsHindi(value) {
  return /[\u0900-\u097F]/.test(String(value || ""));
}

function firstHindiValue(headline) {
  const candidates = [
    headline?.title_hi,
    headline?.hindi_title,
    headline?.translated_title_hi,
    headline?.translations?.hi,
  ];
  return candidates.find((value) => containsHindi(value)) || "";
}

function enrichNewsPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;

  const currentNews = payload.current_news;
  const rawHeadlines = currentNews?.top_headlines;
  if (!Array.isArray(rawHeadlines) || !rawHeadlines.length) return payload;

  let translatedCount = 0;
  const headlines = rawHeadlines.map((headline) => {
    if (!headline || typeof headline !== "object") return headline;

    const existingHindi = firstHindiValue(headline);
    if (existingHindi) {
      translatedCount += 1;
      return { ...headline, title_hi: String(existingHindi).trim() };
    }

    const original = String(headline.title || "").trim();
    const localHindi = localizeNewsHeadline(original, "hi");
    if (!localHindi || !containsHindi(localHindi)) return headline;

    translatedCount += 1;
    return { ...headline, title_hi: localHindi };
  });

  return {
    ...payload,
    current_news: {
      ...currentNews,
      top_headlines: headlines,
      headline_language_support: {
        ...(currentNews.headline_language_support || {}),
        english: true,
        hindi: true,
        translated_count: translatedCount,
        source: PATCH_MARKER,
        display_only: true,
      },
    },
  };
}

function responseWithJson(response, payload) {
  const jsonText = JSON.stringify(payload);
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    url: response.url,
    redirected: response.redirected,
    type: response.type,
    json: async () => payload,
    text: async () => jsonText,
    clone() {
      return responseWithJson(response, payload);
    },
  };
}

function installHindiNewsResponsePatch() {
  const root = typeof globalThis !== "undefined" ? globalThis : global;
  if (
    !root ||
    root.__OKAI_HINDI_NEWS_RESPONSE_PATCH_V1__ ||
    typeof root.fetch !== "function"
  ) {
    return;
  }

  const previousFetch = root.fetch.bind(root);
  root.fetch = async function okaiHindiNewsFetch(input, init) {
    const response = await previousFetch(input, init);
    const url = String(
      typeof input === "string" ? input : input?.url || response?.url || ""
    );

    if (!url.includes(NEWS_MONITOR_PATH)) return response;

    try {
      const payload = await response.clone().json();
      const enriched = enrichNewsPayload(payload);
      return responseWithJson(response, enriched);
    } catch (_) {
      return response;
    }
  };

  root.__OKAI_HINDI_NEWS_RESPONSE_PATCH_V1__ = true;
}

module.exports = {
  installHindiNewsResponsePatch,
  enrichNewsPayload,
  PATCH_MARKER,
};
