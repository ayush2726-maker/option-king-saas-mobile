let installed = false;
let selectedBroker = null;

function urlText(input) {
  if (typeof input === "string") return input;
  if (input && typeof input.url === "string") return input.url;
  return "";
}

function decoratePayload(url, payload) {
  if (!payload || typeof payload !== "object") return payload;

  if (url.includes("/broker/list")) {
    selectedBroker = String(payload.selected_broker || "").toLowerCase() || null;
  }

  if (url.includes("/broker/select/") && payload.success) {
    selectedBroker = String(payload.selected_broker || "").toLowerCase() || selectedBroker;
  }

  if (url.includes("/broker/test/") && payload.success) {
    payload.status = payload.selected
      ? "connected • SELECTED"
      : "connected • NOT SELECTED";
    payload.selection_message = payload.selected
      ? "This broker is used by bot and backtests."
      : "Connection is valid, but bot/backtests are using another selected broker.";
  }

  if (
    url.includes("/backtest/") &&
    selectedBroker &&
    typeof payload.message === "string" &&
    payload.message.toLowerCase().includes("broker login failed") &&
    !payload.message.toLowerCase().includes("selected broker")
  ) {
    payload.message = `${selectedBroker.toUpperCase()} selected broker: ${payload.message}`;
    payload.selected_broker = selectedBroker;
  }

  return payload;
}

function installBrokerSelectionFetchEnhancement() {
  if (installed || typeof global.fetch !== "function") return;
  installed = true;

  const originalFetch = global.fetch.bind(global);
  global.fetch = async function brokerAwareFetch(input, init) {
    const response = await originalFetch(input, init);
    const url = urlText(input);

    if (
      !url.includes("/broker/") &&
      !url.includes("/backtest/")
    ) {
      return response;
    }

    const originalJson = response.json.bind(response);
    response.json = async () => decoratePayload(url, await originalJson());
    return response;
  };
}

function getSelectedBrokerSnapshot() {
  return selectedBroker;
}

module.exports = {
  installBrokerSelectionFetchEnhancement,
  getSelectedBrokerSnapshot,
};
