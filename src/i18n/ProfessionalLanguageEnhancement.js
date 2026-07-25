const React = require("react");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const { Alert } = require("react-native");
const { localizeText, localizeValue } = require("./professionalCopy");

let installed = false;
let currentLanguage = "en";

function normalizeLanguage(value) {
  return value === "hi" ? "hi" : "en";
}

function setProfessionalLanguage(value) {
  currentLanguage = normalizeLanguage(value);
  return currentLanguage;
}

function getProfessionalLanguage() {
  return currentLanguage;
}

function normalizeProps(props) {
  if (!props || typeof props !== "object") return props;

  const keys = [
    "label",
    "title",
    "message",
    "placeholder",
    "accessibilityLabel",
    "description",
    "subtitle",
    "helperText",
    "error",
    "children",
  ];

  let changed = false;
  const next = { ...props };

  keys.forEach((key) => {
    if (!(key in next)) return;
    const normalized = localizeValue(next[key], currentLanguage);
    if (normalized !== next[key]) {
      next[key] = normalized;
      changed = true;
    }
  });

  return changed ? next : props;
}

function patchStorageLanguageSync() {
  if (AsyncStorage.__OKAI_LANGUAGE_SYNC_PATCHED__) return;

  const originalSetItem = AsyncStorage.setItem.bind(AsyncStorage);
  AsyncStorage.setItem = function okaiLanguageSetItem(key, value, ...rest) {
    if (key === "okai_lang") setProfessionalLanguage(value);
    return originalSetItem(key, value, ...rest);
  };

  if (typeof AsyncStorage.multiSet === "function") {
    const originalMultiSet = AsyncStorage.multiSet.bind(AsyncStorage);
    AsyncStorage.multiSet = function okaiLanguageMultiSet(entries, ...rest) {
      const languageEntry = Array.isArray(entries)
        ? entries.find((entry) => Array.isArray(entry) && entry[0] === "okai_lang")
        : null;
      if (languageEntry) setProfessionalLanguage(languageEntry[1]);
      return originalMultiSet(entries, ...rest);
    };
  }

  AsyncStorage.__OKAI_LANGUAGE_SYNC_PATCHED__ = true;
}

function patchReactElements() {
  if (React.__OKAI_PROFESSIONAL_LANGUAGE_PATCHED__) return;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiProfessionalLanguageCreateElement(type, props, ...children) {
    return previousCreateElement(
      type,
      normalizeProps(props),
      ...children.map((child) => localizeValue(child, currentLanguage))
    );
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;
      jsxRuntime[key] = function okaiProfessionalLanguageJsx(type, props, reactKey) {
        return previous(type, normalizeProps(props), reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_PROFESSIONAL_LANGUAGE_PATCHED__ = true;
}

function patchAlerts() {
  if (!Alert || Alert.__OKAI_PROFESSIONAL_LANGUAGE_PATCHED__) return;

  const previousAlert = Alert.alert.bind(Alert);
  Alert.alert = function okaiProfessionalAlert(title, message, buttons, options) {
    const localizedButtons = Array.isArray(buttons)
      ? buttons.map((button) => ({
          ...button,
          text: localizeText(button?.text || "", currentLanguage),
        }))
      : buttons;

    return previousAlert(
      localizeText(title || "", currentLanguage),
      localizeText(message || "", currentLanguage),
      localizedButtons,
      options
    );
  };

  Alert.__OKAI_PROFESSIONAL_LANGUAGE_PATCHED__ = true;
}

function installProfessionalLanguageEnhancement() {
  if (installed || global.__OKAI_PROFESSIONAL_LANGUAGE_INSTALLED__) {
    return {
      installed: true,
      language: currentLanguage,
    };
  }

  installed = true;
  patchStorageLanguageSync();
  patchReactElements();
  patchAlerts();

  AsyncStorage.getItem("okai_lang")
    .then((value) => setProfessionalLanguage(value))
    .catch(() => setProfessionalLanguage("en"));

  global.__OKAI_PROFESSIONAL_LANGUAGE_INSTALLED__ = true;

  return {
    installed: true,
    language: currentLanguage,
  };
}

module.exports = {
  installProfessionalLanguageEnhancement,
  setProfessionalLanguage,
  getProfessionalLanguage,
  normalizeProps,
};
