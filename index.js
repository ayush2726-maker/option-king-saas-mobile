import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const BiometricAppLock = require('./src/security/BiometricAppLock15m');

// Keep the legacy early hook for backward compatibility with older bundles.
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

// Install LAST, after every navigation/trade/runtime wrapper has loaded. This
// final render-tree guard replaces the visible single Active Trade card with
// separate cards for every open position and suppresses the old global floating
// exit overlay. Each exit request always carries that card's own trade_id.
const { installFinalMultiOpenTradeScreenV2 } = require(
  './src/runtime/FinalMultiOpenTradeScreenV2'
);
installFinalMultiOpenTradeScreenV2();

function SecuredOptionKingApp() {
  return React.createElement(
    BiometricAppLock,
    null,
    React.createElement(App)
  );
}

registerRootComponent(SecuredOptionKingApp);
