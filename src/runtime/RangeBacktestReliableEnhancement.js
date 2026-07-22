const React = require("react");
const {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} = require("react-native");
const AsyncStorageModule = require("@react-native-async-storage/async-storage");

const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const CAPITAL_KEY = "okai_range_backtest_capital";
const CAPITAL_MODE_KEY = "okai_range_backtest_capital_mode";

const C = {
  bg: "#0a0a0f",
  card: "#13131f",
  card2: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#777792",
  green: "#00d4a0",
  red: "#ff4d6d",
  blue: "#4d9fff",
  gold: "#f5c842",
  purple: "#8a78ff",
};

let installed = false;

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

function yesterdayIst() {
  const now = new Date(Date.now() + 330 * 60 * 1000);
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
  );
}

function addDays(date, amount) {
  return new Date(date.getTime() + amount * 86400000);
}

function money(value) {
  const number = Number(value || 0);
  const sign = number < 0 ? "-" : "";
  return `${sign}₹${Math.abs(number).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && formatDate(parsed) === value;
}

function Button({ label, active, onPress, flex = 1 }) {
  return React.createElement(
    TouchableOpacity,
    {
      onPress,
      style: {
        flex,
        minWidth: 70,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        alignItems: "center",
        backgroundColor: active ? C.blue + "25" : C.card2,
        borderWidth: 1,
        borderColor: active ? C.blue : C.border,
      },
    },
    React.createElement(
      Text,
      {
        style: {
          color: active ? C.blue : C.muted,
          fontSize: 10,
          fontWeight: "900",
          textAlign: "center",
        },
      },
      label
    )
  );
}

function Row({ label, value, color }) {
  return React.createElement(
    View,
    {
      style: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      },
    },
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 12, flex: 1 } },
      label
    ),
    React.createElement(
      Text,
      {
        style: {
          color: color || C.text,
          fontSize: 12,
          fontWeight: "900",
          textAlign: "right",
          flex: 1.2,
        },
      },
      String(value)
    )
  );
}

function RangeModal({ visible, onClose }) {
  const endDefault = yesterdayIst();
  const [startDate, setStartDate] = React.useState(
    formatDate(
      new Date(
        Date.UTC(endDefault.getUTCFullYear(), endDefault.getUTCMonth(), 1)
      )
    )
  );
  const [endDate, setEndDate] = React.useState(formatDate(endDefault));
  const [instrument, setInstrument] = React.useState("AUTO");
  const [strategyMode, setStrategyMode] = React.useState("NORMAL");
  const [capital, setCapital] = React.useState("100000");
  const [capitalMode, setCapitalMode] = React.useState("COMPOUNDING");
  const [groupBy, setGroupBy] = React.useState("MONTH");
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const values = await AsyncStorage.multiGet([
          CAPITAL_KEY,
          CAPITAL_MODE_KEY,
        ]);
        const savedCapital = values?.[0]?.[1];
        const savedMode = values?.[1]?.[1];
        if (savedCapital && Number(savedCapital) >= 1000) {
          setCapital(savedCapital);
        }
        if (savedMode === "FIXED" || savedMode === "COMPOUNDING") {
          setCapitalMode(savedMode);
        }
      } catch (_) {}
    })();
  }, [visible]);

  function preset(days) {
    const end = yesterdayIst();
    setEndDate(formatDate(end));
    if (days === "YEAR") {
      setStartDate(`${end.getUTCFullYear()}-01-01`);
    } else {
      setStartDate(formatDate(addDays(end, -(days - 1))));
    }
    setError("");
    setResult(null);
  }

  async function poll(jobId, token) {
    for (let attempt = 0; attempt < 2700; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      const response = await fetch(
        `${SAAS_URL}/backtest/range/status/${jobId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const status = await response.json();
      const done = Number(status?.completed_days || 0);
      const total = Number(status?.total_days || 0);
      setProgress(
        total
          ? `${done}/${total} days • ${status?.current_date || ""}`
          : "Historical data prepare ho raha hai..."
      );
      if (status?.status === "COMPLETED") return status.result;
      if (["FAILED", "NOT_FOUND", "FORBIDDEN"].includes(status?.status)) {
        throw new Error(
          status?.error || status?.message || "Range backtest failed"
        );
      }
    }
    throw new Error("Range backtest timeout");
  }

  async function run() {
    setError("");
    setResult(null);
    if (!validDate(startDate) || !validDate(endDate)) {
      setError("Date YYYY-MM-DD format me daalo.");
      return;
    }
    const startMs = new Date(`${startDate}T00:00:00Z`).getTime();
    const endMs = new Date(`${endDate}T00:00:00Z`).getTime();
    if (endMs < startMs) {
      setError("End date start date se pehle nahi ho sakti.");
      return;
    }
    if ((endMs - startMs) / 86400000 + 1 > 366) {
      setError("Ek baar me maximum 366 calendar days select karo.");
      return;
    }
    const capitalNumber = Number(capital || 0);
    if (!Number.isFinite(capitalNumber) || capitalNumber < 1000) {
      setError("Backtest capital kam se kam ₹1,000 rakho.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("saas_token");
      if (!token) throw new Error("Login token nahi mila.");
      await AsyncStorage.multiSet([
        [CAPITAL_KEY, String(capitalNumber)],
        [CAPITAL_MODE_KEY, capitalMode],
      ]);
      const response = await fetch(`${SAAS_URL}/backtest/range`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          instrument,
          strategy_mode: strategyMode,
          capital: capitalNumber,
          capital_mode: capitalMode,
        }),
      });
      const started = await response.json();
      if (!started?.success || !started?.job_id) {
        throw new Error(
          started?.message || started?.error || "Range job start failed"
        );
      }
      setProgress(
        capitalMode === "FIXED"
          ? "Fixed Capital range backtest start ho gaya..."
          : "Compounding range backtest start ho gaya..."
      );
      const finalResult = await poll(started.job_id, token);
      setResult(finalResult);
      setProgress("✅ Date-range backtest complete");
    } catch (runError) {
      setError(runError?.message || "Range backtest failed");
    } finally {
      setLoading(false);
    }
  }

  const summary = result?.summary || result || {};
  const rows =
    groupBy === "DAY"
      ? result?.days || []
      : groupBy === "YEAR"
      ? result?.years || []
      : result?.months || [];
  const net = Number(summary?.net_pnl ?? result?.total_pnl ?? 0);
  const resultMode = String(
    summary?.capital_mode || result?.capital_mode || capitalMode
  ).toUpperCase();

  return React.createElement(
    Modal,
    { visible, animationType: "slide", onRequestClose: onClose },
    React.createElement(
      View,
      { style: { flex: 1, backgroundColor: C.bg } },
      React.createElement(
        View,
        {
          style: {
            paddingTop: 22,
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
        },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 18, fontWeight: "900" } },
          "📅 Date Range Backtest"
        ),
        React.createElement(
          TouchableOpacity,
          { onPress: onClose, style: { padding: 8 } },
          React.createElement(
            Text,
            { style: { color: C.red, fontWeight: "900" } },
            "CLOSE"
          )
        )
      ),
      React.createElement(
        ScrollView,
        { contentContainerStyle: { padding: 16, paddingBottom: 80, gap: 12 } },
        React.createElement(
          View,
          { style: { flexDirection: "row", gap: 8 } },
          React.createElement(Button, {
            label: "7 DAYS",
            onPress: () => preset(7),
          }),
          React.createElement(Button, {
            label: "30 DAYS",
            onPress: () => preset(30),
          }),
          React.createElement(Button, {
            label: "THIS YEAR",
            onPress: () => preset("YEAR"),
          })
        ),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 11, fontWeight: "800" } },
          "FROM DATE"
        ),
        React.createElement(TextInput, {
          value: startDate,
          onChangeText: setStartDate,
          placeholder: "2026-01-01",
          placeholderTextColor: C.muted,
          style: {
            backgroundColor: C.card,
            borderColor: C.border,
            borderWidth: 1,
            borderRadius: 12,
            color: C.text,
            padding: 13,
          },
        }),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 11, fontWeight: "800" } },
          "TO DATE"
        ),
        React.createElement(TextInput, {
          value: endDate,
          onChangeText: setEndDate,
          placeholder: "2026-07-21",
          placeholderTextColor: C.muted,
          style: {
            backgroundColor: C.card,
            borderColor: C.border,
            borderWidth: 1,
            borderRadius: 12,
            color: C.text,
            padding: 13,
          },
        }),
        React.createElement(
          View,
          { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } },
          ["AUTO", "NIFTY", "BANKNIFTY", "SENSEX"].map((value) =>
            React.createElement(Button, {
              key: value,
              label: value,
              active: instrument === value,
              onPress: () => setInstrument(value),
              flex: 0,
            })
          )
        ),
        React.createElement(
          View,
          { style: { flexDirection: "row", gap: 8 } },
          ["NORMAL", "HERO_ZERO", "COMBINED"].map((value) =>
            React.createElement(Button, {
              key: value,
              label: value,
              active: strategyMode === value,
              onPress: () => setStrategyMode(value),
            })
          )
        ),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 11, fontWeight: "800" } },
          "BACKTEST CAPITAL"
        ),
        React.createElement(TextInput, {
          value: capital,
          onChangeText: setCapital,
          keyboardType: "numeric",
          placeholder: "100000",
          placeholderTextColor: C.muted,
          style: {
            backgroundColor: C.card,
            borderColor: C.border,
            borderWidth: 1,
            borderRadius: 12,
            color: C.text,
            padding: 13,
          },
        }),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 11, fontWeight: "800" } },
          "CAPITAL CALCULATION"
        ),
        React.createElement(
          View,
          { style: { flexDirection: "row", gap: 8 } },
          React.createElement(Button, {
            label: "CONTINUOUS COMPOUNDING",
            active: capitalMode === "COMPOUNDING",
            onPress: () => {
              setCapitalMode("COMPOUNDING");
              setResult(null);
            },
          }),
          React.createElement(Button, {
            label: "FIXED CAPITAL",
            active: capitalMode === "FIXED",
            onPress: () => {
              setCapitalMode("FIXED");
              setResult(null);
            },
          })
        ),
        React.createElement(
          View,
          {
            style: {
              backgroundColor: C.gold + "12",
              borderColor: C.gold + "55",
              borderWidth: 1,
              borderRadius: 11,
              padding: 11,
            },
          },
          React.createElement(
            Text,
            { style: { color: C.gold, fontSize: 10.5, lineHeight: 16 } },
            capitalMode === "FIXED"
              ? "Fixed Capital: har trading day lots isi entered capital se niklenge. P&L cumulative rahega, lekin profit badhne par quantity nahi badhegi."
              : "Continuous Compounding: agle din lots pichhle din ki ending equity se niklenge. Profit aur loss ke saath quantity badhegi ya ghategi."
          )
        ),
        React.createElement(
          TouchableOpacity,
          {
            onPress: run,
            disabled: loading,
            style: {
              padding: 15,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: C.green + "20",
              borderWidth: 1,
              borderColor: C.green,
            },
          },
          loading
            ? React.createElement(ActivityIndicator, { color: C.green })
            : React.createElement(
                Text,
                {
                  style: {
                    color: C.green,
                    fontWeight: "900",
                    fontSize: 14,
                  },
                },
                "▶️ RUN DATE RANGE BACKTEST"
              )
        ),
        progress
          ? React.createElement(
              Text,
              { style: { color: C.gold, textAlign: "center", fontSize: 11 } },
              progress
            )
          : null,
        error
          ? React.createElement(
              Text,
              {
                style: {
                  color: C.red,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: C.red,
                  borderRadius: 10,
                },
              },
              error
            )
          : null,
        result
          ? React.createElement(
              View,
              {
                style: {
                  backgroundColor: C.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: net >= 0 ? C.green : C.red,
                  padding: 14,
                },
              },
              React.createElement(
                Text,
                {
                  style: {
                    color: C.text,
                    fontSize: 17,
                    fontWeight: "900",
                    marginBottom: 8,
                  },
                },
                "📌 Range Result"
              ),
              React.createElement(Row, {
                label: "From → To",
                value: `${summary.start_date || startDate} → ${
                  summary.end_date || endDate
                }`,
              }),
              React.createElement(Row, {
                label: "Capital Mode",
                value:
                  resultMode === "FIXED"
                    ? "FIXED CAPITAL"
                    : "CONTINUOUS COMPOUNDING",
                color: resultMode === "FIXED" ? C.gold : C.blue,
              }),
              React.createElement(Row, {
                label: "Tested Days",
                value: summary.tested_days || 0,
              }),
              React.createElement(Row, {
                label: "Trades",
                value: summary.trades || 0,
              }),
              React.createElement(Row, {
                label: "Wins / Losses",
                value: `${summary.wins || 0} / ${summary.losses || 0}`,
              }),
              React.createElement(Row, {
                label: "Starting Capital",
                value: money(summary.capital || summary.starting_capital || capital),
              }),
              React.createElement(Row, {
                label: "Ending Capital",
                value: money(summary.ending_capital || 0),
              }),
              React.createElement(Row, {
                label: "Net P&L",
                value: money(net),
                color: net >= 0 ? C.green : C.red,
              }),
              React.createElement(Row, {
                label: "Max Drawdown",
                value: `${money(summary.max_drawdown || 0)} (${Number(
                  summary.max_drawdown_percent || 0
                ).toFixed(2)}%)`,
              }),
              React.createElement(
                View,
                { style: { flexDirection: "row", gap: 8, marginTop: 14 } },
                ["DAY", "MONTH", "YEAR"].map((value) =>
                  React.createElement(Button, {
                    key: value,
                    label: value,
                    active: groupBy === value,
                    onPress: () => setGroupBy(value),
                  })
                )
              ),
              rows.map((row, index) => {
                const pnl = Number(row?.pnl || 0);
                const label = groupBy === "DAY" ? row.date : row.label;
                const skipped = row?.status === "SKIPPED";
                return React.createElement(
                  View,
                  {
                    key: `${label || index}-${index}`,
                    style: {
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: C.border,
                    },
                  },
                  React.createElement(
                    View,
                    {
                      style: {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 12,
                      },
                    },
                    React.createElement(
                      Text,
                      { style: { color: C.text, fontWeight: "900" } },
                      label || "--"
                    ),
                    React.createElement(
                      Text,
                      {
                        style: {
                          color: skipped ? C.gold : pnl >= 0 ? C.green : C.red,
                          fontWeight: "900",
                        },
                      },
                      skipped ? "SKIPPED" : money(pnl)
                    )
                  ),
                  React.createElement(
                    Text,
                    { style: { color: C.muted, fontSize: 10, marginTop: 4 } },
                    groupBy === "DAY"
                      ? `Trades ${row?.trades || 0} • W/L ${row?.wins || 0}/${
                          row?.losses || 0
                        } • Capital ${money(row?.capital_end || 0)}`
                      : `Trades ${row?.trades || 0} • W/L ${row?.wins || 0}/${
                          row?.losses || 0
                        } • DD ${Number(
                          row?.max_drawdown_percent || 0
                        ).toFixed(2)}%`
                  )
                );
              })
            )
          : null
      )
    )
  );
}

