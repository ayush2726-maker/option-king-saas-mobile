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

function componentSource(type) {
  if (typeof type !== "function") return "";
  try {
    return Function.prototype.toString.call(type);
  } catch (_) {
    return "";
  }
}

function looksLikeHomeTab(type, props) {
  if (typeof type !== "function" || props?.__okaiDirectHomeSectorBypass) {
    return false;
  }

  const name = componentName(type);
  const source = componentSource(type);

  if (name === "HomeTab" || source.includes("function HomeTab")) {
    return true;
  }

  return (
    source.includes("TODAY NET P&L") &&
    source.includes("AUTO Portfolio") &&
    source.includes("Trading Mode") &&
    source.includes("AUTO Scan Instruments")
  );
}

function isScrollViewType(type) {
  return type === ScrollView || componentName(type) === "ScrollView";
}

function isSectorCard(element) {
  return (
    React.isValidElement(element) &&
    (element.type === SectorRotationCard || element.props?.__okaiSectorRotationCard)
  );
}

function injectIntoHomeTree(value, state) {
  if (state.done || !React.isValidElement(value)) return value;

  if (isScrollViewType(value.type)) {
    const items = React.Children.toArray(value.props?.children).filter(
      (item) => !isSectorCard(item)
    );

    const rotation = React.createElement(SectorRotationCard, {
      key: "okai-direct-home-sector-v4",
      __okaiSectorRotationCard: true,
    });

    // The real HomeTab starts with Start/Stop controls and Refresh Status.
    // Insert immediately after those two controls so the card is always visible.
    const insertAt = Math.min(2, items.length);
    const children = [
      ...items.slice(0, insertAt),
      rotation,
      ...items.slice(insertAt),
    ];

    state.done = true;
    return React.cloneElement(value, {
      ...(value.props || {}),
      __okaiDirectHomeSectorInjected: true,
      children,
    });
  }

  const originalChildren = value.props?.children;
  if (originalChildren == null) return value;

  const nextChildren = React.Children.map(originalChildren, (child) =>
    injectIntoHomeTree(child, state)
  );

  if (nextChildren === originalChildren) return value;
  return React.cloneElement(value, {
    ...(value.props || {}),
    children: nextChildren,
  });
}

function DirectHomeSectorWrapper({ originalType, originalProps }) {
  // HomeTab is a plain function component. Calling it inside this stable wrapper
  // keeps its hooks in one deterministic render path and lets us inject into the
  // returned ScrollView instead of relying on fragile JSX child-text matching.
  const rendered = originalType({
    ...(originalProps || {}),
    __okaiDirectHomeSectorBypass: true,
  });

  return injectIntoHomeTree(rendered, { done: false });
}

function transform(previous, type, props, reactKey, rest) {
  if (looksLikeHomeTab(type, props)) {
    return previous(
      DirectHomeSectorWrapper,
      { originalType: type, originalProps: props || {} },
      reactKey,
      ...(rest || [])
    );
  }

  return previous(type, props, reactKey, ...(rest || []));
}

function patchJsxRuntime(runtime) {
  if (!runtime) return;

  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__okaiDirectHomeSectorV4) {
      return;
    }

    const wrapped = function okaiDirectHomeSectorJsx(
      type,
      props,
      reactKey,
      ...rest
    ) {
      return transform(previous, type, props, reactKey, rest);
    };

    wrapped.__okaiDirectHomeSectorV4 = true;
    runtime[key] = wrapped;
  });
}

function installDirectHomeSectorRotationV4() {
  if (installed || React.__OKAI_DIRECT_HOME_SECTOR_V4_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiDirectHomeSectorCreateElement(
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

    if (looksLikeHomeTab(type, suppliedProps)) {
      return previousCreateElement(DirectHomeSectorWrapper, {
        originalType: type,
        originalProps: suppliedProps,
      });
    }

    return previousCreateElement(type, suppliedProps);
  };

  patchJsxRuntime(jsxRuntime);
  patchJsxRuntime(jsxDevRuntime);

  React.__OKAI_DIRECT_HOME_SECTOR_V4_PATCHED__ = true;
}

module.exports = {
  installDirectHomeSectorRotationV4,
  OKAI_DIRECT_HOME_SECTOR_MARKER: "OKAI-DIRECT-HOME-SECTOR-V4",
};
