from pathlib import Path

path = Path('src/screens/AdvancedAiTabScreen.js')
text = path.read_text()

needle = '    exhaustionAnalysis: data?.exhaustion_rule_analysis || null,\n    recent,\n'
replacement = '    exhaustionAnalysis: data?.exhaustion_rule_analysis || null,\n    blockPerformance: Array.isArray(data?.block_performance) ? data.block_performance : [],\n    recent,\n'
if needle not in text:
    if 'blockPerformance: Array.isArray(data?.block_performance)' not in text:
        raise SystemExit('normalizeMissedReport anchor not found')
else:
    text = text.replace(needle, replacement, 1)

anchor = '      React.createElement(InfoBox, { color: exhaustionKeep ? C.green : C.gold }, exhaustionText),\n'
block = '''      React.createElement(InfoBox, { color: exhaustionKeep ? C.green : C.gold }, exhaustionText),
      missed?.blockPerformance?.length
        ? React.createElement(
            View,
            { style: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card2, padding: 11 } },
            React.createElement(
              Text,
              { style: { color: C.text, fontSize: 12, fontWeight: "900", marginBottom: 3 } },
              lang === "hi" ? "🛡️ ब्लॉक प्रदर्शन" : "🛡️ Block Performance"
            ),
            React.createElement(
              Text,
              { style: { color: C.muted, fontSize: 9, lineHeight: 14, marginBottom: 8 } },
              lang === "hi"
                ? "15-मिनट के वास्तविक ऑप्शन परिणाम से हर ब्लॉक का असर।"
                : "Each block measured from exact 15-minute option outcomes."
            ),
            missed.blockPerformance.slice(0, 12).map((row, index) => {
              const recommendation = String(row?.recommendation || "COLLECT").toUpperCase();
              const recommendationColor = recommendation === "KEEP"
                ? C.green
                : recommendation === "REMOVE"
                  ? C.red
                  : recommendation === "RELAX"
                    ? C.gold
                    : C.purple;
              const net = Number(row?.net_if_taken || 0);
              return React.createElement(
                View,
                {
                  key: `${row?.reason || "BLOCK"}-${index}`,
                  style: { borderTopWidth: index ? 1 : 0, borderTopColor: C.border, paddingTop: index ? 9 : 0, paddingBottom: 8 },
                },
                React.createElement(
                  View,
                  { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 } },
                  React.createElement(
                    Text,
                    { style: { color: C.sub, fontSize: 9.5, fontWeight: "800", flex: 1, lineHeight: 14 } },
                    humanize(row?.reason)
                  ),
                  React.createElement(
                    View,
                    { style: { borderRadius: 7, borderWidth: 1, borderColor: `${recommendationColor}66`, backgroundColor: `${recommendationColor}14`, paddingHorizontal: 7, paddingVertical: 3 } },
                    React.createElement(Text, { style: { color: recommendationColor, fontSize: 8, fontWeight: "900" } }, recommendation)
                  )
                ),
                React.createElement(
                  Text,
                  { style: { color: C.muted, fontSize: 8.5, lineHeight: 14, marginTop: 4 } },
                  `${lang === "hi" ? "कुल" : "Total"} ${row?.evaluated || 0} • ${lang === "hi" ? "लाभ मिस" : "Profit missed"} ${row?.profit_missed || 0} • ${lang === "hi" ? "नुकसान बचा" : "Loss saved"} ${row?.loss_saved || 0} • ${lang === "hi" ? "लेते तो नेट" : "Net if taken"} ${net >= 0 ? "+" : "-"}₹${Math.abs(net).toFixed(2)}/lot`
                )
              );
            })
          )
        : null,
'''

if '🛡️ Block Performance' not in text:
    if anchor not in text:
        raise SystemExit('missed-trade InfoBox anchor not found')
    text = text.replace(anchor, block, 1)

path.write_text(text)
print('Block Performance card patch applied')
