from pathlib import Path

path = Path('App.js')
text = path.read_text(encoding='utf-8')
original = text

old = '''  async function refreshUser() {
    try {
      const data = await apiGet("/auth/me", token);
      setUserFresh(data.user);
      const sub = await apiGet("/subscription/status", token);
      setSubStatus(sub);
    } catch {}
  }
'''
new = '''  async function refreshUser() {
    try {
      const data = await apiGet("/auth/me?_okai_ts=" + Date.now(), token);
      setUserFresh(data.user);
      const sub = await apiGet("/subscription/status?_okai_ts=" + Date.now(), token);
      setSubStatus(sub);
    } catch {}
  }

  useEffect(() => {
    const timer = setInterval(refreshUser, 10000);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshUser();
    });
    return () => {
      clearInterval(timer);
      appStateSubscription?.remove?.();
    };
  }, [token]);
'''
if old not in text:
    raise SystemExit('refreshUser block not found')
text = text.replace(old, new, 1)

old = '''      <Btn label={hi ? "Logout" : "Logout"} icon="🚪" color={C.red}
        onPress={() => Alert.alert(
          hi ? "Logout" : "Logout",
          hi ? "Aap logout karna chahte hain?" : "Do you want to logout?",
          [
            { text: hi ? "Cancel" : "Cancel", style: "cancel" },
            { text: hi ? "Logout" : "Logout", style: "destructive", onPress: onLogout }
          ])} />
'''
new = '''      <Btn label={hi ? "Logout" : "Logout"} icon="🚪" color={C.red}
        onPress={() => {
          if (Platform.OS === "web") {
            onLogout && onLogout();
            return;
          }
          Alert.alert(
            hi ? "Logout" : "Logout",
            hi ? "Aap logout karna chahte hain?" : "Do you want to logout?",
            [
              { text: hi ? "Cancel" : "Cancel", style: "cancel" },
              { text: hi ? "Logout" : "Logout", style: "destructive", onPress: onLogout }
            ]
          );
        }} />
'''
if old not in text:
    raise SystemExit('logout block not found')
text = text.replace(old, new, 1)

text = text.replace(
    '"₹5,000 for 30 days. Secure checkout opened. Pay using UPI / QR / supported payment method. After the verified payment, your account activates automatically."',
    '"₹5,000 for 30 days. Paytm / UPI payment page opened. Payment ke baad admin confirmation ke baad account 30 days ke liye activate hoga."',
    1,
)
text = text.replace('Pay ₹5,000 via UPI / QR', 'Pay ₹5,000 via Paytm / UPI', 1)
text = text.replace('["▣", "UPI / QR", "Secure verified payment checkout"]', '["▣", "Paytm / UPI", "Open the ₹5,000 payment page"]', 1)
text = text.replace('["✅", "Server Verified", "Automatic access after verified ₹5,000 payment"]', '["✅", "Manual Activation", "Admin confirms payment and activates 30 days"]', 1)

if text == original:
    raise SystemExit('no changes made')
path.write_text(text, encoding='utf-8')
print('subscription sync, manual payment copy and web logout patched')
