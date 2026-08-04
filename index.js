import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const BiometricAppLock = require('./src/security/BiometricAppLock15m');
const GlobalManualExitOverlayV9 = require(
  './src/components/GlobalManualExitOverlayV9'
);

// Install before the AI screen loads. Hindi mode receives deterministic title_hi
// values while English continues to use the original title field.
const { installHindiNewsResponsePatch } = require(
  './src/runtime/HindiNewsResponsePatch'
);
installHindiNewsResponsePatch();

// Preserve the existing Live Strategy Score body without installing any of the
// old multi-trade render-tree wrappers.
const { installLiveScoreBodyPreserveV4 } = require(
  './src/runtime/LiveScoreBodyPreserveV4'
);
installLiveScoreBodyPreserveV4();

// The old AppPatched ManualExitOverlay also polls trade-live every five seconds.
// Suppress only that component with this lightweight no-network hook. The V9
// root overlay below remains the single global manual-exit control.
const { installDisableLegacyManualExitOverlayV9 } = require(
  './src/runtime/DisableLegacyManualExitOverlayV9'
);
installDisableLegacyManualExitOverlayV9();

// LiveScoreTradeTabEnhancement is patched during the verified OTA workflow to
// render every open trade directly. No additional JSX/tree wrappers are needed.
const AppModule = require('./AppTradeExplanationPatched');
const App = AppModule.default || AppModule;

function SecuredOptionKingApp() {
  return React.createElement(
    BiometricAppLock,
    null,
    React.createElement(
      GlobalManualExitOverlayV9,
      null,
      React.createElement(App)
    )
  );
}

registerRootComponent(SecuredOptionKingApp);
