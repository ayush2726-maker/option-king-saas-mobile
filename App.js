import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, StatusBar, Alert,
  Platform, KeyboardAvoidingView, RefreshControl
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Colors ──────────────────────────────────────────────
const C = {
  bg:"#0a0a0f", s1:"#0f0f1a", s2:"#13131f", s3:"#1a1a2e",
  border:"#1e1e30", border2:"#252540",
  text:"#e8e8f0", sub:"#a0a0c0", muted:"#606080",
  accent:"#7c6deb", accentLo:"#7c6deb22",
  green:"#00d4a0", greenLo:"#00d4a015",
  red:"#ff4d6d", redLo:"#ff4d6d15",
  gold:"#f5c842", goldLo:"#f5c84215",
  blue:"#4d9fff", blueLo:"#4d9fff15",
  purple:"#b06deb", purpleLo:"#b06deb15",
  orange:"#ff8c42", orangeLo:"#ff8c4215",
};

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

// ── API Helpers ──────────────────────────────────────────
async function apiPost(path, body) {
  const r = await fetch(SAAS_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}
async function apiGet(path, token) {
  const r = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  return r.json();
}
async function apiPostAuth(path, body, token) {
  const r = await fetch(SAAS_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

// ── UI Components ────────────────────────────────────────
function Card({ children, style, glow }) {
  return (
    <View style={[{
      backgroundColor: C.s2, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: C.border,
      ...(glow ? { shadowColor: glow, shadowOpacity: 0.25,
        shadowRadius: 12, elevation: 8 } : {}),
    }, style]}>{children}</View>
  );
}
function Row({ children, style }) {
  return <View style={[{ flexDirection: "row", alignItems: "center" }, style]}>{children}</View>;
}
function Label({ text }) {
  return <Text style={{ color: C.sub, fontSize: 11, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 6,
    marginTop: 4 }}>{text}</Text>;
}
function Tag({ label, color }) {
  return (
    <View style={{ backgroundColor: color + "22", borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
      borderColor: color + "55" }}>
      <Text style={{ color, fontSize: 10, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}
function Btn({ label, icon, color, onPress, loading, style }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading}
      style={[{ backgroundColor: (color||C.accent)+"22", borderRadius: 12,
        paddingVertical: 13, paddingHorizontal: 20, borderWidth: 1,
        borderColor: (color||C.accent)+"66", alignItems: "center",
        flexDirection: "row", justifyContent: "center", gap: 8 }, style]}>
      {loading
        ? <ActivityIndicator color={color||C.accent} size="small" />
        : <>
            {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
            <Text style={{ color: color||C.accent, fontWeight: "900",
              fontSize: 14 }}>{label}</Text>
          </>}
    </TouchableOpacity>
  );
}
function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <View style={{ backgroundColor: C.redLo, borderRadius: 10,
      padding: 10, marginBottom: 10, borderWidth: 1, borderColor: C.red+"44" }}>
      <Text style={{ color: C.red, fontSize: 13 }}>{msg}</Text>
    </View>
  );
}
function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={{ height: 6, backgroundColor: C.border2,
      borderRadius: 3, overflow: "hidden" }}>
      <View style={{ width: pct + "%", height: 6,
        backgroundColor: color || C.accent, borderRadius: 3 }} />
    </View>
  );
}

// ── Login Screen ─────────────────────────────────────────
function LoginScreen({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError(""); setLoading(true);
    try {
      const d = await apiPost("/auth/login", { email, password });
      if (d.token) { onLogin(d.token, d.user); }
      else setError(d.detail || "Login failed");
    } catch { setError("Server se connect nahi ho paya"); }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 80 }}>
        <Text style={{ fontSize: 40, textAlign: "center",
          marginBottom: 4 }}>👑</Text>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: "900",
          textAlign: "center", marginBottom: 4 }}>Option King AI</Text>
        <Text style={{ color: C.muted, fontSize: 13, textAlign: "center",
          marginBottom: 32 }}>SaaS Trading Platform</Text>
        <Card glow={C.accent}>
          <ErrorBox msg={error} />
          <Label text="Email" />
          <TextInput style={st.input} value={email}
            onChangeText={setEmail} placeholder="aapka@email.com"
            placeholderTextColor={C.muted} autoCapitalize="none"
            keyboardType="email-address" />
          <Label text="Password" />
          <TextInput style={st.input} value={password}
            onChangeText={setPassword} placeholder="Password"
            placeholderTextColor={C.muted} secureTextEntry />
          <Btn label="Login Karo" icon="🔑" onPress={handleLogin}
            loading={loading} style={{ marginTop: 4 }} />
        </Card>
        <TouchableOpacity onPress={onRegister}
          style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ color: C.accent, fontSize: 14 }}>
            Account nahi hai? Register Karo →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Register Screen ───────────────────────────────────────
