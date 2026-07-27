const React = require("react");
const ReactNative = require("react-native");
const AsyncStorageModule = require(
  "@react-native-async-storage/async-storage"
);
const HelpScreenModule = require("../screens/HelpScreen");

const AsyncStorage =
  AsyncStorageModule.default || AsyncStorageModule;
const HelpScreen =
  HelpScreenModule.default || HelpScreenModule;

let installed = false;
let baseCreateElement = null;
let jsxRuntime = null;
let jsxDevRuntime = null;

try {
  jsxRuntime = require("react/jsx-runtime");
} catch (_) {}
try {
  jsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

function componentName(type) {
  return String(
    type?.displayName || type?.name || ""
  ).toLowerCase();
}

function textFromNode(node, depth = 0) {
  if (
    depth > 14 ||
    node == null ||
    node === false
  ) {
    return "";
  }

  if (
    typeof node === "string" ||
    typeof node === "number"
  ) {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node
      .map((item) =>
        textFromNode(item, depth + 1)
      )
      .join(" ");
  }

  if (React.isValidElement(node)) {
    return textFromNode(
      node.props?.children,
      depth + 1
    );
  }

  return "";
}

function normaliseText(node) {
  return textFromNode(node)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isScrollView(type) {
  return (
    type === ReactNative.ScrollView ||
    componentName(type) === "scrollview"
  );
}

function isLegacyGuideRoot(type, props, children) {
  if (
    props?.__okaiLegacyGuideReplacementInternal ||
    !isScrollView(type)
  ) {
    return false;
  }

  const text = normaliseText(
    children ?? props?.children
  );

  const hasAppGuide =
    text.includes("app guide") ||
    text.includes("ऐप गाइड");
  const hasBrokerGuide =
    text.includes("broker setup guide") ||
    text.includes("ब्रोकर सेटअप गाइड");
  const hasLanguage =
    text.includes("language") ||
    text.includes("भाषा");
  const hasBrokerNames =
    text.includes("angel one") &&
    text.includes("upstox") &&
    text.includes("zerodha");

  return (
    hasAppGuide &&
    hasBrokerGuide &&
    hasLanguage &&
    hasBrokerNames
  );
}

function StableHelpReplacement({ detectedText }) {
  const detectedHindi =
    /[\u0900-\u097f]/.test(
      String(detectedText || "")
    );
  const [lang, setLang] = React.useState(
    detectedHindi ? "hi" : "en"
  );

  React.useEffect(() => {
    let active = true;

    AsyncStorage.getItem("okai_lang")
      .then((saved) => {
        if (
          active &&
          (saved === "hi" || saved === "en")
        ) {
          setLang(saved);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  async function changeLanguage(next) {
    if (next !== "hi" && next !== "en") {
      return;
    }

    setLang(next);
    try {
      await AsyncStorage.setItem(
        "okai_lang",
        next
      );
    } catch (_) {}
  }

  return React.createElement(HelpScreen, {
    lang,
    setLang: changeLanguage,
    __okaiLegacyGuideReplacementInternal: true,
  });
}

function replacementElement(
  original,
  type,
  props,
  children,
  rest = []
) {
  if (!isLegacyGuideRoot(
    type,
    props || {},
    children
  )) {
    return null;
  }

  return original(
    StableHelpReplacement,
    {
      detectedText: textFromNode(
        children ?? props?.children
      ),
    },
    ...rest
  );
}

function patchRuntime(runtime) {
  if (!runtime) return;

  ["jsx", "jsxs", "jsxDEV"].forEach(
    (functionName) => {
      const original = runtime[functionName];

      if (
        typeof original !== "function" ||
        original.__OKAI_LEGACY_GUIDE_REPLACED__
      ) {
        return;
      }

      const wrapped = function (
        type,
        props,
        ...rest
      ) {
        const replacement = replacementElement(
          original,
          type,
          props || {},
          props?.children,
          rest
        );

        return replacement ||
          original(type, props, ...rest);
      };

      wrapped.__OKAI_LEGACY_GUIDE_REPLACED__ =
        true;
      runtime[functionName] = wrapped;
    }
  );
}

function installLegacyGuideScreenReplacement() {
  if (
    installed ||
    React.__OKAI_LEGACY_GUIDE_REPLACEMENT__
  ) {
    return;
  }

  installed = true;
  baseCreateElement =
    React.createElement.bind(React);

  React.createElement = function (
    type,
    props,
    ...children
  ) {
    const replacement = replacementElement(
      baseCreateElement,
      type,
      props || {},
      children,
      []
    );

    return replacement ||
      baseCreateElement(
        type,
        props,
        ...children
      );
  };

  patchRuntime(jsxRuntime);
  patchRuntime(jsxDevRuntime);

  React.__OKAI_LEGACY_GUIDE_REPLACEMENT__ =
    true;
}

module.exports = {
  installLegacyGuideScreenReplacement,
};
