from pathlib import Path

path = Path('App.js')
text = path.read_text(encoding='utf-8')

plans_tab = text.find('function PlansTab')
if plans_tab < 0:
    raise SystemExit('PlansTab not found')

subscribe_start = text.find('  async function subscribe(plan) {', plans_tab)
plans_start = text.find('  const plans = [', plans_tab)
if subscribe_start < 0 or plans_start < 0 or plans_start <= subscribe_start:
    raise SystemExit('PlansTab subscribe/plans boundaries not found')

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
text = text[:subscribe_start] + new_subscribe + text[plans_start:]

plans_start = text.find('  const plans = [', plans_tab)
plans_end = text.find('  ];', plans_start)
if plans_end < 0:
    raise SystemExit('Plans array end not found')
plans_end += len('  ];')

new_plans = '''  const plans = [
    {
      id: "monthly_5000", icon: "⚡", name: "Monthly Pro",
      price: "₹5,000", period: "/30 days", color: C.accent,
      badge: "FULL ACCESS",
      features: ["Full Option King AI access", "Paper & Live trading tools",
        "All strategies & backtests", "Trade alerts & reports", "30 days validity"],
    },
  ];'''
text = text[:plans_start] + new_plans + text[plans_end:]

text = text.replace('["🏦", "Razorpay", "India ka #1 payment gateway"]', '["🏦", "Paytm / UPI", "Secure payment link"]', 1)
text = text.replace('["↩️", "Easy Refund", "7-din refund policy"]', '["✅", "Server Verified", "Access activates after verified payment"]', 1)

path.write_text(text, encoding='utf-8')
print('Patched App.js subscription UI to ₹5,000 monthly plan')
