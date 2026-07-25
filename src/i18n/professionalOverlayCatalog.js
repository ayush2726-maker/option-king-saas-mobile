const EXACT = {
  "Select Broker": { hi: "ब्रोकर चुनें", en: "Select Broker" },
  "SELECTED DATA & ORDER BROKER": {
    hi: "चयनित डेटा और ऑर्डर ब्रोकर",
    en: "SELECTED DATA & ORDER BROKER"
  },
  "SELECTED": { hi: "चयनित", en: "SELECTED" },
  "USE": { hi: "उपयोग करें", en: "USE" },
  "Broker Selected": { hi: "ब्रोकर चुना गया", en: "Broker Selected" },
  "Broker Switch Failed": { hi: "ब्रोकर बदलना असफल रहा", en: "Broker Switch Failed" },
  "Broker login could not be verified.": {
    hi: "ब्रोकर लॉगिन सत्यापित नहीं हो पाया।",
    en: "Broker login could not be verified."
  },
  "Server or broker connection could not be verified.": {
    hi: "सर्वर या ब्रोकर कनेक्शन सत्यापित नहीं हो पाया।",
    en: "Server or broker connection could not be verified."
  }
};

const DYNAMIC = [
  {
    re: /^Broker:\s*(.+)$/i,
    hi: (match) => `ब्रोकर: ${match[1]}`,
    en: (match) => `Broker: ${match[1]}`
  },
  {
    re: /^(.+) will now be used by the bot, paper\/live data and backtests\. Start Bot again\.$/i,
    hi: (match) => `${match[1]} अब बॉट, पेपर/लाइव डेटा और बैकटेस्ट के लिए उपयोग होगा। बॉट को दोबारा प्रारंभ करें।`,
    en: (match) => `${match[1]} will now be used by the bot, paper/live data, and backtests. Start the bot again.`
  }
];

function localizeOverlayText(value, language) {
  if (typeof value !== "string") return null;
  const lang = language === "hi" ? "hi" : "en";
  const text = value.trim();
  const exact = EXACT[text];
  if (exact) return exact[lang] || exact.en || text;

  for (const rule of DYNAMIC) {
    const match = text.match(rule.re);
    if (match) return rule[lang](match);
  }

  return null;
}

module.exports = {
  EXACT,
  localizeOverlayText,
};
