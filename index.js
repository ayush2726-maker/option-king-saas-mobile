import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const BiometricAppLock = require('./src/security/BiometricAppLock15m');
const SessionAwareManualExitOverlayV10 = require(
  './src/components/SessionAwareManualExitOverlayV10'
);
const WebDesktopShell = require('./src/web/WebDesktopShell');
const SubscriptionActivationGate = require('./src/runtime/SubscriptionActivationGate');

const { installProfessionalLanguagePatch } = require(
  './src/runtime/ProfessionalLanguagePatch'
);
installProfessionalLanguagePatch();

const { installHindiNewsResponsePatch } = require(
  './src/runtime/HindiNewsResponsePatch'
);
installHindiNewsResponsePatch();

const { installLiveScoreBodyPreserveV4 } = require(
  './src/runtime/LiveScoreBodyPreserveV4'
);
installLiveScoreBodyPreserveV4();

const { installDisableLegacyManualExitOverlayV9 } = require(
  './src/runtime/DisableLegacyManualExitOverlayV9'
);
installDisableLegacyManualExitOverlayV9();

const { installLiveTradeAuthorityPatch } = require(
  './src/runtime/LiveTradeAuthorityPatch'
);
installLiveTradeAuthorityPatch();

const AppModule = require('./AppTradeExplanationPatched');
const App = AppModule.default || AppModule;

function SecuredOptionKingApp() {
  return React.createElement(
    BiometricAppLock,
    null,
    React.createElement(
      SubscriptionActivationGate,
      null,
      React.createElement(
        WebDesktopShell,
        null,
        React.createElement(
          SessionAwareManualExitOverlayV10,
          null,
          React.createElement(App)
        )
      )
    )
  );
}

registerRootComponent(SecuredOptionKingApp);
