const React = require("react");
const { installNavigationHelpEnhancement } = require(
  "./src/runtime/NavigationHelpEnhancement"
);
const { installLegacyGuideScreenReplacement } = require(
  "./src/runtime/LegacyGuideScreenReplacement"
);
const { installHomeAccordionEnhancementV2 } = require(
  "./src/runtime/HomeAccordionEnhancementV2"
);

// Install before AppPaymentsPatched loads App.js so Dashboard navigation,
// the stable Help dropdown screen, and compact Home accordions are active
// from the first render.
installNavigationHelpEnhancement();
installLegacyGuideScreenReplacement();
installHomeAccordionEnhancementV2();

const AppPaymentsPatchedModule = require("./AppPaymentsPatched");
const AppPaymentsPatched =
  AppPaymentsPatchedModule.default || AppPaymentsPatchedModule;

export default function AppNavigationPatched() {
  return React.createElement(AppPaymentsPatched);
}
