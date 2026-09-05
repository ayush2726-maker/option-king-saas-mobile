from pathlib import Path

# Admin dashboard controls
path = Path('src/components/AccountAdminDashboardCard.js')
text = path.read_text(encoding='utf-8')
text = text.replace(
    '  const [activatingId, setActivatingId] = React.useState(null);\n',
    '  const [activatingId, setActivatingId] = React.useState(null);\n  const [deactivatingId, setDeactivatingId] = React.useState(null);\n',
    1,
)

anchor = '  async function deleteUser(user) {\n'
func = '''  function deactivateSubscription(user) {\n    const id = Number(user?.id || 0);\n    const email = String(user?.email || "").trim();\n    const name = String(user?.name || email || `User #${id}`).trim();\n    if (!id) return;\n\n    Alert.alert(\n      "Deactivate Subscription?",\n      `Deactivate ${name}\\n${email}\\n\\nPaid/app access will expire now. Login remains enabled so the customer can renew for ₹5,000 / 30 days.`,\n      [\n        { text: "Cancel", style: "cancel" },\n        {\n          text: "Deactivate",\n          style: "destructive",\n          onPress: async () => {\n            setDeactivatingId(id);\n            setMsg("");\n            try {\n              const d = await apiPost(`/admin/users/${id}/deactivate-subscription`, token, {});\n              setMsg(d?.message || `${name} subscription deactivated`);\n              await load();\n            } catch (e) {\n              setMsg(e.message || "Deactivation failed");\n            } finally {\n              setDeactivatingId(null);\n            }\n          },\n        },\n      ]\n    );\n  }\n\n'''
if 'function deactivateSubscription(user)' not in text:
    if anchor not in text:
        raise SystemExit('deleteUser anchor not found')
    text = text.replace(anchor, func + anchor, 1)

needle = '''        !u.is_admin ? React.createElement(\n          TouchableOpacity,\n          { onPress: () => activateUser(u), disabled: activatingId === Number(u.id), style: { marginTop: 9, borderWidth: 1, borderColor: C.green, backgroundColor: C.green + "18", borderRadius: 8, paddingVertical: 9, alignItems: "center", opacity: activatingId === Number(u.id) ? 0.5 : 1 } },\n          React.createElement(Text, { style: { color: C.green, fontSize: 11, fontWeight: "900" } }, activatingId === Number(u.id) ? "Activating..." : "Activate 30 Days")\n        ) : React.createElement(Text, { style: { color: C.blue, fontSize: 10, fontWeight: "900", marginTop: 8 } }, "ADMIN • Unlimited"),\n'''
replacement = needle + '''        !u.is_admin && String(u.subscription_status || "").toLowerCase() === "active" ? React.createElement(\n          TouchableOpacity,\n          { onPress: () => deactivateSubscription(u), disabled: deactivatingId === Number(u.id), style: { marginTop: 7, borderWidth: 1, borderColor: C.gold, backgroundColor: C.gold + "16", borderRadius: 8, paddingVertical: 9, alignItems: "center", opacity: deactivatingId === Number(u.id) ? 0.5 : 1 } },\n          React.createElement(Text, { style: { color: C.gold, fontSize: 11, fontWeight: "900" } }, deactivatingId === Number(u.id) ? "Deactivating..." : "Deactivate Subscription")\n        ) : null,\n'''
if '"Deactivate Subscription"' not in text:
    if needle not in text:
        raise SystemExit('activate render block not found')
    text = text.replace(needle, replacement, 1)

path.write_text(text, encoding='utf-8')

# Billing / UPI payment flow
app = Path('App.js')
text = app.read_text(encoding='utf-8')
old = '''      const d = await apiPostAuth("/subscription/paytm/create-link", {}, token);\n      const checkoutUrl = d?.checkout_url || d?.redirect_url || d?.payment_url;\n      if (checkoutUrl) {\n        await Linking.openURL(checkoutUrl);\n        Alert.alert(\n          "Secure Payment Started",\n          "₹5,000 monthly subscription payment link opened. After successful payment, return to Option King AI and refresh your account status."\n        );\n        onSuccess && onSuccess();\n      } else setError(d?.detail || d?.message || "Payment link create failed");\n'''
new = '''      const d = await apiPostAuth("/subscription/razorpay/create-link", {}, token);\n      const checkoutUrl = d?.checkout_url;\n      if (checkoutUrl) {\n        await Linking.openURL(checkoutUrl);\n        Alert.alert(\n          "UPI / QR Payment",\n          "₹5,000 for 30 days. Secure checkout opened. Pay using UPI / QR / supported payment method. After the verified payment, your account activates automatically."\n        );\n        onSuccess && onSuccess();\n      } else setError(d?.detail || d?.message || "Payment link create failed");\n'''
if old in text:
    text = text.replace(old, new, 1)
elif '/subscription/razorpay/create-link' not in text:
    raise SystemExit('current billing subscribe block not found')

text = text.replace('label={"Subscribe — " + plan.price} icon="💳"', 'label={"Pay ₹5,000 via UPI / QR"} icon="▣"', 1)
text = text.replace('["🏦", "Paytm / UPI", "Secure payment link"]', '["▣", "UPI / QR", "Secure verified payment checkout"]', 1)
text = text.replace('"Access activates after verified payment"', '"Automatic access after verified ₹5,000 payment"', 1)
app.write_text(text, encoding='utf-8')

print('Admin deactivate control and verified UPI/QR billing UI patched')
