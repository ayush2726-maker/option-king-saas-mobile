const React = require("react");

const { installProfessionalIconEnhancement } = require(
  "./src/runtime/ProfessionalIconEnhancement"
);
const {
  installAppThemeEnhancement,
  AppThemeRoot,
} = require("./src/runtime/AppThemeEnhancement");

const { installHomeLayoutEnhancement } = require(
  "./src/runtime/HomeLayoutEnhancement"
);

installProfessionalIconEnhancement();
installAppThemeEnhancement();
installHomeLayoutEnhancement();

const AppNavigationPatchedModule = require("./AppNavigationPatched");
const AppNavigationPatched =
  AppNavigationPatchedModule.default || AppNavigationPatchedModule;

export default function AppHomeLayoutPatched() {
  return React.createElement(
    AppThemeRoot,
    null,
    React.createElement(AppNavigationPatched)
  );
}
