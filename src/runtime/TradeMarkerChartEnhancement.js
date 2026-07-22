const React = require("react");
const {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} = require("react-native");
const AsyncStorageModule = require(
  "@react-native-async-storage/async-storage"
);

const AsyncStorage =
  AsyncStorageModule.default || AsyncStorageModule;

const SAAS_URL =
  "https://option-king-saas-production.up.railway.app";

const COLORS = {
  card: "#0f0f1a",
  card2: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#777792",
  blue: "#4d9fff",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
};

let installed = false;
let originalFetch = null;
let chartContext = {
  instrument: "NIFTY",
  days: 1,
  revision: 0,
};
const contextListeners = new Set();

function notifyContextListeners() {
  contextListeners.forEach((listener) => {
    try {
      listener({ ...chartContext });
    } catch (_) {}
  });
}

function queryValue(url, key) {
  try {
    const match = String(url || "").match(
      new RegExp(`[?&]${key}=([^&#]*)`, "i")
    );
    return match ? decodeURIComponent(match[1]) : "";
  } catch (_) {
    return "";
  }
}

function trackChartRequest(input) {
  const url =
    typeof input === "string"
      ? input
      : input && typeof input.url === "string"
      ? input.url
      : "";

  if (!url.includes("/bot/chart-data")) return;

  const instrument = String(
    queryValue(url, "instrument") ||
      chartContext.instrument ||
      "NIFTY"
  ).toUpperCase();
  const days = Number(
    queryValue(url, "days") || chartContext.days || 1
  );

  chartContext = {
    instrument,
    days: [1, 7, 30].includes(days) ? days : 1,
    revision: chartContext.revision + 1,
  };
  notifyContextListeners();
}

function installChartRequestTracking() {
  if (
    typeof global.fetch !== "function" ||
    global.__OKAI_TRADE_MARKER_FETCH_PATCHED__
  ) {
    return;
  }

  originalFetch = global.fetch.bind(global);

  global.fetch = function okaiTradeMarkerFetch(input, init) {
    trackChartRequest(input);
    return originalFetch(input, init);
  };

  global.__OKAI_TRADE_MARKER_FETCH_PATCHED__ = true;
}

