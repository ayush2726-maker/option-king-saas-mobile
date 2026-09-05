import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const { Platform } = require('react-native');

const BiometricAppLock = require('./src/security/BiometricAppLock15m');
const SessionAwareManualExitOverlayV10 = require(
  './src/components/SessionAwareManualExitOverlayV10'
);
const CustomerOnboardingAssistant = require('./src/components/CustomerOnboardingAssistantV2');
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
  // Web must stay isolated from native-only security/onboarding/subscription wrappers.
  // Those wrappers use AppState, LocalAuthentication, native Modal/Linking and timed
  // background checks that can unmount the React Native Web tree after initial load.
  if (Platform.OS === 'web') {
    return React.createElement(
      WebDesktopShell,
      null,
      React.createElement(App)
    );
  }

  return React.createElement(
    BiometricAppLock,
    null,
    React.createElement(
      SubscriptionActivationGate,
      null,
      React.createElement(
        CustomerOnboardingAssistant,
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
    )
  );
}

registerRootComponent(SecuredOptionKingApp);
