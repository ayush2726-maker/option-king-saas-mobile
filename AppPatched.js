import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { installHighContrastDarkThemeEnhancement } = require(
  "./src/runtime/HighContrastDarkThemeEnhancement"
);
const { installProfessionalLanguageEnhancement } = require(
  "./src/i18n/ProfessionalLanguageEnhancement"
);
const { installAppNetworkPerformanceEnhancement } = require(
  "./src/runtime/AppNetworkPerformanceEnhancement"
);
const { installFreshDataEnhancement } = require(
  "./src/runtime/FreshDataEnhancement"
);
const { installPaperHistoryChartBridgeEnhancement } = require(
  "./src/runtime/PaperHistoryChartBridgeEnhancement"
);
const { installPullToRefreshEnhancement } = require(
  "./src/runtime/PullToRefreshEnhancement"
);
const { installTradeMarkerChartEnhancement } = require(
  "./src/runtime/TradeMarkerChartEnhancement"
);
const { installLiveChartEnhancement } = require(
  "./src/runtime/LiveChartEnhancement"
);
const {
  installTradeLivePriceEnhancement,
  updateTradeLiveSnapshot,
} = require("./src/runtime/TradeLivePriceEnhancement");
const { installRangeBacktestEnhancement } = require(
  "./src/runtime/RangeBacktestEnhancement"
);
const { installUnlimitedRangeBacktestEnhancement } = require(
  "./src/runtime/UnlimitedRangeBacktestEnhancement"
);
const { installRangeBacktestReliableEnhancement } = require(
  "./src/runtime/RangeBacktestReliableEnhancement"
);
const { installTradeStatusEnhancement } = require(
  "./src/runtime/TradeStatusEnhancement"
);
const { installStrategyApplyCheckEnhancement } = require(
  "./src/runtime/StrategyApplyCheckEnhancement"
);
const { installLiveScoreTradeTabEnhancement } = require(
  "./src/runtime/LiveScoreTradeTabEnhancement"
);
const { installHomeAccordionEnhancement } = require(
  "./src/runtime/HomeAccordionEnhancement"
);
const { installMoneyDisplayEnhancement } = require(
  "./src/runtime/MoneyDisplayEnhancement"
);
const { installBrokerSelectionFetchEnhancement } = require(
  "./src/runtime/BrokerSelectionFetchEnhancement"
);
const { installBrokerPanelPlacementEnhancement } = require(
  "./src/runtime/BrokerPanelPlacementEnhancement"
);
const {
  installAutoLogoutOnTokenExpiryEnhancement,
  subscribeAutoLogout,
} = require("./src/runtime/AutoLogoutOnTokenExpiryEnhancement");

installHighContrastDarkThemeEnhancement();

// Install language normalization before any screen module is loaded. This keeps
// Hindi in Devanagari and English in English across JSX, alerts, placeholders,
// runtime enhancements, and common backend messages.
installProfessionalLanguageEnhancement();

// Cache heavy read-only API calls and merge duplicate requests before the other
// fetch wrappers capture global.fetch. Strategy saves still invalidate the cache.
installAppNetworkPerformanceEnhancement();

// Order matters. The reliable Paper-history bridge wraps the fresh-data fetch
// layer so Bot P&L and Today P&L always read the same server trade rows.
installFreshDataEnhancement();
installPaperHistoryChartBridgeEnhancement();
installPullToRefreshEnhancement();
installLiveChartEnhancement();
installTradeMarkerChartEnhancement();
installTradeLivePriceEnhancement();
installRangeBacktestEnhancement();
installUnlimitedRangeBacktestEnhancement();
installRangeBacktestReliableEnhancement();
installTradeStatusEnhancement();
// Safe client-side check: /bot/signal response me active strategy markers add
// karta hai. Backend/Railway runtime ya healthcheck ko touch nahi karta.
installStrategyApplyCheckEnhancement();
// Live score is installed after TradeStatus so it becomes the final Trade tab
// wrapper and can show active trade, history and the live score window together.
installLiveScoreTradeTabEnhancement();
// Installed after TradeStatus so every dashboard card, including the injected
// Today/current-capital UI, uses the final accordion wrapper.
installHomeAccordionEnhancement();
installMoneyDisplayEnhancement();
installBrokerSelectionFetchEnhancement();
// Install before App.js is loaded so the selector is inserted only inside the
// Tools > Broker ScrollView, directly above the Connect Broker card.
installBrokerPanelPlacementEnhancement();
// Every authenticated request now watches for an expired/invalid app JWT. The
// saved session is cleared and App is remounted directly on the Login screen.
installAutoLogoutOnTokenExpiryEnhancement();

const AppModule = require("./App");
const App = AppModule.default || AppModule;

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const TRADE_POLL_MS = 5000;

