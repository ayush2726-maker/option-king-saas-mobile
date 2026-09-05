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

gate = Path('src/runtime/SubscriptionActivationGate.js')
g = gate.read_text(encoding='utf-8')
anchor = "  React.useEffect(() => {\n    checkStatus();\n    const timer = setInterval(checkStatus, 5000);\n    return () => clearInterval(timer);\n  }, [checkStatus]);\n"
insert = anchor + "\n  React.useEffect(() => {\n    globalThis.__OKAI_OPEN_SUBSCRIPTION__ = () => {\n      dismissedRef.current = false;\n      setMessage('');\n      setVisible(true);\n    };\n    return () => {\n      if (globalThis.__OKAI_OPEN_SUBSCRIPTION__) {\n        delete globalThis.__OKAI_OPEN_SUBSCRIPTION__;\n      }\n    };\n  }, []);\n"
if '__OKAI_OPEN_SUBSCRIPTION__ = () =>' not in g:
    if anchor not in g:
        raise SystemExit('Subscription gate effect anchor not found')
    g = g.replace(anchor, insert, 1)
gate.write_text(g, encoding='utf-8')

print('Trial/subscription action now opens the new in-place payment popup')