function RegisterScreen({ onLogin, onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    setError("");
    if (password !== confirm) { setError("Passwords match nahi karte"); return; }
    if (password.length < 6) { setError("Password kam se kam 6 characters"); return; }
    setLoading(true);
    try {
      const d = await apiPost("/auth/register",
        { name, email, phone, password });
      if (d.token) { onLogin(d.token, d.user); }
      else setError(d.detail || "Registration failed");
    } catch { setError("Server se connect nahi ho paya"); }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
          <Text style={{ color: C.accent, fontSize: 14 }}>← Wapas Login</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900",
          marginBottom: 20 }}>👑 Register Karo</Text>
        <Card glow={C.green}>
          <ErrorBox msg={error} />
          <Label text="Naam *" />
          <TextInput style={st.input} value={name} onChangeText={setName}
            placeholder="Aapka poora naam" placeholderTextColor={C.muted} />
          <Label text="Email *" />
          <TextInput style={st.input} value={email} onChangeText={setEmail}
            placeholder="aapki@email.com" placeholderTextColor={C.muted}
            autoCapitalize="none" keyboardType="email-address" />
          <Label text="Phone (Optional)" />
          <TextInput style={st.input} value={phone} onChangeText={setPhone}
            placeholder="9999999999" placeholderTextColor={C.muted}
            keyboardType="phone-pad" />
          <Label text="Password *" />
          <TextInput style={st.input} value={password}
            onChangeText={setPassword} placeholder="Kam se kam 6 characters"
            placeholderTextColor={C.muted} secureTextEntry />
          <Label text="Password Confirm *" />
          <TextInput style={[st.input, { marginBottom: 20 }]}
            value={confirm} onChangeText={setConfirm}
            placeholder="Password dobara daalo"
            placeholderTextColor={C.muted} secureTextEntry />
          <Btn label="Register Karo" icon="🚀" color={C.green}
            onPress={handleRegister} loading={loading} />
        </Card>
        <Card style={{ marginTop: 12 }}>
          <Row>
            <Text style={{ fontSize: 20 }}>🎁</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: C.text, fontSize: 14,
                fontWeight: "900" }}>7 Din Free Trial</Text>
              <Text style={{ color: C.muted, fontSize: 12,
                marginTop: 3 }}>Register karo aur 7 din tak bilkul
                free use karo — koi credit card nahi</Text>
            </View>
          </Row>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Score Breakdown Tab ──────────────────────────────────
