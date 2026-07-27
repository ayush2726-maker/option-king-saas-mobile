const React = require("react");
const { installNavigationHelpEnhancement } = require(
  "./src/runtime/NavigationHelpEnhancement"
);
const { installLegacyGuideScreenReplacement } = require(
  "./src/runtime/LegacyGuideScreenReplacement"
);
const { installHomeAccordionEnhancementV3 } = require(
  "./src/runtime/HomeAccordionEnhancementV3"
);

// OTA release marker: home-help-dropdown-2026-07-27-v5
// Install before AppPaymentsPatched loads App.js so Dashboard navigation,
// the stable Help dropdown screen, and compact Home accordions are active
// from the first render. V3 uses only static Metro-safe module imports.
installNavigationHelpEnhancement();
installLegacyGuideScreenReplacement();
installHomeAccordionEnhancementV3();

const AppPaymentsPatchedModule = require("./AppPaymentsPatched");
const AppPaymentsPatched =
  AppPaymentsPatchedModule.default || AppPaymentsPatchedModule;

export default function AppNavigationPatched() {
  return React.createElement(AppPaymentsPatched);
}
