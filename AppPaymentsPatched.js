const React = require("react");
const { installPaytmPaymentEnhancement } = require(
  "./src/runtime/PaytmPaymentEnhancement"
);

// Install before AppPatched requires App.js, so the existing monthly-plan card
// receives Paytm controls without adding a native SDK.
installPaytmPaymentEnhancement();

const AppPatchedModule = require("./AppPatched");
const AppPatched = AppPatchedModule.default || AppPatchedModule;

export default function AppPaymentsPatched() {
  return React.createElement(AppPatched);
}
