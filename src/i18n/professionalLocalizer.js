const base = require("./professionalCopy");
const { localizeCatalogText } = require("./professionalCopyCatalog");

function preserveOuterWhitespace(source, translated) {
  const leading = String(source).match(/^\s*/)?.[0] || "";
  const trailing = String(source).match(/\s*$/)?.[0] || "";
  return leading + translated + trailing;
}

function localizeText(value, language = "en") {
  if (typeof value !== "string") return value;
  const catalog = localizeCatalogText(value, language);
  if (catalog != null) return preserveOuterWhitespace(value, catalog);
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
};
