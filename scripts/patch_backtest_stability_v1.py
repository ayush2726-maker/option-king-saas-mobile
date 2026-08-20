from pathlib import Path

path = Path('App.js')
text = path.read_text(encoding='utf-8')
original = text

# Do not restart the whole app automatically after an OTA download. A reload in
# the middle of a long backtest can look like a logout and can discard UI state.
old = '''          setMsg("Update applied. Restarting app...");
          setTimeout(() => Updates.reloadAsync(), 800);
          return;'''
new = '''          setMsg("Update downloaded • restart app when convenient");
          setTimeout(() => {
            if (mountedRef.current) setVisible(false);
          }, 2500);
          return;'''
if old in text:
    text = text.replace(old, new, 1)

# Keep large monthly results from exhausting React Native memory. The complete
# totals remain in summary/day-wise cards; only the detailed trade rows are capped.
old_map = '{result.trades.map((trade, index) => ('
new_map = '{result.trades.slice(0, 100).map((trade, index) => ('
if old_map in text:
    text = text.replace(old_map, new_map, 1)

# Make it explicit when the visible detailed list is capped.
marker = '''          {result.trades.slice(0, 100).map((trade, index) => ('''
notice = '''          {result.trades.length > 100 && (
            <Text style={{ color: C.gold, fontSize: 10, marginBottom: 8 }}>
              Showing first 100 detailed trades. Summary and day-wise totals include all trades.
            </Text>
          )}

          {result.trades.slice(0, 100).map((trade, index) => ('''
if marker in text and notice not in text:
    text = text.replace(marker, notice, 1)

if text == original:
    raise SystemExit('No changes applied; App.js patterns not found or already patched')

path.write_text(text, encoding='utf-8')
print('Backtest stability patch applied')
