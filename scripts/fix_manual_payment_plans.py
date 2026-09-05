from pathlib import Path
import re

p = Path('App.js')
s = p.read_text(encoding='utf-8')

pattern = re.compile(r'''  async function startPhonePePayment\(\) \{.*?\n  \}\n\n  async function checkPhonePePayment\(\) \{''', re.S)
replacement = '''  async function startPhonePePayment() {
    setMsg(\"\");
    setPaymentState(\"\");
    setLoading(true);
    try {
      const d = await apiPostAuth(\"/subscription/razorpay/create-link\", { plan_id: \"monthly_5000\" }, token);
      if (!d?.success || !d?.checkout_url) {
        const detail = typeof d?.detail === \"string\" ? d.detail : (d?.message || \"Payment page unavailable\");
        setMsg(detail);
        setLoading(false);
        return;
      }
      setMsg(hi
        ? \"₹5,000 fixed Paytm / UPI QR khul raha hai. Payment ke baad admin 30 days activate karega.\"
        : \"Opening fixed ₹5,000 Paytm / UPI QR. Admin will activate 30 days after payment confirmation.\");
      await Linking.openURL(d.checkout_url);
    } catch (e) {
      setMsg(e?.message || (hi ? \"Payment page open nahi hua\" : \"Could not open payment page\"));
    }
    setLoading(false);
  }

  async function checkPhonePePayment() {'''

s2, n = pattern.subn(replacement, s, count=1)
if n != 1:
    raise SystemExit(f'startPhonePePayment block not found: {n}')
s = s2

replacements = {
    'PhonePe checkout me PhonePe, Google Pay, Paytm, BHIM ya kisi bhi supported UPI app se payment kar sakte hain.': 'Fixed ₹5,000 Paytm / UPI QR se payment karein. Payment ke baad admin 30 days activate karega.',
    '<Btn label=\"Pay ₹5,000 with PhonePe / UPI\" icon=\"📲\" color={C.green}': '<Btn label=\"Pay ₹5,000 with Paytm / UPI QR\" icon=\"📲\" color={C.green}',
    'PhonePe merchant onboarding/credentials complete hote hi live payment active ho jayega.': 'Payment QR ready hai — amount ₹5,000 fixed hai.',
    'Manual renewal every 30 days. Payment success PhonePe server se verify hone ke baad hi plan active hoga.': 'Manual renewal every 30 days. Payment ke baad admin confirmation se plan activate hoga.',
}
for old, new in replacements.items():
    if old not in s:
        print('warning missing:', old)
    s = s.replace(old, new)

p.write_text(s, encoding='utf-8')
print('patched App.js manual Paytm/UPI payment flow')
