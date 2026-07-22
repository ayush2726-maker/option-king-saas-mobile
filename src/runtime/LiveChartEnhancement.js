const React = require("react");
const { View, Text } = require("react-native");
const AsyncStorageModule = require(
  "@react-native-async-storage/async-storage"
);

const AsyncStorage =
  AsyncStorageModule.default || AsyncStorageModule;

const SAAS_URL =
  "https://option-king-saas-production.up.railway.app";

const COLORS = {
  card: "#0f0f1a",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#777792",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
};

let installed = false;
let chartContext = {
  instrument: "NIFTY",
  days: 1,
  revision: 0,
};
const contextListeners = new Set();

function requestUrl(input) {
  if (typeof input === "string") return input;
  if (input && typeof input.url === "string") return input.url;
  return "";
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

function notifyContext() {
  contextListeners.forEach((listener) => {
    try {
      listener({ ...chartContext });
    } catch (_) {}
  });
}

function trackChartRequest(input) {
  const url = requestUrl(input);
  if (!url.includes("/bot/chart-data")) return;

  const instrument = String(
    queryValue(url, "instrument") ||
      chartContext.instrument ||
      "NIFTY"
  ).toUpperCase();
  const requestedDays = Number(
    queryValue(url, "days") || chartContext.days || 1
  );
  const days = [1, 7, 30].includes(requestedDays)
    ? requestedDays
    : 1;

  chartContext = {
    instrument,
    days,
    revision: chartContext.revision + 1,
  };
  notifyContext();
}

function installChartTracking() {
  if (
    typeof global.fetch !== "function" ||
    global.__OKAI_LIVE_QUOTE_TRACKING_PATCHED__
  ) {
    return;
  }

  const previousFetch = global.fetch.bind(global);
  global.fetch = function okaiLiveQuoteTrackingFetch(
    input,
    init
  ) {
    trackChartRequest(input);
    return previousFetch(input, init);
  };
  global.__OKAI_LIVE_QUOTE_TRACKING_PATCHED__ = true;
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

function parseDate(value) {
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

function threeMinuteBucket(milliseconds) {
  const istOffset = 330 * 60 * 1000;
  const bucketSize = 3 * 60 * 1000;
  return (
    Math.floor((milliseconds + istOffset) / bucketSize) *
      bucketSize -
    istOffset
  );
}

function mergeQuoteIntoCandles(candles, quote, days) {
  const source = Array.isArray(candles) ? candles : [];
  if (
    Number(days) !== 1 ||
    !quote?.success ||
    !quote?.market_open ||
    !Number.isFinite(Number(quote?.ltp)) ||
    !source.length
  ) {
    return source;
  }

  const ltp = Number(quote.ltp);
  const quoteDate = parseDate(quote.as_of) || new Date();
  const quoteBucket = threeMinuteBucket(quoteDate.getTime());
  const next = source.map((candle) => ({ ...candle }));
  const last = next[next.length - 1];
  const lastDate = parseDate(last?.time);
  const lastBucket = lastDate
    ? threeMinuteBucket(lastDate.getTime())
    : null;

  if (lastBucket === quoteBucket) {
    const oldHigh = Number(last.high);
    const oldLow = Number(last.low);
    last.close = ltp;
    last.high = Number.isFinite(oldHigh)
      ? Math.max(oldHigh, ltp)
      : ltp;
    last.low = Number.isFinite(oldLow)
      ? Math.min(oldLow, ltp)
      : ltp;
    last.live = true;
    last.live_as_of = quote.as_of;
    return next;
  }

  if (lastBucket == null || quoteBucket > lastBucket) {
    const previousClose = Number(last?.close);
    const open = Number.isFinite(previousClose)
      ? previousClose
      : ltp;

    next.push({
      time: new Date(quoteBucket).toISOString(),
      open,
      high: Math.max(open, ltp),
      low: Math.min(open, ltp),
      close: ltp,
      ema9: last?.ema9 ?? null,
      ema21: last?.ema21 ?? null,
      vwap: last?.vwap ?? null,
      supertrend: last?.supertrend ?? null,
      supertrend_dir:
        last?.supertrend_dir || "NEUTRAL",
      adx: Number(last?.adx || 0),
      live: true,
      live_as_of: quote.as_of,
    });
  }

  return next.slice(-140);
}

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatTime(value) {
  const parsed = parseDate(value);
  if (!parsed) return "--:--:--";
  const ist = new Date(parsed.getTime() + 330 * 60 * 1000);
  return [
    String(ist.getUTCHours()).padStart(2, "0"),
    String(ist.getUTCMinutes()).padStart(2, "0"),
    String(ist.getUTCSeconds()).padStart(2, "0"),
  ].join(":");
}

function LiveTradeMarkerBridge(props) {
  const OriginalBridge = props.__okaiLiveOriginalBridge;
  const cleanProps = { ...props };
  delete cleanProps.__okaiLiveOriginalBridge;

  const context = useChartContext();
  const [quote, setQuote] = React.useState(null);
  const [feedError, setFeedError] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    let busy = false;

    if (Number(context.days) !== 1) {
      setQuote(null);
      setFeedError("");
      return () => {
        alive = false;
      };
    }

    async function loadQuote() {
      if (busy) return;
      busy = true;
      try {
        const token = await AsyncStorage.getItem("saas_token");
        if (!token) return;

        const response = await global.fetch(
          `${SAAS_URL}/market/quote?instrument=${encodeURIComponent(
            context.instrument || "NIFTY"
          )}`,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );
        const data = await response.json();
        if (!alive) return;

        if (
          data?.success &&
          Number.isFinite(Number(data?.ltp))
        ) {
          setQuote(data);
          setFeedError("");
        } else {
          setFeedError(
            data?.message || "Live quote unavailable"
          );
        }
      } catch (_) {
        if (alive) {
          setFeedError("Live quote reconnecting...");
        }
      } finally {
        busy = false;
      }
    }

    loadQuote();
    const timer = setInterval(loadQuote, 1000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [context.instrument, context.days]);

  const liveCandles = React.useMemo(
    () =>
      mergeQuoteIntoCandles(
        cleanProps.candles,
        quote,
        context.days
      ),
    [cleanProps.candles, quote, context.days]
  );

  const marketOpen = !!quote?.market_open;
  const liveConnected = !!quote?.success;

  return React.createElement(
    View,
    { style: { width: "100%" } },
    Number(context.days) === 1
      ? React.createElement(
          View,
          {
            style: {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: liveConnected
                ? COLORS.green + "66"
                : COLORS.border,
              backgroundColor: COLORS.card,
            },
          },
          React.createElement(
            View,
            null,
            React.createElement(
              Text,
              {
                style: {
                  color: liveConnected
                    ? marketOpen
                      ? COLORS.green
                      : COLORS.gold
                    : COLORS.muted,
                  fontSize: 10,
                  fontWeight: "900",
                },
              },
              liveConnected
                ? `${marketOpen ? "● LIVE" : "● CLOSED"} ${
                    context.instrument
                  }`
                : `○ ${context.instrument}`
            ),
            React.createElement(
              Text,
              {
                style: {
                  color: COLORS.muted,
                  fontSize: 8,
                  marginTop: 2,
                },
              },
              liveConnected
                ? `Updated ${formatTime(
                    quote.as_of
                  )} IST • 1 sec display feed`
                : feedError || "Connecting live quote..."
            )
          ),
          React.createElement(
            Text,
            {
              style: {
                color: COLORS.text,
                fontSize: 15,
                fontWeight: "900",
              },
            },
            formatPrice(quote?.ltp)
          )
        )
      : null,
    React.createElement(OriginalBridge, {
      ...cleanProps,
      candles: liveCandles,
      __okaiLiveBridgeBypass: true,
      __okaiTradeMarkerBypass: true,
    })
  );
}

LiveTradeMarkerBridge.displayName =
  "OKAILiveTradeMarkerBridge";

function isTradeMarkerBridge(type, props) {
  if (
    !type ||
    props?.__okaiLiveBridgeBypass ||
    typeof type !== "function"
  ) {
    return false;
  }

  const name = String(type.displayName || type.name || "");
  if (name === "TradeMarkerChartBridge") return true;

  return (
    Object.prototype.hasOwnProperty.call(
      props || {},
      "__okaiOriginalChart"
    ) &&
    Array.isArray(props?.candles)
  );
}

function installReactBridge() {
  if (React.__OKAI_LIVE_TRADE_BRIDGE_PATCHED__) return;

  const previousCreateElement =
    React.createElement.bind(React);

  React.createElement = function okaiLiveBridgeCreateElement(
    type,
    props,
    ...children
  ) {
    if (isTradeMarkerBridge(type, props)) {
      return previousCreateElement(
        LiveTradeMarkerBridge,
        {
          ...(props || {}),
          __okaiLiveOriginalBridge: type,
        },
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
      jsxRuntime[key] = function okaiLiveBridgeJsx(
        type,
        props,
        reactKey
      ) {
        if (isTradeMarkerBridge(type, props)) {
          return previous(
            LiveTradeMarkerBridge,
            {
              ...(props || {}),
              __okaiLiveOriginalBridge: type,
            },
            reactKey
          );
        }
        return previous(type, props, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_LIVE_TRADE_BRIDGE_PATCHED__ = true;
}

function installLiveChartEnhancement() {
  if (installed) return;
  installed = true;
  installChartTracking();
  installReactBridge();
}

module.exports = {
  installLiveChartEnhancement,
  mergeQuoteIntoCandles,
};