function tradeSnapshotKey(data, openTrade) {
  if (!openTrade) return "CLOSED";
  const openRows = Array.isArray(data?.trades) && data.trades.length
    ? data.trades
    : [openTrade];

  return openRows
    .map((trade) => [
      trade?.id,
      trade?.status,
      trade?.live_price ?? trade?.current_price ?? trade?.last_ltp ?? trade?.entry_price,
      trade?.sl_price,
      trade?.target_price,
      trade?.unrealized_pnl ?? trade?.net_pnl ?? trade?.pnl,
      trade?.quote_updated_at,
      trade?.quote_stale,
    ].join("|"))
    .join("::");
}

function ManualExitOverlay() {
  const [token, setToken] = useState(null);
  const [trade, setTrade] = useState(null);
  const [busy, setBusy] = useState(false);
  const aliveRef = useRef(true);
  const requestRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const snapshotKeyRef = useRef("");

  async function loadOpenTrade() {
    if (requestRef.current || appStateRef.current !== "active") return;
    requestRef.current = true;

    try {
      const savedToken = await AsyncStorage.getItem("saas_token");
      if (!savedToken) {
        if (snapshotKeyRef.current !== "CLOSED") {
          snapshotKeyRef.current = "CLOSED";
          updateTradeLiveSnapshot({ open: false, trade: null });
        }
        if (aliveRef.current) {
          setToken((current) => (current == null ? current : null));
          setTrade((current) => (current == null ? current : null));
        }
        return;
      }

      const response = await fetch(SAAS_URL + "/bot/trade-live", {
        headers: { Authorization: "Bearer " + savedToken },
      });
      const data = await response.json();
      const openTrade =
        data?.success && data?.open && data?.trade?.status === "OPEN"
          ? data.trade
          : null;
      const nextKey = tradeSnapshotKey(data, openTrade);

      if (nextKey !== snapshotKeyRef.current) {
        snapshotKeyRef.current = nextKey;
        updateTradeLiveSnapshot(data || { open: false, trade: null });

        if (aliveRef.current) {
          setTrade(openTrade);
        }
      }

      if (aliveRef.current) {
        setToken((current) => (current === savedToken ? current : savedToken));
      }
    } catch (_) {
      // Keep the last known live price and SL during a temporary network failure.
    } finally {
      requestRef.current = false;
    }
  }

  useEffect(() => {
    aliveRef.current = true;
    appStateRef.current = AppState.currentState;

    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") loadOpenTrade();
    });

    loadOpenTrade();
    const timer = setInterval(loadOpenTrade, TRADE_POLL_MS);

    return () => {
      aliveRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  async function executeExit() {
    if (!token || !trade || busy) return;
    setBusy(true);
    try {
      const response = await fetch(SAAS_URL + "/bot/manual-exit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ trade_id: trade.id }),
      });
      const data = await response.json();
      Alert.alert(
        data?.success ? "Trade Exited" : "Exit Not Confirmed",
        data?.message || data?.detail || "Manual exit response nahi mila."
      );
      snapshotKeyRef.current = "";
      await loadOpenTrade();
    } catch (error) {
      Alert.alert(
        "Exit Failed",
        "Server/broker se confirmation nahi mila. Trade ko closed nahi maana gaya."
      );
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }

  function confirmExit() {
    if (!trade || busy) return;
    Alert.alert(
      "Exit Trade Now?",
      `${trade.symbol || "Open trade"}\nLive: ₹${
        trade.live_price ?? trade.current_price ?? trade.entry_price ?? "--"
      }\n\nMarket exit request turant bheji jayegi.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "EXIT NOW",
          style: "destructive",
          onPress: executeExit,
        },
      ]
    );
  }

  if (!trade) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <TouchableOpacity
        onPress={confirmExit}
        disabled={busy}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          right: 16,
          bottom: 88,
          minWidth: 174,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 15,
          backgroundColor: "#b91c3c",
          borderWidth: 1,
          borderColor: "#ff4d6d",
          elevation: 14,
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {busy ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text
            style={{
              color: "#ffffff",
              fontSize: 13,
              fontWeight: "900",
              letterSpacing: 0.3,
            }}
          >
            ⛔ EXIT TRADE NOW
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function AppPatched() {
  const [sessionEpoch, setSessionEpoch] = useState(0);

  useEffect(
    () =>
      subscribeAutoLogout(() => {
        updateTradeLiveSnapshot({ open: false, trade: null });
        setSessionEpoch((value) => value + 1);
      }),
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
      <View style={{ flex: 1 }}>
        <App key={`okai-session-${sessionEpoch}`} />
      </View>
      <ManualExitOverlay />
    </View>
  );
}
