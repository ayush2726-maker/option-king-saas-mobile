from pathlib import Path

PATH = Path('src/runtime/LiveScoreTradeTabEnhancement.js')
MARKER = 'OKAI-LIVE-SCORE-DAILY-HISTORY-V1'
START = 'const TradeHistoryCard = React.memo(function TradeHistoryCard({ history }) {'
END = '\n\n// OKAI-LIVE-SCORE-MULTI-TRADE-V8'

REPLACEMENT = r'''// OKAI-LIVE-SCORE-DAILY-HISTORY-V1
function executionCostValue(trade) {
  const candidates = [
    trade?.total_charges,
    trade?.execution_cost,
    trade?.execution_costs,
    trade?.charges,
    trade?.brokerage_and_charges,
  ];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) return Math.max(0, value);
  }
  return 0;
}

function groupHistoryByDay(history) {
  const map = new Map();
  (history || []).forEach((trade) => {
    const source = tradeTimestamp(trade, true) || tradeTimestamp(trade, false);
    const key = istDayKey(source) || 'UNKNOWN';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(trade);
  });
  return Array.from(map.entries())
    .map(([dateKey, trades]) => {
      trades.sort((a, b) => {
        const ta = parseBackendDate(tradeTimestamp(a, true) || tradeTimestamp(a, false));
        const tb = parseBackendDate(tradeTimestamp(b, true) || tradeTimestamp(b, false));
        return (tb?.getTime() || 0) - (ta?.getTime() || 0);
      });
      const pnl = trades.reduce((sum, trade) => sum + tradePnl(trade), 0);
      const executionCost = trades.reduce((sum, trade) => sum + executionCostValue(trade), 0);
      const wins = trades.filter((trade) => tradePnl(trade) > 0).length;
      const losses = trades.filter((trade) => tradePnl(trade) < 0).length;
      const dateSource = tradeTimestamp(trades[0], true) || tradeTimestamp(trades[0], false);
      return { dateKey, dateSource, trades, pnl, executionCost, wins, losses };
    })
    .sort((a, b) => String(b.dateKey).localeCompare(String(a.dateKey)));
}

const TradeHistoryCard = React.memo(function TradeHistoryCard({ history }) {
  const [expandedDate, setExpandedDate] = React.useState('');
  const days = groupHistoryByDay(history);
  return React.createElement(
    Card,
    { style: { marginTop: 12 } },
    React.createElement(
      Row,
      { style: { justifyContent: 'space-between', marginBottom: 4 } },
      React.createElement(Text, { style: { color: C.text, fontSize: 18, fontWeight: '900' } }, '📜 Daily Trade History'),
      React.createElement(Text, { style: { color: C.muted, fontSize: 10 } }, `${history.length} trades`)
    ),
    React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginBottom: 8 } }, 'Date par tap karke us din ki poori trades dekho'),
    history.length === 0
      ? React.createElement(Text, { style: { color: C.muted } }, 'History load nahi hui. Pull-down refresh karein.')
      : days.map((day) => {
          const expanded = expandedDate === day.dateKey;
          return React.createElement(
            View,
            { key: day.dateKey, style: { backgroundColor: C.card2, borderWidth: 1, borderColor: day.pnl >= 0 ? C.green + '55' : C.red + '55', borderRadius: 12, marginTop: 9, overflow: 'hidden' } },
            React.createElement(
              TouchableOpacity,
              { onPress: () => setExpandedDate(expanded ? '' : day.dateKey), activeOpacity: 0.82, style: { padding: 12 } },
              React.createElement(
                Row,
                { style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
                React.createElement(
                  View,
                  { style: { flex: 1, paddingRight: 8 } },
                  React.createElement(Text, { style: { color: C.text, fontWeight: '900', fontSize: 14 } }, dateLabel(day.dateSource)),
                  React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginTop: 4 } }, `${day.trades.length} Trades • ${day.wins} Win • ${day.losses} Loss`)
                ),
                React.createElement(Text, { style: { color: C.blue, fontSize: 16, fontWeight: '900' } }, expanded ? '▲' : '▼')
              ),
              React.createElement(
                Row,
                { style: { justifyContent: 'space-between', marginTop: 10 } },
                React.createElement(
                  View,
                  null,
                  React.createElement(Text, { style: { color: C.muted, fontSize: 9, fontWeight: '900' } }, 'NET P&L'),
                  React.createElement(Text, { style: { color: day.pnl >= 0 ? C.green : C.red, fontSize: 14, fontWeight: '900', marginTop: 2 } }, money(day.pnl, true))
                ),
                React.createElement(
                  View,
                  { style: { alignItems: 'flex-end' } },
                  React.createElement(Text, { style: { color: C.muted, fontSize: 9, fontWeight: '900' } }, 'EXECUTION COST'),
                  React.createElement(Text, { style: { color: C.gold, fontSize: 14, fontWeight: '900', marginTop: 2 } }, money(day.executionCost))
                )
              )
            ),
            expanded
              ? React.createElement(
                  View,
                  { style: { borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 12, paddingBottom: 6 } },
                  day.trades.map((item, index) => {
                    const itemPnl = tradePnl(item);
                    const itemStatus = String(item?.status || '--').toUpperCase();
                    const entryTime = item?.entry_time || item?.created_at || item?.timestamp || item?.time || item?.date;
                    const exitTime = item?.exit_time || item?.closed_at || item?.updated_at;
                    return React.createElement(
                      View,
                      { key: item?.id || `${item?.symbol || 'trade'}-${index}`, style: { paddingVertical: 10, borderBottomWidth: index === day.trades.length - 1 ? 0 : 1, borderBottomColor: C.border } },
                      React.createElement(
                        Row,
                        { style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
                        React.createElement(
                          View,
                          { style: { flex: 1, paddingRight: 8 } },
                          React.createElement(Text, { style: { color: C.text, fontWeight: '900', fontSize: 12 } }, item?.symbol || 'PAPER TRADE'),
                          React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginTop: 3 } }, `Entry ${timeLabel(entryTime)}${exitTime ? ` • Exit ${timeLabel(exitTime)}` : itemStatus === 'OPEN' ? ' • OPEN' : ''} IST`)
                        ),
                        React.createElement(StatusTag, { label: itemStatus, color: itemStatus === 'OPEN' ? C.green : C.gold })
                      ),
                      React.createElement(Text, { style: { color: C.muted, fontSize: 10, marginTop: 5 } }, `${item?.side || '--'} • Qty ${item?.qty ?? '--'} • Entry ${price(item?.entry_price)} • Exit ${price(item?.exit_price)}`),
                      React.createElement(
                        Row,
                        { style: { justifyContent: 'space-between', marginTop: 5 } },
                        React.createElement(Text, { style: { color: itemPnl >= 0 ? C.green : C.red, fontWeight: '900', fontSize: 11 } }, `${money(itemPnl, true)} NET`),
                        React.createElement(Text, { style: { color: C.gold, fontWeight: '900', fontSize: 11 } }, `Cost ${money(executionCostValue(item))}`)
                      ),
                      item?.reason ? React.createElement(Text, { style: { color: C.muted, fontSize: 9, marginTop: 5, lineHeight: 14 } }, item.reason) : null
                    );
                  })
                )
              : null
          );
        })
  );
});'''


def main():
    text = PATH.read_text(encoding='utf-8')
    if MARKER in text:
        print(f'{MARKER} already installed')
        return
    start = text.find(START)
    end = text.find(END, start)
    if start < 0 or end < 0:
        raise SystemExit('Live Score TradeHistoryCard anchors not found')
    text = text[:start] + REPLACEMENT + text[end:]
    PATH.write_text(text, encoding='utf-8')
    print(f'Installed {MARKER}')


if __name__ == '__main__':
    main()
