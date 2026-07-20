const React = require("react");
const RN = require("react-native");

const API_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  bg: "#0a0a0f",
  card: "#13131f",
  card2: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#777796",
  accent: "#7c6deb",
  blue: "#4d9fff",
  green: "#00d4a0",
  red: "#ff4d6d",
};

const originalCreateElement = React.createElement.bind(React);
const originalFetch = global.fetch.bind(global);

const authStore = {
  email: "",
  verifiedEmail: "",
  verificationToken: "",
  listeners: new Set(),
};

let installed = false;

function notifyStore() {
  const snapshot = {
    email: authStore.email,
    verifiedEmail: authStore.verifiedEmail,
    verificationToken: authStore.verificationToken,
  };
  authStore.listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {}
  });
}

function captureEmail(value) {
  const next = String(value || "").trim().toLowerCase();
  if (next === authStore.email) return;
  authStore.email = next;
  if (authStore.verifiedEmail !== next) {
    authStore.verifiedEmail = "";
    authStore.verificationToken = "";
  }
  notifyStore();
}

function useAuthStore() {
  const [snapshot, setSnapshot] = React.useState({
    email: authStore.email,
    verifiedEmail: authStore.verifiedEmail,
    verificationToken: authStore.verificationToken,
  });

  React.useEffect(() => {
    const listener = (next) => setSnapshot(next);
    authStore.listeners.add(listener);
    return () => authStore.listeners.delete(listener);
  }, []);

  return snapshot;
}

