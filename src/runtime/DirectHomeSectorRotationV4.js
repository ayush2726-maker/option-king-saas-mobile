const React = require("react");
const { ScrollView } = require("react-native");
const jsxRuntime = require("react/jsx-runtime");
const SectorRotationCard = require("../components/SectorRotationCard");

let jsxDevRuntime = null;
try {
  jsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

let installed = false;
let injecting = false;

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function isScrollViewType(type) {
  return type === ScrollView || componentName(type) === "ScrollView";
}

function collectText(value, output = [], depth = 0) {
  if (value == null || value === false || depth > 12) return output;

  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output, depth + 1));
    return output;
  }

  if (!React.isValidElement(value)) return output;

  collectText(value.props?.label, output, depth + 1);
  collectText(value.props?.title, output, depth + 1);
  collectText(value.props?.accessibilityLabel, output, depth + 1);
  collectText(value.props?.children, output, depth + 1);
  return output;
}

function signatureOf(value) {
  return collectText(value)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function includesAny(signature, values) {
  return values.some((value) => signature.includes(String(value).toLowerCase()));
}

function isSectorCard(element) {
  return (
    React.isValidElement(element) &&
    (element.type === SectorRotationCard || element.props?.__okaiSectorRotationCard)
  );
}

function isCurrentHomeScrollView(type, props) {
  if (
    !isScrollViewType(type) ||
    props?.__okaiCurrentHomeSectorInjected ||
    injecting
  ) {
    return false;
  }

  const items = React.Children.toArray(props?.children);
  if (items.length < 2) return false;

  const controls = signatureOf(items[0]);
  const refresh = signatureOf(items[1]);
  const visibleHome = signatureOf(items.slice(0, 8));

  const hasStart = includesAny(controls, [
    "start bot",
    "bot start",
    "bot start karo",
    "बॉट प्रारंभ करें",
    "बॉट शुरू करें",
    "बॉट चालू करें",
    "बॉट प्रारंभ",
  ]);
  const hasStop = includesAny(controls, [
    "stop bot",
    "bot stop",
    "bot stop karo",
    "बॉट बंद करें",
    "बॉट रोकें",
    "बॉट बंद",
  ]);
  const hasRefresh = includesAny(refresh, [
    "refresh status",
    "status refresh",
    "status refresh karo",
    "स्थिति रीफ्रेश करें",
    "स्थिति ताज़ा करें",
    "स्टेटस रीफ्रेश करें",
    "रीफ्रेश स्थिति",
  ]);
  const hasHomeIdentity = includesAny(visibleHome, [
    "today net p&l",
    "bot status",
    "active strategy",
    "आज का नेट पी&एल",
    "आज का शुद्ध पी&एल",
    "बॉट स्थिति",
    "सक्रिय रणनीति",
    "कुल पी&एल",
  ]);

  // During a language switch the Refresh Status card can temporarily contain
  // only a spinner. Start + Stop + dashboard identity are already unique to
  // the real Home screen, so keep the second slot structural in that state.
  const hasRefreshSlot = hasRefresh || items.length >= 2;

  // The production bundle may minify function names, so identify the visible
  // Home screen from stable bilingual controls and dashboard content only.
  return hasStart && hasStop && hasRefreshSlot && hasHomeIdentity;
}

function injectSectorCard(props) {
  const items = React.Children.toArray(props?.children).filter(
    (item) => !isSectorCard(item)
  );

  injecting = true;
  let rotation;
  try {
    rotation = React.createElement(SectorRotationCard, {
      key: "okai-current-home-sector-v7",
      __okaiSectorRotationCard: true,
    });
  } finally {
    injecting = false;
  }

  return {
    ...(props || {}),
    __okaiCurrentHomeSectorInjected: true,
    children: [
      ...items.slice(0, 2),
      rotation,
      ...items.slice(2),
    ],
  };
}

function transform(previous, type, props, reactKey, rest) {
  const nextProps = isCurrentHomeScrollView(type, props || {})
    ? injectSectorCard(props || {})
    : props;

  return previous(type, nextProps, reactKey, ...(rest || []));
}

function patchJsxRuntime(runtime) {
  if (!runtime) return;

  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__okaiCurrentHomeSectorV7) {
      return;
    }

    const wrapped = function okaiCurrentHomeSectorJsx(
      type,
      props,
      reactKey,
      ...rest
    ) {
      return transform(previous, type, props, reactKey, rest);
    };

    wrapped.__okaiCurrentHomeSectorV7 = true;
    runtime[key] = wrapped;
  });
}

function installDirectHomeSectorRotationV4() {
  if (installed || React.__OKAI_CURRENT_HOME_SECTOR_V7_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiCurrentHomeSectorCreateElement(
    type,
    props,
    ...children
  ) {
    const suppliedProps = children.length
      ? {
          ...(props || {}),
          children: children.length === 1 ? children[0] : children,
        }
      : props || {};

    const nextProps = isCurrentHomeScrollView(type, suppliedProps)
      ? injectSectorCard(suppliedProps)
      : suppliedProps;

    return previousCreateElement(type, nextProps);
  };

  patchJsxRuntime(jsxRuntime);
  patchJsxRuntime(jsxDevRuntime);

  React.__OKAI_CURRENT_HOME_SECTOR_V7_PATCHED__ = true;
}

module.exports = {
  installDirectHomeSectorRotationV4,
  OKAI_DIRECT_HOME_SECTOR_MARKER: "OKAI-DIRECT-CURRENT-HOME-SCROLL-V7",
};