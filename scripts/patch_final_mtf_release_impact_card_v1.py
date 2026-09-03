from pathlib import Path

path = Path('src/screens/AdvancedAiTabScreen.js')
text = path.read_text(encoding='utf-8')

normalize_anchor = '    blockPerformance: Array.isArray(data?.block_performance) ? data.block_performance : [],\n    recent,\n'
normalize_replacement = '    blockPerformance: Array.isArray(data?.block_performance) ? data.block_performance : [],\n    finalMtfReleaseImpact: data?.final_mtf_release_impact || null,\n    recent,\n'
if 'finalMtfReleaseImpact: data?.final_mtf_release_impact || null' not in text:
    if normalize_anchor not in text:
        raise SystemExit('normalizeMissedReport anchor not found')
    text = text.replace(normalize_anchor, normalize_replacement, 1)

card_anchor = '      missed?.blockPerformance?.length\n        ? React.createElement(\n'
card = '''      missed?.finalMtfReleaseImpact
        ? React.createElement(
            View,
            { style: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card2, padding: 11 } },
            React.createElement(
              View,
              { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 } },
              React.createElement(
                Text,
                { style: { color: C.text, fontSize: 12, fontWeight: "900", flex: 1 } },
                lang === "hi" ? "📊 FINAL MTF रिलीज़ असर" : "📊 FINAL MTF Release Impact"
              ),
              React.createElement(
                View,
                { style: { borderRadius: 7, borderWidth: 1, borderColor: C.purple + "66", backgroundColor: C.purple + "14", paddingHorizontal: 7, paddingVertical: 3 } },
                React.createElement(Text, { style: { color: C.purple, fontSize: 8, fontWeight: "900" } }, "LIVE TRACK")
              )
            ),
            React.createElement(
              Text,
              { style: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4, marginBottom: 8 } },
              lang === "hi"
                ? "सिर्फ उन असली ट्रेड्स का नतीजा जो FINAL VWAP ST EMA MTF MISALIGNED ब्लॉक हटने के कारण खुले।"
                : "Actual trades opened specifically because FINAL VWAP ST EMA MTF MISALIGNED was released."
            ),
            React.createElement(
              View,
              { style: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 9 } },
              [
                [lang === "hi" ? "कुल" : "Tracked", missed.finalMtfReleaseImpact?.tracked || 0, C.blue],
                [lang === "hi" ? "लाभ" : "Profit", missed.finalMtfReleaseImpact?.wins || 0, C.green],
                [lang === "hi" ? "नुकसान" : "Loss", missed.finalMtfReleaseImpact?.losses || 0, C.red],
                [lang === "hi" ? "खुले" : "Open", missed.finalMtfReleaseImpact?.open || 0, C.gold],
              ].map((item, index) => React.createElement(
                View,
                { key: `mtf-impact-stat-${index}`, style: { minWidth: "46%", flexGrow: 1, borderRadius: 9, borderWidth: 1, borderColor: C.border, padding: 8 } },
                React.createElement(Text, { style: { color: C.muted, fontSize: 8 } }, item[0]),
                React.createElement(Text, { style: { color: item[2], fontSize: 13, fontWeight: "900", marginTop: 2 } }, String(item[1]))
              ))
            ),
            React.createElement(
              Text,
              { style: { color: Number(missed.finalMtfReleaseImpact?.total_pnl || 0) >= 0 ? C.green : C.red, fontSize: 11, fontWeight: "900", marginBottom: 7 } },
              `${lang === "hi" ? "कुल P&L" : "Total P&L"}: ${Number(missed.finalMtfReleaseImpact?.total_pnl || 0) >= 0 ? "+" : "-"}₹${Math.abs(Number(missed.finalMtfReleaseImpact?.total_pnl || 0)).toFixed(2)} • ${lang === "hi" ? "विन रेट" : "Win rate"} ${Number(missed.finalMtfReleaseImpact?.win_rate_percent || 0).toFixed(1)}%`
            ),
            Array.isArray(missed.finalMtfReleaseImpact?.trades) && missed.finalMtfReleaseImpact.trades.length
              ? missed.finalMtfReleaseImpact.trades.slice(0, 8).map((trade, index) => {
                  const outcome = String(trade?.outcome || "OPEN").toUpperCase();
                  const outcomeColor = outcome === "PROFIT" ? C.green : outcome === "LOSS" ? C.red : outcome === "FLAT" ? C.muted : C.gold;
                  const pnl = Number(trade?.pnl || 0);
                  return React.createElement(
                    View,
                    { key: `mtf-release-trade-${trade?.trade_id || index}`, style: { borderTopWidth: index ? 1 : 0, borderTopColor: C.border, paddingTop: index ? 8 : 0, paddingBottom: 7 } },
                    React.createElement(
                      View,
                      { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 } },
                      React.createElement(Text, { style: { color: C.sub, fontSize: 9.5, fontWeight: "800", flex: 1 } }, String(trade?.symbol || trade?.underlying || "TRADE")),
                      React.createElement(Text, { style: { color: outcomeColor, fontSize: 9, fontWeight: "900" } }, outcome)
                    ),
                    React.createElement(
                      Text,
                      { style: { color: C.muted, fontSize: 8.5, lineHeight: 14, marginTop: 3 } },
                      `${trade?.mode || "PAPER"} • ${trade?.underlying || ""} • Qty ${trade?.qty || 0} • Entry ₹${Number(trade?.entry_price || 0).toFixed(2)}${trade?.exit_price != null ? ` • Exit ₹${Number(trade.exit_price || 0).toFixed(2)}` : ""} • P&L ${pnl >= 0 ? "+" : "-"}₹${Math.abs(pnl).toFixed(2)}`
                    )
                  );
                })
              : React.createElement(
                  Text,
                  { style: { color: C.muted, fontSize: 8.5, lineHeight: 14 } },
                  lang === "hi" ? "अभी इस रिलीज़ से कोई ट्रेड ट्रैक नहीं हुआ।" : "No trade has been tracked from this release yet."
                )
          )
        : null,
'''
if '📊 FINAL MTF Release Impact' not in text:
    if card_anchor not in text:
        raise SystemExit('Block Performance render anchor not found')
    text = text.replace(card_anchor, card + card_anchor, 1)

path.write_text(text, encoding='utf-8')
print('FINAL MTF Release Impact card patch applied')