async function apiPost(path, body) {
  const response = await originalFetch(API_URL + path, {
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

function PasswordField(props) {
  const [visible, setVisible] = React.useState(false);
  const inputProps = { ...props };
  delete inputProps.__okaiEnhanced;

  return originalCreateElement(
    RN.View,
    { style: { position: "relative" } },
    originalCreateElement(RN.TextInput, {
      ...inputProps,
      secureTextEntry: !visible,
      style: [props.style, { paddingRight: 54 }],
    }),
    originalCreateElement(
      RN.TouchableOpacity,
      {
        onPress: () => setVisible(!visible),
        accessibilityLabel: visible ? "Hide password" : "Show password",
        style: {
          position: "absolute",
          right: 6,
          top: 4,
          width: 44,
          height: 42,
          alignItems: "center",
          justifyContent: "center",
        },
      },
      originalCreateElement(
        RN.Text,
        { style: { color: C.blue, fontSize: 17 } },
        visible ? "🙈" : "👁️"
      )
    )
  );
}

function Field(props) {
  return originalCreateElement(RN.TextInput, {
    autoCapitalize: "none",
    placeholderTextColor: C.muted,
    ...props,
    style: [
      {
        backgroundColor: C.card,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 11,
        color: C.text,
        fontSize: 14,
        paddingHorizontal: 13,
        paddingVertical: 12,
        marginBottom: 11,
      },
      props.style,
    ],
  });
}

function SecureField(props) {
  const [visible, setVisible] = React.useState(false);
  return originalCreateElement(
    RN.View,
    { style: { position: "relative" } },
    originalCreateElement(Field, {
      ...props,
      secureTextEntry: !visible,
      style: [props.style, { paddingRight: 54 }],
    }),
    originalCreateElement(
      RN.TouchableOpacity,
      {
        onPress: () => setVisible(!visible),
        style: {
          position: "absolute",
          right: 6,
          top: 3,
          width: 44,
          height: 42,
          alignItems: "center",
          justifyContent: "center",
        },
      },
      originalCreateElement(
        RN.Text,
        { style: { color: C.blue, fontSize: 17 } },
        visible ? "🙈" : "👁️"
      )
    )
  );
}

function SmallButton({ label, onPress, loading, color = C.accent }) {
  return originalCreateElement(
    RN.TouchableOpacity,
    {
      onPress,
      disabled: loading,
      style: {
        minHeight: 42,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: color + "77",
        backgroundColor: color + "20",
        alignItems: "center",
        justifyContent: "center",
      },
    },
    loading
      ? originalCreateElement(RN.ActivityIndicator, { color, size: "small" })
      : originalCreateElement(
          RN.Text,
          { style: { color, fontSize: 12, fontWeight: "900" } },
          label
        )
  );
}

function Notice({ text, error }) {
  if (!text) return null;
  const color = error ? C.red : C.green;
  return originalCreateElement(
    RN.View,
    {
      style: {
        borderRadius: 9,
        borderWidth: 1,
        borderColor: color + "66",
        backgroundColor: color + "16",
        padding: 10,
        marginBottom: 10,
      },
    },
    originalCreateElement(
      RN.Text,
      { style: { color, fontSize: 11, lineHeight: 17 } },
      text
    )
  );
}

function RegisterGate({ buttonType, buttonProps, buttonChildren }) {
  const store = useAuthStore();
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const verified = Boolean(
    store.verificationToken &&
      store.email &&
      store.verifiedEmail === store.email
  );

  async function sendOtp() {
    setError("");
    setMessage("");
    if (!store.email || !store.email.includes("@")) {
      setError("Registration form me valid email enter karo.");
      return;
    }

    setSending(true);
    try {
      const data = await apiPost("/auth/request-email-verification", {
        email: store.email,
      });
      setOtpSent(true);
      setOtp("");
      setMessage(data.message || "Email OTP sent.");
    } catch (err) {
      setError(err.message || "Email OTP send nahi hua.");
    }
    setSending(false);
  }

  async function verifyOtp() {
    setError("");
    setMessage("");
    const cleanOtp = String(otp || "").replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setError("6-digit email OTP enter karo.");
      return;
    }

    setVerifying(true);
    try {
      const data = await apiPost("/auth/verify-email-verification", {
        email: store.email,
        otp: cleanOtp,
      });
      if (!data.email_verification_token) {
        throw new Error("Email verification token nahi mila.");
      }
      authStore.verifiedEmail = store.email;
      authStore.verificationToken = data.email_verification_token;
      notifyStore();
      setMessage("Email verified successfully.");
    } catch (err) {
      setError(err.message || "Email OTP verify nahi hua.");
    }
    setVerifying(false);
  }

  function guardedRegister() {
    if (!verified) {
      setError("Register karne se pehle email OTP verify karo.");
      return;
    }
    setError("");
    if (typeof buttonProps.onPress === "function") {
      buttonProps.onPress();
    }
  }

  const safeButtonProps = {
    ...buttonProps,
    __okaiEnhanced: true,
    onPress: guardedRegister,
  };

  return originalCreateElement(
    RN.View,
    null,
    originalCreateElement(
      RN.View,
      {
        style: {
          backgroundColor: C.card2,
          borderWidth: 1,
          borderColor: verified ? C.green + "66" : C.blue + "55",
          borderRadius: 12,
          padding: 11,
          marginBottom: 12,
        },
      },
      originalCreateElement(
        RN.Text,
        { style: { color: C.text, fontSize: 12, fontWeight: "900", marginBottom: 8 } },
        verified ? "✅ Email Verified" : "✉️ Email Verification Required"
      ),
      originalCreateElement(Notice, { text: error, error: true }),
      originalCreateElement(Notice, { text: message, error: false }),
      !verified &&
        originalCreateElement(
          RN.View,
          null,
          originalCreateElement(SmallButton, {
            label: otpSent ? "Resend Email OTP" : "Send Email OTP",
            onPress: sendOtp,
            loading: sending,
            color: C.blue,
          }),
          otpSent &&
            originalCreateElement(
              RN.View,
              { style: { marginTop: 10 } },
              originalCreateElement(Field, {
                value: otp,
                onChangeText: setOtp,
                placeholder: "6-digit Email OTP",
                keyboardType: "number-pad",
                maxLength: 6,
              }),
              originalCreateElement(SmallButton, {
                label: "Verify Email",
                onPress: verifyOtp,
                loading: verifying,
                color: C.green,
              })
            )
        )
    ),
    originalCreateElement(buttonType, safeButtonProps, ...buttonChildren)
  );
}

function ModalCard({ children }) {
  return originalCreateElement(
    RN.View,
    {
      style: {
        backgroundColor: C.card2,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
      },
    },
    children
  );
}

function RecoveryModal({ visible, initialMode, onClose }) {
  const [mode, setMode] = React.useState(initialMode || "menu");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [maskedEmail, setMaskedEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (visible) {
      setMode(initialMode || "menu");
      setError("");
      setMessage("");
      setMaskedEmail("");
    }
  }, [visible, initialMode]);

  function resetStatus() {
    setError("");
    setMessage("");
  }

  async function recoverLoginId() {
    resetStatus();
    if (!name.trim() || String(phone).replace(/\D/g, "").length < 10) {
      setError("Registered full name aur mobile number enter karo.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost("/auth/recover-login-id", { name, phone });
      if (data.found && data.masked_email) {
        setMaskedEmail(data.masked_email);
        setMessage("Forgot Login ID result:");
      } else {
        setError("Details kisi active account se match nahi hui.");
      }
    } catch (err) {
      setError(err.message || "Login ID recovery failed.");
    }
    setLoading(false);
  }

  async function requestPasswordOtp() {
    resetStatus();
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Registered email / Login ID enter karo.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost("/auth/request-password-reset", {
        email: cleanEmail,
      });
      if (data.email_otp_available === false) {
        setError("Email OTP service abhi configured nahi hai.");
      } else {
        setMode("reset");
        setMessage("Registered account hua to email OTP bhej diya gaya hai.");
      }
    } catch (err) {
      setError(err.message || "Password reset OTP request failed.");
    }
    setLoading(false);
  }

  async function resetPassword() {
    resetStatus();
    const cleanOtp = String(otp || "").replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setError("6-digit OTP enter karo.");
      return;
    }
    if (password.length < 6) {
      setError("New password kam se kam 6 characters ka hona chahiye.");
      return;
    }
    if (password !== confirm) {
      setError("New password aur confirm password match nahi karte.");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/auth/reset-password", {
        email: String(email || "").trim().toLowerCase(),
        otp: cleanOtp,
        new_password: password,
      });
      setMode("success");
      setMessage("Password reset ho gaya. Ab naye password se login karo.");
    } catch (err) {
      setError(err.message || "Password reset failed.");
    }
    setLoading(false);
  }

  return originalCreateElement(
    RN.Modal,
    {
      visible,
      animationType: "slide",
      onRequestClose: onClose,
      transparent: false,
    },
    originalCreateElement(
      RN.KeyboardAvoidingView,
      {
        style: { flex: 1, backgroundColor: C.bg },
        behavior: RN.Platform.OS === "ios" ? "padding" : undefined,
      },
      originalCreateElement(
        RN.ScrollView,
        { contentContainerStyle: { padding: 20, paddingTop: 50, paddingBottom: 40 } },
        originalCreateElement(
          RN.TouchableOpacity,
          {
            onPress: mode === "menu" || mode === "success" ? onClose : () => setMode("menu"),
            style: { marginBottom: 18 },
          },
          originalCreateElement(
            RN.Text,
            { style: { color: C.accent, fontSize: 14, fontWeight: "900" } },
            mode === "menu" || mode === "success" ? "← Back to Login" : "← Recovery Options"
          )
        ),
        originalCreateElement(
          RN.Text,
          { style: { fontSize: 36, textAlign: "center" } },
          "🔐"
        ),
        originalCreateElement(
          RN.Text,
          {
            style: {
              color: C.text,
              fontSize: 22,
              fontWeight: "900",
              textAlign: "center",
              marginTop: 7,
              marginBottom: 20,
            },
          },
          "Account Recovery"
        ),
        originalCreateElement(Notice, { text: error, error: true }),
        originalCreateElement(Notice, { text: message, error: false }),
        mode === "menu" &&
          originalCreateElement(
            RN.View,
            { style: { gap: 12 } },
            originalCreateElement(
              ModalCard,
              null,
              originalCreateElement(
                RN.Text,
                { style: { color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 8 } },
                "🪪 Forgot Login ID"
              ),
              originalCreateElement(
                RN.Text,
                { style: { color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 13 } },
                "Registered full name aur mobile number se masked login email dekho."
              ),
              originalCreateElement(SmallButton, {
                label: "Forgot Login ID",
                onPress: () => setMode("loginId"),
                color: C.blue,
              })
            ),
            originalCreateElement(
              ModalCard,
              null,
              originalCreateElement(
                RN.Text,
                { style: { color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 8 } },
                "🔑 Forgot Password"
              ),
              originalCreateElement(
                RN.Text,
                { style: { color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 13 } },
                "Registered email par OTP lekar naya password set karo."
              ),
              originalCreateElement(SmallButton, {
                label: "Forgot Password",
                onPress: () => setMode("password"),
                color: C.green,
              })
            )
          ),
        mode === "loginId" &&
          originalCreateElement(
            ModalCard,
            null,
            originalCreateElement(
              RN.Text,
              { style: { color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 13 } },
              "Forgot Login ID"
            ),
            originalCreateElement(Field, {
              value: name,
              onChangeText: setName,
              placeholder: "Registered full name",
              autoCapitalize: "words",
            }),
            originalCreateElement(Field, {
              value: phone,
              onChangeText: setPhone,
              placeholder: "Registered mobile number",
              keyboardType: "phone-pad",
            }),
            originalCreateElement(SmallButton, {
              label: "Forgot Login ID",
              onPress: recoverLoginId,
              loading,
              color: C.blue,
            }),
            Boolean(maskedEmail) &&
              originalCreateElement(
                RN.View,
                {
                  style: {
                    marginTop: 13,
                    borderRadius: 10,
                    padding: 12,
                    backgroundColor: C.card,
                    borderWidth: 1,
                    borderColor: C.blue + "55",
                  },
                },
                originalCreateElement(
                  RN.Text,
                  { style: { color: C.muted, fontSize: 11 } },
                  "Login ID"
                ),
                originalCreateElement(
                  RN.Text,
                  { style: { color: C.blue, fontSize: 18, fontWeight: "900", marginTop: 5 } },
                  maskedEmail
                )
              )
          ),
        mode === "password" &&
          originalCreateElement(
            ModalCard,
            null,
            originalCreateElement(
              RN.Text,
              { style: { color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 13 } },
              "Forgot Password"
            ),
            originalCreateElement(Field, {
              value: email,
              onChangeText: setEmail,
              placeholder: "Registered email / Login ID",
              keyboardType: "email-address",
            }),
            originalCreateElement(SmallButton, {
              label: "Send Email OTP",
              onPress: requestPasswordOtp,
              loading,
              color: C.green,
            })
          ),
        mode === "reset" &&
          originalCreateElement(
            ModalCard,
            null,
            originalCreateElement(
              RN.Text,
              { style: { color: C.text, fontSize: 16, fontWeight: "900", marginBottom: 13 } },
              "Reset Password"
            ),
            originalCreateElement(Field, {
              value: otp,
              onChangeText: setOtp,
              placeholder: "6-digit Email OTP",
              keyboardType: "number-pad",
              maxLength: 6,
            }),
            originalCreateElement(SecureField, {
              value: password,
              onChangeText: setPassword,
              placeholder: "New password",
            }),
            originalCreateElement(SecureField, {
              value: confirm,
              onChangeText: setConfirm,
              placeholder: "Confirm new password",
            }),
            originalCreateElement(SmallButton, {
              label: "Reset Password",
              onPress: resetPassword,
              loading,
              color: C.green,
            }),
            originalCreateElement(
              RN.TouchableOpacity,
              { onPress: requestPasswordOtp, disabled: loading, style: { paddingVertical: 14, alignItems: "center" } },
              originalCreateElement(
                RN.Text,
                { style: { color: C.blue, fontSize: 12, fontWeight: "900" } },
                "Resend Email OTP"
              )
            )
          ),
        mode === "success" &&
          originalCreateElement(
            ModalCard,
            null,
            originalCreateElement(
              RN.Text,
              { style: { color: C.green, fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 14 } },
              "✅ Password Reset Complete"
            ),
            originalCreateElement(SmallButton, {
              label: "Go to Login",
              onPress: onClose,
              color: C.green,
            })
          )
      )
    )
  );
}