function parseUtcDate(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  let text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(text)) {
    text = text.replace(/\s+/, "T");
    if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(text)) {
      text += "Z";
    }
  } else if (
    /^\d{4}-\d{2}-\d{2}T/.test(text) &&
    !/(Z|[+-]\d{2}:?\d{2})$/i.test(text)
  ) {
    text += "Z";
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function istDateTime(value) {
  const parsed = parseUtcDate(value);
  if (!parsed) return "--";
  const ist = new Date(parsed.getTime() + 330 * 60 * 1000);
  const day = String(ist.getUTCDate()).padStart(2, "0");
  const month = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const hour = String(ist.getUTCHours()).padStart(2, "0");
  const minute = String(ist.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month} ${hour}:${minute}`;
}

function tradeEntryTime(trade) {
  return (
    trade?.entry_time ||
    trade?.created_at ||
    trade?.timestamp ||
    trade?.time ||
    null
  );
}

function tradeExitTime(trade) {
  return (
    trade?.exit_time ||
    trade?.closed_at ||
    trade?.updated_at ||
    (String(trade?.status || "").toUpperCase() !== "OPEN"
      ? trade?.created_at
      : null) ||
    null
  );
}

function tradeInstrument(trade) {
  const text = String(
    trade?.underlying ||
      trade?.instrument ||
      trade?.symbol ||
      ""
  ).toUpperCase();

  if (text.includes("BANKNIFTY")) return "BANKNIFTY";
  if (text.includes("SENSEX")) return "SENSEX";
  if (text.includes("NIFTY")) return "NIFTY";
  return "";
}

function money(value) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  return `${sign}₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function useChartContext() {
  const [context, setContext] = React.useState({
    ...chartContext,
  });

  React.useEffect(() => {
    const listener = (next) => setContext(next);
    contextListeners.add(listener);
    return () => contextListeners.delete(listener);
  }, []);

  return context;
}

function candleBounds(candles) {
  const times = (candles || [])
    .map((candle) => parseUtcDate(candle?.time))
    .filter(Boolean)
    .map((date) => date.getTime());

  if (!times.length) {
    return { start: null, end: null };
  }

  return {
    start: Math.min(...times) - 2 * 60 * 1000,
    end: Math.max(...times) + 10 * 60 * 1000,
  };
}

function TradeTimeline({ trades, candles }) {
  const [width, setWidth] = React.useState(0);
  const bounds = candleBounds(candles);

  if (!trades.length || !bounds.start || !bounds.end) {
    return null;
  }

  const duration = Math.max(1, bounds.end - bounds.start);
  const markers = [];

  trades.forEach((trade, tradeIndex) => {
    const entry = parseUtcDate(tradeEntryTime(trade));
    const exit = parseUtcDate(tradeExitTime(trade));
    const pnl = Number(trade?.pnl || 0);

    if (entry) {
      markers.push({
        key: `entry-${trade?.id || tradeIndex}`,
        time: entry.getTime(),
        label: "E",
        color: COLORS.blue,
      });
    }
    if (exit) {
      markers.push({
        key: `exit-${trade?.id || tradeIndex}`,
        time: exit.getTime(),
        label: "X",
        color: pnl >= 0 ? COLORS.green : COLORS.red,
      });
    }
  });

  return (
    <View
      onLayout={(event) =>
        setWidth(event.nativeEvent.layout.width || 0)
      }
      style={{
        height: 34,
        marginTop: 8,
        marginBottom: 7,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          top: 16,
          height: 1,
          backgroundColor: COLORS.border,
        }}
      />
      {width > 0 &&
        markers.map((marker) => {
          const ratio = Math.max(
            0,
            Math.min(
              1,
              (marker.time - bounds.start) / duration
            )
          );
          const left = 10 + ratio * Math.max(1, width - 28);

          return (
            <View
              key={marker.key}
              style={{
                position: "absolute",
                left,
                top: 7,
                width: 18,
                height: 18,
                borderRadius: 9,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: marker.color,
                borderWidth: 1,
                borderColor: COLORS.text,
              }}
            >
              <Text
                style={{
                  color: "#071016",
                  fontSize: 8,
                  fontWeight: "900",
                }}
              >
                {marker.label}
              </Text>
            </View>
          );
        })}
    </View>
  );
}

function TradeMarkerPanel({ candles }) {
  const context = useChartContext();
  const [trades, setTrades] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");

  const firstCandleTime = candles?.[0]?.time || "";
  const lastCandleTime =
    candles?.[candles.length - 1]?.time || "";

  React.useEffect(() => {
    let alive = true;

    async function loadTrades() {
      setLoading(true);
      setLoadError("");
      try {
        const token = await AsyncStorage.getItem("saas_token");
        if (!token) {
          if (alive) setTrades([]);
          return;
        }

        const fetcher = originalFetch || global.fetch;
        const response = await fetcher(
          SAAS_URL + "/history/paper",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );
        const data = await response.json();
        if (alive) {
          setTrades(
            Array.isArray(data?.paper_trades)
              ? data.paper_trades
              : []
          );
        }
      } catch (_) {
        if (alive) {
          setLoadError("Trade markers load nahi hue.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadTrades();
    return () => {
      alive = false;
    };
  }, [
    context.instrument,
    context.days,
    context.revision,
    firstCandleTime,
    lastCandleTime,
    candles?.length,
  ]);

  const bounds = candleBounds(candles);
  const instrument = String(
    context.instrument || "NIFTY"
  ).toUpperCase();

  const instrumentTrades = trades
    .filter((trade) => {
      const resolved = tradeInstrument(trade);
      return !resolved || resolved === instrument;
    })
    .sort((a, b) => {
      const aTime = parseUtcDate(tradeEntryTime(a));
      const bTime = parseUtcDate(tradeEntryTime(b));
      return (aTime?.getTime() || 0) - (bTime?.getTime() || 0);
    });

  const visibleTrades = instrumentTrades.filter((trade) => {
    if (!bounds.start || !bounds.end) return false;
    const entry = parseUtcDate(tradeEntryTime(trade));
    const exit = parseUtcDate(tradeExitTime(trade));
    const entryMs = entry?.getTime();
    const exitMs = exit?.getTime();
    return (
      (entryMs != null &&
        entryMs >= bounds.start &&
        entryMs <= bounds.end) ||
      (exitMs != null &&
        exitMs >= bounds.start &&
        exitMs <= bounds.end)
    );
  });

  const recentOutsideTrade =
    context.days === 1 && instrumentTrades.length
      ? instrumentTrades[instrumentTrades.length - 1]
      : null;

  if (loading && !trades.length) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        <ActivityIndicator size="small" color={COLORS.blue} />
        <Text style={{ color: COLORS.muted, fontSize: 10 }}>
          Trade markers load ho rahe hain...
        </Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <Text
        style={{
          color: COLORS.red,
          fontSize: 10,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        {loadError}
      </Text>
    );
  }

  return (
    <View
      style={{
        marginTop: 8,
        marginBottom: 8,
        padding: 10,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: COLORS.blue + "55",
        backgroundColor: COLORS.blue + "0d",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: COLORS.text,
            fontSize: 10,
            fontWeight: "900",
            letterSpacing: 0.7,
          }}
        >
          📍 TRADE MARKERS
        </Text>
        <Text
          style={{
            color: visibleTrades.length
              ? COLORS.blue
              : COLORS.muted,
            fontSize: 9,
            fontWeight: "900",
          }}
        >
          {visibleTrades.length} ON CHART
        </Text>
      </View>

      {visibleTrades.length > 0 ? (
        <>
          <TradeTimeline
            trades={visibleTrades}
            candles={candles}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {visibleTrades.slice(-8).map((trade, index) => {
              const pnl = Number(trade?.pnl || 0);
              const status = String(
                trade?.status || "CLOSED"
              ).toUpperCase();
              const exitValue =
                trade?.exit_price != null
                  ? `₹${Number(trade.exit_price).toFixed(2)}`
                  : status === "OPEN"
                  ? "OPEN"
                  : "--";

              return (
                <View
                  key={String(trade?.id || index)}
                  style={{
                    width: 210,
                    padding: 9,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor:
                      status === "OPEN"
                        ? COLORS.gold + "66"
                        : pnl >= 0
                        ? COLORS.green + "66"
                        : COLORS.red + "66",
                    backgroundColor: COLORS.card,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: COLORS.text,
                      fontSize: 10,
                      fontWeight: "900",
                    }}
                  >
                    {trade?.symbol || instrument} • {trade?.side || ""}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.blue,
                      fontSize: 9,
                      marginTop: 5,
                      fontWeight: "800",
                    }}
                  >
                    E {istDateTime(tradeEntryTime(trade))} • ₹{Number(trade?.entry_price || 0).toFixed(2)}
                  </Text>
                  <Text
                    style={{
                      color:
                        status === "OPEN"
                          ? COLORS.gold
                          : pnl >= 0
                          ? COLORS.green
                          : COLORS.red,
                      fontSize: 9,
                      marginTop: 4,
                      fontWeight: "800",
                    }}
                  >
                    X {status === "OPEN" ? "OPEN" : istDateTime(tradeExitTime(trade))} • {exitValue} • {status === "OPEN" ? "Running" : money(pnl)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </>
      ) : recentOutsideTrade ? (
        <Text
          style={{
            color: COLORS.gold,
            fontSize: 10,
            lineHeight: 16,
            marginTop: 7,
          }}
        >
          TODAY selected hai. Kal ki {tradeInstrument(recentOutsideTrade) || instrument} trade dekhne ke liye 7 DAYS dabao.
        </Text>
      ) : (
        <Text
          style={{
            color: COLORS.muted,
            fontSize: 10,
            marginTop: 7,
          }}
        >
          Selected range aur instrument me koi Paper trade nahi mili.
        </Text>
      )}
    </View>
  );
}

function TradeMarkerChartBridge(props) {
  const OriginalChart = props.__okaiOriginalChart;
  const cleanProps = { ...props };
  delete cleanProps.__okaiOriginalChart;
  cleanProps.__okaiTradeMarkerBypass = true;

  return React.createElement(
    View,
    { style: { width: "100%" } },
    React.createElement(TradeMarkerPanel, {
      candles: cleanProps.candles || [],
    }),
    React.createElement(OriginalChart, cleanProps)
  );
}

function isCandlestickChart(type, props) {
  if (!type || props?.__okaiTradeMarkerBypass) return false;
  if (typeof type !== "function") return false;

  const name = String(
    type.displayName || type.name || ""
  );

  if (name === "CandlestickIndicatorChart") {
    return true;
  }

  return (
    Array.isArray(props?.candles) &&
    Number(props?.height || 0) >= 300 &&
    Object.prototype.hasOwnProperty.call(
      props || {},
      "emptyMessage"
    )
  );
}

function installReactElementBridge() {
  if (React.__OKAI_TRADE_MARKER_CHART_PATCHED__) return;

  const originalCreateElement = React.createElement.bind(React);
  React.createElement = function patchedCreateElement(
    type,
    props,
    ...children
  ) {
    if (isCandlestickChart(type, props)) {
      return originalCreateElement(
        TradeMarkerChartBridge,
        {
          ...(props || {}),
          __okaiOriginalChart: type,
        },
        ...children
      );
    }
    return originalCreateElement(type, props, ...children);
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const original = jsxRuntime[key];
      if (typeof original !== "function") return;
      jsxRuntime[key] = function patchedJsx(type, props, reactKey) {
        if (isCandlestickChart(type, props)) {
          return original(
            TradeMarkerChartBridge,
            {
              ...(props || {}),
              __okaiOriginalChart: type,
            },
            reactKey
          );
        }
        return original(type, props, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_TRADE_MARKER_CHART_PATCHED__ = true;
}

function installTradeMarkerChartEnhancement() {
  if (installed) return;
  installed = true;
  installChartRequestTracking();
  installReactElementBridge();
}

module.exports = {
  installTradeMarkerChartEnhancement,
};
