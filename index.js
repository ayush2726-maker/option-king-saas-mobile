import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const BiometricAppLock = require('./src/security/BiometricAppLock15m');

// Must be installed before the app module loads so the multi-open-trade wrapper
// can replace the legacy single Active Trade card.
const { installMultiOpenTradeEnhancement } = require(
  './src/runtime/MultiOpenTradeEnhancement'
);
installMultiOpenTradeEnhancement();

// AppNavigationPatched installs HomeAccordionEnhancementV3 before the underlying
// dashboard loads. Sector Rotation is now injected inside that exact active Home
// runtime, avoiding wrapper-order and JSX-runtime timing problems.
const AppModule = require('./AppTradeExplanationPatched');
const App = AppModule.default || AppModule;

function SecuredOptionKingApp() {
  return React.createElement(
    BiometricAppLock,
    null,
    React.createElement(App)
  );
}

registerRootComponent(SecuredOptionKingApp);
