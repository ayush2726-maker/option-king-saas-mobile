const React = require("react");
const { AppState } = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const GlobalManualExitOverlayV9 = require("./GlobalManualExitOverlayV9");

const SESSION_CHECK_MS = 1500;

/**
 * Mount the global manual-exit control only while the user has a login session.
 *
 * GlobalManualExitOverlayV9 intentionally sits at the application root so the
 * exit action remains reachable from every authenticated screen. Without this
 * guard the same root placement also renders the EXIT button over Login,
 * Register and Recovery screens.
 */
function SessionAwareManualExitOverlayV10({ children }) {
  const [hasSession, setHasSession] = React.useState(false);
  const mountedRef = React.useRef(true);
  const lastSessionRef = React.useRef(null);

  const refreshSession = React.useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("saas_token");
      const next = Boolean(token && String(token).trim());

      if (mountedRef.current && lastSessionRef.current !== next) {
        lastSessionRef.current = next;
        setHasSession(next);
      }
    } catch (_) {
      if (mountedRef.current && lastSessionRef.current !== false) {
        lastSessionRef.current = false;
        setHasSession(false);
      }
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    refreshSession();

    const timer = setInterval(refreshSession, SESSION_CHECK_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshSession();
    });

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [refreshSession]);

  if (!hasSession) {
    return children;
  }

  return React.createElement(
    GlobalManualExitOverlayV9,
    null,
    children
  );
}

module.exports = SessionAwareManualExitOverlayV10;
