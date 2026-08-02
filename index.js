import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const BiometricAppLock = require('./src/security/BiometricAppLock');

// Install before AppPatched loads LiveScoreTradeTabEnhancement. This lets the
// multi-trade wrapper replace the single Active Trade card and suppress the old
// global floating exit button.
const { installMultiOpenTradeEnhancement } = require(
  './src/runtime/MultiOpenTradeEnhancement'
);
installMultiOpenTradeEnhancement();

// The active HomeAccordionEnhancementV3 runtime now owns both requested
// dropdown behaviours. Avoid a late second wrapper that can miss cached JSX.
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
