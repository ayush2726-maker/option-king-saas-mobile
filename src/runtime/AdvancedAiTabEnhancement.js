const React = require("react");
const ReactNative = require("react-native");
const AiDecisionCardModule = require("../components/AiDecisionCard");
const AdvancedAiTabScreenModule = require("../screens/AdvancedAiTabScreen");

const AiDecisionCard = AiDecisionCardModule.default || AiDecisionCardModule;
const AdvancedAiTabScreen = AdvancedAiTabScreenModule.default || AdvancedAiTabScreenModule;
const { ScrollView, StyleSheet, Text, TouchableOpacity, View } = ReactNative;

let installed = false;
let dashboardTab = "bot";
let dashboardSetter = null;
let lastOriginalSetter = null;
let lastWrappedSetter = null;

function componentName(type) {
  return String(type?.displayName || type?.name || "");
}

function flattenStyle(style) {
  try {
    return StyleSheet?.flatten ? StyleSheet.flatten(style) || {} : style || {};
  } catch (_) {
    if (Array.isArray(style)) {
      return style.reduce((result, item) => ({ ...result, ...flattenStyle(item) }), {});
    }
    return style && typeof style === "object" ? style : {};
  }
}

function flattenChildren(value, output = []) {
  if (value == null || value === false) return output;
  if (Array.isArray(value)) {
    value.forEach((item) => flattenChildren(item, output));
    return output;
  }
  output.push(value);
  return output;
}

