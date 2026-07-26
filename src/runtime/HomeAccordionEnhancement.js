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

const CARD_SECTIONS = [
  { match: "Bot Status", title: "🤖 Bot Status", accent: C.green },
  { match: "AUTO Portfolio", title: "🎯 AUTO Portfolio", accent: C.accent },
  { match: "Graph History", title: "📅 Graph History", accent: C.blue },
  { match: "Score History", title: "📈 Score History", accent: C.accent },
  { match: "Price Movement", title: "📊 Price Movement", accent: C.blue },
  { match: "Paper Trade P&L", title: "💹 Paper Trade P&L", accent: C.green },
  { match: "Trading Mode", title: "⚙️ Trading Mode", accent: C.accent },
  { match: "Auto Scan Instruments", title: "🔎 Auto Scan Instruments", accent: C.blue },
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

function findCardSection(props) {
  const text = collectText(props?.children).join(" ");
  return CARD_SECTIONS.find((section) => text.includes(section.match)) || null;
}

function stripOriginalHeading(children, match) {
  const items = React.Children.toArray(children);
  const firstMeaningfulIndex = items.findIndex((item) => item != null && item !== false);
  if (firstMeaningfulIndex < 0) return children;

  const firstText = collectText(items[firstMeaningfulIndex]).join(" ");
  if (!firstText.includes(match)) return children;

  return items.filter((_, index) => index !== firstMeaningfulIndex);
}

async function apiGet(path, token) {
  const response = await fetch(SAAS_URL + path, {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await response.json();
  if (!response.ok) {
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
      if (!token) return;

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
      const pnl = number(
        signal?.total_pnl ??
          signal?.net_pnl ??
          0,
        0
      );
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

function AccordionCard({
  originalType,
  originalProps,
  section,
}) {
  const [open, setOpen] = React.useState(false);
  const isBotStatus = section.match === "Bot Status";
  const capital = useCurrentCapital(isBotStatus);
  const capitalColour = number(capital.pnl, 0) >= 0 ? C.green : C.red;
  const bodyChildren = stripOriginalHeading(
    originalProps?.children,
    section.match
  );

  const originalCard = React.createElement(
    originalType,
    {
      ...(originalProps || {}),
      __okaiAccordionBypass: true,
      glow: undefined,
      style: [
        originalProps?.style,
        {
          borderWidth: 0,
          borderRadius: 0,
          paddingHorizontal: 14,
          paddingTop: 2,
          paddingBottom: 14,
          backgroundColor: "transparent",
          shadowOpacity: 0,
          elevation: 0,
        },
      ],
      children: bodyChildren,
    }
  );

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
        shadowOpacity: open ? 0.18 : 0.08,
        shadowRadius: open ? 9 : 4,
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
          {
            style: {
              color: C.text,
              fontSize: 15,
              fontWeight: "900",
            },
          },
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
                  gap: 8,
                  marginTop: 5,
                },
              },
              React.createElement(
                Text,
                {
                  style: {
                    color: C.muted,
                    fontSize: 10,
                    fontWeight: "800",
                  },
                },
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
                        color: capitalColour,
                        fontSize: 13,
                        fontWeight: "900",
                      },
                    },
                    capital.current == null ? "--" : money(capital.current)
                  )
            )
          : React.createElement(
              Text,
              {
                style: {
                  color: C.muted,
                  fontSize: 10,
                  marginTop: 4,
                },
              },
              open ? "Tap to close details" : "Tap to view details"
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
          {
            style: {
              color: section.accent,
              fontSize: 17,
              fontWeight: "900",
            },
          },
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
    open ? originalCard : null
  );
}

function AiAccordion({ originalType, originalProps }) {
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
        null,
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
      ? React.createElement(
          originalType,
          {
            ...(originalProps || {}),
            __okaiAccordionBypass: true,
          }
        )
      : null
  );
}

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function installHomeAccordionEnhancement() {
  if (installed || React.__OKAI_HOME_ACCORDION_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiHomeAccordionCreateElement(type, props, ...children) {
    const nextProps = children.length > 0
      ? { ...(props || {}), children: children.length === 1 ? children[0] : children }
      : props || {};

    if (!nextProps.__okaiAccordionBypass && componentName(type) === "Card") {
      const section = findCardSection(nextProps);
      if (section) {
        return previousCreateElement(AccordionCard, {
          originalType: type,
          originalProps: nextProps,
          section,
        });
      }
    }

    if (!nextProps.__okaiAccordionBypass && componentName(type) === "AiDecisionCard") {
      return previousCreateElement(AiAccordion, {
        originalType: type,
        originalProps: nextProps,
      });
    }

    return previousCreateElement(type, props, ...children);
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;
      jsxRuntime[key] = function okaiHomeAccordionJsx(type, props, reactKey) {
        const nextProps = props || {};
        if (!nextProps.__okaiAccordionBypass && componentName(type) === "Card") {
          const section = findCardSection(nextProps);
          if (section) {
            return previous(AccordionCard, {
              originalType: type,
              originalProps: nextProps,
              section,
            }, reactKey);
          }
        }
        if (!nextProps.__okaiAccordionBypass && componentName(type) === "AiDecisionCard") {
          return previous(AiAccordion, {
            originalType: type,
            originalProps: nextProps,
          }, reactKey);
        }
        return previous(type, props, reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_HOME_ACCORDION_PATCHED__ = true;
}

module.exports = { installHomeAccordionEnhancement };
