const React = require('react');
const { View, Text } = require('react-native');
const {
  marketTimeReason,
  marketTimeLabel,
  executionBlockReason,
} = require('./EntryWindowStatus');
const { scoreMaximum } = require('./ScoreDisplayScale');

const C = {
  card: '#13131f', border: '#252540', text: '#e8e8f0', muted: '#606080',
  green: '#00d4a0', red: '#ff4d6d', gold: '#f5c842', blue: '#4d9fff'
};

let installed = false;

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function decisionScore(scan) {
  return num(
    scan?.decision_score ??
    scan?.signal_data?.decision_score ??
    scan?.live_score_breakdown?.decision_score ??
    scan?.signal_data?.live_score_breakdown?.decision_score ??
    scan?.score ??
    scan?.live_score_breakdown?.score,
    0
  );
}

function normalizeComponent(item) {
  if (!item || typeof item !== 'object') return item;
  const fixed = { ...item };
  if (item.decision_score != null) {
    const canonical = num(item.decision_score, num(item.score, 0));
    fixed.visual_score = item.visual_score ?? item.display_score ?? item.score;
    fixed.score = canonical;
    fixed.display_score = canonical;
  }
  return fixed;
}

function normalizeBreakdown(payload, decision) {
  if (!payload || typeof payload !== 'object') return payload;
  const fixed = { ...payload };
  fixed.score = decision;
  fixed.decision_score = decision;
  fixed.display_score = decision;
  fixed.visual_strength_score = decision;
  if (Array.isArray(payload.components)) {
    fixed.components = payload.components.map(normalizeComponent);
  }
  return fixed;
}

function normalizeScanForDisplay(scan) {
  if (!scan || typeof scan !== 'object') return scan;
  const decision = decisionScore(scan);
  const fixed = {
    ...scan,
    score: decision,
    decision_score: decision,
    display_score: decision,
    visual_strength_score: decision,
  };

  if (Array.isArray(scan.score_components)) {
    fixed.score_components = scan.score_components.map(normalizeComponent);
  }

  if (scan.live_score_breakdown && typeof scan.live_score_breakdown === 'object') {
    fixed.live_score_breakdown = normalizeBreakdown(scan.live_score_breakdown, decision);
  }

  if (scan.signal_data && typeof scan.signal_data === 'object') {
    const signalData = {
      ...scan.signal_data,
      score: decision,
      decision_score: decision,
      display_score: decision,
      visual_strength_score: decision,
    };
    if (Array.isArray(signalData.score_components)) {
      signalData.score_components = signalData.score_components.map(normalizeComponent);
    }
    if (signalData.live_score_breakdown && typeof signalData.live_score_breakdown === 'object') {
      signalData.live_score_breakdown = normalizeBreakdown(signalData.live_score_breakdown, decision);
    }
    fixed.signal_data = signalData;
  }
  return fixed;
}

function normalizeSignalForDisplay(signal) {
  if (!signal || typeof signal !== 'object') return signal || {};
  const fixed = { ...signal };
  if (Array.isArray(signal.scan_results)) {
    fixed.scan_results = signal.scan_results.map(normalizeScanForDisplay);
  }
  if (signal.selected_for_entry && typeof signal.selected_for_entry === 'object') {
    fixed.selected_for_entry = normalizeScanForDisplay(signal.selected_for_entry);
  }
  return fixed;
}

function collectReasons(signal, scan) {
  const reasons = [];
  const add = (value) => {
    if (!value) return;
    const text = String(value).trim();
    if (text && !reasons.includes(text)) reasons.push(text);
  };

  // Put the actual market-time/execution reason first so it can never be
  // hidden by the eight-row diagnostic limit.
  add(executionBlockReason(signal, scan));

  [
    ...(scan?.safety_gate_reasons || []),
    ...(scan?.fresh_entry_block_reasons || []),
    ...(scan?.warnings || []),
  ].forEach(add);

  add(signal?.entry_block_reason);
  add(signal?.last_entry_block_reason);
  add(signal?.entry_guard?.reason);
  add(signal?.entry_attempt?.reason);
  add(signal?.entry_permission?.allowed === false ? signal?.entry_permission?.reason : null);

  const score = decisionScore(scan);
  const minimum = num(scan?.min_score ?? scan?.live_score_breakdown?.min_score ?? signal?.min_score, 82);
  if (score < minimum) add(`SCORE_BELOW_${minimum}`);
  if (!scan?.trade_allowed && reasons.length === 0) add('STRATEGY_NOT_QUALIFIED');
  return reasons.slice(0, 8);
}

function bestScan(signal) {
  const scans = Array.isArray(signal?.scan_results) ? signal.scan_results : [];
  const selected = signal?.selected_for_entry;
  if (selected?.underlying) {
    const match = scans.find((item) => item?.underlying === selected.underlying);
    if (match) return match;
  }
  return [...scans].sort((a, b) => decisionScore(b) - decisionScore(a))[0] || null;
}

