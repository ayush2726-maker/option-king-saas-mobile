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
const JOB_KEY = "okai_unlimited_range_job_id";
const CAPITAL_KEY = "okai_range_backtest_capital";
const MODE_KEY = "okai_range_backtest_capital_mode";

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

function addYears(date, years) {
  return new Date(
    Date.UTC(date.getUTCFullYear() - years, date.getUTCMonth(), date.getUTCDate())
  );
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && formatDate(parsed) === value;
}

function money(value) {
  const parsed = Number(value || 0);
  const sign = parsed < 0 ? "-" : "";
  return `${sign}₹${Math.abs(parsed).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getToken() {
  return AsyncStorage.getItem("saas_token");
}

async function getJson(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.detail || "Server request failed");
  }
  return data;
}

async function postJson(path, body, token) {
  const response = await fetch(SAAS_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.detail || "Server request failed");
  }
  return data;
}

function Choice({ label, active, onPress, flex = 1 }) {
  return React.createElement(
    TouchableOpacity,
    {
      onPress,
      style: {
        flex,
        minWidth: 68,
        paddingVertical: 10,
        paddingHorizontal: 7,
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
          textAlign: "center",
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
        gap: 12,
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      },
    },
    React.createElement(Text, { style: { color: C.muted, fontSize: 12, flex: 1 } }, label),
    React.createElement(
      Text,
      {
        style: {
          color: color || C.text,
          fontSize: 12,
          fontWeight: "900",
          textAlign: "right",
          flex: 1.3,
        },
      },
      String(value)
    )
  );
}

function BreakdownRow({ row, mode }) {
  const pnl = Number(row?.pnl || 0);
  const skipped = String(row?.status || "").toUpperCase() === "SKIPPED";
  const label = mode === "DAY" ? row?.date : row?.label;
  return React.createElement(
    View,
    {
      style: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      },
    },
    React.createElement(
      View,
      { style: { flexDirection: "row", justifyContent: "space-between", gap: 10 } },
      React.createElement(
        Text,
        { style: { color: C.text, fontWeight: "900", flex: 1 } },
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
      { style: { color: C.muted, fontSize: 10, marginTop: 4, lineHeight: 15 } },
      mode === "DAY"
        ? `Trades ${row?.trades || 0} • W/L ${row?.wins || 0}/${
            row?.losses || 0
          } • Capital ${money(row?.capital_end || 0)}${
            row?.message ? `\n${row.message}` : ""
          }`
        : `Days ${row?.tested_days || 0} • Trades ${row?.trades || 0} • W/L ${
            row?.wins || 0
          }/${row?.losses || 0} • DD ${Number(
            row?.max_drawdown_percent || 0
          ).toFixed(2)}%`
    )
  );
}

function UnlimitedRangeModal({ visible, onClose }) {
  const endDefault = yesterdayIst();
  const [startDate, setStartDate] = React.useState(
    `${endDefault.getUTCFullYear()}-01-01`
  );
  const [endDate, setEndDate] = React.useState(formatDate(endDefault));
  const [instrument, setInstrument] = React.useState("AUTO");
  const [strategyMode, setStrategyMode] = React.useState("NORMAL");
  const [capital, setCapital] = React.useState("100000");
  const [capitalMode, setCapitalMode] = React.useState("COMPOUNDING");
  const [groupBy, setGroupBy] = React.useState("MONTH");
  const [dayCount, setDayCount] = React.useState(250);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);
  const aliveRef = React.useRef(false);
  const pollingRef = React.useRef(false);

  const pollJob = React.useCallback(async (jobId, token) => {
    if (pollingRef.current) return null;
    pollingRef.current = true;
    try {
      while (aliveRef.current) {
        const status = await getJson(`/backtest/range/status/${jobId}`, token);
        const done = Number(status?.completed_days || 0);
        const total = Number(status?.total_days || 0);
        setProgress(
          total > 0
            ? `${done}/${total} trading days • ${status?.current_date || ""}`
            : "Broker login aur historical data prepare ho raha hai..."
        );
        if (status?.status === "COMPLETED") {
          await AsyncStorage.removeItem(JOB_KEY);
          return status.result;
        }
        if (["FAILED", "NOT_FOUND", "FORBIDDEN"].includes(status?.status)) {
          await AsyncStorage.removeItem(JOB_KEY);
          throw new Error(status?.error || status?.message || "Range backtest failed");
        }
        await sleep(4000);
      }
      return null;
    } finally {
      pollingRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    aliveRef.current = visible;
    if (!visible) return () => { aliveRef.current = false; };

    (async () => {
      try {
        const values = await AsyncStorage.multiGet([CAPITAL_KEY, MODE_KEY, JOB_KEY]);
        const savedCapital = values?.[0]?.[1];
        const savedMode = values?.[1]?.[1];
        const savedJob = values?.[2]?.[1];
        if (savedCapital && Number(savedCapital) >= 1000) setCapital(savedCapital);
        if (["FIXED", "COMPOUNDING"].includes(savedMode)) setCapitalMode(savedMode);
        if (savedJob) {
          const token = await getToken();
          if (!token) return;
          setLoading(true);
          setProgress("Pichhla range job resume ho raha hai...");
          const finalResult = await pollJob(savedJob, token);
          if (finalResult && aliveRef.current) {
            setResult(finalResult);
            setProgress("✅ Date-range backtest complete");
          }
          if (aliveRef.current) setLoading(false);
        }
      } catch (resumeError) {
        if (aliveRef.current) {
          setError(resumeError?.message || "Range job resume nahi hua.");
          setLoading(false);
        }
      }
    })();

    return () => {
      aliveRef.current = false;
    };
  }, [visible, pollJob]);

  function preset(years) {
    const end = yesterdayIst();
    setEndDate(formatDate(end));
    if (years === "THIS_YEAR") {
      setStartDate(`${end.getUTCFullYear()}-01-01`);
    } else if (years === "ALL") {
      setStartDate("2015-01-01");
    } else {
      setStartDate(formatDate(addYears(end, years)));
    }
    setResult(null);
    setError("");
    setDayCount(250);
  }

  async function run() {
    setError("");
    setResult(null);
    setDayCount(250);
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
    const capitalNumber = Number(capital || 0);
    if (!Number.isFinite(capitalNumber) || capitalNumber < 1000) {
      setError("Backtest capital kam se kam ₹1,000 rakho.");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Login token nahi mila.");
      await AsyncStorage.multiSet([
        [CAPITAL_KEY, String(capitalNumber)],
        [MODE_KEY, capitalMode],
      ]);
      const started = await postJson(
        "/backtest/range",
        {
          start_date: startDate,
          end_date: endDate,
          instrument,
          strategy_mode: strategyMode,
          capital: capitalNumber,
          capital_mode: capitalMode,
        },
        token
      );
      if (!started?.success || !started?.job_id) {
        throw new Error(started?.message || started?.error || "Range job start failed");
      }
      await AsyncStorage.setItem(JOB_KEY, started.job_id);
      setProgress("Unlimited date-range backtest background me start ho gaya...");
      const finalResult = await pollJob(started.job_id, token);
      if (finalResult && aliveRef.current) {
        setResult(finalResult);
        setProgress("✅ Date-range backtest complete");
      }
    } catch (runError) {
      setError(runError?.message || "Range backtest failed");
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }

  const summary = result?.summary || result || {};
  const sourceRows =
    groupBy === "DAY"
      ? result?.days || []
      : groupBy === "YEAR"
      ? result?.years || []
      : result?.months || [];
  const rows = groupBy === "DAY" ? sourceRows.slice(0, dayCount) : sourceRows;
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
          View,
          null,
          React.createElement(
            Text,
            { style: { color: C.text, fontSize: 18, fontWeight: "900" } },
            "📅 Unlimited Date Range Backtest"
          ),
          React.createElement(
            Text,
            { style: { color: C.green, fontSize: 10, marginTop: 3, fontWeight: "900" } },
            "NO ARTIFICIAL DAY LIMIT"
          )
        ),
        React.createElement(
          TouchableOpacity,
          { onPress: onClose, style: { padding: 8 } },
          React.createElement(Text, { style: { color: C.red, fontWeight: "900" } }, "CLOSE")
        )
      ),
      React.createElement(
        ScrollView,
        { contentContainerStyle: { padding: 16, paddingBottom: 90, gap: 12 } },
        React.createElement(
          View,
          { style: { flexDirection: "row", flexWrap: "wrap", gap: 7 } },
          React.createElement(Choice, { label: "THIS YEAR", onPress: () => preset("THIS_YEAR") }),
          React.createElement(Choice, { label: "3 YEARS", onPress: () => preset(3) }),
          React.createElement(Choice, { label: "5 YEARS", onPress: () => preset(5) }),
          React.createElement(Choice, { label: "ALL AVAILABLE", onPress: () => preset("ALL") })
        ),
        React.createElement(
          Text,
          { style: { color: C.gold, fontSize: 10, lineHeight: 15 } },
          "Range par app limit nahi hai. Jis date ka real historical data selected broker ke paas nahi hoga, woh day SKIPPED dikhega."
        ),
        React.createElement(Text, { style: { color: C.muted, fontSize: 10, fontWeight: "900" } }, "FROM DATE"),
        React.createElement(TextInput, {
          value: startDate,
          onChangeText: setStartDate,
          placeholder: "2015-01-01",
          placeholderTextColor: C.muted,
          autoCapitalize: "none",
          style: {
            backgroundColor: C.card,
            borderColor: C.border,
            borderWidth: 1,
            borderRadius: 12,
            color: C.text,
            padding: 13,
          },
        }),
        React.createElement(Text, { style: { color: C.muted, fontSize: 10, fontWeight: "900" } }, "TO DATE"),
        React.createElement(TextInput, {
          value: endDate,
          onChangeText: setEndDate,
          placeholder: "2026-07-23",
          placeholderTextColor: C.muted,
          autoCapitalize: "none",
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
          { style: { flexDirection: "row", flexWrap: "wrap", gap: 7 } },
          ["AUTO", "NIFTY", "BANKNIFTY", "SENSEX"].map((value) =>
            React.createElement(Choice, {
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
        React.createElement(Text, { style: { color: C.muted, fontSize: 10, fontWeight: "900" } }, "BACKTEST CAPITAL"),
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
          View,
          { style: { flexDirection: "row", gap: 7 } },
          React.createElement(Choice, {
            label: "COMPOUNDING",
            active: capitalMode === "COMPOUNDING",
            onPress: () => setCapitalMode("COMPOUNDING"),
          }),
          React.createElement(Choice, {
            label: "FIXED CAPITAL",
            active: capitalMode === "FIXED",
            onPress: () => setCapitalMode("FIXED"),
          })
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
              opacity: loading ? 0.65 : 1,
            },
          },
          loading
            ? React.createElement(ActivityIndicator, { color: C.green })
            : React.createElement(
                Text,
                { style: { color: C.green, fontWeight: "900", fontSize: 14 } },
                "▶ RUN UNLIMITED RANGE BACKTEST"
              )
        ),
        progress
          ? React.createElement(Text, { style: { color: C.blue, textAlign: "center", fontSize: 11, lineHeight: 16 } }, progress)
          : null,
        error
          ? React.createElement(Text, { style: { color: C.red, borderColor: C.red, borderWidth: 1, borderRadius: 10, padding: 10 } }, error)
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
              React.createElement(Text, { style: { color: C.text, fontSize: 17, fontWeight: "900", marginBottom: 8 } }, "📌 Range Result"),
              React.createElement(SummaryRow, { label: "From → To", value: `${summary.start_date || startDate} → ${summary.end_date || endDate}` }),
              React.createElement(SummaryRow, { label: "Capital Mode", value: resultMode === "FIXED" ? "FIXED CAPITAL" : "CONTINUOUS COMPOUNDING", color: resultMode === "FIXED" ? C.gold : C.blue }),
              React.createElement(SummaryRow, { label: "Tested / Skipped", value: `${summary.tested_days || 0} / ${summary.skipped_days || 0}` }),
              React.createElement(SummaryRow, { label: "Trades", value: summary.trades || result.total_trades || 0 }),
              React.createElement(SummaryRow, { label: "Wins / Losses", value: `${summary.wins || 0} / ${summary.losses || 0}` }),
              React.createElement(SummaryRow, { label: "Starting Capital", value: money(summary.capital || result.capital || capital) }),
              React.createElement(SummaryRow, { label: "Ending Capital", value: money(summary.ending_capital || result.ending_capital || 0) }),
              React.createElement(SummaryRow, { label: "Net P&L", value: money(net), color: net >= 0 ? C.green : C.red }),
              React.createElement(SummaryRow, { label: "Max Drawdown", value: `${money(summary.max_drawdown || result.max_drawdown || 0)} (${Number(summary.max_drawdown_percent || result.max_drawdown_percent || 0).toFixed(2)}%)` }),
              React.createElement(
                View,
                { style: { flexDirection: "row", gap: 7, marginTop: 14 } },
                ["DAY", "MONTH", "YEAR"].map((value) =>
                  React.createElement(Choice, {
                    key: value,
                    label: value,
                    active: groupBy === value,
                    onPress: () => { setGroupBy(value); setDayCount(250); },
                  })
                )
              ),
              rows.map((row, index) =>
                React.createElement(BreakdownRow, {
                  key: `${groupBy}-${row?.date || row?.label || index}-${index}`,
                  row,
                  mode: groupBy,
                })
              ),
              groupBy === "DAY" && rows.length < sourceRows.length
                ? React.createElement(
                    TouchableOpacity,
                    {
                      onPress: () => setDayCount((value) => value + 250),
                      style: {
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 10,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: C.blue,
                        backgroundColor: C.blue + "18",
                      },
                    },
                    React.createElement(Text, { style: { color: C.blue, fontWeight: "900" } }, `SHOW NEXT 250 (${rows.length}/${sourceRows.length})`)
                  )
                : null
            )
          : null
      )
    )
  );
}

function UnlimitedRangeWrapper(props) {
  const Original = props.__okaiReliableOriginal;
  const cleanProps = {
    ...props,
    __okaiRangeBypass: true,
    __okaiReliableBypass: true,
    __okaiUnlimitedBypass: true,
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
        "📅 UNLIMITED DATE TO DATE • DAY / MONTH / YEAR"
      )
    ),
    React.createElement(Original, cleanProps),
    React.createElement(UnlimitedRangeModal, {
      visible,
      onClose: () => setVisible(false),
    })
  );
}

function isReliableRangeWrapper(type, props) {
  if (!type || typeof type !== "function" || props?.__okaiUnlimitedBypass) {
    return false;
  }
  return Boolean(
    props?.__okaiReliableOriginal &&
      String(type.displayName || type.name || "") === "Wrapper"
  );
}

function installUnlimitedRangeBacktestEnhancement() {
  if (installed || React.__OKAI_UNLIMITED_RANGE_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiUnlimitedRangeCreateElement(type, props, ...children) {
    if (isReliableRangeWrapper(type, props)) {
      return previousCreateElement(UnlimitedRangeWrapper, props || {}, ...children);
    }
    return previousCreateElement(type, props, ...children);
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;
      jsxRuntime[key] = function okaiUnlimitedRangeJsx(type, props, reactKey) {
        if (isReliableRangeWrapper(type, props)) {
          return previous(UnlimitedRangeWrapper, props || {}, reactKey);
        }
        return previous(type, props, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_UNLIMITED_RANGE_PATCHED__ = true;
}

module.exports = { installUnlimitedRangeBacktestEnhancement };
