from pathlib import Path
import re

path = Path('App.js')
text = path.read_text(encoding='utf-8')

old_subscribe = '''  async function subscribe(plan) {
    setError(""); setLoading(plan);
    try {
      const d = await apiPostAuth("/subscription/create-order",
        { plan }, token);
      if (d.order_id) {
        Alert.alert("Payment", `Order created!\\
ID: ${d.order_id}\\
\\
Razorpay checkout karo.`);
        onSuccess && onSuccess();
      } else setError(d.detail || "Order create failed");
    } catch { setError("Server error"); }
    setLoading(null);
  }
'''

new_subscribe = '''  async function subscribe(plan) {
    setError(""); setLoading(plan);
    try {
      const d = await apiPostAuth("/subscription/paytm/create-link", {}, token);
      const checkoutUrl = d?.checkout_url || d?.redirect_url || d?.payment_url;
      if (checkoutUrl) {
        await Linking.openURL(checkoutUrl);
        Alert.alert(
          "Secure Payment Started",
          "₹5,000 monthly subscription payment link opened. After successful payment, return to Option King AI and refresh your account status."
        );
        onSuccess && onSuccess();
      } else setError(d?.detail || d?.message || "Payment link create failed");
    } catch (e) { setError(e?.message || "Payment service unavailable"); }
    setLoading(null);
  }
'''

if old_subscribe not in text:
    raise SystemExit('PlansTab subscribe block not found')
text = text.replace(old_subscribe, new_subscribe, 1)

start = text.find('  const plans = [', text.find('function PlansTab'))
if start < 0:
    raise SystemExit('Plans array start not found')
end = text.find('  ];', start)
if end < 0:
    raise SystemExit('Plans array end not found')
end += len('  ];')
new_plans = '''  const plans = [
    {
      id: "monthly_5000", icon: "⚡", name: "Monthly Pro",
      price: "₹5,000", period: "/30 days", color: C.accent,
      badge: "FULL ACCESS",
      features: ["Full Option King AI access", "Paper & Live trading tools",
        "All strategies & backtests", "Trade alerts & reports", "30 days validity"],
    },
  ];'''
text = text[:start] + new_plans + text[end:]

text = text.replace('["🏦", "Razorpay", "India ka #1 payment gateway"]', '["🏦", "Paytm / UPI", "Secure payment link"]', 1)
text = text.replace('["↩️", "Easy Refund", "7-din refund policy"]', '["✅", "Server Verified", "Access activates after verified payment"]', 1)

path.write_text(text, encoding='utf-8')
print('Patched App.js subscription UI to ₹5,000 monthly plan')