function ScoreTab({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const d = await apiGet("/bot/signal", token);
      setData(d);
    } catch {}
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }

  useEffect(() => { load(false); }, []);

  const score = data?.score ?? 0;
  const scoreColor = score >= 82 ? C.green : score >= 65 ? C.gold : C.red;
  const adx = data?.adx ?? 0;
  const volume_ratio = data?.volume_ratio ?? 0;
  const mtf_ok = data?.mtf_confirmed ?? false;
  const signal = data?.signal ?? "WAITING";
  const strategy = data?.strategy ?? "--";

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={() => load(true)} tintColor={C.accent} />}>

      {/* Main Score */}
      <Card glow={scoreColor}>
        <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <View>
            <Text style={{ color: C.muted, fontSize: 11,
              fontWeight: "800", textTransform: "uppercase",
              letterSpacing: 1 }}>Trade Quality Score</Text>
            <Text style={{ color: scoreColor, fontSize: 44,
              fontWeight: "900", marginTop: 2 }}>{score}</Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>/100  •  Min: 82</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Tag label={signal}
              color={signal==="BUY"?C.green:signal==="SELL"?C.red:C.muted} />
            <Text style={{ color: C.muted, fontSize: 11,
              marginTop: 8 }}>{strategy}</Text>
          </View>
        </Row>
        <ProgressBar value={score} max={100} color={scoreColor} />
      </Card>

      {/* TQU Indicators */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 14 }}>TQU Indicators</Text>

        {/* ADX */}
        <View style={{ marginBottom: 14 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <Row style={{ gap: 8 }}>
              <Text style={{ fontSize: 16 }}>📈</Text>
              <Text style={{ color: C.text, fontSize: 13,
                fontWeight: "800" }}>ADX (Trend Strength)</Text>
            </Row>
            <Tag label={adx >= 25 ? "STRONG" : "WEAK"}
              color={adx >= 25 ? C.green : C.red} />
          </Row>
          <ProgressBar value={adx} max={60} color={adx>=25?C.green:C.red} />
          <Text style={{ color: C.muted, fontSize: 11,
            marginTop: 4 }}>{adx.toFixed(1)}  •  Threshold: 25</Text>
        </View>

        {/* Volume */}
        <View style={{ marginBottom: 14 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <Row style={{ gap: 8 }}>
              <Text style={{ fontSize: 16 }}>📊</Text>
              <Text style={{ color: C.text, fontSize: 13,
                fontWeight: "800" }}>Volume Ratio</Text>
            </Row>
            <Tag label={volume_ratio >= 1.2 ? "HIGH" : "LOW"}
              color={volume_ratio >= 1.2 ? C.green : C.gold} />
          </Row>
          <ProgressBar value={volume_ratio} max={3}
            color={volume_ratio>=1.2?C.green:C.gold} />
          <Text style={{ color: C.muted, fontSize: 11,
            marginTop: 4 }}>{volume_ratio.toFixed(2)}x  •  Threshold: 1.2x</Text>
        </View>

        {/* MTF */}
        <View style={{ marginBottom: 4 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <Row style={{ gap: 8 }}>
              <Text style={{ fontSize: 16 }}>🕐</Text>
              <Text style={{ color: C.text, fontSize: 13,
                fontWeight: "800" }}>Multi-Timeframe (5m)</Text>
            </Row>
            <Tag label={mtf_ok ? "CONFIRMED" : "WARNING"}
              color={mtf_ok ? C.green : C.gold} />
          </Row>
          <View style={{ backgroundColor: mtf_ok ? C.greenLo : C.goldLo,
            borderRadius: 8, padding: 8, borderWidth: 1,
            borderColor: (mtf_ok?C.green:C.gold)+"33" }}>
            <Text style={{ color: mtf_ok ? C.green : C.gold,
              fontSize: 12, fontWeight: "700" }}>
              {mtf_ok ? "✅ 5-minute candle confirms signal"
                : "⚠️ MTF weak — trade with caution"}
            </Text>
          </View>
        </View>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 14 }}>Score Breakdown</Text>
        {[
          ["Base Signal", data?.base_score ?? 0, 40, C.accent],
          ["ADX Bonus", data?.adx_bonus ?? 0, 20, C.blue],
          ["Volume Bonus", data?.volume_bonus ?? 0, 20, C.green],
          ["MTF Bonus", data?.mtf_bonus ?? 0, 10, C.purple],
          ["Market Regime", data?.regime_score ?? 0, 10, C.gold],
        ].map(([label, val, max, color]) => (
          <View key={label} style={{ marginBottom: 12 }}>
            <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ color: C.sub, fontSize: 12 }}>{label}</Text>
              <Text style={{ color, fontSize: 12,
                fontWeight: "900" }}>{val}/{max}</Text>
            </Row>
            <ProgressBar value={val} max={max} color={color} />
          </View>
        ))}
      </Card>

      {loading && (
        <View style={{ alignItems: "center", padding: 20 }}>
          <ActivityIndicator color={C.accent} />
          <Text style={{ color: C.muted, marginTop: 8,
            fontSize: 12 }}>Signal load ho raha hai...</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── HERO ZERO EXPIRY Tab ─────────────────────────────────
function HeroTab({ token }) {
  const [status, setStatus] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  async function load(isRefresh) {
    if (isRefresh) setRefreshing(true);
    try {
      const d = await apiGet("/bot/hero-status", token);
      setStatus(d);
    } catch {}
    if (isRefresh) setRefreshing(false);
  }

  useEffect(() => {
    load(false);
    // Countdown timer
    timerRef.current = setInterval(() => {
      const now = new Date();
      const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const h = ist.getUTCHours();
      const m = ist.getUTCMinutes();
      const s = ist.getUTCSeconds();

      // Window: 14:30 to 15:00 IST
      const totalSec = h * 3600 + m * 60 + s;
      const windowStart = 14 * 3600 + 30 * 60;
      const windowEnd = 15 * 3600;
      const forceExit = 15 * 3600 + 25 * 60;

      if (totalSec < windowStart) {
        const diff = windowStart - totalSec;
        const hh = Math.floor(diff/3600);
        const mm = Math.floor((diff%3600)/60);
        const ss = diff % 60;
        setCountdown(`Window opens in: ${hh}h ${mm}m ${ss}s`);
      } else if (totalSec < windowEnd) {
        const diff = windowEnd - totalSec;
        const mm = Math.floor(diff/60);
        const ss = diff % 60;
        setCountdown(`🔴 ACTIVE — ${mm}m ${ss}s remaining`);
      } else if (totalSec < forceExit) {
        const diff = forceExit - totalSec;
        const mm = Math.floor(diff/60);
        const ss = diff % 60;
        setCountdown(`⚡ Force exit in: ${mm}m ${ss}s`);
      } else {
        setCountdown("Market closed for today");
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const isActive = status?.active ?? false;
  const trade = status?.current_trade ?? null;
  const pnl = status?.pnl ?? 0;
  const pnlColor = pnl >= 0 ? C.green : C.red;

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={() => load(true)} tintColor={C.red} />}>

      {/* Header */}
      <Card glow={C.red}>
        <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <View>
            <Text style={{ color: C.red, fontSize: 16,
              fontWeight: "900" }}>🔴 HERO ZERO EXPIRY</Text>
            <Text style={{ color: C.muted, fontSize: 11,
              marginTop: 2 }}>Expiry Day Premium Explosion</Text>
          </View>
          <Tag label={isActive ? "LIVE" : "STANDBY"}
            color={isActive ? C.green : C.muted} />
        </Row>
        <View style={{ backgroundColor: C.s3, borderRadius: 10,
          padding: 12, borderWidth: 1, borderColor: C.red+"33" }}>
          <Text style={{ color: C.red, fontSize: 13, fontWeight: "800",
            textAlign: "center" }}>{countdown}</Text>
        </View>
      </Card>

      {/* Strategy Info */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 14 }}>Strategy Details</Text>
        {[
          ["⏰", "Window", "14:30 – 15:00 IST"],
          ["💰", "Capital Cap", "₹2,000"],
          ["🚪", "Force Exit", "15:25 IST"],
          ["🎯", "Target", "Premium explosion 3x+"],
          ["📅", "Active On", "Expiry days only"],
        ].map(([icon, label, value]) => (
          <Row key={label} style={{ justifyContent: "space-between",
            paddingVertical: 10, borderBottomWidth: 1,
            borderBottomColor: C.border }}>
            <Row style={{ gap: 8 }}>
              <Text style={{ fontSize: 16 }}>{icon}</Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
            </Row>
            <Text style={{ color: C.text, fontSize: 13,
              fontWeight: "800" }}>{value}</Text>
          </Row>
        ))}
      </Card>

      {/* Current Trade */}
      {trade ? (
        <Card glow={pnlColor}>
          <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
            textTransform: "uppercase", letterSpacing: 1.2,
            marginBottom: 12 }}>Current Trade</Text>
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: C.text, fontSize: 16,
              fontWeight: "900" }}>{trade.symbol ?? "--"}</Text>
            <Tag label={trade.side ?? "BUY"} color={C.green} />
          </Row>
          {[
            ["Entry", "₹" + (trade.entry ?? "--")],
            ["Current", "₹" + (trade.current ?? "--")],
            ["Qty", trade.qty ?? "--"],
            ["P&L", (pnl >= 0 ? "+" : "") + "₹" + pnl],
          ].map(([l, v]) => (
            <Row key={l} style={{ justifyContent: "space-between",
              paddingVertical: 8, borderBottomWidth: 1,
              borderBottomColor: C.border }}>
              <Text style={{ color: C.muted, fontSize: 13 }}>{l}</Text>
              <Text style={{ color: l === "P&L" ? pnlColor : C.text,
                fontSize: 13, fontWeight: "900" }}>{v}</Text>
            </Row>
          ))}
        </Card>
      ) : (
        <Card>
          <Text style={{ color: C.muted, fontSize: 13,
            textAlign: "center", padding: 16 }}>
            {isActive ? "🔍 Signal dhundh raha hai..." : "📴 Koi active trade nahi"}
          </Text>
        </Card>
      )}

      {/* Today's Stats */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 12 }}>Aaj Ka Performance</Text>
        {[
          ["Total Trades", status?.today_trades ?? 0],
          ["Winners", status?.today_wins ?? 0],
          ["Total P&L", "₹" + (status?.today_pnl ?? 0)],
          ["Capital Used", "₹" + (status?.capital_used ?? 0) + " / ₹2000"],
        ].map(([l, v]) => (
          <Row key={l} style={{ justifyContent: "space-between",
            paddingVertical: 9, borderBottomWidth: 1,
            borderBottomColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 13 }}>{l}</Text>
            <Text style={{ color: C.text, fontSize: 13,
              fontWeight: "900" }}>{v}</Text>
          </Row>
        ))}
      </Card>
    </ScrollView>
  );
}

// ── Broker Tab ───────────────────────────────────────────
function BrokerTab({ token }) {
  const [broker, setBroker] = useState("angelone");
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [mpin, setMpin] = useState("");
  const [totpKey, setTotpKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const brokerList = ["angelone", "zerodha", "upstox"];
  const brokerFields = {
    angelone: [
      { key: "clientId", label: "Client ID", state: clientId,
        set: setClientId, placeholder: "Aapka Angel One Client ID" },
      { key: "apiKey", label: "API Key", state: apiKey,
        set: setApiKey, placeholder: "Angel One API Key" },
      { key: "apiSecret", label: "API Secret", state: apiSecret,
        set: setApiSecret, placeholder: "API Secret Key" },
      { key: "mpin", label: "MPIN", state: mpin,
        set: setMpin, placeholder: "4-digit MPIN", secure: true },
      { key: "totpKey", label: "TOTP Key", state: totpKey,
        set: setTotpKey, placeholder: "TOTP Secret (Authenticator se)" },
    ],
    zerodha: [
      { key: "clientId", label: "Client ID (Zerodha)", state: clientId,
        set: setClientId, placeholder: "ZZ0000" },
      { key: "apiKey", label: "API Key", state: apiKey,
        set: setApiKey, placeholder: "Kite API Key" },
      { key: "apiSecret", label: "API Secret", state: apiSecret,
        set: setApiSecret, placeholder: "Kite API Secret" },
      { key: "totpKey", label: "TOTP Key", state: totpKey,
        set: setTotpKey, placeholder: "TOTP Secret" },
    ],
    upstox: [
      { key: "clientId", label: "Client ID (Upstox)", state: clientId,
        set: setClientId, placeholder: "Upstox Client ID" },
      { key: "apiKey", label: "API Key", state: apiKey,
        set: setApiKey, placeholder: "Upstox API Key" },
      { key: "apiSecret", label: "API Secret", state: apiSecret,
        set: setApiSecret, placeholder: "Upstox API Secret" },
      { key: "totpKey", label: "TOTP Key", state: totpKey,
        set: setTotpKey, placeholder: "TOTP Secret" },
    ],
  };

  async function saveBroker() {
    setError(""); setSuccess(""); setLoading(true);
    try {
      const d = await apiPostAuth("/broker/save", {
        broker, client_id: clientId, api_key: apiKey,
        api_secret: apiSecret, mpin, totp_key: totpKey
      }, token);
      if (d.success || d.message) {
        setSuccess("✅ Broker credentials save ho gaye!");
      } else setError(d.detail || "Save failed");
    } catch { setError("Server error"); }
    setLoading(false);
  }

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "900",
          marginBottom: 16 }}>🔗 Broker Connect Karo</Text>

        {error ? <ErrorBox msg={error} /> : null}
        {success ? (
          <View style={{ backgroundColor: C.greenLo, borderRadius: 10,
            padding: 10, marginBottom: 10, borderWidth: 1,
            borderColor: C.green + "44" }}>
            <Text style={{ color: C.green, fontSize: 13,
              fontWeight: "700" }}>{success}</Text>
          </View>
        ) : null}

        <Label text="Broker" />
        <Row style={{ marginBottom: 16, gap: 8 }}>
          {brokerList.map(b => (
            <TouchableOpacity key={b} onPress={() => setBroker(b)}
              style={{ flex: 1, backgroundColor: broker===b
                ? C.blueLo : C.s2, borderRadius: 10,
                paddingVertical: 10, alignItems: "center",
                borderWidth: 1, borderColor: broker===b
                ? C.blue+"55" : C.border }}>
              <Text style={{ color: broker===b ? C.blue : C.muted,
                fontSize: 10, fontWeight: "900" }}>
                {b==="angelone"?"Angel":b==="zerodha"?"Zerodha":"Upstox"}
              </Text>
            </TouchableOpacity>
          ))}
        </Row>

        {(brokerFields[broker] || []).map(f => (
          <View key={f.key}>
            <Label text={f.label} />
            <TextInput style={st.input} value={f.state}
              onChangeText={f.set} placeholder={f.placeholder}
              placeholderTextColor={C.muted}
              autoCapitalize="none"
              secureTextEntry={f.secure ?? false} />
          </View>
        ))}

        <Btn label="Credentials Save Karo" icon="💾"
          color={C.blue} onPress={saveBroker} loading={loading}
          style={{ marginTop: 8 }} />
      </Card>

      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 12 }}>🔒 Security</Text>
        {[
          ["🔐", "AES-256 Encryption", "Credentials encrypted store hote hain"],
          ["🔑", "JWT Auth", "Har request authenticated hai"],
          ["🚫", "No Plain Text", "Kabhi plain text save nahi hota"],
        ].map(([icon, title, desc]) => (
          <Row key={title} style={{ paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: C.border,
            gap: 12 }}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 13,
                fontWeight: "800" }}>{title}</Text>
              <Text style={{ color: C.muted, fontSize: 11,
                marginTop: 2 }}>{desc}</Text>
            </View>
          </Row>
        ))}
      </Card>
    </ScrollView>
  );
}

