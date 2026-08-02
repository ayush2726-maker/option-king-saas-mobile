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

// Deterministic current-Home wrapper. Navigation maps Home to BotTab, so this
// injects Sector Rotation into BotTab after Start/Stop and Refresh Status.
const { installDirectHomeSectorRotationV4 } = require(
  './src/runtime/DirectHomeSectorRotationV4'
);
installDirectHomeSectorRotationV4();

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
