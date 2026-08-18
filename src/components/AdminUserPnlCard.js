const React = require("react");
const {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  card: "#13131f",
  surface: "#0f0f1a",
  border: "#2b2b48",
  text: "#f2f2f8",
  muted: "#9d9db8",
  green: "#00d4a0",
  red: "#ff4d6d",
  blue: "#4d9fff",
  gold: "#f5c842",
};

async function loadAdminPnl(token) {
  const response = await fetch(SAAS_URL + "/admin/users/pnl", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    const error = new Error(data?.detail || data?.message || "P&L report unavailable");
    error.status = response.status;
    throw error;
  }
  return data;
}

function money(value) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  let formatted;
  try {
    formatted = Math.abs(number).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (_error) {
    formatted = Math.abs(number).toFixed(2);
  }
  return `${number < 0 ? "-" : sign}₹${formatted}`;
}

function pnlColor(value) {
  const number = Number(value || 0);
  if (number > 0) return C.green;
  if (number < 0) return C.red;
  return C.text;
}

function Metric({ label, value, color }) {
  return React.createElement(
    View,
    {
      style: {
        width: "48%",
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        padding: 12,
        marginBottom: 9,
      },
    },
    React.createElement(
      Text,
      { style: { color: color || pnlColor(value), fontSize: 17, fontWeight: "900" } },
      typeof value === "number" ? money(value) : String(value ?? "--")
    ),
    React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginTop: 4 } }, label)
  );
}

function MiniPnl({ label, value }) {
  return React.createElement(
    View,
    { style: { flex: 1, minWidth: 74, marginTop: 8 } },
    React.createElement(Text, { style: { color: C.muted, fontSize: 9 } }, label),
    React.createElement(
      Text,
      { style: { color: pnlColor(value), fontSize: 11, fontWeight: "900", marginTop: 2 } },
      money(value)
    )
  );
}

function AdminUserPnlCard({ token, initiallyOpen = true }) {
  const [open, setOpen] = React.useState(initiallyOpen);
  const [loading, setLoading] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [report, setReport] = React.useState(null);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await loadAdminPnl(token);
      setReport(data);
      setHidden(false);
    } catch (requestError) {
      if (requestError?.status === 401 || requestError?.status === 403) {
        setHidden(true);
      } else {
        setError(requestError?.message || "P&L report unavailable");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (hidden) return null;

  const combined = report?.totals?.combined || {};
  const today = combined.today || {};
  const allTime = combined.all_time || {};
  const users = Array.isArray(report?.users) ? report.users : [];

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.blue + "66",
        padding: 16,
        marginTop: 12,
      },
    },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => setOpen((value) => !value),
        activeOpacity: 0.85,
        style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 10 } },
        React.createElement(Text, { style: { color: C.blue, fontSize: 18, fontWeight: "900" } }, "All Users P&L"),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 10, marginTop: 4 } },
          report?.date_ist ? `${report.date_ist} IST • Net after costs` : "Paper and Live • Net after costs"
        )
      ),
      React.createElement(Text, { style: { color: C.green, fontSize: 20, fontWeight: "900" } }, open ? "−" : "+")
    ),

    open
      ? React.createElement(
          View,
          { style: { marginTop: 14 } },
          loading && !report ? React.createElement(ActivityIndicator, { color: C.green }) : null,
          error
            ? React.createElement(Text, { style: { color: C.red, fontSize: 11, fontWeight: "800", marginBottom: 10 } }, error)
            : null,

          report
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement(
                  View,
                  { style: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" } },
                  React.createElement(Metric, { label: "Today Net P&L", value: Number(today.net_pnl || 0) }),
                  React.createElement(Metric, { label: "Current Open P&L", value: Number(allTime.open_pnl || 0) }),
                  React.createElement(Metric, { label: "All-time Net P&L", value: Number(allTime.net_pnl || 0) }),
                  React.createElement(Metric, { label: "Users", value: String(report.user_count || 0), color: C.blue })
                ),

                React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900", marginTop: 7, marginBottom: 7 } }, "User-wise P&L"),
                users.map((user) => {
                  const todayNet = Number(user?.today_net_pnl || 0);
                  const openNet = Number(user?.combined?.all_time?.open_pnl || 0);
                  const paperNet = Number(user?.paper?.all_time?.net_pnl || 0);
                  const liveNet = Number(user?.live?.all_time?.net_pnl || 0);
                  const totalNet = Number(user?.all_time_net_pnl || 0);
                  const unpriced = Number(user?.combined?.all_time?.unpriced_open_trades || 0);
                  return React.createElement(
                    View,
                    {
                      key: String(user?.user_id || user?.email),
                      style: {
                        backgroundColor: C.surface,
                        borderWidth: 1,
                        borderColor: C.border,
                        borderRadius: 12,
                        padding: 11,
                        marginBottom: 9,
                      },
                    },
                    React.createElement(
                      View,
                      { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" } },
                      React.createElement(
                        View,
                        { style: { flex: 1, paddingRight: 8 } },
                        React.createElement(Text, { style: { color: C.text, fontSize: 12, fontWeight: "900" } }, user?.name || "User"),
                        React.createElement(Text, { style: { color: C.muted, fontSize: 9, marginTop: 2 } }, user?.email || "--")
                      ),
                      React.createElement(Text, { style: { color: pnlColor(totalNet), fontSize: 13, fontWeight: "900" } }, money(totalNet))
                    ),
                    React.createElement(
                      View,
                      { style: { flexDirection: "row", flexWrap: "wrap" } },
                      React.createElement(MiniPnl, { label: "Today", value: todayNet }),
                      React.createElement(MiniPnl, { label: "Open", value: openNet }),
                      React.createElement(MiniPnl, { label: "Paper", value: paperNet }),
                      React.createElement(MiniPnl, { label: "Live", value: liveNet })
                    ),
                    unpriced > 0
                      ? React.createElement(Text, { style: { color: C.gold, fontSize: 9, marginTop: 7, fontWeight: "800" } }, `${unpriced} open trade awaiting quote`)
                      : null
                  );
                }),

                React.createElement(
                  TouchableOpacity,
                  {
                    onPress: load,
                    disabled: loading,
                    style: {
                      marginTop: 2,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: C.blue,
                      paddingVertical: 10,
                      alignItems: "center",
                      opacity: loading ? 0.55 : 1,
                    },
                  },
                  React.createElement(Text, { style: { color: C.blue, fontSize: 11, fontWeight: "900" } }, loading ? "Refreshing..." : "Refresh P&L")
                )
              )
            : null
        )
      : null
  );
}

module.exports = AdminUserPnlCard;
module.exports.default = AdminUserPnlCard;
module.exports.loadAdminPnl = loadAdminPnl;
module.exports.money = money;
