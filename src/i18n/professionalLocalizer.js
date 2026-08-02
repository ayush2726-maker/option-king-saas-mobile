const base = require("./professionalCopy");
const { localizeCatalogText } = require("./professionalCopyCatalog");
const { localizeFeatureText } = require("./professionalFeatureCatalog");
const { localizeOverlayText } = require("./professionalOverlayCatalog");

const NEWS_HEADLINE_HINDI = new Map([
  [
    "iran ridicules trump warnings as psychological warfare after he cancels planned strikes",
    "ईरान ने ट्रंप की चेतावनियों को मनोवैज्ञानिक युद्ध बताया, नियोजित हमले रद्द होने के बाद",
  ],
  [
    "saudi crown prince mbs urges trump to prioritise dialogue in us iran war us israel war on iran news",
    "सऊदी क्राउन प्रिंस एमबीएस ने अमेरिका-ईरान युद्ध में ट्रंप से बातचीत को प्राथमिकता देने की अपील की",
  ],
  [
    "trump iran strikes to stop after parameters reached to end war",
    "ट्रंप: युद्ध समाप्त करने की शर्तों पर सहमति के बाद ईरान पर हमले रुकेंगे",
  ],
  [
    "trump says he will order halt to iran strikes after parameters reached for deal to end war",
    "ट्रंप ने कहा, युद्ध समाप्त करने के समझौते की शर्तें तय होने के बाद ईरान पर हमले रोकने का आदेश देंगे",
  ],
  [
    "us general warns pentagon he lacks naval assets to keep shielding israel from missiles report",
    "अमेरिकी जनरल ने पेंटागन को चेताया कि इज़राइल को मिसाइलों से बचाते रहने के लिए पर्याप्त नौसैनिक संसाधन नहीं हैं: रिपोर्ट",
  ],
  [
    "trump claims deal is near as us iran war enters uncertain new phase",
    "ट्रंप का दावा, समझौता करीब है; अमेरिका-ईरान युद्ध अनिश्चित नए चरण में पहुँचा",
  ],
]);

function normalizeHeadline(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[|:;,.!?()\[\]{}'"’“”\-–—/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function localizeNewsHeadline(value, language) {
  if (language !== "hi" || typeof value !== "string") return null;

  const normalized = normalizeHeadline(value);
  if (!normalized || /[\u0900-\u097F]/.test(value)) return null;

  const exact = NEWS_HEADLINE_HINDI.get(normalized);
  if (exact) return exact;

  if (
    normalized.includes("trump") &&
    normalized.includes("iran") &&
    normalized.includes("strikes") &&
    (normalized.includes("halt") || normalized.includes("stop")) &&
    (normalized.includes("deal") || normalized.includes("end war"))
  ) {
    return "ट्रंप ने कहा, युद्ध समाप्त करने के समझौते के बाद ईरान पर हमले रोकने का आदेश दिया जाएगा";
  }

  if (
    normalized.includes("saudi crown prince") &&
    normalized.includes("trump") &&
    normalized.includes("dialogue") &&
    normalized.includes("iran")
  ) {
    return "सऊदी क्राउन प्रिंस ने ईरान संघर्ष में ट्रंप से बातचीत को प्राथमिकता देने की अपील की";
  }

  if (
    normalized.includes("iran") &&
    normalized.includes("trump warnings") &&
    normalized.includes("psychological warfare")
  ) {
    return "ईरान ने ट्रंप की चेतावनियों को मनोवैज्ञानिक युद्ध बताया";
  }

  return null;
}

function preserveOuterWhitespace(source, translated) {
  const leading = String(source).match(/^\s*/)?.[0] || "";
  const trailing = String(source).match(/\s*$/)?.[0] || "";
  return leading + translated + trailing;
}

function localizeText(value, language = "en") {
  if (typeof value !== "string") return value;

  const headline = localizeNewsHeadline(value, language);
  if (headline != null) return preserveOuterWhitespace(value, headline);

  const catalog = localizeCatalogText(value, language);
  if (catalog != null) return preserveOuterWhitespace(value, catalog);

  const feature = localizeFeatureText(value, language);
  if (feature != null) return preserveOuterWhitespace(value, feature);

  const overlay = localizeOverlayText(value, language);
  if (overlay != null) return preserveOuterWhitespace(value, overlay);

  return base.localizeText(value, language);
}

function localizeValue(value, language = "en") {
  if (typeof value === "string") return localizeText(value, language);
  if (Array.isArray(value)) return value.map((item) => localizeValue(item, language));
  return value;
}

module.exports = {
  ...base,
  localizeText,
  localizeValue,
  localizeNewsHeadline,
};
