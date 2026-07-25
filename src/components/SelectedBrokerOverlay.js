import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
      // Preserve the last known selected broker during a temporary network failure.
    }
  }

  useEffect(() => {
    aliveRef.current = true;
    loadSelection();
    const timer = setInterval(loadSelection, 15000);
    return () => {
      aliveRef.current = false;
      clearInterval(timer);
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
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        top: 0,
        bottom: 0,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          bottom: 88,
          alignItems: "flex-start",
        }}
      >
        {expanded && (
          <View
            style={{
              width: 210,
              marginBottom: 8,
              padding: 10,
              borderRadius: 14,
              backgroundColor: "#13131f",
              borderWidth: 1,
              borderColor: "#34345a",
              elevation: 16,
              shadowColor: "#000",
              shadowOpacity: 0.4,
              shadowRadius: 8,
            }}
          >
            <Text
              style={{
                color: "#a0a0c0",
                fontSize: 10,
                fontWeight: "900",
                marginBottom: 7,
                letterSpacing: 0.7,
              }}
            >
              SELECTED DATA & ORDER BROKER
            </Text>

            {brokers.map((name) => {
              const active = name === selected;
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => selectBroker(name)}
                  disabled={busy}
                  style={{
                    paddingHorizontal: 11,
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginTop: 6,
                    backgroundColor: active ? "#00d4a022" : "#1a1a2e",
                    borderWidth: 1,
                    borderColor: active ? "#00d4a0" : "#252540",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#00d4a0" : "#e8e8f0",
                      fontSize: 12,
                      fontWeight: "900",
                    }}
                  >
                    {labelFor(name)}
                  </Text>
                  <Text
                    style={{
                      color: active ? "#00d4a0" : "#606080",
                      fontSize: 10,
                      fontWeight: "900",
                    }}
                  >
                    {active ? "SELECTED" : "USE"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          onPress={() => setExpanded((value) => !value)}
          activeOpacity={0.85}
          style={{
            minWidth: 150,
            paddingHorizontal: 13,
            paddingVertical: 10,
            borderRadius: 13,
            backgroundColor: "#121d23",
            borderWidth: 1,
            borderColor: "#00d4a0aa",
            elevation: 12,
            shadowColor: "#000",
            shadowOpacity: 0.35,
            shadowRadius: 7,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {busy ? (
            <ActivityIndicator color="#00d4a0" size="small" />
          ) : (
            <Text
              style={{
                color: "#00d4a0",
                fontSize: 11,
                fontWeight: "900",
              }}
            >
              🔗 Broker: {labelFor(selected)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
