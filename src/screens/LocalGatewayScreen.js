import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const C = { bg: "#0a0a0f", card: "#13131f", border: "#252540", text: "#e8e8f0", muted: "#8585a8", green: "#00d4a0", red: "#ff4d6d", gold: "#f5c842", blue: "#4d9fff", purple: "#7c6deb" };

async function requestJson(path, token, options = {}) {
  const response = await fetch(SAAS_URL + path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, "Cache-Control": "no-cache", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || data?.message || `Server error ${response.status}`);
  return data;
}

function Button({ label, onPress, disabled, color = C.blue }) {
  return <TouchableOpacity onPress={onPress} disabled={disabled} style={{ minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color + "88", backgroundColor: color + "18", opacity: disabled ? 0.5 : 1, paddingHorizontal: 12 }}><Text style={{ color, fontSize: 13, fontWeight: "900", textAlign: "center" }}>{label}</Text></TouchableOpacity>;
}

export default function LocalGatewayScreen({ token, lang = "en" }) {
  const hi = lang === "hi";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [deviceName, setDeviceName] = useState("OKAI Gateway Device");
  const [expectedIp, setExpectedIp] = useState("");
  const [pairToken, setPairToken] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [me, provision, ent, brokers] = await Promise.all([
        requestJson("/auth/me", token),
        requestJson("/local-gateway/provision/status?_ts=" + Date.now(), token),
        requestJson("/subscription/entitlements?_ts=" + Date.now(), token),
        requestJson("/broker/list?_ts=" + Date.now(), token),
      ]);
      const user = me?.user || me || {};
      const gateway = provision?.gateway || {};
      const p = provision?.provisioning || {};
      const staticIp = String(p?.static_ip || gateway?.expected_static_ip || "").trim();
      const observed = String(gateway?.observed_ip || "").trim();
      const exactMatch = Boolean(staticIp && observed && staticIp === observed);
      setData({ user, isAdmin: Boolean(user?.is_admin), provision: p, gateway, ent, selectedBroker: String(brokers?.selected_broker || "").toLowerCase(), staticIp, exactMatch, ready: Boolean(gateway?.paired && gateway?.online && gateway?.enabled && exactMatch), ipConfirmed: Boolean(p?.broker_ip_confirmed_at) });
      if (gateway?.device_name) setDeviceName(gateway.device_name);
      if (staticIp) setExpectedIp(staticIp);
    } catch (e) { setError(String(e?.message || e)); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, [load]);

  async function allocate() {
    setBusy("allocate"); setError("");
    try { await requestJson("/local-gateway/provision/request", token, { method: "POST", body: "{}" }); await load(); }
    catch (e) { setError(String(e?.message || e)); }
    finally { setBusy(""); }
  }

  function confirmIp() {
    if (!data?.staticIp) return;
    Alert.alert("Confirm Static IP", `Broker app me ${data.staticIp} ko Primary Static IP ke roop me save kar diya hai?`, [
      { text: "Not Yet", style: "cancel" },
      { text: "Yes, Saved", onPress: async () => {
        setBusy("confirm"); setError("");
        try { await requestJson("/local-gateway/provision/confirm-ip", token, { method: "POST", body: JSON.stringify({ confirmation: "IP REGISTERED" }) }); await load(); }
        catch (e) { setError(String(e?.message || e)); }
        finally { setBusy(""); }
      } },
    ]);
  }

  async function pairNow() {
    if (!expectedIp.trim()) { Alert.alert("Static IP required", "Public static IPv4 enter karein."); return; }
    setBusy("pair"); setError(""); setPairToken("");
    try {
      const r = await requestJson("/local-gateway/pair", token, { method: "POST", body: JSON.stringify({ device_name: deviceName.trim() || "OKAI Gateway Device", expected_static_ip: expectedIp.trim() }) });
      if (r?.gateway_token) setPairToken(r.gateway_token);
      await load();
    } catch (e) { setError(String(e?.message || e)); }
    finally { setBusy(""); }
  }

  const p = data?.provision || {};
  const ready = Boolean(data?.ready && data?.ipConfirmed);
  const started = ["requested", "allocating", "bootstrapping", "ready"].includes(String(p?.state || "").toLowerCase());
  const brokerText = data?.selectedBroker === "upstox"
    ? "Upstox Developer Apps → Option King AI app → Static IP / Primary IP"
    : "Angel One SmartAPI → My Apps → API app → Static IP / Primary IP";

  return <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
    <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: ready ? C.green + "66" : C.border, padding: 18 }}>
      <Text style={{ color: C.text, fontSize: 21, fontWeight: "900" }}>Secure Live Connection</Text>
      <Text style={{ color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 7 }}>{hi ? "Phone gateway, Termux, VPN ya manual token setup ki zarurat nahi hai. Option King AI AWS par dedicated secure connection automatically banata hai." : "No phone gateway, Termux, VPN or manual token setup is required. Option King AI automatically creates a dedicated AWS secure connection."}</Text>
      {loading ? <ActivityIndicator color={C.purple} style={{ marginTop: 20 }} /> : <View style={{ marginTop: 18 }}>
        <Text style={{ color: ready ? C.green : C.gold, fontSize: 18, fontWeight: "900" }}>{ready ? "✓ Ready for Live Trading" : data?.staticIp ? "Static IP allocated" : started ? "Creating secure connection…" : "Secure connection not created yet"}</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Provisioning status: {String(p?.state || "not requested").replaceAll("_", " ")}</Text>
      </View>}
      {!!error && <Text style={{ color: C.red, fontSize: 12, lineHeight: 18, marginTop: 14 }}>{error}</Text>}
    </View>

    <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, marginTop: 14 }}>
      <Text style={{ color: C.text, fontWeight: "900", fontSize: 15 }}>Dedicated Execution IP</Text>
      <Text selectable style={{ color: data?.staticIp ? C.blue : C.muted, fontSize: 24, fontWeight: "900", marginTop: 10 }}>{data?.staticIp || "Allocation Pending"}</Text>
      {!data?.staticIp ? <>
        <Text style={{ color: C.muted, lineHeight: 19, fontSize: 12, marginTop: 8 }}>Broker connect aur Live access active hone ke baad niche button se AWS IP automatically allocate hoga.</Text>
        <View style={{ marginTop: 14 }}><Button label={busy === "allocate" ? "Allocating…" : started ? "Refresh Provisioning" : "Allocate My Secure IP"} onPress={started ? load : allocate} disabled={busy === "allocate" || !data?.selectedBroker || !data?.ent?.live_allowed} color={C.green} /></View>
      </> : <>
        <Text style={{ color: C.muted, lineHeight: 19, fontSize: 12, marginTop: 8 }}>{brokerText} me upar wala exact IP save karein.</Text>
        <Text style={{ color: data?.ipConfirmed ? C.green : C.gold, fontSize: 12, fontWeight: "900", marginTop: 9 }}>{data?.ipConfirmed ? "✓ Broker IP registration confirmed" : "Broker me IP save karke confirmation pending"}</Text>
        <Text style={{ color: data?.exactMatch ? C.green : C.gold, fontSize: 12, fontWeight: "900", marginTop: 5 }}>{data?.exactMatch ? "✓ AWS outbound IP matched" : "AWS worker connection check in progress"}</Text>
        {!data?.ipConfirmed && <View style={{ marginTop: 14 }}><Button label={busy === "confirm" ? "Saving…" : "I Registered This IP"} onPress={confirmIp} disabled={busy === "confirm"} color={C.green} /></View>}
      </>}
      <View style={{ marginTop: 12 }}><Button label={loading ? "Checking…" : "Refresh Connection"} onPress={load} disabled={loading} /></View>
    </View>

    <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, marginTop: 14 }}>
      <Text style={{ color: C.text, fontWeight: "900", fontSize: 15 }}>Customer Flow</Text>
      <Text style={{ color: C.muted, lineHeight: 23, fontSize: 13, marginTop: 10 }}>1. Connect Broker{"\n"}2. Test Paper Trading{"\n"}3. Allocate Dedicated IP{"\n"}4. Register IP in Broker App{"\n"}5. Confirm IP{"\n"}6. Enable Live Trading</Text>
      <Text style={{ color: C.green, fontSize: 12, lineHeight: 18, marginTop: 10 }}>AWS server, gateway token aur background worker Option King AI manage karega.</Text>
    </View>

    {data?.isAdmin && <>
      <TouchableOpacity onPress={() => setAdvanced(v => !v)} style={{ marginTop: 14, minHeight: 44, justifyContent: "center", alignItems: "center" }}><Text style={{ color: C.muted, fontSize: 12, fontWeight: "800" }}>{advanced ? "Hide Admin Fallback Setup" : "Admin Fallback Setup"}</Text></TouchableOpacity>
      {advanced && <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18 }}>
        <Text style={{ color: C.gold, fontSize: 12, fontWeight: "900", marginBottom: 12 }}>ADMIN FALLBACK ONLY</Text>
        <Text style={{ color: C.muted, fontSize: 11, marginBottom: 5 }}>Device Name</Text>
        <TextInput value={deviceName} onChangeText={setDeviceName} placeholder="OKAI Gateway Device" placeholderTextColor={C.muted} style={{ color: C.text, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, minHeight: 46, marginBottom: 12 }} />
        <Text style={{ color: C.muted, fontSize: 11, marginBottom: 5 }}>Public Static IPv4</Text>
        <TextInput value={expectedIp} onChangeText={setExpectedIp} placeholder="xxx.xxx.xxx.xxx" placeholderTextColor={C.muted} autoCapitalize="none" style={{ color: C.text, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, minHeight: 46, marginBottom: 12 }} />
        <Button label={busy === "pair" ? "Pairing…" : "Pair Manual Fallback Gateway"} onPress={pairNow} disabled={busy === "pair"} color={C.purple} />
        {!!pairToken && <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: "#0d1422" }}><Text style={{ color: C.gold, fontSize: 11, fontWeight: "900" }}>ONE-TIME GATEWAY TOKEN</Text><Text selectable style={{ color: C.text, marginTop: 6, fontSize: 12 }}>{pairToken}</Text></View>}
      </View>}
    </>}
  </ScrollView>;
}