function textFromNode(node, depth = 0) {
  if (depth > 9 || node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((item) => textFromNode(item, depth + 1)).join(" ");
  if (React.isValidElement(node)) return textFromNode(node.props?.children, depth + 1);
  return "";
}

function isDashboardRouteState(initialValue, currentValue) {
  if (initialValue !== "bot" && initialValue !== "home") return false;
  return [
    "home", "bot", "ai", "trade", "tools", "guide", "more", "account",
    "score", "markets", "broker", "telegram", "backtest", "strategybuilder",
    "livefeed", "servertest", "herozero", "plans", "admin", "localgateway",
  ].includes(String(currentValue || ""));
}

function patchDashboardState() {
  if (React.__OKAI_ADVANCED_AI_TAB_STATE_PATCHED__) return;
  const previousUseState = React.useState.bind(React);

  React.useState = function okaiAdvancedAiTabUseState(initialValue) {
    const pair = previousUseState(initialValue);
    const currentValue = pair[0];
    const originalSetter = pair[1];

    if (!isDashboardRouteState(initialValue, currentValue) || typeof originalSetter !== "function") {
      return pair;
    }

    dashboardTab = String(currentValue || "bot");
    if (lastOriginalSetter !== originalSetter) {
      lastOriginalSetter = originalSetter;
      lastWrappedSetter = (nextValue) => {
        originalSetter((current) => {
          const resolved = typeof nextValue === "function" ? nextValue(current) : nextValue;
          if (typeof resolved === "string") dashboardTab = resolved;
          return resolved;
        });
      };
    }

    dashboardSetter = lastWrappedSetter;
    return [currentValue, lastWrappedSetter];
  };

  React.__OKAI_ADVANCED_AI_TAB_STATE_PATCHED__ = true;
}

function isLegacyAiCard(type, props) {
  if (props?.__okaiAdvancedAiStandalone) return false;
  return type === AiDecisionCard || componentName(type) === "AiDecisionCard";
}

function isBottomNavigation(type, props, children) {
  if (type !== View && componentName(type).toLowerCase() !== "view") return false;
  const style = flattenStyle(props?.style);
  if (style.position !== "absolute" || Number(style.bottom) !== 0) return false;
  if (String(style.flexDirection || "") !== "row") return false;

  const text = ` ${textFromNode(children).replace(/\s+/g, " ").trim()} `;
  return /\s(Home|होम)\s/i.test(text)
    && /\s(Trade|ट्रेड)\s/i.test(text)
    && /\s(Account|खाता)\s/i.test(text);
}

function isDashboardContent(type, props) {
  if (type !== ScrollView && componentName(type).toLowerCase() !== "scrollview") return false;
  const style = flattenStyle(props?.style);
  const contentStyle = flattenStyle(props?.contentContainerStyle);

  // The production bundle may minify OtaStatusBanner's function name, so
  // identifying the dashboard by that child can fail and leave the AI route
  // blank. The root dashboard content has this unique full-height shape.
  return Number(style.flex) === 1 && Number(contentStyle.flexGrow) === 1;
}

function aiTabButton(createElement) {
  const active = dashboardTab === "ai";
  const color = active ? "#b06deb" : "#737391";
  return createElement(
    TouchableOpacity,
    {
      key: "okai-advanced-ai-tab",
      onPress: () => {
        if (typeof dashboardSetter === "function") dashboardSetter("ai");
      },
      activeOpacity: 0.76,
      accessibilityRole: "button",
      accessibilityLabel: "Advanced AI",
      accessibilityState: { selected: active },
      style: { flex: 1, alignItems: "center", gap: 3 },
    },
    createElement(Text, { style: { fontSize: 16 } }, "🧠"),
    createElement(Text, { style: { color, fontSize: 8.5, fontWeight: "900" } }, "AI")
  );
}

function appendAiTab(children, createElement) {
  const flat = flattenChildren(children);
  if (flat.some((child) => textFromNode(child).trim() === "AI")) return flat;
  return [...flat, aiTabButton(createElement)];
}

function aiScreenChildren(children, createElement) {
  const flat = flattenChildren(children);
  const otaBanner = flat.find((child) => (
    React.isValidElement(child) && componentName(child.type) === "OtaStatusBanner"
  ));
  return [
    otaBanner || null,
    createElement(AdvancedAiTabScreen, {
      key: "okai-advanced-ai-screen",
      __okaiAdvancedAiStandalone: true,
    }),
  ].filter(Boolean);
}

function installCreateElementPatch() {
  if (React.__OKAI_ADVANCED_AI_TAB_CREATE_PATCHED__) return;
  const previousCreateElement = React.createElement.bind(React);

  React.createElement = function okaiAdvancedAiTabCreateElement(type, props, ...children) {
    if (isLegacyAiCard(type, props)) return null;

    let nextChildren = children;
    if (isBottomNavigation(type, props || {}, children)) {
      nextChildren = appendAiTab(children, previousCreateElement);
    } else if (isDashboardContent(type, props || {}) && dashboardTab === "ai") {
      nextChildren = aiScreenChildren(children, previousCreateElement);
    }

    return previousCreateElement(type, props, ...nextChildren);
  };

  React.__OKAI_ADVANCED_AI_TAB_CREATE_PATCHED__ = true;
}

function runtimeElement(previous, type, props, children) {
  const nextProps = {
    ...(props || {}),
    children: children.length <= 1 ? children[0] : children,
  };
  return previous(type, nextProps, undefined);
}

function patchRuntime(runtime) {
  if (!runtime || typeof runtime !== "object") return;

  ["jsx", "jsxs", "jsxDEV"].forEach((key) => {
    const previous = runtime[key];
    if (typeof previous !== "function" || previous.__OKAI_ADVANCED_AI_TAB_PATCHED__) return;

    const wrapped = function okaiAdvancedAiTabJsx(type, props, ...rest) {
      if (isLegacyAiCard(type, props)) return null;

      let nextProps = props || {};
      const children = nextProps.children;
      const createElement = (elementType, elementProps, ...elementChildren) => (
        runtimeElement(previous, elementType, elementProps, elementChildren)
      );

      if (isBottomNavigation(type, nextProps, children)) {
        nextProps = { ...nextProps, children: appendAiTab(children, createElement) };
      } else if (isDashboardContent(type, nextProps) && dashboardTab === "ai") {
        nextProps = { ...nextProps, children: aiScreenChildren(children, createElement) };
      }

      return previous(type, nextProps, ...rest);
    };

    wrapped.__OKAI_ADVANCED_AI_TAB_PATCHED__ = true;
    runtime[key] = wrapped;
  });
}

function installAdvancedAiTabEnhancement() {
  if (installed) return;
  installed = true;
  patchDashboardState();
  installCreateElementPatch();

  try { patchRuntime(require("react/jsx-runtime")); } catch (_) {}
  try { patchRuntime(require("react/jsx-dev-runtime")); } catch (_) {}
}

module.exports = { installAdvancedAiTabEnhancement };
