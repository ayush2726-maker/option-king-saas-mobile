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

function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, asNumber(value, low)));
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
    weights[key] = Math.max(0, Math.round(asNumber(raw[key], 0)));
  });
  return weights;
}

function enabledOf(profile) {
  const raw = (profile && profile.config && profile.config.enabled) || {};
  const enabled = {};
  ORDER.forEach(([key]) => {
    enabled[key] = raw[key] !== false;
  });
  return enabled;
}

function formatWeights(weights) {
  return ORDER.map(([key, label]) => `${label} ${Math.round(asNumber(weights[key], 0))}`).join(" | ");
}

function componentList(scan) {
  const direct = scan && scan.score_components;
  if (Array.isArray(direct) && direct.length) return direct;
  const nested = scan && scan.live_score_breakdown && scan.live_score_breakdown.components;
  return Array.isArray(nested) ? nested : [];
}

function scaledScore(value, oldMax, newMax) {
  const target = Math.max(0, Math.round(asNumber(newMax, 0)));
  if (target <= 0) return 0;

  const oldValue = Math.max(0, asNumber(value, 0));
  const sourceMax = Math.max(0, asNumber(oldMax, 0));
  if (oldValue <= 0) return 0;
  if (sourceMax <= 0) return target;

  const scaled = Math.round(target * clamp(oldValue / sourceMax));
  return Math.max(1, Math.min(target, scaled));
}

function componentDetail(item, scan, config) {
  const key = String((item && item.key) || "");
  const current = String((item && item.detail) || "");

  if (key === "adx") {
    const adx = asNumber(scan && scan.adx, NaN);
    const threshold = asNumber(config.adx_threshold, 25);
    if (Number.isFinite(adx)) return `ADX ${adx.toFixed(1)} / threshold ${threshold.toFixed(1)}`;
  }

  if (key === "volume") {
    if (current.toLowerCase().includes("unavailable")) {
      return "Volume unavailable: 50% neutral display score";
    }
    const ratio = asNumber(scan && scan.volume_ratio, NaN);
    const threshold = asNumber(config.volume_threshold, 1.2);
    if (Number.isFinite(ratio)) {
      return `Volume ${ratio.toFixed(2)}x / threshold ${threshold.toFixed(2)}x`;
    }
  }

  return current;
}

