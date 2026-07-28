const React = require("react");

const { installHomeLayoutEnhancement } = require(
  "./src/runtime/HomeLayoutEnhancement"
);

installHomeLayoutEnhancement();

const AppNavigationPatchedModule = require("./AppNavigationPatched");
const AppNavigationPatched =
  AppNavigationPatchedModule.default || AppNavigationPatchedModule;

export default function AppHomeLayoutPatched() {
  return React.createElement(AppNavigationPatched);
}
