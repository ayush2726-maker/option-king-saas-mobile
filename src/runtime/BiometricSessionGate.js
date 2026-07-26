const React = require("react");
const {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;

const ENABLED_KEY = "okai_biometric_enabled";
const OFFERED_KEY = "okai_biometric_offer_seen_v1";
const SECURE_SESSION_KEY = "okai_biometric_session_v1";

let storageBridgeInstalled = false;
let nativeModulesCache;

function nativeModules() {
  if (nativeModulesCache !== undefined) return nativeModulesCache;

  try {
    nativeModulesCache = {
      LocalAuthentication: require("expo-local-authentication"),
      SecureStore: require("expo-secure-store"),
    };
  } catch (_) {
    nativeModulesCache = null;
  }

  return nativeModulesCache;
}

async function deleteSecureSession() {
  const modules = nativeModules();
  if (!modules) return;
  try {
    await modules.SecureStore.deleteItemAsync(SECURE_SESSION_KEY);
  } catch (_) {}
}

function installBiometricStorageLogoutBridge() {
  if (storageBridgeInstalled) return;
  storageBridgeInstalled = true;

  const originalMultiRemove = AsyncStorage.multiRemove.bind(AsyncStorage);
  const originalRemoveItem = AsyncStorage.removeItem.bind(AsyncStorage);

  AsyncStorage.multiRemove = async function biometricAwareMultiRemove(keys, callback) {
    const list = Array.isArray(keys) ? keys.map(String) : [];
    const result = await originalMultiRemove(keys, callback);
    if (list.includes("saas_token")) {
      await deleteSecureSession();
    }
    return result;
  };

  AsyncStorage.removeItem = async function biometricAwareRemoveItem(key, callback) {
    const result = await originalRemoveItem(key, callback);
    if (String(key) === "saas_token") {
      await deleteSecureSession();
    }
    return result;
  };
}

installBiometricStorageLogoutBridge();

function parseSession(raw) {
  try {
    const value = JSON.parse(String(raw || ""));
    if (!value || !value.token || !value.user) return null;
    return {
      token: String(value.token),
      user: value.user,
    };
  } catch (_) {
    return null;
  }
}

async function saveSecureSession(token, user) {
  const modules = nativeModules();
  if (!modules || !token || !user) return false;

  try {
    await modules.SecureStore.setItemAsync(
      SECURE_SESSION_KEY,
      JSON.stringify({ token: String(token), user })
    );
    return true;
  } catch (_) {
    return false;
  }
}

async function loadSecureSession() {
  const modules = nativeModules();
  if (!modules) return null;

  try {
    const raw = await modules.SecureStore.getItemAsync(SECURE_SESSION_KEY);
    return parseSession(raw);
  } catch (_) {
    return null;
  }
}

async function biometricAvailable() {
  const modules = nativeModules();
  if (!modules) return false;

  try {
    const [hardware, enrolled] = await Promise.all([
      modules.LocalAuthentication.hasHardwareAsync(),
      modules.LocalAuthentication.isEnrolledAsync(),
    ]);
    return Boolean(hardware && enrolled);
  } catch (_) {
    return false;
  }
}

async function authenticate(promptMessage) {
  const modules = nativeModules();
  if (!modules) return { success: false, error: "not_available" };

  try {
    return await modules.LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || "Unlock Option King AI",
      cancelLabel: "Cancel",
      fallbackLabel: "Use phone PIN",
      disableDeviceFallback: false,
    });
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message ? error.message : error),
    };
  }
}

