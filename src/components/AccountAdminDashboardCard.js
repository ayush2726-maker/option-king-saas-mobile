const React = require("react");
const { ActivityIndicator, Alert, Text, TouchableOpacity, View } = require("react-native");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  card: "#13131f",
  s2: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#a0a0c0",
  green: "#00d4a0",
  red: "#ff4d6d",
  blue: "#4d9fff",
  gold: "#f5c842",
};

async function apiGet(path, token) {
  const r = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  const d = await r.json();
  if (!r.ok || d?.success === false) {
    const e = new Error(d?.detail || d?.message || "Request failed");
    e.status = r.status;
    throw e;
  }
  return d;
}

async function apiPost(path, token, body) {
  const r = await fetch(SAAS_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body || {}),
  });
  const d = await r.json();
  if (!r.ok || d?.success === false) {
    const e = new Error(d?.detail || d?.message || "Request failed");
    e.status = r.status;
    throw e;
  }
  return d;
}

function Row({ label, value, color }) {
  return React.createElement(
    View,
    {
      style: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      },
    },
    React.createElement(Text, { style: { color: C.muted, fontSize: 12 } }, label),
    React.createElement(
      Text,
      { style: { color: color || C.text, fontSize: 12, fontWeight: "900", maxWidth: "62%", textAlign: "right" } },
      String(value ?? "--")
    )
  );
}