function LoginRecoveryLinks({ buttonType, buttonProps, buttonChildren }) {
  const [visible, setVisible] = React.useState(false);
  const [mode, setMode] = React.useState("menu");

  function open(nextMode) {
    setMode(nextMode);
    setVisible(true);
  }

  return originalCreateElement(
    RN.View,
    null,
    originalCreateElement(
      buttonType,
      { ...buttonProps, __okaiEnhanced: true },
      ...buttonChildren
    ),
    originalCreateElement(
      RN.View,
      {
        style: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 22,
          marginTop: 15,
          marginBottom: 2,
        },
      },
      originalCreateElement(
        RN.TouchableOpacity,
        { onPress: () => open("loginId") },
        originalCreateElement(
          RN.Text,
          { style: { color: C.blue, fontSize: 12, fontWeight: "900" } },
          "Forgot Login ID"
        )
      ),
      originalCreateElement(
        RN.TouchableOpacity,
        { onPress: () => open("password") },
        originalCreateElement(
          RN.Text,
          { style: { color: C.green, fontSize: 12, fontWeight: "900" } },
          "Forgot Password"
        )
      )
    ),
    originalCreateElement(RecoveryModal, {
      visible,
      initialMode: mode,
      onClose: () => setVisible(false),
    })
  );
}

