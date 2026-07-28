const React = require("react");
const ReactNative = require("react-native");
const AsyncStorageModule = require("@react-native-async-storage/async-storage");

const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
const {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} = ReactNative;

const STORAGE_KEY = "okai_help_open_section_v1";

const COLORS = {
  bg: "#0a0a0f",
  surface: "#13131f",
  surface2: "#0f0f1a",
  surface3: "#1a1a2e",
  border: "#252540",
  text: "#e8e8f0",
  sub: "#a0a0c0",
  muted: "#737391",
  green: "#00d4a0",
  blue: "#4d9fff",
  gold: "#f5c842",
  red: "#ff4d6d",
  purple: "#b06deb",
};

const HELP_SECTIONS = [
  {
    id: "start",
    icon: "🚀",
    color: COLORS.green,
    hi: {
      title: "शुरुआत और लॉगिन",
      summary: "ऐप खोलने, लॉगिन करने और पहली बार सेटअप करने की मदद।",
      steps: [
        "अपना रजिस्टर्ड ईमेल या Login ID और पासवर्ड डालकर लॉगिन करें।",
        "पहली बार लॉगिन के बाद पहले Settings में जाकर ब्रोकर, मार्केट और रिस्क सेटिंग्स जाँचें।",
        "शुरुआत हमेशा Paper Mode से करें। Paper Mode में वास्तविक ऑर्डर नहीं लगते।",
        "मुख्य Home स्क्रीन पर बॉट स्टेटस, AI निर्णय, AUTO Portfolio, स्कोर और ट्रेड स्थिति दिखाई देगी।",
      ],
      note: "पासवर्ड या Login ID याद न हो तो Login स्क्रीन पर उपलब्ध recovery विकल्प का उपयोग करें।",
    },
    en: {
      title: "Getting Started and Login",
      summary: "Help with opening the app, signing in, and completing the first setup.",
      steps: [
        "Sign in using your registered email or Login ID and password.",
        "After your first login, open Settings and review broker, market, and risk settings.",
        "Always begin in Paper Mode. Paper Mode does not place real orders.",
        "The main Home screen shows bot status, AI decisions, AUTO Portfolio, score, and trade status.",
      ],
      note: "Use the recovery options on the Login screen if you forget your password or Login ID.",
    },
  },
  {
    id: "broker-overview",
    icon: "🔗",
    color: COLORS.blue,
    hi: {
      title: "ब्रोकर कनेक्शन",
      summary: "Angel One, Upstox या Zerodha को ऐप से जोड़ने की सामान्य प्रक्रिया।",
      steps: [
        "Settings खोलें और Broker section चुनें।",
        "अपना ब्रोकर चुनें: Angel One, Upstox या Zerodha।",
        "सभी मांगे गए credentials भरें और Save Credentials दबाएँ।",
        "Test Broker Connection दबाकर login और market-data connection जाँचें।",
        "सुरक्षा के कारण saved credentials दोबारा दिखाई नहीं देते। बदलाव करते समय सभी fields फिर से भरें।",
      ],
      note: "Broker credentials किसी व्यक्ति के साथ साझा न करें। API key, MPIN, TOTP secret और access token संवेदनशील जानकारी हैं।",
    },
    en: {
      title: "Broker Connection",
      summary: "General steps for connecting Angel One, Upstox, or Zerodha.",
      steps: [
        "Open Settings and select the Broker section.",
        "Choose Angel One, Upstox, or Zerodha.",
        "Enter every required credential and tap Save Credentials.",
        "Tap Test Broker Connection to verify login and market-data access.",
        "Saved credentials are not displayed again for security. Re-enter all fields when making a change.",
      ],
      note: "Never share broker credentials. API keys, MPINs, TOTP secrets, and access tokens are sensitive.",
    },
  },
  {
    id: "angel",
    icon: "🅰️",
    color: COLORS.blue,
    hi: {
      title: "Angel One सेटअप",
      summary: "SmartAPI, Client ID, MPIN और TOTP जोड़ने की मदद।",
      steps: [
        "Angel One account में F&O permission चालू रखें।",
        "SmartAPI portal पर Personal app बनाएँ और API Key कॉपी करें।",
        "Client ID में अपना Angel One login ID डालें।",
        "MPIN field में अपना Angel One MPIN भरें।",
        "TOTP Key में Authenticator setup की secret key डालें।",
        "Credentials save करने के बाद connection test चलाएँ।",
      ],
      note: "Live orders के लिए static-IP/local-gateway नियम लागू हो सकते हैं। ऐप में दिख रहे gateway status को अवश्य जाँचें।",
    },
    en: {
      title: "Angel One Setup",
      summary: "Help with SmartAPI, Client ID, MPIN, and TOTP.",
      steps: [
        "Keep F&O permission enabled in your Angel One account.",
        "Create a Personal app in the SmartAPI portal and copy its API Key.",
        "Enter your Angel One login ID as Client ID.",
        "Enter your Angel One MPIN in the MPIN field.",
        "Enter the Authenticator setup secret in the TOTP Key field.",
        "Save credentials and run the connection test.",
      ],
      note: "Static-IP or local-gateway rules may apply to live orders. Always verify the gateway status shown in the app.",
    },
  },
  {
    id: "upstox",
    icon: "🅄",
    color: COLORS.green,
    hi: {
      title: "Upstox सेटअप",
      summary: "Developer app, API Key, Secret और daily access token की मदद।",
      steps: [
        "Upstox Developer portal में app बनाएँ और सही Redirect URI दर्ज करें।",
        "API Key को Client ID field में डालें।",
        "API Secret को API Secret field में डालें।",
        "Authorize/login करके daily access token बनाएँ और Daily Access Token field में भरें।",
        "Token expire होने पर नया token generate करके credentials फिर save करें।",
      ],
      note: "Access token की अवधि सीमित हो सकती है। Market data बंद दिखे तो पहले token और connection test जाँचें।",
    },
    en: {
      title: "Upstox Setup",
      summary: "Help with the developer app, API Key, Secret, and daily access token.",
      steps: [
        "Create an app in the Upstox Developer portal and enter the correct Redirect URI.",
        "Enter the API Key in the Client ID field.",
        "Enter the API Secret in the API Secret field.",
        "Authorize the app to generate a daily access token and enter it in Daily Access Token.",
        "When the token expires, generate a new token and save all credentials again.",
      ],
      note: "Access tokens may have a limited validity period. Check the token and connection test if market data stops.",
    },
  },
  {
    id: "zerodha",
    icon: "🅩",
    color: COLORS.gold,
    hi: {
      title: "Zerodha सेटअप",
      summary: "Kite Connect app और daily access token जोड़ने की मदद।",
      steps: [
        "Kite Connect developer account और API access सक्रिय रखें।",
        "Developer portal में app बनाकर API Key और API Secret प्राप्त करें।",
        "Client ID में अपनी Zerodha User ID डालें।",
        "Browser login से daily access token बनाएँ।",
        "नया access token save करके connection test चलाएँ।",
      ],
      note: "Daily token expire होने पर बॉट market data नहीं ले पाएगा। हर trading day token status जाँचें।",
    },
    en: {
      title: "Zerodha Setup",
      summary: "Help with the Kite Connect app and daily access token.",
      steps: [
        "Keep your Kite Connect developer account and API access active.",
        "Create an app in the developer portal and obtain the API Key and API Secret.",
        "Enter your Zerodha User ID as Client ID.",
        "Generate the daily access token through browser login.",
        "Save the new token and run the connection test.",
      ],
      note: "The bot cannot receive market data after the daily token expires. Check token status every trading day.",
    },
  },
  {
    id: "paper",
    icon: "📝",
    color: COLORS.purple,
    hi: {
      title: "Paper Mode और Capital",
      summary: "बिना वास्तविक ऑर्डर के रणनीति और बॉट का परीक्षण।",
      steps: [
        "Trading Mode में Paper चुनें।",
        "Paper Capital में वह राशि रखें जिस पर आप simulation चलाना चाहते हैं।",
        "Paper trades, P&L और history को Home तथा Reports में जाँचें।",
        "Capital बदलने के बाद बॉट की quantity और whole-lot calculation दोबारा जाँचें।",
      ],
      note: "Paper result वास्तविक execution से अलग हो सकता है क्योंकि live spread, slippage, delay और broker rejection बदल सकते हैं।",
    },
    en: {
      title: "Paper Mode and Capital",
      summary: "Test the strategy and bot without placing real orders.",
      steps: [
        "Select Paper under Trading Mode.",
        "Set Paper Capital to the amount you want to simulate.",
        "Review paper trades, P&L, and history on Home and in Reports.",
        "After changing capital, recheck quantity and whole-lot calculations.",
      ],
      note: "Paper results can differ from live execution because spread, slippage, delay, and broker rejection may vary.",
    },
  },
  {
    id: "bot",
    icon: "🏠",
    color: COLORS.green,
    hi: {
      title: "Home और Bot Control",
      summary: "मुख्य स्क्रीन, Start/Stop, status और live scan समझें।",
      steps: [
        "Home अब बॉट की मुख्य स्क्रीन है। ऐप खुलने पर यही स्क्रीन दिखाई देगी।",
        "Start Bot दबाने से selected mode और strategy के अनुसार scanning शुरू होती है।",
        "Stop Bot नई entries रोकता है; open trade का behavior configured exit rules पर निर्भर रहेगा।",
        "Bot Status, Signal, Score, Open Positions और Total P&L को ऊपर से जाँचें।",
        "AUTO Portfolio में NIFTY, BANKNIFTY और SENSEX के current scan scores दिखाई देंगे।",
      ],
      note: "Market बंद, feed disconnected या invalid price होने पर AI और strategy NO_TRADE/WAIT दिखा सकते हैं।",
    },
    en: {
      title: "Home and Bot Control",
      summary: "Understand the main screen, Start/Stop, status, and live scans.",
      steps: [
        "Home is now the main bot screen and opens when the app starts.",
        "Start Bot begins scanning with the selected mode and strategy.",
        "Stop Bot prevents new entries; open trades continue to follow configured exit rules.",
        "Review Bot Status, Signal, Score, Open Positions, and Total P&L at the top.",
        "AUTO Portfolio displays current scan scores for NIFTY, BANKNIFTY, and SENSEX.",
      ],
      note: "When the market is closed, the feed is disconnected, or price is invalid, AI and strategy may display NO_TRADE or WAIT.",
    },
  },
  {
    id: "strategy",
    icon: "🎯",
    color: COLORS.purple,
    hi: {
      title: "Strategy, Score और AUTO Portfolio",
      summary: "Entry score, selected index और capital slots की जानकारी।",
      steps: [
        "Strategy settings में entry score और उपलब्ध risk controls जाँचें।",
        "AUTO mode NIFTY, BANKNIFTY और SENSEX में valid setup compare करता है।",
        "पहला selected trade Slot 1 और दूसरा अलग index का valid trade Slot 2 उपयोग कर सकता है।",
        "Score के साथ volume, trend, ADX, VWAP, Supertrend और दूसरे confirmations भी देखे जाते हैं।",
        "बहुत कम score करने से trade frequency बढ़ सकती है, लेकिन खराब entries भी बढ़ सकती हैं।",
      ],
      note: "Strategy या risk values बदलने से पहले backtest और Paper Mode में परिणाम जाँचें।",
    },
    en: {
      title: "Strategy, Score, and AUTO Portfolio",
      summary: "Understand entry score, index selection, and capital slots.",
      steps: [
        "Review the entry score and available risk controls in Strategy settings.",
        "AUTO mode compares valid setups across NIFTY, BANKNIFTY, and SENSEX.",
        "The first selected trade can use Slot 1, and a second valid trade on another index can use Slot 2.",
        "The engine also considers volume, trend, ADX, VWAP, Supertrend, and other confirmations.",
        "Reducing the score too much may increase trade frequency but can also increase poor entries.",
      ],
      note: "Test any strategy or risk change in Backtest and Paper Mode first.",
    },
  },
  {
    id: "ai",
    icon: "🧠",
    color: COLORS.gold,
    hi: {
      title: "Shared AI और Advanced AI",
      summary: "AI cards, confidence, option data और shadow monitoring समझें।",
      steps: [
        "Shared AI price, indicators, trend और market status से CE, PE या NO_TRADE opinion बनाता है।",
        "Advanced AI option OI, PCR, Max Pain, Greeks, depth, news और global market context जोड़ता है।",
        "Dropdown header पर tap करके details खोलें या बंद करें।",
        "COLLECTING का अर्थ है कि exact option outcomes का training data अभी जमा हो रहा है।",
        "MONITOR ONLY का अर्थ है कि AI फिलहाल strategy को block नहीं कर रहा और order execute नहीं कर रहा।",
      ],
      note: "AI confidence guaranteed accuracy नहीं है। Market risk और configured strategy rules हमेशा लागू रहते हैं।",
    },
    en: {
      title: "Shared AI and Advanced AI",
      summary: "Understand AI cards, confidence, option data, and shadow monitoring.",
      steps: [
        "Shared AI uses price, indicators, trend, and market status to produce a CE, PE, or NO_TRADE opinion.",
        "Advanced AI adds option OI, PCR, Max Pain, Greeks, depth, news, and global-market context.",
        "Tap a dropdown header to open or close its details.",
        "COLLECTING means the system is still gathering exact option-outcome training data.",
        "MONITOR ONLY means AI is not blocking the strategy or executing orders.",
      ],
      note: "AI confidence is not guaranteed accuracy. Market risk and configured strategy rules still apply.",
    },
  },
  {
    id: "backtest",
    icon: "📊",
    color: COLORS.blue,
    hi: {
      title: "Backtest",
      summary: "Daily और monthly backtest चलाने तथा result पढ़ने की मदद।",
      steps: [
        "Settings या Backtest section में instrument और test period चुनें।",
        "Capital और strategy mode जाँचकर backtest शुरू करें।",
        "Trades, wins, losses, win rate, drawdown और net P&L देखें।",
        "AUTO result में हर index की generated और selected trades अलग से देखें।",
        "एक-दो अच्छे दिनों के बजाय लंबे period और अलग market conditions जाँचें।",
      ],
      note: "Backtest historical simulation है और future profit की guarantee नहीं देता।",
    },
    en: {
      title: "Backtest",
      summary: "Run daily or monthly backtests and understand the results.",
      steps: [
        "Choose the instrument and test period in Settings or Backtest.",
        "Review capital and strategy mode before starting the backtest.",
        "Check trades, wins, losses, win rate, drawdown, and net P&L.",
        "For AUTO results, review generated and selected trades for each index.",
        "Evaluate longer periods and different market conditions instead of relying on a few good days.",
      ],
      note: "A backtest is a historical simulation and does not guarantee future profit.",
    },
  },
  {
    id: "live",
    icon: "⚠️",
    color: COLORS.red,
    hi: {
      title: "Live Mode और सुरक्षा",
      summary: "वास्तविक ऑर्डर चालू करने से पहले जरूरी जाँच।",
      steps: [
        "Broker connection test सफल होना चाहिए।",
        "Market feed connected और current price valid होना चाहिए।",
        "Strategy को पर्याप्त Paper Mode और Backtest testing मिलनी चाहिए।",
        "Capital, maximum positions, quantity, SL, trailing और daily risk limits जाँचें।",
        "Angel One live execution के लिए local gateway/static-IP status online और armed होना आवश्यक हो सकता है।",
        "पहला live test minimum quantity या one-lot से करें।",
      ],
      note: "Live Mode वास्तविक धन का नुकसान कर सकता है। इसे केवल अपनी जिम्मेदारी और समझ के साथ चालू करें।",
    },
    en: {
      title: "Live Mode and Safety",
      summary: "Essential checks before enabling real orders.",
      steps: [
        "The broker connection test must pass.",
        "Market feed must be connected and the current price must be valid.",
        "The strategy should have sufficient Paper Mode and Backtest testing.",
        "Review capital, maximum positions, quantity, stop loss, trailing, and daily risk limits.",
        "Angel One live execution may require an online and armed local gateway with the correct static IP.",
        "Use minimum quantity or one lot for the first live test.",
      ],
      note: "Live Mode can cause real financial loss. Enable it only with full understanding and responsibility.",
    },
  },
  {
    id: "alerts",
    icon: "🔔",
    color: COLORS.blue,
    hi: {
      title: "Telegram और Alerts",
      summary: "Trade alerts के लिए Telegram auto-connect setup.",
      steps: [
        "Account या Help से Telegram Alerts खोलें।",
        "Connect Telegram दबाएँ। Telegram app खुलेगा।",
        "Telegram bot में सिर्फ Start दबाएँ। Chat ID अपने आप save हो जाएगी।",
        "App में वापस आकर Refresh Status या Test दबाकर connection जाँचें।",
        "Trade entry, exit, SL/target, order-fail और P&L alerts linked Telegram पर आएंगे।",
      ],
      note: "अब Bot Token या Chat ID user को भरने की जरूरत नहीं है। Token server पर सुरक्षित रहता है और user का chat_id auto-save होता है।",
    },
    en: {
      title: "Telegram and Alerts",
      summary: "Auto-connect setup for trade alerts on Telegram.",
      steps: [
        "Open Telegram Alerts from Account or Help.",
        "Tap Connect Telegram. The Telegram app will open.",
        "Tap Start in the Telegram bot. Chat ID will be saved automatically.",
        "Return to the app and tap Refresh Status or Test to verify the connection.",
        "Trade entry, exit, SL/target, order-fail, and P&L alerts will arrive on the linked Telegram.",
      ],
      note: "Users no longer need to enter Bot Token or Chat ID. The token stays on the server and the user's chat_id is saved automatically.",
    },
  },
  {
    id: "subscription",
    icon: "💳",
    color: COLORS.gold,
    hi: {
      title: "Plan और Payment",
      summary: "Subscription, PhonePe/UPI, Paytm link और payment status की मदद।",
      steps: [
        "More या Account में Plan section खोलें।",
        "उपलब्ध PhonePe/UPI या Paytm payment-link विकल्प चुनें।",
        "Payment पूरा होने के बाद ऐप में लौटें और Check Payment Status दबाएँ।",
        "Plan केवल server verification सफल होने के बाद active होगा।",
        "Payment pending हो तो तुरंत दोबारा payment न करें; पहले status refresh करें।",
      ],
      note: "Merchant credentials ऐप में नहीं रखे जाते। Payment verification server के माध्यम से होती है।",
    },
    en: {
      title: "Plan and Payment",
      summary: "Help with subscriptions, PhonePe/UPI, Paytm links, and payment status.",
      steps: [
        "Open the Plan section under More or Account.",
        "Choose an available PhonePe/UPI or Paytm payment-link option.",
        "After payment, return to the app and tap Check Payment Status.",
        "The plan activates only after successful server verification.",
        "If payment is pending, refresh its status before attempting another payment.",
      ],
      note: "Merchant credentials are not stored in the app. Payment verification is performed by the server.",
    },
  },
  {
    id: "gateway",
    icon: "🛡️",
    color: COLORS.purple,
    hi: {
      title: "Local Gateway और Static IP",
      summary: "Angel One live execution के gateway setup और status की मदद।",
      steps: [
        "Settings में Advanced Setup या Local Gateway खोलें।",
        "Gateway device paired, online और सही account से connected होना चाहिए।",
        "Static-IP match और agent version जाँचें।",
        "Live arm केवल सुरक्षित gateway device से करें। ऐप से credentials साझा न करें।",
        "Phone बंद होने पर local-gateway आधारित live order execution रुक सकता है। Railway monitoring अलग से चल सकती है।",
      ],
      note: "Gateway offline हो तो पहले live entries बंद रखें। Paper और Railway monitoring के status को live execution status न समझें।",
    },
    en: {
      title: "Local Gateway and Static IP",
      summary: "Help with gateway setup and status for Angel One live execution.",
      steps: [
        "Open Advanced Setup or Local Gateway under Settings.",
        "The gateway device must be paired, online, and connected to the correct account.",
        "Verify the static-IP match and agent version.",
        "Arm live execution only from the trusted gateway device. Never share credentials through the app.",
        "If the gateway phone is off, local-gateway live order execution may stop while Railway monitoring can continue separately.",
      ],
      note: "Keep live entries disabled while the gateway is offline. Do not confuse Paper or Railway monitoring status with live-execution readiness.",
    },
  },
  {
    id: "troubleshoot",
    icon: "🧰",
    color: COLORS.red,
    hi: {
      title: "समस्या समाधान",
      summary: "Feed, login, data, trade और update से जुड़ी सामान्य समस्याएँ।",
      steps: [
        "MARKET_CLOSED सामान्य है जब exchange बंद हो।",
        "FEED_DISCONNECTED आए तो broker token, connection test और internet जाँचें।",
        "STALE_DATA आए तो last update time और Railway/server health जाँचें।",
        "INVALID_PRICE आए तो instrument mapping और broker market data जाँचें।",
        "Trade न बने तो score, regime, volume, time window, cooldown और risk blocks देखें।",
        "नई UI न दिखे तो ऐप पूरी तरह बंद करके दोबारा खोलें ताकि OTA update load हो सके।",
      ],
      note: "किसी error का screenshot भेजते समय API keys, tokens, MPIN, TOTP secret और personal details छिपाएँ।",
    },
    en: {
      title: "Troubleshooting",
      summary: "Common help for feed, login, data, trade, and update issues.",
      steps: [
        "MARKET_CLOSED is normal when the exchange is closed.",
        "For FEED_DISCONNECTED, check broker token, connection test, and internet access.",
        "For STALE_DATA, check the last update time and Railway or server health.",
        "For INVALID_PRICE, verify instrument mapping and broker market data.",
        "If no trade is generated, review score, regime, volume, time window, cooldown, and risk blocks.",
        "If the new UI is not visible, fully close and reopen the app so the OTA update can load.",
      ],
      note: "Before sharing an error screenshot, hide API keys, tokens, MPINs, TOTP secrets, and personal details.",
    },
  },
];

