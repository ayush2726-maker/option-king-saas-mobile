const React = require("react");
const { ScrollView } = require("react-native");
const jsxRuntime = require("react/jsx-runtime");
const SectorRotationCard = require("../components/SectorRotationCard");

let jsxDevRuntime = null;
try {
  jsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

let installed = false;

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function collectText(value, output = []) {
  if (value == null || value === false) return output;
  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output));
    return output;
  }
  if (React.isValidElement(value)) {
    collectText(value.props?.children, output);
    collectText(value.props?.label, output);
    collectText(value.props?.title, output);
  }
  return output;
}

function textOf(value) {
  return collectText(value).join(" ").replace(/\s+/g, " ").trim();
}

function includesText(haystack, needle) {
  return String(haystack || "").toLowerCase().includes(String(needle || "").toLowerCase());
}

function isHomeDashboard(children) {
  const text = textOf(children);
  return (
    includesText(text, "TODAY NET P&L") &&
    includesText(text, "AUTO Portfolio") &&
    (includesText(text, "Start Bot") || includesText(text, "Bot Start"))
  );
}

function isScrollViewType(type) {
  return type === ScrollView || componentName(type) === "ScrollView";
}

function isSectorRotationCard(element) {
  return (
    React.isValidElement(element) &&
    (element.type === SectorRotationCard || element.props?.__okaiSectorRotationCard)
  );
}

function isStartStopControl(element) {
  const text = textOf(element);
  return (
    (includesText(text, "Start Bot") || includesText(text, "Bot Start")) &&
    (includesText(text, "Stop Bot") || includesText(text, "Bot Stop"))
  );
}

function isRefreshControl(element) {
  const text = textOf(element);
  return includesText(text, "Refresh Status") || includesText(text, "Status Refresh");
}

function injectSectorRotation(children) {
  const items = React.Children.toArray(children);
  if (!items.length || !isHomeDashboard(items)) return children;
  if (items.some(isSectorRotationCard)) return children;

  const controls = [];
  const rest = [];
  items.forEach((item) => {
    if (isStartStopControl(item) || isRefreshControl(item)) controls.push(item);
    else rest.push(item);
  });

  const rotation = React.createElement(SectorRotationCard, {
    key: "okai-sector-rotation-v1",
    __okaiSectorRotationCard: true,
  });
  return [...controls, rotation, ...rest];
}

function refineProps(type, props) {
  if (!isScrollViewType(type) || props?.__okaiSectorRotationBypass) return props;
  const children = injectSectorRotation(props?.children);
  if (children === props?.children) return props;
  return { ...(props || {}), children };
}

function patchJsxRuntime(runtime) {
  if (!runtime) return;
  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__okaiSectorRotationV1) return;
    const wrapped = function okaiSectorRotationJsx(type, props, reactKey, ...rest) {
      return previous(type, refineProps(type, props || {}), reactKey, ...rest);
    };
    wrapped.__okaiSectorRotationV1 = true;
    runtime[key] = wrapped;
  });
}

function installSectorRotationEnhancement() {
  if (installed || React.__OKAI_SECTOR_ROTATION_V1_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiSectorRotationCreateElement(type, props, ...children) {
    const suppliedProps = children.length
      ? {
          ...(props || {}),
          children: children.length === 1 ? children[0] : children,
        }
      : props || {};
    return previousCreateElement(type, refineProps(type, suppliedProps));
  };

  patchJsxRuntime(jsxRuntime);
  patchJsxRuntime(jsxDevRuntime);
  React.__OKAI_SECTOR_ROTATION_V1_PATCHED__ = true;
}

module.exports = {
  installSectorRotationEnhancement,
  OKAI_SECTOR_ROTATION_RUNTIME_MARKER: "OKAI_SECTOR_ROTATION_RUNTIME_V1",
};
