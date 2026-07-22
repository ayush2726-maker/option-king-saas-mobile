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
const AsyncStorageModule = require(
  "@react-native-async-storage/async-storage"
);

const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
const SAAS_URL = "https://option-king-saas-production.up.railway.app";
const JOB_STORAGE_KEY = "okai_range_backtest_job_id";

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

function completedYesterdayIst() {
  const nowIst = new Date(Date.now() + 330 * 60 * 1000);
  const day = new Date(
    Date.UTC(
      nowIst.getUTCFullYear(),
      nowIst.getUTCMonth(),
      nowIst.getUTCDate() - 1
    )
  );
  return day;
}

function addDays(date, amount) {
  return new Date(date.getTime() + amount * 24 * 60 * 60 * 1000);
}

function validDateText(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && formatDate(parsed) === value;
}

function money(value) {
  const number = Number(value || 0);
  const sign = number < 0 ? "-" : "";
  return `${sign}₹${Math.abs(number).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

async function getToken() {
  return AsyncStorage.getItem("saas_token");
}

async function authGet(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  return response.json();
}

async function authPost(path, body, token) {
  const response = await fetch(SAAS_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body),
  });
  return response.json();
}

function Choice({ label, active, onPress, flex = 1 }) {
  return React.createElement(
    TouchableOpacity,
    {
      onPress,
      style: {
        flex,
        minWidth: 66,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        alignItems: "center",
        backgroundColor: active ? C.blue + "28" : C.card2,
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
        },
      },
      label
    )
  );
}

function SummaryRow({ label, value, color }) {
  return React.createElement(
    View,
    {
      style: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      },
    },
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 12 } },
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
        },
      },
      String(value)
    )
  );
}

function BreakdownRow({ row, mode }) {
  const pnl = Number(row?.pnl || 0);
  const title = mode === "DAY" ? row.date : row.label;
  const status = mode === "DAY" ? row.status : null;
  return React.createElement(
    View,
    {
      style: {
        paddingVertical: 11,
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
          alignItems: "center",
        },
      },
      React.createElement(
        Text,
        { style: { color: C.text, fontSize: 13, fontWeight: "900" } },
        title || "--"
      ),
      React.createElement(
        Text,
        {
          style: {
            color:
              status === "SKIPPED"
                ? C.gold
                : pnl >= 0
                ? C.green
                : C.red,
            fontSize: 12,
            fontWeight: "900",
          },
        },
        status === "SKIPPED" ? "SKIPPED" : money(pnl)
      )
    ),
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 10, marginTop: 5, lineHeight: 15 } },
      mode === "DAY"
        ? `Trades ${row.trades || 0} • W/L ${row.wins || 0}/${row.losses || 0} • Capital ${money(
            row.capital_end
          )}${row.message ? `\n${row.message}` : ""}`
        : `Days ${row.tested_days || 0} • Trades ${row.trades || 0} • W/L ${
            row.wins || 0
          }/${row.losses || 0} • Win ${percent(row.win_rate)} • DD ${percent(
            row.max_drawdown_percent
          )}`
    )
  );
}

function RangeBacktestModal({ visible, onClose, lang }) {
  const hi = lang === "hi";
  const yesterday = completedYesterdayIst();
  const defaultEnd = formatDate(yesterday);
  const defaultStart = formatDate(
    new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), 1))
  );

  const [startDate, setStartDate] = React.useState(defaultStart);
  const [endDate, setEndDate] = React.useState(defaultEnd);
  const [instrument, setInstrument] = React.useState("AUTO");
  const [strategyMode, setStrategyMode] = React.useState("NORMAL");
  const [capital, setCapital] = React.useState("100000");
  const [groupBy, setGroupBy] = React.useState("MONTH");
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);
  const aliveRef = React.useRef(true);

  React.useEffect(() => {
    aliveRef.current = true;
    if (visible) {
      (async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const account = await authGet("/paper/account", token);
          const paperCapital = account?.account?.paper_capital;
          if (paperCapital && aliveRef.current) setCapital(String(paperCapital));
        } catch (_) {}
      })();
    }
    return () => {
      aliveRef.current = false;
    };
  }, [visible]);

  function applyPreset(name) {
    const end = completedYesterdayIst();
    if (name === "7D") {
      setStartDate(formatDate(addDays(end, -6)));
    } else if (name === "30D") {
      setStartDate(formatDate(addDays(end, -29)));
    } else if (name === "YEAR") {
      setStartDate(`${end.getUTCFullYear()}-01-01`);
    }
    setEndDate(formatDate(end));
    setResult(null);
    setError("");
  }

  async function pollJob(jobId, token) {
    for (let attempt = 0; attempt < 2700; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      const status = await authGet(`/backtest/range/status/${jobId}`, token);
      if (!aliveRef.current) return null;
      const completed = Number(status?.completed_days || 0);
      const total = Number(status?.total_days || 0);
      const current = status?.current_date || "";
      setProgress(
        total > 0
          ? `Range backtest: ${completed}/${total} days${current ? ` • ${current}` : ""}`
          : "Broker login aur historical data prepare ho raha hai..."
      );
      if (status?.status === "COMPLETED") {
        await AsyncStorage.removeItem(JOB_STORAGE_KEY);
        return status.result;
      }
      if (["FAILED", "NOT_FOUND", "FORBIDDEN"].includes(status?.status)) {
        await AsyncStorage.removeItem(JOB_STORAGE_KEY);
        throw new Error(status?.error || status?.message || "Range backtest failed");
      }
    }
    throw new Error("Range backtest abhi bhi chal raha hai.");
  }

  async function runRange() {
    setError("");
    setResult(null);
    setProgress("");
    if (!validDateText(startDate) || !validDateText(endDate)) {
      setError("Date YYYY-MM-DD format me daalein.");
      return;
    }
    const startMs = new Date(`${startDate}T00:00:00Z`).getTime();
    const endMs = new Date(`${endDate}T00:00:00Z`).getTime();
    if (endMs < startMs) {
      setError("End date start date se pehle nahi ho sakti.");
      return;
    }
    if ((endMs - startMs) / 86400000 + 1 > 366) {
      setError("Ek baar me maximum 366 calendar days select karein.");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Login token nahi mila.");
      const started = await authPost(
        "/backtest/range",
        {
          start_date: startDate,
          end_date: endDate,
          instrument,
          strategy_mode: strategyMode,
          capital: Number(capital || 100000),
        },
        token
      );
      if (!started?.success || !started?.job_id) {
        throw new Error(started?.message || started?.error || "Range job start failed");
      }
      await AsyncStorage.setItem(JOB_STORAGE_KEY, started.job_id);
      setProgress("Date-range backtest background me start ho gaya...");
      const finalResult = await pollJob(started.job_id, token);
      if (finalResult && aliveRef.current) {
        setResult(finalResult);
        setProgress("✅ Date-range backtest complete");
      }
    } catch (runError) {
      if (aliveRef.current) setError(runError?.message || "Range backtest failed");
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }

  const summary = result?.summary || result || {};
  const rows =
    groupBy === "DAY"
      ? result?.days || []
      : groupBy === "YEAR"
      ? result?.years || []
      : result?.months || [];
  const netPnl = Number(summary?.net_pnl ?? result?.total_pnl ?? 0);

  return React.createElement(
    Modal,
    {
      visible,
      animationType: "slide",
      presentationStyle: "fullScreen",
      onRequestClose: onClose,
    },
    React.createElement(
      View,
      { style: { flex: 1, backgroundColor: C.bg } },
      React.createElement(
        View,
        {
          style: {
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
        },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: { color: C.text, fontSize: 18, fontWeight: "900" } },
            "📅 Date Range Backtest"
          ),
          React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 10, marginTop: 3 } },
            hi
              ? "Ek hi continuous capital par day, month aur year result"
              : "Day, month and year views on one continuous capital curve"
          )
        ),
        React.createElement(
          TouchableOpacity,
          { onPress: onClose, style: { padding: 10 } },
          React.createElement(
            Text,
            { style: { color: C.red, fontSize: 15, fontWeight: "900" } },
            "CLOSE"
          )
        )
      ),
      React.createElement(
        ScrollView,
        { contentContainerStyle: { padding: 16, paddingBottom: 80 } },
        React.createElement(
          View,
          {
            style: {
              backgroundColor: C.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.border,
              padding: 14,
              marginBottom: 12,
            },
          },
          React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 10, fontWeight: "900", marginBottom: 7 } },
            "QUICK RANGE"
          ),
          React.createElement(
            View,
            { style: { flexDirection: "row", gap: 8, marginBottom: 12 } },
            React.createElement(Choice, { label: "7 DAYS", onPress: () => applyPreset("7D") }),
            React.createElement(Choice, { label: "30 DAYS", onPress: () => applyPreset("30D") }),
            React.createElement(Choice, { label: "THIS YEAR", onPress: () => applyPreset("YEAR") })
          ),
          React.createElement(
            View,
            { style: { flexDirection: "row", gap: 8 } },
            React.createElement(
              View,
              { style: { flex: 1 } },
              React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginBottom: 5 } }, "FROM"),
              React.createElement(TextInput, {
                value: startDate,
                onChangeText: setStartDate,
                placeholder: "YYYY-MM-DD",
                placeholderTextColor: C.muted,
                autoCapitalize: "none",
                style: {
                  color: C.text,
                  backgroundColor: C.card2,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: 11,
                  fontSize: 13,
                },
              })
            ),
            React.createElement(
              View,
              { style: { flex: 1 } },
              React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginBottom: 5 } }, "TO"),
              React.createElement(TextInput, {
                value: endDate,
                onChangeText: setEndDate,
                placeholder: "YYYY-MM-DD",
                placeholderTextColor: C.muted,
                autoCapitalize: "none",
                style: {
                  color: C.text,
                  backgroundColor: C.card2,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: 11,
                  fontSize: 13,
                },
              })
            )
          ),
          React.createElement(Text, { style: { color: C.muted, fontSize: 10, fontWeight: "900", marginTop: 13, marginBottom: 6 } }, "INSTRUMENT"),
          React.createElement(
            View,
            { style: { flexDirection: "row", flexWrap: "wrap", gap: 7 } },
            ["AUTO", "NIFTY", "BANKNIFTY", "SENSEX"].map((value) =>
              React.createElement(Choice, {
                key: value,
                label: value,
                active: instrument === value,
                onPress: () => setInstrument(value),
                flex: value === "BANKNIFTY" ? 1.3 : 1,
              })
            )
          ),
          React.createElement(Text, { style: { color: C.muted, fontSize: 10, fontWeight: "900", marginTop: 13, marginBottom: 6 } }, "STRATEGY"),
          React.createElement(
            View,
            { style: { flexDirection: "row", gap: 7 } },
            ["NORMAL", "HERO_ZERO", "COMBINED"].map((value) =>
              React.createElement(Choice, {
                key: value,
                label: value.replace("_", " "),
                active: strategyMode === value,
                onPress: () => setStrategyMode(value),
              })
            )
          ),
          React.createElement(Text, { style: { color: C.muted, fontSize: 10, fontWeight: "900", marginTop: 13, marginBottom: 6 } }, "STARTING CAPITAL"),
          React.createElement(TextInput, {
            value: capital,
            onChangeText: setCapital,
            keyboardType: "numeric",
            placeholder: "100000",
            placeholderTextColor: C.muted,
            style: {
              color: C.text,
              backgroundColor: C.card2,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: C.border,
              padding: 11,
              fontSize: 14,
              marginBottom: 13,
            },
          }),
          React.createElement(
            TouchableOpacity,
            {
              onPress: runRange,
              disabled: loading,
              style: {
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: C.green + "22",
                borderWidth: 1,
                borderColor: C.green,
                opacity: loading ? 0.65 : 1,
              },
            },
            loading
              ? React.createElement(ActivityIndicator, { color: C.green })
              : React.createElement(
                  Text,
                  { style: { color: C.green, fontSize: 14, fontWeight: "900" } },
                  "▶ RUN DATE RANGE BACKTEST"
                )
          ),
          progress
            ? React.createElement(Text, { style: { color: C.blue, fontSize: 11, lineHeight: 17, marginTop: 10, textAlign: "center" } }, progress)
            : null,
          error
            ? React.createElement(Text, { style: { color: C.red, fontSize: 11, lineHeight: 17, marginTop: 10 } }, error)
            : null
        ),
        result
          ? React.createElement(
              React.Fragment,
              null,
              React.createElement(
                View,
                {
                  style: {
                    backgroundColor: C.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: netPnl >= 0 ? C.green + "88" : C.red + "88",
                    padding: 14,
                    marginBottom: 12,
                  },
                },
                React.createElement(Text, { style: { color: C.text, fontSize: 17, fontWeight: "900", marginBottom: 8 } }, "📌 Range Result"),
                React.createElement(SummaryRow, { label: "Range", value: `${result.start_date} → ${result.end_date}` }),
                React.createElement(SummaryRow, { label: "Tested / Skipped Days", value: `${result.tested_days || 0} / ${result.skipped_days || 0}` }),
                React.createElement(SummaryRow, { label: "Winning / Losing Days", value: `${result.winning_days || 0} / ${result.losing_days || 0}` }),
                React.createElement(SummaryRow, { label: "Trades", value: result.total_trades || 0 }),
                React.createElement(SummaryRow, { label: "Wins / Losses", value: `${result.wins || 0} / ${result.losses || 0}` }),
                React.createElement(SummaryRow, { label: "Win Rate", value: percent(result.win_rate) }),
                React.createElement(SummaryRow, { label: "Starting Capital", value: money(result.capital) }),
                React.createElement(SummaryRow, { label: "Ending Capital", value: money(result.ending_capital) }),
                React.createElement(SummaryRow, { label: "Net P&L", value: money(result.total_pnl), color: netPnl >= 0 ? C.green : C.red }),
                React.createElement(SummaryRow, { label: "Max Drawdown", value: `${money(result.max_drawdown)} (${percent(result.max_drawdown_percent)})`, color: C.gold })
              ),
              React.createElement(
                View,
                {
                  style: {
                    backgroundColor: C.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 14,
                  },
                },
                React.createElement(Text, { style: { color: C.text, fontSize: 15, fontWeight: "900", marginBottom: 10 } }, "📊 Result Breakdown"),
                React.createElement(
                  View,
                  { style: { flexDirection: "row", gap: 8, marginBottom: 8 } },
                  ["DAY", "MONTH", "YEAR"].map((value) =>
                    React.createElement(Choice, {
                      key: value,
                      label: `${value} WISE`,
                      active: groupBy === value,
                      onPress: () => setGroupBy(value),
                    })
                  )
                ),
                rows.length
                  ? rows.map((row, index) =>
                      React.createElement(BreakdownRow, {
                        key: `${groupBy}-${row.date || row.label || index}`,
                        row,
                        mode: groupBy,
                      })
                    )
                  : React.createElement(Text, { style: { color: C.muted, paddingVertical: 16, textAlign: "center" } }, "No breakdown data")
              )
            )
          : null
      )
    )
  );
}

function RangeBacktestWrapper(props) {
  const Original = props.__okaiRangeOriginal;
  const cleanProps = { ...props };
  delete cleanProps.__okaiRangeOriginal;
  cleanProps.__okaiRangeBypass = true;
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
          paddingVertical: 11,
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
    React.createElement(RangeBacktestModal, {
      visible,
      onClose: () => setVisible(false),
      lang: cleanProps.lang,
    })
  );
}

function isBacktestTab(type, props) {
  if (!type || props?.__okaiRangeBypass || typeof type !== "function") return false;
  return String(type.displayName || type.name || "") === "BacktestTab";
}

function installRangeBacktestEnhancement() {
  if (installed || React.__OKAI_RANGE_BACKTEST_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiRangeCreateElement(type, props, ...children) {
    if (isBacktestTab(type, props)) {
      return previousCreateElement(
        RangeBacktestWrapper,
        { ...(props || {}), __okaiRangeOriginal: type },
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
      jsxRuntime[key] = function okaiRangeJsx(type, props, reactKey) {
        if (isBacktestTab(type, props)) {
          return previous(
            RangeBacktestWrapper,
            { ...(props || {}), __okaiRangeOriginal: type },
            reactKey
          );
        }
        return previous(type, props, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_RANGE_BACKTEST_PATCHED__ = true;
}

module.exports = { installRangeBacktestEnhancement };