// ── Plans Tab ────────────────────────────────────────────
function PlansTab({ token, user, onSuccess }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  async function subscribe(plan) {
    setError(""); setLoading(plan);
    try {
      const d = await apiPostAuth("/subscription/create-order",
        { plan }, token);
      if (d.order_id) {
        Alert.alert("Payment", `Order created!\nID: ${d.order_id}\n\nRazorpay checkout karo.`);
        onSuccess && onSuccess();
      } else setError(d.detail || "Order create failed");
    } catch { setError("Server error"); }
    setLoading(null);
  }

  const plans = [
    {
      id: "monthly", icon: "⚡", name: "Monthly Pro",
      price: "₹999", period: "/month", color: C.accent,
      features: ["Unlimited Signals", "All Strategies",
        "HERO Zero Expiry", "WhatsApp Alerts", "Priority Support"],
    },
    {
      id: "quarterly", icon: "🌟", name: "Quarterly Pro",
      price: "₹2499", period: "/3 months", color: C.gold,
      badge: "SAVE 17%",
      features: ["Sab Monthly wala", "Backtest Reports",
        "Custom SL/TP", "Dedicated Support"],
    },
    {
      id: "yearly", icon: "👑", name: "Annual Pro",
      price: "₹7999", period: "/year", color: C.green,
      badge: "BEST VALUE",
      features: ["Sab Quarterly wala", "API Access",
        "Admin Dashboard", "1-on-1 Onboarding"],
    },
  ];

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={C.gold}>
        <Row style={{ justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: C.gold, fontSize: 16,
              fontWeight: "900" }}>💎 Pro Subscription</Text>
            <Text style={{ color: C.muted, fontSize: 12,
              marginTop: 4 }}>Apna plan choose karo</Text>
          </View>
          <Tag label={user?.subscription_status?.toUpperCase()||"TRIAL"}
            color={user?.subscription_status==="active"?C.green:C.accent} />
        </Row>
      </Card>

      <ErrorBox msg={error} />

      {plans.map(plan => (
        <Card key={plan.id} glow={plan.color}
          style={{ borderColor: plan.color+"33" }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <Row style={{ gap: 10 }}>
              <Text style={{ fontSize: 24 }}>{plan.icon}</Text>
              <View>
                <Text style={{ color: C.text, fontSize: 15,
                  fontWeight: "900" }}>{plan.name}</Text>
                <Row style={{ gap: 4, marginTop: 2 }}>
                  <Text style={{ color: plan.color, fontSize: 20,
                    fontWeight: "900" }}>{plan.price}</Text>
                  <Text style={{ color: C.muted, fontSize: 12,
                    alignSelf: "flex-end", marginBottom: 2 }}>
                    {plan.period}
                  </Text>
                </Row>
              </View>
            </Row>
            {plan.badge && <Tag label={plan.badge} color={plan.color} />}
          </Row>

          {plan.features.map(f => (
            <Row key={f} style={{ gap: 8, marginBottom: 6 }}>
              <Text style={{ color: plan.color, fontSize: 14 }}>✓</Text>
              <Text style={{ color: C.sub, fontSize: 13 }}>{f}</Text>
            </Row>
          ))}

          <Btn label={"Subscribe — " + plan.price} icon="💳"
            color={plan.color} onPress={() => subscribe(plan.id)}
            loading={loading === plan.id}
            style={{ marginTop: 12 }} />
        </Card>
      ))}

      <Card style={{ marginTop: 4 }}>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 12 }}>🔒 Secure Payment</Text>
        {[
          ["🏦", "Razorpay", "India ka #1 payment gateway"],
          ["🔐", "SSL Encrypted", "100% secure transactions"],
          ["↩️", "Easy Refund", "7-din refund policy"],
        ].map(([icon, t, d]) => (
          <Row key={t} style={{ gap: 10, paddingVertical: 8,
            borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
            <View>
              <Text style={{ color: C.text, fontSize: 13,
                fontWeight: "700" }}>{t}</Text>
              <Text style={{ color: C.muted, fontSize: 11 }}>{d}</Text>
            </View>
          </Row>
        ))}
      </Card>
    </ScrollView>
  );
}