function AccountAdminDashboardCard({ token }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [cleanup, setCleanup] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const [deletingEmail, setDeletingEmail] = React.useState("");
  const [activatingId, setActivatingId] = React.useState(null);
  const [deactivatingId, setDeactivatingId] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setMsg("");
    try {
      const [dash, userList, cleanupReport] = await Promise.all([
        apiGet("/admin/dashboard", token),
        apiGet("/admin/users?limit=50", token),
        apiGet("/admin/cleanup-report", token),
      ]);
      setData(dash || {});
      setUsers(Array.isArray(userList?.users) ? userList.users : []);
      setCleanup(cleanupReport || null);
      setHidden(false);
    } catch (e) {
      if (e.status === 403) setHidden(true);
      else setMsg(e.message || "Admin dashboard load failed");
    }
    setLoading(false);
  }, [token]);

  React.useEffect(() => { load(); }, [load]);

  function activateUser(user) {
    const id = Number(user?.id || 0);
    const email = String(user?.email || "").trim();
    const name = String(user?.name || email || `User #${id}`).trim();
    if (!id) return;

    Alert.alert(
      "Activate Subscription",
      `Activate ${name}\n${email}\n\nThis grants 30 days of Option King AI access without collecting payment.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate 30 Days",
          onPress: async () => {
            setActivatingId(id);
            setMsg("");
            try {
              const d = await apiPost(`/admin/users/${id}/activate`, token, {});
              setMsg(d?.message || `${name} activated for 30 days`);
              await load();
            } catch (e) {
              setMsg(e.message || "Activation failed");
            } finally {
              setActivatingId(null);
            }
          },
        },
      ]
    );
  }

  function deactivateSubscription(user) {
    const id = Number(user?.id || 0);
    const email = String(user?.email || "").trim();
    const name = String(user?.name || email || `User #${id}`).trim();
    if (!id) return;

    Alert.alert(
      "Deactivate Subscription?",
      `Deactivate ${name}\n${email}\n\nPaid/app access will expire now. Login remains enabled so the customer can renew for ₹5,000 / 30 days.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            setDeactivatingId(id);
            setMsg("");
            try {
              const d = await apiPost(`/admin/users/${id}/deactivate-subscription`, token, {});
              setMsg(d?.message || `${name} subscription deactivated`);
              await load();
            } catch (e) {
              setMsg(e.message || "Deactivation failed");
            } finally {
              setDeactivatingId(null);
            }
          },
        },
      ]
    );
  }

  async function deleteUser(user) {
    const email = String(user?.email || "").trim();
    const name = String(user?.name || email || "User").trim();

    if (!email) {
      Alert.alert("Delete User", "User email missing.");
      return;
    }

    Alert.alert(
      "Delete User?",
      `Delete ${name}\n${email}\n\nYe action undo nahi hoga.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingEmail(email);
            setMsg("");
            try {
              const d = await apiPost("/admin/users/delete-by-email", token, {
                emails: [email],
                confirm: "DELETE USER",
              });
              const deleted = Array.isArray(d?.deleted) ? d.deleted : [];
              const skipped = Array.isArray(d?.skipped) ? d.skipped : [];
              if (deleted.length > 0) {
                setMsg(`Deleted: ${email}`);
                await load();
              } else if (skipped.length > 0) {
                setMsg(`Skipped: ${skipped[0]?.reason || "not deleted"}`);
              } else setMsg("User not deleted");
            } catch (e) {
              setMsg(e.message || "Delete failed");
            } finally {
              setDeletingEmail("");
            }
          },
        },
      ]
    );
  }

  if (hidden) return null;

  const stats = data?.stats || {};
  const cleanupUsers = Array.isArray(cleanup?.users) ? cleanup.users : [];
  const source = cleanup?.by_source || {};

  return React.createElement(
    View,
    { style: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 } },
    React.createElement(
      TouchableOpacity,
      { onPress: () => setOpen((v) => !v), activeOpacity: 0.85, style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" } },
      React.createElement(View, null,
        React.createElement(Text, { style: { color: C.text, fontSize: 18, fontWeight: "900" } }, "Admin Dashboard"),
        React.createElement(Text, { style: { color: C.muted, fontSize: 11, marginTop: 4 } }, "Users, subscriptions and cleanup audit")
      ),
      React.createElement(Text, { style: { color: C.green, fontSize: 20, fontWeight: "900" } }, open ? "−" : "+")
    ),
    open ? React.createElement(
      View,
      { style: { marginTop: 14 } },
      loading ? React.createElement(ActivityIndicator, { color: C.green }) : null,
      msg ? React.createElement(Text, { style: { color: msg.toLowerCase().includes("failed") || msg.startsWith("Skipped") ? C.red : C.green, fontSize: 12, fontWeight: "800", marginBottom: 8 } }, msg) : null,
      React.createElement(Text, { style: { color: C.text, fontSize: 13, fontWeight: "900", marginBottom: 6 } }, "Summary"),
      React.createElement(Row, { label: "Total Users", value: stats.total_users }),
      React.createElement(Row, { label: "Trial Users", value: stats.trial_users }),
      React.createElement(Row, { label: "Active Users", value: stats.active_subscribers }),
      React.createElement(Row, { label: "Expired Users", value: stats.expired_users }),
      React.createElement(Row, { label: "Bots Running", value: stats.bots_running }),
      React.createElement(Text, { style: { color: C.gold, fontSize: 13, fontWeight: "900", marginTop: 16, marginBottom: 6 } }, "Invalid PAPER Trade Cleanup"),
      React.createElement(Row, { label: "Total Trades Removed", value: cleanup?.total_removed_trades ?? "--", color: C.gold }),
      React.createElement(Row, { label: "Affected Users", value: cleanup?.affected_users ?? "--" }),
      React.createElement(Row, { label: "Far-expiry Trades", value: source.far_expiry || 0 }),
      React.createElement(Row, { label: "Blocked/Bug Entries", value: source.blocked_entry || 0 }),
      React.createElement(Row, { label: "Removed Recorded P&L", value: cleanup ? `₹${Number(cleanup.removed_recorded_pnl || 0).toFixed(2)}` : "--", color: C.red }),
      React.createElement(Row, { label: "Live Trades Removed", value: cleanup?.live_trades_removed ?? 0, color: C.green }),
      cleanupUsers.length === 0 ? React.createElement(Text, { style: { color: C.muted, fontSize: 12, marginTop: 8 } }, "No archived invalid PAPER trades found") : React.createElement(
        View,
        { style: { marginTop: 10 } },
        React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900", marginBottom: 7 } }, "User-wise Removed Trades"),
        cleanupUsers.map((u) => React.createElement(
          View,
          { key: `cleanup-${u.user_id}`, style: { backgroundColor: C.s2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 10, marginBottom: 8 } },
          React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900" } }, `${u.name || `User ${u.user_id}`} • ${u.removed_trades || 0} trades`),
          React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginTop: 3 } }, u.email || "--"),
          React.createElement(Text, { style: { color: C.gold, fontSize: 10, marginTop: 4, fontWeight: "800" } }, `Far expiry ${u.far_expiry_trades || 0} • Blocked/bug ${u.blocked_entry_trades || 0}`),
          React.createElement(Text, { style: { color: C.red, fontSize: 10, marginTop: 3, fontWeight: "800" } }, `Removed recorded P&L ₹${Number(u.removed_recorded_pnl || 0).toFixed(2)}`)
        ))
      ),
      React.createElement(Text, { style: { color: C.text, fontSize: 13, fontWeight: "900", marginTop: 14, marginBottom: 6 } }, "Registered Users"),
      users.length === 0 ? React.createElement(Text, { style: { color: C.muted, fontSize: 12 } }, "No users loaded") : users.map((u) => React.createElement(
        View,
        { key: String(u.id || u.email), style: { backgroundColor: C.s2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 10, marginBottom: 8 } },
        React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900" } }, u.name || u.email || "User"),
        React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginTop: 3 } }, u.email || "--"),
        React.createElement(Text, { style: { color: u.subscription_status === "active" ? C.green : C.gold, fontSize: 10, marginTop: 3, fontWeight: "900" } }, `${String(u.subscription_status || "--").toUpperCase()} • ${u.is_active ? "LOGIN ENABLED" : "LOGIN SUSPENDED"}`),
        !u.is_admin ? React.createElement(
          TouchableOpacity,
          { onPress: () => activateUser(u), disabled: activatingId === Number(u.id), style: { marginTop: 9, borderWidth: 1, borderColor: C.green, backgroundColor: C.green + "18", borderRadius: 8, paddingVertical: 9, alignItems: "center", opacity: activatingId === Number(u.id) ? 0.5 : 1 } },
          React.createElement(Text, { style: { color: C.green, fontSize: 11, fontWeight: "900" } }, activatingId === Number(u.id) ? "Activating..." : "Activate 30 Days")
        ) : React.createElement(Text, { style: { color: C.blue, fontSize: 10, fontWeight: "900", marginTop: 8 } }, "ADMIN • Unlimited"),
        !u.is_admin && String(u.subscription_status || "").toLowerCase() === "active" ? React.createElement(
          TouchableOpacity,
          { onPress: () => deactivateSubscription(u), disabled: deactivatingId === Number(u.id), style: { marginTop: 7, borderWidth: 1, borderColor: C.gold, backgroundColor: C.gold + "16", borderRadius: 8, paddingVertical: 9, alignItems: "center", opacity: deactivatingId === Number(u.id) ? 0.5 : 1 } },
          React.createElement(Text, { style: { color: C.gold, fontSize: 11, fontWeight: "900" } }, deactivatingId === Number(u.id) ? "Deactivating..." : "Deactivate Subscription")
        ) : null,
        React.createElement(
          TouchableOpacity,
          { onPress: () => deleteUser(u), disabled: deletingEmail === u.email || !!u.is_admin, style: { marginTop: 7, borderWidth: 1, borderColor: C.red, backgroundColor: C.red + "18", borderRadius: 8, paddingVertical: 8, alignItems: "center", opacity: deletingEmail === u.email || u.is_admin ? 0.4 : 1 } },
          React.createElement(Text, { style: { color: C.red, fontSize: 11, fontWeight: "900" } }, u.is_admin ? "Admin Protected" : deletingEmail === u.email ? "Deleting..." : "Delete User")
        )
      )),
      React.createElement(TouchableOpacity, { onPress: load, style: { marginTop: 8, borderRadius: 10, borderWidth: 1, borderColor: C.blue, paddingVertical: 10, alignItems: "center" } }, React.createElement(Text, { style: { color: C.blue, fontSize: 12, fontWeight: "900" } }, "Refresh Dashboard"))
    ) : null
  );
}

module.exports = AccountAdminDashboardCard;
module.exports.default = AccountAdminDashboardCard;
