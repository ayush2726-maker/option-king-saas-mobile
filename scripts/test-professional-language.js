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
expect("NIFTY", "hi", "NIFTY");
expect("ayush@example.com", "hi", "ayush@example.com");
expect("₹1,999.00", "hi", "₹1,999.00");

const hindiSamples = [
  "Login Karo",
  "Server se connect nahi ho paya",
  "Credentials Save Karo",
  "Signal load ho raha hai...",
  "Apna plan choose karo",
  "Bot start/stop, signal, strategy save aur backtest result Telegram par bhejo.",
  "Options/derivatives me poora trading capital loss ho sakta hai.",
  "Main options trading ka high risk, poore capital ke loss ka risk, aur no-profit-guarantee rule samajhta/samajhti hoon.",
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
];

englishSamples.forEach((source) => {
  const output = localizeText(source, "en");
  assert(
    !/[\u0900-\u097F]/.test(output),
    `English output must not contain Devanagari: ${source} -> ${output}`
  );
});

console.log("PASS OKAI-PROFESSIONAL-BILINGUAL-UI");
