import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { installFreshDataEnhancement } = require(
  "./src/runtime/FreshDataEnhancement"
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

// Order matters. Live chart wraps only the actual candlestick component;
// trade markers stay outside it. The Trade-tab patch only replaces the old
// delayed Current row with the monitor-updated live option price row.
// Range backtest wraps only BacktestTab and must be installed before App loads.
installFreshDataEnhancement();
installPullToRefreshEnhancement();
installLiveChartEnhancement();
installTradeMarkerChartEnhancement();
installTradeLivePriceEnhancement();
installRangeBacktestEnhancement();

const AppModule = require("./App");
const App = AppModule.default || AppModule;

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

function ManualExitOverlay() {
  const [token, setToken] = useState(null);
  const [trade, setTrade] = useState(null);
  const [busy, setBusy] = useState(false);
  const aliveRef = useRef(true);

  async function loadOpenTrade() {
    try {
      const savedToken = await AsyncStorage.getItem("saas_token");
      if (!savedToken) {
        updateTradeLiveSnapshot({ open: false, trade: null });
        if (aliveRef.current) {
          setToken(null);
          setTrade(null);
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

      updateTradeLiveSnapshot(data || { open: false, trade: null });

      if (aliveRef.current) {
        setToken(savedToken);
        setTrade(openTrade);
      }
    } catch (_) {
      // Keep the last known live value during a temporary network failure.
    }
  }

  useEffect(() => {
    aliveRef.current = true;
    loadOpenTrade();
    const timer = setInterval(loadOpenTrade, 1000);
    return () => {
      aliveRef.current = false;
      clearInterval(timer);
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
  return (
    <View style={{ flex: 1 }}>
      <App />
      <ManualExitOverlay />
    </View>
  );
}
