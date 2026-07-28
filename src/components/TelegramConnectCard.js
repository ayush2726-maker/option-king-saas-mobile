import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  bg: "#0a0a0f",
  s1: "#0f0f1a",
  s2: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  sub: "#a0a0c0",
  muted: "#606080",
  blue: "#4d9fff",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
};

async function apiGet(path, token) {
  const r = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  return r.json();
}

async function apiPost(path, body, token) {
  const r = await fetch(SAAS_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body || {}),
  });
  return r.json();
}

function MiniButton({ label, color, onPress, disabled }) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: color + "22",
        borderWidth: 1,
        borderColor: color + "66",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: "center",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ color, fontWeight: "900", fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function TelegramConnectCard({ token, lang = "en" }) {
  const hi = lang === "hi";
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiGet("/telegram/settings", token);
      setSettings(data?.settings || null);
      setMessage("");
    } catch {
      setMessage(hi ? "Telegram status load nahi hua" : "Could not load Telegram status");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [token]);

  async function connectTelegram() {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiPost("/telegram/connect-link", {}, token);
      if (!data?.success || !data?.connect_url) {
        setMessage(data?.message || (hi ? "Telegram setup incomplete hai" : "Telegram setup is incomplete"));
        setLoading(false);
        return;
      }
      setMessage(hi
        ? "Telegram khul raha hai. Bot me Start dabao, phir app me Refresh dabao."
        : "Telegram is opening. Tap Start in the bot, then return and tap Refresh.");
      await Linking.openURL(data.connect_url);
    } catch {
      setMessage(hi ? "Telegram open nahi hua" : "Could not open Telegram");
    }
    setLoading(false);
  }

  async function sendTest() {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiPost("/telegram/test", {}, token);
      setMessage(data?.success
        ? (hi ? "✅ Test message Telegram par bhej diya" : "✅ Test message sent to Telegram")
        : (data?.message || (hi ? "Test message nahi gaya" : "Test message failed")));
    } catch {
      setMessage(hi ? "Test message failed" : "Test message failed");
    }
    setLoading(false);
  }

  async function disconnect() {
    Alert.alert(
      hi ? "Telegram disconnect?" : "Disconnect Telegram?",
      hi ? "Trade alerts Telegram par nahi jayenge." : "Trade alerts will stop going to Telegram.",
      [
        { text: hi ? "Cancel" : "Cancel", style: "cancel" },
        {
          text: hi ? "Disconnect" : "Disconnect",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await apiPost("/telegram/disconnect", {}, token);
              setMessage(hi ? "Telegram disconnect ho gaya" : "Telegram disconnected");
              await load();
            } catch {
              setMessage(hi ? "Disconnect failed" : "Disconnect failed");
            }
            setLoading(false);
          },
        },
      ]
    );
  }

  const connected = !!(settings?.connected || (settings?.enabled && settings?.chat_id));

  return (
    <View style={{
      backgroundColor: C.s2,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: connected ? C.green + "66" : C.blue + "66",
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>
            📣 {hi ? "Telegram Alerts" : "Telegram Alerts"}
          </Text>
          <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>
            {hi
              ? "Trade entry, exit, SL/target aur order-fail alerts Telegram par aayenge. Chat ID automatic save hoti hai."
              : "Trade entry, exit, SL/target and order-fail alerts will arrive on Telegram. Chat ID is saved automatically."}
          </Text>
        </View>
        <View style={{
          backgroundColor: connected ? C.green + "22" : C.gold + "22",
          borderWidth: 1,
          borderColor: connected ? C.green + "66" : C.gold + "66",
          borderRadius: 10,
          paddingHorizontal: 9,
          paddingVertical: 5,
        }}>
          <Text style={{ color: connected ? C.green : C.gold, fontSize: 10, fontWeight: "900" }}>
            {connected ? "CONNECTED" : "NOT CONNECTED"}
          </Text>
        </View>
      </View>

      {connected && (
        <Text style={{ color: C.green, fontSize: 11, fontWeight: "800", marginTop: 10 }}>
          ✅ {hi ? "Telegram connected hai" : "Telegram is connected"}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
        <MiniButton
          label={connected ? (hi ? "Reconnect" : "Reconnect") : (hi ? "Connect Telegram" : "Connect Telegram")}
          color={C.blue}
          disabled={loading}
          onPress={connectTelegram}
        />
        <MiniButton
          label={hi ? "Test" : "Test"}
          color={C.green}
          disabled={loading || !connected}
          onPress={sendTest}
        />
      </View>

      {connected && (
        <TouchableOpacity onPress={disconnect} disabled={loading} style={{ marginTop: 10, alignItems: "center" }}>
          <Text style={{ color: C.red, fontSize: 11, fontWeight: "900" }}>
            {hi ? "Disconnect Telegram" : "Disconnect Telegram"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={load} disabled={loading} style={{ marginTop: 10, alignItems: "center" }}>
        <Text style={{ color: C.muted, fontSize: 11, fontWeight: "900" }}>
          {loading ? (hi ? "Loading..." : "Loading...") : (hi ? "Refresh Status" : "Refresh Status")}
        </Text>
      </TouchableOpacity>

      {!!message && (
        <Text style={{ color: message.includes("✅") ? C.green : C.gold, fontSize: 11, lineHeight: 16, marginTop: 10, fontWeight: "800" }}>
          {message}
        </Text>
      )}
    </View>
  );
}
