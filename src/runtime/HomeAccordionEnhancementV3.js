const React = require("react");
const {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} = require("react-native");
const jsxRuntime = require("react/jsx-runtime");
const SectorRotationCard = require("../components/SectorRotationCard");

let jsxDevRuntime = null;
try {
  jsxDevRuntime = require("react/jsx-dev-runtime");
} catch (_) {}

const C = {
  card: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#70708e",
  blue: "#4d9fff",
  accent: "#7c6deb",
};

const HOME_SOURCE_MARKERS = [
  "TODAY NET P&L",
  "AUTO Portfolio",
  "Start Bot",
  "Bot Start",
  "Refresh Status",
  "Status Refresh",
  "Trading Mode",
  "AUTO Scan Instruments",
  "Auto Scan Instruments",
];

// Only these two Home cards remain collapsible.
const SECTIONS = [
  {
    matches: ["Trading Mode"],
    title: "⚙️ Trading Mode",
    accent: C.accent,
  },
  {
    matches: ["AUTO Scan Instruments", "Auto Scan Instruments"],
    title: "🔎 AUTO Scan Instruments",
    accent: C.blue,
  },
];

let installed = false;

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

function includesText(haystack, needle) {
  return String(haystack || "")
    .toLowerCase()
    .includes(String(needle || "").toLowerCase());
}

function collectSignature(value, output = [], depth = 0) {
  if (value == null || value === false || depth > 12) return output;

  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectSignature(item, output, depth + 1));
    return output;
  }

  if (!React.isValidElement(value)) return output;

  collectSignature(value.props?.children, output, depth + 1);
  collectSignature(value.props?.label, output, depth + 1);
  collectSignature(value.props?.title, output, depth + 1);
  collectSignature(value.props?.accessibilityLabel, output, depth + 1);

  const source = componentSource(value.type);
  if (source) {
    HOME_SOURCE_MARKERS.forEach((marker) => {
      if (includesText(source, marker)) output.push(marker);
    });
  }

  return output;
}

function signatureOf(value) {
  return collectSignature(value)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function findSection(props) {
  const signature = signatureOf(props?.children);
  return (
    SECTIONS.find((section) =>
      section.matches.some((match) => includesText(signature, match))
    ) || null
  );
}

function looksLikeCardShell(type, props) {
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

function looksLikeDashboardCard(type, props, section) {
  if (!section || props?.__okaiAccordionV3Bypass) return false;
  return looksLikeCardShell(type, props);
}

function looksLikeLiveScoreCard(type, props) {
  if (
    props?.__okaiAccordionV3Bypass ||
    props?.__okaiLiveScoreV3Bypass
  ) {
    return false;
  }

  return (
    includesText(signatureOf(props?.children), "Live Strategy Score") &&
    looksLikeCardShell(type, props)
  );
}

function stripOriginalHeading(children, section) {
  const items = React.Children.toArray(children);
  const firstMeaningfulIndex = items.findIndex(
    (item) => item != null && item !== false
  );

  if (firstMeaningfulIndex < 0) return children;

  const firstText = signatureOf(items[firstMeaningfulIndex]);
  const isHeading = section.matches.some((match) =>
    includesText(firstText, match)
  );

  if (!isHeading) return children;
  return items.filter((_, index) => index !== firstMeaningfulIndex);
}

function stripLiveScoreHeading(children) {
  const items = React.Children.toArray(children);
  const firstMeaningfulIndex = items.findIndex(
    (item) => item != null && item !== false
  );

  if (firstMeaningfulIndex < 0) return children;
  const firstText = signatureOf(items[firstMeaningfulIndex]);

  if (!includesText(firstText, "Live Strategy Score")) return children;
  return items.filter((_, index) => index !== firstMeaningfulIndex);
}

function isStartStopControl(element) {
  const signature = signatureOf(element);
  const hasStart =
    includesText(signature, "Start Bot") ||
    includesText(signature, "Bot Start");
  const hasStop =
    includesText(signature, "Stop Bot") ||
    includesText(signature, "Bot Stop");
  return hasStart && hasStop;
}

function isRefreshControl(element) {
  const signature = signatureOf(element);
  return (
    includesText(signature, "Refresh Status") ||
    includesText(signature, "Status Refresh")
  );
}

function isHomeDashboard(children) {
  const signature = signatureOf(children);
  const hasPnl = includesText(signature, "TODAY NET P&L");
  const hasPortfolio = includesText(signature, "AUTO Portfolio");
  const hasStart =
    includesText(signature, "Start Bot") ||
    includesText(signature, "Bot Start");
  const hasRefresh =
    includesText(signature, "Refresh Status") ||
    includesText(signature, "Status Refresh");
  const hasTradingMode = includesText(signature, "Trading Mode");
  const hasAutoScan =
    includesText(signature, "AUTO Scan Instruments") ||
    includesText(signature, "Auto Scan Instruments");

  // Primary match: the visible Home header and portfolio cards.
  if (hasPnl && hasPortfolio && (hasStart || hasRefresh)) return true;

  // Production fallback: some Home cards are wrapper components whose text only
  // exists inside the component source, not in props.children.
  return (
    hasTradingMode &&
    hasAutoScan &&
    (hasPnl || hasPortfolio || hasStart || hasRefresh)
  );
}

function isSectorRotationCard(element) {
  return (
    React.isValidElement(element) &&
    (element.type === SectorRotationCard || element.props?.__okaiSectorRotationCard)
  );
}

function arrangeHomeDashboard(children) {
  const items = React.Children.toArray(children);
  if (!items.length || !isHomeDashboard(items)) return children;

  const startStop = [];
  const refresh = [];
  const rest = [];

  items.forEach((item) => {
    if (isSectorRotationCard(item)) return;
    if (isStartStopControl(item)) {
      startStop.push(item);
    } else if (isRefreshControl(item)) {
      refresh.push(item);
    } else {
      rest.push(item);
    }
  });

  const rotation = React.createElement(SectorRotationCard, {
    key: "okai-sector-rotation-home-v3",
    __okaiSectorRotationCard: true,
  });

  return [...startStop, ...refresh, rotation, ...rest];
}

function isScrollViewType(type) {
  return type === ScrollView || componentName(type) === "ScrollView";
}

function refineProps(type, props) {
  if (!isScrollViewType(type)) return props;

  const arranged = arrangeHomeDashboard(props?.children);
  if (arranged === props?.children) return props;

  return {
    ...(props || {}),
    children: arranged,
    stickyHeaderIndices: undefined,
  };
}

function AccordionPanel({ originalType, originalProps, section }) {
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
        React.createElement(
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
          children: bodyChildren,
        })
      : null
  );
}

