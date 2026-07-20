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
  bg: "#0a0a0f",
  s1: "#0f0f1a",
  s2: "#13131f",
  border: "#1e1e30",
  border2: "#252540",
  text: "#e8e8f0",
  sub: "#a0a0c0",
  muted: "#606080",
  accent: "#7c6deb",
  green: "#00d4a0",
  red: "#ff4d6d",
  blue: "#4d9fff",
};

async function post(path, body) {
  const response = await fetch(API_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = {};
  try {
    data = await response.json();
  } catch (error) {}
  if (!response.ok) {
    throw new Error(data.detail || data.message || "Request failed");
  }
  return data;
}

function Input(props) {
  return (
    <TextInput
      {...props}
      autoCapitalize="none"
      placeholderTextColor={C.muted}
      style={{
        backgroundColor: C.s2,
        borderColor: C.border2,
        borderWidth: 1,
        borderRadius: 12,
        color: C.text,
        fontSize: 14,
        paddingHorizontal: 14,
        paddingVertical: 13,
        marginBottom: 12,
      }}
    />
  );
}

function Button({ label, onPress, loading, color = C.accent }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{
        backgroundColor: color + "22",
        borderColor: color + "66",
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: "center",
      }}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={{ color, fontSize: 14, fontWeight: "900" }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: C.s1,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
      }}
    >
      {children}
    </View>
  );
}

