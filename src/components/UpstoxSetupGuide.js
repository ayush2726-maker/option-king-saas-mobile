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

function Step({ number, title, children }) {
  return (
    <View style={{
      flexDirection: "row",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    }}>
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.accent + "22",
        borderWidth: 1,
        borderColor: C.accent + "66",
      }}>
        <Text style={{
          color: C.accent,
          fontWeight: "900",
          fontSize: 11,
        }}>
          {number}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          color: C.text,
          fontSize: 13,
          fontWeight: "900",
        }}>
          {title}
        </Text>
        <Text style={{
          color: C.sub,
          fontSize: 11,
          lineHeight: 18,
          marginTop: 4,
        }}>
          {children}
        </Text>
      </View>
    </View>
  );
}

function UpstoxSetupGuide({ compact = false }) {
  return (
    <View style={{
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.blue + "66",
      padding: 14,
      marginBottom: 12,
    }}>
      <Text style={{
        color: C.text,
        fontSize: compact ? 15 : 19,
        fontWeight: "900",
      }}>
        🔵 Upstox API Complete Setup
      </Text>

      <Text style={{
        color: C.muted,
        fontSize: 10,
        lineHeight: 16,
        marginTop: 5,
        marginBottom: 12,
      }}>
        App create karne se API Key, Secret aur daily Access Token
        OKAI me save karne tak poora process.
      </Text>

      <View style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
      }}>
        <LinkButton label="Open Developer Apps" url={DEV_URL} color={C.blue} />
        <LinkButton label="Create New App" url={CREATE_URL} color={C.green} />
        {!compact && (
          <LinkButton label="Official Auth Guide" url={DOCS_URL} color={C.accent} />
        )}
      </View>

      <ReadValue label="App Name" value={APP_NAME} />
      <ReadValue label="Redirect URL — exact paste karein" value={REDIRECT_URL} />
      <ReadValue label="Postback URL — field aaye to ye daalein" value={POSTBACK_URL} />

      {!compact && (
        <>
          <Step number="1" title="Developer Apps Login">
            Upstox registered mobile number se login karein. F&O segment
            active hona chahiye.
          </Step>
          <Step number="2" title="New App Create Karein">
            App Name me “Option King AI” daalein. Live/normal API app
            use karein. Sandbox sirf testing ke liye hai.
          </Step>
          <Step number="3" title="Exact URLs Bharein">
            Redirect aur Postback URL upar diye exact values se bharein.
            Extra space ya slash change na karein. Algo Name field ko
            exchange-approved name na ho to blank rakhein.
          </Step>
          <Step number="4" title="API Key Aur API Secret">
            Created app open karke API Key aur API Secret copy karein.
            API Secret kabhi screenshot/chat me share na karein.
          </Step>
          <Step number="5" title="Daily Access Token Generate Karein">
            Created app me Generate dabayein, Upstox login/approval
            complete karein aur standard Access Token copy karein.
            Analytics Token live order nahi laga sakta.
          </Step>
          <Step number="6" title="OKAI Me Fields">
            API Key (Client ID) = Upstox API Key; API Secret = Upstox
            API Secret; Daily Access Token = generated token.
            Upstox ke liye TOTP field nahi chahiye.
          </Step>
          <Step number="7" title="Save Aur Test">
            Save Credentials dabayein, phir Test Broker Connection.
            Connected aaye to setup complete hai.
          </Step>
        </>
      )}

      <View style={{
        backgroundColor: C.gold + "13",
        borderWidth: 1,
        borderColor: C.gold + "55",
        borderRadius: 11,
        padding: 11,
        marginTop: 12,
      }}>
        <Text style={{
          color: C.gold,
          fontSize: 11,
          fontWeight: "900",
          lineHeight: 18,
        }}>
          ⏰ Standard Access Token agle din 3:30 AM tak valid hota hai.
          Market se pehle naya token Generate karke OKAI me update karein.
        </Text>
      </View>

      <View style={{
        backgroundColor: C.red + "12",
        borderWidth: 1,
        borderColor: C.red + "55",
        borderRadius: 11,
        padding: 11,
        marginTop: 9,
      }}>
        <Text style={{
          color: C.red,
          fontSize: 11,
          fontWeight: "900",
          lineHeight: 18,
        }}>
          🔒 Live API orders ke liye registered Static IP required ho
          sakti hai. Railway outgoing Static IP register na ho to live
          order reject ho sakta hai.
        </Text>
      </View>
    </View>
  );
}

module.exports = UpstoxSetupGuide;
