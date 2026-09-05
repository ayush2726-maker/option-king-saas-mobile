const assert = require("assert");
const { localizeText } = require("../src/i18n/professionalLocalizer");

function expect(source, language, expected) {
  const actual = localizeText(source, language);
  assert.strictEqual(
    actual,
    expected,
    `${language} translation mismatch for ${JSON.stringify(source)}\nExpected: ${expected}\nActual: ${actual}`
  );
}

expect("Login Karo", "hi", "लॉगिन करें");
expect("Login Karo", "en", "Log in");
expect("Server se connect nahi ho paya", "hi", "सर्वर से कनेक्ट नहीं हो पाया");
expect("Server se connect nahi ho paya", "en", "Could not connect to the server");
expect("Trade History", "hi", "ट्रेड इतिहास");
expect("Trade History", "en", "Trade History");
expect("Signal load ho raha hai...", "hi", "सिग्नल लोड हो रहा है...");
expect("Signal load ho raha hai...", "en", "Loading the signal...");
expect("Credentials Save Karo", "hi", "क्रेडेंशियल सुरक्षित करें");
expect("Credentials Save Karo", "en", "Save Credentials");
expect("Trial 2 din me khatam hoga — ₹1,999/month", "hi", "परीक्षण अवधि 2 दिन में समाप्त होगी — ₹1,999/माह");
expect("Trial 2 din me khatam hoga — ₹1,999/month", "en", "Trial ends in 2 days — ₹1,999/month");
expect("Options/derivatives me poora trading capital loss ho sakta hai.", "hi", "ऑप्शन और डेरिवेटिव ट्रेडिंग में पूरी ट्रेडिंग पूँजी का नुकसान हो सकता है।");
expect("Options/derivatives me poora trading capital loss ho sakta hai.", "en", "Options and derivatives can cause loss of the entire trading capital.");
expect("Main confirm karta/karti hoon ki meri age 18 saal ya usse zyada hai.", "hi", "मैं पुष्टि करता/करती हूँ कि मेरी आयु 18 वर्ष या उससे अधिक है।");
expect("Main confirm karta/karti hoon ki meri age 18 saal ya usse zyada hai.", "en", "I confirm that I am at least 18 years old.");
expect("Exact option outcomes collect ho rahe hain. 300 valid samples ke baad validated adaptive model shadow mode me active hoga.", "hi", "सटीक ऑप्शन परिणाम एकत्र किए जा रहे हैं। 300 मान्य नमूनों के बाद सत्यापित अनुकूली मॉडल शैडो मोड में सक्रिय होगा।");
expect("Exact option outcomes collect ho rahe hain. 300 valid samples ke baad validated adaptive model shadow mode me active hoga.", "en", "Exact option outcomes are being collected. The validated adaptive model will activate in shadow mode after 300 valid samples.");
expect("✅ Strategy save ho gayi. Weights 100 me normalize ho gaye.", "hi", "✅ रणनीति सुरक्षित हो गई। वेट 100 के आधार पर सामान्यीकृत हो गए।");
expect("✅ Strategy save ho gayi. Weights 100 me normalize ho gaye.", "en", "✅ Strategy saved. Enabled weights were normalized to 100.");
expect("App create karne se API Key, Secret aur daily Access Token OKAI me save karne tak poora process.", "hi", "ऐप बनाने से लेकर API कुंजी, सीक्रेट और दैनिक एक्सेस टोकन को OKAI में सुरक्षित करने तक की पूरी प्रक्रिया।");
expect("App create karne se API Key, Secret aur daily Access Token OKAI me save karne tak poora process.", "en", "Complete process from creating the app to saving the API key, secret, and daily access token in OKAI.");
expect("Registered naam aur mobile number daalo", "hi", "पंजीकृत नाम और मोबाइल नंबर दर्ज करें");
expect("Registered naam aur mobile number daalo", "en", "Enter the registered name and mobile number");
expect("Angel One LIVE orders आपके अपने static-IP phone/desktop से जाएंगे।", "hi", "Angel One के लाइव ऑर्डर आपके अपने स्थिर-IP फ़ोन या डेस्कटॉप से भेजे जाएँगे।");
expect("Angel One LIVE orders आपके अपने static-IP phone/desktop से जाएंगे।", "en", "Angel One LIVE orders leave from your own static-IP phone or desktop.");
expect("SELECTED DATA & ORDER BROKER", "hi", "चयनित डेटा और ऑर्डर ब्रोकर");
expect("SELECTED DATA & ORDER BROKER", "en", "SELECTED DATA & ORDER BROKER");
expect("Broker: Angel One", "hi", "ब्रोकर: Angel One");
expect("Broker: Angel One", "en", "Broker: Angel One");
expect("Angel One will now be used by the bot, paper/live data and backtests. Start Bot again.", "hi", "Angel One अब बॉट, पेपर/लाइव डेटा और बैकटेस्ट के लिए उपयोग होगा। बॉट को दोबारा प्रारंभ करें।");
expect("Angel One will now be used by the bot, paper/live data and backtests. Start Bot again.", "en", "Angel One will now be used by the bot, paper/live data, and backtests. Start the bot again.");
expect("NIFTY", "hi", "NIFTY");
expect("ayush@example.com", "hi", "ayush@example.com");
expect("₹1,999.00", "hi", "₹1,999.00");
expect("Live Trading Setup", "hi", "लाइव ट्रेडिंग सेटअप");
expect("Live Trading Setup", "en", "Live Trading Setup");
expect(
  "Tap any step to open it. The next step's status will update automatically.",
  "hi",
  "किसी भी चरण को खोलने के लिए उस पर टैप करें। अगले चरण की स्थिति अपने-आप अपडेट हो जाएगी।"
);
expect(
  "Tap any step to open it. The next step's status will update automatically.",
  "en",
  "Tap any step to open it. The next step's status will update automatically."
);
expect("4 days remaining", "hi", "4 दिन शेष");
expect("4 days remaining", "en", "4 days remaining");
expect("2 trial days remaining", "hi", "ट्रायल के 2 दिन शेष");
expect("2 trial days remaining", "en", "2 trial days remaining");
expect(
  "Broker connected: angelone. You can now test Paper Trading.",
  "hi",
  "ब्रोकर कनेक्ट है: angelone। अब आप पेपर ट्रेडिंग की जाँच कर सकते हैं।"
);
expect(
  "Broker connected: angelone. You can now test Paper Trading.",
  "en",
  "Broker connected: angelone. You can now test Paper Trading."
);
expect("Set Up Secure Connection", "hi", "सुरक्षित कनेक्शन सेट करें");
expect("Set Up Secure Connection", "en", "Set Up Secure Connection");
expect("Safety Rule", "hi", "सुरक्षा नियम");
expect("Safety Rule", "en", "Safety Rule");
expect("Allocate My Secure IP", "hi", "मेरा सुरक्षित IP आवंटित करें");
expect("Allocate My Secure IP", "en", "Allocate My Secure IP");
expect("Starting Secure Setup...", "hi", "सुरक्षित सेटअप शुरू हो रहा है...");
expect("Provisioning in Progress", "hi", "सुरक्षित IP तैयार हो रहा है");
expect("Provisioning status: not requested", "hi", "सुरक्षित IP की स्थिति: अनुरोध नहीं किया गया");
expect("Provisioning status: allocating", "hi", "सुरक्षित IP की स्थिति: IP आवंटित हो रहा है");
expect("Provisioning status: ready", "hi", "सुरक्षित IP की स्थिति: तैयार");
expect(
  "This page could not be opened. Please refresh the app and try again.",
  "hi",
  "यह पेज नहीं खुल पाया। ऐप रीफ़्रेश करके दोबारा प्रयास करें।"
);

