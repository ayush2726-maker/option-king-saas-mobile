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
  ]);
  const hasStop = includesAny(controls, [
    "stop bot",
    "bot stop",
    "bot stop karo",
  ]);
  const hasRefresh = includesAny(refresh, [
    "refresh status",
    "status refresh",
    "status refresh karo",
  ]);
  const hasHomeIdentity = includesAny(visibleHome, [
    "today net p&l",
    "bot status",
    "active strategy",
  ]);

  // The production bundle may minify function names, so identify the visible
  // Home screen only from its stable first controls and dashboard content.
  return hasStart && hasStop && hasRefresh && hasHomeIdentity;
}

function injectSectorCard(props) {
  const items = React.Children.toArray(props?.children).filter(
    (item) => !isSectorCard(item)
  );

  injecting = true;
  let rotation;
  try {
    rotation = React.createElement(SectorRotationCard, {
      key: "okai-current-home-sector-v6",
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
    if (typeof previous !== "function" || previous.__okaiCurrentHomeSectorV6) {
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

    wrapped.__okaiCurrentHomeSectorV6 = true;
    runtime[key] = wrapped;
  });
}

function installDirectHomeSectorRotationV4() {
  if (installed || React.__OKAI_CURRENT_HOME_SECTOR_V6_PATCHED__) return;
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

  React.__OKAI_CURRENT_HOME_SECTOR_V6_PATCHED__ = true;
}

module.exports = {
  installDirectHomeSectorRotationV4,
  OKAI_DIRECT_HOME_SECTOR_MARKER: "OKAI-DIRECT-CURRENT-HOME-SCROLL-V6",
};
