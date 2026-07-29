const AsyncStorageModule = require("@react-native-async-storage/async-storage");

const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
const SAAS_URL = "https://option-king-saas-production.up.railway.app";

let installed = false;

const ORDER = [
  ["vwap", "VWAP"],
  ["supertrend", "ST"],
  ["ema_trend", "EMA"],
  ["orb", "ORB"],
  ["momentum", "MOM"],
  ["adx", "ADX"],
  ["volume", "VOL"],
  ["mtf", "MTF"],
];

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function urlText(input) {
  if (typeof input === "string") return input;
  if (input && typeof input.url === "string") return input.url;
  return "";
}

function authHeader(input, init) {
  const sources = [init && init.headers, input && input.headers];
  for (const headers of sources) {
    if (!headers) continue;
    if (typeof headers.get === "function") {
      const value = headers.get("Authorization") || headers.get("authorization");
      if (value) return value;
    }
    if (headers.Authorization) return headers.Authorization;
    if (headers.authorization) return headers.authorization;
  }
  return "";
}

async function resolveAuth(input, init) {
  const header = authHeader(input, init);
  if (header) return header;
  try {
    const token = await AsyncStorage.getItem("saas_token");
    return token ? `Bearer ${token}` : "";
  } catch (_) {
    return "";
  }
}

function activeProfile(data) {
  if (data && data.active_profile) return data.active_profile;
  const profiles = Array.isArray(data && data.profiles) ? data.profiles : [];
  return profiles.find((profile) => profile && profile.active) || profiles[0] || null;
}

function weightsOf(profile) {
  const raw = (profile && profile.config && profile.config.weights) || {};
  const weights = {};
  ORDER.forEach(([key]) => {
    weights[key] = Math.round(asNumber(raw[key], 0));
  });
  return weights;
}

function formatWeights(weights) {
  return ORDER.map(([key, label]) => `${label} ${Math.round(asNumber(weights[key], 0))}`).join(" | ");
}

function componentMatch(scan, weights) {
  const components = scan && (
    scan.score_components ||
    (scan.live_score_breakdown && scan.live_score_breakdown.components)
  );
  if (!Array.isArray(components) || components.length === 0) return "UNKNOWN";

  const byKey = {};
  components.forEach((item) => {
    if (!item || !item.key) return;
    byKey[String(item.key)] = Math.round(asNumber(item.max_score, 0));
  });

  for (const [key] of ORDER) {
    if (byKey[key] == null) continue;
    if (Math.round(asNumber(byKey[key], 0)) !== Math.round(asNumber(weights[key], 0))) {
      return "MISMATCH";
    }
  }
  return "OK";
}

function markerRows(profile, scan) {
  const config = (profile && profile.config) || {};
  const weights = weightsOf(profile);
  const name = String((profile && profile.name) || "Active strategy");
  const entry = Math.round(asNumber(config.entry_threshold, 82));
  const adx = asNumber(config.adx_threshold, 0).toFixed(1);
  const volume = asNumber(config.volume_threshold, 0).toFixed(2);
  return [
    `LIVE_USING_STRATEGY: ${name}`,
    `APPLIED_WEIGHTS: ${formatWeights(weights)}`,
    `CONFIG_MATCH: ${componentMatch(scan, weights)} | ENTRY ${entry} | ADX_T ${adx} | VOL_T ${volume}x`,
  ];
}

function cleanWarnings(warnings) {
  return (Array.isArray(warnings) ? warnings : [])
    .map((item) => String(item))
    .filter((item) => item && !item.startsWith("LIVE_USING_STRATEGY:") && !item.startsWith("APPLIED_WEIGHTS:") && !item.startsWith("CONFIG_MATCH:"));
}

function patchSignalData(data, profile) {
  if (!data || !profile || !Array.isArray(data.scan_results)) return data;
  return {
    ...data,
    active_strategy_apply_check: {
      profile_name: profile.name,
      profile_key: profile.profile_key,
      config: profile.config,
    },
    scan_results: data.scan_results.map((scan) => {
      if (!scan || typeof scan !== "object") return scan;
      const markers = markerRows(profile, scan);
      return {
        ...scan,
        live_strategy_name: profile.name,
        live_applied_weights: weightsOf(profile),
        warnings: [...markers, ...cleanWarnings(scan.warnings)].slice(0, 8),
      };
    }),
  };
}

async function loadActiveProfile(originalFetch, authorization) {
  if (!authorization) return null;
  const response = await originalFetch(`${SAAS_URL}/strategy/profiles`, {
    headers: { Authorization: authorization },
  });
  if (!response || !response.ok) return null;
  const data = await response.json();
  return activeProfile(data);
}

function installStrategyApplyCheckEnhancement() {
  if (installed || global.__OKAI_STRATEGY_APPLY_CHECK_PATCHED__) return;
  if (typeof global.fetch !== "function") return;

  installed = true;
  const originalFetch = global.fetch.bind(global);

  global.fetch = async function okaiStrategyApplyCheckFetch(input, init) {
    const response = await originalFetch(input, init);
    const text = urlText(input);

    if (!text.includes("/bot/signal")) return response;

    try {
      const originalJson = response.json.bind(response);
      response.json = async function okaiStrategyAwareJson() {
        const data = await originalJson();
        try {
          const authorization = await resolveAuth(input, init || {});
          const profile = await loadActiveProfile(originalFetch, authorization);
          return patchSignalData(data, profile);
        } catch (_) {
          return data;
        }
      };
    } catch (_) {}

    return response;
  };

  global.__OKAI_STRATEGY_APPLY_CHECK_PATCHED__ = true;
}

module.exports = {
  installStrategyApplyCheckEnhancement,
};