const hindiSamples = [
  "Login Karo",
  "Server se connect nahi ho paya",
  "Credentials Save Karo",
  "Signal load ho raha hai...",
  "Apna plan choose karo",
  "Bot start/stop, signal, strategy save aur backtest result Telegram par bhejo.",
  "Options/derivatives me poora trading capital loss ho sakta hai.",
  "Main options trading ka high risk, poore capital ke loss ka risk, aur no-profit-guarantee rule samajhta/samajhti hoon.",
  "✅ Strategy save ho gayi. Weights 100 me normalize ho gaye.",
  "App create karne se API Key, Secret aur daily Access Token OKAI me save karne tak poora process.",
  "Registered naam aur mobile number daalo",
  "Angel One LIVE orders आपके अपने static-IP phone/desktop से जाएंगे।",
  "SELECTED DATA & ORDER BROKER",
  "Broker: Angel One",
];

hindiSamples.forEach((source) => {
  const output = localizeText(source, "hi");
  assert(
    /[\u0900-\u097F]/.test(output),
    `Hindi output must use Devanagari: ${source} -> ${output}`
  );
});

const englishSamples = [
  "Login Karo",
  "Server se connect nahi ho paya",
  "Signal load ho raha hai...",
  "Apna plan choose karo",
  "Koi user nahi mila",
  "Options/derivatives me poora trading capital loss ho sakta hai.",
  "Maine Privacy Notice padhkar service aur audit ke liye zaroori data processing accept ki hai.",
  "✅ Strategy save ho gayi. Weights 100 me normalize ho gaye.",
  "Registered naam aur mobile number daalo",
  "Angel One LIVE orders आपके अपने static-IP phone/desktop से जाएंगे।",
  "SELECTED DATA & ORDER BROKER",
  "Broker: Angel One",
];

englishSamples.forEach((source) => {
  const output = localizeText(source, "en");
  assert(
    !/[\u0900-\u097F]/.test(output),
    `English output must not contain Devanagari: ${source} -> ${output}`
  );
});

console.log("PASS OKAI-PROFESSIONAL-BILINGUAL-UI");
