const React = require("react");

const AppNavigationPatchedModule = require("./AppNavigationPatched");
const AppNavigationPatched =
  AppNavigationPatchedModule.default || AppNavigationPatchedModule;

const { installHomeLayoutEnhancement } = require(
  "./src/runtime/HomeLayoutEnhancement"
);

installHomeLayoutEnhancement();

export default function AppHomeLayoutPatched() {
  return React.createElement(AppNavigationPatched);
}