// ── Admin Tab ────────────────────────────────────────────
function AdminTab({ token, user }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === "admin" || user?.is_admin;

  async function load(isRefresh) {
    if (!isAdmin) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [s, u] = await Promise.all([
        apiGet("/admin/stats", token),
        apiGet("/admin/users", token),
      ]);
      setStats(s); setUsers(u.users || []);
    } catch {}
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }

  useEffect(() => { load(false); }, []);

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center",
        justifyContent: "center", padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
        <Text style={{ color: C.muted, fontSize: 14,
          textAlign: "center" }}>Admin access required</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={() => load(true)} tintColor={C.purple} />}>

      <Card glow={C.purple}>
        <Text style={{ color: C.purple, fontSize: 16,
          fontWeight: "900", marginBottom: 4 }}>👑 Admin Dashboard</Text>
        <Text style={{ color: C.muted, fontSize: 12 }}>
          Pull to refresh
        </Text>
      </Card>

      {loading && (
        <View style={{ alignItems: "center", padding: 20 }}>
          <ActivityIndicator color={C.purple} />
        </View>
      )}

      {/* Stats Grid */}
      {stats && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            ["👥", "Total Users", stats.total_users, C.blue],
            ["✅", "Active Subs", stats.active_subscriptions, C.green],
            ["🆓", "Trial Users", stats.trial_users, C.gold],
            ["💰", "Revenue", "₹" + (stats.total_revenue || 0), C.green],
            ["🤖", "Bot Running", stats.bot_active ? "YES" : "NO",
              stats.bot_active ? C.green : C.red],
            ["📈", "Trades Today", stats.trades_today || 0, C.accent],
          ].map(([icon, label, val, color]) => (
            <Card key={label}
              style={{ width: "47%", alignItems: "center", padding: 14 }}>
              <Text style={{ fontSize: 22 }}>{icon}</Text>
              <Text style={{ color: color, fontSize: 18,
                fontWeight: "900", marginTop: 4 }}>{val}</Text>
              <Text style={{ color: C.muted, fontSize: 10,
                marginTop: 2, textAlign: "center" }}>{label}</Text>
            </Card>
          ))}
        </View>
      )}

      {/* Users List */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 14 }}>Recent Users</Text>
        {users.slice(0, 10).map((u, i) => (
          <Row key={u.id || i} style={{ justifyContent: "space-between",
            paddingVertical: 10, borderBottomWidth: 1,
            borderBottomColor: C.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 13,
                fontWeight: "800" }}>{u.name || "--"}</Text>
              <Text style={{ color: C.muted, fontSize: 11,
                marginTop: 1 }}>{u.email || "--"}</Text>
            </View>
            <Tag label={u.subscription_status?.toUpperCase() || "TRIAL"}
              color={u.subscription_status==="active"?C.green:C.accent} />
          </Row>
        ))}
        {users.length === 0 && !loading && (
          <Text style={{ color: C.muted, fontSize: 13,
            textAlign: "center", padding: 16 }}>Koi user nahi mila</Text>
        )}
      </Card>

      {/* Bot Control */}
      <Card glow={C.orange}>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 12 }}>⚙️ Bot Control</Text>
        <Row style={{ gap: 10 }}>
          <Btn label="Bot Start" icon="▶️" color={C.green}
            onPress={async () => {
              await apiPostAuth("/admin/bot/start", {}, token);
              load(false);
            }} style={{ flex: 1 }} />
          <Btn label="Bot Stop" icon="⏹️" color={C.red}
            onPress={async () => {
              await apiPostAuth("/admin/bot/stop", {}, token);
              load(false);
            }} style={{ flex: 1 }} />
        </Row>
      </Card>
    </ScrollView>
  );
}

