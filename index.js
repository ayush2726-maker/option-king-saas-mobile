import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const { Platform } = require('react-native');

function WebRoot() {
  // Browser stays isolated from native-only wrappers, but uses the current
  // patched app stack so the latest UI and web navigation bridge are present.
  const WebDesktopShellModule = require('./src/web/WebDesktopShell');
  const WebDesktopShell = WebDesktopShellModule.default || WebDesktopShellModule;
  const WebAppModule = require('./AppTradeExplanationPatched');
  const WebApp = WebAppModule.default || WebAppModule;

  return React.createElement(
    WebDesktopShell,
    null,
    React.createElement(WebApp)
  );
}

function NativeRoot() {
  const BiometricAppLockModule = require('./src/security/BiometricAppLock15m');
  const BiometricAppLock = BiometricAppLockModule.default || BiometricAppLockModule;
  const SessionAwareManualExitOverlayV10Module = require(
    './src/components/SessionAwareManualExitOverlayV10'
  );
  const SessionAwareManualExitOverlayV10 =
    SessionAwareManualExitOverlayV10Module.default || SessionAwareManualExitOverlayV10Module;
  const CustomerOnboardingAssistantModule = require('./src/components/CustomerOnboardingAssistantV2');
  const CustomerOnboardingAssistant =
    CustomerOnboardingAssistantModule.default || CustomerOnboardingAssistantModule;
  const SubscriptionActivationGateModule = require('./src/runtime/SubscriptionActivationGate');
  const SubscriptionActivationGate =
    SubscriptionActivationGateModule.default || SubscriptionActivationGateModule;

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
          SessionAwareManualExitOverlayV10,
          null,
          React.createElement(App)
        )
      )
    )
  );
}

function OptionKingRoot() {
  return Platform.OS === 'web'
    ? React.createElement(WebRoot)
    : React.createElement(NativeRoot);
}

registerRootComponent(OptionKingRoot);
