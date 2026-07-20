from pathlib import Path

path = Path("App.js")
app = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global app
    if old not in app:
        raise RuntimeError(f"{label} marker not found")
    app = app.replace(old, new, 1)


if 'const RecoveryScreen = require("./src/screens/RecoveryScreen").default;' not in app:
    replace_once(
        'const StrategyBuilderTab = require("./src/screens/StrategyBuilderTab");\n',
        'const StrategyBuilderTab = require("./src/screens/StrategyBuilderTab");\n'
        'const RecoveryScreen = require("./src/screens/RecoveryScreen").default;\n',
        "recovery import",
    )

if "function PasswordInput(" not in app:
    replace_once(
        "function ErrorBox({ msg }) {\n",
        '''function PasswordInput({ value, onChangeText, placeholder, style }) {
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
''',
        "password component",
    )

replace_once(
    'function LoginScreen({ onLogin, onRegister, lang, setLang }) {\n',
    'function LoginScreen({ onLogin, onRegister, onRecovery, lang, setLang }) {\n',
    "login props",
)
replace_once(
    '''          <TextInput style={st.input} value={password}
            onChangeText={setPassword} placeholder="Password"
            placeholderTextColor={C.muted} secureTextEntry />
''',
    '''          <PasswordInput value={password} onChangeText={setPassword}
            placeholder="Password" />
''',
    "login password eye",
)
replace_once(
    '''          <Btn label={hi ? "Login Karo" : "Login"} icon="🔑" onPress={handleLogin}
            loading={loading} style={{ marginTop: 4 }} />
        </Card>
        <TouchableOpacity onPress={onRegister}
''',
    '''          <Btn label={hi ? "Login Karo" : "Login"} icon="🔑" onPress={handleLogin}
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
''',
    "forgot links",
)

replace_once(
    '  const [showFullTerms, setShowFullTerms] = useState(false);\n',
    '''  const [showFullTerms, setShowFullTerms] = useState(false);
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
    if (String(emailOtp).replace(/\\D/g, "").length !== 6) {
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
''',
    "registration otp state",
)
replace_once(
    '''    setLoading(true);
    try {
      const d = await apiPost("/auth/register", {
''',
    '''    if (emailOtpAvailable && (!emailVerified || !emailVerificationToken)) {
      setError(hi ? "Register karne se pehle email OTP verify karo" : "Verify the email OTP before registration");
      return;
    }
    setLoading(true);
    try {
      const d = await apiPost("/auth/register", {
''',
    "require verified email",
)
replace_once(
    '''        email,
        phone,
        password,
''',
    '''        email,
        email_verification_token: emailVerificationToken || undefined,
        phone,
        password,
''',
    "registration token payload",
)
replace_once(
    '''          <TextInput style={st.input} value={email} onChangeText={setEmail}
            placeholder={hi ? "aapki@email.com" : "your@email.com"} placeholderTextColor={C.muted}
            autoCapitalize="none" keyboardType="email-address" />
''',
    '''          <TextInput style={st.input} value={email} onChangeText={changeRegistrationEmail}
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
''',
    "registration otp ui",
)
replace_once(
    '''          <TextInput style={st.input} value={password}
            onChangeText={setPassword} placeholder={hi ? "Kam se kam 6 characters" : "At least 6 characters"}
            placeholderTextColor={C.muted} secureTextEntry />
''',
    '''          <PasswordInput value={password} onChangeText={setPassword}
            placeholder={hi ? "Kam se kam 6 characters" : "At least 6 characters"} />
''',
    "register password eye",
)
replace_once(
    '''          <TextInput style={[st.input, { marginBottom: 20 }]}
            value={confirm} onChangeText={setConfirm}
            placeholder={hi ? "Password dobara daalo" : "Re-enter password"}
            placeholderTextColor={C.muted} secureTextEntry />
''',
    '''          <PasswordInput value={confirm} onChangeText={setConfirm}
            placeholder={hi ? "Password dobara daalo" : "Re-enter password"}
            style={{ marginBottom: 20 }} />
''',
    "confirm password eye",
)
replace_once(
    '  const [lang, setLang]     = useState("en");\n',
    '  const [lang, setLang]     = useState("en");\n'
    '  const [recoveryMode, setRecoveryMode] = useState("menu");\n',
    "recovery state",
)
replace_once(
    '  if (screen === "register") {\n',
    '''  if (screen === "recovery") {
    return <RecoveryScreen initialMode={recoveryMode}
      onBack={() => setScreen("login")} lang={lang} />;
  }
  if (screen === "register") {
''',
    "recovery screen route",
)
replace_once(
    '''  if (screen === "login") {
    return <LoginScreen onLogin={handleLogin}
      onRegister={() => setScreen("register")} lang={lang} setLang={changeLang} />;
  }
''',
    '''  if (screen === "login") {
    return <LoginScreen onLogin={handleLogin}
      onRegister={() => setScreen("register")}
      onRecovery={(mode) => { setRecoveryMode(mode || "menu"); setScreen("recovery"); }}
      lang={lang} setLang={changeLang} />;
  }
''',
    "login recovery routing",
)

path.write_text(app, encoding="utf-8")
print("Direct auth UI patch applied")