function DecisionPanel({ signal }) {
  const cleanSignal = normalizeSignalForDisplay(signal || {});
  const scan = bestScan(cleanSignal);
  if (!scan) return null;

  const score = decisionScore(scan);
  const minimum = num(scan?.min_score ?? scan?.live_score_breakdown?.min_score ?? cleanSignal?.min_score, 82);
  const maximum = scoreMaximum(scan);
  const qualified = !!(scan?.strategy_qualified ?? scan?.trade_allowed);
  const timeReason = executionBlockReason(cleanSignal, scan);
  const attemptBlocked = !!(
    timeReason || scan?.execution_allowed === false ||
    cleanSignal?.entry_block_reason || cleanSignal?.last_entry_block_reason ||
    cleanSignal?.entry_guard?.allowed === false || cleanSignal?.entry_attempt?.allowed === false ||
    cleanSignal?.entry_permission?.allowed === false
  );
  const finalAllowed = qualified && !attemptBlocked;
  const color = finalAllowed ? C.green : qualified ? C.gold : C.red;
  const reasons = collectReasons(cleanSignal, scan);
  const finalLabel = finalAllowed
    ? 'QUALIFIED'
    : timeReason
    ? marketTimeLabel(timeReason)
    : qualified
    ? 'EXECUTION BLOCK'
    : 'BLOCKED';

  return React.createElement(
    View,
    {
      style: {
        marginTop: 10, backgroundColor: C.card, borderRadius: 14,
        borderWidth: 1, borderColor: color + '88', padding: 13,
      },
    },
    React.createElement(
      View,
      { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
      React.createElement(Text, { style: { color: C.text, fontSize: 15, fontWeight: '900' } }, 'Final Decision Reason'),
      React.createElement(Text, { style: { color, fontSize: 12, fontWeight: '900' } }, finalLabel)
    ),
    React.createElement(Text, { style: { color: C.blue, fontSize: 12, fontWeight: '900', marginTop: 8 } }, `${scan?.underlying || 'INDEX'} • ${scan?.candidate_signal || scan?.signal || 'WAIT'} • ${score}/${maximum} • ENTRY ${minimum}`),
    reasons.map((reason, index) => React.createElement(
      Text,
      { key: `${reason}-${index}`, style: { color: reason.includes('OK') ? C.green : C.gold, fontSize: 11, lineHeight: 17, marginTop: 3 } },
      `• ${reason}`
    )),
    React.createElement(Text, { style: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 8 } },
      qualified
        ? attemptBlocked ? 'Strategy pass hui, lekin market-time/order execution guard ne trade roki.' : 'Strategy aur execution dono pass hain.'
        : 'Strategy qualification complete nahi hui; order attempt nahi hua.'
    )
  );
}

function isLiveScoreCard(type) {
  const name = String(type?.displayName || type?.name || '');
  if (name === 'LiveStrategyScoreCard') return true;
  try {
    const source = Function.prototype.toString.call(type);
    return source.includes('Live Strategy Score') && source.includes('scan_results');
  } catch (_) {
    return false;
  }
}

function wrap(previous, type, props, key, children) {
  if (isLiveScoreCard(type) && !props?.__okaiDecisionBypass) {
    const normalizedSignal = normalizeSignalForDisplay(props?.signal || {});
    return previous(
      View,
      null,
      previous(type, { ...(props || {}), signal: normalizedSignal, __okaiDecisionBypass: true }, ...(children || [])),
      previous(DecisionPanel, { signal: normalizedSignal })
    );
  }
  return previous(type, props, ...(children || []));
}

function installFinalDecisionReasonPanelV1() {
  if (installed || React.__OKAI_FINAL_DECISION_REASON_V1__) return;
  installed = true;
  const previous = React.createElement.bind(React);
  React.createElement = function finalDecisionReasonCreateElement(type, props, ...children) {
    return wrap(previous, type, props, null, children);
  };
  try {
    const jsxRuntime = require('react/jsx-runtime');
    ['jsx', 'jsxs'].forEach((key) => {
      const old = jsxRuntime[key];
      if (typeof old !== 'function') return;
      jsxRuntime[key] = function finalDecisionReasonJsx(type, props, reactKey) {
        if (isLiveScoreCard(type) && !props?.__okaiDecisionBypass) {
          const normalizedSignal = normalizeSignalForDisplay(props?.signal || {});
          return old(
            View,
            {
              children: [
                old(type, { ...(props || {}), signal: normalizedSignal, __okaiDecisionBypass: true }, reactKey),
                old(DecisionPanel, { signal: normalizedSignal }, 'okai-final-decision'),
              ],
            },
            reactKey
          );
        }
        return old(type, props, reactKey);
      };
    });
  } catch (_) {}
  React.__OKAI_FINAL_DECISION_REASON_V1__ = true;
}

module.exports = {
  installFinalDecisionReasonPanelV1,
  normalizeSignalForDisplay,
  decisionScore,
  marketTimeReason,
  marketTimeLabel,
  executionBlockReason,
};
