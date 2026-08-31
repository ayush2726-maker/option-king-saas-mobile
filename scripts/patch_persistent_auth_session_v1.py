from pathlib import Path
import re

path = Path("App.js")
text = path.read_text()

start_marker = "// ── Main App ──────────────────────────────────────────────\nfunction InnerApp() {"
end_marker = "// ── Styles ────────────────────────────────────────────────"

if "OKAI-PERSISTENT-AUTH-SESSION-V1" in text:
    print("persistent auth session patch already installed")
    raise SystemExit(0)

start = text.find(start_marker)
end = text.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit("InnerApp markers not found")

replacement = r'''// ── Main App ──────────────────────────────────────────────
// OKAI-PERSISTENT-AUTH-SESSION-V1
function InnerApp() {
  const [screen, setScreen] = useState("loading");
  const [token, setToken]   = useState(null);
  const [user, setUser]     = useState(null);
  const [lang, setLang]     = useState("en");
  const [recoveryMode, setRecoveryMode] = useState("menu");

  const AUTH_SESSION_KEY = "okai_auth_session_v2";

  async function persistSession(nextToken, nextUser) {
    const safeToken = String(nextToken || "").trim();
    if (!safeToken) throw new Error("Missing auth token");

    const safeUser = nextUser && typeof nextUser === "object" ? nextUser : null;
    const writes = [
      ["saas_token", safeToken],
      [AUTH_SESSION_KEY, JSON.stringify({ token: safeToken, user: safeUser })],
    ];
    if (safeUser) writes.push(["saas_user", JSON.stringify(safeUser)]);
    await AsyncStorage.multiSet(writes);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [[, savedSession], [, savedToken], [, savedUser], [, savedLang]] =
          await AsyncStorage.multiGet([
            AUTH_SESSION_KEY,
            "saas_token",
            "saas_user",
            "okai_lang",
          ]);

        if (!active) return;
        if (savedLang === "hi" || savedLang === "en") setLang(savedLang);

        let session = null;
        try {
          session = savedSession ? JSON.parse(savedSession) : null;
        } catch {}

        const restoredToken = String(session?.token || savedToken || "").trim();
        let restoredUser = session?.user && typeof session.user === "object"
          ? session.user
          : null;

        if (!restoredUser && savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && typeof parsed === "object") restoredUser = parsed;
          } catch {}
        }

        // A valid saved token is enough to restore the session. Do not throw
        // the user back to Login just because the cached user JSON is absent.
        if (!restoredToken) {
          setScreen("login");
          return;
        }

        setToken(restoredToken);
        if (restoredUser) setUser(restoredUser);
        setScreen("dashboard");

        // Refresh the profile in the background. Network/server failures must
        // never destroy an otherwise persisted login session.
        try {
          const fresh = await apiGet("/auth/me", restoredToken);
          if (!active) return;
          if (fresh?.user) {
            setUser(fresh.user);
            await persistSession(restoredToken, fresh.user);
          } else if (restoredUser) {
            await persistSession(restoredToken, restoredUser);
          }
        } catch {
          if (restoredUser) {
            try { await persistSession(restoredToken, restoredUser); } catch {}
          }
        }
      } catch {
        if (active) setScreen("login");
      }
    })();

    return () => { active = false; };
  }, []);

  async function changeLang(next) {
    setLang(next);
    try { await AsyncStorage.setItem("okai_lang", next); } catch {}
  }

  async function handleLogin(t, u) {
    try {
      // Persist first so an immediate Android/OTA/app restart cannot lose the
      // session between successful login and the AsyncStorage write.
      await persistSession(t, u);
      setToken(t);
      setUser(u);
      setScreen("dashboard");
    } catch (error) {
      Alert.alert(
        "Login session error",
        "Login successful tha, lekin session phone me save nahi hua. Please login once more."
      );
    }
  }

  async function handleLogout() {
    await AsyncStorage.multiRemove([AUTH_SESSION_KEY, "saas_token", "saas_user"]);
    setToken(null); setUser(null); setScreen("login");
  }

  if (screen === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg,
        alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 40, marginBottom: 20 }}></Text>
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

'''

updated = text[:start] + replacement + text[end:]
# Await session persistence before leaving login/register loading state.
updated = updated.replace(
    'if (d.token) { onLogin(d.token, d.user); }',
    'if (d.token) { await onLogin(d.token, d.user); }'
)

path.write_text(updated)
print("Installed OKAI-PERSISTENT-AUTH-SESSION-V1")
