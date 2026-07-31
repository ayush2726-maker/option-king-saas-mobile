const AsyncStorageModule = require("@react-native-async-storage/async-storage");

const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

let installed = false;
const cache = new Map();
const inflight = new Map();
let cachedToken = "";
let tokenReadAt = 0;

const TOKEN_TTL_MS = 5 * 60 * 1000;

function urlText(input) {
  if (typeof input === "string") return input;
  if (input && typeof input.url === "string") return input.url;
  return "";
}

function methodOf(input, init) {
  return String(
    (init && init.method) || (input && input.method) || "GET"
  ).toUpperCase();
}

function headerValue(headers, name) {
  if (!headers) return "";
  if (typeof headers.get === "function") {
    return headers.get(name) || headers.get(name.toLowerCase()) || "";
  }
  return headers[name] || headers[name.toLowerCase()] || "";
}

async function authorizationOf(input, init) {
  const direct =
    headerValue(init && init.headers, "Authorization") ||
    headerValue(input && input.headers, "Authorization");
  if (direct) return String(direct);

  const now = Date.now();
  if (cachedToken && now - tokenReadAt < TOKEN_TTL_MS) {
    return `Bearer ${cachedToken}`;
  }

  try {
    cachedToken = (await AsyncStorage.getItem("saas_token")) || "";
    tokenReadAt = now;
    return cachedToken ? `Bearer ${cachedToken}` : "";
  } catch (_) {
    return "";
  }
}

function ruleFor(url, method) {
  if (method !== "GET") return null;

  if (url.includes("/strategy/profiles")) {
    return { name: "profiles", ttl: 2 * 60 * 1000 };
  }
  if (url.includes("/bot/trade-history") || url.includes("/history/paper")) {
    return { name: "history", ttl: 60 * 1000 };
  }
  if (url.includes("/bot/trade-live")) {
    return { name: "trade-live", ttl: 1500 };
  }
  return null;
}

function clearByName(name) {
  for (const [key, value] of cache.entries()) {
    if (value && value.name === name) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(`${name}|`)) inflight.delete(key);
  }
}

function makeHeaders(source) {
  return {
    get(name) {
      try {
        return source && typeof source.get === "function" ? source.get(name) : null;
      } catch (_) {
        return null;
      }
    },
  };
}

function makeJsonResponse(entry) {
  const response = {
    ok: entry.status >= 200 && entry.status < 300,
    status: entry.status,
    statusText: entry.statusText || "",
    url: entry.url || "",
    headers: makeHeaders(entry.headers),
    json: async () => entry.data,
    text: async () => JSON.stringify(entry.data),
  };
  response.clone = () => makeJsonResponse(entry);
  return response;
}

async function readResponse(response, url) {
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch (_) {
      data = null;
    }
  }

  return {
    data,
    status: Number(response && response.status) || 200,
    statusText: (response && response.statusText) || "",
    headers: response && response.headers,
    url: (response && response.url) || url,
  };
}

function installAppNetworkPerformanceEnhancement() {
  if (installed || global.__OKAI_NETWORK_PERFORMANCE_PATCHED__) return;
  if (typeof global.fetch !== "function") return;

  installed = true;
  const originalFetch = global.fetch.bind(global);

  global.fetch = async function okaiPerformanceFetch(input, init) {
    const url = urlText(input);
    const method = methodOf(input, init || {});

    if (url.includes("/strategy/profiles") && method !== "GET") {
      clearByName("profiles");
      const response = await originalFetch(input, init);
      clearByName("profiles");
      return response;
    }

    const rule = ruleFor(url, method);
    if (!rule) return originalFetch(input, init);

    const authorization = await authorizationOf(input, init || {});
    const key = `${rule.name}|${authorization}|${url}`;
    const now = Date.now();
    const existing = cache.get(key);

    if (existing && existing.expiresAt > now) {
      return makeJsonResponse(existing);
    }

    if (inflight.has(key)) {
      const shared = await inflight.get(key);
      return makeJsonResponse(shared);
    }

    const task = (async () => {
      const networkResponse = await originalFetch(input, init);
      const entry = await readResponse(networkResponse, url);
      entry.name = rule.name;
      entry.expiresAt = Date.now() + rule.ttl;

      if (entry.status >= 200 && entry.status < 300) {
        cache.set(key, entry);
      }
      return entry;
    })();

    inflight.set(key, task);

    try {
      const entry = await task;
      return makeJsonResponse(entry);
    } finally {
      inflight.delete(key);
    }
  };

  global.__OKAI_NETWORK_PERFORMANCE_PATCHED__ = true;
}

module.exports = {
  installAppNetworkPerformanceEnhancement,
};
