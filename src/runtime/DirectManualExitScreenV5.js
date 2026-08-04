const React = require("react");
const ReactNative = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const { normalizeOpenTrades } = require("./DirectActiveTradeCardV3");

const {
  ActivityIndicator,
  Alert,
  AppState,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} = ReactNative;

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const POLL_MS = 3000;
const MARKER = "OKAI-DIRECT-MANUAL-EXIT-SCREEN-V5";

const C = {
  card: "#13131f",
  panel: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#777793",
  green: "#00d4a0",
  red: "#ff4d6d",
  blue: "#4d9fff",
};

let installed = false;

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

function tradeId(trade, index = 0) {
  return String(
    trade?.id ??
      `${trade?.symbol || "trade"}-${trade?.entry_time || trade?.created_at || index}`
  );
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

function ManualExitPanel() {
  const [trades, setTrades] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState("");
  const [error, setError] = React.useState("");
  const aliveRef = React.useRef(true);
  const requestRef = React.useRef(false);
  const appStateRef = React.useRef(AppState.currentState);

  const refresh = React.useCallback(async (showLoader = false) => {
    if (requestRef.current || appStateRef.current !== "active") return;
    requestRef.current = true;
    if (showLoader && aliveRef.current) setLoading(true);

    try {
      const token = await AsyncStorage.getItem("saas_token");
      if (!token) throw new Error("Login session nahi mili.");

      const [history, live, signal] = await Promise.all([
        loadHistory(token),
        apiGet("/bot/trade-live", token).catch(() => null),
        apiGet("/bot/signal", token).catch(() => null),
      ]);

      const next = normalizeOpenTrades(history, live, signal);
      if (aliveRef.current) {
        setTrades(next);
        setError("");
      }
    } catch (refreshError) {
      if (aliveRef.current) {
        setError(String(refreshError?.message || refreshError));
      }
    } finally {
      requestRef.current = false;
      if (showLoader && aliveRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    aliveRef.current = true;
    appStateRef.current = AppState.currentState;

    const subscription = AppState.addEventListener("change", (state) => {
      appStateRef.current = state;
      if (state === "active") refresh(false);
    });

    refresh(true);
    const timer = setInterval(() => refresh(false), POLL_MS);

    return () => {
      aliveRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh]);

  const executeExit = React.useCallback(
    async (trade, index) => {
      if (trade?.id == null || busyId) return;
      const id = tradeId(trade, index);
      setBusyId(id);

      try {
        const token = await AsyncStorage.getItem("saas_token");
        if (!token) throw new Error("Login session nahi mili.");

        const data = await apiPost(
          "/bot/manual-exit",
          { trade_id: trade.id },
          token
        );

        Alert.alert(
          "Trade Exited",
          data?.message || `${trade?.symbol || "Selected trade"} exit ho gayi.`
        );
        await refresh(false);
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
      if (!trade || trade?.id == null || busyId) return;
      Alert.alert(
        "Exit This Trade?",
        `${trade?.symbol || "Selected trade"}\nQty: ${trade?.qty ?? "--"}\nLive: ${price(
          livePrice(trade)
        )}\n\nSirf ye trade exit hogi. Dusri open trade par koi asar nahi padega.`,
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
    {
      __okaiDirectManualExitPanelV5: true,
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: trades.length ? C.red + "77" : C.border,
        padding: 14,
        marginBottom: 12,
        elevation: 7,
      },
    },
    React.createElement(
      View,
      {
        style: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 10 } },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 17, fontWeight: "900" } },
          "⛔ Manual Trade Exit"
        ),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 } },
          trades.length
            ? `${trades.length} open trade${trades.length === 1 ? "" : "s"} • Har trade ka alag Exit button`
            : "Open trade aate hi uska Exit button yahan dikhega."
        )
      ),
      React.createElement(
        TouchableOpacity,
        {
          onPress: () => refresh(true),
          disabled: loading,
          style: { paddingVertical: 8, paddingLeft: 8 },
        },
        loading
          ? React.createElement(ActivityIndicator, { color: C.blue, size: "small" })
          : React.createElement(
              Text,
              { style: { color: C.blue, fontSize: 12, fontWeight: "900" } },
              "Refresh"
            )
      )
    ),
    error
      ? React.createElement(
          Text,
          { style: { color: C.red, fontSize: 10, lineHeight: 15, marginTop: 8 } },
          error
        )
      : null,
    trades.map((trade, index) => {
      const id = tradeId(trade, index);
      const busy = busyId === id;
      const pnl = number(trade?.net_pnl ?? trade?.unrealized_pnl ?? trade?.pnl, 0);

      return React.createElement(
        View,
        {
          key: id,
          style: {
            backgroundColor: C.panel,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: pnl >= 0 ? C.green + "55" : C.red + "55",
            padding: 11,
            marginTop: 10,
          },
        },
        React.createElement(
          View,
          {
            style: {
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
            },
          },
          React.createElement(
            View,
            { style: { flex: 1, paddingRight: 8 } },
            React.createElement(
              Text,
              { style: { color: C.text, fontSize: 13, fontWeight: "900" } },
              trade?.symbol || "OPEN TRADE"
            ),
            React.createElement(
              Text,
              { style: { color: C.muted, fontSize: 10, marginTop: 4 } },
              `Qty ${trade?.qty ?? "--"} • Entry ${price(trade?.entry_price)} • Live ${price(
                livePrice(trade)
              )}`
            )
          ),
          React.createElement(
            Text,
            {
              style: {
                color: pnl >= 0 ? C.green : C.red,
                fontSize: 12,
                fontWeight: "900",
              },
            },
            `${pnl >= 0 ? "+" : ""}₹${pnl.toFixed(2)}`
          )
        ),
        React.createElement(
          TouchableOpacity,
          {
            __okaiPerTradeExitButtonV5: true,
            accessibilityRole: "button",
            accessibilityLabel: `Exit ${trade?.symbol || `trade ${index + 1}`}`,
            onPress: () => confirmExit(trade, index),
            disabled: busy || trade?.id == null,
            activeOpacity: 0.84,
            style: {
              minHeight: 48,
              borderRadius: 12,
              marginTop: 11,
              backgroundColor: C.red,
              borderWidth: 1,
              borderColor: "#ff7a90",
              alignItems: "center",
              justifyContent: "center",
              opacity: busy || trade?.id == null ? 0.55 : 1,
            },
          },
          busy
            ? React.createElement(ActivityIndicator, { color: "#ffffff", size: "small" })
            : React.createElement(
                Text,
                { style: { color: "#ffffff", fontSize: 13, fontWeight: "900" } },
                `EXIT THIS TRADE (${index + 1}/${trades.length})`
              )
        )
      );
    })
  );
}

