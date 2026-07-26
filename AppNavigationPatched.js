const React = require("react");
const { installNavigationHelpEnhancement } = require(
  "./src/runtime/NavigationHelpEnhancement"
);
const { installGuideCardsAccordionV2 } = require(
  "./src/runtime/GuideCardsAccordionV2"
);

// Install before AppPaymentsPatched loads App.js so Dashboard hooks,
// bottom navigation, Help replacement, and guide dropdowns are active
// from the first render.
installNavigationHelpEnhancement();
installGuideCardsAccordionV2();

const AppPaymentsPatchedModule = require("./AppPaymentsPatched");
const AppPaymentsPatched =
  AppPaymentsPatchedModule.default || AppPaymentsPatchedModule;

export default function AppNavigationPatched() {
  return React.createElement(AppPaymentsPatched);
}