function RecoveryScreen({ onBack, lang }) {
  const hi = lang === "hi";
  const [mode, setMode] = useState("menu");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function clearStatus() {
    setError("");
    setMessage("");
  }

  function selectMode(next) {
    clearStatus();
    setMaskedEmail("");
    setMode(next);
  }

  async function recoverLoginId() {
    clearStatus();
    if (!name.trim() || String(phone).replace(/\D/g, "").length < 10) {
      setError(hi ? "Registered full name aur WhatsApp number daalo" : "Enter the registered full name and WhatsApp number");
      return;
    }
    setLoading(true);
    try {
      const data = await post("/auth/recover-login-id", { name, phone });
      if (data.found && data.masked_email) {
        setMaskedEmail(data.masked_email);
        setMessage(hi ? "Aapka Forgot Login ID result:" : "Forgot Login ID result:");
      } else {
        setError(hi ? "Details kisi active account se match nahi hui" : "Details did not match an active account");
      }
    } catch (err) {
      setError(err.message || "Request failed");
    }
    setLoading(false);
  }

  async function sendOtp() {
    clearStatus();
    if (!email.trim() || !email.includes("@")) {
      setError(hi ? "Registered email / Login ID daalo" : "Enter the registered email / Login ID");
      return;
    }
    setLoading(true);
    try {
      const data = await post("/auth/request-password-reset", { email });
      if (data.email_otp_available === false) {
        setError(hi ? "Email OTP service abhi setup nahi hai. Support se contact karo." : "Email OTP service is not configured yet. Contact support.");
      } else {
        setMessage(hi ? "Account registered hua to 6-digit OTP email par bhej diya gaya hai." : "If the account is registered, a 6-digit OTP has been sent by email.");
        setMode("otp");
      }
    } catch (err) {
      setError(err.message || "OTP request failed");
    }
    setLoading(false);
  }

  async function resetPassword() {
    clearStatus();
    if (String(otp).replace(/\D/g, "").length !== 6) {
      setError(hi ? "6-digit OTP daalo" : "Enter the 6-digit OTP");
      return;
    }
    if (password.length < 6) {
      setError(hi ? "Password kam se kam 6 characters ka ho" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError(hi ? "Dono password match nahi karte" : "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await post("/auth/reset-password", {
        email,
        otp,
        new_password: password,
      });
      setMode("success");
      setMessage(hi ? "Password reset ho gaya. Ab naye password se login karo." : "Password reset successfully. Login with the new password.");
    } catch (err) {
      setError(err.message || "Password reset failed");
    }
    setLoading(false);
  }

  const backAction = mode === "menu" || mode === "success"
    ? onBack
    : () => selectMode("menu");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }}>
        <TouchableOpacity onPress={backAction} style={{ marginBottom: 18 }}>
          <Text style={{ color: C.accent, fontSize: 14, fontWeight: "800" }}>
            ← {mode === "menu" || mode === "success" ? (hi ? "Login par wapas" : "Back to Login") : (hi ? "Recovery options" : "Recovery options")}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 38, textAlign: "center" }}>🔐</Text>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 8 }}>
          Account Recovery
        </Text>
        <Text style={{ color: C.muted, fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 5, marginBottom: 22 }}>
          {hi ? "Login ID ya password bhool gaye ho to yahan se recover karo." : "Recover your Login ID or securely reset your password."}
        </Text>

        {!!error && (
          <View style={{ backgroundColor: C.red + "15", borderColor: C.red + "55", borderWidth: 1, borderRadius: 10, padding: 11, marginBottom: 12 }}>
            <Text style={{ color: C.red, fontSize: 12, lineHeight: 18 }}>{error}</Text>
          </View>
        )}

        {!!message && (
          <View style={{ backgroundColor: C.green + "15", borderColor: C.green + "55", borderWidth: 1, borderRadius: 10, padding: 11, marginBottom: 12 }}>
            <Text style={{ color: C.green, fontSize: 12, lineHeight: 18 }}>{message}</Text>
          </View>
        )}

        {mode === "menu" && (
          <>
            <Card>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 6 }}>🪪 Forgot Login ID</Text>
              <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
                {hi ? "Registered full name aur WhatsApp number se masked login email dekho." : "Use the registered full name and WhatsApp number to view the masked login email."}
              </Text>
              <Button label="Forgot Login ID" color={C.blue} onPress={() => selectMode("id")} />
            </Card>

            <Card>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 6 }}>🔑 Forgot Password</Text>
              <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
                {hi ? "Registered email par OTP lekar naya password banao." : "Receive an OTP on the registered email and create a new password."}
              </Text>
              <Button label="Forgot Password" color={C.green} onPress={() => selectMode("password")} />
            </Card>
          </>
        )}

        {mode === "id" && (
          <Card>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 14 }}>Forgot Login ID</Text>
            <Input value={name} onChangeText={setName} placeholder="Registered full name" />
            <Input value={phone} onChangeText={setPhone} placeholder="Registered WhatsApp number" keyboardType="phone-pad" />
            <Button label="Forgot Login ID" color={C.blue} onPress={recoverLoginId} loading={loading} />
            {!!maskedEmail && (
              <View style={{ backgroundColor: C.s2, borderRadius: 12, padding: 14, marginTop: 14, borderWidth: 1, borderColor: C.blue + "55" }}>
                <Text style={{ color: C.muted, fontSize: 11 }}>Login ID</Text>
                <Text style={{ color: C.blue, fontSize: 18, fontWeight: "900", marginTop: 5 }}>{maskedEmail}</Text>
              </View>
            )}
          </Card>
        )}

        {mode === "password" && (
          <Card>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 6 }}>Forgot Password</Text>
            <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginBottom: 14 }}>
              {hi ? "Security ke liye app account exist karta hai ya nahi confirm nahi karega." : "For security, the app will not confirm whether an account exists."}
            </Text>
            <Input value={email} onChangeText={setEmail} placeholder="Registered email / Login ID" keyboardType="email-address" />
            <Button label="Send OTP" color={C.green} onPress={sendOtp} loading={loading} />
          </Card>
        )}

        {mode === "otp" && (
          <Card>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 6 }}>Reset Password</Text>
            <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginBottom: 14 }}>{email}</Text>
            <Input value={otp} onChangeText={setOtp} placeholder="6-digit OTP" keyboardType="number-pad" maxLength={6} />
            <Input value={password} onChangeText={setPassword} placeholder="New password" secureTextEntry />
            <Input value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" secureTextEntry />
            <Button label="Reset Password" color={C.green} onPress={resetPassword} loading={loading} />
            <TouchableOpacity onPress={sendOtp} disabled={loading} style={{ paddingVertical: 14, alignItems: "center" }}>
              <Text style={{ color: C.blue, fontSize: 12, fontWeight: "800" }}>Resend OTP</Text>
            </TouchableOpacity>
          </Card>
        )}

        {mode === "success" && (
          <Card>
            <Text style={{ color: C.green, fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 8 }}>✅ Password Reset Complete</Text>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: 16 }}>{message}</Text>
            <Button label="Go to Login" color={C.green} onPress={onBack} />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

module.exports = RecoveryScreen;
