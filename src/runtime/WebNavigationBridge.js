const React = require("react");
const { Platform } = require("react-native");

let installed = false;
let currentSetter = null;

const ROUTES = new Set([
  "home", "bot", "ai", "trade", "tools", "guide", "more", "account",
  "score", "markets", "broker", "telegram", "backtest", "strategybuilder",
  "livefeed", "servertest", "herozero", "plans", "admin", "localgateway",
]);

const WEB_MENU_ROUTE_MAP = {
  dashboard: "bot",
  trades: "trade",
  ai: "ai",
  reports: "score",
  settings: "tools",
  broker: "broker",
  backtest: "backtest",
  billing: "plans",
  help: "guide",
  account: "account",
};

function isDashboardState(initialValue, currentValue) {
  if (initialValue !== "bot" && initialValue !== "home") return false;
  return ROUTES.has(String(currentValue || ""));
}

function navigate(route) {
  if (typeof currentSetter !== "function") return false;
  const next = String(route || "");
  if (!ROUTES.has(next)) return false;
  currentSetter(next);
  return true;
}

function captureDashboardSetter(initialValue, currentValue, setter) {
  if (typeof setter !== "function") return false;
  if (!isDashboardState(initialValue, currentValue)) return false;

  currentSetter = setter;
  if (typeof globalThis !== "undefined") {
    globalThis.__OKAI_WEB_NAVIGATE__ = navigate;
  }
  return true;
}

function installDomMenuBridge() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (globalThis.__OKAI_WEB_MENU_CLICK_BRIDGE__) return;
  globalThis.__OKAI_WEB_MENU_CLICK_BRIDGE__ = true;

  document.addEventListener("click", (event) => {
    try {
      const target = event.target?.closest?.('[aria-label^="okai-web-nav-"]');
      if (!target) return;
      const aria = String(target.getAttribute("aria-label") || "");
      const key = aria.replace("okai-web-nav-", "").trim().toLowerCase();
      const route = WEB_MENU_ROUTE_MAP[key];
      if (!route) return;
      setTimeout(() => navigate(route), 0);
    } catch (_) {}
  }, true);
}

function installWebNavigationBridge() {
  if (installed) return;
  installed = true;

  const previousUseState = React.useState.bind(React);
  React.useState = function okaiWebNavigationUseState(initialValue) {
    const pair = previousUseState(initialValue);
    const value = pair[0];
    const setter = pair[1];

    // The onboarding assistant is shared by Android and web. Capture the
    // dashboard setter on both platforms so its action buttons can open the
    // requested screen instead of only closing the modal on Android.
    captureDashboardSetter(initialValue, value, setter);

    return pair;
  };

  installDomMenuBridge();
}

module.exports = {
  installWebNavigationBridge,
  navigate,
  captureDashboardSetter,
};
