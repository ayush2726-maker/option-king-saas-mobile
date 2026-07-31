const React = require("react");
const {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");

const HOME_LAYOUT_DIRECT_V2 = true;

const C = {
  card: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#70708e",
  blue: "#4d9fff",
  accent: "#7c6deb",
};

// These are the only two Home cards that should remain collapsible.
const KEEP_DROPDOWN_MATCHES = [
  {
    matches: ["Trading Mode"],
    title: "⚙️ Trading Mode",
    accent: C.accent,
  },
  {
    matches: ["Auto Scan Instruments", "AUTO Scan Instruments"],
    title: "🔎 AUTO Scan Instruments",
    accent: C.blue,
  },
];

let installed = false;

function componentName(type) {
  return String(type?.displayName || type?.name || "");
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

function textOf(value) {
  return collectText(value)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesText(haystack, needle) {
  return String(haystack || "")
    .toLowerCase()
    .includes(String(needle || "").toLowerCase());
}

function findCardSection(props) {
  const text = textOf(props?.children);
  return (
    KEEP_DROPDOWN_MATCHES.find((section) =>
      section.matches.some((match) => includesText(text, match))
    ) || null
  );
}

function stripOriginalHeading(children, section) {
  const items = React.Children.toArray(children);
  const firstMeaningfulIndex = items.findIndex(
    (item) => item != null && item !== false
  );

  if (firstMeaningfulIndex < 0) return children;

  const firstText = textOf(items[firstMeaningfulIndex]);
  const isHeading = section.matches.some((match) =>
    includesText(firstText, match)
  );

  if (!isHeading) return children;
  return items.filter((_, index) => index !== firstMeaningfulIndex);
}

function isStartStopControl(element) {
  const text = textOf(element);
  const hasStart =
    includesText(text, "Start Bot") ||
    includesText(text, "Bot Start");
  const hasStop =
    includesText(text, "Stop Bot") ||
    includesText(text, "Bot Stop");
  return hasStart && hasStop;
}

function isRefreshControl(element) {
  const text = textOf(element);
  return (
    includesText(text, "Refresh Status") ||
    includesText(text, "Status Refresh")
  );
}

function isHomeBotDashboard(children) {
  const text = textOf(children);
  return (
    includesText(text, "TODAY NET P&L") &&
    includesText(text, "AUTO Portfolio") &&
    (includesText(text, "Start Bot") || includesText(text, "Bot Start"))
  );
}

function moveBotControlsToTop(children) {
  const items = React.Children.toArray(children);
  if (!items.length || !isHomeBotDashboard(items)) return children;

  const startStop = [];
  const refresh = [];
  const rest = [];

  items.forEach((item) => {
    if (isStartStopControl(item)) {
      startStop.push(item);
    } else if (isRefreshControl(item)) {
      refresh.push(item);
    } else {
      rest.push(item);
    }
  });

  if (!startStop.length && !refresh.length) return children;
  return [...startStop, ...refresh, ...rest];
}

function isScrollViewType(type) {
  return type === ScrollView || componentName(type) === "ScrollView";
}

function refineScrollProps(type, props) {
  if (!isScrollViewType(type)) return props;

  const reordered = moveBotControlsToTop(props?.children);
  if (reordered === props?.children) return props;

  return {
    ...(props || {}),
    children: reordered,
  };
}

function AccordionCard({ originalType, originalProps, section }) {
  const [open, setOpen] = React.useState(false);
  const bodyChildren = stripOriginalHeading(
    originalProps?.children,
    section
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
        React.createElement(
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
        Text,
        {
          style: {
            color: section.accent,
            fontSize: 18,
            fontWeight: "900",
          },
        },
        open ? "⌃" : "⌄"
      )
    ),
    open
      ? React.createElement(originalType, {
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
        })
      : null
  );
}

function installHomeAccordionEnhancement() {
  if (installed || React.__OKAI_HOME_ACCORDION_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);

  React.createElement = function okaiHomeAccordionCreateElement(
    type,
    props,
    ...children
  ) {
    const nextProps =
      children.length > 0
        ? {
            ...(props || {}),
            children: children.length === 1 ? children[0] : children,
          }
        : props || {};

    if (
      !nextProps.__okaiAccordionBypass &&
      componentName(type) === "Card"
    ) {
      const section = findCardSection(nextProps);
      if (section) {
        return previousCreateElement(AccordionCard, {
          originalType: type,
          originalProps: nextProps,
          section,
        });
      }
    }

    return previousCreateElement(
      type,
      refineScrollProps(type, nextProps)
    );
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");

    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;

      jsxRuntime[key] = function okaiHomeAccordionJsx(
        type,
        props,
        reactKey
      ) {
        const nextProps = props || {};

        if (
          !nextProps.__okaiAccordionBypass &&
          componentName(type) === "Card"
        ) {
          const section = findCardSection(nextProps);
          if (section) {
            return previous(
              AccordionCard,
              {
                originalType: type,
                originalProps: nextProps,
                section,
              },
              reactKey
            );
          }
        }

        return previous(
          type,
          refineScrollProps(type, nextProps),
          reactKey
        );
      };
    });
  } catch (_) {}

  React.__OKAI_HOME_ACCORDION_PATCHED__ = HOME_LAYOUT_DIRECT_V2;
}

module.exports = { installHomeAccordionEnhancement };
