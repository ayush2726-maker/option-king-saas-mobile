import React, { useState, useEffect, useRef } from "react";
import * as Updates from "expo-updates";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, StatusBar, Alert,
  Platform, KeyboardAvoidingView, RefreshControl,
  BackHandler, Linking
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
const AiDecisionCard = require("./src/components/AiDecisionCard");
const StrategyBuilderTab = require("./src/screens/StrategyBuilderTab");
const UpstoxSetupGuide = require("./src/components/UpstoxSetupGuide");
const RecoveryScreen = require("./src/screens/RecoveryScreen").default;
const LocalGatewayScreen = require("./src/screens/LocalGatewayScreen").default;


// ── Global crash catcher (temporary debug tool) ──────────────
if (typeof ErrorUtils !== "undefined" && ErrorUtils.setGlobalHandler) {
  const __defaultHandler = ErrorUtils.getGlobalHandler ? ErrorUtils.getGlobalHandler() : null;
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    try {
      Alert.alert(
        isFatal ? "Fatal Crash Caught" : "Error Caught",
        String(error && error.message ? error.message : error) +
          "\n\n" +
          String(error && error.stack ? error.stack : "").slice(0, 600)
      );
    } catch (e) {}
    if (__defaultHandler) __defaultHandler(error, isFatal);
  });
}

// ── Colors ──────────────────────────────────────────────


// ── Global Safe Fallbacks for OTA hotfix ─────────────────────
// These prevent dashboard crashes if older UI code references missing variables.
const lang = "en";
const setLang = () => {};
const paperCapital = "100000";
const setPaperCapital = () => {};
const capitalMsg = "";
const setCapitalMsg = () => {};
const savePaperCapital = async () => {};
const resetPaperCapital = async () => {};

// ── App Error Boundary ─────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.log("APP_RUNTIME_ERROR", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{
          flex: 1,
          backgroundColor: "#080812",
          padding: 18,
          justifyContent: "center"
        }}>
          <Text style={{
            color: "#ff5a36",
            fontSize: 22,
            fontWeight: "900",
            marginBottom: 12
          }}>
            App Error
          </Text>

          <Text style={{
            color: "#e9eef7",
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 16
          }}>
            Login ke baad dashboard me error aaya. Is error ka screenshot bhejo:
          </Text>

          <Text style={{
            color: "#ffb13b",
            fontSize: 12,
            lineHeight: 18,
            backgroundColor: "#1a1a2e",
            padding: 12,
            borderRadius: 10
          }}>
            {String(this.state.error?.message || this.state.error || "Unknown error")}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}


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
const REGISTRATION_POLICY_VERSION = "OKAI-RISK-2026-07-20-v1";

const REGISTRATION_RISK_POINTS = {
  hi: [
    "Options/derivatives me poora trading capital loss ho sakta hai.",
    "Koi guaranteed profit, return, accuracy ya loss recovery nahi hai.",
    "Backtest aur past performance future result ki guarantee nahi hain.",
    "Internet, market data, mobile, server, broker API ya exchange failure se order delay, reject, miss ya duplicate ho sakta hai.",
    "Live mode, broker account, capital, strategy settings aur risk limits ki zimmedari user ki rahegi.",
    "Subscription software access ke liye hai; guaranteed return ke liye nahi.",
  ],
  en: [
    "Options and derivatives can cause loss of the entire trading capital.",
    "There is no guaranteed profit, return, accuracy or loss recovery.",
    "Backtests and past performance do not guarantee future results.",
    "Internet, market-data, mobile, server, broker API or exchange failures may delay, reject, miss or duplicate orders.",
    "The user remains responsible for live mode, broker account, capital, strategy settings and risk limits.",
    "The subscription is for software access, not guaranteed returns.",
  ],
};

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
function PasswordInput({ value, onChangeText, placeholder, style }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ position: "relative" }}>
      <TextInput style={[st.input, style, { paddingRight: 54 }]} value={value}
        onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={C.muted} secureTextEntry={!visible} />
      <TouchableOpacity onPress={() => setVisible(!visible)}
        accessibilityLabel={visible ? "Hide password" : "Show password"}
        style={{ position: "absolute", right: 6, top: 3, width: 44, height: 43,
          alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 18 }}>{visible ? "🙈" : "👁️"}</Text>
      </TouchableOpacity>
    </View>
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
function LoginScreen({ onLogin, onRegister, onRecovery, lang, setLang }) {
  const hi = lang === "hi";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError(""); setLoading(true);
    try {
      const d = await apiPost("/auth/login", { email, password });
      if (d.token) { onLogin(d.token, d.user); }
      else setError(d.detail || (hi ? "Login fail ho gaya" : "Login failed"));
    } catch { setError(hi ? "Server se connect nahi ho paya" : "Could not connect to server"); }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <Row style={{ justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setLang && setLang("hi")}
            style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
              backgroundColor: hi ? C.greenLo : C.s2, borderWidth: 1,
              borderColor: hi ? C.green : C.border }}>
            <Text style={{ color: hi ? C.green : C.muted, fontSize: 11, fontWeight: "900" }}>हिंदी</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLang && setLang("en")}
            style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
              backgroundColor: !hi ? C.blueLo : C.s2, borderWidth: 1,
              borderColor: !hi ? C.blue : C.border }}>
            <Text style={{ color: !hi ? C.blue : C.muted, fontSize: 11, fontWeight: "900" }}>English</Text>
          </TouchableOpacity>
        </Row>
        <Text style={{ fontSize: 40, textAlign: "center",
          marginBottom: 4 }}>👑</Text>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: "900",
          textAlign: "center", marginBottom: 4 }}>Option King AI</Text>
        <Text style={{ color: C.muted, fontSize: 13, textAlign: "center",
          marginBottom: 32 }}>{hi ? "SaaS Trading Platform" : "SaaS Trading Platform"}</Text>
        <Card glow={C.accent}>
          <ErrorBox msg={error} />
          <Label text="Email" />
          <TextInput style={st.input} value={email}
            onChangeText={setEmail} placeholder={hi ? "aapka@email.com" : "your@email.com"}
            placeholderTextColor={C.muted} autoCapitalize="none"
            keyboardType="email-address" />
          <Label text={hi ? "Password" : "Password"} />
          <PasswordInput value={password} onChangeText={setPassword}
            placeholder="Password" />
          <Btn label={hi ? "Login Karo" : "Login"} icon="🔑" onPress={handleLogin}
            loading={loading} style={{ marginTop: 4 }} />
          <Row style={{ justifyContent: "center", gap: 22, marginTop: 16 }}>
            <TouchableOpacity onPress={() => onRecovery && onRecovery("loginId")}>
              <Text style={{ color: C.blue, fontSize: 12, fontWeight: "900" }}>Forgot Login ID</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onRecovery && onRecovery("password")}>
              <Text style={{ color: C.green, fontSize: 12, fontWeight: "900" }}>Forgot Password</Text>
            </TouchableOpacity>
          </Row>
        </Card>
        <TouchableOpacity onPress={onRegister}
          style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ color: C.accent, fontSize: 14 }}>
            {hi ? "Account nahi hai? Register Karo →" : "Don't have an account? Register →"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Register Screen ───────────────────────────────────────
function RegisterScreen({ onLogin, onBack, lang }) {
  const hi = lang === "hi";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [algoOrderAuthorized, setAlgoOrderAuthorized] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [emailOtpAvailable, setEmailOtpAvailable] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpMsg, setEmailOtpMsg] = useState("");

  useEffect(() => {
    fetch(SAAS_URL + "/auth/recovery-status")
      .then(r => r.json())
      .then(d => setEmailOtpAvailable(d?.email_otp_available === true))
      .catch(() => setEmailOtpAvailable(false));
  }, []);

  function changeRegistrationEmail(value) {
    setEmail(value);
    setEmailVerified(false);
    setEmailVerificationToken("");
    setEmailOtpSent(false);
    setEmailOtp("");
    setEmailOtpMsg("");
  }

  async function sendRegistrationEmailOtp() {
    setError(""); setEmailOtpMsg("");
    if (!String(email || "").includes("@")) {
      setError(hi ? "Valid email daalo" : "Enter a valid email");
      return;
    }
    setEmailOtpLoading(true);
    try {
      const d = await apiPost("/auth/request-email-verification", { email });
      if (d.success) {
        setEmailOtpSent(true);
        setEmailOtpMsg(hi ? "OTP email par bhej diya gaya" : "OTP sent to your email");
      } else setError(d.detail || "Email OTP send nahi hua");
    } catch { setError("Email OTP send nahi hua"); }
    setEmailOtpLoading(false);
  }

  async function verifyRegistrationEmailOtp() {
    setError(""); setEmailOtpMsg("");
    if (String(emailOtp).replace(/\D/g, "").length !== 6) {
      setError(hi ? "6-digit OTP daalo" : "Enter the 6-digit OTP");
      return;
    }
    setEmailOtpLoading(true);
    try {
      const d = await apiPost("/auth/verify-email-verification", { email, otp: emailOtp });
      if (d.email_verification_token) {
        setEmailVerified(true);
        setEmailVerificationToken(d.email_verification_token);
        setEmailOtpMsg(hi ? "Email verify ho gaya" : "Email verified successfully");
      } else setError(d.detail || "Email verify nahi hua");
    } catch { setError("Email verify nahi hua"); }
    setEmailOtpLoading(false);
  }

  function ConsentRow({ checked, onPress, text }) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}
        style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 11 }}>
        <View style={{ width: 22, height: 22, borderRadius: 5, marginRight: 10,
          borderWidth: 1.5, borderColor: checked ? C.green : C.border2,
          backgroundColor: checked ? C.green : C.s1,
          alignItems: "center", justifyContent: "center" }}>
          {checked && <Text style={{ color: C.bg, fontSize: 14, fontWeight: "900" }}>✓</Text>}
        </View>
        <Text style={{ flex: 1, color: checked ? C.text : C.sub,
          fontSize: 12, lineHeight: 18 }}>{text}</Text>
      </TouchableOpacity>
    );
  }

  async function handleRegister() {
    setError("");
    if (password !== confirm) { setError(hi ? "Passwords match nahi karte" : "Passwords do not match"); return; }
    if (password.length < 6) { setError(hi ? "Password kam se kam 6 characters" : "Password must be at least 6 characters"); return; }
    const phoneDigits = String(phone || "").replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError(hi ? "Valid WhatsApp number daalo" : "Enter a valid WhatsApp number");
      return;
    }
    const allAccepted = ageConfirmed && riskAcknowledged && algoOrderAuthorized
      && termsAccepted && privacyAccepted && whatsappOptIn;
    if (!allAccepted) {
      setError(hi
        ? "Registration ke liye sabhi mandatory acknowledgements accept karo"
        : "Accept all mandatory acknowledgements to register");
      return;
    }
    if (emailOtpAvailable && (!emailVerified || !emailVerificationToken)) {
      setError(hi ? "Register karne se pehle email OTP verify karo" : "Verify the email OTP before registration");
      return;
    }
    setLoading(true);
    try {
      const d = await apiPost("/auth/register", {
        name,
        email,
        email_verification_token: emailVerificationToken || undefined,
        phone,
        password,
        policy_version: REGISTRATION_POLICY_VERSION,
        age_confirmed: ageConfirmed,
        risk_acknowledged: riskAcknowledged,
        algo_order_authorized: algoOrderAuthorized,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        whatsapp_trade_alert_opt_in: whatsappOptIn,
      });
      if (d.token) { onLogin(d.token, d.user); }
      else setError(d.detail || (hi ? "Registration fail ho gaya" : "Registration failed"));
    } catch { setError(hi ? "Server se connect nahi ho paya" : "Could not connect to server"); }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
          <Text style={{ color: C.accent, fontSize: 14 }}>{hi ? "← Wapas Login" : "← Back to Login"}</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900",
          marginBottom: 20 }}>👑 {hi ? "Register Karo" : "Register"}</Text>
        <Card glow={C.green}>
          <ErrorBox msg={error} />
          <Label text={hi ? "Naam *" : "Name *"} />
          <TextInput style={st.input} value={name} onChangeText={setName}
            placeholder={hi ? "Aapka poora naam" : "Your full name"} placeholderTextColor={C.muted} />
          <Label text="Email *" />
          <TextInput style={st.input} value={email} onChangeText={changeRegistrationEmail}
            placeholder={hi ? "aapki@email.com" : "your@email.com"} placeholderTextColor={C.muted}
            autoCapitalize="none" keyboardType="email-address" />
          {emailOtpAvailable ? (
            <View style={{ backgroundColor: C.s1, borderRadius: 10, padding: 11,
              borderWidth: 1, borderColor: emailVerified ? C.green+"66" : C.blue+"55",
              marginBottom: 12 }}>
              <Text style={{ color: emailVerified ? C.green : C.blue,
                fontSize: 12, fontWeight: "900", marginBottom: 8 }}>
                {emailVerified ? "✅ Email Verified" : "✉️ Email OTP Verification"}
              </Text>
              {!!emailOtpMsg && <Text style={{ color: emailVerified ? C.green : C.sub,
                fontSize: 11, marginBottom: 8 }}>{emailOtpMsg}</Text>}
              {!emailVerified && <>
                <Btn label={emailOtpSent ? "Resend Email OTP" : "Send Email OTP"}
                  color={C.blue} onPress={sendRegistrationEmailOtp} loading={emailOtpLoading} />
                {emailOtpSent && <View style={{ marginTop: 10 }}>
                  <TextInput style={st.input} value={emailOtp} onChangeText={setEmailOtp}
                    placeholder="6-digit Email OTP" placeholderTextColor={C.muted}
                    keyboardType="number-pad" maxLength={6} />
                  <Btn label="Verify Email" color={C.green}
                    onPress={verifyRegistrationEmailOtp} loading={emailOtpLoading} />
                </View>}
              </>}
            </View>
          ) : (
            <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginBottom: 10 }}>
              Email OTP service setup ho rahi hai; mobile verification abhi required nahi hai.
            </Text>
          )}
          <Label text={hi ? "WhatsApp Number *" : "WhatsApp Number *"} />
          <TextInput style={st.input} value={phone} onChangeText={setPhone}
            placeholder={hi ? "10 digit mobile number" : "10-digit mobile number"}
            placeholderTextColor={C.muted} keyboardType="phone-pad" />
          <Label text={hi ? "New Password *" : "New Password *"} />
          <PasswordInput value={password} onChangeText={setPassword}
            placeholder={hi ? "Kam se kam 6 characters" : "At least 6 characters"} />
          <Label text={hi ? "New Password Confirm *" : "Confirm New Password *"} />
          <PasswordInput value={confirm} onChangeText={setConfirm}
            placeholder={hi ? "Password dobara daalo" : "Re-enter password"}
            style={{ marginBottom: 20 }} />
          <View style={{ backgroundColor: C.s1, borderRadius: 12, padding: 13,
            marginBottom: 16, borderWidth: 1, borderColor: C.gold + "55" }}>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: C.gold, fontSize: 14, fontWeight: "900" }}>
                  ⚠️ {hi ? "Risk & Rules Acknowledgement" : "Risk & Rules Acknowledgement"}
                </Text>
                <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>
                  {hi
                    ? "Register karne se pehle har point padhkar alag se agree karna mandatory hai."
                    : "Read each point and accept it separately before registration."}
                </Text>
              </View>
              <Tag label="MANDATORY" color={C.gold} />
            </Row>

            <TouchableOpacity onPress={() => setShowFullTerms(!showFullTerms)}
              style={{ paddingVertical: 10 }}>
              <Text style={{ color: C.blue, fontSize: 12, fontWeight: "800" }}>
                {showFullTerms
                  ? (hi ? "▲ Detailed risk points band karo" : "▲ Hide detailed risk points")
                  : (hi ? "▼ Detailed risk points padho" : "▼ Read detailed risk points")}
              </Text>
            </TouchableOpacity>

            {showFullTerms && (
              <View style={{ backgroundColor: C.s2, borderRadius: 9, padding: 10,
                borderWidth: 1, borderColor: C.border }}>
                {REGISTRATION_RISK_POINTS[hi ? "hi" : "en"].map((point, index) => (
                  <Text key={String(index)} style={{ color: C.sub, fontSize: 11,
                    lineHeight: 17, marginBottom: index === 5 ? 0 : 6 }}>
                    {index + 1}. {point}
                  </Text>
                ))}
                <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 9 }}>
                  {hi
                    ? "Ye acknowledgement user ke statutory rights ko khatam nahi karta aur SEBI/exchange/broker compliance ka replacement nahi hai."
                    : "This acknowledgement does not remove statutory rights and does not replace SEBI, exchange or broker compliance."}
                </Text>
              </View>
            )}

            <ConsentRow checked={ageConfirmed} onPress={() => setAgeConfirmed(!ageConfirmed)}
              text={hi
                ? "Main confirm karta/karti hoon ki meri age 18 saal ya usse zyada hai."
                : "I confirm that I am at least 18 years old."} />
            <ConsentRow checked={riskAcknowledged}
              onPress={() => setRiskAcknowledged(!riskAcknowledged)}
              text={hi
                ? "Main options trading ka high risk, poore capital ke loss ka risk, aur no-profit-guarantee rule samajhta/samajhti hoon."
                : "I understand the high risk, possible loss of all trading capital, and that no profit or return is guaranteed."} />
            <ConsentRow checked={algoOrderAuthorized}
              onPress={() => setAlgoOrderAuthorized(!algoOrderAuthorized)}
              text={hi
                ? "Main required broker/exchange/legal approvals ke baad automated orders request karta/karti hoon; live mode, capital aur settings ki zimmedari meri hai."
                : "I request automated orders only after required broker/exchange/legal approvals; I remain responsible for live mode, capital and settings."} />
            <ConsentRow checked={termsAccepted}
              onPress={() => setTermsAccepted(!termsAccepted)}
              text={hi
                ? "Maine Terms of Use aur Risk Disclosure padhkar accept kiya hai."
                : "I have read and accept the Terms of Use and Risk Disclosure."} />
            <ConsentRow checked={privacyAccepted}
              onPress={() => setPrivacyAccepted(!privacyAccepted)}
              text={hi
                ? "Maine Privacy Notice padhkar service aur audit ke liye zaroori data processing accept ki hai."
                : "I have read the Privacy Notice and accept necessary data processing for service and audit."} />
            <ConsentRow checked={whatsappOptIn}
              onPress={() => setWhatsappOptIn(!whatsappOptIn)}
              text={hi
                ? "Mujhe diye gaye WhatsApp number par sirf mere executed PAPER/LIVE trade alerts aur essential account messages bheje ja sakte hain."
                : "I agree to receive only my executed PAPER/LIVE trade alerts and essential account messages on WhatsApp."} />

            <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 12 }}>
              Policy: {REGISTRATION_POLICY_VERSION}
            </Text>
          </View>

          <Btn label={hi ? "Register Karo" : "Register"} icon="🚀" color={C.green}
            onPress={handleRegister} loading={loading} />
        </Card>
        <Card style={{ marginTop: 12 }}>
          <Row>
            <Text style={{ fontSize: 20 }}>🎁</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: C.text, fontSize: 14,
                fontWeight: "900" }}>{hi ? "7 Din Free Trial" : "7-Day Free Trial"}</Text>
              <Text style={{ color: C.muted, fontSize: 12,
                marginTop: 3 }}>{hi
                ? "Register karo aur 7 din tak bilkul free use karo — koi credit card nahi"
                : "Register and use it completely free for 7 days — no credit card needed"}</Text>
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
function BrokerTab({ token, lang }) {
  const hi = lang === "hi";
  const [broker, setBroker] = useState("angelone");
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [mpin, setMpin] = useState("");
  const [totpKey, setTotpKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const brokerList = ["angelone", "zerodha", "upstox"];
  const brokerFields = {
    angelone: [
      { key: "clientId", label: "Client ID", state: clientId,
        set: setClientId, placeholder: hi ? "Aapka Angel One Client ID" : "Your Angel One Client ID" },
      { key: "apiKey", label: "API Key", state: apiKey,
        set: setApiKey, placeholder: "Angel One API Key" },
      { key: "apiSecret", label: "API Secret", state: apiSecret,
        set: setApiSecret, placeholder: "API Secret Key" },
      { key: "mpin", label: "MPIN", state: mpin,
        set: setMpin, placeholder: hi ? "4-digit MPIN" : "4-digit MPIN", secure: true },
      { key: "totpKey", label: "TOTP Key", state: totpKey,
        set: setTotpKey, placeholder: hi ? "TOTP Secret (Authenticator se)" : "TOTP Secret (from Authenticator)" },
    ],
    zerodha: [
      { key: "clientId", label: hi ? "Client ID (Zerodha)" : "Client ID (Zerodha)", state: clientId,
        set: setClientId, placeholder: "ZZ0000" },
      { key: "apiKey", label: "API Key", state: apiKey,
        set: setApiKey, placeholder: "Kite API Key" },
      { key: "apiSecret", label: hi ? "API Secret (Access Token)" : "API Secret (Access Token)", state: apiSecret,
        set: setApiSecret, placeholder: "Kite Access Token" },
      { key: "totpKey", label: "TOTP Key", state: totpKey,
        set: setTotpKey, placeholder: "TOTP Secret" },
    ],
    upstox: [
      { key: "clientId", label: "API Key (Client ID)", state: clientId,
        set: setClientId, placeholder: "Upstox Developer Apps ka API Key" },
      { key: "apiKey", label: "API Secret", state: apiKey,
        set: setApiKey, placeholder: "Upstox Developer Apps ka API Secret", secure: true },
      { key: "apiSecret", label: "Daily Access Token", state: apiSecret,
        set: setApiSecret, placeholder: "Generate kiya hua standard Access Token", secure: true },
    ],
  };

  async function testBroker() {
    setTestResult(null);
    setTesting(true);
    try {
      const d = await apiGet(`/broker/test/${broker}`, token);
      setTestResult(d);
    } catch (e) {
      setTestResult({ success: false, message: hi ? "Broker settings endpoint missing" : "Broker settings endpoint missing" });
    }
    setTesting(false);
  }

  async function saveBroker() {
    setError(""); setSuccess(""); setLoading(true);
    try {
      const d = await apiPostAuth("/broker/connect", {
        broker_name: broker,
        client_id: broker === "upstox"
          ? clientId.trim()
          : clientId.trim().toUpperCase(),
        api_key: apiKey.trim(),
        api_secret: broker === "angelone" ? (apiSecret.trim() || mpin.trim()) : apiSecret.trim(),
        totp_secret: broker === "angelone" ? totpKey.trim() : ""
      }, token);
      if (d.success || d.message) {
        setSuccess(hi ? "✅ Broker credentials save ho gaye!" : "✅ Broker credentials saved!");
      } else setError(d.detail || (hi ? "Save nahi ho paya" : "Save failed"));
    } catch { setError(hi ? "Server error" : "Server error"); }
    setLoading(false);
  }

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "900",
          marginBottom: 16 }}>🔗 {hi ? "Broker Connect Karo" : "Connect Broker"}</Text>

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

        {broker === "upstox" && (
          <UpstoxSetupGuide compact />
        )}

        <Btn label={hi ? "Credentials Save Karo" : "Save Credentials"} icon="💾"
          color={C.blue} onPress={saveBroker} loading={loading}
          style={{ marginTop: 8 }} />

        <Btn label={hi ? "Test Broker Connection" : "Test Broker Connection"} icon="🧪"
          color={C.gold} onPress={testBroker} loading={testing}
          style={{ marginTop: 10 }} />

        {testResult && (
          <View style={{ backgroundColor: testResult.success ? C.greenLo : C.redLo,
            borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1,
            borderColor: (testResult.success ? C.green : C.red) + "44" }}>
            <Text style={{ color: testResult.success ? C.green : C.red,
              fontSize: 13, fontWeight: "800" }}>
              {testResult.success
                ? (hi ? `✅ ${broker} connected. Status: ${testResult.status || "connected"}` : `✅ ${broker} connected. Status: ${testResult.status || "connected"}`)
                : (broker === "zerodha" && testResult.status === "auth_failed"
                    ? (hi ? "Zerodha token missing ya expire ho gaya hai. Naya access token generate karein." : "Zerodha token missing or expired. Please generate a new access token.")
                    : `❌ ${testResult.message || (hi ? "Connection test fail ho gaya" : "Connection test failed")}`)}
            </Text>
          </View>
        )}
      </Card>

      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 12 }}>🔒 Security</Text>
        {(hi ? [
          ["🔐", "AES-256 Encryption", "Credentials encrypted store hote hain"],
          ["🔑", "JWT Auth", "Har request authenticated hai"],
          ["🚫", "No Plain Text", "Kabhi plain text save nahi hota"],
        ] : [
          ["🔐", "AES-256 Encryption", "Credentials are stored encrypted"],
          ["🔑", "JWT Auth", "Every request is authenticated"],
          ["🚫", "No Plain Text", "Plain text is never saved"],
        ]).map(([icon, title, desc]) => (
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

// ── Markets / Instruments Tab ────────────────────────────────────────
function MarketsTab({ token, lang }) {
  const hi = lang === "hi";
  const [settings, setSettings] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSettings() {
    setLoading(true);
    try {
      const d = await apiGet("/strategy/settings", token);
      setSettings(d.settings || {});
    } catch {
      setMsg(hi ? "Settings load failed" : "Settings load failed");
    }
    setLoading(false);
  }

  useEffect(() => { loadSettings(); }, []);

  function toggleInstrument(ins) {
    setSettings(prev => {
      const old = prev?.enabled_instruments || ["NIFTY"];
      const enabled = old.includes(ins);
      let next = enabled ? old.filter(x => x !== ins) : [...old, ins];

      if (next.length === 0) next = ["NIFTY"];

      return {
        ...(prev || {}),
        enabled_instruments: next,
        primary_instrument: next.includes(prev?.primary_instrument) ? prev?.primary_instrument : next[0],
      };
    });
  }

  function setPrimary(ins) {
    setSettings(prev => {
      const old = prev?.enabled_instruments || ["NIFTY"];
      const next = old.includes(ins) ? old : [...old, ins];

      return {
        ...(prev || {}),
        enabled_instruments: next,
        primary_instrument: ins,
      };
    });
  }

  async function saveMarkets() {
    if (!settings) return;
    setMsg("");
    setLoading(true);
    try {
      const d = await apiPostAuth("/strategy/settings", {
        ...settings,
        enabled_instruments: settings.enabled_instruments || ["NIFTY"],
        primary_instrument: settings.primary_instrument || "NIFTY",
      }, token);

      setSettings(d.settings || settings);
      setMsg("✅ " + (hi ? "Markets save ho gaye" : "Markets saved"));
    } catch {
      setMsg(hi ? "Markets save failed" : "Markets save failed");
    }
    setLoading(false);
  }

  if (!settings) {
    return (
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Card glow={C.blue}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>
            {loading ? "Loading..." : "Markets"}
          </Text>
        </Card>
      </ScrollView>
    );
  }

  const enabled = settings.enabled_instruments || ["NIFTY"];
  const primary = settings.primary_instrument || enabled[0] || "NIFTY";

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginBottom: 6 }}>
          📈 {hi ? "Markets / Instruments" : "Markets / Instruments"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          {hi
            ? "Bot, strategy aur backtest ke liye market select karo."
            : "Select markets for bot, strategy, and backtest."}
        </Text>

        {["NIFTY", "BANKNIFTY", "SENSEX"].map(ins => {
          const isOn = enabled.includes(ins);
          return (
            <TouchableOpacity key={ins}
              onPress={() => toggleInstrument(ins)}
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: isOn ? C.greenLo : C.s2,
                borderWidth: 1,
                borderColor: isOn ? C.green : C.border,
                marginBottom: 10
              }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Text style={{ color: isOn ? C.green : C.muted, fontWeight: "900", fontSize: 15 }}>
                  {isOn ? "✅" : "⬜"} {ins}
                </Text>
                <Text style={{ color: primary === ins ? C.gold : C.muted, fontWeight: "900", fontSize: 11 }}>
                  {primary === ins ? "PRIMARY" : ""}
                </Text>
              </Row>
            </TouchableOpacity>
          );
        })}

        <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800", marginBottom: 6 }}>
          {hi ? "Primary Instrument" : "Primary Instrument"}
        </Text>

        <Row style={{ gap: 8, marginBottom: 12 }}>
          {["NIFTY", "BANKNIFTY", "SENSEX"].map(ins => (
            <TouchableOpacity key={ins}
              onPress={() => setPrimary(ins)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor: primary === ins ? C.blueLo : C.s2,
                borderWidth: 1,
                borderColor: primary === ins ? C.blue : C.border,
                alignItems: "center"
              }}>
              <Text style={{
                color: primary === ins ? C.blue : C.muted,
                fontWeight: "900",
                fontSize: 10
              }}>
                {ins}
              </Text>
            </TouchableOpacity>
          ))}
        </Row>

        <Btn
          label={hi ? "Save Markets" : "Save Markets"}
          icon="💾"
          color={C.green}
          loading={loading}
          onPress={saveMarkets}
        />

        {!!msg && (
          <Text style={{
            color: msg.includes("✅") ? C.green : C.red,
            marginTop: 12,
            fontWeight: "900",
            fontSize: 12
          }}>
            {msg}
          </Text>
        )}
      </Card>

      <Card glow={C.gold}>
        <Text style={{ color: C.gold, fontSize: 14, fontWeight: "900", marginBottom: 6 }}>
          ⚠️ {hi ? "Live Trading Note" : "Live Trading Note"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 19 }}>
          {hi
            ? "Backtest aur paper mode me NIFTY, BANKNIFTY, SENSEX ready hai. Live orders ke liye broker symbol/token mapping bhi properly connected honi chahiye."
            : "NIFTY, BANKNIFTY, and SENSEX are ready for backtest and paper mode. Live orders also need proper broker symbol/token mapping."}
        </Text>
      </Card>
    </ScrollView>
  );
}



