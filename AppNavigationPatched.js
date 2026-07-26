const React = require("react");
const { installNavigationHelpEnhancement } = require(
  "./src/runtime/NavigationHelpEnhancement"
);
const { BiometricSessionGate } = require(
  "./src/runtime/BiometricSessionGate"
);

// Install before AppPaymentsPatched loads App.js so Dashboard hooks,
// bottom navigation, and Guide replacement are active from first render.
installNavigationHelpEnhancement();

const AppPaymentsPatchedModule = require("./AppPaymentsPatched");
const AppPaymentsPatched =
  AppPaymentsPatchedModule.default || AppPaymentsPatchedModule;

export default function AppNavigationPatched() {
  return React.createElement(
    BiometricSessionGate,
    null,
    React.createElement(AppPaymentsPatched)
  );
}