// ── Home Tab ─────────────────────────────────────────────
function HomeTab({ user, subStatus, onSubscribe }) {
  const daysLeft = subStatus?.days_remaining ?? null;

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={C.purple}>
        <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <View>
            <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800",
              textTransform: "uppercase" }}>Welcome Back</Text>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: "900",
              marginTop: 2 }}>{user?.name || "Trader"}</Text>
          </View>
          <Text style={{ fontSize: 36 }}>👑</Text>
        </Row>
        <View style={{ backgroundColor: C.s2, borderRadius: 10,
          padding: 12, borderWidth: 1, borderColor: C.border }}>
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>Subscription</Text>
            <Tag label={user?.subscription_status?.toUpperCase()||"TRIAL"}
              color={user?.subscription_status==="active"?C.green:C.accent} />
          </Row>
          {daysLeft !== null && (
            <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>Bacha hua time</Text>
              <Text style={{ color: daysLeft<=3?C.red:C.green,
                fontWeight: "900", fontSize: 13 }}>{daysLeft} din</Text>
            </Row>
          )}
        </View>
      </Card>

      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 14 }}>Platform Info</Text>
        <Row style={{ gap: 12 }}>
          {[
            { label: "Market", val: "NSE F&O", color: C.blue },
            { label: "Broker", val: "Multi", color: C.green },
          ].map(item => (
            <Card key={item.label} style={{ flex: 1 }}>
              <Text style={{ color: C.muted, fontSize: 10,
                fontWeight: "800", textTransform: "uppercase" }}>{item.label}</Text>
              <Text style={{ color: item.color, fontSize: 20,
                fontWeight: "900", marginTop: 4 }}>{item.val}</Text>
            </Card>
          ))}
        </Row>
      </Card>

      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 14 }}>Features</Text>
        {[
          ["🤖", "Automatic F&O Trading", "AI-powered signals"],
          ["📊", "Real-time Signals", "NIFTY & BANKNIFTY"],
          ["🔔", "Telegram Alerts", "Instant notifications"],
          ["🔗", "Multi-broker Support", "Angel One, Zerodha, Upstox"],
          ["🔴", "HERO Zero Expiry", "Expiry day strategy"],
          ["📈", "TQU Score System", "ADX + Volume + MTF"],
        ].map(([icon, title, sub]) => (
          <Row key={title} style={{ paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 }}>
            <Text style={{ fontSize: 20, width: 32 }}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 13,
                fontWeight: "800" }}>{title}</Text>
              <Text style={{ color: C.muted, fontSize: 11,
                marginTop: 2 }}>{sub}</Text>
            </View>
          </Row>
        ))}
      </Card>

      {user?.subscription_status !== "active" && (
        <Btn label="Plans Dekho" icon="💎" color={C.gold}
          onPress={onSubscribe} />
      )}
    </ScrollView>
  );
}

