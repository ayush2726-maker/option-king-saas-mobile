from pathlib import Path

path = Path("App.js")
app = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global app
    if old not in app:
        raise RuntimeError(f"{label} marker not found")
    app = app.replace(old, new, 1)


# Home: refresh market/signal and also refresh current user/subscription status.
replace_once(
    'function HomeTab({ user, subStatus, token, onSubscribe, setActiveTab, lang }) {\n',
    'function HomeTab({ user, subStatus, token, onSubscribe, setActiveTab, lang, onPageRefresh }) {\n',
    "home props",
)
replace_once(
    '''    try {
      const mkt = await apiGet("/market/status", token);
      setMarket(mkt);
    } catch (e) {}
    setLoading(false);
''',
    '''    try {
      const mkt = await apiGet("/market/status", token);
      setMarket(mkt);
    } catch (e) {}
    try {
      if (onPageRefresh) await onPageRefresh();
    } catch (e) {}
    setLoading(false);
''',
    "home global refresh",
)

# Trade page.
replace_once(
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={trade?.status === "OPEN" ? C.green : C.blue}>
''',
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={loadTrade} tintColor={C.blue} colors={[C.blue]} />}>

      <Card glow={trade?.status === "OPEN" ? C.green : C.blue}>
''',
    "trade refresh",
)

# Hero Zero page.
replace_once(
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={C.red}>
''',
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={loadTrade} tintColor={C.red} colors={[C.red]} />}>

      <Card glow={C.red}>
''',
    "hero zero refresh",
)

# Live feed page.
replace_once(
    '''function LiveFeedTab({ token }) {
''',
    '''function LiveFeedTab({ token }) {
''',
    "live feed function",
)
replace_once(
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={market?.feed_connected ? C.green : C.red}>
''',
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={load} tintColor={C.green} colors={[C.green]} />}>

      <Card glow={market?.feed_connected ? C.green : C.red}>
''',
    "live feed refresh",
)

# Server test page.
replace_once(
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={result?.ok ? C.green : C.red}>
''',
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={runTest} tintColor={C.orange} colors={[C.orange]} />}>

      <Card glow={result?.ok ? C.green : C.red}>
''',
    "server test refresh",
)

# More page.
replace_once(
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

<Card glow={C.blue}>
''',
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={loading}
        onRefresh={loadAll} tintColor={C.blue} colors={[C.blue]} />}>

<Card glow={C.blue}>
''',
    "more refresh",
)

# Account page with a real refreshing state.
replace_once(
    '''function AccountTab({ user, subStatus, onLogout, onRefresh, lang }) {
  const hi = lang === "hi";
  const isAdmin = !!user?.is_admin;
''',
    '''function AccountTab({ user, subStatus, onLogout, onRefresh, lang }) {
  const hi = lang === "hi";
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = !!user?.is_admin;
''',
    "account refresh state",
)
replace_once(
    '''  const accountStatus = isAdmin
    ? "ADMIN"
    : (subStatus?.subscription_status || user?.subscription_status || "trial").toUpperCase();
  return (
''',
    '''  const accountStatus = isAdmin
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
''',
    "account refresh handler",
)
replace_once(
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

      <Card glow={C.purple}>
''',
    '''    <ScrollView style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={refreshAccount} tintColor={C.purple} colors={[C.purple]} />}>

      <Card glow={C.purple}>
''',
    "account refresh control",
)
replace_once(
    '''      <Btn label={hi ? "Refresh Karo" : "Refresh"} icon="🔄" color={C.blue} onPress={onRefresh} />
''',
    '''      <Btn label={hi ? "Refresh Karo" : "Refresh"} icon="🔄" color={C.blue}
        loading={refreshing} onPress={refreshAccount} />
''',
    "account button",
)

# Dashboard passes the central profile/subscription refresh to Home.
replace_once(
    '''          <HomeTab user={displayUser} subStatus={displaySubStatus} token={token}
            setActiveTab={navigateTo} onSubscribe={() => navigateTo("more")} lang={lang} />
''',
    '''          <HomeTab user={displayUser} subStatus={displaySubStatus} token={token}
            setActiveTab={navigateTo} onSubscribe={() => navigateTo("more")}
            onPageRefresh={refreshUser} lang={lang} />
''',
    "home dashboard props",
)

path.write_text(app, encoding="utf-8")
print("Pull-to-refresh patch applied")
