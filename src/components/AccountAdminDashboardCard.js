const React = require("react");
const { ActivityIndicator, Text, TouchableOpacity, View } = require("react-native");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  card: "#13131f",
  s2: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#a0a0c0",
  green: "#00d4a0",
  red: "#ff4d6d",
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
  const [gateway, setGateway] = React.useState(null);
  const [msg, setMsg] = React.useState("");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setMsg("");
    try {
      const [dash, userList, gw] = await Promise.all([
        apiGet("/admin/dashboard", token),
        apiGet("/admin/users?limit=8", token),
        apiGet("/local-gateway/status", token).catch(() => null),
      ]);
      setData(dash || {});
      setUsers(Array.isArray(userList?.users) ? userList.users : []);
      setGateway(gw || null);
      setHidden(false);
    } catch (e) {
      if (e.status === 403) {
        setHidden(true);
      } else {
        setMsg(e.message || "Admin dashboard load failed");
      }
    }
    setLoading(false);
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (hidden) return null;

  const stats = data?.stats || {};
  const online = gateway?.online || gateway?.is_online || false;

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        marginTop: 12,
      },
    },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => setOpen((v) => !v),
        activeOpacity: 0.85,
        style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
      },
      React.createElement(
        View,
        null,
        React.createElement(Text, { style: { color: C.text, fontSize: 18, fontWeight: "900" } }, "Admin Dashboard"),
        React.createElement(Text, { style: { color: C.muted, fontSize: 11, marginTop: 4 } }, "Registered users and gateway status")
      ),
      React.createElement(Text, { style: { color: C.green, fontSize: 20, fontWeight: "900" } }, open ? "−" : "+")
    ),

    open
      ? React.createElement(
          View,
          { style: { marginTop: 14 } },
          loading
            ? React.createElement(ActivityIndicator, { color: C.green })
            : null,

          msg
            ? React.createElement(Text, { style: { color: C.red, fontSize: 12, fontWeight: "800", marginBottom: 8 } }, msg)
            : null,

          React.createElement(Text, { style: { color: C.text, fontSize: 13, fontWeight: "900", marginBottom: 6 } }, "Summary"),
          React.createElement(Row, { label: "Total Users", value: stats.total_users }),
          React.createElement(Row, { label: "Trial Users", value: stats.trial_users }),
          React.createElement(Row, { label: "Active Users", value: stats.active_subscribers }),
          React.createElement(Row, { label: "Expired Users", value: stats.expired_users }),
          React.createElement(Row, { label: "Bots Running", value: stats.bots_running }),

          React.createElement(Text, { style: { color: C.text, fontSize: 13, fontWeight: "900", marginTop: 14, marginBottom: 6 } }, "Gateway"),
          React.createElement(Row, { label: "Status", value: online ? "ONLINE" : "OFFLINE", color: online ? C.green : C.red }),
          React.createElement(Row, { label: "Armed", value: gateway?.server_armed ? "YES" : "NO", color: gateway?.server_armed ? C.green : C.red }),
          React.createElement(Row, { label: "Static IP Match", value: gateway?.static_ip_matches ? "YES" : "NO", color: gateway?.static_ip_matches ? C.green : C.red }),
          React.createElement(Row, { label: "Last Seen", value: gateway?.last_seen_at || "--" }),

          React.createElement(Text, { style: { color: C.text, fontSize: 13, fontWeight: "900", marginTop: 14, marginBottom: 6 } }, "Recent Registered Users"),
          users.length === 0
            ? React.createElement(Text, { style: { color: C.muted, fontSize: 12 } }, "No users loaded")
            : users.map((u) =>
                React.createElement(
                  View,
                  {
                    key: String(u.id || u.email),
                    style: {
                      backgroundColor: C.s2,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: C.border,
                      padding: 10,
                      marginBottom: 8,
                    },
                  },
                  React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900" } }, u.name || u.email || "User"),
                  React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginTop: 3 } }, u.email || "--"),
                  React.createElement(Text, { style: { color: u.is_active ? C.green : C.red, fontSize: 10, marginTop: 3, fontWeight: "900" } }, `${u.subscription_status || "--"} • ${u.is_active ? "ACTIVE" : "INACTIVE"}`)
                )
              ),

          React.createElement(
            TouchableOpacity,
            {
              onPress: load,
              style: {
                marginTop: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: C.green,
                paddingVertical: 10,
                alignItems: "center",
              },
            },
            React.createElement(Text, { style: { color: C.green, fontSize: 12, fontWeight: "900" } }, "Refresh Dashboard")
          )
        )
      : null
  );
}

module.exports = AccountAdminDashboardCard;
module.exports.default = AccountAdminDashboardCard;
