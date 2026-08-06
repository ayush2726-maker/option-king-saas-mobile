const React = require("react");
const { AppState } = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const GlobalManualExitOverlayV9 = require("./GlobalManualExitOverlayV9");
const { normalizeOpenTrades } = require("../runtime/DirectActiveTradeCardV3");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const SESSION_CHECK_MS = 3000;

async function apiGet(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  if (!response.ok) throw new Error(`Request failed ${response.status}`);
  return response.json();
}

async function loadHistory(token) {
  try {
    return await apiGet("/bot/trade-history", token);
  } catch (_) {
    return apiGet("/history/paper", token);
  }
}

function SessionAwareManualExitOverlayV10({ children }) {
  const [showExit, setShowExit] = React.useState(false);
  const mountedRef = React.useRef(true);
  const requestRef = React.useRef(false);

  const refresh = React.useCallback(async () => {
    if (requestRef.current) return;
    requestRef.current = true;
    try {
      const token = await AsyncStorage.getItem("saas_token");
      if (!token || !String(token).trim()) {
        if (mountedRef.current) setShowExit(false);
        return;
      }

      const [history, live, signal] = await Promise.all([
        loadHistory(token).catch(() => null),
        apiGet("/bot/trade-live", token).catch(() => null),
        apiGet("/bot/signal", token).catch(() => null),
      ]);
      const openTrades = normalizeOpenTrades(history, live, signal);
      if (mountedRef.current) setShowExit(openTrades.length > 0);
    } catch (_) {
      if (mountedRef.current) setShowExit(false);
    } finally {
      requestRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    refresh();
    const timer = setInterval(refresh, SESSION_CHECK_MS);
    const subscription = AppState.addEventListener("change", (state) => {
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
