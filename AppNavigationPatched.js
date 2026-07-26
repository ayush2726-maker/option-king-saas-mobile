const React = require("react");
const { installNavigationHelpEnhancement } = require(
  "./src/runtime/NavigationHelpEnhancement"
);

// Install before AppPaymentsPatched loads App.js so Dashboard hooks,
// bottom navigation, and Help replacement are active from first render.
installNavigationHelpEnhancement();

const AppPaymentsPatchedModule = require("./AppPaymentsPatched");
const AppPaymentsPatched =
  AppPaymentsPatchedModule.default || AppPaymentsPatchedModule;

export default function AppNavigationPatched() {
  return React.createElement(AppPaymentsPatched);
}
