const React = require("react");
const {
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} = require("react-native");

const APP_NAME = "Option King AI";
const DEV_URL = "https://account.upstox.com/developer/apps";
const CREATE_URL = "https://account.upstox.com/developer/apps/createapp";
const DOCS_URL = "https://upstox.com/developer/api-documentation/authentication/";
const REDIRECT_URL = "https://option-king-saas-production.up.railway.app/upstox/callback";
const POSTBACK_URL = "https://option-king-saas-production.up.railway.app/upstox/postback";

const C = {
  card: "#13131f",
  card2: "#1a1a2e",
  border: "#252540",
  text: "#e8e8f0",
  sub: "#a0a0c0",
  muted: "#606080",
  accent: "#7c6deb",
  green: "#00d4a0",
  red: "#ff4d6d",
  gold: "#f5c842",
  blue: "#4d9fff",
};

function openUrl(url) {
  Linking.openURL(url).catch(() => {});
}

function LinkButton({ label, url, color }) {
  return (
    <TouchableOpacity
      onPress={() => openUrl(url)}
      activeOpacity={0.82}
      style={{
        flex: 1,
        minWidth: 140,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: color + "66",
        backgroundColor: color + "20",
        alignItems: "center",
      }}
    >
      <Text style={{
        color,
        fontSize: 11,
        fontWeight: "900",
        textAlign: "center",
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ReadValue({ label, value }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{
        color: C.muted,
        fontSize: 10,
        fontWeight: "900",
        marginBottom: 5,
        textTransform: "uppercase",
      }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={() => {}}
        showSoftInputOnFocus={false}
        selectTextOnFocus
        multiline
        style={{
          color: C.gold,
          backgroundColor: C.card2,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 10,
          padding: 10,
          fontSize: 11,
          lineHeight: 17,
          fontWeight: "800",
        }}
      />
    </View>
  );
}

function AccordionItem({ id, number, title, openId, setOpenId, children, colour = C.accent }) {
  const open = openId === id;
  return (
    <View style={{
      borderWidth: 1,
      borderColor: open ? colour + "88" : C.border,
      borderRadius: 12,
      backgroundColor: C.card2,
      overflow: "hidden",
      marginBottom: 8,
    }}>
      <TouchableOpacity
        onPress={() => setOpenId(open ? null : id)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 11,
          gap: 10,
        }}
      >
        {number ? (
          <View style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colour + "22",
            borderWidth: 1,
            borderColor: colour + "66",
          }}>
            <Text style={{ color: colour, fontSize: 11, fontWeight: "900" }}>
              {number}
            </Text>
          </View>
        ) : null}

        <Text style={{
          flex: 1,
          color: C.text,
          fontSize: 12,
          fontWeight: "900",
          lineHeight: 17,
        }}>
          {title}
        </Text>

        <View style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colour + "18",
        }}>
          <Text style={{ color: colour, fontSize: 17, fontWeight: "900" }}>
            {open ? "⌃" : "⌄"}
          </Text>
        </View>
      </TouchableOpacity>

      {open ? (
        <View style={{
          paddingHorizontal: 12,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: C.border,
        }}>
          {typeof children === "string" ? (
            <Text style={{
              color: C.sub,
              fontSize: 11,
              lineHeight: 18,
              marginTop: 10,
            }}>
              {children}
            </Text>
          ) : children}
        </View>
      ) : null}
    </View>
  );
}

function Notice({ colour, children }) {
  return (
    <View style={{
      backgroundColor: colour + "13",
      borderWidth: 1,
      borderColor: colour + "55",
      borderRadius: 11,
      padding: 11,
      marginTop: 10,
    }}>
      <Text style={{
        color: colour,
        fontSize: 11,
        fontWeight: "900",
        lineHeight: 18,
      }}>
        {children}
      </Text>
    </View>
  );
}

