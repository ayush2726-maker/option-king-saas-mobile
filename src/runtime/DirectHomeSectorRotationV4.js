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

function looksLikeCurrentHomeBotTab(type, props) {
  if (
    typeof type !== "function" ||
    props?.__okaiDirectBotHomeSectorBypass
  ) {
    return false;
  }

  const name = componentName(type);
  const source = componentSource(type);

  // NavigationHelpEnhancement maps the visible Home button to the real BotTab.
  // Therefore BotTab—not the legacy HomeTab—is the authoritative Home screen.
  if (name === "BotTab" || source.includes("function BotTab")) {
    return true;
  }

  return (
    source.includes("Start Bot") &&
    source.includes("Stop Bot") &&
    source.includes("TODAY NET P&L") &&
    source.includes("Bot Status")
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

function injectIntoCurrentHomeTree(value, state) {
  if (state.done || !React.isValidElement(value)) return value;

  if (isScrollViewType(value.type)) {
    const items = React.Children.toArray(value.props?.children).filter(
      (item) => !isSectorCard(item)
    );

    const rotation = React.createElement(SectorRotationCard, {
      key: "okai-direct-bot-home-sector-v5",
      __okaiSectorRotationCard: true,
    });

    // Current Home/BotTab starts with Start/Stop controls and Refresh Status.
    // Place Sector Rotation immediately after those two controls.
    const insertAt = Math.min(2, items.length);
    const children = [
      ...items.slice(0, insertAt),
      rotation,
      ...items.slice(insertAt),
    ];

    state.done = true;
    return React.cloneElement(value, {
      ...(value.props || {}),
      __okaiDirectBotHomeSectorInjected: true,
      children,
    });
  }

  const originalChildren = value.props?.children;
  if (originalChildren == null) return value;

  const nextChildren = React.Children.map(originalChildren, (child) =>
    injectIntoCurrentHomeTree(child, state)
  );

  if (nextChildren === originalChildren) return value;
  return React.cloneElement(value, {
    ...(value.props || {}),
    children: nextChildren,
  });
}

function DirectBotHomeSectorWrapper({ originalType, originalProps }) {
  // BotTab is a plain function component. Calling it inside this stable wrapper
  // preserves its hook order while allowing deterministic ScrollView injection.
  const rendered = originalType({
    ...(originalProps || {}),
    __okaiDirectBotHomeSectorBypass: true,
  });

  return injectIntoCurrentHomeTree(rendered, { done: false });
}

function transform(previous, type, props, reactKey, rest) {
  if (looksLikeCurrentHomeBotTab(type, props)) {
    return previous(
      DirectBotHomeSectorWrapper,
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
    if (typeof previous !== "function" || previous.__okaiDirectBotHomeSectorV5) {
      return;
    }

    const wrapped = function okaiDirectBotHomeSectorJsx(
      type,
      props,
      reactKey,
      ...rest
    ) {
      return transform(previous, type, props, reactKey, rest);
    };

    wrapped.__okaiDirectBotHomeSectorV5 = true;
    runtime[key] = wrapped;
  });
}

function installDirectHomeSectorRotationV4() {
  if (installed || React.__OKAI_DIRECT_BOT_HOME_SECTOR_V5_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiDirectBotHomeSectorCreateElement(
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

    if (looksLikeCurrentHomeBotTab(type, suppliedProps)) {
      return previousCreateElement(DirectBotHomeSectorWrapper, {
        originalType: type,
        originalProps: suppliedProps,
      });
    }

    return previousCreateElement(type, suppliedProps);
  };

  patchJsxRuntime(jsxRuntime);
  patchJsxRuntime(jsxDevRuntime);

  React.__OKAI_DIRECT_BOT_HOME_SECTOR_V5_PATCHED__ = true;
}

module.exports = {
  installDirectHomeSectorRotationV4,
  OKAI_DIRECT_HOME_SECTOR_MARKER: "OKAI-DIRECT-BOT-HOME-SECTOR-V5",
};