// ── Trade Tab ────────────────────────────────────────
function TradeTab({ token }) {
  const [signal, setSignal] = useState(null);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadTrade() {
    setLoading(true);
    setMsg("");
    try {
      const sig = await apiGet("/bot/signal", token);
      setSignal(sig || {});

      const hist = await apiGet("/history/paper", token);
      setHistory(hist.paper_trades || []);
    } catch {
      setMsg("Trade data load failed");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTrade();
    const t = setInterval(loadTrade, 15000);
    return () => clearInterval(t);
  }, []);

  const trade = signal?.active_trade || signal?.latest_trade || null;
  const isLiveMode = (signal?.trading_mode || "paper") === "live";

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={loadTrade} tintColor={C.blue} colors={[C.blue]} />}>

      <Card glow={trade?.status === "OPEN" ? C.green : C.blue}>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: C.text, fontSize: 20, fontWeight: "900" }}>
            🧾 {isLiveMode ? "Active Live Trade" : "Active Paper Trade"}
          </Text>
          <TouchableOpacity onPress={loadTrade}>
            <Text style={{ color: C.blue, fontWeight: "900" }}>
              {loading ? "Loading..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </Row>

        {!trade && (
          <Text style={{ color: C.muted, fontSize: 13 }}>
            Abhi koi active trade nahi hai. Score 82+ hone par real signal ke basis par trade create hogi.
          </Text>
        )}

        {trade && (
          <View>
            <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ color: C.muted }}>Symbol</Text>
              <Text style={{ color: C.text, fontWeight: "900" }}>{trade.symbol}</Text>
            </Row>

            <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ color: C.muted }}>Side / Qty</Text>
              <Text style={{ color: C.text, fontWeight: "900" }}>{trade.side} / {trade.qty}</Text>
            </Row>

            <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ color: C.muted }}>Entry</Text>
              <Text style={{ color: C.text, fontWeight: "900" }}>₹{trade.entry_price}</Text>
            </Row>

            <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ color: C.muted }}>Current</Text>
              <Text style={{ color: C.gold, fontWeight: "900" }}>
                {trade.current_price ? `₹${trade.current_price}` : "--"}
              </Text>
            </Row>

            <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ color: C.muted }}>SL</Text>
              <Text style={{ color: C.red, fontWeight: "900" }}>₹{trade.sl_price}</Text>
            </Row>

            <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ color: C.muted }}>Target</Text>
              <Text style={{ color: C.green, fontWeight: "900" }}>₹{trade.target_price}</Text>
            </Row>

            <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ color: C.muted }}>Exit</Text>
              <Text style={{ color: C.text, fontWeight: "900" }}>
                {trade.exit_price ? `₹${trade.exit_price}` : "--"}
              </Text>
            </Row>

            <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ color: C.muted }}>P&L</Text>
              <Text style={{
                color: Number(trade.unrealized_pnl || trade.pnl || 0) >= 0 ? C.green : C.red,
                fontWeight: "900"
              }}>
                ₹{trade.unrealized_pnl ?? trade.pnl ?? 0}
              </Text>
            </Row>

            <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ color: C.muted }}>Status</Text>
              <Text style={{
                color: trade.status === "OPEN" ? C.green : C.gold,
                fontWeight: "900"
              }}>
                {trade.status}
              </Text>
            </Row>

            <Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>
              {trade.reason || ""}
            </Text>
          </View>
        )}

        {!!msg && (
          <Text style={{ color: C.red, marginTop: 10, fontWeight: "900" }}>{msg}</Text>
        )}
      </Card>

      <Card>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
          📜 Trade History
        </Text>

        {history.length === 0 && (
          <Text style={{ color: C.muted }}>Abhi trade history nahi hai.</Text>
        )}

        {history.slice(0, 20).map((t, i) => (
          <View key={i} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Text style={{ color: C.text, fontWeight: "900" }}>{t.symbol}</Text>
              <Text style={{ color: t.status === "OPEN" ? C.green : C.gold, fontWeight: "900" }}>{t.status}</Text>
            </Row>

            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
              {t.side} • Qty {t.qty} • Entry ₹{t.entry_price} • Exit {t.exit_price ? `₹${t.exit_price}` : "--"}
            </Text>

            <Text style={{
              color: Number(t.pnl || 0) >= 0 ? C.green : C.red,
              fontWeight: "900",
              marginTop: 4
            }}>
              P&L ₹{t.pnl || 0} • {t.reason || ""}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}


function HeroZeroTab({ token }) {
  const [signal, setSignal] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [marketOpen, setMarketOpen] = useState(true);

  function checkMarketWindow() {
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const istMinutes = (utcMinutes + 5 * 60 + 30) % (24 * 60);
    const day = new Date(now.getTime() + (5 * 60 + 30) * 60000).getUTCDay();
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = istMinutes >= (9 * 60 + 15) && istMinutes <= (15 * 60 + 30);
    return isWeekday && isMarketHours;
  }

  async function loadTrade() {
    setLoading(true);
    try {
      const sig = await apiGet("/bot/signal", token);
      setSignal(sig || {});
    } catch {}
    setMarketOpen(checkMarketWindow());
    setLoading(false);
  }

  useEffect(() => {
    loadTrade();
    const t = setInterval(loadTrade, 15000);
    return () => clearInterval(t);
  }, []);

  async function startHeroZero(side) {
    setLoading(true);
    setMsg("");
    try {
      const d = await apiPostAuth("/bot/hero-zero/start", { side }, token);
      setMsg(d?.message || `Hero Zero ${side} started`);
      await loadTrade();
    } catch (e) {
      setMsg("Hero Zero start failed");
    }
    setLoading(false);
  }

  async function forceCloseHeroZero() {
    setLoading(true);
    setMsg("");
    try {
      const d = await apiPostAuth("/bot/hero-zero/force-close", {}, token);
      setMsg(d?.message || "Hero Zero closed");
      await loadTrade();
    } catch (e) {
      setMsg("Hero Zero close failed");
    }
    setLoading(false);
  }

  const trade = signal?.active_trade || null;

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={loadTrade} tintColor={C.red} colors={[C.red]} />}>

      <Card glow={C.red}>
        <Text style={{ color: C.red, fontSize: 18, fontWeight: "900", marginBottom: 8 }}>
          🚀 Expiry Hero Zero
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>
          High risk paper mode. Real broker orders OFF. Real option premium tracking.
        </Text>
      </Card>

      {!marketOpen && (
        <Card glow={C.gold}>
          <Text style={{ color: C.gold, fontWeight: "900", fontSize: 13 }}>
            ⚠️ Market closed. Hero Zero available only during market hours (Mon-Fri 09:15-15:30 IST).
          </Text>
        </Card>
      )}

      <Card>
        <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <TouchableOpacity
            disabled={!marketOpen || loading}
            onPress={() => startHeroZero("CE")}
            style={{
              flex: 1,
              marginRight: 6,
              backgroundColor: marketOpen ? C.green : C.muted,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              opacity: marketOpen ? 1 : 0.5,
            }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>Hero Zero CE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!marketOpen || loading}
            onPress={() => startHeroZero("PE")}
            style={{
              flex: 1,
              marginLeft: 6,
              backgroundColor: marketOpen ? C.red : C.muted,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              opacity: marketOpen ? 1 : 0.5,
            }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>Hero Zero PE</Text>
          </TouchableOpacity>
        </Row>

        <TouchableOpacity
          onPress={forceCloseHeroZero}
          style={{
            backgroundColor: C.s2,
            borderWidth: 1,
            borderColor: C.border,
            paddingVertical: 11,
            borderRadius: 12,
            alignItems: "center"
          }}>
          <Text style={{ color: C.gold, fontWeight: "900" }}>Force Close Open Trade</Text>
        </TouchableOpacity>

        {!!msg && (
          <Text style={{ color: C.red, marginTop: 10, fontWeight: "900" }}>{msg}</Text>
        )}
      </Card>

      {trade && (
        <Card glow={trade.status === "OPEN" ? C.green : C.blue}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 10 }}>
            Active Hero Zero Trade
          </Text>
          {[
            ["Symbol", trade.symbol],
            ["Side / Qty", `${trade.side} / ${trade.qty}`],
            ["Entry", `₹${trade.entry_price}`],
            ["SL", `₹${trade.sl_price}`],
            ["Target", `₹${trade.target_price}`],
            ["Status", trade.status],
          ].map(([l, v]) => (
            <Row key={l} style={{ justifyContent: "space-between", paddingVertical: 6,
              borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>{l}</Text>
              <Text style={{ color: C.text, fontWeight: "900", fontSize: 12 }}>{v}</Text>
            </Row>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function LiveFeedTab({ token }) {
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const m = await apiGet("/market/status", token);
      setMarket(m);
      setLastUpdate(new Date());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={load} tintColor={C.green} colors={[C.green]} />}>

      <Card glow={market?.feed_connected ? C.green : C.red}>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>Live Feed Status</Text>
          <Tag label={market?.feed_connected ? "CONNECTED" : "NOT CONNECTED"}
            color={market?.feed_connected ? C.green : C.red} />
        </Row>
        <Text style={{ color: C.muted, fontSize: 12 }}>
          {market?.message || "Checking..."}
        </Text>
        {lastUpdate && (
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>
            Last checked: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
      </Card>

      <Card>
        {(market?.indices || [
          { symbol: "NIFTY", ltp: null },
          { symbol: "BANKNIFTY", ltp: null },
          { symbol: "SENSEX", ltp: null },
        ]).map(idx => (
          <Row key={idx.symbol} style={{ justifyContent: "space-between",
            paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.text, fontSize: 14, fontWeight: "800" }}>{idx.symbol}</Text>
            <Text style={{ color: idx.ltp != null ? C.text : C.muted, fontSize: 13, fontWeight: "800" }}>
              {idx.ltp != null ? idx.ltp : "Live feed not connected"}
            </Text>
          </Row>
        ))}
      </Card>

      <Btn label="Test Live Price / Reconnect" icon="🔄" color={C.blue} loading={loading} onPress={load} />
    </ScrollView>
  );
}

function ServerTestTab({ token }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runTest() {
    setLoading(true);
    const start = Date.now();
    try {
      const r = await apiGet("/market/status", token);
      const ms = Date.now() - start;
      setResult({ ok: true, ms, detail: r?.message || "Server responded" });
    } catch (e) {
      const ms = Date.now() - start;
      setResult({ ok: false, ms, detail: "Server unreachable" });
    }
    setLoading(false);
  }

  useEffect(() => { runTest(); }, []);

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={runTest} tintColor={C.orange} colors={[C.orange]} />}>

      <Card glow={result?.ok ? C.green : C.red}>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
          Server Connection Test
        </Text>
        {result ? (
          <>
            <Row style={{ justifyContent: "space-between", paddingVertical: 6 }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>Status</Text>
              <Text style={{ color: result.ok ? C.green : C.red, fontWeight: "900" }}>
                {result.ok ? "REACHABLE" : "UNREACHABLE"}
              </Text>
            </Row>
            <Row style={{ justifyContent: "space-between", paddingVertical: 6 }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>Response time</Text>
              <Text style={{ color: C.text, fontWeight: "900" }}>{result.ms} ms</Text>
            </Row>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>{result.detail}</Text>
          </>
        ) : (
          <Text style={{ color: C.muted }}>Testing...</Text>
        )}
      </Card>

      <Btn label="Run Test Again" icon="🔄" color={C.blue} loading={loading} onPress={runTest} />
    </ScrollView>
  );
}


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
function AdminTab({ token, user, lang }) {
  const hi = lang === "hi";
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
          textAlign: "center" }}>{hi ? "Admin access chahiye" : "Admin access required"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={() => load(true)} tintColor={C.purple} />}>


      <Card glow={C.green}>
        <Text style={{ color: C.text, fontSize: 18,
          fontWeight: "900", marginBottom: 6 }}>💰 {hi ? "Paper Capital" : "Paper Capital"}</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          {hi ? "Paper mode aur Backtest dono ke liye capital update karo." : "Update capital for both Paper mode and Backtest."}
        </Text>

        <Text style={{ color: C.muted, fontSize: 11,
          fontWeight: "800", marginBottom: 5 }}>{hi ? "Paper Capital" : "Paper Capital"}</Text>
        <TextInput style={[st.input, { marginBottom: 12 }]}
          value={"100000"}
          onChangeText={(v) => {
            setPaperCapital(v);
            setCapital(v);
          }}
          keyboardType="numeric"
          placeholder="100000"
          placeholderTextColor={C.muted} />

        <Row style={{ gap: 10 }}>
          <Btn label={hi ? "Update Karo" : "Update"} icon="💾" color={C.green}
            loading={loading}
            onPress={savePaperCapital}
            style={{ flex: 1 }} />
          <Btn label={hi ? "P&L Reset Karo" : "Reset P&L"} icon="♻️" color={C.gold}
            onPress={resetPaperCapital}
            style={{ flex: 1 }} />
        </Row>

        {!!capitalMsg && (
          <Text style={{ color: capitalMsg.includes("✅") ? C.green : C.red,
            marginTop: 10, fontWeight: "900", fontSize: 12 }}>
            {capitalMsg}
          </Text>
        )}
      </Card>

      <Card glow={C.purple}>
        <Text style={{ color: C.purple, fontSize: 16,
          fontWeight: "900", marginBottom: 4 }}>👑 {hi ? "Admin Dashboard" : "Admin Dashboard"}</Text>
        <Text style={{ color: C.muted, fontSize: 12 }}>
          {hi ? "Refresh ke liye niche kheenchein" : "Pull to refresh"}
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
            ["👥", hi ? "Total Users" : "Total Users", stats.total_users, C.blue],
            ["✅", hi ? "Active Subs" : "Active Subs", stats.active_subscriptions, C.green],
            ["🆓", hi ? "Trial Users" : "Trial Users", stats.trial_users, C.gold],
            ["💰", hi ? "Revenue" : "Revenue", "₹" + (stats.total_revenue || 0), C.green],
            ["🤖", hi ? "Bot Chal Raha Hai" : "Bot Running", stats.bot_active ? (hi ? "HAAN" : "YES") : (hi ? "NAHI" : "NO"),
              stats.bot_active ? C.green : C.red],
            ["📈", hi ? "Aaj Ke Trades" : "Trades Today", stats.trades_today || 0, C.accent],
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
          marginBottom: 14 }}>{hi ? "Recent Users" : "Recent Users"}</Text>
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
            textAlign: "center", padding: 16 }}>{hi ? "Koi user nahi mila" : "No users found"}</Text>
        )}
      </Card>

      {/* Bot Control */}
      <Card glow={C.orange}>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 12 }}>⚙️ {hi ? "Bot Control" : "Bot Control"}</Text>
        <Row style={{ gap: 10 }}>
          <Btn label={hi ? "Bot Start" : "Start Bot"} icon="▶️" color={C.green}
            onPress={async () => {
              await apiPostAuth("/bot/start", {}, token);
              load(false);
            }} style={{ flex: 1 }} />
          <Btn label={hi ? "Bot Stop" : "Stop Bot"} icon="⏹️" color={C.red}
            onPress={async () => {
              await apiPostAuth("/bot/stop", {}, token);
              load(false);
            }} style={{ flex: 1 }} />
        </Row>
      </Card>
    </ScrollView>
  );
}


// ── Telegram Tab ────────────────────────────────────────
function TelegramTab({ token }) {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const d = await apiGet("/telegram/settings", token);
      const stg = d.settings || {};
      setBotToken(stg.bot_token || "");
      setChatId(stg.chat_id || "");
      setEnabled(!!stg.enabled);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setMsg("");
    setLoading(true);
    try {
      const d = await apiPostAuth("/telegram/settings", {
        enabled,
        bot_token: botToken.trim(),
        chat_id: chatId.trim(),
        send_bot_alerts: true,
        send_trade_alerts: true,
        send_backtest_alerts: true
      }, token);

      setMsg(d.message || "Telegram saved");
    } catch {
      setMsg("Telegram save failed");
    }
    setLoading(false);
  }

  async function test() {
    setMsg("");
    setLoading(true);
    try {
      const d = await apiPostAuth("/telegram/test", {}, token);
      setMsg(d.success ? "✅ Test message sent" : (d.message || "Test failed"));
    } catch {
      setMsg("Telegram test failed");
    }
    setLoading(false);
  }

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 18,
          fontWeight: "900", marginBottom: 6 }}>📲 Telegram Updates</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          Bot start/stop, signal, strategy save aur backtest result Telegram par bhejo.
        </Text>

        <TouchableOpacity
          onPress={() => setEnabled(!enabled)}
          style={{ padding: 12, borderRadius: 12,
            backgroundColor: enabled ? C.greenLo : C.redLo,
            borderWidth: 1,
            borderColor: enabled ? C.green : C.red,
            marginBottom: 12 }}>
          <Text style={{ color: enabled ? C.green : C.red,
            fontWeight: "900", textAlign: "center" }}>
            {enabled ? "✅ Telegram Enabled" : "❌ Telegram Disabled"}
          </Text>
        </TouchableOpacity>

        <Text style={{ color: C.muted, fontSize: 11,
          fontWeight: "800", marginBottom: 5 }}>Bot Token</Text>
        <TextInput style={[st.input, { marginBottom: 10 }]}
          value={botToken}
          onChangeText={setBotToken}
          placeholder="123456:ABC..."
          placeholderTextColor={C.muted}
          secureTextEntry />

        <Text style={{ color: C.muted, fontSize: 11,
          fontWeight: "800", marginBottom: 5 }}>Chat ID</Text>
        <TextInput style={[st.input, { marginBottom: 12 }]}
          value={chatId}
          onChangeText={setChatId}
          placeholder="Telegram chat id"
          placeholderTextColor={C.muted}
          keyboardType="numeric" />

        <Row style={{ gap: 10 }}>
          <Btn label="Save" icon="💾" color={C.green}
            loading={loading}
            onPress={save}
            style={{ flex: 1 }} />
          <Btn label="Test" icon="📨" color={C.gold}
            onPress={test}
            style={{ flex: 1 }} />
        </Row>

        {!!msg && (
          <Text style={{ color: msg.includes("✅") ? C.green : C.gold,
            marginTop: 12, fontWeight: "800", fontSize: 12 }}>
            {msg}
          </Text>
        )}
      </Card>

      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 10 }}>Setup Guide</Text>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 20 }}>
          1. Telegram me @BotFather open karo{"\n"}
          2. /newbot se bot banao{"\n"}
          3. Bot token copy karo{"\n"}
          4. Apne bot ko message bhejo{"\n"}
          5. Chat ID nikal kar yahan save karo{"\n"}
          6. Test dabao, message aa jaye to setup complete
        </Text>
      </Card>
    </ScrollView>
  );
}