function BiometricSessionGate({ children }) {
  const [phase, setPhase] = React.useState("loading");
  const [message, setMessage] = React.useState("");
  const busyRef = React.useRef(false);
  const offerRef = React.useRef(false);

  const unlockWithBiometric = React.useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPhase("checking");
    setMessage("");

    try {
      const saved = await loadSecureSession();
      if (!saved) {
        await AsyncStorage.multiRemove(["saas_token", "saas_user"]);
        setMessage("Saved biometric login is unavailable. Please login with password once.");
        setPhase("password");
        return;
      }

      const result = await authenticate("Unlock Option King AI");
      if (!result || !result.success) {
        setMessage(
          result && result.error === "lockout"
            ? "Biometric temporarily locked. Use your password or phone PIN."
            : "Biometric verification was not completed."
        );
        setPhase("locked");
        return;
      }

      await AsyncStorage.multiSet([
        ["saas_token", saved.token],
        ["saas_user", JSON.stringify(saved.user)],
      ]);
      setPhase("open");
    } finally {
      busyRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      const enabled = await AsyncStorage.getItem(ENABLED_KEY);
      if (!alive) return;

      if (enabled !== "1") {
        setPhase("open");
        return;
      }

      if (!(await biometricAvailable())) {
        await AsyncStorage.multiRemove(["saas_token", "saas_user"]);
        if (!alive) return;
        setMessage("Fingerprint or face unlock is not set on this phone. Login with password.");
        setPhase("password");
        return;
      }

      if (alive) unlockWithBiometric();
    })();

    return () => {
      alive = false;
    };
  }, [unlockWithBiometric]);

  React.useEffect(() => {
    if (phase !== "open") return undefined;

    let alive = true;
    const checkForEnrollment = async () => {
      try {
        const [[, token], [, userRaw], [, enabled], [, offered]] =
          await AsyncStorage.multiGet([
            "saas_token",
            "saas_user",
            ENABLED_KEY,
            OFFERED_KEY,
          ]);

        if (!alive || !token || !userRaw) return;

        let user;
        try {
          user = JSON.parse(userRaw);
        } catch (_) {
          return;
        }

        if (enabled === "1") {
          const current = await loadSecureSession();
          if (!current || current.token !== token) {
            await saveSecureSession(token, user);
          }
          return;
        }

        if (offered === "1" || offerRef.current) return;
        if (!(await biometricAvailable())) return;

        offerRef.current = true;
        await AsyncStorage.setItem(OFFERED_KEY, "1");

        Alert.alert(
          "Enable Biometric Login?",
          "Next time you can open Option King AI with fingerprint or face unlock. Your password remains available as a fallback.",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Enable",
              onPress: async () => {
                const result = await authenticate("Enable biometric login");
                if (!result || !result.success) {
                  Alert.alert(
                    "Biometric Not Enabled",
                    "Verification was cancelled or failed. You can continue using your password."
                  );
                  return;
                }

                const saved = await saveSecureSession(token, user);
                if (!saved) {
                  Alert.alert(
                    "Biometric Not Enabled",
                    "Secure storage is unavailable in this app build. Install the latest APK and try again."
                  );
                  return;
                }

                await AsyncStorage.setItem(ENABLED_KEY, "1");
                Alert.alert(
                  "Biometric Login Enabled",
                  "Fingerprint or face unlock will be requested the next time the app opens."
                );
              },
            },
          ]
        );
      } catch (_) {}
    };

    checkForEnrollment();
    const timer = setInterval(checkForEnrollment, 1500);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [phase]);

  const usePassword = React.useCallback(async () => {
    await AsyncStorage.multiRemove(["saas_token", "saas_user"]);
    setMessage("");
    setPhase("open");
  }, []);

  if (phase === "open") return children;

  if (phase === "password") {
    return React.createElement(
      View,
      { style: styles.screen },
      React.createElement(Text, { style: styles.logo }, "👑"),
      React.createElement(Text, { style: styles.title }, "Option King AI"),
      React.createElement(Text, { style: styles.message }, message),
      React.createElement(
        TouchableOpacity,
        { style: styles.primaryButton, onPress: usePassword },
        React.createElement(Text, { style: styles.primaryText }, "LOGIN WITH PASSWORD")
      )
    );
  }

  if (phase === "locked") {
    return React.createElement(
      View,
      { style: styles.screen },
      React.createElement(Text, { style: styles.logo }, "🔐"),
      React.createElement(Text, { style: styles.title }, "Biometric Login"),
      React.createElement(
        Text,
        { style: styles.message },
        message || "Verify your fingerprint or face to continue."
      ),
      React.createElement(
        TouchableOpacity,
        { style: styles.primaryButton, onPress: unlockWithBiometric },
        React.createElement(Text, { style: styles.primaryText }, "USE FINGERPRINT / FACE")
      ),
      React.createElement(
        TouchableOpacity,
        { style: styles.secondaryButton, onPress: usePassword },
        React.createElement(Text, { style: styles.secondaryText }, "Login with password")
      )
    );
  }

  return React.createElement(
    View,
    { style: styles.screen },
    React.createElement(Text, { style: styles.logo }, "👑"),
    React.createElement(ActivityIndicator, { size: "large", color: "#7c6deb" }),
    React.createElement(
      Text,
      { style: styles.message },
      phase === "checking" ? "Waiting for biometric verification..." : "Checking secure login..."
    )
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logo: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: "#e8e8f0",
    fontSize: 23,
    fontWeight: "900",
    marginBottom: 10,
  },
  message: {
    color: "#a0a0c0",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    minWidth: 250,
    backgroundColor: "#7c6deb22",
    borderWidth: 1,
    borderColor: "#7c6deb",
    borderRadius: 13,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#9c91ff",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    minWidth: 250,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryText: {
    color: "#a0a0c0",
    fontSize: 13,
    fontWeight: "800",
  },
});

module.exports = {
  BiometricSessionGate,
  BIOMETRIC_SECURE_SESSION_KEY: SECURE_SESSION_KEY,
};
