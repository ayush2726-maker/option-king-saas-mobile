const React = require("react");
const {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;

const SAAS_URL = "https://option-king-saas-production.up.railway.app";

const C = {
  card: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#70708e",
  sub: "#a0a0c0",
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

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value) {
  const parsed = number(value, 0);
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
  if (!section || props?.__okaiAccordionV2Bypass) return false;
  if (typeof type === "string" || type == null) return false;

  const name = componentName(type);
  if (name === "Card") return true;

  // The three most important dashboard cards carry glow. This survives
  // production minification even when the function name no longer stays Card.
  if (props && Object.prototype.hasOwnProperty.call(props, "glow")) return true;

  // Fallback for non-glow cards such as Score, Price, P&L and Trading Mode.
  // It identifies the local Card function by its stable implementation shape,
  // while excluding React Native Text/View/Row components.
  const source = componentSource(type);
  return (
    source.includes("children") &&
    source.includes("backgroundColor") &&
    source.includes("borderRadius") &&
    source.includes("borderWidth")
  );
}

function looksLikeAiCard(type, props) {
  if (props?.__okaiAccordionV2Bypass) return false;
  const name = componentName(type);
  if (name === "AiDecisionCard") return true;
  const source = componentSource(type);
  return !!props?.signal && source.includes("Shared AI Decision");
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
    starting: null,
    current: null,
    pnl: null,
    mode: "paper",
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
      const starting = number(
        signal?.starting_capital ??
          settings?.paper_capital ??
          settings?.capital ??
          0,
        0
      );
      const pnl = number(signal?.total_pnl ?? signal?.net_pnl ?? 0, 0);
      const serverCurrent =
        signal?.current_capital ??
        signal?.current_equity ??
        signal?.equity ??
        signal?.available_capital;
      const current = Number.isFinite(Number(serverCurrent))
        ? Number(serverCurrent)
        : starting + pnl;

      setState({
        loading: false,
        starting,
        current,
        pnl,
        mode: String(signal?.trading_mode || settings?.trading_mode || "paper"),
      });
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
  const capitalColour = number(capital.pnl, 0) >= 0 ? C.green : C.red;

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: open ? section.accent + "88" : C.border,
        overflow: "hidden",
        shadowColor: open ? section.accent : "#000",
        shadowOpacity: open ? 0.18 : 0.06,
        shadowRadius: open ? 9 : 3,
        elevation: open ? 6 : 2,
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
          gap: 10,
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
              {
                style: {
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 7,
                  marginTop: 5,
                },
              },
              React.createElement(
                Text,
                { style: { color: C.muted, fontSize: 10, fontWeight: "800" } },
                "Current Capital"
              ),
              capital.loading
                ? React.createElement(ActivityIndicator, {
                    size: "small",
                    color: C.blue,
                  })
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
              open ? "Tap to close details" : "Compact view • tap to open"
            )
      ),
      React.createElement(
        View,
        {
          style: {
            width: 32,
            height: 32,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: section.accent + "66",
            backgroundColor: section.accent + "18",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        React.createElement(
          Text,
          { style: { color: section.accent, fontSize: 17, fontWeight: "900" } },
          open ? "⌃" : "⌄"
        )
      )
    ),
    isBotStatus && open && capital.current != null
      ? React.createElement(
          View,
          {
            style: {
              marginHorizontal: 14,
              marginBottom: 8,
              padding: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: capitalColour + "55",
              backgroundColor: capitalColour + "12",
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
              { style: { color: C.sub, fontSize: 11, fontWeight: "800" } },
              `Current Capital • ${capital.mode.toUpperCase()}`
            ),
            React.createElement(
              Text,
              { style: { color: capitalColour, fontSize: 15, fontWeight: "900" } },
              money(capital.current)
            )
          ),
          React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 9, marginTop: 5 } },
            `Starting ${money(capital.starting)} • Overall P&L ${money(capital.pnl)}`
          )
        )
      : null,
    open
      ? React.createElement(originalType, {
          ...(originalProps || {}),
          __okaiAccordionV2Bypass: true,
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
          open ? "Tap to close details" : "Compact view • tap to open"
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
          __okaiAccordionV2Bypass: true,
        })
      : null
  );
}

function transformElement(previous, type, props, reactKey) {
  const nextProps = props || {};
  const section = findSection(nextProps);
  if (looksLikeDashboardCard(type, nextProps, section)) {
    return previous(
      AccordionPanel,
      { originalType: type, originalProps: nextProps, section },
      reactKey
    );
  }
  if (looksLikeAiCard(type, nextProps)) {
    return previous(
      AiAccordionPanel,
      { originalType: type, originalProps: nextProps },
      reactKey
    );
  }
  return previous(type, props, reactKey);
}

function patchJsxRuntime(moduleName) {
  try {
    const runtime = require(moduleName);
    ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
      const previous = runtime[key];
      if (typeof previous !== "function" || previous.__okaiAccordionV2) return;
      const wrapped = function okaiAccordionV2Jsx(type, props, reactKey, ...rest) {
        if (rest.length > 0) {
          const nextProps = props || {};
          const section = findSection(nextProps);
          if (looksLikeDashboardCard(type, nextProps, section)) {
            return previous(
              AccordionPanel,
              { originalType: type, originalProps: nextProps, section },
              reactKey,
              ...rest
            );
          }
          if (looksLikeAiCard(type, nextProps)) {
            return previous(
              AiAccordionPanel,
              { originalType: type, originalProps: nextProps },
              reactKey,
              ...rest
            );
          }
          return previous(type, props, reactKey, ...rest);
        }
        return transformElement(previous, type, props, reactKey);
      };
      wrapped.__okaiAccordionV2 = true;
      runtime[key] = wrapped;
    });
  } catch (_) {}
}

function installHomeAccordionEnhancementV2() {
  if (installed || React.__OKAI_HOME_ACCORDION_V2_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiAccordionV2CreateElement(type, props, ...children) {
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

  patchJsxRuntime("react/jsx-runtime");
  patchJsxRuntime("react/jsx-dev-runtime");

  // Prevent the older name-dependent accordion patch from installing later.
  React.__OKAI_HOME_ACCORDION_PATCHED__ = true;
  React.__OKAI_HOME_ACCORDION_V2_PATCHED__ = true;
}

module.exports = { installHomeAccordionEnhancementV2 };