function UpstoxSetupGuide({ compact = false }) {
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [openId, setOpenId] = React.useState(null);

  return (
    <View style={{
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: guideOpen ? C.blue + "88" : C.border,
      marginBottom: 12,
      overflow: "hidden",
    }}>
      <TouchableOpacity
        onPress={() => setGuideOpen((value) => !value)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityState={{ expanded: guideOpen }}
        style={{
          minHeight: 68,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{
            color: C.text,
            fontSize: compact ? 15 : 17,
            fontWeight: "900",
          }}>
            🔵 Upstox API Complete Setup
          </Text>
          <Text style={{
            color: C.muted,
            fontSize: 10,
            lineHeight: 15,
            marginTop: 4,
          }}>
            Jis step ki zarurat ho us par tap karke details dekhein.
          </Text>
        </View>
        <View style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: C.blue + "66",
          backgroundColor: C.blue + "18",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Text style={{ color: C.blue, fontSize: 18, fontWeight: "900" }}>
            {guideOpen ? "⌃" : "⌄"}
          </Text>
        </View>
      </TouchableOpacity>

      {guideOpen ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          <AccordionItem
            id="quick"
            title="Quick Links aur Exact App URLs"
            openId={openId}
            setOpenId={setOpenId}
            colour={C.blue}
          >
            <View style={{ marginTop: 10 }}>
              <View style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}>
                <LinkButton label="Open Developer Apps" url={DEV_URL} color={C.blue} />
                <LinkButton label="Create New App" url={CREATE_URL} color={C.green} />
                {!compact ? (
                  <LinkButton label="Official Auth Guide" url={DOCS_URL} color={C.accent} />
                ) : null}
              </View>
              <ReadValue label="App Name" value={APP_NAME} />
              <ReadValue label="Redirect URL — exact paste karein" value={REDIRECT_URL} />
              <ReadValue label="Postback URL — field aaye to ye daalein" value={POSTBACK_URL} />
            </View>
          </AccordionItem>

          {!compact ? (
            <>
              <AccordionItem id="step-1" number="1" title="Developer Apps Login" openId={openId} setOpenId={setOpenId}>
                Upstox registered mobile number se login karein. F&O segment active hona chahiye.
              </AccordionItem>
              <AccordionItem id="step-2" number="2" title="New App Create Karein" openId={openId} setOpenId={setOpenId}>
                App Name me “Option King AI” daalein. Live/normal API app use karein. Sandbox sirf testing ke liye hai.
              </AccordionItem>
              <AccordionItem id="step-3" number="3" title="Exact URLs Bharein" openId={openId} setOpenId={setOpenId}>
                Redirect aur Postback URL Quick Links section wali exact values se bharein. Extra space ya slash change na karein. Algo Name field ko exchange-approved name na ho to blank rakhein.
              </AccordionItem>
              <AccordionItem id="step-4" number="4" title="API Key aur API Secret" openId={openId} setOpenId={setOpenId}>
                Created app open karke API Key aur API Secret copy karein. API Secret kabhi screenshot ya chat me share na karein.
              </AccordionItem>
              <AccordionItem id="step-5" number="5" title="Daily Access Token Generate Karein" openId={openId} setOpenId={setOpenId}>
                Created app me Generate dabayein, Upstox login/approval complete karein aur standard Access Token copy karein. Analytics Token live order nahi laga sakta.
              </AccordionItem>
              <AccordionItem id="step-6" number="6" title="OKAI Me Fields Kaise Bharein" openId={openId} setOpenId={setOpenId}>
                API Key (Client ID) = Upstox API Key; API Secret = Upstox API Secret; Daily Access Token = generated token. Upstox ke liye TOTP field nahi chahiye.
              </AccordionItem>
              <AccordionItem id="step-7" number="7" title="Save aur Test Connection" openId={openId} setOpenId={setOpenId}>
                Save Credentials dabayein, phir Test Broker Connection. Connected aaye to setup complete hai.
              </AccordionItem>
            </>
          ) : null}

          <AccordionItem id="token-warning" title="Token Validity" openId={openId} setOpenId={setOpenId} colour={C.gold}>
            <Notice colour={C.gold}>
              ⏰ Standard Access Token agle din 3:30 AM tak valid hota hai. Market se pehle naya token generate karke OKAI me update karein.
            </Notice>
          </AccordionItem>

          <AccordionItem id="static-ip" title="Static IP aur Live Orders" openId={openId} setOpenId={setOpenId} colour={C.red}>
            <Notice colour={C.red}>
              🔒 Live API orders ke liye registered Static IP required ho sakti hai. Registered outgoing IP match na ho to live order reject ho sakta hai.
            </Notice>
          </AccordionItem>
        </View>
      ) : null}
    </View>
  );
}

module.exports = UpstoxSetupGuide;
