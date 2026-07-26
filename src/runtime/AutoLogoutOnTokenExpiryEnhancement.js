const AsyncStorage = require("@react-native-async-storage/async-storage").default;

let installed = false;
let logoutInProgress = false;
const listeners = new Set();

function headerValue(headers, name) {
  if (!headers) return "";

  try {
    if (typeof headers.get === "function") {
      return String(headers.get(name) || headers.get(name.toLowerCase()) || "");
    }
  } catch (_) {}

  if (Array.isArray(headers)) {
    const match = headers.find(
      (entry) => Array.isArray(entry) && String(entry[0] || "").toLowerCase() === name.toLowerCase()
    );
    return match ? String(match[1] || "") : "";
  }

  if (typeof headers === "object") {
    const key = Object.keys(headers).find(
      (item) => String(item).toLowerCase() === name.toLowerCase()
    );
    return key ? String(headers[key] || "") : "";
  }

  return "";
}

function bearerToken(input, init) {
  const authorization =
    headerValue(init && init.headers, "authorization") ||
    headerValue(input && input.headers, "authorization");

  const match = String(authorization).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function responseMessage(response) {
  try {
    const clone = response.clone();
    const data = await clone.json();
    return String(
      (data && (data.detail || data.message || data.error)) || ""
    ).toLowerCase();
  } catch (_) {
    return "";
  }
}

function isAppSessionFailure(status, message) {
  if (Number(status) !== 401) return false;

  const text = String(message || "").toLowerCase();
  if (!text) return true;

  return [
    "token expired",
    "please login again",
    "invalid token",
    "login required",
    "could not validate",
    "not authenticated",
  ].some((phrase) => text.includes(phrase));
}

async function expireCurrentSession(requestToken) {
  if (!requestToken || logoutInProgress) return false;

  logoutInProgress = true;
  try {
    const currentToken = await AsyncStorage.getItem("saas_token");

    // Ignore a delayed 401 belonging to an older session after the user has
    // already logged in again with a different token.
    if (!currentToken || currentToken !== requestToken) {
      return false;
    }

    await AsyncStorage.multiRemove(["saas_token", "saas_user"]);

    for (const listener of Array.from(listeners)) {
      try {
        listener({ reason: "TOKEN_EXPIRED" });
      } catch (_) {}
    }

    return true;
  } finally {
    setTimeout(() => {
      logoutInProgress = false;
    }, 250);
  }
}

function subscribeAutoLogout(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function installAutoLogoutOnTokenExpiryEnhancement() {
  if (installed || typeof global.fetch !== "function") return;
  installed = true;

  const originalFetch = global.fetch.bind(global);

  global.fetch = async function okaiSessionAwareFetch(input, init) {
    const requestToken = bearerToken(input, init);
    const response = await originalFetch(input, init);

    if (requestToken && Number(response && response.status) === 401) {
      const message = await responseMessage(response);
      if (isAppSessionFailure(response.status, message)) {
        await expireCurrentSession(requestToken);
      }
    }

    return response;
  };
}

module.exports = {
  installAutoLogoutOnTokenExpiryEnhancement,
  subscribeAutoLogout,
};
