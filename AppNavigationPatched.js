const React = require("react");
const { installNavigationHelpEnhancement } = require(
  "./src/runtime/NavigationHelpEnhancement"
);
const { installGuideCardsAccordionEnhancement } = require(
  "./src/runtime/GuideCardsAccordionEnhancement"
);

// Install before AppPaymentsPatched loads App.js so Dashboard hooks,
// bottom navigation, Help replacement, and guide accordions are active
// from the first render.
installNavigationHelpEnhancement();
installGuideCardsAccordionEnhancement();

const AppPaymentsPatchedModule = require("./AppPaymentsPatched");
const AppPaymentsPatched =
  AppPaymentsPatchedModule.default || AppPaymentsPatchedModule;

export default function AppNavigationPatched() {
  return React.createElement(AppPaymentsPatched);
}
