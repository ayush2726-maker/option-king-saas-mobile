from pathlib import Path

PATH = Path("src/screens/AdvancedAiTabScreen.js")
text = PATH.read_text(encoding="utf-8")

OLD_REQUEST = 'fetchJson("/bot/ai-missed-trades?recent_limit=8")'
SAFE_REQUEST = 'fetchJson("/bot/ai-missed-trades?recent_limit=20")'
if OLD_REQUEST in text:
    text = text.replace(OLD_REQUEST, SAFE_REQUEST, 1)

# Keep every missed-trade row available; the UI now collapses the detail list
# instead of silently truncating it to five rows.
OLD_LIMIT = "missed.recent.slice(0, 5).map((item, index) => {"
NEW_LIMIT = "missed.recent.map((item, index) => {"
if OLD_LIMIT in text:
    text = text.replace(OLD_LIMIT, NEW_LIMIT, 1)
elif NEW_LIMIT not in text:
    raise SystemExit("Missed-trade row renderer was not found")

# Add one local accordion state to the Advanced AI screen. Summary metrics stay
# visible; individual missed-trade cards are hidden until the user opens them.
STATE_OLD = '  const [missed, setMissed] = React.useState(null);'
STATE_NEW = (
    STATE_OLD
    + '\n  const [showMissedTrades, setShowMissedTrades] = React.useState(false);'
    + '\n  const OKAI_MISSED_TRADE_DROPDOWN_V6 = true;'
)
if "OKAI_MISSED_TRADE_DROPDOWN_V6" not in text:
    if text.count(STATE_OLD) != 1:
        raise SystemExit(
            f"Expected one missed state anchor, found {text.count(STATE_OLD)}"
        )
    text = text.replace(STATE_OLD, STATE_NEW, 1)

LIST_ANCHOR = '''      missed?.recent?.length
        ? React.createElement(
            View,
            { style: { marginTop: 13 } },
'''

DROPDOWN_BLOCK = '''      missed?.recent?.length
        ? React.createElement(
            TouchableOpacity,
            {
              accessibilityRole: "button",
              accessibilityState: { expanded: showMissedTrades },
              onPress: () => setShowMissedTrades((value) => !value),
              style: {
                marginTop: 13,
                marginBottom: showMissedTrades ? 2 : 0,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.card2,
                paddingHorizontal: 13,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            },
            React.createElement(
              Text,
              { style: { color: C.text, fontSize: 12, fontWeight: "900" } },
              `${showMissedTrades
                ? (lang === "hi" ? "छूटे ट्रेड छिपाएँ" : "Hide missed trades")
                : (lang === "hi" ? "छूटे ट्रेड देखें" : "View missed trades")} (${missed.recent.length})`
            ),
            React.createElement(
              Text,
              { style: { color: C.gold, fontSize: 18, fontWeight: "900" } },
              showMissedTrades ? "⌃" : "⌄"
            )
          )
        : null,
      showMissedTrades && missed?.recent?.length
        ? React.createElement(
            View,
            { style: { marginTop: 13 } },
'''

if "showMissedTrades && missed?.recent?.length" not in text:
    if text.count(LIST_ANCHOR) != 1:
        raise SystemExit(
            f"Expected one missed list anchor, found {text.count(LIST_ANCHOR)}"
        )
    text = text.replace(LIST_ANCHOR, DROPDOWN_BLOCK, 1)

NO_MISSED_OLD = '''        : React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 12 } },
            copy.noMissed
          ),
      React.createElement(InfoBox, { color: C.blue }, copy.counterfactual)
'''
NO_MISSED_NEW = '''        : missed?.recent?.length
        ? null
        : React.createElement(
            Text,
            { style: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 12 } },
            copy.noMissed
          ),
      React.createElement(InfoBox, { color: C.blue }, copy.counterfactual)
'''
if "        : missed?.recent?.length\n        ? null\n        : React.createElement(" not in text:
    if text.count(NO_MISSED_OLD) != 1:
        raise SystemExit(
            f"Expected one no-missed branch, found {text.count(NO_MISSED_OLD)}"
        )
    text = text.replace(NO_MISSED_OLD, NO_MISSED_NEW, 1)

PATH.write_text(text, encoding="utf-8")

checks = [
    NEW_LIMIT,
    "OKAI_MISSED_TRADE_DROPDOWN_V6",
    "showMissedTrades && missed?.recent?.length",
    "View missed trades",
    "छूटे ट्रेड देखें",
]
missing = [item for item in checks if item not in text]
if OLD_LIMIT in text or OLD_REQUEST in text or missing:
    raise SystemExit(
        "Missed-trade dropdown patch verification failed: " + ", ".join(missing)
    )

print(
    "OKAI-MISSED-TRADE-DROPDOWN-V6 applied: all rows retained; detail list collapsible"
)
