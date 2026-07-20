from pathlib import Path

path = Path("App.js")
app = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global app
    if old not in app:
        raise RuntimeError(f"{label} marker not found")
    app = app.replace(old, new, 1)


replace_once(
    '  const [planName, setPlanName] = useState("monthly");\n'
    '  const [amount, setAmount] = useState("999");\n',
    '  const [paymentOrderId, setPaymentOrderId] = useState("");\n'
    '  const [paymentAvailable, setPaymentAvailable] = useState(false);\n'
    '  const [paymentState, setPaymentState] = useState("");\n',
    "payment state",
)

replace_once(
    '''    if (isAdmin) {
      try {
        const u = await apiGet("/admin/users-lite", token);
        setUsers(u.users || []);
      } catch {}
    }
    setLoading(false);
''',
    '''    if (isAdmin) {
      try {
        const u = await apiGet("/admin/users-lite", token);
        setUsers(u.users || []);
      } catch {}
    }
    try {
      const config = await apiGet("/subscription/phonepe/config", token);
      setPaymentAvailable(config?.available === true);
    } catch {
      setPaymentAvailable(false);
    }
    setLoading(false);
''',
    "payment config load",
)

replace_once(
    '  useEffect(() => { loadAll(); }, []);\n',
    '''  useEffect(() => {
    loadAll();
    AsyncStorage.getItem("okai_phonepe_order_id")
      .then(value => {
        if (value) setPaymentOrderId(value);
      })
      .catch(() => {});
  }, []);
''',
    "payment order restore",
)

replace_once(
    '''  async function submitPlan() {
    setMsg("");
    setLoading(true);
    try {
      const d = await apiPostAuth("/billing/purchase-request", {
        plan_name: planName,
        amount: Number(amount || 0),
        note: "Mobile app request"
      }, token);
      setMsg(d.message || "Request submitted");
    } catch {
      setMsg(hi ? "Plan request failed" : "Plan request failed");
    }
    setLoading(false);
  }
''',
    '''  async function startPhonePePayment() {
    setMsg("");
    setPaymentState("");
    setLoading(true);
    try {
      const d = await apiPostAuth("/subscription/phonepe/create-order", {}, token);
      if (!d?.success || !d?.checkout_url || !d?.merchant_order_id) {
        const detail = typeof d?.detail === "string"
          ? d.detail
          : "PhonePe merchant setup abhi complete nahi hai";
        setMsg(detail);
        setLoading(false);
        return;
      }
      setPaymentOrderId(d.merchant_order_id);
      setPaymentState("PENDING");
      await AsyncStorage.setItem("okai_phonepe_order_id", d.merchant_order_id);
      setMsg(hi
        ? "PhonePe/UPI checkout khul raha hai. Payment ke baad app me wapas aakar Check Payment Status dabao."
        : "PhonePe/UPI checkout is opening. After payment, return to the app and tap Check Payment Status.");
      await Linking.openURL(d.checkout_url);
    } catch {
      setMsg(hi ? "PhonePe checkout open nahi hua" : "Could not open PhonePe checkout");
    }
    setLoading(false);
  }

  async function checkPhonePePayment() {
    setMsg("");
    const orderId = paymentOrderId || await AsyncStorage.getItem("okai_phonepe_order_id");
    if (!orderId) {
      setMsg(hi ? "Pehle payment start karo" : "Start the payment first");
      return;
    }
    setLoading(true);
    try {
      const d = await apiGet(
        `/subscription/phonepe/status/${encodeURIComponent(orderId)}`,
        token
      );
      const state = String(d?.state || "PENDING").toUpperCase();
      setPaymentState(state);
      if (d?.subscription_active) {
        setMsg(hi
          ? "✅ Payment verify ho gaya. 30 din ka plan active hai."
          : "✅ Payment verified. Your 30-day plan is active.");
        await AsyncStorage.removeItem("okai_phonepe_order_id");
        setPaymentOrderId("");
        await loadAll();
      } else if (state === "FAILED") {
        setMsg(hi ? "Payment failed. Dobara try karo." : "Payment failed. Please try again.");
      } else {
        setMsg(hi
          ? "Payment abhi pending hai. UPI app me status check karke phir refresh karo."
          : "Payment is still pending. Check your UPI app and refresh again.");
      }
    } catch {
      setMsg(hi ? "Payment status check nahi hua" : "Could not check payment status");
    }
    setLoading(false);
  }
''',
    "payment functions",
)

