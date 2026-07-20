import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://option-king-saas-production.up.railway.app";
const C = {
  bg: "#0a0a0f", s1: "#0f0f1a", s2: "#13131f", border: "#252540",
  text: "#e8e8f0", muted: "#606080", accent: "#7c6deb",
  blue: "#4d9fff", green: "#00d4a0", red: "#ff4d6d",
};

async function post(path, body) {
  const response = await fetch(API_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.detail || data.message || "Request failed");
  return data;
}

function Field(props) {
  return <TextInput {...props} autoCapitalize="none" placeholderTextColor={C.muted}
    style={[{ backgroundColor: C.s2, borderColor: C.border, borderWidth: 1,
      borderRadius: 12, color: C.text, fontSize: 14, paddingHorizontal: 14,
      paddingVertical: 13, marginBottom: 12 }, props.style]} />;
}

function SecureField(props) {
  const [visible, setVisible] = useState(false);
  return <View style={{ position: "relative" }}>
    <Field {...props} secureTextEntry={!visible} style={[props.style, { paddingRight: 55 }]} />
    <TouchableOpacity onPress={() => setVisible(!visible)}
      style={{ position: "absolute", right: 6, top: 3, width: 44, height: 43,
        alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 18 }}>{visible ? "🙈" : "👁️"}</Text>
    </TouchableOpacity>
  </View>;
}

function Button({ label, onPress, loading, color = C.accent }) {
  return <TouchableOpacity onPress={onPress} disabled={loading}
    style={{ backgroundColor: color + "22", borderColor: color + "66", borderWidth: 1,
      borderRadius: 12, minHeight: 45, alignItems: "center", justifyContent: "center" }}>
    {loading ? <ActivityIndicator color={color} />
      : <Text style={{ color, fontSize: 13, fontWeight: "900" }}>{label}</Text>}
  </TouchableOpacity>;
}

function Card({ children }) {
  return <View style={{ backgroundColor: C.s1, borderColor: C.border, borderWidth: 1,
    borderRadius: 16, padding: 16, marginBottom: 14 }}>{children}</View>;
}

export default function RecoveryScreen({ onBack, initialMode = "menu", lang = "en" }) {
  const hi = lang === "hi";
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function clear() { setError(""); setMessage(""); }

  async function recoverId() {
    clear();
    if (!name.trim() || String(phone).replace(/\D/g, "").length < 10) {
      setError(hi ? "Registered naam aur mobile number daalo" : "Enter registered name and mobile number");
      return;
    }
    setLoading(true);
    try {
      const d = await post("/auth/recover-login-id", { name, phone });
      if (d.found) { setMaskedEmail(d.masked_email || ""); setMessage("Forgot Login ID result"); }
      else setError(hi ? "Details match nahi hui" : "Details did not match an active account");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function sendResetOtp() {
    clear();
    if (!email.includes("@")) { setError("Registered email / Login ID enter karo"); return; }
    setLoading(true);
    try {
      const d = await post("/auth/request-password-reset", { email });
      if (d.email_otp_available === false) setError("Email OTP service abhi configure nahi hai");
      else { setMode("reset"); setMessage("Registered account hua to OTP email par bhej diya gaya hai"); }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function resetPassword() {
    clear();
    if (String(otp).replace(/\D/g, "").length !== 6) { setError("6-digit OTP enter karo"); return; }
    if (password.length < 6) { setError("Password kam se kam 6 characters ka ho"); return; }
    if (password !== confirm) { setError("Dono password match nahi karte"); return; }
    setLoading(true);
    try {
      await post("/auth/reset-password", { email, otp, new_password: password });
      setMode("success");
      setMessage("Password reset ho gaya. Ab naye password se login karo.");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  const back = mode === "menu" || mode === "success" ? onBack : () => { clear(); setMode("menu"); };
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
    behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }}>
      <TouchableOpacity onPress={back} style={{ marginBottom: 18 }}>
        <Text style={{ color: C.accent, fontWeight: "900" }}>← {mode === "menu" || mode === "success" ? "Back to Login" : "Recovery Options"}</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 38, textAlign: "center" }}>🔐</Text>
      <Text style={{ color: C.text, fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 7, marginBottom: 20 }}>Account Recovery</Text>
      {!!error && <View style={{ backgroundColor: C.red + "16", borderColor: C.red + "55", borderWidth: 1, borderRadius: 10, padding: 11, marginBottom: 12 }}><Text style={{ color: C.red }}>{error}</Text></View>}
      {!!message && <View style={{ backgroundColor: C.green + "16", borderColor: C.green + "55", borderWidth: 1, borderRadius: 10, padding: 11, marginBottom: 12 }}><Text style={{ color: C.green }}>{message}</Text></View>}

      {mode === "menu" && <>
        <Card><Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 8 }}>🪪 Forgot Login ID</Text><Button label="Forgot Login ID" color={C.blue} onPress={() => setMode("loginId")} /></Card>
        <Card><Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 8 }}>🔑 Forgot Password</Text><Button label="Forgot Password" color={C.green} onPress={() => setMode("password")} /></Card>
      </>}

      {mode === "loginId" && <Card>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 13 }}>Forgot Login ID</Text>
        <Field value={name} onChangeText={setName} placeholder="Registered full name" autoCapitalize="words" />
        <Field value={phone} onChangeText={setPhone} placeholder="Registered mobile number" keyboardType="phone-pad" />
        <Button label="Forgot Login ID" color={C.blue} onPress={recoverId} loading={loading} />
        {!!maskedEmail && <View style={{ backgroundColor: C.s2, borderColor: C.blue + "55", borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 13 }}><Text style={{ color: C.muted, fontSize: 11 }}>Login ID</Text><Text style={{ color: C.blue, fontSize: 18, fontWeight: "900", marginTop: 4 }}>{maskedEmail}</Text></View>}
      </Card>}

      {mode === "password" && <Card>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 13 }}>Forgot Password</Text>
        <Field value={email} onChangeText={setEmail} placeholder="Registered email / Login ID" keyboardType="email-address" />
        <Button label="Send Email OTP" color={C.green} onPress={sendResetOtp} loading={loading} />
      </Card>}

      {mode === "reset" && <Card>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 13 }}>Reset Password</Text>
        <Field value={otp} onChangeText={setOtp} placeholder="6-digit Email OTP" keyboardType="number-pad" maxLength={6} />
        <SecureField value={password} onChangeText={setPassword} placeholder="New password" />
        <SecureField value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" />
        <Button label="Reset Password" color={C.green} onPress={resetPassword} loading={loading} />
        <TouchableOpacity onPress={sendResetOtp} style={{ alignItems: "center", paddingVertical: 14 }}><Text style={{ color: C.blue, fontWeight: "900" }}>Resend Email OTP</Text></TouchableOpacity>
      </Card>}

      {mode === "success" && <Card><Text style={{ color: C.green, fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 14 }}>✅ Password Reset Complete</Text><Button label="Go to Login" color={C.green} onPress={onBack} /></Card>}
    </ScrollView>
  </KeyboardAvoidingView>;
}
