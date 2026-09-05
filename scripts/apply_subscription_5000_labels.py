from pathlib import Path

roots = [Path('App.js'), Path('src/runtime/PaytmPaymentEnhancement.js')]
replacements = {
    '₹1,999': '₹5,000',
    '₹1999': '₹5000',
    'Pay ₹1,999 with Paytm': 'Pay ₹5,000 with Paytm',
    '1999/month': '5000/month',
    '₹1,999/month': '₹5,000/month',
}
changed = []
for path in roots:
    if not path.exists():
        continue
    text = path.read_text(encoding='utf-8')
    original = text
    for old, new in replacements.items():
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append(str(path))

if not changed:
    raise SystemExit('No subscription price labels were updated')
print('updated:', ', '.join(changed))