// =====================================================================
// BotTab - paste this into App.js, ABOVE the line: function MoreTab(...)
// (i.e. somewhere between TelegramTab and MoreTab, around line ~1837)
// Uses existing helpers already defined in App.js: apiGet, apiPostAuth,
// Card, Row, Label, Tag, Btn, ErrorBox
// =====================================================================


function chartParseDate(value) {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value;
  }

  if (typeof value === "number") {
    const milliseconds =
      value < 100000000000
        ? value * 1000
        : value;
    const numericDate = new Date(milliseconds);

    return Number.isNaN(numericDate.getTime())
      ? null
      : numericDate;
  }

  let text = String(value).trim();

  // SQLite datetime('now') returns:
  // YYYY-MM-DD HH:MM:SS in UTC.
  if (
    /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(text)
  ) {
    text = text.replace(/\s+/, "T");

    if (
      !/(Z|[+-]\d{2}:?\d{2})$/.test(text)
    ) {
      text += "Z";
    }
  } else if (
    /^\d{4}-\d{2}-\d{2}T/.test(text) &&
    !/(Z|[+-]\d{2}:?\d{2})$/.test(text)
  ) {
    // Backend ISO timestamp without timezone is UTC.
    text += "Z";
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function chartTimeLabel(value) {
  const date = chartParseDate(value);
  if (!date) return "--:--";

  const ist = new Date(
    date.getTime() + 330 * 60 * 1000
  );

  return [
    String(ist.getUTCHours()).padStart(2, "0"),
    String(ist.getUTCMinutes()).padStart(2, "0"),
  ].join(":");
}

function chartDateTimeLabel(value) {
  const date = chartParseDate(value);
  if (!date) return "--/--\n--:--";

  const ist = new Date(
    date.getTime() + 330 * 60 * 1000
  );

  const day = String(
    ist.getUTCDate()
  ).padStart(2, "0");
  const month = String(
    ist.getUTCMonth() + 1
  ).padStart(2, "0");
  const hours = String(
    ist.getUTCHours()
  ).padStart(2, "0");
  const minutes = String(
    ist.getUTCMinutes()
  ).padStart(2, "0");

  return `${day}/${month}\n${hours}:${minutes}`;
}

function chartPointTimestamp(point) {
  return (
    point?.created_at ||
    point?.engine_updated_at ||
    point?.updated_at ||
    point?.timestamp ||
    point?.datetime ||
    point?.time ||
    point?.date ||
    point?.ts ||
    null
  );
}

function chartTradeTimestamp(trade) {
  return (
    trade?.exit_time ||
    trade?.closed_at ||
    trade?.updated_at ||
    trade?.created_at ||
    trade?.entry_time ||
    trade?.timestamp ||
    trade?.time ||
    trade?.date ||
    null
  );
}

function chartIstDayKey(value) {
  const date = chartParseDate(value);
  if (!date) return "";

  const ist = new Date(
    date.getTime() + 330 * 60 * 1000
  );

  return [
    ist.getUTCFullYear(),
    String(ist.getUTCMonth() + 1).padStart(2, "0"),
    String(ist.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function chartCompactNumber(value) {
  const number = Number(value || 0);
  const absolute = Math.abs(number);

  if (absolute >= 100000) {
    return `${(number / 100000).toFixed(1)}L`;
  }
  if (absolute >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  if (absolute >= 100) {
    return number.toFixed(0);
  }
  if (absolute >= 10) {
    return number.toFixed(1);
  }
  return number.toFixed(2);
}

function chartPriceNumber(value) {
  const number = Number(value || 0);
  const rounded = Math.round(
    (number + Number.EPSILON) * 100
  ) / 100;

  return rounded.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }
  );
}

function chartMoney(value) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";

  return `${sign}₹${number.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }
  )}`;
}

function DetailedLineChart({
  points,
  color,
  negativeColor = C.red,
  height = 205,
  minValue,
  maxValue,
  includeZero = false,
  threshold,
  thresholdLabel,
  yAxisTitle,
  yAxisWidth = 56,
  valueFormatter = chartCompactNumber,
  emptyMessage = "Not enough data yet",
}) {
  const [containerWidth, setContainerWidth] = useState(0);

  const cleanPoints = (points || [])
    .map((point, index) => ({
      value: Number(point?.value),
      label: point?.label || String(index + 1),
    }))
    .filter((point) => Number.isFinite(point.value))
    .slice(-80);

  const hasData = cleanPoints.length > 0;
  const values = hasData
    ? cleanPoints.map((point) => point.value)
    : [0];

  let low = minValue != null
    ? Number(minValue)
    : Math.min(...values);
  let high = maxValue != null
    ? Number(maxValue)
    : Math.max(...values);

  if (includeZero) {
    low = Math.min(low, 0);
    high = Math.max(high, 0);
  }

  if (low === high) {
    const expansion = Math.max(
      Math.abs(low) * 0.02,
      1
    );
    low -= expansion;
    high += expansion;
  }

  if (minValue == null || maxValue == null) {
    const padding = Math.max(
      (high - low) * 0.10,
      Math.abs(high) * 0.002,
      0.5
    );

    if (minValue == null) low -= padding;
    if (maxValue == null) high += padding;
  }

  const leftPad = yAxisWidth;
  const rightPad = 10;
  const topPad = 16;
  const bottomPad = 48;
  const plotWidth = Math.max(
    160,
    containerWidth - leftPad - rightPad
  );
  const plotHeight = height - topPad - bottomPad;
  const range = Math.max(high - low, 0.0001);

  const coordinatePoints = cleanPoints.map(
    (point, index) => ({
      ...point,
      x:
        cleanPoints.length <= 1
          ? plotWidth / 2
          : index * (
              plotWidth /
              (cleanPoints.length - 1)
            ),
      y:
        plotHeight -
        ((point.value - low) / range) *
          plotHeight,
    })
  );

  const tickCount = 5;
  const yTicks = Array.from(
    { length: tickCount },
    (_, index) => {
      const ratio = index / (tickCount - 1);
      return {
        value: high - ratio * range,
        y: ratio * plotHeight,
      };
    }
  );

  const xIndexes = cleanPoints.length
    ? Array.from(
        new Set([
          0,
          Math.round((cleanPoints.length - 1) * 0.25),
          Math.round((cleanPoints.length - 1) * 0.50),
          Math.round((cleanPoints.length - 1) * 0.75),
          cleanPoints.length - 1,
        ])
      )
    : [];

  const thresholdY =
    threshold != null &&
    Number(threshold) >= low &&
    Number(threshold) <= high
      ? plotHeight -
        ((Number(threshold) - low) / range) *
          plotHeight
      : null;

  const zeroY =
    low < 0 && high > 0
      ? plotHeight -
        ((0 - low) / range) * plotHeight
      : null;

  return (
    <View
      onLayout={(event) => {
        const width =
          event.nativeEvent.layout.width;
        if (
          width &&
          Math.abs(width - containerWidth) > 1
        ) {
          setContainerWidth(width);
        }
      }}
      style={{
        height,
        width: "100%",
        position: "relative",
      }}
    >
      {containerWidth > 0 && (
        <>
          <Text style={{
            position: "absolute",
            left: 0,
            top: 0,
            color: C.muted,
            fontSize: 9,
            fontWeight: "800",
          }}>
            {yAxisTitle || ""}
          </Text>

          <View style={{
            position: "absolute",
            left: leftPad,
            top: topPad,
            width: plotWidth,
            height: plotHeight,
          }}>
            {yTicks.map((tick, index) => (
              <View
                key={`grid-${index}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: tick.y,
                  width: plotWidth,
                  borderTopWidth: 1,
                  borderTopColor: C.border2,
                  borderStyle: "dashed",
                }}
              />
            ))}

            {zeroY != null && (
              <View style={{
                position: "absolute",
                left: 0,
                top: zeroY,
                width: plotWidth,
                borderTopWidth: 1.5,
                borderTopColor: C.sub,
              }} />
            )}

            {thresholdY != null && (
              <>
                <View style={{
                  position: "absolute",
                  left: 0,
                  top: thresholdY,
                  width: plotWidth,
                  borderTopWidth: 1,
                  borderTopColor: C.gold,
                  borderStyle: "dashed",
                }} />
                <Text style={{
                  position: "absolute",
                  right: 2,
                  top: Math.max(
                    0,
                    thresholdY - 15
                  ),
                  color: C.gold,
                  fontSize: 9,
                  fontWeight: "900",
                  backgroundColor: C.s2,
                  paddingHorizontal: 4,
                }}>
                  {thresholdLabel || threshold}
                </Text>
              </>
            )}

            {coordinatePoints.slice(0, -1).map(
              (point, index) => {
                const next =
                  coordinatePoints[index + 1];
                const dx = next.x - point.x;
                const dy = next.y - point.y;
                const length = Math.sqrt(
                  dx * dx + dy * dy
                );
                const angle =
                  Math.atan2(dy, dx) *
                  180 /
                  Math.PI;
                const segmentValue =
                  (point.value + next.value) / 2;
                const segmentColor =
                  includeZero && segmentValue < 0
                    ? negativeColor
                    : color;

                return (
                  <View
                    key={`segment-${index}`}
                    style={{
                      position: "absolute",
                      left:
                        (point.x +
                          next.x -
                          length) /
                        2,
                      top:
                        (point.y +
                          next.y -
                          2) /
                        2,
                      width: length,
                      height: 2.5,
                      borderRadius: 2,
                      backgroundColor:
                        segmentColor,
                      transform: [{
                        rotateZ: `${angle}deg`,
                      }],
                    }}
                  />
                );
              }
            )}

            {coordinatePoints.map((point, index) => {
              const showDot =
                coordinatePoints.length <= 18 ||
                index ===
                  coordinatePoints.length - 1;

              if (!showDot) return null;

              return (
                <View
                  key={`dot-${index}`}
                  style={{
                    position: "absolute",
                    left: point.x - 3.5,
                    top: point.y - 3.5,
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor:
                      includeZero &&
                      point.value < 0
                        ? negativeColor
                        : color,
                    borderWidth: 1,
                    borderColor: C.text,
                  }}
                />
              );
            })}

            {xIndexes.map((index) => {
              const point = coordinatePoints[index];

              if (!point) return null;

              return (
                <Text
                  key={`x-${index}`}
                  numberOfLines={2}
                  style={{
                    position: "absolute",
                    left: Math.max(
                      -16,
                      Math.min(
                        plotWidth - 50,
                        point.x - 25
                      )
                    ),
                    top: plotHeight + 5,
                    width: 50,
                    textAlign: "center",
                    color: C.muted,
                    fontSize: 8,
                    lineHeight: 10,
                    fontWeight: "700",
                  }}
                >
                  {point.label}
                </Text>
              );
            })}
          </View>

          {yTicks.map((tick, index) => (
            <Text
              key={`y-${index}`}
              numberOfLines={1}
              style={{
                position: "absolute",
                left: 0,
                top:
                  topPad +
                  tick.y -
                  7,
                width: leftPad - 7,
                textAlign: "right",
                color: C.muted,
                fontSize: 9,
                fontWeight: "700",
              }}
            >
              {valueFormatter(tick.value)}
            </Text>
          ))}

          {!hasData && (
            <View style={{
              position: "absolute",
              left: leftPad,
              right: rightPad,
              top: topPad,
              height: plotHeight,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Text style={{
                color: C.muted,
                fontSize: 11,
                textAlign: "center",
                lineHeight: 17,
                paddingHorizontal: 20,
              }}>
                {emptyMessage}
              </Text>
            </View>
          )}

          <Text style={{
            position: "absolute",
            bottom: 0,
            left: leftPad,
            right: rightPad,
            textAlign: "center",
            color: C.muted,
            fontSize: 9,
            fontWeight: "800",
          }}>
            Date • Time (IST)
          </Text>
        </>
      )}
    </View>
  );
}

function chartNullableNumber(value) {
  if (
    value == null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function aggregateChartCandles(
  candles,
  groupSize = 3,
) {
  const clean = (candles || [])
    .map((candle) => ({
      ...candle,
      open: Number(candle?.open),
      high: Number(candle?.high),
      low: Number(candle?.low),
      close: Number(candle?.close),
      ema9: chartNullableNumber(
        candle?.ema9
      ),
      ema21: chartNullableNumber(
        candle?.ema21
      ),
      vwap: chartNullableNumber(
        candle?.vwap
      ),
      supertrend: chartNullableNumber(
        candle?.supertrend
      ),
    }))
    .filter((candle) => (
      Number.isFinite(candle.open) &&
      Number.isFinite(candle.high) &&
      Number.isFinite(candle.low) &&
      Number.isFinite(candle.close)
    ));

  const result = [];

  for (
    let index = 0;
    index < clean.length;
    index += groupSize
  ) {
    const group = clean.slice(
      index,
      index + groupSize
    );

    if (!group.length) continue;

    const first = group[0];
    const last = group[group.length - 1];

    result.push({
      time: first.time,
      open: first.open,
      high: Math.max(
        ...group.map(
          (candle) => candle.high
        )
      ),
      low: Math.min(
        ...group.map(
          (candle) => candle.low
        )
      ),
      close: last.close,
      ema9: last.ema9,
      ema21: last.ema21,
      vwap: last.vwap,
      supertrend: last.supertrend,
      supertrend_dir:
        last.supertrend_dir ||
        "NEUTRAL",
      adx: Number(last.adx || 0),
    });
  }

  return result;
}

function CandlestickIndicatorChart({
  candles,
  height = 310,
  emptyMessage,
}) {
  const scrollRef = useRef(null);
  const followLatestRef = useRef(true);
  const [viewportWidth, setViewportWidth] =
    useState(0);
  const [yScaleFactor, setYScaleFactor] =
    useState(1);

  const clean = (candles || []).filter(
    (candle) => (
      Number.isFinite(Number(candle?.open)) &&
      Number.isFinite(Number(candle?.high)) &&
      Number.isFinite(Number(candle?.low)) &&
      Number.isFinite(Number(candle?.close))
    )
  );

  const yAxisWidth = 72;
  const legendHeight = 68;
  const bottomPad = 38;
  const topPad = 12;
  const chartHeight =
    height - legendHeight;
  const plotHeight =
    chartHeight - topPad - bottomPad;
  const candleSpacing = 15;
  const bodyWidth = 8;

  const availablePlotWidth = Math.max(
    viewportWidth - yAxisWidth,
    220
  );

  const contentWidth = Math.max(
    availablePlotWidth,
    clean.length * candleSpacing + 24
  );

  const allValues = [];

  clean.forEach((candle) => {
    [
      candle.low,
      candle.high,
      candle.ema9,
      candle.ema21,
      candle.vwap,
      candle.supertrend,
    ].forEach((value) => {
      const number =
        chartNullableNumber(value);

      // Index prices and overlays must be positive.
      // This prevents null Supertrend from becoming 0.
      if (
        number != null &&
        number > 0
      ) {
        allValues.push(number);
      }
    });
  });

  let autoLow = allValues.length
    ? Math.min(...allValues)
    : 0;
  let autoHigh = allValues.length
    ? Math.max(...allValues)
    : 1;

  if (autoLow === autoHigh) {
    autoLow -= 1;
    autoHigh += 1;
  }

  const autoPadding = Math.max(
    (autoHigh - autoLow) * 0.08,
    0.5
  );

  autoLow -= autoPadding;
  autoHigh += autoPadding;

  const autoRange = Math.max(
    autoHigh - autoLow,
    0.0001
  );
  const axisCenter =
    (autoHigh + autoLow) / 2;
  const adjustedRange = Math.max(
    autoRange * yScaleFactor,
    0.0001
  );

  let low =
    axisCenter - adjustedRange / 2;
  let high =
    axisCenter + adjustedRange / 2;

  const range = Math.max(
    high - low,
    0.0001
  );

  const zoomPercent = Math.round(
    100 / yScaleFactor
  );

  function zoomYAxisIn() {
    setYScaleFactor((current) =>
      Math.max(
        0.3,
        current / 1.35
      )
    );
  }

  function zoomYAxisOut() {
    setYScaleFactor((current) =>
      Math.min(
        4,
        current * 1.35
      )
    );
  }

  function resetYAxis() {
    setYScaleFactor(1);
  }

  const yFor = (value) => (
    topPad +
    plotHeight -
    (
      (Number(value) - low) /
      range
    ) *
      plotHeight
  );

  const xFor = (index) => (
    12 +
    index * candleSpacing +
    candleSpacing / 2
  );

  const yTicks = Array.from(
    { length: 5 },
    (_, index) => {
      const ratio = index / 4;

      return {
        value: high - ratio * range,
        y:
          legendHeight +
          topPad +
          ratio * plotHeight,
      };
    }
  );

  const labelStep =
    clean.length > 100
      ? 20
      : clean.length > 50
      ? 10
      : 5;

  const labelIndexes = clean
    .map((_, index) => index)
    .filter((index) => (
      index === 0 ||
      index === clean.length - 1 ||
      index % labelStep === 0
    ));

  function renderIndicator(
    field,
    color,
    keyPrefix,
  ) {
    const segments = [];

    for (
      let index = 0;
      index < clean.length - 1;
      index += 1
    ) {
      const current =
        chartNullableNumber(
          clean[index]?.[field]
        );
      const next =
        chartNullableNumber(
          clean[index + 1]?.[field]
        );

      if (
        current == null ||
        next == null ||
        current <= 0 ||
        next <= 0
      ) {
        continue;
      }

      const x1 = xFor(index);
      const x2 = xFor(index + 1);
      const y1 = yFor(current);
      const y2 = yFor(next);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(
        dx * dx + dy * dy
      );
      const angle =
        Math.atan2(dy, dx) *
        180 /
        Math.PI;

      segments.push(
        <View
          key={`${keyPrefix}-${index}`}
          style={{
            position: "absolute",
            left:
              (x1 + x2 - length) / 2,
            top:
              (y1 + y2 - 2) / 2,
            width: length,
            height: 2,
            borderRadius: 2,
            backgroundColor: color,
            transform: [{
              rotateZ: `${angle}deg`,
            }],
          }}
        />
      );
    }

    return segments;
  }

  function renderSupertrend() {
    const segments = [];

    for (
      let index = 0;
      index < clean.length - 1;
      index += 1
    ) {
      const current =
        chartNullableNumber(
          clean[index]?.supertrend
        );
      const next =
        chartNullableNumber(
          clean[index + 1]?.supertrend
        );

      if (
        current == null ||
        next == null ||
        current <= 0 ||
        next <= 0
      ) {
        continue;
      }

      const x1 = xFor(index);
      const x2 = xFor(index + 1);
      const y1 = yFor(current);
      const y2 = yFor(next);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(
        dx * dx + dy * dy
      );
      const angle =
        Math.atan2(dy, dx) *
        180 /
        Math.PI;
      const direction = String(
        clean[index + 1]
          ?.supertrend_dir ||
        clean[index]
          ?.supertrend_dir ||
        "NEUTRAL"
      ).toUpperCase();

      segments.push(
        <View
          key={`st-${index}`}
          style={{
            position: "absolute",
            left:
              (x1 + x2 - length) / 2,
            top:
              (y1 + y2 - 2) / 2,
            width: length,
            height: 2,
            borderRadius: 2,
            backgroundColor:
              direction === "UP"
                ? C.green
                : direction === "DOWN"
                ? C.red
                : C.muted,
            transform: [{
              rotateZ: `${angle}deg`,
            }],
          }}
        />
      );
    }

    return segments;
  }

  return (
    <View
      onLayout={(event) => {
        const width =
          event.nativeEvent.layout.width;

        if (
          width &&
          Math.abs(
            width - viewportWidth
          ) > 1
        ) {
          setViewportWidth(width);
        }
      }}
      style={{
        height,
        width: "100%",
      }}
    >
      <View style={{
        height: legendHeight,
        paddingLeft: yAxisWidth,
        justifyContent: "space-evenly",
      }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 9,
        }}>
          {[
            ["Candle", C.green],
            ["EMA9", C.gold],
            ["EMA21", C.accent],
            ["VWAP", C.blue],
            ["ST", C.red],
          ].map(([label, color]) => (
            <View
              key={label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <View style={{
                width: 11,
                height: 3,
                borderRadius: 2,
                backgroundColor: color,
              }} />
              <Text style={{
                color: C.muted,
                fontSize: 8,
                fontWeight: "800",
              }}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
        }}>
          <TouchableOpacity
            onPress={zoomYAxisIn}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: C.border2,
              backgroundColor: C.card2,
            }}
          >
            <Text style={{
              color: C.text,
              fontSize: 10,
              fontWeight: "900",
            }}>
              + Zoom
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetYAxis}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor:
                yScaleFactor === 1
                  ? C.blue
                  : C.border2,
              backgroundColor:
                yScaleFactor === 1
                  ? C.blueLo
                  : C.card2,
            }}
          >
            <Text style={{
              color:
                yScaleFactor === 1
                  ? C.blue
                  : C.text,
              fontSize: 10,
              fontWeight: "900",
            }}>
              AUTO {zoomPercent}%
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={zoomYAxisOut}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: C.border2,
              backgroundColor: C.card2,
            }}
          >
            <Text style={{
              color: C.text,
              fontSize: 10,
              fontWeight: "900",
            }}>
              - Zoom
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{
        height: chartHeight,
        position: "relative",
      }}>
        <Text style={{
          position: "absolute",
          left: 0,
          top: 0,
          color: C.muted,
          fontSize: 9,
          fontWeight: "800",
        }}>
          Price
        </Text>

        {yTicks.map((tick, index) => (
          <Text
            key={`price-tick-${index}`}
            numberOfLines={1}
            style={{
              position: "absolute",
              left: 0,
              top: tick.y - legendHeight - 7,
              width: yAxisWidth - 6,
              textAlign: "right",
              color: C.muted,
              fontSize: 9,
              fontWeight: "700",
            }}
          >
            {chartPriceNumber(tick.value)}
          </Text>
        ))}

        <ScrollView
          ref={scrollRef}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator
          scrollEventThrottle={16}
          style={{
            position: "absolute",
            left: yAxisWidth,
            right: 0,
            top: 0,
            height: chartHeight,
          }}
          onScroll={(event) => {
            const {
              contentOffset,
              contentSize,
              layoutMeasurement,
            } = event.nativeEvent;

            const remaining =
              contentSize.width -
              (
                contentOffset.x +
                layoutMeasurement.width
              );

            followLatestRef.current =
              remaining < 45;
          }}
          onContentSizeChange={() => {
            if (
              followLatestRef.current &&
              scrollRef.current
            ) {
              requestAnimationFrame(() => {
                scrollRef.current
                  ?.scrollToEnd({
                    animated: false,
                  });
              });
            }
          }}
        >
          <View style={{
            width: contentWidth,
            height: chartHeight,
            position: "relative",
          }}>
            {yTicks.map((tick, index) => (
              <View
                key={`candle-grid-${index}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top:
                    tick.y -
                    legendHeight,
                  width: contentWidth,
                  borderTopWidth: 1,
                  borderTopColor: C.border2,
                  borderStyle: "dashed",
                }}
              />
            ))}

            {clean.map((candle, index) => {
              const open = Number(
                candle.open
              );
              const close = Number(
                candle.close
              );
              const highValue = Number(
                candle.high
              );
              const lowValue = Number(
                candle.low
              );
              const bullish =
                close >= open;
              const candleColor =
                bullish
                  ? C.green
                  : C.red;
              const x = xFor(index);
              const highY = yFor(
                highValue
              );
              const lowY = yFor(
                lowValue
              );
              const openY = yFor(open);
              const closeY = yFor(close);
              const bodyTop = Math.min(
                openY,
                closeY
              );
              const bodyHeight = Math.max(
                2,
                Math.abs(
                  closeY - openY
                )
              );

              return (
                <React.Fragment
                  key={`candle-${index}`}
                >
                  <View style={{
                    position: "absolute",
                    left: x - 0.75,
                    top: highY,
                    width: 1.5,
                    height: Math.max(
                      1,
                      lowY - highY
                    ),
                    backgroundColor:
                      candleColor,
                  }} />
                  <View style={{
                    position: "absolute",
                    left:
                      x -
                      bodyWidth / 2,
                    top: bodyTop,
                    width: bodyWidth,
                    height: bodyHeight,
                    borderRadius: 1,
                    backgroundColor:
                      candleColor,
                    borderWidth: 1,
                    borderColor:
                      candleColor,
                  }} />
                </React.Fragment>
              );
            })}

            {renderIndicator(
              "ema9",
              C.gold,
              "ema9"
            )}
            {renderIndicator(
              "ema21",
              C.accent,
              "ema21"
            )}
            {renderIndicator(
              "vwap",
              C.blue,
              "vwap"
            )}
            {renderSupertrend()}

            {labelIndexes.map((index) => {
              const candle =
                clean[index];

              if (!candle) return null;

              return (
                <Text
                  key={`candle-label-${index}`}
                  numberOfLines={2}
                  style={{
                    position: "absolute",
                    left:
                      xFor(index) - 25,
                    top:
                      topPad +
                      plotHeight +
                      5,
                    width: 50,
                    textAlign: "center",
                    color: C.muted,
                    fontSize: 8,
                    lineHeight: 10,
                    fontWeight: "700",
                  }}
                >
                  {chartDateTimeLabel(
                    candle.time
                  )}
                </Text>
              );
            })}

            {!clean.length && (
              <View style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: plotHeight,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Text style={{
                  color: C.muted,
                  fontSize: 11,
                  textAlign: "center",
                }}>
                  {emptyMessage || (
                    "Real candles load ho rahi hain."
                  )}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Text style={{
          position: "absolute",
          left: yAxisWidth,
          right: 0,
          bottom: 0,
          textAlign: "center",
          color: C.muted,
          fontSize: 9,
          fontWeight: "800",
        }}>
          Swipe left/right • Date & Time (IST)
        </Text>
      </View>
    </View>
  );
}


const BOT_STATUS_MESSAGES_HI = {
  PAPER_RUNNING: "Paper mode running — real TQU data",
  LIVE_RUNNING: "Live mode running — real TQU data",
  CONNECT_BROKER_FOR_REAL_SIGNAL: "Broker connect karein real signal ke liye",
  ENGINE_WARMING_UP: "Broker connected — candles load ho rahi hain (market band ho sakta hai)",
  PAPER_STOPPED: "Bot stopped (Paper mode)",
  LIVE_WAITING: "Live data ka wait ho raha hai...",
};
const BOT_STATUS_MESSAGES_EN = {
  PAPER_RUNNING: "Paper mode running — real TQU data",
  LIVE_RUNNING: "Live mode running — real TQU data",
  CONNECT_BROKER_FOR_REAL_SIGNAL: "Connect a broker for real signals",
  ENGINE_WARMING_UP: "Broker connected — loading candles (market may be closed)",
  PAPER_STOPPED: "Bot stopped (Paper mode)",
  LIVE_WAITING: "Waiting for live data...",
};

function BotTab({ token, lang }) {
  const hi = lang === "hi";
  const [signal, setSignal] = useState(null);
  const [settings, setSettings] = useState(null);
  const [history, setHistory] = useState([]);
  const [paperTrades, setPaperTrades] = useState([]);
  const [chartCandles, setChartCandles] = useState([]);
  const [chartMeta, setChartMeta] = useState(null);
  const [chartInstrument, setChartInstrument] = useState("NIFTY");
  const chartInstrumentRef = useRef("NIFTY");
  const chartSelectionInitializedRef = useRef(false);
  const [chartRangeDays, setChartRangeDays] = useState(1);
  const chartRangeRef = useRef(1);
  const [chartLoading, setChartLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadChart(
    instrument = chartInstrumentRef.current,
    silent = false,
  ) {
    const selected = String(
      instrument || "NIFTY"
    ).toUpperCase();

    if (!silent) {
      setChartLoading(true);
    }

    try {
      const chart = await apiGet(
        `/bot/chart-data?instrument=${encodeURIComponent(selected)}&days=${chartRangeRef.current}`,
        token
      );

      if (
        chart &&
        Array.isArray(chart.candles)
      ) {
        setChartCandles(
          chart.candles
        );
        setChartMeta(chart);
      }
    } catch {
      if (!silent) {
        setError(
          hi
            ? "Selected chart load nahi hua."
            : "Selected chart could not load."
        );
      }
    }

    if (!silent) {
      setChartLoading(false);
    }
  }

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const sig = await apiGet("/bot/signal", token);
      setSignal(sig);
      const strat = await apiGet("/strategy/settings", token);
      if (strat && strat.settings) {
        setSettings(strat.settings);

        if (
          !chartSelectionInitializedRef.current
        ) {
          const initialChart = String(
            strat.settings.primary_instrument
            || "NIFTY"
          ).toUpperCase();

          chartSelectionInitializedRef.current = true;
          chartInstrumentRef.current = initialChart;
          setChartInstrument(initialChart);
        }
      }
      if (!silent || chartRangeRef.current === 1) {
        const historyLimit = chartRangeRef.current === 1 ? 600 : 6000;
        const hist = await apiGet(
          `/bot/signal-history?limit=${historyLimit}&days=${chartRangeRef.current}&instrument=${encodeURIComponent(chartInstrumentRef.current)}`,
          token
        );
        if (hist && hist.points) {
          setHistory(hist.points);
        }

        await loadChart(
          chartInstrumentRef.current,
          true
        );

        const trades = await apiGet("/history/paper", token);
        if (trades && trades.paper_trades) setPaperTrades(trades.paper_trades);
      }
    } catch (e) {
      setError(hi ? "Status load nahi ho paya. Refresh try karein." : "Could not load status. Please try refreshing.");
    }
    if (!silent) setLoading(false);
  }

  useEffect(() => {
    load();

    const timer = setInterval(
      () => load(true),
      15000
    );

    return () => clearInterval(timer);
  }, []);

  async function saveSettings(partial) {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      const merged = { ...settings, ...partial };
      const res = await apiPostAuth("/strategy/settings", merged, token);
      if (res && res.success && res.settings) {
        setSettings(res.settings);
      }
      await load();
    } catch (e) {
      setError(hi ? "Settings save nahi hui." : "Could not save settings.");
    }
    setSaving(false);
  }

  async function handleStart() {
    setSaving(true);
    setError("");
    try {
      await apiPostAuth("/bot/start", {}, token);
      await load();
    } catch (e) {
      setError(hi ? "Bot start nahi ho paya." : "Could not start the bot.");
    }
    setSaving(false);
  }

  async function handleStop() {
    setSaving(true);
    setError("");
    try {
      await apiPostAuth("/bot/stop", {}, token);
      await load();
    } catch (e) {
      setError(hi ? "Bot stop nahi ho paya." : "Could not stop the bot.");
    }
    setSaving(false);
  }

  function handleModeSelect(mode) {
    if (mode === "live") {
      Alert.alert(
        hi ? "Live Mode" : "Live Mode",
        hi ? "Live mode asli broker order laga sakta hai. Continue karein?" : "Live mode can place real broker orders. Continue?",
        [
          { text: hi ? "Cancel" : "Cancel", style: "cancel" },
          { text: hi ? "Continue" : "Continue", style: "destructive", onPress: () => saveSettings({ trading_mode: "live" }) }
        ]
      );
    } else {
      saveSettings({ trading_mode: "paper" });
    }
  }

  function toggleInstrument(sym) {
    if (!settings) return;
    let enabled = settings.enabled_instruments || [];
    if (enabled.includes(sym)) {
      if (enabled.length === 1) return;
      enabled = enabled.filter(x => x !== sym);
    } else {
      enabled = [...enabled, sym];
    }
    let primary = settings.primary_instrument;
    if (!enabled.includes(primary)) primary = enabled[0];

    if (!enabled.includes(chartInstrumentRef.current)) {
      const nextChart = enabled[0] || "NIFTY";
      chartInstrumentRef.current = nextChart;
      setChartInstrument(nextChart);
    }

    saveSettings({
      enabled_instruments: enabled,
      primary_instrument: primary,
    });
  }

  async function setChartOnly(sym) {
    if (!settings) return;

    if (
      !(settings.enabled_instruments || [])
        .includes(sym)
    ) {
      return;
    }

    chartInstrumentRef.current = sym;
    setChartInstrument(sym);
    setChartCandles([]);
    setHistory([]);
    setChartMeta({
      instrument: sym,
      range_days: chartRangeRef.current,
      status: "LOADING",
      message: `${sym} chart load ho raha hai...`,
    });

    await load(false);
  }

  async function selectChartRange(days) {
    const nextDays = Number(days || 1);
    if (![1, 7, 30].includes(nextDays)) return;
    chartRangeRef.current = nextDays;
    setChartRangeDays(nextDays);
    setChartCandles([]);
    setHistory([]);
    setChartMeta({
      instrument: chartInstrumentRef.current,
      range_days: nextDays,
      status: "LOADING",
      message: `${nextDays === 1 ? "Today" : `${nextDays} days`} history load ho rahi hai...`,
    });
    await load(false);
  }

  const [capitalInput, setCapitalInput] = useState("");
  useEffect(() => {
    if (settings?.paper_capital != null) setCapitalInput(String(settings.paper_capital));
  }, [settings?.paper_capital]);

  const isRunning = !!signal?.running;
  const mode = signal?.trading_mode || settings?.trading_mode || "paper";
  const activeEntryThreshold = Number(
    signal?.min_score ?? 82
  );
  const activeStrategyName =
    signal?.strategy_profile_name ||
    "OKAI Default 82";
  const rawStatus = signal?.status || "";
  const friendlyStatus = (hi ? BOT_STATUS_MESSAGES_HI : BOT_STATUS_MESSAGES_EN)[rawStatus] || rawStatus || "--";
  const brokerNotConnected = rawStatus === "CONNECT_BROKER_FOR_REAL_SIGNAL";
  const engineWarmingUp = rawStatus === "ENGINE_WARMING_UP";
  const noRealData = brokerNotConnected || engineWarmingUp || signal?.signal === "NO_DATA";

  const chartRuntimeStatus =
    chartMeta?.status ||
    chartMeta?.runtime_status ||
    "";

  const chartEmptyMessage = (
    chartMeta?.message ||
    (
      chartRuntimeStatus === "AUTO_RESTARTING"
        ? "Broker engine auto-restart ho gaya. Candles load ho rahi hain..."
        : chartRuntimeStatus === "STARTING"
        ? "Broker engine start ho raha hai..."
        : chartRuntimeStatus === "LOGGED_IN"
        ? "Broker login ho gaya. Candles prepare ho rahi hain..."
        : chartRuntimeStatus === "WAITING_CANDLES"
        ? "Market candles ka wait ho raha hai..."
        : chartMeta?.reason === "BOT_STOPPED"
        ? "Bot stopped hai. Start Bot dabao."
        : chartMeta?.reason === "BROKER_NOT_CONNECTED"
        ? "Active broker connect nahi hai."
        : "Chart engine status check ho raha hai..."
    )
  );

  const chartPointLimit = chartRangeDays === 1 ? 120 : 320;
  const chartHistory = history
    .filter((point) => (
      Number.isFinite(Number(point?.score)) ||
      Number.isFinite(Number(point?.price))
    ))
    .slice(-chartPointLimit);

  const savedScorePoints = chartHistory
    .filter((point) =>
      Number.isFinite(Number(point?.score))
    )
    .map((point) => ({
      value: Number(point.score),
      label: chartDateTimeLabel(
        chartPointTimestamp(point)
      ),
      source: "LIVE_SAVED",
    }));

  const replayScorePoints = chartCandles
    .filter((candle) =>
      Number.isFinite(Number(candle?.score))
    )
    .slice(-chartPointLimit)
    .map((candle) => ({
      value: Number(candle.score),
      label: chartDateTimeLabel(candle.time),
      source: candle.score_source || "HISTORICAL_REPLAY",
      signal: candle.signal || "WAIT",
    }));

  const scorePoints = (
    chartRangeDays > 1 && replayScorePoints.length > 0
      ? replayScorePoints
      : savedScorePoints.length > 0
      ? savedScorePoints
      : replayScorePoints
  );

  const scoreSourceLabel = (
    scorePoints.length > 0 && scorePoints[0]?.source === "HISTORICAL_REPLAY"
      ? "HISTORICAL REPLAY"
      : "LIVE SAVED"
  );

  const pricePoints = chartHistory
    .filter((point) =>
      Number.isFinite(Number(point?.price)) &&
      Number(point.price) > 0
    )
    .map((point) => ({
      value: Number(point.price),
      label: chartDateTimeLabel(
        chartPointTimestamp(point)
      ),
    }));

  const todayIstKey = chartIstDayKey(
    new Date()
  );

  const closedPaperTrades = paperTrades
    .filter((trade) => (
      String(trade?.status || "").toUpperCase()
        !== "OPEN" &&
      Number.isFinite(Number(trade?.pnl))
    ));

  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(
    rangeStart.getDate() - Math.max(chartRangeDays - 1, 0)
  );

  const rangePaperTrades = closedPaperTrades
    .filter((trade) => {
      const timestamp = new Date(chartTradeTimestamp(trade));
      return Number.isFinite(timestamp.getTime()) && timestamp >= rangeStart;
    });

  const todayPaperTrades = rangePaperTrades
    .filter((trade) => (
      chartIstDayKey(
        chartTradeTimestamp(trade)
      ) === todayIstKey
    ));

  const pnlSource = rangePaperTrades
    .slice(0, chartRangeDays === 1 ? 80 : 500)
    .reverse();

  let cumulativePnl = 0;
  const pnlPoints = pnlSource.map((trade) => {
    cumulativePnl += Number(
      trade.pnl || 0
    );

    return {
      value: cumulativePnl,
      label: chartDateTimeLabel(
        chartTradeTimestamp(trade)
      ),
    };
  });

  const latestScore =
    scorePoints.length > 0
      ? scorePoints[
          scorePoints.length - 1
        ].value
      : null;

  const displayCandles =
    aggregateChartCandles(
      chartCandles,
      chartRangeDays === 1 ? 3 : 1
    );

  const latestRawCandle =
    chartCandles.length > 0
      ? chartCandles[
          chartCandles.length - 1
        ]
      : null;

  const firstRawCandle =
    chartCandles.length > 0
      ? chartCandles[0]
      : null;

  const latestPrice =
    latestRawCandle &&
    Number.isFinite(
      Number(latestRawCandle.close)
    )
      ? Number(
          latestRawCandle.close
        )
      : pricePoints.length > 0
      ? pricePoints[
          pricePoints.length - 1
        ].value
      : null;

  const firstPrice =
    firstRawCandle &&
    Number.isFinite(
      Number(firstRawCandle.open)
    )
      ? Number(
          firstRawCandle.open
        )
      : pricePoints.length > 0
      ? pricePoints[0].value
      : null;

  const priceChange =
    latestPrice != null &&
    firstPrice != null
      ? latestPrice - firstPrice
      : 0;

  const priceChangePercent =
    firstPrice
      ? priceChange / firstPrice * 100
      : 0;

  const latestPnl =
    pnlPoints.length > 0
      ? pnlPoints[
          pnlPoints.length - 1
        ].value
      : null;

  const priceMoveColor =
    priceChange >= 0
      ? C.green
      : C.red;

  const pnlMoveColor =
    Number(latestPnl || 0) >= 0
      ? C.green
      : C.red;

  const primaryInstrument =
    chartMeta?.instrument ||
    chartInstrument ||
    "NIFTY";

  const autoScanResults = Array.isArray(
    signal?.scan_results
  )
    ? signal.scan_results
    : [];

  const activePortfolioTrades = Array.isArray(
    signal?.active_trades
  )
    ? signal.active_trades
    : signal?.active_trade
    ? [signal.active_trade]
    : [];

  const capitalPlan = signal?.capital_plan || {
    slot_1_percent: 50,
    slot_2_percent: 40,
    reserve_percent: 10,
    max_open_positions: 2,
  };

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#fff" />}>

      {error ? <ErrorBox msg={error} /> : null}

      {/* Status Card */}
      <Card glow={isRunning ? C.green : C.red}>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: "900" }}>{hi ? "Bot Status" : "Bot Status"}</Text>
          <Tag label={isRunning ? (hi ? "CHAL RAHA HAI" : "RUNNING") : (hi ? "RUKA HUA HAI" : "STOPPED")} color={isRunning ? C.green : C.red} />
        </Row>

        {noRealData && (
          <View style={{ backgroundColor: brokerNotConnected ? C.goldLo : C.blueLo, borderRadius: 10, padding: 10,
            borderWidth: 1, borderColor: (brokerNotConnected ? C.gold : C.blue)+"55", marginBottom: 10 }}>
            <Text style={{ color: brokerNotConnected ? C.gold : C.blue, fontSize: 12, fontWeight: "800" }}>
              {brokerNotConnected ? "⚠️ " : "⏳ "}{friendlyStatus}
            </Text>
          </View>
        )}

        {[
          [hi ? "Mode" : "Mode", mode.toUpperCase()],
          [hi ? "Active Strategy" : "Active Strategy", activeStrategyName],
          [hi ? "Signal" : "Signal", signal?.signal === "NO_DATA" ? (hi ? "Live data nahi hai" : "No live data") : (signal?.signal || "--")],
          [hi ? "Score" : "Score", `${signal?.score ?? "--"} / ${signal?.min_score ?? "--"}`],
          [hi ? "Open Positions" : "Open Positions", `${signal?.open_trade_count ?? activePortfolioTrades.length} / ${capitalPlan.max_open_positions || 2}`],
          [hi ? "Total Trades" : "Total Trades", signal?.total_trades ?? "--"],
          [hi ? "Total P&L" : "Total P&L", signal?.total_pnl != null ? `₹${signal.total_pnl}` : "--"],
        ].map(([l, v]) => (
          <Row key={l} style={{ justifyContent: "space-between", paddingVertical: 8,
            borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 13 }}>{l}</Text>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{v}</Text>
          </Row>
        ))}
      </Card>

      <AiDecisionCard signal={signal} />

      {/* AUTO Portfolio 50/40 */}
      <Card glow={C.accent}>
        <Row style={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: C.text,
              fontSize: 16,
              fontWeight: "900",
            }}>
              🎯 AUTO Portfolio
            </Text>
            <Text style={{
              color: C.muted,
              fontSize: 10,
              lineHeight: 16,
              marginTop: 4,
            }}>
              NIFTY, BANKNIFTY aur SENSEX me best score select hota hai.
              Second trade sirf alag index me liya jayega.
            </Text>
          </View>

          <Tag
            label="MAX 2"
            color={C.accent}
          />
        </Row>

        <View style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 12,
        }}>
          {[
            ["SLOT 1", `${capitalPlan.slot_1_percent || 50}%`, C.green],
            ["SLOT 2", `${capitalPlan.slot_2_percent || 40}%`, C.blue],
            ["RESERVE", `${capitalPlan.reserve_percent || 10}%`, C.gold],
          ].map(([label, value, color]) => (
            <View
              key={label}
              style={{
                flex: 1,
                backgroundColor: color + "15",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: color + "55",
                paddingVertical: 9,
                paddingHorizontal: 6,
                alignItems: "center",
              }}
            >
              <Text style={{
                color: C.muted,
                fontSize: 8,
                fontWeight: "900",
              }}>
                {label}
              </Text>
              <Text style={{
                color,
                fontSize: 15,
                fontWeight: "900",
                marginTop: 2,
              }}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={{
          color: C.sub,
          fontSize: 10,
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: 1.1,
          marginBottom: 6,
        }}>
          Live Index Scan
        </Text>

        {autoScanResults.length > 0 ? (
          autoScanResults.map((scan, scanIndex) => {
            const passed = !!scan?.trade_allowed;
            const score = Number(scan?.score || 0);
            const minimum = Number(scan?.min_score || activeEntryThreshold);
            const signalText =
              scan?.signal && scan.signal !== "WAIT"
                ? scan.signal
                : scan?.candidate_signal || "WAIT";

            return (
              <View
                key={scan?.underlying || `scan-${scanIndex}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                }}
              >
                <View>
                  <Text style={{
                    color: C.text,
                    fontSize: 12,
                    fontWeight: "900",
                  }}>
                    {scan?.underlying || "--"}
                  </Text>
                  <Text style={{
                    color: C.muted,
                    fontSize: 9,
                    marginTop: 2,
                  }}>
                    {scan?.status || "--"} • {signalText}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{
                    color: passed
                      ? C.green
                      : score >= minimum - 5
                      ? C.gold
                      : C.muted,
                    fontSize: 13,
                    fontWeight: "900",
                  }}>
                    {score}/{minimum}
                  </Text>
                  <Text style={{
                    color: passed ? C.green : C.muted,
                    fontSize: 8,
                    fontWeight: "900",
                    marginTop: 2,
                  }}>
                    {passed ? "QUALIFIED" : "WAIT"}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={{
            color: C.muted,
            fontSize: 10,
            lineHeight: 16,
          }}>
            Bot ke next scan ke baad tino indices ka score yahan dikhega.
          </Text>
        )}

        <Text style={{
          color: C.sub,
          fontSize: 10,
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: 1.1,
          marginTop: 14,
          marginBottom: 6,
        }}>
          Active Positions
        </Text>

        {activePortfolioTrades.length > 0 ? (
          activePortfolioTrades.map((trade, index) => {
            const allocation =
              trade?.allocation_pct != null
                ? Number(trade.allocation_pct).toFixed(0)
                : index === 0
                ? "50"
                : "40";
            const livePnl = Number(
              trade?.unrealized_pnl ??
              trade?.pnl ??
              0
            );

            return (
              <View
                key={trade?.id || `${trade?.symbol}-${index}`}
                style={{
                  backgroundColor: C.s2,
                  borderRadius: 11,
                  borderWidth: 1,
                  borderColor:
                    livePnl >= 0
                      ? C.green + "44"
                      : C.red + "44",
                  padding: 10,
                  marginBottom: 8,
                }}
              >
                <Row style={{
                  justifyContent: "space-between",
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: C.text,
                      fontSize: 12,
                      fontWeight: "900",
                    }}>
                      {trade?.underlying || trade?.symbol || "--"} {trade?.side || ""}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: C.muted,
                        fontSize: 9,
                        marginTop: 3,
                      }}
                    >
                      {trade?.symbol || "--"}
                    </Text>
                  </View>

                  <Tag
                    label={`SLOT ${trade?.capital_slot || index + 1} • ${allocation}%`}
                    color={index === 0 ? C.green : C.blue}
                  />
                </Row>

                <View style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 9,
                }}>
                  {[
                    ["Qty", trade?.qty ?? "--"],
                    ["Entry", trade?.entry_price != null ? `₹${Number(trade.entry_price).toFixed(2)}` : "--"],
                    ["LTP", trade?.current_price != null ? `₹${Number(trade.current_price).toFixed(2)}` : "--"],
                    ["SL", trade?.sl_price != null ? `₹${Number(trade.sl_price).toFixed(2)}` : "--"],
                  ].map(([label, value]) => (
                    <View
                      key={label}
                      style={{
                        width: "47%",
                      }}
                    >
                      <Text style={{
                        color: C.muted,
                        fontSize: 8,
                        fontWeight: "800",
                      }}>
                        {label}
                      </Text>
                      <Text style={{
                        color: C.text,
                        fontSize: 11,
                        fontWeight: "900",
                        marginTop: 2,
                      }}>
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={{
                  color: livePnl >= 0 ? C.green : C.red,
                  fontSize: 13,
                  fontWeight: "900",
                  textAlign: "right",
                  marginTop: 8,
                }}>
                  {livePnl >= 0 ? "+" : ""}₹{livePnl.toFixed(2)}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={{
            color: C.muted,
            fontSize: 10,
          }}>
            Abhi koi open position nahi hai.
          </Text>
        )}
      </Card>

      {/* Start/Stop/Refresh */}
      <Row style={{ gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Btn label={hi ? "Bot Start Karo" : "Start Bot"} icon="▶️" color={C.green} loading={saving}
            onPress={handleStart} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn label={hi ? "Bot Stop Karo" : "Stop Bot"} icon="⏹️" color={C.red} loading={saving}
            onPress={handleStop} />
        </View>
      </Row>
      <Btn label={hi ? "Status Refresh Karo" : "Refresh Status"} icon="🔄" color={C.blue} loading={loading} onPress={load} />

      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 15, fontWeight: "900", marginBottom: 4 }}>
          📅 {hi ? "Graph History" : "Graph History"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 10, lineHeight: 16, marginBottom: 11 }}>
          {hi
            ? "Aaj ya pichhle 7/30 din ka Score, Price aur P&L data dekho."
            : "View Score, Price and P&L for today or the previous 7/30 days."}
        </Text>
        <Row style={{ gap: 8 }}>
          {[
            [1, hi ? "AAJ" : "TODAY"],
            [7, "7 DAYS"],
            [30, "30 DAYS"],
          ].map(([days, label]) => {
            const active = chartRangeDays === days;
            return (
              <TouchableOpacity
                key={days}
                disabled={chartLoading || loading}
                onPress={() => selectChartRange(days)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: active ? C.blue + "28" : C.s2,
                  borderWidth: 1,
                  borderColor: active ? C.blue : C.border,
                  opacity: chartLoading || loading ? 0.65 : 1,
                }}>
                <Text style={{
                  color: active ? C.blue : C.muted,
                  fontSize: 10,
                  fontWeight: "900",
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Row>
        <Text style={{ color: C.muted, fontSize: 9, marginTop: 9, textAlign: "center" }}>
          {chartLoading
            ? "History load ho rahi hai..."
            : `${chartMeta?.count || chartCandles.length || 0} candles • ${chartMeta?.score_count || replayScorePoints.length || savedScorePoints.length || 0} score points • ${chartMeta?.source || "LIVE"}`}
        </Text>
      </Card>

      {/* Detailed intraday charts */}
      <Card>
        <Row style={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 3,
        }}>
          <View>
            <Text style={{
              color: C.sub,
              fontSize: 10,
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}>
              Score History
            </Text>
            <Text style={{
              color: C.muted,
              fontSize: 9,
              marginTop: 3,
            }}>
              {`Signal quality • Entry line ${activeEntryThreshold} • ${scoreSourceLabel}`}
            </Text>
          </View>

          <Tag
            label={
              latestScore != null
                ? `${latestScore.toFixed(0)}/100`
                : "NO DATA"
            }
            color={
              latestScore == null
                ? C.muted
                : latestScore >= activeEntryThreshold
                ? C.green
                : latestScore >= Math.max(50, activeEntryThreshold - 17)
                ? C.gold
                : C.red
            }
          />
        </Row>

        <DetailedLineChart
          points={scorePoints}
          color={C.accent}
          height={205}
          minValue={0}
          maxValue={100}
          threshold={activeEntryThreshold}
          thresholdLabel={`ENTRY ${activeEntryThreshold}`}
          yAxisTitle="Score"
          valueFormatter={(value) =>
            Number(value).toFixed(0)
          }
          emptyMessage={
            chartRangeDays > 1
              ? "Historical candles par strategy replay score prepare ho raha hai. Pull-down refresh karein."
              : "Bot start hone aur real signal points aane ke baad score line dikhegi."
          }
        />
      </Card>

      <Card>
        <Row style={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 3,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: C.sub,
              fontSize: 10,
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}>
              Price Movement
            </Text>
            <Text style={{
              color: C.blue,
              fontSize: 11,
              fontWeight: "900",
              marginTop: 3,
            }}>
              {primaryInstrument}
            </Text>
            <Text style={{
              color: C.muted,
              fontSize: 9,
              fontWeight: "700",
              marginTop: 3,
            }}>
              {chartRangeDays === 1
                ? "3-minute candles • Swipe left/right"
                : `${String(chartMeta?.interval || "HISTORICAL").replaceAll("_", " ")} • Last ${chartRangeDays} days`}
            </Text>
          </View>

          <View style={{
            alignItems: "flex-end",
            marginLeft: 10,
          }}>
            <Text style={{
              color: C.text,
              fontSize: 13,
              fontWeight: "900",
            }}>
              {latestPrice != null
                ? chartPriceNumber(latestPrice)
                : "--"}
            </Text>
            <Text style={{
              color: priceMoveColor,
              fontSize: 10,
              fontWeight: "900",
              marginTop: 2,
            }}>
              {latestPrice != null
                ? `${priceChange >= 0 ? "+" : ""}${chartPriceNumber(priceChange)} (${priceChangePercent >= 0 ? "+" : ""}${priceChangePercent.toFixed(2)}%)`
                : "Waiting for price"}
            </Text>
          </View>
        </Row>

        <CandlestickIndicatorChart
          candles={displayCandles}
          height={350}
          emptyMessage={chartEmptyMessage}
        />
      </Card>

      <Card>
        <Row style={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 3,
        }}>
          <View>
            <Text style={{
              color: C.sub,
              fontSize: 10,
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}>
              Paper Trade P&L
            </Text>
            <Text style={{
              color: C.muted,
              fontSize: 9,
              marginTop: 3,
            }}>
              {chartRangeDays === 1
                ? "Today cumulative"
                : `Last ${chartRangeDays} days cumulative`}
            </Text>
          </View>

          <Tag
            label={
              latestPnl != null
                ? chartMoney(latestPnl)
                : "NO TRADES"
            }
            color={
              latestPnl == null
                ? C.muted
                : pnlMoveColor
            }
          />
        </Row>

        <DetailedLineChart
          points={pnlPoints}
          color={C.green}
          negativeColor={C.red}
          height={205}
          includeZero
          yAxisTitle="P&L ₹"
          valueFormatter={(value) =>
            `₹${chartCompactNumber(value)}`
          }
          emptyMessage={
            "Closed paper trades aane ke baad cumulative profit/loss line dikhegi."
          }
        />
      </Card>

      {/* Paper/Live Mode Switch */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>{hi ? "Trading Mode" : "Trading Mode"}</Text>
        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Btn label={hi ? "PAPER MODE" : "PAPER MODE"} color={mode === "paper" ? C.accent : C.muted}
              loading={saving} onPress={() => handleModeSelect("paper")} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label={hi ? "LIVE MODE" : "LIVE MODE"} color={mode === "live" ? C.red : C.muted}
              loading={saving} onPress={() => handleModeSelect("live")} />
          </View>
        </Row>
      </Card>

      {/* Instrument selection */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 }}>{hi ? "AUTO Scan Instruments" : "AUTO Scan Instruments"}</Text>
        <Text style={{ color: C.muted, fontSize: 9, lineHeight: 14, marginBottom: 10 }}>
          ON kiye gaye sabhi indices har cycle scan honge. CHART sirf graph display select karta hai.
        </Text>
        {["NIFTY", "BANKNIFTY", "SENSEX"].map(sym => {
          const enabled = (settings?.enabled_instruments || []).includes(sym);
          const isPrimary = chartInstrument === sym;
          return (
            <Row key={sym} style={{ justifyContent: "space-between", alignItems: "center",
              paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Row style={{ gap: 8 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: "800" }}>{sym}</Text>
                {isPrimary && <Tag label={hi ? "CHART" : "CHART"} color={C.accent} />}
              </Row>
              <Row style={{ gap: 8 }}>
                {enabled && !isPrimary && (
                  <TouchableOpacity onPress={() => setChartOnly(sym)}
                    style={{ paddingHorizontal: 10, paddingVertical: 6,
                      borderRadius: 8, borderWidth: 1, borderColor: C.border }}>
                    <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800" }}>
                      {chartLoading
                        ? (hi ? "Loading..." : "Loading...")
                        : (hi ? "Chart Karo" : "Set Chart")}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => toggleInstrument(sym)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                    backgroundColor: enabled ? C.green + "22" : C.redLo,
                    borderWidth: 1, borderColor: enabled ? C.green + "55" : C.red + "55" }}>
                  <Text style={{ color: enabled ? C.green : C.red, fontSize: 11, fontWeight: "800" }}>
                    {enabled ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              </Row>
            </Row>
          );
        })}
      </Card>

      {/* Paper capital */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>{hi ? "Paper Capital" : "Paper Capital"}</Text>
        <TextInput
          value={capitalInput}
          onChangeText={setCapitalInput}
          keyboardType="numeric"
          placeholder="100000"
          placeholderTextColor={C.muted}
          style={{ backgroundColor: C.s2, borderRadius: 10, padding: 12,
            color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 }}
        />
        <Btn label={hi ? "Capital Save Karo" : "Save Capital"} icon="💾" color={C.blue} loading={saving}
          onPress={() => {
            const val = parseFloat(capitalInput);
            if (!val || val < 1000) {
              setError(hi ? "Paper capital kam se kam ₹1000 hona chahiye." : "Paper capital must be at least ₹1000.");
              return;
            }
            saveSettings({ paper_capital: val });
          }} />
      </Card>
    </ScrollView>
  );
}






// ── Backtest Tab ────────────────────────────────────────

function BacktestTab({ token, lang }) {
  const hi = lang === "hi";
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const [period, setPeriod] = useState("daily");
  const [strategyMode, setStrategyMode] = useState("NORMAL");
  const [instrument, setInstrument] = useState("AUTO");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [capital, setCapital] = useState("100000");
  const [paperCapital, setPaperCapital] = useState("100000");
  const [capitalMsg, setCapitalMsg] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monthlyProgress, setMonthlyProgress] = useState("");

  async function loadPaperCapital() {
    try {
      const d = await apiGet("/paper/account", token);
      const cap = String(d.account?.paper_capital || 100000);
      setPaperCapital(cap);
      setCapital(cap);
    } catch {}
  }

  useEffect(() => { loadPaperCapital(); }, []);

  async function savePaperCapital() {
    setCapitalMsg("");
    setLoading(true);
    try {
      const d = await apiPostAuth("/paper/capital", {
        capital: Number(paperCapital || 100000),
        make_paper_mode: true,
      }, token);
      const cap = String(d.paper_capital || paperCapital || 100000);
      setPaperCapital(cap);
      setCapital(cap);
      setCapitalMsg(
        "✅ " + (
          hi
            ? "Paper capital update ho gaya"
            : "Paper capital updated"
        )
      );
    } catch {
      setCapitalMsg(
        hi
          ? "Paper capital update failed"
          : "Paper capital update failed"
      );
    }
    setLoading(false);
  }

  async function resetPaperCapital() {
    setCapitalMsg("");
    setLoading(true);
    try {
      const d = await apiPostAuth("/paper/reset", {
        capital: Number(paperCapital || 100000),
      }, token);
      const cap = String(d.paper_capital || paperCapital || 100000);
      setPaperCapital(cap);
      setCapital(cap);
      setCapitalMsg(
        "✅ " + (
          hi
            ? "Paper account reset ho gaya"
            : "Paper account reset"
        )
      );
    } catch {
      setCapitalMsg(
        hi
          ? "Paper reset failed"
          : "Paper reset failed"
      );
    }
    setLoading(false);
  }

  async function pollMonthlyJob(jobId) {
    for (let attempt = 0; attempt < 450; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const status = await apiGet(
        `/backtest/monthly/status/${jobId}`,
        token,
      );

      const completed = Number(status?.completed_days || 0);
      const total = Number(status?.total_days || 0);
      const currentDate = status?.current_date || "";

      if (total > 0) {
        setMonthlyProgress(
          `Monthly backtest: ${completed}/${total} days${currentDate ? ` • ${currentDate}` : ""}`,
        );
      } else {
        setMonthlyProgress(
          status?.phase === "LOGIN_AND_DATA"
            ? "Broker login aur historical data prepare ho raha hai..."
            : "Monthly backtest background me chal raha hai...",
        );
      }

      if (status?.status === "COMPLETED") {
        setMonthlyProgress("✅ Monthly backtest complete");
        return status.result;
      }

      if (
        status?.status === "FAILED" ||
        status?.status === "NOT_FOUND" ||
        status?.status === "FORBIDDEN"
      ) {
        throw new Error(
          status?.error ||
          status?.message ||
          "Monthly backtest failed",
        );
      }
    }

    throw new Error(
      "Monthly backtest abhi bhi chal raha hai. Thodi der baad dobara check karein.",
    );
  }

  async function runBacktest() {
    setLoading(true);
    setResult(null);
    setMonthlyProgress("");

    try {
      const isMonthly = period === "monthly";

      const body = {
        instrument,
        capital: Number(capital || paperCapital || 100000),
        entry_threshold: 82,
        sl_percent: 0,
        target_percent: 0,
        strategy_mode: strategyMode,
      };

      if (isMonthly) {
        body.month = month;

        setMonthlyProgress(
          "Monthly backtest job start ho raha hai...",
        );

        const started = await apiPostAuth(
          "/backtest/monthly",
          body,
          token,
        );

        if (!started?.success) {
          throw new Error(
            started?.message ||
            started?.error ||
            "Monthly job start failed",
          );
        }

        if (started?.job_id) {
          setMonthlyProgress(
            "Monthly backtest background me start ho gaya...",
          );
          const finalResult = await pollMonthlyJob(
            started.job_id,
          );
          setResult(finalResult);
        } else {
          // Backward compatibility with the old synchronous route.
          setResult(started);
        }
      } else {
        body.date = date;

        const dailyResult = await apiPostAuth(
          "/backtest/run",
          body,
          token,
        );
        setResult(dailyResult);
      }
    } catch (error) {
      setResult({
        success: false,
        message:
          error?.message ||
          (hi
            ? "Backtest server error"
            : "Backtest server error"),
      });
    } finally {
      setLoading(false);
    }
  }

  const summary = result?.summary;
  const isMonthlyResult =
    result?.period === "MONTHLY" ||
    summary?.period === "MONTHLY";

  function tradeTitle(t) {
    const tradeDate =
      t.date ||
      String(t.entry_time || "").slice(0, 10) ||
      "--";
    const entryTime =
      String(t.entry_time || t.time || "")
        .split("T")[1]
        ?.slice(0, 5) || "";
    const symbol =
      t.instrument ||
      String(t.symbol || "").split(" ")[0] ||
      instrument;

    return `${tradeDate}${entryTime ? " " + entryTime : ""} • ${symbol} ${t.side || ""}`;
  }

  function tradeEntry(t) {
    return t.entry_price ?? t.entry ?? "--";
  }

  function tradeExit(t) {
    return t.exit_price ?? t.exit ?? "--";
  }

  const autoIndexBreakdown = (() => {
    if (instrument !== "AUTO") return [];
    const symbols = ["NIFTY", "BANKNIFTY", "SENSEX"];
    const rows = Object.fromEntries(symbols.map((symbol) => [symbol, {
      instrument: symbol,
      tested_days: 0,
      candles: 0,
      generated_trades: 0,
      selected_trades: 0,
      max_score: null,
      volume_available_days: 0,
      volume_neutral_days: 0,
    }]));

    for (const day of result?.days || []) {
      const per = day?.per_instrument || {};
      for (const symbol of symbols) {
        const info = per?.[symbol];
        if (!info || typeof info !== "object") continue;
        const row = rows[symbol];
        row.tested_days += 1;
        row.candles += Number(info.candles || 0);
        row.generated_trades += Number(info.trades || 0);
        row.selected_trades += Number(info.selected_trades || 0);
        if (info.max_score != null) {
          row.max_score = row.max_score == null
            ? Number(info.max_score)
            : Math.max(row.max_score, Number(info.max_score));
        }
        if (info.volume_available === true) row.volume_available_days += 1;
        if (info.volume_available === false) row.volume_neutral_days += 1;
      }
    }
    return symbols.map((symbol) => rows[symbol]);
  })();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 16,
        gap: 12,
        paddingBottom: 100,
      }}
    >
      <Card glow={C.green}>
        <Text style={{
          color: C.text,
          fontSize: 18,
          fontWeight: "900",
          marginBottom: 6,
        }}>
          💰 {hi ? "Paper Capital" : "Paper Capital"}
        </Text>

        <Text style={{
          color: C.muted,
          fontSize: 12,
          marginBottom: 12,
        }}>
          {hi
            ? "Paper mode aur Backtest dono ke liye capital update karo."
            : "Update capital for Paper Mode and Backtest."}
        </Text>

        <TextInput
          style={[st.input, { marginBottom: 12 }]}
          value={paperCapital}
          onChangeText={(value) => {
            setPaperCapital(value);
            setCapital(value);
          }}
          keyboardType="numeric"
          placeholder="100000"
          placeholderTextColor={C.muted}
        />

        <Row style={{ gap: 10 }}>
          <Btn
            label="Update"
            icon="💾"
            color={C.green}
            loading={loading}
            onPress={savePaperCapital}
            style={{ flex: 1 }}
          />
          <Btn
            label="Reset P&L"
            icon="♻️"
            color={C.gold}
            onPress={resetPaperCapital}
            style={{ flex: 1 }}
          />
        </Row>

        {!!capitalMsg && (
          <Text style={{
            color: capitalMsg.includes("✅")
              ? C.green
              : C.red,
            marginTop: 10,
            fontWeight: "900",
            fontSize: 12,
          }}>
            {capitalMsg}
          </Text>
        )}
      </Card>

      <Card glow={C.purple}>
        <Text style={{
          color: C.text,
          fontSize: 18,
          fontWeight: "900",
          marginBottom: 12,
        }}>
          🧪 {hi ? "Backtest Strategy" : "Backtest Strategy"}
        </Text>

        <Row style={{ gap: 8, marginBottom: 12 }}>
          {[
            ["daily", "DAILY"],
            ["monthly", "MONTHLY"],
          ].map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => {
                setPeriod(value);
                setResult(null);
              }}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor:
                  period === value
                    ? C.blueLo
                    : C.s2,
                borderWidth: 1,
                borderColor:
                  period === value
                    ? C.blue
                    : C.border,
                alignItems: "center",
              }}
            >
              <Text style={{
                color:
                  period === value
                    ? C.blue
                    : C.muted,
                fontWeight: "900",
                fontSize: 12,
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </Row>

        <Text style={{
          color: C.muted,
          fontSize: 11,
          fontWeight: "800",
          marginBottom: 6,
        }}>
          Strategy Mode
        </Text>

        <View style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
        }}>
          {[
            ["NORMAL", "NORMAL"],
            ["HERO_ZERO", "HERO ZERO"],
            ["COMBINED", "COMBINED"],
          ].map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => {
                setStrategyMode(value);
                setResult(null);
              }}
              style={{
                width:
                  value === "COMBINED"
                    ? "100%"
                    : "48%",
                padding: 11,
                borderRadius: 12,
                backgroundColor:
                  strategyMode === value
                    ? C.orangeLo
                    : C.s2,
                borderWidth: 1,
                borderColor:
                  strategyMode === value
                    ? C.orange
                    : C.border,
                alignItems: "center",
              }}
            >
              <Text style={{
                color:
                  strategyMode === value
                    ? C.orange
                    : C.muted,
                fontWeight: "900",
                fontSize: 11,
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {strategyMode !== "NORMAL" && (
          <View style={{
            backgroundColor: C.orangeLo,
            borderWidth: 1,
            borderColor: C.orange + "55",
            borderRadius: 12,
            padding: 10,
            marginBottom: 10,
          }}>
            <Text style={{
              color: C.orange,
              fontSize: 11,
              fontWeight: "900",
              marginBottom: 4,
            }}>
              Hero Zero Protected Rules
            </Text>
            <Text style={{
              color: C.muted,
              fontSize: 10,
              lineHeight: 16,
            }}>
              NIFTY: Every Tuesday{"\n"}
              BANKNIFTY: Last Tuesday • SENSEX: Thursday{"\n"}
              14:30–15:00 Entry • 15:25 Force Exit{"\n"}
              Score 82 • Premium ₹0.50–₹10 • Max ₹2,000
            </Text>
          </View>
        )}

        <View style={{
          backgroundColor: C.accentLo,
          borderWidth: 1,
          borderColor: C.accent + "55",
          borderRadius: 12,
          padding: 10,
          marginBottom: 10,
        }}>
          <Text style={{
            color: C.accent,
            fontSize: 11,
            fontWeight: "900",
            marginBottom: 3,
          }}>
            AUTO = NIFTY + BANKNIFTY + SENSEX
          </Text>
          <Text style={{
            color: C.muted,
            fontSize: 10,
            lineHeight: 16,
          }}>
            Jahan pehla valid 82+ setup milega wahi trade select hogi. Ek time par sirf ek trade.
          </Text>
        </View>

        <View style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}>
          {[
            "AUTO",
            "NIFTY",
            "BANKNIFTY",
            "SENSEX",
          ].map((value) => (
            <TouchableOpacity
              key={value}
              onPress={() => setInstrument(value)}
              style={{
                width: "48%",
                padding: 12,
                borderRadius: 12,
                backgroundColor:
                  instrument === value
                    ? C.accentLo
                    : C.s2,
                borderWidth: 1,
                borderColor:
                  instrument === value
                    ? C.accent
                    : C.border,
                alignItems: "center",
              }}
            >
              <Text style={{
                color:
                  instrument === value
                    ? C.accent
                    : C.muted,
                fontWeight: "900",
                fontSize: 11,
              }}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={{
            color: C.muted,
            fontSize: 11,
            fontWeight: "800",
            marginBottom: 5,
          }}>
            {period === "monthly"
              ? "Month YYYY-MM"
              : "Date YYYY-MM-DD"}
          </Text>

          <TextInput
            style={st.input}
            value={
              period === "monthly"
                ? month
                : date
            }
            onChangeText={
              period === "monthly"
                ? setMonth
                : setDate
            }
            keyboardType="default"
            placeholderTextColor={C.muted}
          />
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={{
            color: C.muted,
            fontSize: 11,
            fontWeight: "800",
            marginBottom: 5,
          }}>
            Backtest Capital
          </Text>

          <TextInput
            style={st.input}
            value={capital}
            onChangeText={setCapital}
            keyboardType="numeric"
            placeholderTextColor={C.muted}
          />
        </View>

        <View style={{
          backgroundColor: C.greenLo,
          borderWidth: 1,
          borderColor: C.green + "44",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}>
          <Text style={{
            color: C.green,
            fontSize: 12,
            fontWeight: "900",
            marginBottom: 5,
          }}>
            Automatic Risk & Exit System
          </Text>
          <Text style={{
            color: C.muted,
            fontSize: 11,
            lineHeight: 18,
          }}>
            {strategyMode === "HERO_ZERO"
              ? (
                <>
                  Hero Zero: Score 82 • Capital Max ₹2,000{"\n"}
                  50% SL • 100% Target • Gamma Estimate{"\n"}
                  Instrument Expiry • Force Exit 15:25
                </>
              )
              : strategyMode === "COMBINED"
              ? (
                <>
                  Normal: 90% Capital • ATR Dynamic Exit{"\n"}
                  Hero Zero: Expiry Calendar • Max ₹2,000{"\n"}
                  One Open Trade at a Time
                </>
              )
              : (
                <>
                  Score 82 Fixed • 90% Capital • Whole Lots{"\n"}
                  Pure ATR SL • Dynamic Profit Lock{"\n"}
                  True Opposite V2 • No Fixed Target
                </>
              )}
          </Text>
        </View>

        <Btn
          label={
            `${strategyMode === "HERO_ZERO"
              ? "Hero Zero "
              : strategyMode === "COMBINED"
              ? "Combined "
              : ""}${period === "monthly"
              ? "Monthly Backtest"
              : "Daily Backtest"}`
          }
          icon="▶️"
          color={C.green}
          loading={loading}
          onPress={runBacktest}
        />

        {period === "monthly" && loading && (
          <Text style={{
            color: C.gold,
            fontSize: 11,
            lineHeight: 17,
            marginTop: 10,
            textAlign: "center",
          }}>
            {monthlyProgress ||
              "Monthly backtest background me chalega. Screen open rakhein; progress yahan dikhegi."}
          </Text>
        )}
      </Card>

      {result?.success === false && (
        <ErrorBox
          msg={
            result?.message ||
            result?.error ||
            "Backtest failed"
          }
        />
      )}

      {summary && (
        <Card
          glow={
            Number(summary.net_pnl || 0) >= 0
              ? C.green
              : C.red
          }
        >
          <Text style={{
            color: C.text,
            fontSize: 16,
            fontWeight: "900",
            marginBottom: 12,
          }}>
            📌 {isMonthlyResult
              ? "Monthly Result"
              : "Backtest Result"}
          </Text>

          {[
            ...(isMonthlyResult
              ? [
                  ["Month", summary.month || result?.month],
                  ["Tested Days", summary.tested_days],
                  ["Skipped Days", summary.skipped_days],
                  ["Winning Days", summary.winning_days],
                  ["Losing Days", summary.losing_days],
                ]
              : []),
            ["Trades", summary.trades],
            ["Wins", summary.wins],
            ["Losses", summary.losses],
            ["Win Rate", `${summary.win_rate}%`],
            ["Starting Capital", `₹${summary.capital}`],
            ...(summary.normal_pnl != null
              ? [["Normal P&L", `₹${summary.normal_pnl}`]]
              : []),
            ...(summary.hero_zero_pnl != null
              ? [["Hero Zero P&L", `₹${summary.hero_zero_pnl}`]]
              : []),
            [
              "Ending Capital",
              `₹${summary.ending_capital ?? result?.ending_capital ?? "--"}`,
            ],
            ["Net P&L", `₹${summary.net_pnl}`],
            ...(isMonthlyResult
              ? [
                  [
                    "Max Drawdown",
                    `₹${summary.max_drawdown} (${summary.max_drawdown_percent}%)`,
                  ],
                ]
              : []),
          ].map(([key, value]) => (
            <Row
              key={key}
              style={{
                justifyContent: "space-between",
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Text style={{
                color: C.muted,
                fontSize: 12,
              }}>
                {key}
              </Text>
              <Text style={{
                color:
                  key === "Net P&L"
                    ? Number(summary.net_pnl || 0) >= 0
                      ? C.green
                      : C.red
                    : C.text,
                fontWeight: "900",
                fontSize: 13,
              }}>
                {value ?? "--"}
              </Text>
            </Row>
          ))}

          {!!summary.note && (
            <Text style={{
              color: C.gold,
              fontSize: 11,
              marginTop: 10,
              lineHeight: 17,
            }}>
              {summary.note}
            </Text>
          )}
        </Card>
      )}

      {isMonthlyResult && instrument === "AUTO" && autoIndexBreakdown.some(
        (row) => row.tested_days > 0
      ) && (
        <Card glow={C.blue}>
          <Text style={{
            color: C.text,
            fontSize: 16,
            fontWeight: "900",
            marginBottom: 5,
          }}>
            📊 AUTO Index Breakdown
          </Text>
          <Text style={{
            color: C.muted,
            fontSize: 10,
            lineHeight: 16,
            marginBottom: 11,
          }}>
            Generated = index strategy ne banayi trades • Selected = overlap hata kar monthly result me li gayi trades
          </Text>

          {autoIndexBreakdown.map((row) => (
            <View
              key={row.instrument}
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Row style={{ justifyContent: "space-between" }}>
                <Text style={{ color: C.text, fontWeight: "900", fontSize: 13 }}>
                  {row.instrument}
                </Text>
                <Tag
                  label={`Selected ${row.selected_trades}`}
                  color={row.selected_trades > 0 ? C.green : C.gold}
                />
              </Row>
              <Text style={{ color: C.sub, fontSize: 10, marginTop: 6 }}>
                Generated {row.generated_trades} • Max Score {row.max_score ?? "--"} • Candles {row.candles}
              </Text>
              <Text style={{ color: C.muted, fontSize: 9, marginTop: 4 }}>
                Volume: {row.volume_available_days > 0
                  ? `${row.volume_available_days} day available`
                  : row.volume_neutral_days > 0
                  ? `${row.volume_neutral_days} day neutral fallback`
                  : "not reported"}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {isMonthlyResult && result?.days?.length > 0 && (
        <Card>
          <Text style={{
            color: C.sub,
            fontSize: 10,
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 12,
          }}>
            Day-wise Monthly Result
          </Text>

          {result.days.map((day, index) => (
            <View
              key={`${day.date}-${index}`}
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Row style={{
                justifyContent: "space-between",
              }}>
                <Text style={{
                  color: C.text,
                  fontWeight: "900",
                  fontSize: 12,
                }}>
                  {day.date}
                </Text>

                <Tag
                  label={day.status || "FLAT"}
                  color={
                    day.status === "PROFIT"
                      ? C.green
                      : day.status === "LOSS"
                      ? C.red
                      : day.status === "SKIPPED"
                      ? C.gold
                      : C.muted
                  }
                />
              </Row>

              <Text style={{
                color: C.muted,
                fontSize: 11,
                marginTop: 5,
              }}>
                Trades {day.trades || 0} • W/L {day.wins || 0}/{day.losses || 0}
              </Text>

              {(day.normal_pnl != null || day.hero_zero_pnl != null) && (
                <Text style={{
                  color: C.muted,
                  fontSize: 10,
                  marginTop: 3,
                }}>
                  Normal ₹{day.normal_pnl || 0} • Hero Zero ₹{day.hero_zero_pnl || 0}
                </Text>
              )}

              <Text style={{
                color:
                  Number(day.pnl || 0) >= 0
                    ? C.green
                    : C.red,
                fontSize: 12,
                fontWeight: "900",
                marginTop: 3,
              }}>
                P&L ₹{day.pnl || 0} • Capital ₹{day.capital_end}
              </Text>

              {!!day.message && (
                <Text style={{
                  color: C.gold,
                  fontSize: 10,
                  marginTop: 4,
                }}>
                  {day.message}
                </Text>
              )}
            </View>
          ))}
        </Card>
      )}

      {result?.trades?.length > 0 && (
        <Card>
          <Text style={{
            color: C.sub,
            fontSize: 10,
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 12,
          }}>
            Trade List
          </Text>

          {result.trades.map((trade, index) => (
            <View
              key={`${trade.date || ""}-${index}`}
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Row style={{
                justifyContent: "space-between",
              }}>
                <Text style={{
                  color: C.text,
                  fontWeight: "900",
                  fontSize: 12,
                  flex: 1,
                }}>
                  {tradeTitle(trade)}
                </Text>

                <Text style={{
                  color:
                    Number(trade.pnl || 0) >= 0
                      ? C.green
                      : C.red,
                  fontWeight: "900",
                }}>
                  {Number(trade.pnl || 0) >= 0
                    ? "WIN"
                    : "LOSS"}
                </Text>
              </Row>

              <Text style={{
                color: C.muted,
                fontSize: 11,
                marginTop: 4,
              }}>
                {trade.strategy || result?.strategy_mode || "NORMAL"} • Score {trade.score ?? "--"} • Entry {tradeEntry(trade)} → Exit {tradeExit(trade)}
              </Text>

              <Text style={{
                color: C.muted,
                fontSize: 10,
                marginTop: 3,
              }}>
                {trade.lots ?? "--"} lots • Qty {trade.qty ?? "--"} • Used ₹{trade.capital_used ?? "--"}
              </Text>

              <Text style={{
                color:
                  Number(trade.pnl || 0) >= 0
                    ? C.green
                    : C.red,
                fontSize: 12,
                fontWeight: "900",
                marginTop: 3,
              }}>
                P&L ₹{trade.pnl} • {trade.reason}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function ToolsTab({
  lang,
  navigateTo,
}) {
  const hi = lang === "hi";

  const tools = [
    {
      id: "broker",
      icon: "🔗",
      title: hi
        ? "ब्रोकर"
        : "Broker",
      subtitle: "Angel One • Upstox • Zerodha",
      color: C.blue,
    },
    {
      id: "telegram",
      icon: "🔔",
      title: hi
        ? "टेलीग्राम"
        : "Telegram",
      subtitle: "Alerts and reports",
      color: C.green,
    },
    {
      id: "strategybuilder",
      icon: "🧠",
      title: hi
        ? "स्ट्रेटेजी"
        : "Strategy",
      subtitle: "Builder and scoring",
      color: C.purple,
    },
    {
      id: "backtest",
      icon: "🧪",
      title: hi
        ? "बैकटेस्ट"
        : "Backtest",
      subtitle: "Daily and monthly tests",
      color: C.gold,
    },
    {
      id: "livefeed",
      icon: "📡",
      title: hi
        ? "लाइव फीड"
        : "Live Feed",
      subtitle: "Market data status",
      color: C.green,
    },
    {
      id: "servertest",
      icon: "🖥️",
      title: hi
        ? "सर्वर टेस्ट"
        : "Server Test",
      subtitle: "Backend health check",
      color: C.orange,
    },
    {
      id: "herozero",
      icon: "🚀",
      title: "Hero Zero",
      subtitle: "Expiry-day mode",
      color: C.red,
    },
    {
      id: "guide",
      icon: "📘",
      title: hi
        ? "ऐप गाइड"
        : "App Guide",
      subtitle: "Setup and usage help",
      color: C.accent,
    },
  ];

  return (
    <ScrollView
      style={{
        flex: 1,
      }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 115,
      }}
    >
      <Card glow={C.accent}>
        <Text style={{
          color: C.text,
          fontSize: 20,
          fontWeight: "900",
        }}>
          🧰 {hi
            ? "टूल्स"
            : "Tools"}
        </Text>

        <Text style={{
          color: C.muted,
          fontSize: 11,
          lineHeight: 17,
          marginTop: 5,
        }}>
          {hi
            ? "सभी जरूरी सेटिंग और टेस्ट सीधे यहां से खोलें।"
            : "Open every important setting and test directly from here."}
        </Text>
      </Card>

      <View style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 12,
      }}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            onPress={() =>
              navigateTo(tool.id)
            }
            style={{
              width: "48.3%",
              minHeight: 125,
              backgroundColor: C.s2,
              borderRadius: 16,
              borderWidth: 1,
              borderColor:
                tool.color + "55",
              padding: 14,
              justifyContent:
                "space-between",
            }}
          >
            <View>
              <View style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                alignItems: "center",
                justifyContent:
                  "center",
                backgroundColor:
                  tool.color + "20",
                borderWidth: 1,
                borderColor:
                  tool.color + "55",
              }}>
                <Text style={{
                  fontSize: 21,
                }}>
                  {tool.icon}
                </Text>
              </View>

              <Text style={{
                color: C.text,
                fontSize: 14,
                fontWeight: "900",
                marginTop: 10,
              }}>
                {tool.title}
              </Text>

              <Text style={{
                color: C.muted,
                fontSize: 9,
                lineHeight: 14,
                marginTop: 3,
              }}>
                {tool.subtitle}
              </Text>
            </View>

            <Text style={{
              color: tool.color,
              fontSize: 11,
              fontWeight: "900",
              marginTop: 8,
            }}>
              OPEN →
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}


function MoreTab({ token, user, lang, setLang, isAdmin, navigateTo }) {
  const hi = lang === "hi";
  const [profile, setProfile] = useState(null);
  const [report, setReport] = useState(null);
  const [trades, setTrades] = useState([]);
  const [paperTrades, setPaperTrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentAvailable, setPaymentAvailable] = useState(false);
  const [paymentState, setPaymentState] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvancedGateway, setShowAdvancedGateway] = useState(false);

  async function changeLang(next) {
    setLang(next);
    try { await AsyncStorage.setItem("okai_lang", next); } catch {}
  }

  async function loadAll() {
    setLoading(true);
    try {
      const p = await apiGet("/user/profile", token);
      setProfile(p.profile || null);
    } catch {}
    try {
      const r = await apiGet("/reports/daily", token);
      setReport(r.report || null);
    } catch {}
    try {
      const h = await apiGet("/history/trades", token);
      setTrades(h.trades || []);
    } catch {}
    try {
      const ph = await apiGet("/history/paper", token);
      setPaperTrades(ph.paper_trades || []);
    } catch {}
    if (isAdmin) {
      try {
        const u = await apiGet("/admin/users-lite", token);
        setUsers(u.users || []);
      } catch {}
    }
    try {
      const config = await apiGet("/subscription/phonepe/config", token);
      setPaymentAvailable(config?.available === true);
    } catch {
      setPaymentAvailable(false);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    AsyncStorage.getItem("okai_phonepe_order_id")
      .then(value => {
        if (value) setPaymentOrderId(value);
      })
      .catch(() => {});
  }, []);

  async function startPhonePePayment() {
    setMsg("");
    setPaymentState("");
    setLoading(true);
    try {
      const d = await apiPostAuth("/subscription/phonepe/create-order", {}, token);
      if (!d?.success || !d?.checkout_url || !d?.merchant_order_id) {
        const detail = typeof d?.detail === "string"
          ? d.detail
          : "PhonePe merchant setup abhi complete nahi hai";
        setMsg(detail);
        setLoading(false);
        return;
      }
      setPaymentOrderId(d.merchant_order_id);
      setPaymentState("PENDING");
      await AsyncStorage.setItem("okai_phonepe_order_id", d.merchant_order_id);
      setMsg(hi
        ? "PhonePe/UPI checkout khul raha hai. Payment ke baad app me wapas aakar Check Payment Status dabao."
        : "PhonePe/UPI checkout is opening. After payment, return to the app and tap Check Payment Status.");
      await Linking.openURL(d.checkout_url);
    } catch {
      setMsg(hi ? "PhonePe checkout open nahi hua" : "Could not open PhonePe checkout");
    }
    setLoading(false);
  }

  async function checkPhonePePayment() {
    setMsg("");
    const orderId = paymentOrderId || await AsyncStorage.getItem("okai_phonepe_order_id");
    if (!orderId) {
      setMsg(hi ? "Pehle payment start karo" : "Start the payment first");
      return;
    }
    setLoading(true);
    try {
      const d = await apiGet(
        `/subscription/phonepe/status/${encodeURIComponent(orderId)}`,
        token
      );
      const state = String(d?.state || "PENDING").toUpperCase();
      setPaymentState(state);
      if (d?.subscription_active) {
        setMsg(hi
          ? "✅ Payment verify ho gaya. 30 din ka plan active hai."
          : "✅ Payment verified. Your 30-day plan is active.");
        await AsyncStorage.removeItem("okai_phonepe_order_id");
        setPaymentOrderId("");
        await loadAll();
      } else if (state === "FAILED") {
        setMsg(hi ? "Payment failed. Dobara try karo." : "Payment failed. Please try again.");
      } else {
        setMsg(hi
          ? "Payment abhi pending hai. UPI app me status check karke phir refresh karo."
          : "Payment is still pending. Check your UPI app and refresh again.");
      }
    } catch {
      setMsg(hi ? "Payment status check nahi hua" : "Could not check payment status");
    }
    setLoading(false);
  }

  async function resetAll() {
    Alert.alert(
      hi ? "Reset All Settings?" : "Reset All Settings?",
      hi ? "Strategy, paper P&L aur bot status reset hoga. Broker credentials delete nahi honge." : "Strategy, paper P&L and bot status will reset. Broker credentials will not be removed.",
      [
        { text: hi ? "Cancel" : "Cancel", style: "cancel" },
        {
          text: hi ? "Reset" : "Reset",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const d = await apiPostAuth("/settings/reset-all", { paper_capital: 100000 }, token);
              setMsg(d.message || "Reset done");
              await loadAll();
            } catch {
              setMsg(hi ? "Reset failed" : "Reset failed");
            }
            setLoading(false);
          }
        }
      ]
    );
  }

  const profileRows = profile ? [
    ["Name", profile.name || "--"],
    ["Email", profile.email || "--"],
    ["Subscription", profile.subscription_status || "--"],
    ["Trial Ends", profile.trial_ends_at || "--"],
    ["Mode", String(profile.trading_mode || "paper").toUpperCase()],
    ["Paper Capital", `₹${profile.paper_capital || 0}`],
  ] : [];

  const reportRows = report ? [
    ["Date", report.date],
    ["Mode", String(report.trading_mode || "paper").toUpperCase()],
    ["Paper Capital", `₹${report.paper_capital}`],
    ["Paper Equity", `₹${report.paper_equity}`],
    ["Live Trades", report.live_trade_count],
    ["Paper Trades", report.paper_trade_count],
    ["Backtests", report.backtest_count],
    ["Total P&L", `₹${report.total_pnl}`],
  ] : [];

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={loadAll} tintColor={C.blue} colors={[C.blue]} />}>

<Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 6 }}>
          🌐 {hi ? "भाषा" : "Language"}
        </Text>
        <Row style={{ gap: 10 }}>
          <Btn label={hi ? "हिंदी" : "Hindi"} icon="🇮🇳" color={lang==="hi"?C.green:C.muted}
            onPress={() => changeLang("hi")} style={{ flex: 1 }} />
          <Btn label={hi ? "अंग्रेज़ी" : "English"} icon="🇬🇧" color={lang==="en"?C.blue:C.muted}
            onPress={() => changeLang("en")} style={{ flex: 1 }} />
        </Row>
      </Card>

      {/* LOCAL_GATEWAY_ADVANCED_SETUP_V1 */}
      <Card glow={C.purple}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: showAdvancedGateway }}
          onPress={() => setShowAdvancedGateway(!showAdvancedGateway)}
          style={{ flexDirection: "row", justifyContent: "space-between",
            alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>
              🛡️ {hi ? "Advanced Setup" : "Advanced Setup"}
            </Text>
            <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>
              {hi
                ? "सिर्फ अपने static-IP phone/desktop से LIVE orders चलाने वाले users के लिए"
                : "Only for users running LIVE orders through their own static-IP phone or desktop"}
            </Text>
          </View>
          <Text style={{ color: C.purple, fontSize: 20, fontWeight: "900" }}>
            {showAdvancedGateway ? "⌃" : "⌄"}
          </Text>
        </TouchableOpacity>

        {showAdvancedGateway && (
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1,
            borderTopColor: C.border }}>
            <View style={{ backgroundColor: C.goldLo, borderRadius: 10, padding: 10,
              borderWidth: 1, borderColor: C.gold + "44", marginBottom: 11 }}>
              <Text style={{ color: C.gold, fontSize: 10, lineHeight: 16, fontWeight: "800" }}>
                {hi
                  ? "Angel API key, MPIN और TOTP app में नहीं भरने हैं। वे केवल user के gateway device पर रहेंगे।"
                  : "Do not enter Angel API key, MPIN or TOTP in the app. They stay only on the user's gateway device."}
              </Text>
            </View>
            <Btn
              label={hi ? "Local Gateway खोलें" : "Open Local Gateway"}
              icon="🖥️"
              color={C.purple}
              onPress={() => navigateTo && navigateTo("localgateway")}
            />
          </View>
        )}
      </Card>

      <Card glow={C.green}>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>
            👤 {hi ? "प्रोफ़ाइल / सदस्यता" : "Profile / Subscription"}
          </Text>
          <TouchableOpacity onPress={loadAll}>
            <Text style={{ color: C.blue, fontWeight: "900" }}>{hi ? "रीफ़्रेश करें" : "Refresh"}</Text>
          </TouchableOpacity>
        </Row>
        {profileRows.map(([k, v]) => (
          <Row key={k} style={{ justifyContent: "space-between", paddingVertical: 6,
            borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>{k}</Text>
            <Text style={{ color: C.text, fontWeight: "900", fontSize: 12, maxWidth: "58%", textAlign: "right" }}>{String(v)}</Text>
          </Row>
        ))}
      </Card>

      <Card glow={report?.total_pnl >= 0 ? C.green : C.red}>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
          📊 {hi ? "दैनिक लाभ/हानि रिपोर्ट" : "Daily P&L Report"}
        </Text>
        {reportRows.map(([k, v]) => (
          <Row key={k} style={{ justifyContent: "space-between", paddingVertical: 6,
            borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>{k}</Text>
            <Text style={{ color: k==="Total P&L" ? (report?.total_pnl>=0?C.green:C.red) : C.text,
              fontWeight: "900", fontSize: 12 }}>{String(v)}</Text>
          </Row>
        ))}
      </Card>

      <Card>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
          📜 {hi ? "वास्तविक ट्रेड इतिहास" : "Live Trade History"}
        </Text>
        {trades.length === 0 && <Text style={{ color: C.muted }}>{hi ? "अभी वास्तविक ट्रेड इतिहास उपलब्ध नहीं है।" : "No live trade history yet."}</Text>}
        {trades.slice(0, 8).map((t, i) => (
          <View key={i} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.text, fontWeight: "900" }}>{t.symbol || t.instrument || t.trading_symbol || "TRADE"}</Text>
            <Text style={{ color: C.muted, fontSize: 11 }}>{JSON.stringify(t).slice(0, 160)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
          📝 {hi ? "पेपर ट्रेड इतिहास" : "Paper Trade History"}
        </Text>
        {paperTrades.length === 0 && <Text style={{ color: C.muted }}>{hi ? "अभी पेपर ट्रेड इतिहास उपलब्ध नहीं है।" : "No paper trade history yet."}</Text>}
        {paperTrades.slice(0, 8).map((t, i) => (
          <View key={i} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Text style={{ color: C.text, fontWeight: "900" }}>{t.symbol || "PAPER"}</Text>
              <Text style={{ color: Number(t.pnl || 0) >= 0 ? C.green : C.red, fontWeight: "900" }}>₹{t.pnl || 0}</Text>
            </Row>
            <Text style={{ color: C.muted, fontSize: 11 }}>{t.reason || t.status || "--"}</Text>
          </View>
        ))}
      </Card>

      <Card glow={C.gold}>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>
              💳 OKAI Monthly Plan
            </Text>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
              {hi ? "30 din ka software access" : "30 days of software access"}
            </Text>
          </View>
          <Tag label="₹1,999" color={C.gold} />
        </Row>

        {["Full OKAI access", "Paper + Live tools", "Strategy + Backtest", "Trade alerts + Reports"].map(item => (
          <Row key={item} style={{ marginBottom: 7 }}>
            <Text style={{ color: C.green, marginRight: 8 }}>✓</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>{item}</Text>
          </Row>
        ))}

        <View style={{ backgroundColor: C.s1, borderRadius: 10, padding: 10,
          borderWidth: 1, borderColor: C.blue+"44", marginTop: 6, marginBottom: 12 }}>
          <Text style={{ color: C.blue, fontSize: 11, lineHeight: 17, fontWeight: "800" }}>
            PhonePe checkout me PhonePe, Google Pay, Paytm, BHIM ya kisi bhi supported UPI app se payment kar sakte hain.
          </Text>
        </View>

        <Btn label="Pay ₹1,999 with PhonePe / UPI" icon="📲" color={C.green}
          loading={loading} onPress={startPhonePePayment} />

        {!!paymentOrderId && (
          <View style={{ marginTop: 10 }}>
            <Btn label="Check Payment Status" icon="🔄" color={C.blue}
              loading={loading} onPress={checkPhonePePayment} />
            <Text style={{ color: C.muted, fontSize: 10, marginTop: 7, textAlign: "center" }}>
              Order: {paymentOrderId} {paymentState ? `• ${paymentState}` : ""}
            </Text>
          </View>
        )}

        {!paymentAvailable && (
          <Text style={{ color: C.gold, fontSize: 10, lineHeight: 15, marginTop: 9 }}>
            PhonePe merchant onboarding/credentials complete hote hi live payment active ho jayega.
          </Text>
        )}
        <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 8 }}>
          Manual renewal every 30 days. Payment success PhonePe server se verify hone ke baad hi plan active hoga.
        </Text>
      </Card>

      {isAdmin && (
        <Card glow={C.purple}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
            👑 {hi ? "Admin User List" : "Admin User List"}
          </Text>
          {users.slice(0, 20).map((u, i) => (
            <View key={i} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.text, fontWeight: "900" }}>{u.name || "User"} • #{u.id}</Text>
              <Text style={{ color: C.muted, fontSize: 11 }}>{u.email || "--"} • {u.subscription_status || "--"}</Text>
            </View>
          ))}
        </Card>
      )}

      <Card glow={C.red}>
        <Text style={{ color: C.red, fontSize: 18, fontWeight: "900", marginBottom: 8 }}>
          ⚠️ {hi ? "वास्तविक मोड चेतावनी" : "Live Mode Warning"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 19, marginBottom: 12 }}>
          {hi ? "वास्तविक मोड में असली ऑर्डर लग सकते हैं। पहले पेपर मोड और बैकटेस्ट से परीक्षण करें।" : "Live mode can place real orders. Test with Paper Mode and Backtest first."}
        </Text>
        <Btn label={hi ? "सभी सेटिंग्स रीसेट करें" : "Reset All Settings"} icon="♻️" color={C.red}
          loading={loading} onPress={resetAll} />
      </Card>

      {!!msg && (
        <Card glow={msg.includes("failed") ? C.red : C.green}>
          <Text style={{ color: msg.includes("failed") ? C.red : C.green, fontWeight: "900" }}>{msg}</Text>
        </Card>
      )}
    </ScrollView>
  );
}


// ── Guide + Language Tab ────────────────────────────────────────
function GuideTab({ lang, setLang }) {
  const isHi = lang === "hi";

  async function changeLang(next) {
    setLang(next);
    try { await AsyncStorage.setItem("okai_lang", next); } catch {}
  }

  const guideHi = [
    ["1. लॉगिन", "अपने ईमेल और पासवर्ड से ऐप में लॉगिन करें।"],
    ["2. ब्रोकर कनेक्ट", "ब्रोकर टैब में Angel One / Zerodha / Upstox की जानकारी सेव करें। पेपर मोड के लिए ब्रोकर वैकल्पिक है, लेकिन वास्तविक मोड के लिए ब्रोकर आवश्यक है।"],
    ["3. पेपर मोड", "डिफ़ॉल्ट मोड पेपर है। इसमें वास्तविक ऑर्डर नहीं लगता। अभ्यास और परीक्षण के लिए यह सुरक्षित है।"],
    ["4. पेपर कैपिटल", "बैकटेस्ट टैब में पेपर कैपिटल अपडेट करें। यही राशि पेपर ट्रेडिंग और बैकटेस्ट दोनों में उपयोग होगी।"],
    ["5. स्कोर सेटिंग", "स्कोर टैब में Safe / Default / Aggressive / Custom रणनीति चुनें। एंट्री स्कोर, हानि सीमा, लक्ष्य और अधिकतम ट्रेड बदल सकते हैं।"],
    ["6. बैकटेस्ट", "बैकटेस्ट टैब में NIFTY / BANKNIFTY / SENSEX चुनकर रणनीति का परिणाम देखें।"],
    ["7. टेलीग्राम", "टेलीग्राम टैब में Bot Token और Chat ID सेव करें। बॉट अलर्ट, रणनीति अपडेट और बैकटेस्ट परिणाम टेलीग्राम पर मिलेंगे।"],
    ["8. वास्तविक मोड", "वास्तविक मोड केवल तब चालू करें जब ब्रोकर कनेक्ट हो और रणनीति पेपर मोड में परीक्षण हो चुकी हो। वास्तविक मोड में असली ऑर्डर लग सकता है।"]
  ];

  const guideEn = [
    ["1. Login", "Login with your app email and password."],
    ["2. Broker Connect", "Save Angel One / Zerodha / Upstox credentials in the Broker tab. Broker is optional for Paper mode, required for Live mode."],
    ["3. Paper Mode", "Paper mode is the default safe mode. It does not place real orders."],
    ["4. Paper Capital", "Update Paper Capital in the Backtest tab. The same capital is used for paper trading and backtesting."],
    ["5. Score Customize", "Use the Score tab to choose Safe / Default / Aggressive / Custom strategy. You can change entry score, SL, target, and max trades."],
    ["6. Backtest", "Use the Backtest tab to test strategy results for NIFTY / BANKNIFTY / SENSEX."],
    ["7. Telegram", "Save Bot Token and Chat ID in the Telegram tab. Bot alerts, strategy updates, and backtest results will be sent to Telegram."],
    ["8. Live Mode", "Enable Live mode only after broker connection and paper testing. Live mode can place real orders."]
  ];

  const list = isHi ? guideHi : guideEn;

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
      <UpstoxSetupGuide />

      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginBottom: 6 }}>
          🌐 {isHi ? "भाषा" : "Language"}
        </Text>

        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          {isHi ? "ऐप गाइड हिंदी और अंग्रेज़ी दोनों में देख सकते हैं।" : "You can view the app guide in Hindi or English."}
        </Text>

        <Row style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => changeLang("hi")}
            style={{ flex: 1, padding: 14, borderRadius: 12,
              backgroundColor: lang==="hi" ? C.greenLo : C.s2,
              borderWidth: 1,
              borderColor: lang==="hi" ? C.green : C.border,
              alignItems: "center" }}>
            <Text style={{ color: lang==="hi" ? C.green : C.muted, fontWeight: "900" }}>
              🇮🇳 हिंदी
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => changeLang("en")}
            style={{ flex: 1, padding: 14, borderRadius: 12,
              backgroundColor: lang==="en" ? C.blueLo : C.s2,
              borderWidth: 1,
              borderColor: lang==="en" ? C.blue : C.border,
              alignItems: "center" }}>
            <Text style={{ color: lang==="en" ? C.blue : C.muted, fontWeight: "900" }}>
              🇬🇧 English
            </Text>
          </TouchableOpacity>
        </Row>
      </Card>

      <Card glow={C.gold}>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginBottom: 6 }}>
          📘 {isHi ? "ऐप गाइड" : "App Guide"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          {isHi ? "Option King AI उपयोग करने की सरल चरण-दर-चरण गाइड।" : "Simple step-by-step guide to use Option King AI."}
        </Text>

        {list.map(([title, desc], i) => (
          <View key={i} style={{
            paddingVertical: 12,
            borderBottomWidth: i === list.length - 1 ? 0 : 1,
            borderBottomColor: C.border
          }}>
            <Text style={{ color: C.text, fontSize: 14, fontWeight: "900", marginBottom: 4 }}>
              {title}
            </Text>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 19 }}>
              {desc}
            </Text>
          </View>
        ))}
      </Card>

      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginBottom: 6 }}>
          🔗 {isHi ? "ब्रोकर सेटअप गाइड" : "Broker Setup Guide"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>
          {isHi
            ? "हर ब्रोकर के लिए रजिस्ट्रेशन से लेकर क्रेडेंशियल्स भरने तक पूरे चरण।"
            : "Full steps from registration to filling in credentials, for each broker."}
        </Text>

        {/* Angel One */}
        <Text style={{ color: C.blue, fontSize: 15, fontWeight: "900", marginBottom: 8 }}>
          🅰️ Angel One {isHi ? "(मुफ़्त)" : "(Free)"}
        </Text>
        {(isHi ? [
          ["1. Account खोलें", "angelone.in पर जाकर demat account खोलें और F&O trading permission चालू करवाएं।"],
          ["2. SmartAPI Register", "smartapi.angelbroking.com पर जाएं और Sign Up करें (अलग से, demat account से अलग)।"],
          ["3. App बनाएं", "Login के बाद 'Create New App' दबाएं। App type 'Personal' चुनें। App का कोई भी नाम दें।"],
          ["4. API Key कॉपी करें", "App बनने के बाद उसकी 'API Key' दिखेगी — उसे कॉपी करके ऐप के 'API Key' फ़ील्ड में डालें।"],
          ["5. Client ID", "यह आपका Angel One login ID है (जैसे A123456), जो आपको account खोलते समय मिला था।"],
          ["6. MPIN / API Secret", "आपका 4-digit MPIN जो आप Angel One app में login के लिए इस्तेमाल करते हैं, वही यहाँ डालें।"],
          ["7. TOTP Secret", "Angel One app → Profile → Security खोलें। 'Enable TOTP' पर जाएं — वहाँ एक secret key (QR code के नीचे text रूप में) मिलेगी। उसे कॉपी करके 'TOTP Key' फ़ील्ड में डालें।"],
        ] : [
          ["1. Open Account", "Go to angelone.in and open a demat account. Make sure F&O trading permission is enabled."],
          ["2. SmartAPI Register", "Go to smartapi.angelbroking.com and Sign Up separately (this is different from your demat account login)."],
          ["3. Create App", "After logging in, click 'Create New App'. Choose app type 'Personal'. Give it any name."],
          ["4. Copy API Key", "Once the app is created, its 'API Key' will be shown — copy it into the app's 'API Key' field."],
          ["5. Client ID", "This is your Angel One login ID (e.g. A123456), given when you opened your account."],
          ["6. MPIN / API Secret", "Enter the 4-digit MPIN you use to log into the Angel One app."],
          ["7. TOTP Secret", "Open Angel One app → Profile → Security. Go to 'Enable TOTP' — you'll find a secret key (shown as text below the QR code). Copy it into the 'TOTP Key' field."],
        ]).map(([t, d], i) => (
          <View key={"ao"+i} style={{ marginBottom: 10 }}>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{t}</Text>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{d}</Text>
          </View>
        ))}

        <View style={{ height: 1, backgroundColor: C.border, marginVertical: 14 }} />

        {/* Zerodha */}
        <Text style={{ color: C.gold, fontSize: 15, fontWeight: "900", marginBottom: 8 }}>
          🅩 Zerodha {isHi ? "(₹2000/महीना - सशुल्क)" : "(₹2000/month - Paid)"}
        </Text>
        {(isHi ? [
          ["1. Account खोलें", "zerodha.com पर demat account खोलें और F&O permission चालू करवाएं।"],
          ["2. Kite Connect Subscribe", "developers.kite.trade पर जाकर ₹2000/महीना का प्लान subscribe करें (ज़रूरी है, बिना subscription के API काम नहीं करेगा)।"],
          ["3. App बनाएं", "developers.kite.trade/apps पर 'Create new app' दबाएं। Redirect URL में http://127.0.0.1 डालें।"],
          ["4. API Key और Secret", "App बनने के बाद 'API Key' और 'API Secret' दोनों मिलेंगे — दोनों कॉपी कर लें।"],
          ["5. रोज़ाना Login (ज़रूरी)", "Zerodha का access token हर दिन बदलता है — रोज़ एक बार browser में login करके नया access token लेना होगा, फिर उसे 'API Secret (Access Token)' फ़ील्ड में डालना होगा।"],
          ["6. Client ID", "यह आपकी Zerodha User ID है (जैसे ZZ1234), जो login screen पर दिखती है।"],
        ] : [
          ["1. Open Account", "Open a demat account at zerodha.com and enable F&O permission."],
          ["2. Subscribe Kite Connect", "Go to developers.kite.trade and subscribe to the ₹2000/month plan (required — the API won't work without a subscription)."],
          ["3. Create App", "On developers.kite.trade/apps, click 'Create new app'. Set the Redirect URL to http://127.0.0.1."],
          ["4. API Key and Secret", "Once created, you'll get both an 'API Key' and 'API Secret' — copy both."],
          ["5. Daily Login (Required)", "Zerodha's access token changes every day — you must log in via browser once a day to get a fresh access token, then paste it into the 'API Secret (Access Token)' field."],
          ["6. Client ID", "This is your Zerodha User ID (e.g. ZZ1234), shown on the login screen."],
        ]).map(([t, d], i) => (
          <View key={"zd"+i} style={{ marginBottom: 10 }}>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{t}</Text>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{d}</Text>
          </View>
        ))}

        <View style={{ height: 1, backgroundColor: C.border, marginVertical: 14 }} />

        {/* Upstox */}
        <Text style={{ color: C.green, fontSize: 15, fontWeight: "900", marginBottom: 8 }}>
          🅄 Upstox {isHi ? "(मुफ़्त)" : "(Free)"}
        </Text>
        {(isHi ? [
          ["1. Account खोलें", "upstox.com पर demat account खोलें और F&O trading enable करवाएं।"],
          ["2. Developer App बनाएं", "developer.upstox.com पर login करें और 'Create App' दबाएं। Redirect URI में http://localhost डालें।"],
          ["3. API Key और Secret", "App बनने पर 'API Key' (यही Client ID भी है) और 'API Secret' मिलेंगे — दोनों कॉपी कर लें।"],
          ["4. रोज़ाना Login (ज़रूरी)", "Upstox का access token हर दिन expire होता है — रोज़ एक बार browser में login/authorize करके नया access token लेना होगा, फिर उसे 'API Secret (Access Token)' फ़ील्ड में डालना होगा।"],
          ["5. Client ID", "यह वही 'API Key' है जो App बनाते समय मिली थी।"],
        ] : [
          ["1. Open Account", "Open a demat account at upstox.com and enable F&O trading."],
          ["2. Create Developer App", "Log in at developer.upstox.com and click 'Create App'. Set the Redirect URI to http://localhost."],
          ["3. API Key and Secret", "Once created, you'll get an 'API Key' (this also serves as Client ID) and an 'API Secret' — copy both."],
          ["4. Daily Login (Required)", "Upstox's access token expires every day — you must log in/authorize via browser once a day to get a fresh access token, then paste it into the 'API Secret (Access Token)' field."],
          ["5. Client ID", "This is the same 'API Key' you got when creating the app."],
        ]).map(([t, d], i) => (
          <View key={"up"+i} style={{ marginBottom: 10 }}>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{t}</Text>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{d}</Text>
          </View>
        ))}

        <View style={{ backgroundColor: C.goldLo, borderRadius: 10, padding: 10, marginTop: 6,
          borderWidth: 1, borderColor: C.gold+"44" }}>
          <Text style={{ color: C.gold, fontSize: 12, fontWeight: "700", lineHeight: 18 }}>
            {isHi
              ? "💡 ध्यान दें: फॉर्म हर बार खाली दिखता है (सुरक्षा कारणों से पुराना डेटा वापस नहीं दिखाया जाता)। इसलिए हर बार Save करते समय सभी फ़ील्ड भरनी होंगी — सिर्फ बदला हुआ फ़ील्ड नहीं।"
              : "💡 Note: the form always appears empty (saved data is never shown back, for security). So every time you save, fill in all fields — not just the one that changed."}
          </Text>
        </View>
      </Card>

      <Card glow={C.blue}>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginBottom: 6 }}>
          🔗 {isHi ? "ब्रोकर सेटअप गाइड" : "Broker Setup Guide"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>
          {isHi
            ? "हर ब्रोकर के लिए रजिस्ट्रेशन से लेकर क्रेडेंशियल्स भरने तक पूरे चरण।"
            : "Full steps from registration to filling in credentials, for each broker."}
        </Text>

        {/* Angel One */}
        <Text style={{ color: C.blue, fontSize: 15, fontWeight: "900", marginBottom: 8 }}>
          🅰️ Angel One {isHi ? "(मुफ़्त)" : "(Free)"}
        </Text>
        {(isHi ? [
          ["1. Account खोलें", "angelone.in पर जाकर demat account खोलें और F&O trading permission चालू करवाएं।"],
          ["2. SmartAPI Register", "smartapi.angelbroking.com पर जाएं और Sign Up करें (अलग से, demat account से अलग)।"],
          ["3. App बनाएं", "Login के बाद 'Create New App' दबाएं। App type 'Personal' चुनें। App का कोई भी नाम दें।"],
          ["4. API Key कॉपी करें", "App बनने के बाद उसकी 'API Key' दिखेगी — उसे कॉपी करके ऐप के 'API Key' फ़ील्ड में डालें।"],
          ["5. Client ID", "यह आपका Angel One login ID है (जैसे A123456), जो आपको account खोलते समय मिला था।"],
          ["6. MPIN / API Secret", "आपका 4-digit MPIN जो आप Angel One app में login के लिए इस्तेमाल करते हैं, वही यहाँ डालें।"],
          ["7. TOTP Secret", "Angel One app → Profile → Security खोलें। 'Enable TOTP' पर जाएं — वहाँ एक secret key (QR code के नीचे text रूप में) मिलेगी। उसे कॉपी करके 'TOTP Key' फ़ील्ड में डालें।"],
        ] : [
          ["1. Open Account", "Go to angelone.in and open a demat account. Make sure F&O trading permission is enabled."],
          ["2. SmartAPI Register", "Go to smartapi.angelbroking.com and Sign Up separately (this is different from your demat account login)."],
          ["3. Create App", "After logging in, click 'Create New App'. Choose app type 'Personal'. Give it any name."],
          ["4. Copy API Key", "Once the app is created, its 'API Key' will be shown — copy it into the app's 'API Key' field."],
          ["5. Client ID", "This is your Angel One login ID (e.g. A123456), given when you opened your account."],
          ["6. MPIN / API Secret", "Enter the 4-digit MPIN you use to log into the Angel One app."],
          ["7. TOTP Secret", "Open Angel One app → Profile → Security. Go to 'Enable TOTP' — you'll find a secret key (shown as text below the QR code). Copy it into the 'TOTP Key' field."],
        ]).map(([t, d], i) => (
          <View key={"ao"+i} style={{ marginBottom: 10 }}>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{t}</Text>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{d}</Text>
          </View>
        ))}

        <View style={{ height: 1, backgroundColor: C.border, marginVertical: 14 }} />

        {/* Zerodha */}
        <Text style={{ color: C.gold, fontSize: 15, fontWeight: "900", marginBottom: 8 }}>
          🅩 Zerodha {isHi ? "(₹2000/महीना - सशुल्क)" : "(₹2000/month - Paid)"}
        </Text>
        {(isHi ? [
          ["1. Account खोलें", "zerodha.com पर demat account खोलें और F&O permission चालू करवाएं।"],
          ["2. Kite Connect Subscribe", "developers.kite.trade पर जाकर ₹2000/महीना का प्लान subscribe करें (ज़रूरी है, बिना subscription के API काम नहीं करेगा)।"],
          ["3. App बनाएं", "developers.kite.trade/apps पर 'Create new app' दबाएं। Redirect URL में http://127.0.0.1 डालें।"],
          ["4. API Key और Secret", "App बनने के बाद 'API Key' और 'API Secret' दोनों मिलेंगे — दोनों कॉपी कर लें।"],
          ["5. रोज़ाना Login (ज़रूरी)", "Zerodha का access token हर दिन बदलता है — रोज़ एक बार browser में login करके नया access token लेना होगा, फिर उसे 'API Secret (Access Token)' फ़ील्ड में डालना होगा।"],
          ["6. Client ID", "यह आपकी Zerodha User ID है (जैसे ZZ1234), जो login screen पर दिखती है।"],
        ] : [
          ["1. Open Account", "Open a demat account at zerodha.com and enable F&O permission."],
          ["2. Subscribe Kite Connect", "Go to developers.kite.trade and subscribe to the ₹2000/month plan (required — the API won't work without a subscription)."],
          ["3. Create App", "On developers.kite.trade/apps, click 'Create new app'. Set the Redirect URL to http://127.0.0.1."],
          ["4. API Key and Secret", "Once created, you'll get both an 'API Key' and 'API Secret' — copy both."],
          ["5. Daily Login (Required)", "Zerodha's access token changes every day — you must log in via browser once a day to get a fresh access token, then paste it into the 'API Secret (Access Token)' field."],
          ["6. Client ID", "This is your Zerodha User ID (e.g. ZZ1234), shown on the login screen."],
        ]).map(([t, d], i) => (
          <View key={"zd"+i} style={{ marginBottom: 10 }}>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{t}</Text>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{d}</Text>
          </View>
        ))}

        <View style={{ height: 1, backgroundColor: C.border, marginVertical: 14 }} />

        {/* Upstox */}
        <Text style={{ color: C.green, fontSize: 15, fontWeight: "900", marginBottom: 8 }}>
          🅄 Upstox {isHi ? "(मुफ़्त)" : "(Free)"}
        </Text>
        {(isHi ? [
          ["1. Account खोलें", "upstox.com पर demat account खोलें और F&O trading enable करवाएं।"],
          ["2. Developer App बनाएं", "developer.upstox.com पर login करें और 'Create App' दबाएं। Redirect URI में http://localhost डालें।"],
          ["3. API Key और Secret", "App बनने पर 'API Key' (यही Client ID भी है) और 'API Secret' मिलेंगे — दोनों कॉपी कर लें।"],
          ["4. रोज़ाना Login (ज़रूरी)", "Upstox का access token हर दिन expire होता है — रोज़ एक बार browser में login/authorize करके नया access token लेना होगा, फिर उसे 'API Secret (Access Token)' फ़ील्ड में डालना होगा।"],
          ["5. Client ID", "यह वही 'API Key' है जो App बनाते समय मिली थी।"],
        ] : [
          ["1. Open Account", "Open a demat account at upstox.com and enable F&O trading."],
          ["2. Create Developer App", "Log in at developer.upstox.com and click 'Create App'. Set the Redirect URI to http://localhost."],
          ["3. API Key and Secret", "Once created, you'll get an 'API Key' (this also serves as Client ID) and an 'API Secret' — copy both."],
          ["4. Daily Login (Required)", "Upstox's access token expires every day — you must log in/authorize via browser once a day to get a fresh access token, then paste it into the 'API Secret (Access Token)' field."],
          ["5. Client ID", "This is the same 'API Key' you got when creating the app."],
        ]).map(([t, d], i) => (
          <View key={"up"+i} style={{ marginBottom: 10 }}>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: "800" }}>{t}</Text>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{d}</Text>
          </View>
        ))}

        <View style={{ backgroundColor: C.goldLo, borderRadius: 10, padding: 10, marginTop: 6,
          borderWidth: 1, borderColor: C.gold+"44" }}>
          <Text style={{ color: C.gold, fontSize: 12, fontWeight: "700", lineHeight: 18 }}>
            {isHi
              ? "💡 ध्यान दें: फॉर्म हर बार खाली दिखता है (सुरक्षा कारणों से पुराना डेटा वापस नहीं दिखाया जाता)। इसलिए हर बार Save करते समय सभी फ़ील्ड भरनी होंगी — सिर्फ बदला हुआ फ़ील्ड नहीं।"
              : "💡 Note: the form always appears empty (saved data is never shown back, for security). So every time you save, fill in all fields — not just the one that changed."}
          </Text>
        </View>
      </Card>

      <Card glow={C.red}>
        <Text style={{ color: C.red, fontSize: 14, fontWeight: "900", marginBottom: 6 }}>
          ⚠️ {isHi ? "जोखिम चेतावनी" : "Risk Warning"}
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 19 }}>
          {isHi
            ? "ऑप्शन ट्रेडिंग में नुकसान हो सकता है। पहले पेपर मोड और बैकटेस्ट से रणनीति का परीक्षण करें। वास्तविक मोड में असली ऑर्डर लग सकता है।"
            : "Options trading can cause losses. Test your strategy using Paper Mode and Backtest first. Live mode can place real orders."}
        </Text>
      </Card>
    </ScrollView>
  );
}


// ── Home Tab ─────────────────────────────────────────────

function HomeTab({ user, subStatus, token, onSubscribe, setActiveTab, lang, onPageRefresh }) {
  const hi = lang === "hi";
  const isAdmin = !!user?.is_admin;
  const statusForDisplay = isAdmin
    ? "admin"
    : (subStatus?.subscription_status || user?.subscription_status || "trial");
  const daysLeft = isAdmin ? null : (subStatus?.days_remaining ?? null);

  const [signal, setSignal] = useState(null);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const sig = await apiGet("/bot/signal", token);
      setSignal(sig);
    } catch (e) {}
    try {
      const mkt = await apiGet("/market/status", token);
      setMarket(mkt);
    } catch (e) {}
    try {
      if (onPageRefresh) await onPageRefresh();
    } catch (e) {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const isRunning = !!signal?.running;
  const mode = signal?.trading_mode || "paper";
  const todayPnl = signal?.total_pnl;
  const paperEquity = signal?.paper_capital;

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#fff" />}>

      <Card glow={C.purple}>
        <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <View>
            <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800",
              textTransform: "uppercase" }}>{hi ? "Welcome Back" : "Welcome Back"}</Text>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: "900",
              marginTop: 2 }}>{user?.name || "Trader"}</Text>
          </View>
          <Text style={{ fontSize: 36 }}>👑</Text>
        </Row>
        <View style={{ backgroundColor: C.s2, borderRadius: 10,
          padding: 12, borderWidth: 1, borderColor: C.border }}>
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>{hi ? "Subscription" : "Subscription"}</Text>
            <Tag label={isAdmin ? "ADMIN" : statusForDisplay.toUpperCase()}
              color={isAdmin || statusForDisplay==="active" ? C.green : C.accent} />
          </Row>
          {isAdmin ? (
            <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>{hi ? "Access" : "Access"}</Text>
              <Text style={{ color: C.green, fontWeight: "900", fontSize: 13 }}>
                {hi ? "Unlimited" : "Unlimited"}
              </Text>
            </Row>
          ) : daysLeft !== null && (
            <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>{hi ? "Bacha hua time" : "Time remaining"}</Text>
              <Text style={{ color: daysLeft<=3?C.red:C.green,
                fontWeight: "900", fontSize: 13 }}>{hi ? `${daysLeft} din` : `${daysLeft} days`}</Text>
            </Row>
          )}
        </View>
      </Card>

      {/* Summary cards */}
      <Row style={{ gap: 10 }}>
        <Card style={{ flex: 1 }} glow={isRunning ? C.green : C.red}>
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: "800",
            textTransform: "uppercase" }}>{hi ? "Bot" : "Bot"}</Text>
          <Text style={{ color: isRunning ? C.green : C.red, fontSize: 16,
            fontWeight: "900", marginTop: 4 }}>{isRunning ? (hi ? "CHAL RAHA HAI" : "RUNNING") : (hi ? "RUKA HUA" : "STOPPED")}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: "800",
            textTransform: "uppercase" }}>{hi ? "Mode" : "Mode"}</Text>
          <Text style={{ color: mode === "live" ? C.red : C.accent, fontSize: 16,
            fontWeight: "900", marginTop: 4 }}>{mode.toUpperCase()}</Text>
        </Card>
      </Row>
      <Row style={{ gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: "800",
            textTransform: "uppercase" }}>{hi ? "Aaj Ka P&L" : "Today P&L"}</Text>
          <Text style={{ color: (todayPnl ?? 0) >= 0 ? C.green : C.red, fontSize: 16,
            fontWeight: "900", marginTop: 4 }}>
            {todayPnl != null ? `₹${todayPnl}` : "--"}
          </Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: "800",
            textTransform: "uppercase" }}>{hi ? "Paper Capital" : "Paper Capital"}</Text>
          <Text style={{ color: C.text, fontSize: 16,
            fontWeight: "900", marginTop: 4 }}>
            {paperEquity != null ? `₹${paperEquity}` : "--"}
          </Text>
        </Card>
      </Row>

      {/* Market cards */}
      <Card>
        <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
            textTransform: "uppercase", letterSpacing: 1.2 }}>{hi ? "Market" : "Market"}</Text>
          <Text style={{ color: market?.feed_connected ? C.green : C.muted,
            fontSize: 10, fontWeight: "800" }}>
            {market ? (market.feed_connected ? (hi ? "🟢 Connected" : "🟢 Connected") : (hi ? "⚪ Live feed connected nahi hai" : "⚪ Live feed not connected")) : "--"}
          </Text>
        </Row>
        {(market?.indices || [
          { symbol: "NIFTY", ltp: null, status: "not_connected" },
          { symbol: "BANKNIFTY", ltp: null, status: "not_connected" },
          { symbol: "SENSEX", ltp: null, status: "not_connected" },
        ]).map(idx => (
          <Row key={idx.symbol} style={{ justifyContent: "space-between",
            paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.text, fontSize: 14, fontWeight: "800" }}>{idx.symbol}</Text>
            {idx.ltp != null ? (
              <Row style={{ gap: 8 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: "900" }}>{idx.ltp}</Text>
                {idx.change_percent != null && (
                  <Text style={{ color: idx.change_percent >= 0 ? C.green : C.red,
                    fontSize: 12, fontWeight: "800" }}>
                    {idx.change_percent >= 0 ? "+" : ""}{idx.change_percent}%
                  </Text>
                )}
              </Row>
            ) : (
              <Text style={{ color: C.muted, fontSize: 11 }}>{hi ? "Live feed connected nahi hai" : "Live feed not connected"}</Text>
            )}
          </Row>
        ))}
      </Card>

      {/* Quick actions */}
      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>{hi ? "Quick Actions" : "Quick Actions"}</Text>
        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Btn label={hi ? "Trade" : "Trade"} icon="🧾" color={C.accent}
              onPress={() => setActiveTab && setActiveTab("trade")} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label={hi ? "Bot" : "Bot"} icon="🤖" color={C.blue}
              onPress={() => setActiveTab && setActiveTab("bot")} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label={hi ? "More" : "More"} icon="⚙️" color={C.muted}
              onPress={() => setActiveTab && setActiveTab("more")} />
          </View>
        </Row>
      </Card>

      {/* Warning */}
      <Card style={{ borderColor: C.red+"55", borderWidth: 1 }}>
        <Text style={{ color: C.red, fontSize: 12, fontWeight: "800" }}>
          ⚠️ {hi ? "Live mode asli order laga sakta hai. Paper mode safe hai." : "Live mode can place real orders. Paper mode is safe."}
        </Text>
      </Card>

      {!isAdmin && statusForDisplay !== "active" && Number(daysLeft ?? 0) <= 0 && (
        <Btn label={hi ? "Plans Dekho" : "View Plans"} icon="💎" color={C.gold}
          onPress={onSubscribe} />
      )}
    </ScrollView>
  );
}

// ── Account Tab ──────────────────────────────────────────

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: "", errorStack: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: String(error?.message || error) };
  }

  componentDidCatch(error, info) {
    this.setState({ errorStack: String(info?.componentStack || "") });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: "#0a0a0f" }}
          contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: "#ff4d6d", fontSize: 16, fontWeight: "900", marginBottom: 12 }}>
            Tab Crash Caught
          </Text>
          <Text style={{ color: "#e8e8f0", fontSize: 13, marginBottom: 12 }}>
            {this.state.errorMsg}
          </Text>
          <Text style={{ color: "#a0a0c0", fontSize: 11 }}>
            {this.state.errorStack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}




function formatDateSafe(isoString) {
  if (!isoString) return "--";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "--";
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return "--";
  }
}

function AccountTab({ user, subStatus, onLogout, onRefresh, lang }) {
  const hi = lang === "hi";
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = !!user?.is_admin;
  const accountStatus = isAdmin
    ? "ADMIN"
    : (subStatus?.subscription_status || user?.subscription_status || "trial").toUpperCase();

  async function refreshAccount() {
    setRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={refreshAccount} tintColor={C.purple} colors={[C.purple]} />}>

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
        <Tag label={accountStatus}
          color={isAdmin || accountStatus==="ACTIVE" ? C.green : C.accent} />
      </Card>

      <Card>
        <Text style={{ color: C.sub, fontSize: 10, fontWeight: "900",
          textTransform: "uppercase", letterSpacing: 1.2,
          marginBottom: 12 }}>{hi ? "Account Details" : "Account Details"}</Text>
        {[
          [hi ? "Status" : "Status", accountStatus],
          [hi ? "Bacha hua time" : "Time remaining", isAdmin
            ? "Unlimited"
            : (subStatus?.days_remaining != null
              ? (hi ? `${subStatus.days_remaining} din` : `${subStatus.days_remaining} days`)
              : "--")],
          [hi ? "Trial ends" : "Trial ends", isAdmin ? "Not applicable" : formatDateSafe(user?.trial_ends_at)],
          [hi ? "Member since" : "Member since", formatDateSafe(user?.created_at)],
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

      <Btn label={hi ? "Refresh Karo" : "Refresh"} icon="🔄" color={C.blue}
        loading={refreshing} onPress={refreshAccount} />

      <Btn label={hi ? "Logout" : "Logout"} icon="🚪" color={C.red}
        onPress={() => Alert.alert(
          hi ? "Logout" : "Logout",
          hi ? "Aap logout karna chahte hain?" : "Do you want to logout?",
          [
            { text: hi ? "Cancel" : "Cancel", style: "cancel" },
            { text: hi ? "Logout" : "Logout", style: "destructive", onPress: onLogout }
          ])} />
    </ScrollView>
  );
}



function OtaStatusBanner() {
  const [msg, setMsg] = useState("Checking app update...");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let alive = true;

    async function checkOta() {
      try {
        if (__DEV__) {
          if (alive) setVisible(false);
          return;
        }

        if (alive) setMsg("Checking app update...");
        const update = await Updates.checkForUpdateAsync();

        if (!update.isAvailable) {
          if (alive) {
            setMsg("App is up to date");
            setTimeout(() => setVisible(false), 1200);
          }
          return;
        }

        if (alive) setMsg("Downloading new update...");
        await Updates.fetchUpdateAsync();

        if (alive) setMsg("Update ready. Restarting app...");
        setTimeout(() => Updates.reloadAsync(), 800);
      } catch (e) {
        if (alive) {
          setMsg("Update check skipped");
          setTimeout(() => setVisible(false), 1200);
        }
      }
    }

    checkOta();

    return () => {
      alive = false;
    };
  }, []);

  if (!visible) return null;

  return (
    <View style={{
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: C.s2 || "#151522",
      borderBottomWidth: 1,
      borderBottomColor: C.border
    }}>
      <Text style={{
        color: C.gold || "#facc15",
        fontSize: 12,
        fontWeight: "900",
        textAlign: "center"
      }}>
        🔄 {msg}
      </Text>
    </View>
  );
}


// ── Dashboard Screen ──────────────────────────────────────
function DashboardScreen({ token, user, onLogout, initialLang, onLangChange }) {
  const [activeTab, setActiveTab] = useState("home");
  const navigationHistoryRef = useRef(["home"]);
  const [navigationDepth, setNavigationDepth] = useState(1);
  const lang = initialLang || "en";
  const setLang = onLangChange || (() => {});
  const [subStatus, setSubStatus] = useState(null);
  const [userFresh, setUserFresh] = useState(user);

  useEffect(() => { refreshUser(); }, []);

  function navigateTo(tab, options = {}) {
    const nextTab = String(tab || "home");

    if (nextTab === activeTab) {
      return;
    }

    const replaceCurrent = !!options.replace;
    let history = [
      ...navigationHistoryRef.current
    ];

    if (replaceCurrent && history.length) {
      history[history.length - 1] = nextTab;
    } else {
      history.push(nextTab);
    }

    if (history.length > 30) {
      history = history.slice(-30);
    }

    navigationHistoryRef.current = history;
    setNavigationDepth(history.length);
    setActiveTab(nextTab);
  }

  function goBackInApp() {
    let history = [
      ...navigationHistoryRef.current
    ];

    if (history.length > 1) {
      history.pop();

      const previousTab =
        history[history.length - 1]
        || "home";

      navigationHistoryRef.current =
        history;
      setNavigationDepth(
        history.length
      );
      setActiveTab(previousTab);

      return true;
    }

    if (activeTab !== "home") {
      navigationHistoryRef.current = [
        "home"
      ];
      setNavigationDepth(1);
      setActiveTab("home");

      return true;
    }

    return false;
  }

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        goBackInApp,
      );

    return () => {
      subscription.remove();
    };
  }, [activeTab]);

  async function refreshUser() {
    try {
      const data = await apiGet("/auth/me", token);
      setUserFresh(data.user);
      const sub = await apiGet("/subscription/status", token);
      setSubStatus(sub);
    } catch {}
  }

  const isAdmin = userFresh?.role==="admin" || !!userFresh?.is_admin;
  const serverSubscriptionStatus = subStatus?.subscription_status
    || userFresh?.subscription_status
    || "trial";
  const subscriptionDaysRemaining = Number(subStatus?.days_remaining ?? 0);
  const effectiveSubscriptionStatus = isAdmin ? "active" : serverSubscriptionStatus;
  const subscriptionExpired = !isAdmin && (
    effectiveSubscriptionStatus === "expired"
    || (effectiveSubscriptionStatus === "trial" && subscriptionDaysRemaining <= 0)
  );
  const trialEndingSoon = !isAdmin
    && effectiveSubscriptionStatus === "trial"
    && subscriptionDaysRemaining > 0
    && subscriptionDaysRemaining <= 2;
  const displayUser = {
    ...(userFresh || user || {}),
    subscription_status: effectiveSubscriptionStatus,
    is_admin: !!isAdmin,
  };
  const displaySubStatus = isAdmin
    ? {
        ...(subStatus || {}),
        subscription_status: "active",
        days_remaining: null,
        unlimited: true,
      }
    : subStatus;

  const tabs = [
    { id: "home", icon: "🏠", label: lang === "hi" ? "होम" : "Home" },
    { id: "trade", icon: "🧾", label: lang === "hi" ? "ट्रेड" : "Trade" },
    { id: "bot", icon: "🤖", label: lang === "hi" ? "बॉट" : "Bot" },
    { id: "tools", icon: "🧰", label: lang === "hi" ? "टूल्स" : "Tools" },
    { id: "more", icon: "⚙️", label: lang === "hi" ? "अधिक" : "More" },
    { id: "account", icon: "👤", label: lang === "hi" ? "खाता" : "Account" },
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
            {navigationDepth > 1 && (
              <TouchableOpacity
                onPress={goBackInApp}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: C.s3,
                  borderWidth: 1,
                  borderColor: C.border2,
                }}
              >
                <Text style={{
                  color: C.text,
                  fontSize: 21,
                  fontWeight: "900",
                }}>
                  ‹
                </Text>
              </TouchableOpacity>
            )}

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
          <Tag label={isAdmin ? "ADMIN" : effectiveSubscriptionStatus.toUpperCase()}
            color={isAdmin || effectiveSubscriptionStatus==="active" ? C.green : C.accent} />
        </Row>
      </View>

      {/* Subscription warning */}
      {subscriptionExpired && (
        <TouchableOpacity
          onPress={() => navigateTo("more")}
          style={{ backgroundColor: C.redLo, borderRadius: 12,
            padding: 14, margin: 16, marginBottom: 0,
            borderWidth: 1, borderColor: C.red+"55" }}>
          <Text style={{ color: C.red, fontWeight: "900",
            fontSize: 13 }}>⚠️ Trial khatam — Subscribe karo → ₹1,999/month</Text>
        </TouchableOpacity>
      )}
      {trialEndingSoon && (
        <TouchableOpacity
          onPress={() => navigateTo("more")}
          style={{ backgroundColor: C.goldLo, borderRadius: 12,
            padding: 14, margin: 16, marginBottom: 0,
            borderWidth: 1, borderColor: C.gold+"55" }}>
          <Text style={{ color: C.gold, fontWeight: "900",
            fontSize: 13 }}>⏳ Trial {subscriptionDaysRemaining} din me khatam hoga — ₹1,999/month</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}>
        <OtaStatusBanner />

        {activeTab === "home" && (
          <HomeTab user={displayUser} subStatus={displaySubStatus} token={token}
            setActiveTab={navigateTo} onSubscribe={() => navigateTo("more")}
            onPageRefresh={refreshUser} lang={lang} />
        )}
        {activeTab === "score" && <ScoreTab token={token} />}
        {activeTab === "markets" && <MarketsTab token={token} lang={lang} />}
        {activeTab === "trade" && <TradeTab token={token} />}
        {activeTab === "guide" && <GuideTab lang={lang} setLang={setLang} />}
        {activeTab === "tools" && <ToolsTab lang={lang} navigateTo={navigateTo} />}
        {activeTab === "more" && <MoreTab token={token} user={displayUser} lang={lang} setLang={setLang} isAdmin={isAdmin} navigateTo={navigateTo} />}
        {activeTab === "localgateway" && <LocalGatewayScreen token={token} lang={lang} />}
        {activeTab === "backtest" && <BacktestTab token={token} lang={lang} />}
        {activeTab === "bot" && <BotTab token={token} lang={lang} />}
        {activeTab === "broker" && <BrokerTab token={token} lang={lang} />}
        {activeTab === "telegram" && <TelegramTab token={token} />}
        {activeTab === "strategybuilder" && <StrategyBuilderTab token={token} />}
        {activeTab === "livefeed" && <LiveFeedTab token={token} />}
        {activeTab === "servertest" && <ServerTestTab token={token} />}
        {activeTab === "herozero" && <HeroZeroTab token={token} />}
        {activeTab === "plans" && (
          <PlansTab token={token} user={displayUser}
            onSuccess={refreshUser} />
        )}
        {activeTab === "admin" && isAdmin && (
          <AdminTab token={token} user={userFresh} lang={lang} />
        )}
        {activeTab === "account" && (
          <TabErrorBoundary><AccountTab user={displayUser} subStatus={displaySubStatus} onLogout={onLogout} onRefresh={refreshUser} lang={lang} /></TabErrorBoundary>
        )}
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: C.s1, borderTopWidth: 1,
        borderTopColor: C.border, flexDirection: "row",
        paddingBottom: Platform.OS==="ios"?24:10, paddingTop: 10 }}>
        {tabs.map(t => (
          <TouchableOpacity key={t.id}
            onPress={() => navigateTo(t.id)}
            style={{ flex: 1, alignItems: "center", gap: 3 }}>
            <Text style={{ fontSize: 16 }}>{t.icon}</Text>
            <Text style={{ color: activeTab===t.id?C.accent:C.muted,
              fontSize: 8.5, fontWeight: "900" }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main App ──────────────────────────────────────────────
function InnerApp() {
  const [screen, setScreen] = useState("loading");
  const [token, setToken]   = useState(null);
  const [user, setUser]     = useState(null);
  const [lang, setLang]     = useState("en");
  const [recoveryMode, setRecoveryMode] = useState("menu");

  useEffect(() => {
    (async () => {
      try {
        const [[, savedToken], [, savedUser], [, savedLang]] =
          await AsyncStorage.multiGet(["saas_token", "saas_user", "okai_lang"]);
        if (savedLang === "hi" || savedLang === "en") setLang(savedLang);
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

  async function changeLang(next) {
    setLang(next);
    try { await AsyncStorage.setItem("okai_lang", next); } catch {}
  }

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
  if (screen === "recovery") {
    return <RecoveryScreen initialMode={recoveryMode}
      onBack={() => setScreen("login")} lang={lang} />;
  }
  if (screen === "register") {
    return <RegisterScreen onLogin={handleLogin}
      onBack={() => setScreen("login")} lang={lang} setLang={changeLang} />;
  }
  if (screen === "login") {
    return <LoginScreen onLogin={handleLogin}
      onRegister={() => setScreen("register")}
      onRecovery={(mode) => { setRecoveryMode(mode || "menu"); setScreen("recovery"); }}
      lang={lang} setLang={changeLang} />;
  }
  return <DashboardScreen token={token} user={user}
    onLogout={handleLogout} initialLang={lang} onLangChange={changeLang} />;
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


export default function App() {
  return (
    <ErrorBoundary>
      <InnerApp />
    </ErrorBoundary>
  );
}
