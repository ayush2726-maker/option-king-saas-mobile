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

// Display-only Home module. It reads live breadth/constituent quotes but never
// changes signal scoring, trade entry/exit, risk controls or broker orders.
const { installSectorRotationEnhancement } = require(
  './src/runtime/SectorRotationEnhancement'
);
installSectorRotationEnhancement();

// The active HomeAccordionEnhancementV3 runtime owns existing dropdowns. It is
// loaded after the sector wrapper so both transforms receive the final Home tree.
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