function Wrapper(props) {
  const Original = props.__okaiReliableOriginal;
  const cleanProps = {
    ...props,
    __okaiRangeBypass: true,
    __okaiReliableBypass: true,
  };
  delete cleanProps.__okaiReliableOriginal;
  const [visible, setVisible] = React.useState(false);

  return React.createElement(
    View,
    { style: { flex: 1, backgroundColor: C.bg } },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => setVisible(true),
        style: {
          marginHorizontal: 16,
          marginTop: 10,
          marginBottom: 4,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          backgroundColor: C.purple + "22",
          borderWidth: 1,
          borderColor: C.purple,
        },
      },
      React.createElement(
        Text,
        { style: { color: C.purple, fontSize: 13, fontWeight: "900" } },
        "📅 DATE TO DATE • DAY / MONTH / YEAR"
      )
    ),
    React.createElement(Original, cleanProps),
    React.createElement(RangeModal, {
      visible,
      onClose: () => setVisible(false),
    })
  );
}

function looksLikeBacktestTab(type, props) {
  if (!type || typeof type !== "function" || props?.__okaiReliableBypass) {
    return false;
  }
  const name = String(type.displayName || type.name || "");
  if (name === "BacktestTab") return true;
  try {
    const source = Function.prototype.toString.call(type);
    return (
      source.includes("/backtest/monthly") &&
      source.includes("/backtest/run") &&
      source.includes("paper_capital")
    );
  } catch (_) {
    return false;
  }
}

function installRangeBacktestReliableEnhancement() {
  if (installed || React.__OKAI_RANGE_RELIABLE_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiReliableRangeCreateElement(
    type,
    props,
    ...children
  ) {
    if (looksLikeBacktestTab(type, props)) {
      return previousCreateElement(
        Wrapper,
        { ...(props || {}), __okaiReliableOriginal: type },
        ...children
      );
    }
    return previousCreateElement(type, props, ...children);
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;
      jsxRuntime[key] = function okaiReliableRangeJsx(type, props, reactKey) {
        if (looksLikeBacktestTab(type, props)) {
          return previous(
            Wrapper,
            { ...(props || {}), __okaiReliableOriginal: type },
            reactKey
          );
        }
        return previous(type, props, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_RANGE_RELIABLE_PATCHED__ = true;
}

module.exports = { installRangeBacktestReliableEnhancement };
