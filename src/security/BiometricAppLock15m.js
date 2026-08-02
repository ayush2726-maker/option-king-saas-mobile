const React = require("react");
const {
  AppState,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const LocalAuthentication = require("expo-local-authentication");

const TOKEN_KEY = "saas_token";
const USER_KEY = "saas_user";
const BIOMETRIC_GRACE_MS = 15 * 60 * 1000;

function BiometricAppLock15m({ children }) {
  const [checking, setChecking] = React.useState(true);
  const [locked, setLocked] = React.useState(false);
  const [authenticating, setAuthenticating] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const mountedRef = React.useRef(true);
  const biometricReadyRef = React.useRef(false);
  const authenticatingRef = React.useRef(false);
  const backgroundedAtRef = React.useRef(null);

  const clearSessionForPasswordLogin = React.useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    biometricReadyRef.current = false;
    backgroundedAtRef.current = null;
    if (!mountedRef.current) return;
    setLocked(false);
    setMessage("");
  }, []);

  const authenticate = React.useCallback(async () => {
    if (
      !mountedRef.current ||
      authenticatingRef.current ||
      !biometricReadyRef.current
    ) {
      return;
    }

    authenticatingRef.current = true;
    setAuthenticating(true);
    setMessage("");

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Option King AI",
        promptSubtitle: "Use fingerprint, Face ID, or your device security",
        cancelLabel: "Cancel",
        fallbackLabel: "Use device passcode",
        disableDeviceFallback: false,
      });

      if (!mountedRef.current) return;
      if (result && result.success) {
        setLocked(false);
        setMessage("");
      } else {
        setLocked(true);
        setMessage(
          "Unlock cancel hua. Fingerprint/Face ID dobara try karo ya password login use karo."
        );
      }
    } catch (_) {
      if (!mountedRef.current) return;
      setLocked(true);
      setMessage(
        "Biometric unlock available nahi hua. Dobara try karo ya password login use karo."
      );
    } finally {
      authenticatingRef.current = false;
      if (mountedRef.current) setAuthenticating(false);
    }
  }, []);

  const evaluateSession = React.useCallback(
    async ({ prompt = false } = {}) => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!mountedRef.current) return;

        if (!token) {
          biometricReadyRef.current = false;
          setLocked(false);
          setChecking(false);
          return;
        }

        const [hasHardware, isEnrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        if (!mountedRef.current) return;

        const ready = Boolean(hasHardware && isEnrolled);
        biometricReadyRef.current = ready;
        setChecking(false);

        if (!ready) {
          await clearSessionForPasswordLogin();
          return;
        }

        setLocked(true);
        if (prompt) {
          setTimeout(() => {
            if (mountedRef.current) authenticate();
          }, 250);
        }
      } catch (_) {
        if (!mountedRef.current) return;
        setChecking(false);
        await clearSessionForPasswordLogin();
      }
    },
    [authenticate, clearSessionForPasswordLogin]
  );

  React.useEffect(() => {
    mountedRef.current = true;
    evaluateSession({ prompt: true });

    const subscription = AppState.addEventListener("change", async (nextState) => {
      if (nextState === "inactive" || nextState === "background") {
        if (backgroundedAtRef.current == null) {
          backgroundedAtRef.current = Date.now();
        }
        return;
      }

      if (nextState !== "active" || backgroundedAtRef.current == null) return;

      const elapsed = Date.now() - backgroundedAtRef.current;
      backgroundedAtRef.current = null;

      if (elapsed >= BIOMETRIC_GRACE_MS) {
        await evaluateSession({ prompt: true });
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.remove();
    };
  }, [evaluateSession]);

  const usePasswordLogin = React.useCallback(async () => {
    setAuthenticating(true);
    try {
      await clearSessionForPasswordLogin();
    } finally {
      if (mountedRef.current) setAuthenticating(false);
    }
  }, [clearSessionForPasswordLogin]);

  if (checking) {
    return React.createElement(
      SafeAreaView,
      { style: styles.screen },
      React.createElement(ActivityIndicator, { size: "large", color: "#00d4a0" }),
      React.createElement(Text, { style: styles.loadingText }, "Securing Option King AI…")
    );
  }

  if (!locked) return children;

  return React.createElement(
    SafeAreaView,
    { style: styles.screen },
    React.createElement(
      View,
      { style: styles.card },
      React.createElement(Text, { style: styles.icon }, "🔐"),
      React.createElement(Text, { style: styles.title }, "Option King AI Locked"),
      React.createElement(
        Text,
        { style: styles.subtitle },
        "App 15 minute se zyada background me thi. Dashboard kholne ke liye fingerprint, Face ID, ya device security use karo."
      ),
      message ? React.createElement(Text, { style: styles.message }, message) : null,
      React.createElement(
        TouchableOpacity,
        {
          style: styles.primaryButton,
          onPress: authenticate,
          disabled: authenticating,
          accessibilityRole: "button",
          accessibilityLabel: "Unlock with biometrics",
        },
        authenticating
          ? React.createElement(ActivityIndicator, { color: "#04120f" })
          : React.createElement(Text, { style: styles.primaryText }, "Unlock Now")
      ),
      React.createElement(
        TouchableOpacity,
        {
          style: styles.secondaryButton,
          onPress: usePasswordLogin,
          disabled: authenticating,
          accessibilityRole: "button",
          accessibilityLabel: "Use password login",
        },
        React.createElement(Text, { style: styles.secondaryText }, "Use Password Login")
      ),
      React.createElement(
        Text,
        { style: styles.note },
        "15 minute ke andar app switch karke wapas aane par biometric dobara nahi maanga jayega."
      )
    )
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#070a10",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  loadingText: { color: "#a6b1c2", fontSize: 13, marginTop: 14 },
  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#111724",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#20493f",
    padding: 24,
    alignItems: "center",
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: {
    color: "#f5f7fb",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#a6b1c2",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 18,
  },
  message: {
    width: "100%",
    color: "#f5c842",
    backgroundColor: "#2b2411",
    borderRadius: 12,
    padding: 11,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  primaryButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#00d4a0",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#04120f", fontSize: 15, fontWeight: "900" },
  secondaryButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#405064",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 11,
  },
  secondaryText: { color: "#dce5f2", fontSize: 14, fontWeight: "800" },
  note: {
    color: "#718096",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 14,
  },
});

module.exports = BiometricAppLock15m;
module.exports.BIOMETRIC_GRACE_MS = BIOMETRIC_GRACE_MS;
module.exports.BIOMETRIC_LOCK_MARKER = "OKAI_BIOMETRIC_APP_LOCK_15M_V2";
