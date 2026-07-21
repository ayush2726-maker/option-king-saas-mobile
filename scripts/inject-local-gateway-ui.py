#!/usr/bin/env python3
"""Inject the hidden Local Gateway route into the current single-file app.

The mobile app is intentionally kept unchanged for normal users: no bottom tab is
added.  The entry point is More -> Advanced Setup, which expands on demand.
This script is idempotent and fails loudly when upstream App.js anchors change.
"""

from pathlib import Path


APP = Path("App.js")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one anchor, found {count}")
    return text.replace(old, new, 1)


def main():
    text = APP.read_text(encoding="utf-8")

    import_line = 'const LocalGatewayScreen = require("./src/screens/LocalGatewayScreen").default;'
    if import_line not in text:
        text = replace_once(
            text,
            'const RecoveryScreen = require("./src/screens/RecoveryScreen").default;',
            'const RecoveryScreen = require("./src/screens/RecoveryScreen").default;\n'
            + import_line,
            "LocalGatewayScreen import",
        )

    old_signature = "function MoreTab({ token, user, lang, setLang, isAdmin }) {"
    new_signature = "function MoreTab({ token, user, lang, setLang, isAdmin, navigateTo }) {"
    if new_signature not in text:
        text = replace_once(text, old_signature, new_signature, "MoreTab signature")

    state_line = '  const [showAdvancedGateway, setShowAdvancedGateway] = useState(false);'
    if state_line not in text:
        state_anchor = (
            '  const [paymentState, setPaymentState] = useState("");\n'
            '  const [msg, setMsg] = useState("");\n'
            '  const [loading, setLoading] = useState(false);'
        )
        text = replace_once(
            text,
            state_anchor,
            state_anchor + "\n" + state_line,
            "MoreTab advanced state",
        )

    advanced_marker = "LOCAL_GATEWAY_ADVANCED_SETUP_V1"
    if advanced_marker not in text:
        more_start = text.index(new_signature)
        more_end = text.index("// ── Guide + Language Tab", more_start)
        more = text[more_start:more_end]
        card_anchor = """      </Card>\n\n      <Card glow={C.green}>\n"""
        advanced_card = """      </Card>\n\n      {/* LOCAL_GATEWAY_ADVANCED_SETUP_V1 */}\n      <Card glow={C.purple}>\n        <TouchableOpacity\n          accessibilityRole=\"button\"\n          accessibilityState={{ expanded: showAdvancedGateway }}\n          onPress={() => setShowAdvancedGateway(!showAdvancedGateway)}\n          style={{ flexDirection: \"row\", justifyContent: \"space-between\",\n            alignItems: \"center\", gap: 12 }}>\n          <View style={{ flex: 1 }}>\n            <Text style={{ color: C.text, fontSize: 18, fontWeight: \"900\" }}>\n              🛡️ {hi ? \"Advanced Setup\" : \"Advanced Setup\"}\n            </Text>\n            <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>\n              {hi\n                ? \"सिर्फ अपने static-IP phone/desktop से LIVE orders चलाने वाले users के लिए\"\n                : \"Only for users running LIVE orders through their own static-IP phone or desktop\"}\n            </Text>\n          </View>\n          <Text style={{ color: C.purple, fontSize: 20, fontWeight: \"900\" }}>\n            {showAdvancedGateway ? \"⌃\" : \"⌄\"}\n          </Text>\n        </TouchableOpacity>\n\n        {showAdvancedGateway && (\n          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1,\n            borderTopColor: C.border }}>\n            <View style={{ backgroundColor: C.goldLo, borderRadius: 10, padding: 10,\n              borderWidth: 1, borderColor: C.gold + \"44\", marginBottom: 11 }}>\n              <Text style={{ color: C.gold, fontSize: 10, lineHeight: 16, fontWeight: \"800\" }}>\n                {hi\n                  ? \"Angel API key, MPIN और TOTP app में नहीं भरने हैं। वे केवल user के gateway device पर रहेंगे।\"\n                  : \"Do not enter Angel API key, MPIN or TOTP in the app. They stay only on the user's gateway device.\"}\n              </Text>\n            </View>\n            <Btn\n              label={hi ? \"Local Gateway खोलें\" : \"Open Local Gateway\"}\n              icon=\"🖥️\"\n              color={C.purple}\n              onPress={() => navigateTo && navigateTo(\"localgateway\")}\n            />\n          </View>\n        )}\n      </Card>\n\n      <Card glow={C.green}>\n"""
        if more.count(card_anchor) != 1:
            raise RuntimeError(
                "Advanced card anchor changed inside MoreTab; expected one Language/Profile boundary"
            )
        more = more.replace(card_anchor, advanced_card, 1)
        text = text[:more_start] + more + text[more_end:]

    old_more_route = (
        '        {activeTab === "more" && <MoreTab token={token} user={displayUser} '
        'lang={lang} setLang={setLang} isAdmin={isAdmin} />}\n'
    )
    new_more_route = (
        '        {activeTab === "more" && <MoreTab token={token} user={displayUser} '
        'lang={lang} setLang={setLang} isAdmin={isAdmin} navigateTo={navigateTo} />}\n'
    )
    if new_more_route not in text:
        text = replace_once(text, old_more_route, new_more_route, "MoreTab route props")

    gateway_route = (
        '        {activeTab === "localgateway" && '
        '<LocalGatewayScreen token={token} lang={lang} />}\n'
    )
    if gateway_route not in text:
        text = replace_once(
            text,
            new_more_route,
            new_more_route + gateway_route,
            "Local gateway route",
        )

    required = [
        import_line,
        new_signature,
        state_line,
        advanced_marker,
        'navigateTo("localgateway")',
        'activeTab === "localgateway"',
    ]
    missing = [marker for marker in required if marker not in text]
    if missing:
        raise RuntimeError(f"Injection incomplete: {missing}")

    APP.write_text(text, encoding="utf-8")
    print("LOCAL_GATEWAY_HIDDEN_UI_INJECTED_OK")


if __name__ == "__main__":
    main()
