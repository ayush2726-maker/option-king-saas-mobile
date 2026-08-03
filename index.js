import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const BiometricAppLock = require('./src/security/BiometricAppLock15m');

// Install before the AI screen loads. The patch enriches the existing
// /bot/ai-news-monitor response with deterministic Hindi title_hi values.
// English mode still reads the original title field, so English remains intact.
const { installHindiNewsResponsePatch } = require(
  './src/runtime/HindiNewsResponsePatch'
);
installHindiNewsResponsePatch();

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

// Keep the existing final guard for legacy floating-exit suppression.
const { installFinalMultiOpenTradeScreenV2 } = require(
  './src/runtime/FinalMultiOpenTradeScreenV2'
);
installFinalMultiOpenTradeScreenV2();

// Install after every other wrapper. This directly replaces the visible legacy
// Active Paper/Live Trade card itself, so the multi-position UI no longer
// depends on ScrollView text signatures or minified component names.
const { installDirectActiveTradeCardV3 } = require(
  './src/runtime/DirectActiveTradeCardV3'
);
installDirectActiveTradeCardV3();

function SecuredOptionKingApp() {
  return React.createElement(
    BiometricAppLock,
    null,
    React.createElement(App)
  );
}

registerRootComponent(SecuredOptionKingApp);
