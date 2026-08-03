const AsyncStorageModule = require("@react-native-async-storage/async-storage");
const { localizeNewsHeadline } = require("../i18n/professionalLocalizer");

const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
const NEWS_MONITOR_PATH = "/bot/ai-news-monitor";
const LANGUAGE_KEY = "okai_lang";
const TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
const PATCH_MARKER = "OKAI-HINDI-NEWS-RESPONSE-PATCH-V2";
const translationCache = new Map();

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

async function translateHeadlineToHindi(title, fetchImpl) {
  const original = String(title || "").trim();
  if (!original || containsHindi(original)) return original;

  const localHindi = localizeNewsHeadline(original, "hi");
  if (localHindi && containsHindi(localHindi)) return localHindi;

  if (translationCache.has(original)) return translationCache.get(original);

  try {
    const query = `${TRANSLATE_URL}?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(original)}`;
    const response = await fetchImpl(query, {
      headers: {
        Accept: "application/json,text/plain,*/*",
        "User-Agent": "OptionKingAI-HindiNews/2.0",
      },
    });
    if (!response?.ok) return "";
    const payload = await response.json();
    const translated = Array.isArray(payload?.[0])
      ? payload[0].map((part) => String(part?.[0] || "")).join("").trim()
      : "";
    const safe = translated && containsHindi(translated) ? translated : "";
    if (safe) translationCache.set(original, safe);
    return safe;
  } catch (_) {
    return "";
  }
}

async function enrichNewsPayloadForLanguage(payload, language, fetchImpl) {
  const enriched = enrichNewsPayload(payload);
  if (language !== "hi" || !enriched?.current_news?.top_headlines?.length) {
    return enriched;
  }

  const currentNews = enriched.current_news;
  const headlines = await Promise.all(
    currentNews.top_headlines.map(async (headline, index) => {
      if (!headline || typeof headline !== "object" || index >= 5) return headline;

      const original = String(headline.title || "").trim();
      const existingHindi = firstHindiValue(headline);
      const translated = existingHindi || await translateHeadlineToHindi(original, fetchImpl);
      if (!translated || !containsHindi(translated)) return headline;

      return {
        ...headline,
        title_original: headline.title_original || original,
        title_hi: translated,
        title: translated,
      };
    })
  );

  const translatedCount = headlines.slice(0, 5).filter((headline) =>
    containsHindi(headline?.title_hi || headline?.title)
  ).length;

  return {
    ...enriched,
    current_news: {
      ...currentNews,
      top_headlines: headlines,
      headline_language_support: {
        ...(currentNews.headline_language_support || {}),
        english: true,
        hindi: true,
        translated_count: translatedCount,
        rendered_language: "hi",
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
    root.__OKAI_HINDI_NEWS_RESPONSE_PATCH_V2__ ||
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
      let language = "en";
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored === "hi" || stored === "en") language = stored;
      } catch (_) {}
      const enriched = await enrichNewsPayloadForLanguage(payload, language, previousFetch);
      return responseWithJson(response, enriched);
    } catch (_) {
      return response;
    }
  };

  root.__OKAI_HINDI_NEWS_RESPONSE_PATCH_V2__ = true;
}

module.exports = {
  installHindiNewsResponsePatch,
  enrichNewsPayload,
  enrichNewsPayloadForLanguage,
  translateHeadlineToHindi,
  PATCH_MARKER,
};
