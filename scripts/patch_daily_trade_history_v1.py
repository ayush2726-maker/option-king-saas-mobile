from pathlib import Path

APP = Path("App.js")


def replace_once(text, old, new, label):
    if old not in text:
        print(f"{label}: already changed or anchor missing")
        return text
    return text.replace(old, new, 1)


def main():
    text = APP.read_text(encoding="utf-8")

    if "OKAI-DAILY-TRADE-HISTORY-V1" not in text:
        raise SystemExit("Daily trade history marker missing from App.js")

    start = text.find("  async function startPhonePePayment() {")
    end = text.find("  async function checkPhonePePayment() {", start)
    if start < 0 or end < 0:
        raise SystemExit("Plans payment function anchors not found")

    new_fn = '''  async function startPhonePePayment() {\n    setMsg(\"\");\n    setPaymentState(\"\");\n    setLoading(true);\n    try {\n      const d = await apiPostAuth(\"/subscription/razorpay/create-link\", { plan_id: \"monthly_5000\" }, token);\n      if (!d?.success || !d?.checkout_url) {\n        const detail = typeof d?.detail === \"string\"\n          ? d.detail\n          : \"Paytm / UPI QR payment page abhi available nahi hai\";\n        setMsg(detail);\n        setLoading(false);\n        return;\n      }\n      setPaymentOrderId(\"\");\n      try { await AsyncStorage.removeItem(\"okai_phonepe_order_id\"); } catch (_) {}\n      setMsg(hi\n        ? \"₹5,000 fixed Paytm / UPI QR khul raha hai. Payment ke baad admin 30 days activate karega.\"\n        : \"Opening the fixed ₹5,000 Paytm / UPI QR. Admin will activate 30 days after payment confirmation.\");\n      await Linking.openURL(d.checkout_url);\n    } catch (e) {\n      setMsg(hi ? \"Paytm / UPI QR open nahi hua\" : \"Could not open Paytm / UPI QR\");\n    }\n    setLoading(false);\n  }\n\n'''
    text = text[:start] + new_fn + text[end:]

    text = replace_once(
        text,
        'PhonePe checkout me PhonePe, Google Pay, Paytm, BHIM ya kisi bhi supported UPI app se payment kar sakte hain.',
        '₹5,000 fixed Paytm / UPI QR se payment karein. Amount customer ko enter ya change nahi karna hai.',
        'payment info copy',
    )
    text = replace_once(
        text,
        '<Btn label="Pay ₹5,000 with PhonePe / UPI" icon="📲" color={C.green}',
        '<Btn label="Pay ₹5,000 with Paytm / UPI QR" icon="📲" color={C.green}',
        'payment button label',
    )
    text = replace_once(
        text,
        '{!!paymentOrderId && (',
        '{false && !!paymentOrderId && (',
        'legacy payment status block',
    )
    text = replace_once(
        text,
        'PhonePe merchant onboarding/credentials complete hote hi live payment active ho jayega.',
        'Paytm / UPI QR payment active hai. Payment ke baad admin 30 days manually activate karega.',
        'merchant copy',
    )
    text = replace_once(
        text,
        'Manual renewal every 30 days. Payment success PhonePe server se verify hone ke baad hi plan active hoga.',
        'Manual renewal every 30 days. Payment ke baad admin confirmation se plan active hoga.',
        'renewal copy',
    )

    APP.write_text(text, encoding="utf-8")
    print("Installed OKAI manual Paytm / UPI QR Plans payment patch")


if __name__ == "__main__":
    main()
