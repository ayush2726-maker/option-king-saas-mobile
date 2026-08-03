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

// Install before AppTradeExplanationPatched loads HomeAccordionEnhancementV3.
// The inner runtime intercepts that accordion wrapper and preserves a score card
// whose heading and all rows share one top-level container.
const { installLiveScoreBodyPreserveV4 } = require(
  './src/runtime/LiveScoreBodyPreserveV4'
);
installLiveScoreBodyPreserveV4();

// Sector Rotation now renders directly inside the dedicated Advanced AI tab.
// Do not install the old Home ScrollView injector.
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