// ── Account Tab ──────────────────────────────────────────
function AccountTab({ user, subStatus, onLogout, onRefresh }) {
  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={C.purple}>
        <Row style={{ marginBottom: 16 }}>
          <View style={{ width: 52, height: 52, borderRadius: 14,
            backgroundColor: C.purpleLo, borderWidth: 2,
            borderColor: C.purple+"55", alignItems: "center",
            justifyContent: "center" }}>
            <Text style={{ color: C.purple, fontSize: 22,
              fontWeight: "900" }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: C.text, fontSize: 16,
              fontWeight: "900" }}>{user?.name || "--"}</Text>
            <Text style={{ color: C.muted, fontSize: 12,
              marginTop: 2 }}>{user?.email || "--"}</Text>
            {user?.phone && <Text style={{ color: C.muted,
              fontSize: 12, marginTop: 2 }}>{user.phone}</Text>}
          </View>
        </Row>
        <Tag label={user?.subscription_status?.toUpperCase()||"TRIAL"}
          color={user?.subscription_status==="active"?C.green:C.accent} />
      </Card>

      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 12 }}>Account Details</Text>
        {[
          ["Status", user?.subscription_status?.toUpperCase() || "--"],
          ["Bacha hua time", subStatus?.days_remaining != null
            ? `${subStatus.days_remaining} din` : "--"],
          ["Trial ends", user?.trial_ends_at
            ? new Date(user.trial_ends_at).toLocaleDateString("en-IN") : "--"],
          ["Member since", user?.created_at
            ? new Date(user.created_at).toLocaleDateString("en-IN") : "--"],
        ].map(([l, v]) => (
          <Row key={l} style={{ justifyContent: "space-between",
            paddingVertical: 10, borderBottomWidth: 1,
            borderBottomColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 13 }}>{l}</Text>
            <Text style={{ color: C.text, fontSize: 13,
              fontWeight: "800" }}>{v}</Text>
          </Row>
        ))}
      </Card>

      <Btn label="Refresh" icon="🔄" color={C.blue} onPress={onRefresh} />

      <Btn label="Logout" icon="🚪" color={C.red}
        onPress={() => Alert.alert("Logout", "Aap logout karna chahte hain?", [
          { text: "Cancel", style: "cancel" },
          { text: "Logout", style: "destructive", onPress: onLogout }
        ])} />
    </ScrollView>
  );
}

