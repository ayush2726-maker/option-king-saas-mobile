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
const { installWebNavigationBridge } = require(
  "./src/runtime/WebNavigationBridge"
);
const { installWebHideBottomNavigation } = require(
  "./src/web/WebHideBottomNavigation"
);

// Install the AI patch first. NavigationHelp then converts the original
// navigation to the final compact tabs, and the AI patch appends its dedicated
// tab without changing strategy, order, broker, or risk logic.
installAdvancedAiTabEnhancement();
installNavigationHelpEnhancement();
installLegacyGuideScreenReplacement();
installHomeAccordionEnhancementV3();
installWebNavigationBridge();
installWebHideBottomNavigation();

const AppPaymentsPatchedModule = require("./AppPaymentsPatched");
const AppPaymentsPatched =
  AppPaymentsPatchedModule.default || AppPaymentsPatchedModule;

export default function AppNavigationPatched() {
  return React.createElement(AppPaymentsPatched);
}
