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
      if (item && item.preserve_backend_scale === true) return current;
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
    // Availability-normalized rows intentionally split the unavailable
    // 15-point volume slot into 7 neutral points plus an 8-point
    // normalization allowance. Keep that backend-authored scale intact;
    // rescaling volume 7/7 back to 15/15 would make the visible rows disagree
    // with the entry engine again.
    const preserveBackendScale = item.preserve_backend_scale === true;
    const newMax = isEnabled
      ? preserveBackendScale
        ? Math.max(0, Math.round(asNumber(item.max_score, 0)))
        : weights[key]
      : 0;
    const decisionScore = scaledScore(
      item.decision_score != null ? item.decision_score : item.passed ? item.max_score : 0,
      item.max_score,
      newMax
    );
    const diagnosticVisualScore = scaledScore(
      item.visual_score != null
        ? item.visual_score
        : item.display_score != null
        ? item.display_score
        : item.score,
      item.max_score,
      newMax
    );

    return {
      ...item,
      enabled: isEnabled,
      max_score: newMax,
      score: decisionScore,
      display_score: decisionScore,
      visual_score: diagnosticVisualScore,
      decision_score: decisionScore,
      partial: false,
      visual_partial:
        isEnabled && diagnosticVisualScore > 0 && diagnosticVisualScore < newMax,
      detail: componentDetail(item, scan, config),
    };
  });

  const displayScore = components.reduce((sum, item) => sum + asNumber(item && item.score, 0), 0);
  const diagnosticVisualScore = components.reduce(
    (sum, item) => sum + asNumber(item && item.visual_score, 0),
    0
  );
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
    // Every public score uses the entry-engine value. Proportional strength is
    // retained only in the explicitly diagnostic field below.
    score: decisionScore,
    display_score: displayScore,
    visual_strength_score: decisionScore,
    diagnostic_visual_strength_score: diagnosticVisualScore,
    decision_score: decisionScore,
    component_total: displayScore,
    decision_component_total: decisionComponentTotal,
    enabled_weight_total: enabledWeightTotal,
    min_score: minScore,
    components,
    profile_weights: weights,
    profile_enabled: enabled,
    score_mode: "CANONICAL_DECISION_SCORE_PUBLIC_V2",
  };

  const signalData =
    scan.signal_data && typeof scan.signal_data === "object"
      ? {
          ...scan.signal_data,
          score: decisionScore,
          decision_score: decisionScore,
          display_score: displayScore,
          visual_strength_score: decisionScore,
          diagnostic_visual_strength_score: diagnosticVisualScore,
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
    visual_strength_score: decisionScore,
    diagnostic_visual_strength_score: diagnosticVisualScore,
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
    return {
      ...synced,
      live_strategy_name: profile.name,
      live_applied_weights: weightsOf(profile),
      // Keep apply-check diagnostics in structured fields. Technical marker
      // strings do not belong in the customer-facing score breakdown.
      warnings: cleanWarnings(synced.warnings).slice(0, 8),
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
    diagnostic_visual_strength_score: best
      ? asNumber(
          best.diagnostic_visual_strength_score,
          best.visual_strength_score
        )
      : data.diagnostic_visual_strength_score,
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