// ── Dashboard Screen ──────────────────────────────────────
function DashboardScreen({ token, user, onLogout }) {
  const [activeTab, setActiveTab] = useState("home");
  const [subStatus, setSubStatus] = useState(null);
  const [userFresh, setUserFresh] = useState(user);

  useEffect(() => { refreshUser(); }, []);

  async function refreshUser() {
    try {
      const data = await apiGet("/auth/me", token);
      setUserFresh(data.user);
      const sub = await apiGet("/subscription/status", token);
      setSubStatus(sub);
    } catch {}
  }

  const isAdmin = userFresh?.role==="admin" || userFresh?.is_admin;

  const tabs = [
    { id: "home",   icon: "🏠", label: "Home" },
    { id: "score",  icon: "📊", label: "Score" },
    { id: "hero",   icon: "🔴", label: "Hero" },
    { id: "broker", icon: "🔗", label: "Broker" },
    { id: "plans",  icon: "💎", label: "Plans" },
    ...(isAdmin ? [{ id: "admin", icon: "👑", label: "Admin" }] : []),
    { id: "account",icon: "👤", label: "Account" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ backgroundColor: C.s1, paddingTop: 50,
        paddingBottom: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Row style={{ gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10,
              backgroundColor: C.accentLo, borderWidth: 1,
              borderColor: C.accent+"55", alignItems: "center",
              justifyContent: "center" }}>
              <Text style={{ fontSize: 18 }}>👑</Text>
            </View>
            <View>
              <Text style={{ color: C.text, fontSize: 15,
                fontWeight: "900" }}>Option King AI</Text>
              <Text style={{ color: C.muted, fontSize: 10,
                fontWeight: "700" }}>
                {userFresh?.name || user?.name || "User"}
              </Text>
            </View>
          </Row>
          <Tag label={userFresh?.subscription_status?.toUpperCase()||"TRIAL"}
            color={userFresh?.subscription_status==="active"?C.green:C.accent} />
        </Row>
      </View>

      {/* Subscription warning */}
      {userFresh?.subscription_status !== "active" && (
        <TouchableOpacity
          onPress={() => setActiveTab("plans")}
          style={{ backgroundColor: C.redLo, borderRadius: 12,
            padding: 14, margin: 16, marginBottom: 0,
            borderWidth: 1, borderColor: C.red+"55" }}>
          <Text style={{ color: C.red, fontWeight: "900",
            fontSize: 13 }}>⚠️ Trial khatam — Subscribe karo → ₹999/month</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}>
        {activeTab === "home" && (
          <HomeTab user={userFresh} subStatus={subStatus}
            onSubscribe={() => setActiveTab("plans")} />
        )}
        {activeTab === "score" && <ScoreTab token={token} />}
        {activeTab === "hero" && <HeroTab token={token} />}
        {activeTab === "broker" && <BrokerTab token={token} />}
        {activeTab === "plans" && (
          <PlansTab token={token} user={userFresh}
            onSuccess={refreshUser} />
        )}
        {activeTab === "admin" && isAdmin && (
          <AdminTab token={token} user={userFresh} />
        )}
        {activeTab === "account" && (
          <AccountTab user={userFresh} subStatus={subStatus}
            onLogout={onLogout} onRefresh={refreshUser} />
        )}
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: C.s1, borderTopWidth: 1,
        borderTopColor: C.border, flexDirection: "row",
        paddingBottom: Platform.OS==="ios"?24:10, paddingTop: 10 }}>
        {tabs.map(t => (
          <TouchableOpacity key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 18 }}>{t.icon}</Text>
            <Text style={{ color: activeTab===t.id?C.accent:C.muted,
              fontSize: 10, fontWeight: "900" }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [token, setToken]   = useState(null);
  const [user, setUser]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [[, savedToken], [, savedUser]] =
          await AsyncStorage.multiGet(["saas_token", "saas_user"]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setScreen("dashboard");
          try {
            const fresh = await apiGet("/auth/me", savedToken);
            setUser(fresh.user);
            await AsyncStorage.setItem("saas_user",
              JSON.stringify(fresh.user));
          } catch {}
        } else { setScreen("login"); }
      } catch { setScreen("login"); }
    })();
  }, []);

  function handleLogin(t, u) {
    setToken(t); setUser(u); setScreen("dashboard");
    AsyncStorage.multiSet([["saas_token", t],
      ["saas_user", JSON.stringify(u)]]);
  }

  async function handleLogout() {
    await AsyncStorage.multiRemove(["saas_token", "saas_user"]);
    setToken(null); setUser(null); setScreen("login");
  }

  if (screen === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg,
        alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 40, marginBottom: 20 }}>👑</Text>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: C.muted, marginTop: 16,
          fontSize: 13 }}>Option King AI loading...</Text>
      </View>
    );
  }
  if (screen === "register") {
    return <RegisterScreen onLogin={handleLogin}
      onBack={() => setScreen("login")} />;
  }
  if (screen === "login") {
    return <LoginScreen onLogin={handleLogin}
      onRegister={() => setScreen("register")} />;
  }
  return <DashboardScreen token={token} user={user}
    onLogout={handleLogout} />;
}

// ── Styles ────────────────────────────────────────────────
const st = StyleSheet.create({
  input: {
    backgroundColor: C.s2, borderColor: C.border2,
    borderWidth: 1, borderRadius: 12, color: C.text,
    fontSize: 14, paddingHorizontal: 14, paddingVertical: 13,
    marginBottom: 12,
  },
});
