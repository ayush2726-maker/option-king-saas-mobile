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

function istClock() {
  const now = new Date(Date.now() + 330 * 60 * 1000);
  return {
    weekday: now.getUTCDay(),
    minute: now.getUTCHours() * 60 + now.getUTCMinutes(),
  };
}

function marketTimeReason() {
  const { weekday, minute } = istClock();
  if (weekday === 0 || weekday === 6) return 'MARKET_CLOSED_WEEKEND';
  if (minute < 9 * 60 + 15) return 'AUTO_ENTRY_BLOCKED_BEFORE_0915_IST';
  if (minute >= 15 * 60 + 30) return 'MARKET_CLOSED_AFTER_1530_IST';
  if (minute >= 14 * 60 + 45) return 'AUTO_ENTRY_CUTOFF_1445_IST';
  return '';
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

  const timeReason = marketTimeReason();
  if (timeReason) add(timeReason);

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
  const timeReason = marketTimeReason();
  const attemptBlocked = !!(
    timeReason || signal?.entry_block_reason || signal?.last_entry_block_reason ||
    signal?.entry_guard?.allowed === false || signal?.entry_attempt?.allowed === false ||
    signal?.entry_permission?.allowed === false
  );
  const finalAllowed = qualified && !attemptBlocked;
  const color = finalAllowed ? C.green : qualified ? C.gold : C.red;
  const reasons = collectReasons(signal, scan);

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
      React.createElement(Text, { style: { color, fontSize: 12, fontWeight: '900' } }, finalAllowed ? 'QUALIFIED' : qualified ? 'EXECUTION BLOCK' : 'BLOCKED')
    ),
    React.createElement(Text, { style: { color: C.blue, fontSize: 12, fontWeight: '900', marginTop: 8 } }, `${scan?.underlying || 'INDEX'} • ${scan?.candidate_signal || scan?.signal || 'WAIT'} • ${score}/${minimum}`),
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
    return previous(
      View,
      null,
      previous(type, { ...(props || {}), __okaiDecisionBypass: true }, ...(children || [])),
      previous(DecisionPanel, { signal: props?.signal || {} })
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
          return old(
            View,
            {
              children: [
                old(type, { ...(props || {}), __okaiDecisionBypass: true }, reactKey),
                old(DecisionPanel, { signal: props?.signal || {} }, 'okai-final-decision'),
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

module.exports = { installFinalDecisionReasonPanelV1 };
