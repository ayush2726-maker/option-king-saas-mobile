const React = require("react");
const { installAdvancedAiTabEnhancement } = require(
  "./src/runtime/AdvancedAiTabEnhancement"
);
const { installNavigationHelpEnhancement } = require(
  "./src/runtime/NavigationHelpEnhancement"
);
const { installLegacyGuideScreenReplacement } = require(
  "./src/runtime/LegacyGuideScreenReplacement"
);
const { installHomeAccordionEnhancementV3 } = require(
  "./src/runtime/HomeAccordionEnhancementV3"
);

// Install the AI patch first. NavigationHelp then converts the original
// navigation to the final compact tabs, and the AI patch appends its dedicated
// tab without changing strategy, order, broker, or risk logic.
installAdvancedAiTabEnhancement();
installNavigationHelpEnhancement();
installLegacyGuideScreenReplacement();
installHomeAccordionEnhancementV3();

const AppPaymentsPatchedModule = require("./AppPaymentsPatched");
const AppPaymentsPatched =
  AppPaymentsPatchedModule.default || AppPaymentsPatchedModule;

export default function AppNavigationPatched() {
  return React.createElement(AppPaymentsPatched);
}
