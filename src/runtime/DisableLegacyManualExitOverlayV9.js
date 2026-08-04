const React = require("react");

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

function isLegacyManualExit(type, props) {
  if (props?.__okaiPerTradeExitButton || props?.__okaiRootExitV9) return false;
  const name = componentName(type);
  if (name === "ManualExitOverlay") return true;
  const source = componentSource(type);
  return (
    source.includes("function ManualExitOverlay") &&
    source.includes("EXIT TRADE NOW") &&
    source.includes("/bot/manual-exit")
  );
}

function patchRuntime(runtime) {
  if (!runtime) return;
  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__okaiDisableLegacyExitV9) return;
    const wrapped = function okaiDisableLegacyExitJsx(type, props, reactKey, ...rest) {
      if (isLegacyManualExit(type, props || {})) return null;
      return previous(type, props, reactKey, ...rest);
    };
    wrapped.__okaiDisableLegacyExitV9 = true;
    runtime[key] = wrapped;
  });
}

function installDisableLegacyManualExitOverlayV9() {
  if (installed || React.__OKAI_DISABLE_LEGACY_EXIT_V9__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiDisableLegacyExitCreateElement(type, props, ...children) {
    if (isLegacyManualExit(type, props || {})) return null;
    return previousCreateElement(type, props, ...children);
  };

  try {
    patchRuntime(require("react/jsx-runtime"));
  } catch (_) {}
  try {
    patchRuntime(require("react/jsx-dev-runtime"));
  } catch (_) {}

  React.__OKAI_DISABLE_LEGACY_EXIT_V9__ = true;
}

module.exports = {
  installDisableLegacyManualExitOverlayV9,
  DISABLE_LEGACY_EXIT_V9_MARKER: "OKAI-DISABLE-LEGACY-EXIT-V9",
};