function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function HelpScreen({ lang = "en", setLang }) {
  const isHi = lang === "hi";
  const [openId, setOpenId] = React.useState("");
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (active && value) setOpenId(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function changeLanguage(next) {
    if (typeof setLang === "function") setLang(next);
    try {
      await AsyncStorage.setItem("okai_lang", next);
    } catch (_) {}
  }

  function toggleSection(id) {
    setOpenId((current) => {
      const next = current === id ? "" : id;
      if (next) AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      else AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      return next;
    });
  }

  const needle = normalizeSearch(query);
  const visibleSections = HELP_SECTIONS.filter((section) => {
    if (!needle) return true;
    const copy = isHi ? section.hi : section.en;
    return normalizeSearch(
      [copy.title, copy.summary, ...(copy.steps || []), copy.note].join(" ")
    ).includes(needle);
  });

  return React.createElement(
    ScrollView,
    {
      style: { flex: 1, backgroundColor: COLORS.bg },
      contentContainerStyle: {
        padding: 16,
        paddingBottom: 110,
      },
      keyboardShouldPersistTaps: "handled",
    },
    React.createElement(
      View,
      {
        style: {
          backgroundColor: COLORS.surface,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: COLORS.blue + "66",
          padding: 16,
          marginBottom: 12,
          shadowColor: COLORS.blue,
          shadowOpacity: 0.18,
          shadowRadius: 12,
          elevation: 6,
        },
      },
      React.createElement(
        View,
        { style: { flexDirection: "row", alignItems: "center" } },
        React.createElement(
          View,
          {
            style: {
              width: 46,
              height: 46,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.blue + "18",
              borderWidth: 1,
              borderColor: COLORS.blue + "55",
              marginRight: 12,
            },
          },
          React.createElement(Text, { style: { fontSize: 23 } }, "❓")
        ),
        React.createElement(
          View,
          { style: { flex: 1 } },
          React.createElement(
            Text,
            { style: { color: COLORS.text, fontSize: 21, fontWeight: "900" } },
            isHi ? "मदद" : "Help"
          ),
          React.createElement(
            Text,
            { style: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 3 } },
            isHi
              ? "जिस विषय की मदद चाहिए, उस पर tap करें। केवल उसी की पूरी जानकारी खुलेगी।"
              : "Tap the topic you need. Its complete instructions will open below."
          )
        )
      ),
      React.createElement(
        View,
        { style: { flexDirection: "row", gap: 9, marginTop: 14 } },
        React.createElement(
          TouchableOpacity,
          {
            onPress: () => changeLanguage("hi"),
            style: {
              flex: 1,
              minHeight: 42,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isHi ? COLORS.green + "18" : COLORS.surface2,
              borderWidth: 1,
              borderColor: isHi ? COLORS.green : COLORS.border,
            },
          },
          React.createElement(
            Text,
            { style: { color: isHi ? COLORS.green : COLORS.muted, fontWeight: "900", fontSize: 12 } },
            "🇮🇳 हिंदी"
          )
        ),
        React.createElement(
          TouchableOpacity,
          {
            onPress: () => changeLanguage("en"),
            style: {
              flex: 1,
              minHeight: 42,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: !isHi ? COLORS.blue + "18" : COLORS.surface2,
              borderWidth: 1,
              borderColor: !isHi ? COLORS.blue : COLORS.border,
            },
          },
          React.createElement(
            Text,
            { style: { color: !isHi ? COLORS.blue : COLORS.muted, fontWeight: "900", fontSize: 12 } },
            "🇬🇧 English"
          )
        )
      ),
      React.createElement(TextInput, {
        value: query,
        onChangeText: setQuery,
        placeholder: isHi ? "मदद में खोजें..." : "Search help...",
        placeholderTextColor: COLORS.muted,
        autoCapitalize: "none",
        style: {
          marginTop: 12,
          minHeight: 46,
          borderRadius: 12,
          backgroundColor: COLORS.surface2,
          borderWidth: 1,
          borderColor: COLORS.border,
          color: COLORS.text,
          paddingHorizontal: 14,
          fontSize: 13,
        },
      })
    ),
    React.createElement(
      Text,
      {
        style: {
          color: COLORS.sub,
          fontSize: 10,
          fontWeight: "900",
          letterSpacing: 1.2,
          marginBottom: 9,
          marginLeft: 2,
        },
      },
      isHi ? `${visibleSections.length} मदद विषय` : `${visibleSections.length} HELP TOPICS`
    ),
    visibleSections.length === 0
      ? React.createElement(
          View,
          {
            style: {
              padding: 18,
              borderRadius: 14,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
            },
          },
          React.createElement(
            Text,
            { style: { color: COLORS.muted, fontSize: 12, textAlign: "center" } },
            isHi ? "इस खोज से कोई मदद विषय नहीं मिला।" : "No help topic matched this search."
          )
        )
      : visibleSections.map((section) => {
          const copy = isHi ? section.hi : section.en;
          const expanded = openId === section.id;
          return React.createElement(
            View,
            {
              key: section.id,
              style: {
                backgroundColor: COLORS.surface,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: expanded ? section.color + "88" : COLORS.border,
                marginBottom: 10,
                overflow: "hidden",
              },
            },
            React.createElement(
              TouchableOpacity,
              {
                onPress: () => toggleSection(section.id),
                activeOpacity: 0.78,
                accessibilityRole: "button",
                accessibilityState: { expanded },
                accessibilityLabel: copy.title,
                style: {
                  minHeight: 70,
                  padding: 13,
                  flexDirection: "row",
                  alignItems: "center",
                },
              },
              React.createElement(
                View,
                {
                  style: {
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: section.color + "16",
                    borderWidth: 1,
                    borderColor: section.color + "44",
                    marginRight: 11,
                  },
                },
                React.createElement(Text, { style: { fontSize: 20 } }, section.icon)
              ),
              React.createElement(
                View,
                { style: { flex: 1, paddingRight: 8 } },
                React.createElement(
                  Text,
                  { style: { color: COLORS.text, fontSize: 14, fontWeight: "900" } },
                  copy.title
                ),
                React.createElement(
                  Text,
                  { style: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 3 } },
                  copy.summary
                )
              ),
              React.createElement(
                Text,
                {
                  style: {
                    color: section.color,
                    fontSize: 19,
                    fontWeight: "900",
                    transform: [{ rotate: expanded ? "180deg" : "0deg" }],
                  },
                },
                "⌄"
              )
            ),
            expanded
              ? React.createElement(
                  View,
                  {
                    style: {
                      borderTopWidth: 1,
                      borderTopColor: COLORS.border,
                      paddingHorizontal: 14,
                      paddingTop: 13,
                      paddingBottom: 14,
                      backgroundColor: COLORS.surface2,
                    },
                  },
                  ...(copy.steps || []).map((step, index) =>
                    React.createElement(
                      View,
                      {
                        key: `${section.id}-${index}`,
                        style: {
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginBottom: 10,
                        },
                      },
                      React.createElement(
                        View,
                        {
                          style: {
                            width: 23,
                            height: 23,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: section.color + "1c",
                            borderWidth: 1,
                            borderColor: section.color + "55",
                            marginRight: 9,
                            marginTop: 1,
                          },
                        },
                        React.createElement(
                          Text,
                          { style: { color: section.color, fontSize: 9, fontWeight: "900" } },
                          String(index + 1)
                        )
                      ),
                      React.createElement(
                        Text,
                        { style: { flex: 1, color: COLORS.sub, fontSize: 11, lineHeight: 18 } },
                        step
                      )
                    )
                  ),
                  copy.note
                    ? React.createElement(
                        View,
                        {
                          style: {
                            marginTop: 2,
                            padding: 10,
                            borderRadius: 10,
                            backgroundColor: section.id === "live" ? COLORS.red + "12" : section.color + "10",
                            borderWidth: 1,
                            borderColor: (section.id === "live" ? COLORS.red : section.color) + "44",
                          },
                        },
                        React.createElement(
                          Text,
                          {
                            style: {
                              color: section.id === "live" ? COLORS.red : section.color,
                              fontSize: 10,
                              lineHeight: 16,
                              fontWeight: "800",
                            },
                          },
                          `${section.id === "live" ? "⚠️" : "💡"} ${copy.note}`
                        )
                      )
                    : null
                )
              : null
          );
        })
  );
}

module.exports = HelpScreen;
module.exports.default = HelpScreen;
module.exports.HELP_SECTIONS = HELP_SECTIONS;
