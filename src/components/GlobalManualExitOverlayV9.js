const React = require("react");
const {
  ActivityIndicator,
  Alert,
  AppState,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const { normalizeOpenTrades } = require("../runtime/DirectActiveTradeCardV3");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const COUNT_POLL_MS = 15000;

const C = {
  bg: "#080812",
  card: "#13131f",
  panel: "#0f0f1a",
  border: "#292942",
  text: "#e8e8f0",
  muted: "#777793",
  red: "#ff334f",
  green: "#00d4a0",
  blue: "#4d9fff",
  white: "#ffffff",
};

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function price(value) {
  if (value == null || value === "") return "--";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  return `₹${parsed.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function livePrice(trade) {
  return (
    trade?.live_price ??
    trade?.current_price ??
    trade?.last_ltp ??
    trade?.ltp ??
    trade?.entry_price
  );
}

function tradeId(trade) {
  return trade?.id ?? trade?.trade_id ?? trade?.position_id ?? null;
}

function tradeKey(trade, index) {
  const id = tradeId(trade);
  if (id != null) return `id:${String(id)}`;
  return [
    trade?.symbol || "trade",
    trade?.entry_time || trade?.created_at || "",
    trade?.capital_slot ?? "",
    index,
  ].join("|");
}

function snapshotKey(trades) {
  return trades
    .map((trade, index) =>
      [
        tradeKey(trade, index),
        trade?.status || "OPEN",
        livePrice(trade) ?? "",
        trade?.sl_price ?? "",
        trade?.net_pnl ?? trade?.unrealized_pnl ?? trade?.pnl ?? "",
      ].join(":")
    )
    .join("|");
}

async function readJson(response) {
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    throw new Error("Server response read nahi hui.");
  }
  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.message || data?.detail || `Server request failed (${response.status}).`
    );
  }
  return data;
}

async function apiGet(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  return readJson(response);
}

async function apiPost(path, body, token) {
  const response = await fetch(SAAS_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body),
  });
  return readJson(response);
}

async function loadHistory(token) {
  try {
    return await apiGet("/bot/trade-history", token);
  } catch (_) {
    return apiGet("/history/paper", token);
  }
}

function GlobalManualExitOverlayV9({ children }) {
  const [visible, setVisible] = React.useState(false);
  const [trades, setTrades] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState("");
  const [error, setError] = React.useState("");
  const aliveRef = React.useRef(true);
  const requestRef = React.useRef(false);
  const appStateRef = React.useRef(AppState.currentState);
  const snapshotRef = React.useRef("");

  const applyTrades = React.useCallback((next) => {
    const key = snapshotKey(next);
    if (key === snapshotRef.current) return;
    snapshotRef.current = key;
    if (aliveRef.current) setTrades(next);
  }, []);

  const refresh = React.useCallback(
    async ({ full = false, showLoader = false } = {}) => {
      if (requestRef.current || appStateRef.current !== "active") return;
      requestRef.current = true;
      if (showLoader && aliveRef.current) setLoading(true);

      try {
        const token = await AsyncStorage.getItem("saas_token");
        if (!token) {
          snapshotRef.current = "";
          if (aliveRef.current) {
            setTrades([]);
            setError("");
          }
          return;
        }

        const history = await loadHistory(token);
        let live = null;
        let signal = null;
        if (full) {
          [live, signal] = await Promise.all([
            apiGet("/bot/trade-live", token).catch(() => null),
            apiGet("/bot/signal", token).catch(() => null),
          ]);
        }

        applyTrades(normalizeOpenTrades(history, live, signal));
        if (aliveRef.current) setError("");
      } catch (refreshError) {
        if (aliveRef.current && showLoader) {
          setError(String(refreshError?.message || refreshError));
        }
      } finally {
        requestRef.current = false;
        if (showLoader && aliveRef.current) setLoading(false);
      }
    },
    [applyTrades]
  );

  React.useEffect(() => {
    aliveRef.current = true;
    appStateRef.current = AppState.currentState;
    const subscription = AppState.addEventListener("change", (state) => {
      appStateRef.current = state;
      if (state === "active") refresh({ full: false });
    });

    refresh({ full: false });
    const timer = setInterval(() => refresh({ full: false }), COUNT_POLL_MS);
    return () => {
      aliveRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh]);

  const executeExit = React.useCallback(
    async (trade, index) => {
      const id = tradeId(trade);
      if (id == null || busyId) return;
      const key = tradeKey(trade, index);
      setBusyId(key);

      try {
        const token = await AsyncStorage.getItem("saas_token");
        if (!token) throw new Error("Login session nahi mili.");
        const result = await apiPost("/bot/manual-exit", { trade_id: id }, token);
        Alert.alert(
          "Trade Exited",
          result?.message || `${trade?.symbol || "Selected trade"} exit ho gayi.`
        );
        snapshotRef.current = "";
        await refresh({ full: true });
      } catch (exitError) {
        Alert.alert(
          "Exit Failed",
          exitError?.message || "Selected trade ka exit confirm nahi hua."
        );
      } finally {
        if (aliveRef.current) setBusyId("");
      }
    },
    [busyId, refresh]
  );

  const confirmExit = React.useCallback(
    (trade, index) => {
      const id = tradeId(trade);
      if (!trade || id == null || busyId) return;
      Alert.alert(
        "Exit This Trade?",
        `${trade?.symbol || "Selected trade"}\nQty: ${trade?.qty ?? "--"}\nLive: ${price(
          livePrice(trade)
        )}\n\nSirf selected trade exit hogi.`,
        [
          { text: "CANCEL", style: "cancel" },
          {
            text: "EXIT THIS TRADE",
            style: "destructive",
            onPress: () => executeExit(trade, index),
          },
        ]
      );
    },
    [busyId, executeExit]
  );

  return React.createElement(
    View,
    { __okaiRootExitV9: true, style: { flex: 1 } },
    children,
    React.createElement(
      TouchableOpacity,
      {
        __okaiPerTradeExitButton: true,
        accessibilityRole: "button",
        accessibilityLabel: "Open manual trade exit",
        activeOpacity: 0.86,
        onPress: () => {
          setVisible(true);
          refresh({ full: true, showLoader: true });
        },
        style: {
          position: "absolute",
          right: 14,
          bottom: 82,
          minWidth: 82,
          height: 52,
          paddingHorizontal: 15,
          borderRadius: 27,
          backgroundColor: C.red,
          borderWidth: 2,
          borderColor: "#ff91a1",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          zIndex: 999999,
          elevation: 40,
          shadowColor: C.red,
          shadowOpacity: 0.5,
          shadowRadius: 10,
        },
      },
      React.createElement(
        Text,
        { style: { color: C.white, fontSize: 14, fontWeight: "900" } },
        "⛔ EXIT"
      ),
      trades.length
        ? React.createElement(
            View,
            {
              style: {
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                marginLeft: 7,
                paddingHorizontal: 5,
                backgroundColor: C.white,
                alignItems: "center",
                justifyContent: "center",
              },
            },
            React.createElement(
              Text,
              { style: { color: C.red, fontSize: 11, fontWeight: "900" } },
              String(trades.length)
            )
          )
        : null
    ),
    React.createElement(
      Modal,
      {
        visible,
        transparent: false,
        animationType: "slide",
        onRequestClose: () => setVisible(false),
      },
      React.createElement(
        View,
        { style: { flex: 1, backgroundColor: C.bg, paddingTop: 46 } },
        React.createElement(
          View,
          {
            style: {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            },
          },
          React.createElement(
            View,
            { style: { flex: 1, paddingRight: 10 } },
            React.createElement(
              Text,
              { style: { color: C.text, fontSize: 20, fontWeight: "900" } },
              "Manual Trade Exit"
            ),
            React.createElement(
              Text,
              { style: { color: C.muted, fontSize: 11, marginTop: 3 } },
              `LOW-LOAD EXIT V9 • ${trades.length} open trade${trades.length === 1 ? "" : "s"}`
            )
          ),
          React.createElement(
            TouchableOpacity,
            {
              onPress: () => setVisible(false),
              style: {
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: C.panel,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
                justifyContent: "center",
              },
            },
            React.createElement(
              Text,
              { style: { color: C.text, fontSize: 22, fontWeight: "900" } },
              "×"
            )
          )
        ),
        React.createElement(
          ScrollView,
          { contentContainerStyle: { padding: 16, paddingBottom: 40 } },
          React.createElement(
            TouchableOpacity,
            {
              onPress: () => refresh({ full: true, showLoader: true }),
              disabled: loading,
              style: {
                minHeight: 46,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.blue,
                backgroundColor: C.blue + "22",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              },
            },
            loading
              ? React.createElement(ActivityIndicator, { color: C.blue })
              : React.createElement(
                  Text,
                  { style: { color: C.blue, fontSize: 13, fontWeight: "900" } },
                  "REFRESH OPEN TRADES"
                )
          ),
          error
            ? React.createElement(
                Text,
                { style: { color: C.red, fontSize: 11, lineHeight: 17, marginBottom: 10 } },
                error
              )
            : null,
          trades.length === 0
            ? React.createElement(
                View,
                {
                  style: {
                    backgroundColor: C.card,
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 20,
                  },
                },
                React.createElement(
                  Text,
                  { style: { color: C.text, fontSize: 15, fontWeight: "900" } },
                  "Abhi koi open trade nahi hai"
                )
              )
            : trades.map((trade, index) => {
                const key = tradeKey(trade, index);
                const busy = busyId === key;
                const pnl = number(
                  trade?.net_pnl ?? trade?.unrealized_pnl ?? trade?.pnl,
                  0
                );
                return React.createElement(
                  View,
                  {
                    key,
                    style: {
                      backgroundColor: C.card,
                      borderRadius: 15,
                      borderWidth: 1,
                      borderColor: pnl >= 0 ? C.green + "66" : C.red + "66",
                      padding: 14,
                      marginBottom: 12,
                    },
                  },
                  React.createElement(
                    Text,
                    { style: { color: C.text, fontSize: 14, fontWeight: "900" } },
                    trade?.symbol || `OPEN TRADE ${index + 1}`
                  ),
                  React.createElement(
                    Text,
                    { style: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 7 } },
                    `Qty ${trade?.qty ?? "--"} • Entry ${price(
                      trade?.entry_price
                    )} • Live ${price(livePrice(trade))}`
                  ),
                  React.createElement(
                    Text,
                    {
                      style: {
                        color: pnl >= 0 ? C.green : C.red,
                        fontSize: 15,
                        fontWeight: "900",
                        marginTop: 7,
                      },
                    },
                    `${pnl >= 0 ? "+" : ""}₹${pnl.toFixed(2)}`
                  ),
                  React.createElement(
                    TouchableOpacity,
                    {
                      __okaiPerTradeExitButton: true,
                      onPress: () => confirmExit(trade, index),
                      disabled: busy || tradeId(trade) == null,
                      style: {
                        minHeight: 50,
                        borderRadius: 13,
                        marginTop: 12,
                        backgroundColor: C.red,
                        borderWidth: 1,
                        borderColor: "#ff91a1",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: busy || tradeId(trade) == null ? 0.55 : 1,
                      },
                    },
                    busy
                      ? React.createElement(ActivityIndicator, { color: C.white })
                      : React.createElement(
                          Text,
                          { style: { color: C.white, fontSize: 13, fontWeight: "900" } },
                          `EXIT THIS TRADE (${index + 1}/${trades.length})`
                        )
                  )
                );
              })
        )
      )
    )
  );
}

module.exports = GlobalManualExitOverlayV9;
