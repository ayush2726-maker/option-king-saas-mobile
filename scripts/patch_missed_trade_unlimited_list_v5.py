from pathlib import Path

PATH = Path("src/screens/AdvancedAiTabScreen.js")
OLD = "missed.recent.slice(0, 5).map((item, index) => {"
NEW = "missed.recent.map((item, index) => {"

text = PATH.read_text(encoding="utf-8")
count = text.count(OLD)
if count != 1:
    raise SystemExit(f"Expected exactly one missed-trade 5-item cap, found {count}")

text = text.replace(OLD, NEW, 1)
PATH.write_text(text, encoding="utf-8")

if OLD in text or NEW not in text:
    raise SystemExit("Missed-trade list patch verification failed")

print("OKAI-MISSED-TRADE-ALL-ROWS-V5 applied: frontend 5-row cap removed")