replace_once(
    '''      <Card glow={C.gold}>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
          💳 {hi ? "Plan Purchase / Payment" : "Plan Purchase / Payment"}
        </Text>

        <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800", marginBottom: 5 }}>Plan</Text>
        <TextInput style={[st.input, { marginBottom: 10 }]} value={planName}
          onChangeText={setPlanName} placeholder="monthly / yearly" placeholderTextColor={C.muted} />

        <Text style={{ color: C.muted, fontSize: 11, fontWeight: "800", marginBottom: 5 }}>Amount</Text>
        <TextInput style={[st.input, { marginBottom: 12 }]} value={amount}
          onChangeText={setAmount} keyboardType="numeric" placeholder="999" placeholderTextColor={C.muted} />

        <Btn label={hi ? "Submit Payment Request" : "Submit Payment Request"} icon="💳" color={C.green}
          loading={loading} onPress={submitPlan} />
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>
          {hi ? "Abhi manual approval flow hai. Razorpay/PhonePe gateway baad me connect karenge." : "Manual approval flow. Razorpay/PhonePe gateway can be connected later."}
        </Text>
      </Card>
''',
    '''      <Card glow={C.gold}>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: "900" }}>
              💳 OKAI Monthly Plan
            </Text>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
              {hi ? "30 din ka software access" : "30 days of software access"}
            </Text>
          </View>
          <Tag label="₹1,999" color={C.gold} />
        </Row>

        {["Full OKAI access", "Paper + Live tools", "Strategy + Backtest", "Trade alerts + Reports"].map(item => (
          <Row key={item} style={{ marginBottom: 7 }}>
            <Text style={{ color: C.green, marginRight: 8 }}>✓</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>{item}</Text>
          </Row>
        ))}

        <View style={{ backgroundColor: C.s1, borderRadius: 10, padding: 10,
          borderWidth: 1, borderColor: C.blue+"44", marginTop: 6, marginBottom: 12 }}>
          <Text style={{ color: C.blue, fontSize: 11, lineHeight: 17, fontWeight: "800" }}>
            PhonePe checkout me PhonePe, Google Pay, Paytm, BHIM ya kisi bhi supported UPI app se payment kar sakte hain.
          </Text>
        </View>

        <Btn label="Pay ₹1,999 with PhonePe / UPI" icon="📲" color={C.green}
          loading={loading} onPress={startPhonePePayment} />

        {!!paymentOrderId && (
          <View style={{ marginTop: 10 }}>
            <Btn label="Check Payment Status" icon="🔄" color={C.blue}
              loading={loading} onPress={checkPhonePePayment} />
            <Text style={{ color: C.muted, fontSize: 10, marginTop: 7, textAlign: "center" }}>
              Order: {paymentOrderId} {paymentState ? `• ${paymentState}` : ""}
            </Text>
          </View>
        )}

        {!paymentAvailable && (
          <Text style={{ color: C.gold, fontSize: 10, lineHeight: 15, marginTop: 9 }}>
            PhonePe merchant onboarding/credentials complete hote hi live payment active ho jayega.
          </Text>
        )}
        <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 8 }}>
          Manual renewal every 30 days. Payment success PhonePe server se verify hone ke baad hi plan active hoga.
        </Text>
      </Card>
''',
    "payment card",
)

app = app.replace("→ ₹999/month", "→ ₹1,999/month")

path.write_text(app, encoding="utf-8")
print("PhonePe ₹1,999 payment UI patch applied")
