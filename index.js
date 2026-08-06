import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const BiometricAppLock = require('./src/security/BiometricAppLock15m');
const SessionAwareManualExitOverlayV10 = require(
  './src/components/SessionAwareManualExitOverlayV10'
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
// Suppress only that component with this lightweight no-network hook.
const { installDisableLegacyManualExitOverlayV9 } = require(
  './src/runtime/DisableLegacyManualExitOverlayV9'
);
installDisableLegacyManualExitOverlayV9();

const AppModule = require('./AppTradeExplanationPatched');
const App = AppModule.default || AppModule;

// Install after the Trade-tab enhancement module has loaded. It wraps the real
// LiveStrategyScoreCard and renders exact strategy/execution reasons below it.
const { installFinalDecisionReasonPanelV1 } = require(
  './src/runtime/FinalDecisionReasonPanelV1'
);
installFinalDecisionReasonPanelV1();

function SecuredOptionKingApp() {
  return React.createElement(
    BiometricAppLock,
    null,
    React.createElement(
      SessionAwareManualExitOverlayV10,
      null,
      React.createElement(App)
    )
  );
}

registerRootComponent(SecuredOptionKingApp);
