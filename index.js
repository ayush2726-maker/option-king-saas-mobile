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

// Loading the app module installs the existing navigation, Home accordion and
// layout wrappers. Sector rotation is deliberately installed AFTER this require,
// making it the outermost Home ScrollView transform instead of being overwritten.
const AppModule = require('./AppTradeExplanationPatched');
const App = AppModule.default || AppModule;

const { installSectorRotationEnhancement } = require(
  './src/runtime/SectorRotationEnhancement'
);
installSectorRotationEnhancement();

function SecuredOptionKingApp() {
  return React.createElement(
    BiometricAppLock,
    null,
    React.createElement(App)
  );
}

registerRootComponent(SecuredOptionKingApp);