function applyActiveProfileToScan(scan, profile) {
  if (!scan || typeof scan !== "object" || !profile) return scan;

  const config = (profile && profile.config) || {};
  const weights = weightsOf(profile);
  const enabled = enabledOf(profile);
  const source = componentList(scan);

  if (!source.length) {
    return {
      ...scan,
      profile_weights: weights,
      profile_enabled: enabled,
      adx_threshold: asNumber(config.adx_threshold, scan.adx_threshold),
      volume_threshold: asNumber(config.volume_threshold, scan.volume_threshold),
      min_score: Math.round(asNumber(config.entry_threshold, scan.min_score || 82)),
    };
  }

  const components = source.map((item) => {
    if (!item || typeof item !== "object") return item;
    const key = String(item.key || "");
    if (!Object.prototype.hasOwnProperty.call(weights, key)) return item;

    const isEnabled = enabled[key] !== false;
    const newMax = isEnabled ? weights[key] : 0;
    const score = scaledScore(item.score, item.max_score, newMax);
    const decisionScore = scaledScore(
      item.decision_score != null ? item.decision_score : item.passed ? item.max_score : 0,
      item.max_score,
      newMax
    );

    return {
      ...item,
      enabled: isEnabled,
      max_score: newMax,
      score,
      decision_score: decisionScore,
      partial: isEnabled && score > 0 && score < newMax,
      detail: componentDetail(item, scan, config),
    };
  });

  const displayScore = components.reduce((sum, item) => sum + asNumber(item && item.score, 0), 0);
  const decisionComponentTotal = components.reduce(
    (sum, item) => sum + asNumber(item && item.decision_score, 0),
    0
  );
  const enabledWeightTotal = ORDER.reduce(
    (sum, [key]) => sum + (enabled[key] === false ? 0 : asNumber(weights[key], 0)),
    0
  );
  const minScore = Math.round(asNumber(config.entry_threshold, scan.min_score || 82));
  const oldPayload =
    scan.live_score_breakdown && typeof scan.live_score_breakdown === "object"
      ? scan.live_score_breakdown
      : {};
  const decisionScore = asNumber(
    scan.decision_score != null
      ? scan.decision_score
      : scan.signal_data?.decision_score != null
      ? scan.signal_data.decision_score
      : oldPayload.decision_score,
    scan.score
  );

  const payload = {
    ...oldPayload,
    // score is the value that the entry engine actually uses. Keep the
    // proportional component total separate so AUTO Portfolio, Live Score and
    // every other screen cannot accidentally show different numbers.
    score: decisionScore,
    display_score: displayScore,
    visual_strength_score: displayScore,
    decision_score: decisionScore,
    component_total: displayScore,
    decision_component_total: decisionComponentTotal,
    enabled_weight_total: enabledWeightTotal,
    min_score: minScore,
    components,
    profile_weights: weights,
    profile_enabled: enabled,
    score_mode: "DECISION_SCORE_PRIMARY_VISUAL_STRENGTH_SECONDARY",
  };

  const signalData =
    scan.signal_data && typeof scan.signal_data === "object"
      ? {
          ...scan.signal_data,
          score: decisionScore,
          decision_score: decisionScore,
          display_score: displayScore,
          visual_strength_score: displayScore,
          min_score: minScore,
          score_components: components,
          live_score_breakdown: payload,
        }
      : scan.signal_data;

  return {
    ...scan,
    score: decisionScore,
    decision_score: decisionScore,
    display_score: displayScore,
    visual_strength_score: displayScore,
    min_score: minScore,
    score_components: components,
    live_score_breakdown: payload,
    signal_data: signalData,
    component_total: displayScore,
    decision_component_total: decisionComponentTotal,
    enabled_weight_total: enabledWeightTotal,
    profile_weights: weights,
    profile_enabled: enabled,
    adx_threshold: asNumber(config.adx_threshold, scan.adx_threshold),
    volume_threshold: asNumber(config.volume_threshold, scan.volume_threshold),
    strategy_profile_key: profile.profile_key,
    strategy_profile_name: profile.name,
  };
}

function componentMatch(scan, weights) {
  const components = componentList(scan);
  if (!components.length) return "UNKNOWN";

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
    .filter(
      (item) =>
        item &&
        !item.startsWith("LIVE_USING_STRATEGY:") &&
        !item.startsWith("APPLIED_WEIGHTS:") &&
        !item.startsWith("CONFIG_MATCH:")
    );
}

function patchSignalData(data, profile) {
  if (!data || !profile || !Array.isArray(data.scan_results)) return data;

  const scanResults = data.scan_results.map((scan) => {
    if (!scan || typeof scan !== "object") return scan;
    const synced = applyActiveProfileToScan(scan, profile);
    const markers = markerRows(profile, synced);
    return {
      ...synced,
      live_strategy_name: profile.name,
      live_applied_weights: weightsOf(profile),
      warnings: [...markers, ...cleanWarnings(synced.warnings)].slice(0, 8),
    };
  });

  const selected = data.selected_for_entry && data.selected_for_entry.underlying
    ? scanResults.find((scan) => scan && scan.underlying === data.selected_for_entry.underlying)
    : null;
  const best = selected || [...scanResults].sort(
    (a, b) => asNumber(b && b.score, 0) - asNumber(a && a.score, 0)
  )[0];

  return {
    ...data,
    score: best ? asNumber(best.score, data.score) : data.score,
    decision_score: best
      ? asNumber(best.decision_score, best.score)
      : data.decision_score,
    display_score: best ? asNumber(best.display_score, best.score) : data.display_score,
    visual_strength_score: best
      ? asNumber(best.visual_strength_score, best.display_score)
      : data.visual_strength_score,
    score_components: best ? best.score_components : data.score_components,
    live_score_breakdown: best ? best.live_score_breakdown : data.live_score_breakdown,
    active_strategy_apply_check: {
      profile_name: profile.name,
      profile_key: profile.profile_key,
      config: profile.config,
      display_sync: "ACTIVE_PROFILE_CLIENT_DISPLAY_SYNC",
    },
    scan_results: scanResults,
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
  __test: {
    applyActiveProfileToScan,
    patchSignalData,
  },
};