function LiveScoreAccordionPanel({ originalType, originalProps }) {
  const [open, setOpen] = React.useState(false);
  const bodyChildren = stripLiveScoreHeading(originalProps?.children);

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: open ? C.blue + "88" : C.border,
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
          minHeight: 64,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
      },
      React.createElement(
        View,
        { style: { flex: 1, paddingRight: 10 } },
        React.createElement(
          Text,
          { style: { color: C.text, fontSize: 16, fontWeight: "900" } },
          "📊 Live Strategy Score"
        ),
        React.createElement(
          Text,
          { style: { color: C.muted, fontSize: 10, marginTop: 4 } },
          open ? "Tap to close live score" : "Tap to view live strategy score"
        )
      ),
      React.createElement(
        Text,
        { style: { color: C.blue, fontSize: 19, fontWeight: "900" } },
        open ? "⌃" : "⌄"
      )
    ),
    open
      ? React.createElement(originalType, {
          ...(originalProps || {}),
          __okaiAccordionV3Bypass: true,
          __okaiLiveScoreV3Bypass: true,
          glow: undefined,
          style: [
            originalProps?.style,
            {
              borderWidth: 0,
              borderRadius: 0,
              backgroundColor: "transparent",
              shadowOpacity: 0,
              elevation: 0,
              paddingTop: 4,
            },
          ],
          children: bodyChildren,
        })
      : null
  );
}

function transform(previous, type, props, reactKey, rest) {
  const nextProps = refineProps(type, props || {});
  const section = findSection(nextProps);

  if (looksLikeLiveScoreCard(type, nextProps)) {
    return previous(
      LiveScoreAccordionPanel,
      { originalType: type, originalProps: nextProps },
      reactKey,
      ...(rest || [])
    );
  }

  if (looksLikeDashboardCard(type, nextProps, section)) {
    return previous(
      AccordionPanel,
      { originalType: type, originalProps: nextProps, section },
      reactKey,
      ...(rest || [])
    );
  }

  return previous(type, nextProps, reactKey, ...(rest || []));
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

  React.createElement = function okaiAccordionV3CreateElement(
    type,
    props,
    ...children
  ) {
    const suppliedProps = children.length
      ? {
          ...(props || {}),
          children: children.length === 1 ? children[0] : children,
        }
      : props || {};
    const nextProps = refineProps(type, suppliedProps);
    const section = findSection(nextProps);

    if (looksLikeLiveScoreCard(type, nextProps)) {
      return previousCreateElement(LiveScoreAccordionPanel, {
        originalType: type,
        originalProps: nextProps,
      });
    }

    if (looksLikeDashboardCard(type, nextProps, section)) {
      return previousCreateElement(AccordionPanel, {
        originalType: type,
        originalProps: nextProps,
        section,
      });
    }

    return previousCreateElement(type, nextProps);
  };

  patchJsxRuntime(jsxRuntime);
  patchJsxRuntime(jsxDevRuntime);

  React.__OKAI_HOME_ACCORDION_PATCHED__ = true;
  React.__OKAI_HOME_ACCORDION_V2_PATCHED__ = true;
  React.__OKAI_HOME_ACCORDION_V3_PATCHED__ = true;
  React.__OKAI_LIVE_SCORE_V3_PATCHED__ = true;
  React.__OKAI_SECTOR_ROTATION_HOME_V3_PATCHED__ = true;
}

module.exports = {
  installHomeAccordionEnhancementV3,
  OKAI_SECTOR_ROTATION_HOME_RUNTIME_MARKER: "OKAI_SECTOR_ROTATION_HOME_RUNTIME_V3",
};
