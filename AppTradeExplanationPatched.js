const React = require("react");
const { installTradeExplanationEnhancement } = require(
  "./src/runtime/TradeExplanationEnhancement"
);

// Install before the existing app wrappers load the Trade tab. The patch only
// replaces the active-trade reason text with a readable explanation card.
installTradeExplanationEnhancement();

const AppHomeLayoutPatchedModule = require("./AppHomeLayoutPatched");
const AppHomeLayoutPatched =
  AppHomeLayoutPatchedModule.default || AppHomeLayoutPatchedModule;

export default function AppTradeExplanationPatched() {
  return React.createElement(AppHomeLayoutPatched);
}