function collectText(value, output = [], depth = 0) {
  if (value == null || value === false || depth > 20) return output;
  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output, depth + 1));
    return output;
  }
  if (!React.isValidElement(value)) return output;
  collectText(value.props?.children, output, depth + 1);
  collectText(value.props?.label, output, depth + 1);
  collectText(value.props?.title, output, depth + 1);
  return output;
}

function signature(value) {
  return collectText(value)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isTargetScreen(type, props) {
  if (
    type !== ScrollView ||
    props?.__okaiManualExitInjectedV5 ||
    props?.__okaiDirectManualExitPanelV5
  ) {
    return false;
  }

  const text = signature(props?.children);
  const tradeScreen =
    (text.includes("active paper trade") || text.includes("active live trade")) &&
    text.includes("trade history");
  const botScreen =
    text.includes("auto portfolio") &&
    text.includes("active positions") &&
    text.includes("graph history");

  return tradeScreen || botScreen;
}

function withPanel(props) {
  const existing = React.Children.toArray(props?.children);
  return {
    ...(props || {}),
    __okaiManualExitInjectedV5: true,
    children: [
      React.createElement(ManualExitPanel, {
        key: "okai-direct-manual-exit-panel-v5",
      }),
      ...existing,
    ],
  };
}

function patchJsxRuntime(runtime) {
  if (!runtime) return;

  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__okaiManualExitV5) return;

    const wrapped = function okaiManualExitJsx(type, props, reactKey, ...rest) {
      if (isTargetScreen(type, props || {})) {
        return previous(type, withPanel(props || {}), reactKey, ...rest);
      }
      return previous(type, props, reactKey, ...rest);
    };

    wrapped.__okaiManualExitV5 = true;
    runtime[key] = wrapped;
  });
}

function installDirectManualExitScreenV5() {
  if (installed || React.__OKAI_DIRECT_MANUAL_EXIT_SCREEN_V5__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiManualExitCreateElement(type, props, ...children) {
    const suppliedProps = children.length
      ? {
          ...(props || {}),
          children: children.length === 1 ? children[0] : children,
        }
      : props || {};

    if (isTargetScreen(type, suppliedProps)) {
      return previousCreateElement(type, withPanel(suppliedProps));
    }
    return previousCreateElement(type, suppliedProps);
  };

  try {
    patchJsxRuntime(require("react/jsx-runtime"));
  } catch (_) {}
  try {
    patchJsxRuntime(require("react/jsx-dev-runtime"));
  } catch (_) {}

  React.__OKAI_DIRECT_MANUAL_EXIT_SCREEN_V5__ = true;
}

module.exports = {
  installDirectManualExitScreenV5,
  MANUAL_EXIT_SCREEN_V5_MARKER: MARKER,
};