function patchedCreateElement(type, props, ...children) {
  const safeProps = props || {};

  if (
    type === RN.TextInput &&
    safeProps.secureTextEntry === true &&
    !safeProps.__okaiEnhanced
  ) {
    return originalCreateElement(PasswordField, safeProps);
  }

  if (
    type === RN.TextInput &&
    safeProps.keyboardType === "email-address" &&
    !safeProps.__okaiEnhanced
  ) {
    const originalOnChange = safeProps.onChangeText;
    return originalCreateElement(
      type,
      {
        ...safeProps,
        __okaiEnhanced: true,
        onChangeText: (value) => {
          captureEmail(value);
          if (typeof originalOnChange === "function") {
            originalOnChange(value);
          }
        },
      },
      ...children
    );
  }

  if (
    typeof type === "function" &&
    !safeProps.__okaiEnhanced &&
    (safeProps.label === "Register" || safeProps.label === "Register Karo")
  ) {
    return originalCreateElement(RegisterGate, {
      buttonType: type,
      buttonProps: safeProps,
      buttonChildren: children,
    });
  }

  if (
    typeof type === "function" &&
    !safeProps.__okaiEnhanced &&
    (safeProps.label === "Login" || safeProps.label === "Login Karo")
  ) {
    return originalCreateElement(LoginRecoveryLinks, {
      buttonType: type,
      buttonProps: safeProps,
      buttonChildren: children,
    });
  }

  return originalCreateElement(type, safeProps, ...children);
}

async function patchedFetch(input, init = {}) {
  const url = typeof input === "string" ? input : String(input && input.url ? input.url : input);
  if (url.includes("/auth/register") && String(init.method || "GET").toUpperCase() === "POST") {
    try {
      const body = JSON.parse(String(init.body || "{}"));
      const email = String(body.email || "").trim().toLowerCase();
      if (
        authStore.verificationToken &&
        authStore.verifiedEmail &&
        authStore.verifiedEmail === email
      ) {
        body.email_verification_token = authStore.verificationToken;
        init = { ...init, body: JSON.stringify(body) };
      }
    } catch (error) {}
  }
  return originalFetch(input, init);
}

function installAuthEnhancements() {
  if (installed) return;
  installed = true;
  React.createElement = patchedCreateElement;
  global.fetch = patchedFetch;
}

module.exports = { installAuthEnhancements };
