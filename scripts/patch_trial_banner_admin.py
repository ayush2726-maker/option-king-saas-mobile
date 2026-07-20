from pathlib import Path

path = Path("App.js")
app = path.read_text(encoding="utf-8")


def replace_once(old, new, label):
    global app
    if old not in app:
        raise RuntimeError(f"{label} marker not found")
    app = app.replace(old, new, 1)


replace_once(
    '''function HomeTab({ user, subStatus, token, onSubscribe, setActiveTab, lang }) {
  const hi = lang === "hi";
  const daysLeft = subStatus?.days_remaining ?? null;
''',
    '''function HomeTab({ user, subStatus, token, onSubscribe, setActiveTab, lang }) {
  const hi = lang === "hi";
  const isAdmin = !!user?.is_admin;
  const statusForDisplay = isAdmin
    ? "admin"
    : (subStatus?.subscription_status || user?.subscription_status || "trial");
  const daysLeft = isAdmin ? null : (subStatus?.days_remaining ?? null);
''',
    "home status variables",
)

replace_once(
    '''            <Tag label={user?.subscription_status?.toUpperCase()||"TRIAL"}
              color={user?.subscription_status==="active"?C.green:C.accent} />
          </Row>
          {daysLeft !== null && (
            <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>{hi ? "Bacha hua time" : "Time remaining"}</Text>
              <Text style={{ color: daysLeft<=3?C.red:C.green,
                fontWeight: "900", fontSize: 13 }}>{hi ? `${daysLeft} din` : `${daysLeft} days`}</Text>
            </Row>
          )}
''',
    '''            <Tag label={isAdmin ? "ADMIN" : statusForDisplay.toUpperCase()}
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
''',
    "home tag and time",
)

replace_once(
    '''      {user?.subscription_status !== "active" && (
        <Btn label={hi ? "Plans Dekho" : "View Plans"} icon="💎" color={C.gold}
          onPress={onSubscribe} />
      )}
''',
    '''      {!isAdmin && statusForDisplay !== "active" && Number(daysLeft ?? 0) <= 0 && (
        <Btn label={hi ? "Plans Dekho" : "View Plans"} icon="💎" color={C.gold}
          onPress={onSubscribe} />
      )}
''',
    "home plans button",
)

replace_once(
    '''function AccountTab({ user, subStatus, onLogout, onRefresh, lang }) {
  const hi = lang === "hi";
  return (
''',
    '''function AccountTab({ user, subStatus, onLogout, onRefresh, lang }) {
  const hi = lang === "hi";
  const isAdmin = !!user?.is_admin;
  const accountStatus = isAdmin
    ? "ADMIN"
    : (subStatus?.subscription_status || user?.subscription_status || "trial").toUpperCase();
  return (
''',
    "account variables",
)

replace_once(
    '''        <Tag label={user?.subscription_status?.toUpperCase()||"TRIAL"}
          color={user?.subscription_status==="active"?C.green:C.accent} />
''',
    '''        <Tag label={accountStatus}
          color={isAdmin || accountStatus==="ACTIVE" ? C.green : C.accent} />
''',
    "account tag",
)

replace_once(
    '''        {[
          [hi ? "Status" : "Status", user?.subscription_status?.toUpperCase() || "--"],
          [hi ? "Bacha hua time" : "Time remaining", subStatus?.days_remaining != null
            ? (hi ? `${subStatus.days_remaining} din` : `${subStatus.days_remaining} days`) : "--"],
          [hi ? "Trial ends" : "Trial ends", formatDateSafe(user?.trial_ends_at)],
          [hi ? "Member since" : "Member since", formatDateSafe(user?.created_at)],
        ].map(([l, v]) => (
''',
    '''        {[
          [hi ? "Status" : "Status", accountStatus],
          [hi ? "Bacha hua time" : "Time remaining", isAdmin
            ? "Unlimited"
            : (subStatus?.days_remaining != null
              ? (hi ? `${subStatus.days_remaining} din` : `${subStatus.days_remaining} days`)
              : "--")],
          [hi ? "Trial ends" : "Trial ends", isAdmin ? "Not applicable" : formatDateSafe(user?.trial_ends_at)],
          [hi ? "Member since" : "Member since", formatDateSafe(user?.created_at)],
        ].map(([l, v]) => (
''',
    "account details",
)

replace_once(
    '''  const isAdmin = userFresh?.role==="admin" || userFresh?.is_admin;

  const tabs = [
''',
    '''  const isAdmin = userFresh?.role==="admin" || !!userFresh?.is_admin;
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
''',
    "dashboard subscription variables",
)

replace_once(
    '''          <Tag label={userFresh?.subscription_status?.toUpperCase()||"TRIAL"}
            color={userFresh?.subscription_status==="active"?C.green:C.accent} />
''',
    '''          <Tag label={isAdmin ? "ADMIN" : effectiveSubscriptionStatus.toUpperCase()}
            color={isAdmin || effectiveSubscriptionStatus==="active" ? C.green : C.accent} />
''',
    "dashboard header tag",
)

replace_once(
    '''      {/* Subscription warning */}
      {userFresh?.subscription_status !== "active" && (
        <TouchableOpacity
          onPress={() => navigateTo("more")}
          style={{ backgroundColor: C.redLo, borderRadius: 12,
            padding: 14, margin: 16, marginBottom: 0,
            borderWidth: 1, borderColor: C.red+"55" }}>
          <Text style={{ color: C.red, fontWeight: "900",
            fontSize: 13 }}>⚠️ Trial khatam — Subscribe karo → ₹1,999/month</Text>
        </TouchableOpacity>
      )}
''',
    '''      {/* Subscription warning */}
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
''',
    "dashboard warning",
)

replace_once(
    '''          <HomeTab user={userFresh} subStatus={subStatus} token={token}
            setActiveTab={navigateTo} onSubscribe={() => navigateTo("more")} lang={lang} />
''',
    '''          <HomeTab user={displayUser} subStatus={displaySubStatus} token={token}
            setActiveTab={navigateTo} onSubscribe={() => navigateTo("more")} lang={lang} />
''',
    "dashboard home props",
)

replace_once(
    '''        {activeTab === "more" && <MoreTab token={token} user={userFresh} lang={lang} setLang={setLang} isAdmin={isAdmin} />}
''',
    '''        {activeTab === "more" && <MoreTab token={token} user={displayUser} lang={lang} setLang={setLang} isAdmin={isAdmin} />}
''',
    "dashboard more props",
)

replace_once(
    '''          <PlansTab token={token} user={userFresh}
            onSuccess={refreshUser} />
''',
    '''          <PlansTab token={token} user={displayUser}
            onSuccess={refreshUser} />
''',
    "dashboard plans props",
)

replace_once(
    '''          <TabErrorBoundary><AccountTab user={userFresh} subStatus={subStatus} onLogout={onLogout} onRefresh={refreshUser} lang={lang} /></TabErrorBoundary>
''',
    '''          <TabErrorBoundary><AccountTab user={displayUser} subStatus={displaySubStatus} onLogout={onLogout} onRefresh={refreshUser} lang={lang} /></TabErrorBoundary>
''',
    "dashboard account props",
)

path.write_text(app, encoding="utf-8")
print("Trial banner and admin display patch applied")
