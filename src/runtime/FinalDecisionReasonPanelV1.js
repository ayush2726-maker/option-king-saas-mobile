const React = require('react');
const { View, Text } = require('react-native');

const C = {
  card: '#13131f', border: '#252540', text: '#e8e8f0', muted: '#606080',
  green: '#00d4a0', red: '#ff4d6d', gold: '#f5c842', blue: '#4d9fff'
};

let installed = false;

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function collectReasons(signal, scan) {
  const reasons = [];
  const add = (value) => {
    if (!value) return;
    const text = String(value).trim();
    if (text && !reasons.includes(text)) reasons.push(text);
  };

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

  const score = num(scan?.score ?? scan?.live_score_breakdown?.score, 0);
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
  return [...scans].sort((a, b) => num(b?.score) - num(a?.score))[0] || null;
}

function DecisionPanel({ signal }) {
  const scan = bestScan(signal || {});
  if (!scan) return null;

  const score = num(scan?.score ?? scan?.live_score_breakdown?.score, 0);
  const minimum = num(scan?.min_score ?? scan?.live_score_breakdown?.min_score ?? signal?.min_score, 82);
  const qualified = !!scan?.trade_allowed;
  const attemptBlocked = !!(
    signal?.entry_block_reason || signal?.last_entry_block_reason ||
    signal?.entry_guard?.allowed === false || signal?.entry_attempt?.allowed === false ||
    signal?.entry_permission?.allowed === false
  );
  const finalAllowed = qualified && !attemptBlocked;
  const color = finalAllowed ? C.green : qualified ? C.gold : C.red;
  const reasons = collectReasons(signal, scan);

  return React.createElement(
    View,
    { style: { marginTop: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: color + '88', padding: 13 } },
    React.createElement(
      View,
      { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
      React.createElement(Text, { style: { color: C.text, fontSize: 15, fontWeight: '900' } }, 'Final Decision Reason'),
      React.createElement(Text, { style: { color, fontSize: 12, fontWeight: '900' } }, finalAllowed ? 'QUALIFIED' : qualified ? 'EXECUTION BLOCK' : 'BLOCKED')
    ),
    React.createElement(Text, { style: { color: C.blue, fontSize: 12, fontWeight: '900', marginTop: 8 } }, `${scan?.underlying || 'INDEX'} • ${scan?.candidate_signal || scan?.signal || 'WAIT'} • ${score}/${minimum}`),
    reasons.map((reason, index) => React.createElement(
      Text,
      { key: `${reason}-${index}`, style: { color: C.gold, fontSize: 11, lineHeight: 17, marginTop: 3 } },
      `• ${reason}`
    )),
    React.createElement(Text, { style: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 8 } },
      qualified
        ? attemptBlocked ? 'Strategy pass hui, lekin order/execution guard ne trade roki.' : 'Strategy aur execution dono pass hain.'
        : 'Strategy qualification complete nahi hui; order attempt nahi hua.'
    )
  );
}

function componentSource(type) {
  try { return Function.prototype.toString.call(type); } catch (_) { return ''; }
}

function isLiveScoreCard(type, props) {
  if (!type || typeof type !== 'function' || props?.__okaiDecisionBypass) return false;
  const name = String(type.displayName || type.name || '');
  if (name === 'LiveStrategyScoreCard') return true;
  const source = componentSource(type);
  return source.includes('Live Strategy Score') && source.includes('scan_results');
}

function wrap(previous, type, props, children, key) {
  if (!isLiveScoreCard(type, props)) return previous(type, props, ...(children || []));
  return React.createElement(
    View,
    null,
    previous(type, { ...(props || {}), __okaiDecisionBypass: true }, ...(children || [])),
    React.createElement(DecisionPanel, { signal: props?.signal || {}, key: 'okai-final-decision' })
  );
}

function installFinalDecisionReasonPanelV1() {
  if (installed || React.__OKAI_FINAL_DECISION_REASON_V1__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function finalDecisionReasonCreateElement(type, props, ...children) {
    if (isLiveScoreCard(type, props)) {
      return previousCreateElement(
        View,
        null,
        previousCreateElement(type, { ...(props || {}), __okaiDecisionBypass: true }, ...children),
        previousCreateElement(DecisionPanel, { signal: props?.signal || {}, key: 'okai-final-decision' })
      );
    }
    return previousCreateElement(type, props, ...children);
  };

  try {
    const jsxRuntime = require('react/jsx-runtime');
    ['jsx', 'jsxs'].forEach((method) => {
      const previous = jsxRuntime[method];
      if (typeof previous !== 'function') return;
      jsxRuntime[method] = function finalDecisionReasonJsx(type, props, key) {
        if (isLiveScoreCard(type, props)) {
          return previous(
            View,
            {
              children: [
                previous(type, { ...(props || {}), __okaiDecisionBypass: true }, key),
                previous(DecisionPanel, { signal: props?.signal || {} }, 'okai-final-decision'),
              ],
            },
            key
          );
        }
        return previous(type, props, key);
      };
    });
  } catch (_) {}

  React.__OKAI_FINAL_DECISION_REASON_V1__ = true;
}

module.exports = { installFinalDecisionReasonPanelV1 };
