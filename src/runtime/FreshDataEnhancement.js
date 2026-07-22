const SAAS_HOST = "option-king-saas-production.up.railway.app";

let installed = false;

function requestUrl(input) {
  if (typeof input === "string") return input;
  if (input && typeof input.url === "string") return input.url;
  return "";
}

function isGetRequest(input, init) {
  const method = String(
    init?.method || input?.method || "GET"
  ).toUpperCase();
  return method === "GET";
}

function isSaasRequest(url) {
  return String(url || "").includes(SAAS_HOST);
}

function addCacheBuster(url) {
  const separator = String(url).includes("?") ? "&" : "?";
  return `${url}${separator}_okai_ts=${Date.now()}`;
}

function mergeHeaders(input, init) {
  const base = {};

  try {
    const source = init?.headers || input?.headers || {};
    if (typeof Headers !== "undefined" && source instanceof Headers) {
      source.forEach((value, key) => {
        base[key] = value;
      });
    } else if (Array.isArray(source)) {
      source.forEach(([key, value]) => {
        base[key] = value;
      });
    } else {
      Object.assign(base, source || {});
    }
  } catch (_) {}

  base["Cache-Control"] = "no-cache, no-store, max-age=0";
  base.Pragma = "no-cache";
  base.Expires = "0";
  return base;
}

function installFreshDataEnhancement() {
  if (
    installed ||
    typeof global.fetch !== "function" ||
    global.__OKAI_FRESH_DATA_FETCH_PATCHED__
  ) {
    return;
  }

  installed = true;
  const originalFetch = global.fetch.bind(global);

  global.fetch = function okaiFreshFetch(input, init) {
    const url = requestUrl(input);

    if (!url || !isSaasRequest(url) || !isGetRequest(input, init)) {
      return originalFetch(input, init);
    }

    const freshUrl = addCacheBuster(url);
    const freshInit = {
      ...(init || {}),
      method: "GET",
      cache: "no-store",
      headers: mergeHeaders(input, init),
    };

    return originalFetch(freshUrl, freshInit);
  };

  global.__OKAI_FRESH_DATA_FETCH_PATCHED__ = true;
}

module.exports = {
  installFreshDataEnhancement,
};
