import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const C = { bg: "#0a0a0f", card: "#13131f", border: "#252540", text: "#e8e8f0", muted: "#8585a8", green: "#00d4a0", red: "#ff4d6d", gold: "#f5c842", blue: "#4d9fff", purple: "#7c6deb" };

async function requestJson(path, token, options = {}) {
  const response = await fetch(SAAS_URL + path, { ...options, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || data?.message || `Server error ${response.status}`);
  return data;
}

function Button({ label, onPress, disabled, color = C.blue }) {
  return <TouchableOpacity onPress={onPress} disabled={disabled} style={{ minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color + "88", backgroundColor: color + "18", opacity: disabled ? 0.5 : 1 }}><Text style={{ color, fontSize: 14, fontWeight: "900" }}>{label}</Text></TouchableOpacity>;
}

export default function LocalGatewayScreen({ token, lang = "en" }) {
  const hi = lang === "hi";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [deviceName, setDeviceName] = useState("OKAI Gateway Device");
  const [expectedIp, setExpectedIp] = useState("");
  const [pairToken, setPairToken] = useState("");
  const [pairing, setPairing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await requestJson("/local-gateway/access", token);
      setData(r);
      if (r?.gateway?.device_name) setDeviceName(r.gateway.device_name);
      if (r?.gateway?.expected_static_ip) setExpectedIp(r.gateway.expected_static_ip);
    } catch (e) { setError(String(e?.message || e)); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  const gateway = data?.gateway || {};
  const access = data?.access || {};
  const ready = Boolean(access?.allowed && gateway?.paired && gateway?.online);

  async function pairNow() {
    if (!expectedIp.trim()) { Alert.alert("Static IP required", "Advanced setup me public static IPv4 enter karein."); return; }
    setPairing(true); setError(""); setPairToken("");
    try {
      const r = await requestJson("/local-gateway/pair", token, { method: "POST", body: JSON.stringify({ device_name: deviceName.trim() || "OKAI Gateway Device", expected_static_ip: expectedIp.trim() }) });
      if (r?.gateway_token) setPairToken(r.gateway_token);
      await load();
    } catch (e) { setError(String(e?.message || e)); }
    finally { setPairing(false); }
  }

  return <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
    <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: ready ? C.green + "66" : C.border, padding: 18 }}>
      <Text style={{ color: C.text, fontSize: 21, fontWeight: "900" }}>Secure Live Connection</Text>
      <Text style={{ color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 7 }}>{hi ? "Normal customer ko IP, token ya gateway command samajhne ki zarurat nahi hai. App sirf Live Trading ready hai ya nahi, ye dikhayega." : "Normal customers do not need to understand IPs, tokens or gateway commands. The app only shows whether Live Trading is ready."}</Text>
      {loading ? <ActivityIndicator color={C.purple} style={{ marginTop: 20 }} /> : <View style={{ marginTop: 18 }}><Text style={{ color: ready ? C.green : C.gold, fontSize: 18, fontWeight: "900" }}>{ready ? "✓ Ready for Live Trading" : gateway?.paired ? "Connecting secure server…" : "Live connection setup required"}</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>{ready ? "Secure connection active. Technical gateway details are hidden." : "Paper Trading can continue while Live connection is being prepared."}</Text></View>}
      {!!error && <Text style={{ color: C.red, fontSize: 12, marginTop: 14 }}>{error}</Text>}
      <View style={{ marginTop: 16 }}><Button label={loading ? "Checking…" : "Refresh Connection"} onPress={load} disabled={loading} /></View>
    </View>

    <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, marginTop: 14 }}>
      <Text style={{ color: C.text, fontWeight: "900", fontSize: 15 }}>Customer Flow</Text>
      <Text style={{ color: C.muted, lineHeight: 22, fontSize: 13, marginTop: 10 }}>1. Broker Connect{"\n"}2. Paper Trading Ready{"\n"}3. Secure Live Connection Check{"\n"}4. Enable Live Trading</Text>
      <Text style={{ color: C.green, fontSize: 12, marginTop: 10 }}>Gateway/IP/token details normal customer se hidden rahenge.</Text>
    </View>

    <TouchableOpacity onPress={() => setAdvanced(v => !v)} style={{ marginTop: 14, minHeight: 44, justifyContent: "center", alignItems: "center" }}><Text style={{ color: C.muted, fontSize: 12, fontWeight: "800" }}>{advanced ? "Hide Advanced Setup" : "Advanced Setup (Admin / Support)"}</Text></TouchableOpacity>

    {advanced && <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18 }}>
      <Text style={{ color: C.gold, fontSize: 12, fontWeight: "900", marginBottom: 12 }}>TECHNICAL SETUP — NORMAL CUSTOMER KO NAHI KARNA HAI</Text>
      <Text style={{ color: C.muted, fontSize: 11, marginBottom: 5 }}>Device Name</Text>
      <TextInput value={deviceName} onChangeText={setDeviceName} placeholder="OKAI Gateway Device" placeholderTextColor={C.muted} style={{ color: C.text, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, minHeight: 46, marginBottom: 12 }} />
      <Text style={{ color: C.muted, fontSize: 11, marginBottom: 5 }}>Public Static IPv4</Text>
      <TextInput value={expectedIp} onChangeText={setExpectedIp} placeholder="xxx.xxx.xxx.xxx" placeholderTextColor={C.muted} autoCapitalize="none" style={{ color: C.text, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, minHeight: 46, marginBottom: 12 }} />
      <Button label={pairing ? "Pairing…" : "Pair Secure Gateway"} onPress={pairNow} disabled={pairing} color={C.purple} />
      {!!pairToken && <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: "#0d1422" }}><Text style={{ color: C.gold, fontSize: 11, fontWeight: "900" }}>ONE-TIME GATEWAY TOKEN</Text><Text selectable style={{ color: C.text, marginTop: 6, fontSize: 12 }}>{pairToken}</Text></View>}
      <Text style={{ color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 12 }}>Advanced section sirf fallback/admin use ke liye hai jab tak server-side fixed-IP gateway fully automated nahi hota.</Text>
    </View>}
  </ScrollView>;
}
