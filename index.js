import './src/polyfills';
import { registerRootComponent } from 'expo';

const React = require('react');
const { Platform } = require('react-native');

function WebRoot() {
  // Keep the browser bundle on the smallest, safest path possible.
  // Do not import native wrappers or enhancement installers on web: several of
  // them monkey-patch React / schedule background checks and can tear down the
  // RN Web tree after the first successful paint.
  const WebDesktopShellModule = require('./src/web/WebDesktopShell');
  const WebDesktopShell = WebDesktopShellModule.default || WebDesktopShellModule;
  const BaseAppModule = require('./App');
  const BaseApp = BaseAppModule.default || BaseAppModule;

  return React.createElement(
    WebDesktopShell,
    null,
    React.createElement(BaseApp)
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
