import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

function labelFor(name) {
  const value = String(name || "").toLowerCase();
  if (value === "angelone") return "Angel One";
  if (value === "upstox") return "Upstox";
  if (value === "zerodha") return "Zerodha";
  return value ? value.toUpperCase() : "Select Broker";
}

export default function SelectedBrokerOverlay() {
  const [token, setToken] = useState(null);
  const [selected, setSelected] = useState(null);
  const [brokers, setBrokers] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const aliveRef = useRef(true);

  async function loadSelection() {
    try {
      const savedToken = await AsyncStorage.getItem("saas_token");
      if (!savedToken) {
        if (aliveRef.current) {
          setToken(null);
          setSelected(null);
          setBrokers([]);
          setExpanded(false);
        }
        return;
      }

      const response = await fetch(SAAS_URL + "/broker/list", {
        headers: { Authorization: "Bearer " + savedToken },
      });
      const data = await response.json();
      if (!aliveRef.current) return;

      setToken(savedToken);
      setSelected(String(data?.selected_broker || "").toLowerCase() || null);
      setBrokers(
        Array.isArray(data?.brokers)
          ? data.brokers
              .map((item) => String(item?.broker_name || "").toLowerCase())
              .filter(Boolean)
          : []
      );
    } catch (_) {
      // Keep the last known broker during a temporary network failure.
    }
  }

  useEffect(() => {
    aliveRef.current = true;
    loadSelection();
    const brokerSavedSubscription = DeviceEventEmitter.addListener(
      "okai:broker-saved",
      loadSelection
    );
    const timer = setInterval(loadSelection, 15000);
    return () => {
      aliveRef.current = false;
      clearInterval(timer);
      brokerSavedSubscription.remove();
    };
  }, []);

  async function selectBroker(name) {
    if (!token || busy || name === selected) {
      setExpanded(false);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(
        SAAS_URL + "/broker/select/" + encodeURIComponent(name),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: "{}",
        }
      );
      const data = await response.json();
      if (data?.success) {
        setSelected(String(data.selected_broker || name).toLowerCase());
        setExpanded(false);
        Alert.alert(
          "Broker Selected",
          `${labelFor(data.selected_broker || name)} will now be used by the bot, paper/live data and backtests. Start Bot again.`
        );
      } else {
        Alert.alert(
          "Broker Switch Failed",
          data?.detail || data?.message || "Broker login could not be verified."
        );
      }
    } catch (_) {
      Alert.alert(
        "Broker Switch Failed",
        "Server or broker connection could not be verified."
      );
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }

  if (!token || brokers.length === 0) return null;

  return (
    <View
      style={{
        padding: 14,
        borderRadius: 16,
        backgroundColor: "#121d23",
        borderWidth: 1,
        borderColor: "#00d4a088",
      }}
    >
      <View
        style={{
          minHeight: 46,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text
            style={{
              color: "#7d879b",
              fontSize: 9,
              fontWeight: "900",
              letterSpacing: 0.8,
            }}
          >
            SELECTED DATA & ORDER BROKER
          </Text>
          <Text
            style={{
              color: "#00d4a0",
              fontSize: 15,
              fontWeight: "900",
              marginTop: 4,
            }}
          >
            🔗 {labelFor(selected)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setExpanded((value) => !value)}
          disabled={busy}
          activeOpacity={0.85}
          style={{
            minWidth: 96,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 11,
            backgroundColor: "#1a1a2e",
            borderWidth: 1,
            borderColor: "#4b4675",
            alignItems: "center",
          }}
        >
          {busy ? (
            <ActivityIndicator color="#00d4a0" size="small" />
          ) : (
            <Text
              style={{
                color: "#e8e8f0",
                fontSize: 10,
                fontWeight: "900",
              }}
            >
              {expanded ? "CLOSE ▲" : "CHANGE ▼"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {expanded && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: "#34345a",
          }}
        >
          <Text
            style={{
              color: "#a0a0c0",
              fontSize: 9,
              fontWeight: "900",
              letterSpacing: 0.7,
              marginBottom: 4,
            }}
          >
            CHOOSE SAVED BROKER
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {brokers.map((name) => {
              const active = name === selected;
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => selectBroker(name)}
                  disabled={busy}
                  style={{
                    minWidth: 102,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginTop: 6,
                    backgroundColor: active ? "#00d4a022" : "#1a1a2e",
                    borderWidth: 1,
                    borderColor: active ? "#00d4a0" : "#34345a",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#00d4a0" : "#e8e8f0",
                      fontSize: 11,
                      fontWeight: "900",
                    }}
                  >
                    {labelFor(name)}
                  </Text>
                  <Text
                    style={{
                      color: active ? "#00d4a0" : "#606080",
                      fontSize: 8,
                      fontWeight: "900",
                      marginTop: 2,
                    }}
                  >
                    {active ? "SELECTED" : "USE"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
