const React = require("react");
const { AppState } = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const GlobalManualExitOverlayV9 = require("./GlobalManualExitOverlayV9");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const SESSION_CHECK_MS = 5000;

async function apiGet(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  if (!response.ok) throw new Error(`Request failed ${response.status}`);
  return response.json();
}

function SessionAwareManualExitOverlayV10({ children }) {
  const [showExit, setShowExit] = React.useState(false);
  const mountedRef = React.useRef(true);
  const requestRef = React.useRef(false);
  const appStateRef = React.useRef(AppState.currentState);

  const refresh = React.useCallback(async () => {
    if (requestRef.current || appStateRef.current !== "active") return;
    requestRef.current = true;
    try {
      const token = await AsyncStorage.getItem("saas_token");
      if (!token || !String(token).trim()) {
        if (mountedRef.current) setShowExit(false);
        return;
      }

      // This wrapper only decides whether the exit panel must be mounted.
      // /bot/trade-live already reads the authoritative OPEN row, so loading
      // history and the full strategy signal here was duplicate background work.
      const live = await apiGet("/bot/trade-live", token);
      if (!live || live.success === false || typeof live.open !== "boolean") {
        return;
      }
      const hasOpenTrade = Boolean(
        live?.open && String(live?.trade?.status || "OPEN").toUpperCase() === "OPEN"
      );
      if (mountedRef.current) setShowExit(hasOpenTrade);
    } catch (_) {
      // Keep the last known exit state during a temporary Railway/network delay.
    } finally {
      requestRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    appStateRef.current = AppState.currentState;
    refresh();
    const timer = setInterval(refresh, SESSION_CHECK_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      appStateRef.current = state;
      if (state === "active") refresh();
    });

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh]);

  if (!showExit) return children;
  return React.createElement(GlobalManualExitOverlayV9, null, children);
}

module.exports = SessionAwareManualExitOverlayV10;
