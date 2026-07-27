const React = require("react");
const {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;
const jsxRuntime = require("react/jsx-runtime");

let jsxDevRuntime = null;
try {
  jsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  card: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#70708e",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
  accent: "#7c6deb",
};

const SECTIONS = [
  { match: "Bot Status", title: "🤖 Bot Status", accent: C.green },
  { match: "AUTO Portfolio", title: "🎯 AUTO Portfolio", accent: C.accent },
  { match: "Graph History", title: "📅 Graph History", accent: C.blue },
  { match: "Score History", title: "📈 Score History", accent: C.accent },
  { match: "Price Movement", title: "📊 Price Movement", accent: C.blue },
  { match: "Paper Trade P&L", title: "💹 Paper Trade P&L", accent: C.green },
  { match: "Trading Mode", title: "⚙️ Trading Mode", accent: C.accent },
  { match: "AUTO Scan Instruments", title: "🔎 AUTO Scan Instruments", accent: C.blue },
  { match: "Auto Scan Instruments", title: "🔎 AUTO Scan Instruments", accent: C.blue },
];

let installed = false;

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value) {
  const parsed = asNumber(value, 0);
  const sign = parsed > 0 ? "+" : parsed < 0 ? "-" : "";
  return `${sign}₹${Math.abs(parsed).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function collectText(value, output = []) {
  if (value == null || value === false) return output;
  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output));
    return output;
  }
  if (React.isValidElement(value)) {
    collectText(value.props?.children, output);
    collectText(value.props?.label, output);
    collectText(value.props?.title, output);
  }
  return output;
}

function findSection(props) {
  const text = collectText(props?.children).join(" ");
  return SECTIONS.find((section) => text.includes(section.match)) || null;
}

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function componentSource(type) {
  if (typeof type !== "function") return "";
  try {
    return Function.prototype.toString.call(type);
  } catch (_) {
    return "";
  }
}

function looksLikeDashboardCard(type, props, section) {
  if (!section || props?.__okaiAccordionV3Bypass) return false;
  if (typeof type === "string" || type == null) return false;

  if (componentName(type) === "Card") return true;
  if (props && Object.prototype.hasOwnProperty.call(props, "glow")) return true;

  const source = componentSource(type);
  return (
    source.includes("children") &&
    source.includes("backgroundColor") &&
    source.includes("borderRadius") &&
    source.includes("borderWidth")
  );
}

function looksLikeAiCard(type, props) {
  if (props?.__okaiAccordionV3Bypass) return false;
  if (componentName(type) === "AiDecisionCard") return true;
  return !!props?.signal && componentSource(type).includes("Shared AI Decision");
}

async function apiGet(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(data?.detail || data?.message || "Request failed");
  }
  return data;
}

function useCurrentCapital(enabled) {
  const [state, setState] = React.useState({
    loading: enabled,
    current: null,
    pnl: null,
  });

  const load = React.useCallback(async () => {
    if (!enabled) return;
    try {
      const token = await AsyncStorage.getItem("saas_token");
      if (!token) {
        setState((previous) => ({ ...previous, loading: false }));
        return;
      }

      const [signal, settingsResponse] = await Promise.all([
        apiGet("/bot/signal", token),
        apiGet("/strategy/settings", token),
      ]);
      const settings = settingsResponse?.settings || {};
      const starting = asNumber(
        signal?.starting_capital ?? settings?.paper_capital ?? settings?.capital ?? 0,
        0
      );
      const pnl = asNumber(signal?.total_pnl ?? signal?.net_pnl ?? 0, 0);
      const serverCurrent =
        signal?.current_capital ??
        signal?.current_equity ??
        signal?.equity ??
        signal?.available_capital;
      const current = Number.isFinite(Number(serverCurrent))
        ? Number(serverCurrent)
        : starting + pnl;

      setState({ loading: false, current, pnl });
    } catch (_) {
      setState((previous) => ({ ...previous, loading: false }));
    }
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) return undefined;
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [enabled, load]);

  return state;
}

function AccordionPanel({ originalType, originalProps, section }) {
  const [open, setOpen] = React.useState(false);
  const isBotStatus = section.match === "Bot Status";
  const capital = useCurrentCapital(isBotStatus);
  const capitalColour = asNumber(capital.pnl, 0) >= 0 ? C.green : C.red;

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: open ? section.accent + "88" : C.border,
        overflow: "hidden",
      },
    },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => setOpen((value) => !value),
        activeOpacity: 0.82,
        accessibilityRole: "button",
        accessibilityState: { expanded: open },
        style: {
          minHeight: 62,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
      },
      React.createElement(
        View,
        { style: { flex: 1 } },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 15, fontWeight: "900" } },
          section.title
        ),
        isBotStatus
          ? React.createElement(
              View,
              { style: { flexDirection: "row", alignItems: "center", marginTop: 5 } },
              React.createElement(
                Text,
                { style: { color: C.muted, fontSize: 10, fontWeight: "800", marginRight: 7 } },
                "Current Capital"
              ),
              capital.loading
                ? React.createElement(ActivityIndicator, { size: "small", color: C.blue })
                : React.createElement(
                    Text,
                    {
                      style: {
                        color: capital.current == null ? C.muted : capitalColour,
                        fontSize: 13,
                        fontWeight: "900",
                      },
                    },
                    capital.current == null ? "--" : money(capital.current)
                  )
            )
          : React.createElement(
              Text,
              { style: { color: C.muted, fontSize: 10, marginTop: 4 } },
              open ? "Tap to close details" : "Tap to view details"
            )
      ),
      React.createElement(
        Text,
        { style: { color: section.accent, fontSize: 18, fontWeight: "900" } },
        open ? "⌃" : "⌄"
      )
    ),
    open
      ? React.createElement(originalType, {
          ...(originalProps || {}),
          __okaiAccordionV3Bypass: true,
          glow: undefined,
          style: [
            originalProps?.style,
            {
              borderWidth: 0,
              borderRadius: 0,
              backgroundColor: "transparent",
              shadowOpacity: 0,
              elevation: 0,
              paddingTop: 6,
            },
          ],
        })
      : null
  );
}

function AiAccordionPanel({ originalType, originalProps }) {
  const [open, setOpen] = React.useState(false);
  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: open ? C.gold + "88" : C.border,
        overflow: "hidden",
      },
    },
    React.createElement(
      TouchableOpacity,
      {
        onPress: () => setOpen((value) => !value),
        activeOpacity: 0.82,
        style: {
          minHeight: 62,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
      },
      React.createElement(
        View,
        { style: { flex: 1 } },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 15, fontWeight: "900" } },
          "🧠 Shared AI Decision"
        ),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 10, marginTop: 4 } },
          open ? "Tap to close details" : "Tap to view AI details"
        )
      ),
      React.createElement(
        Text,
        { style: { color: C.gold, fontSize: 18, fontWeight: "900" } },
        open ? "⌃" : "⌄"
      )
    ),
    open
      ? React.createElement(originalType, {
          ...(originalProps || {}),
          __okaiAccordionV3Bypass: true,
        })
      : null
  );
}

function transform(previous, type, props, reactKey, rest) {
  const nextProps = props || {};
  const section = findSection(nextProps);

  if (looksLikeDashboardCard(type, nextProps, section)) {
    return previous(
      AccordionPanel,
      { originalType: type, originalProps: nextProps, section },
      reactKey,
      ...(rest || [])
    );
  }
  if (looksLikeAiCard(type, nextProps)) {
    return previous(
      AiAccordionPanel,
      { originalType: type, originalProps: nextProps },
      reactKey,
      ...(rest || [])
    );
  }
  return previous(type, props, reactKey, ...(rest || []));
}

function patchJsxRuntime(runtime) {
  if (!runtime) return;
  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__okaiAccordionV3) return;

    const wrapped = function okaiAccordionV3Jsx(type, props, reactKey, ...rest) {
      return transform(previous, type, props, reactKey, rest);
    };
    wrapped.__okaiAccordionV3 = true;
    runtime[key] = wrapped;
  });
}

function installHomeAccordionEnhancementV3() {
  if (installed || React.__OKAI_HOME_ACCORDION_V3_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiAccordionV3CreateElement(type, props, ...children) {
    const nextProps = children.length
      ? {
          ...(props || {}),
          children: children.length === 1 ? children[0] : children,
        }
      : props || {};
    const section = findSection(nextProps);

    if (looksLikeDashboardCard(type, nextProps, section)) {
      return previousCreateElement(AccordionPanel, {
        originalType: type,
        originalProps: nextProps,
        section,
      });
    }
    if (looksLikeAiCard(type, nextProps)) {
      return previousCreateElement(AiAccordionPanel, {
        originalType: type,
        originalProps: nextProps,
      });
    }
    return previousCreateElement(type, props, ...children);
  };

  patchJsxRuntime(jsxRuntime);
  patchJsxRuntime(jsxDevRuntime);

  React.__OKAI_HOME_ACCORDION_PATCHED__ = true;
  React.__OKAI_HOME_ACCORDION_V2_PATCHED__ = true;
  React.__OKAI_HOME_ACCORDION_V3_PATCHED__ = true;
}

module.exports = { installHomeAccordionEnhancementV3 };
