from pathlib import Path

app = Path('App.js')
text = app.read_text(encoding='utf-8')
old = 'setActiveTab={navigateTo} onSubscribe={() => navigateTo("more")}'
new = '''setActiveTab={navigateTo} onSubscribe={() => {
              if (typeof globalThis.__OKAI_OPEN_SUBSCRIPTION__ === "function") {
                globalThis.__OKAI_OPEN_SUBSCRIPTION__();
              } else {
                navigateTo("plans");
              }
            }}'''
if old in text:
    text = text.replace(old, new, 1)
elif '__OKAI_OPEN_SUBSCRIPTION__' not in text:
    raise SystemExit('HomeTab subscription navigation anchor not found')
app.write_text(text, encoding='utf-8')
print('Trial banner now opens in-place subscription popup')
