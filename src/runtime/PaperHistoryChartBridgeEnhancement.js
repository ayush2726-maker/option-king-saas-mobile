const SAAS_HOST = "option-king-saas-production.up.railway.app";

let installed = false;

function requestUrl(input) {
  if (typeof input === "string") return input;
  if (input && typeof input.url === "string") return input.url;
  return "";
}

function isPaperHistoryUrl(url) {
  const text = String(url || "");
  return text.includes(SAAS_HOST) && text.includes("/history/paper");
}

function reliableHistoryUrl(url) {
  return String(url).replace("/history/paper", "/bot/trade-history");
}

function installPaperHistoryChartBridgeEnhancement() {
  if (
    installed ||
    typeof global.fetch !== "function" ||
    global.__OKAI_PAPER_HISTORY_CHART_BRIDGE__
  ) {
    return;
  }

  installed = true;
  const previousFetch = global.fetch.bind(global);

  global.fetch = async function okaiPaperHistoryBridge(input, init) {
    const url = requestUrl(input);
    if (!isPaperHistoryUrl(url)) {
      return previousFetch(input, init);
    }

    const reliableUrl = reliableHistoryUrl(url);
    try {
      const response = await previousFetch(reliableUrl, init);
      if (response && response.ok) {
        return response;
      }
    } catch (_) {
      // Fall through to the legacy route during a temporary rollout mismatch.
    }

    return previousFetch(input, init);
  };

  global.__OKAI_PAPER_HISTORY_CHART_BRIDGE__ = true;
}

module.exports = {
  installPaperHistoryChartBridgeEnhancement,
};
