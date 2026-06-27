import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Config ──────────────────────────────────────────────────────────────────
const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const W = Dimensions.get("window").width;

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  bg:       "#040d18",
  s1:       "#080f1e",
  s2:       "#0c1628",
  s3:       "#111e30",
  border:   "#16243a",
  border2:  "#1d3050",
  accent:   "#f59e0b",
  accentLo: "#1c1405",
  blue:     "#38bdf8",
  blueLo:   "#04141e",
  green:    "#22c55e",
  greenLo:  "#041208",
  red:      "#ef4444",
  redLo:    "#180606",
  purple:   "#a78bfa",
  purpleLo: "#12082a",
  text:     "#f0f4f8",
  sub:      "#8fa0b4",
  muted:    "#3d5068",
  gold:     "#fbbf24",
  teal:     "#2dd4bf",
};

// ─── API Helpers ─────────────────────────────────────────────────────────────
async function apiPost(path, body, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(SAAS_URL + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

async function apiGet(path, token) {
  const res = await fetch(SAAS_URL + path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

// ─── UI Components ───────────────────────────────────────────────────────────
function Card({ children, style, glow }) {
  return (
    <View style={[{
      backgroundColor: C.s1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: glow ? glow + "66" : C.border,
      padding: 16,
      shadowColor: glow || "transparent",
      shadowOpacity: glow ? 0.2 : 0,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    }, style]}>
      {children}
    </View>
  );
}

function Row({ children, style }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, style]}>{children}</View>;
}

function Label({ text }) {
  return <Text style={{ color: C.sub, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase" }}>{text}</Text>;
}

function Btn({ label, onPress, color = C.accent, loading, icon, style }) {
  return (
    <TouchableOpacity
      onPress={loading ? undefined : onPress}
      style={[{
        backgroundColor: color + "22",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: color + "55",
        paddingVertical: 14,
        alignItems: "center",
        opacity: loading ? 0.7 : 1,
      }, style]}>
      {loading
        ? <ActivityIndicator color={color} size="small" />
        : <Text style={{ color, fontSize: 13, fontWeight: "900", letterSpacing: 0.5 }}>
            {icon ? `${icon}  ${label}` : label}
          </Text>
      }
    </TouchableOpacity>
  );
}

function Tag({ label, color = C.blue }) {
  return (
    <View style={{ backgroundColor: color + "18", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: color + "44" }}>
      <Text style={{ color, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 }}>{label}</Text>
    </View>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <View style={{ backgroundColor: C.redLo, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.red + "44" }}>
      <Text style={{ color: C.red, fontSize: 12, fontWeight: "700" }}>⚠️  {msg}</Text>
    </View>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onRegister }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin() {
    if (!email || !password) { setError("Email aur password zaroori hain"); return; }
    setLoading(true); setError("");
    try {
      const data = await apiPost("/auth/login", { email: email.trim().toLowerCase(), password });
      await AsyncStorage.multiSet([
        ["saas_token", data.token],
        ["saas_user", JSON.stringify(data.user)],
      ]);
      if (data.warning) Alert.alert("⚠️ Notice", data.warning);
      onLogin(data.token, data.user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: C.accentLo, borderWidth: 2, borderColor: C.accent + "66", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 32 }}>👑</Text>
          </View>
          <Text style={{ color: C.text, fontSize: 26, fontWeight: "900", letterSpacing: 0.5 }}>Option King AI</Text>
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>F&O Trading Bot Platform</Text>
        </View>

        <Card glow={C.accent}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 20 }}>Login</Text>
          <ErrorBox msg={error} />
          <Label text="Email" />
          <TextInput style={st.input} value={email} onChangeText={setEmail} placeholder="aapki@email.com" placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="email-address" />
          <Label text="Password" />
          <TextInput style={[st.input, { marginBottom: 20 }]} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={C.muted} secureTextEntry />
          <Btn label="Login" icon="⚡" color={C.accent} onPress={handleLogin} loading={loading} />
        </Card>

        <TouchableOpacity onPress={onRegister} style={{ marginTop: 20, alignItems: "center", padding: 12 }}>
          <Text style={{ color: C.sub, fontSize: 14 }}>
            Account nahi hai?{" "}
            <Text style={{ color: C.accent, fontWeight: "900" }}>Register karo</Text>
          </Text>
        </TouchableOpacity>

        <Text style={{ color: C.muted, fontSize: 11, textAlign: "center", marginTop: 8 }}>
          Secure • Encrypted • Made in India 🇮🇳
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Register Screen ──────────────────────────────────────────────────────────
function RegisterScreen({ onLogin, onBack }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleRegister() {
    if (!name || !email || !password) { setError("Naam, email aur password zaroori hain"); return; }
    if (password !== confirm) { setError("Dono passwords same nahi hain"); return; }
    if (password.length < 6) { setError("Password kam se kam 6 characters ka hona chahiye"); return; }
    setLoading(true); setError("");
    try {
      const data = await apiPost("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || null,
      });
      await AsyncStorage.multiSet([
        ["saas_token", data.token],
        ["saas_user", JSON.stringify(data.user)],
      ]);
      Alert.alert("🎉 Welcome!", data.message || "Registration ho gayi!");
      onLogin(data.token, data.user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Row style={{ marginBottom: 28 }}>
          <TouchableOpacity onPress={onBack} style={{ padding: 8, backgroundColor: C.s2, borderRadius: 10, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.sub, fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: "900" }}>Account Banao</Text>
            <Text style={{ color: C.green, fontSize: 12, fontWeight: "800", marginTop: 2 }}>🎁 7 Din Free Trial</Text>
          </View>
        </Row>

        <Card glow={C.green}>
          <ErrorBox msg={error} />
          <Label text="Naam *" />
          <TextInput style={st.input} value={name} onChangeText={setName} placeholder="Aapka poora naam" placeholderTextColor={C.muted} />
          <Label text="Email *" />
          <TextInput style={st.input} value={email} onChangeText={setEmail} placeholder="aapki@email.com" placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="email-address" />
          <Label text="Phone (Optional)" />
          <TextInput style={st.input} value={phone} onChangeText={setPhone} placeholder="9999999999" placeholderTextColor={C.muted} keyboardType="phone-pad" />
          <Label text="Password *" />
          <TextInput style={st.input} value={password} onChangeText={setPassword} placeholder="Kam se kam 6 characters" placeholderTextColor={C.muted} secureTextEntry />
          <Label text="Password Confirm *" />
          <TextInput style={[st.input, { marginBottom: 20 }]} value={confirm} onChangeText={setConfirm} placeholder="Password dobara daalo" placeholderTextColor={C.muted} secureTextEntry />
          <Btn label="Register Karo" icon="🚀" color={C.green} onPress={handleRegister} loading={loading} />
        </Card>

        {/* Trial Info */}
        <Card style={{ marginTop: 12 }}>
          <Row>
            <Text style={{ fontSize: 20 }}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 14, fontWeight: "900" }}>7 Din Free Trial</Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>Register karo aur 7 din tak bilkul free use karo — koi credit card nahi</Text>
            </View>
          </Row>
        </Card>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
function DashboardScreen({ token, user, onLogout }) {
  const [activeTab, setActiveTab] = useState("home");
  const [subStatus, setSubStatus] = useState(null);
  const [userFresh, setUserFresh] = useState(user);

  useEffect(() => {
    refreshUser();
  }, []);

  async function refreshUser() {
    try {
      const data = await apiGet("/auth/me", token);
      setUserFresh(data.user);
      const sub = await apiGet("/subscription/status", token);
      setSubStatus(sub);
    } catch {}
  }

  const tabs = [
    { id: "home",    icon: "🏠", label: "Home" },
    { id: "broker",  icon: "🔗", label: "Broker" },
    { id: "plans",   icon: "💎", label: "Plans" },
    { id: "account", icon: "👤", label: "Account" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ backgroundColor: C.s1, paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Row style={{ gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.accentLo, borderWidth: 1, borderColor: C.accent + "55", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 18 }}>👑</Text>
            </View>
            <View>
              <Text style={{ color: C.text, fontSize: 15, fontWeight: "900" }}>Option King AI</Text>
              <Text style={{ color: C.muted, fontSize: 10, fontWeight: "700" }}>
                {userFresh?.name || user?.name || "User"}
              </Text>
            </View>
          </Row>
          <Tag
            label={userFresh?.subscription_status?.toUpperCase() || "TRIAL"}
            color={userFresh?.subscription_status === "active" ? C.green : C.accent}
          />
        </Row>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

        {/* Subscription Warning */}
        {userFresh?.subscription_status === "expired" && (
          <TouchableOpacity onPress={() => setActiveTab("plans")} style={{ backgroundColor: C.redLo, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.red + "55" }}>
            <Text style={{ color: C.red, fontWeight: "900", fontSize: 13 }}>⚠️ Trial khatam — Subscribe karo → ₹999/month</Text>
          </TouchableOpacity>
        )}

        {activeTab === "home" && <HomeTab user={userFresh} subStatus={subStatus} onSubscribe={() => setActiveTab("plans")} />}
        {activeTab === "broker" && <BrokerTab token={token} />}
        {activeTab === "plans" && <PlansTab token={token} user={userFresh} onSuccess={refreshUser} />}
        {activeTab === "account" && <AccountTab user={userFresh} subStatus={subStatus} onLogout={onLogout} onRefresh={refreshUser} />}

      </ScrollView>

      {/* Bottom Tabs */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.s1, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", paddingBottom: Platform.OS === "ios" ? 24 : 10, paddingTop: 10 }}>
        {tabs.map(t => (
          <TouchableOpacity key={t.id} onPress={() => setActiveTab(t.id)} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 18 }}>{t.icon}</Text>
            <Text style={{ color: activeTab === t.id ? C.accent : C.muted, fontSize: 10, fontWeight: "900" }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────
function HomeTab({ user, subStatus, onSubscribe }) {
  const daysLeft = subStatus?.days_remaining ?? null;

  return (
    <>
      {/* Welcome Card */}
      <Card glow={C.purple}>
        <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <View>
            <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>Welcome Back</Text>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginTop: 2 }}>{user?.name || "Trader"}</Text>
          </View>
          <Text style={{ fontSize: 36 }}>👑</Text>
        </Row>
        <View style={{ backgroundColor: C.s2, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border }}>
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>Subscription</Text>
            <Tag label={user?.subscription_status?.toUpperCase() || "TRIAL"} color={user?.subscription_status === "active" ? C.green : C.accent} />
          </Row>
          {daysLeft !== null && (
            <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>Bacha hua time</Text>
              <Text style={{ color: daysLeft <= 3 ? C.red : C.green, fontWeight: "900", fontSize: 13 }}>
                {daysLeft} din
              </Text>
            </Row>
          )}
        </View>
      </Card>

      {/* Quick Stats */}
      <Row style={{ gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>Status</Text>
          <Text style={{ color: C.green, fontSize: 20, fontWeight: "900", marginTop: 4 }}>Active</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>Platform</Text>
          <Text style={{ color: C.blue, fontSize: 20, fontWeight: "900", marginTop: 4 }}>NSE F&O</Text>
        </Card>
      </Row>

      {/* Features */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Features</Text>
        {[
          ["🤖", "Automatic F&O Trading", "AI-powered signals"],
          ["📊", "Real-time Signals", "NIFTY & BANKNIFTY"],
          ["🔔", "Telegram Alerts", "Instant notifications"],
          ["📱", "Multi-broker Support", "Angel One, Zerodha, Upstox"],
        ].map(([icon, title, sub]) => (
          <Row key={title} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ fontSize: 20, width: 32 }}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{title}</Text>
              <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{sub}</Text>
            </View>
          </Row>
        ))}
      </Card>

      {/* Subscribe CTA */}
      {user?.subscription_status !== "active" && (
        <Btn label="Plans Dekho" icon="💎" color={C.gold} onPress={onSubscribe} />
      )}
    </>
  );
}

// ─── Broker Tab ───────────────────────────────────────────────────────────────
function BrokerTab({ token }) {
  const [broker, setBroker]       = useState("angelone");
  const [clientId, setClientId]   = useState("");
  const [apiKey, setApiKey]       = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [totp, setTotp]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [brokers, setBrokers]     = useState([]);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => { loadBrokers(); }, []);

  async function loadBrokers() {
    try {
      const data = await apiGet("/broker/list", token);
      setBrokers(data.brokers || []);
    } catch {}
  }

  async function connectBroker() {
    if (!clientId || !apiKey || !apiSecret) { setError("Client ID, API Key aur Secret zaroori hain"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const data = await apiPost("/broker/connect", {
        broker_name: broker,
        client_id: clientId,
        api_key: apiKey,
        api_secret: apiSecret,
        totp_secret: totp || null,
      }, token);
      setSuccess(data.message);
      loadBrokers();
      setClientId(""); setApiKey(""); setApiSecret(""); setTotp("");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  const brokerList = ["angelone", "zerodha", "upstox"];

  return (
    <>
      {/* Connected Brokers */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Connected Brokers</Text>
        {brokers.length === 0
          ? <Text style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 16 }}>Koi broker connect nahi hai</Text>
          : brokers.map(b => (
            <Row key={b.id} style={{ justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.text, fontWeight: "800", fontSize: 13 }}>{b.broker_name?.toUpperCase()}</Text>
              <Tag label={b.is_active ? "ACTIVE" : "OFF"} color={b.is_active ? C.green : C.muted} />
            </Row>
          ))
        }
      </Card>

      {/* Connect New Broker */}
      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 16 }}>Broker Connect Karo</Text>

        {error ? <ErrorBox msg={error} /> : null}
        {success ? (
          <View style={{ backgroundColor: C.greenLo, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.green + "44" }}>
            <Text style={{ color: C.green, fontSize: 12, fontWeight: "700" }}>✅ {success}</Text>
          </View>
        ) : null}

        {/* Broker Selector */}
        <Label text="Broker" />
        <Row style={{ marginBottom: 12, gap: 8 }}>
          {brokerList.map(b => (
            <TouchableOpacity key={b} onPress={() => setBroker(b)}
              style={{ flex: 1, backgroundColor: broker === b ? C.blueLo : C.s2, borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: broker === b ? C.blue + "55" : C.border }}>
              <Text style={{ color: broker === b ? C.blue : C.muted, fontSize: 10, fontWeight: "900" }}>
                {b === "angelone" ? "Angel" : b === "zerodha" ? "Zerodha" : "Upstox"}
              </Text>
            </TouchableOpacity>
          ))}
        </Row>

        <Label text="Client ID" />
        <TextInput style={st.input} value={clientId} onChangeText={setClientId} placeholder="Aapka client ID" placeholderTextColor={C.muted} autoCapitalize="none" />
        <Label text="API Key" />
        <TextInput style={st.input} value={apiKey} onChangeText={setApiKey} placeholder="API Key" placeholderTextColor={C.muted} autoCapitalize="none" />
        <Label text="API Secret" />
        <TextInput style={st.input} value={apiSecret} onChangeText={setApiSecret} placeholder="API Secret" placeholderTextColor={C.muted} secureTextEntry />
        {broker === "angelone" && (
          <>
            <Label text="TOTP Secret (Angel One)" />
            <TextInput style={[st.input, { marginBottom: 16 }]} value={totp} onChangeText={setTotp} placeholder="TOTP Secret (optional)" placeholderTextColor={C.muted} autoCapitalize="none" />
          </>
        )}
        <Btn label="Connect Karo" icon="🔗" color={C.blue} onPress={connectBroker} loading={loading} style={{ marginTop: 4 }} />
      </Card>
    </>
  );
}

// ─── Plans Tab ────────────────────────────────────────────────────────────────
function PlansTab({ token, user, onSuccess }) {
  const [plans, setPlans]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    try {
      const data = await apiGet("/subscription/plans", token);
      setPlans(data);
    } catch {}
  }

  async function subscribe(planId) {
    Alert.alert(
      "Subscribe",
      `${planId === "basic" ? "Basic — ₹999/month" : "Pro — ₹1,999/month"} plan select kiya.\n\nRazorpay payment coming soon!`,
      [{ text: "OK" }]
    );
  }

  return (
    <>
      {/* Trial Info */}
      <Card glow={C.accent}>
        <Row style={{ gap: 12 }}>
          <Text style={{ fontSize: 28 }}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "900" }}>7 Din Free Trial</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Register karo aur pehle 7 din bilkul free use karo</Text>
          </View>
        </Row>
      </Card>

      {/* Basic Plan */}
      <Card glow={C.blue}>
        <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>Basic</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: C.blue, fontSize: 24, fontWeight: "900" }}>₹999</Text>
            <Text style={{ color: C.muted, fontSize: 11 }}>/month</Text>
          </View>
        </Row>
        {[
          "1 Broker Connection",
          "Live F&O Trading",
          "Real-time Signals",
          "Telegram Notifications",
          "Trade History",
        ].map(f => (
          <Row key={f} style={{ paddingVertical: 6 }}>
            <Text style={{ color: C.green, fontSize: 14 }}>✓</Text>
            <Text style={{ color: C.sub, fontSize: 13 }}>{f}</Text>
          </Row>
        ))}
        <Btn label="Basic Subscribe Karo" color={C.blue} onPress={() => subscribe("basic")} style={{ marginTop: 12 }} />
      </Card>

      {/* Pro Plan */}
      <Card glow={C.gold}>
        <Row style={{ justifyContent: "space-between", marginBottom: 4 }}>
          <Row style={{ gap: 8 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>Pro</Text>
            <Tag label="BEST VALUE" color={C.gold} />
          </Row>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: C.gold, fontSize: 24, fontWeight: "900" }}>₹1,999</Text>
            <Text style={{ color: C.muted, fontSize: 11 }}>/month</Text>
          </View>
        </Row>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Sabse zyada features</Text>
        {[
          "3 Broker Connections",
          "Live F&O Trading",
          "Priority Signals",
          "Telegram + Push Notifications",
          "Advanced Analytics",
          "Trade Reports",
          "Priority Support",
        ].map(f => (
          <Row key={f} style={{ paddingVertical: 6 }}>
            <Text style={{ color: C.green, fontSize: 14 }}>✓</Text>
            <Text style={{ color: C.sub, fontSize: 13 }}>{f}</Text>
          </Row>
        ))}
        <Btn label="Pro Subscribe Karo" icon="⭐" color={C.gold} onPress={() => subscribe("pro")} style={{ marginTop: 12 }} />
      </Card>
    </>
  );
}

// ─── Account Tab ──────────────────────────────────────────────────────────────
function AccountTab({ user, subStatus, onLogout, onRefresh }) {
  return (
    <>
      <Card glow={C.purple}>
        <Row style={{ marginBottom: 16 }}>
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: C.purpleLo, borderWidth: 2, borderColor: C.purple + "55", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: C.purple, fontSize: 22, fontWeight: "900" }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "900" }}>{user?.name || "--"}</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{user?.email || "--"}</Text>
            {user?.phone && <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{user.phone}</Text>}
          </View>
        </Row>
        <Tag label={user?.subscription_status?.toUpperCase() || "TRIAL"} color={user?.subscription_status === "active" ? C.green : C.accent} />
      </Card>

      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Subscription Info</Text>
        {[
          ["Status", user?.subscription_status?.toUpperCase() || "--"],
          ["Bacha hua time", subStatus?.days_remaining != null ? `${subStatus.days_remaining} din` : "--"],
          ["Trial ends", user?.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString("en-IN") : "--"],
        ].map(([l, v]) => (
          <Row key={l} style={{ justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 13 }}>{l}</Text>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{v}</Text>
          </Row>
        ))}
      </Card>

      <Btn label="Refresh" icon="🔄" color={C.blue} onPress={onRefresh} />
      <Btn label="Logout" icon="🚪" color={C.red} onPress={() => {
        Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
          { text: "Cancel", style: "cancel" },
          { text: "Logout", style: "destructive", onPress: onLogout }
        ]);
      }} />
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]   = useState("loading"); // loading | login | register | dashboard
  const [token, setToken]     = useState(null);
  const [user, setUser]       = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [[, savedToken], [, savedUser]] = await AsyncStorage.multiGet(["saas_token", "saas_user"]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setScreen("dashboard");
          // Refresh in background
          try {
            const fresh = await apiGet("/auth/me", savedToken);
            setUser(fresh.user);
            await AsyncStorage.setItem("saas_user", JSON.stringify(fresh.user));
          } catch {}
        } else {
          setScreen("login");
        }
      } catch {
        setScreen("login");
      }
    })();
  }, []);

  function handleLogin(t, u) {
    setToken(t);
    setUser(u);
    setScreen("dashboard");
  }

  async function handleLogout() {
    await AsyncStorage.multiRemove(["saas_token", "saas_user"]);
    setToken(null);
    setUser(null);
    setScreen("login");
  }

  if (screen === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 40, marginBottom: 20 }}>👑</Text>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: C.muted, marginTop: 16, fontSize: 13 }}>Option King AI loading...</Text>
      </View>
    );
  }

  if (screen === "register") {
    return <RegisterScreen onLogin={handleLogin} onBack={() => setScreen("login")} />;
  }

  if (screen === "login") {
    return <LoginScreen onLogin={handleLogin} onRegister={() => setScreen("register")} />;
  }

  return <DashboardScreen token={token} user={user} onLogout={handleLogout} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  input: {
    backgroundColor: C.s2,
    borderColor: C.border2,
    borderWidth: 1,
    borderRadius: 12,
    color: C.text,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
  },
});
