const React = require("react");
const { installNavigationHelpEnhancement } = require(
  "./src/runtime/NavigationHelpEnhancement"
);
const { installLegacyGuideScreenReplacement } = require(
  "./src/runtime/LegacyGuideScreenReplacement"
);
const { installHomeAccordionEnhancement } = require(
  "./src/runtime/HomeAccordionEnhancement"
);

// OTA release marker: home-help-dropdown-2026-07-27-v4
// Use the Metro-safe static accordion implementation. The V2 module used a
// dynamic require(moduleName), which Expo/Metro cannot bundle for OTA export.
installNavigationHelpEnhancement();
installLegacyGuideScreenReplacement();
installHomeAccordionEnhancement();

const AppPaymentsPatchedModule = require("./AppPaymentsPatched");
const AppPaymentsPatched =
  AppPaymentsPatchedModule.default || AppPaymentsPatchedModule;

export default function AppNavigationPatched() {
  return React.createElement(AppPaymentsPatched);
}
