const React = require('react');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const LANGUAGE_KEY = 'okai_lang';
let currentLanguage = 'en';
let installed = false;

const EN_EXACT = new Map([
  ['Bot Start Karo', 'Start Bot'],
  ['Bot Stop Karo', 'Stop Bot'],
  ['Status Refresh Karo', 'Refresh Status'],
  ['Chart Karo', 'Set Chart'],
  ['Capital Save Karo', 'Save Capital'],
  ['Login Karo', 'Login'],
  ['Account nahi hai? Register Karo →', "Don't have an account? Register →"],
  ['Live data nahi hai', 'No live data'],
  ['Abhi koi open position nahi hai.', 'No open positions currently.'],
  ['History load ho rahi hai...', 'Loading history...'],
  ['Paper capital update failed', 'Paper capital update failed'],
  ['Paper reset failed', 'Paper account reset failed'],
  ['Paper capital kam se kam ₹1000 hona chahiye.', 'Paper capital must be at least ₹1,000.'],
  ['Closed trades ke baad comparison dikhega.', 'Comparison will appear after closed trades are available.'],
  ['Comparison loading...', 'Loading comparison...'],
  ['Report abhi available nahi hai. Refresh karein.', 'The report is not available yet. Please refresh.'],
  ['NIFTY, BANKNIFTY aur SENSEX me best score select hota hai. Second trade sirf alag index me liya jayega.', 'The best score is selected across NIFTY, BANKNIFTY and SENSEX. A second trade can only be taken in a different index.'],
  ['ON kiye gaye sabhi indices har cycle scan honge. CHART sirf graph display select karta hai.', 'All enabled indices are scanned in every cycle. CHART only selects which index is displayed on the graph.'],
  ['Generated = index strategy ne banayi trades • Selected = overlap hata kar monthly result me li gayi trades', 'Generated = trades produced by the index strategy • Selected = non-overlapping trades included in the monthly result'],
  ['Monthly backtest job start ho raha hai...', 'Starting monthly backtest...'],
  ['Monthly backtest background me start ho gaya...', 'Monthly backtest started in the background...'],
  ['Broker login aur historical data prepare ho raha hai...', 'Preparing broker login and historical data...'],
  ['Monthly backtest background me chal raha hai...', 'Monthly backtest is running in the background...'],
  ['Monthly backtest abhi bhi chal raha hai. Thodi der baad dobara check karein.', 'The monthly backtest is still running. Please check again shortly.'],
  ['Real candles load ho rahi hain.', 'Loading live candles...'],
  ['Historical candles par strategy replay score prepare ho raha hai. Pull-down refresh karein.', 'Preparing strategy replay scores from historical candles. Pull down to refresh.'],
  ['Bot start hone aur real signal points aane ke baad score line dikhegi.', 'The score line will appear after the bot starts receiving live signal points.'],
  ['Closed paper trades aane ke baad cumulative profit/loss line dikhegi.', 'The cumulative profit/loss line will appear after paper trades are closed.'],
  ['Strategy score ne entry allow ki.', 'The strategy score qualified the entry.'],
  ['Detailed indicator breakdown next fresh trade se full milega.', 'A complete indicator breakdown will be available from the next fresh trade.'],
  ['PE selected: bearish setup. PE premium index neeche jane par badhta hai.', 'PE selected for a bearish setup. PE premium generally rises as the index falls.'],
  ['CE selected: bullish setup. CE premium index upar jane par badhta hai.', 'CE selected for a bullish setup. CE premium generally rises as the index rises.'],
]);

const HI_EXACT = new Map([
  ['Bot Start Karo', 'बॉट शुरू करें'],
  ['Start Bot', 'बॉट शुरू करें'],
  ['Bot Stop Karo', 'बॉट बंद करें'],
  ['Stop Bot', 'बॉट बंद करें'],
  ['Status Refresh Karo', 'स्थिति अपडेट करें'],
  ['Refresh Status', 'स्थिति अपडेट करें'],
  ['Chart Karo', 'चार्ट चुनें'],
  ['Set Chart', 'चार्ट चुनें'],
  ['Capital Save Karo', 'कैपिटल सेव करें'],
  ['Save Capital', 'कैपिटल सेव करें'],
  ['Login Karo', 'लॉगिन करें'],
  ['Login', 'लॉगिन करें'],
  ['Account nahi hai? Register Karo →', 'खाता नहीं है? रजिस्टर करें →'],
  ["Don't have an account? Register →", 'खाता नहीं है? रजिस्टर करें →'],
  ['Live data nahi hai', 'लाइव डेटा उपलब्ध नहीं है'],
  ['No live data', 'लाइव डेटा उपलब्ध नहीं है'],
  ['Abhi koi open position nahi hai.', 'फिलहाल कोई ओपन पोज़िशन नहीं है।'],
  ['No open positions currently.', 'फिलहाल कोई ओपन पोज़िशन नहीं है।'],
  ['History load ho rahi hai...', 'हिस्ट्री लोड हो रही है...'],
  ['Loading history...', 'हिस्ट्री लोड हो रही है...'],
  ['Paper capital update failed', 'पेपर कैपिटल अपडेट नहीं हो सका'],
  ['Paper reset failed', 'पेपर अकाउंट रीसेट नहीं हो सका'],
  ['Paper account reset failed', 'पेपर अकाउंट रीसेट नहीं हो सका'],
  ['Paper capital kam se kam ₹1000 hona chahiye.', 'पेपर कैपिटल कम से कम ₹1,000 होना चाहिए।'],
  ['Paper capital must be at least ₹1,000.', 'पेपर कैपिटल कम से कम ₹1,000 होना चाहिए।'],
  ['Closed trades ke baad comparison dikhega.', 'क्लोज़्ड ट्रेड उपलब्ध होने के बाद तुलना दिखाई जाएगी।'],
  ['Comparison will appear after closed trades are available.', 'क्लोज़्ड ट्रेड उपलब्ध होने के बाद तुलना दिखाई जाएगी।'],
  ['Comparison loading...', 'तुलना लोड हो रही है...'],
  ['Loading comparison...', 'तुलना लोड हो रही है...'],
  ['Report abhi available nahi hai. Refresh karein.', 'रिपोर्ट अभी उपलब्ध नहीं है। कृपया रिफ्रेश करें।'],
  ['The report is not available yet. Please refresh.', 'रिपोर्ट अभी उपलब्ध नहीं है। कृपया रिफ्रेश करें।'],
  ['NIFTY, BANKNIFTY aur SENSEX me best score select hota hai. Second trade sirf alag index me liya jayega.', 'NIFTY, BANKNIFTY और SENSEX में सबसे बेहतर स्कोर चुना जाता है। दूसरा ट्रेड केवल अलग इंडेक्स में लिया जाएगा।'],
  ['The best score is selected across NIFTY, BANKNIFTY and SENSEX. A second trade can only be taken in a different index.', 'NIFTY, BANKNIFTY और SENSEX में सबसे बेहतर स्कोर चुना जाता है। दूसरा ट्रेड केवल अलग इंडेक्स में लिया जाएगा।'],
  ['ON kiye gaye sabhi indices har cycle scan honge. CHART sirf graph display select karta hai.', 'ON किए गए सभी इंडेक्स हर साइकल में स्कैन होंगे। CHART केवल ग्राफ में दिखने वाला इंडेक्स चुनता है।'],
  ['All enabled indices are scanned in every cycle. CHART only selects which index is displayed on the graph.', 'ON किए गए सभी इंडेक्स हर साइकल में स्कैन होंगे। CHART केवल ग्राफ में दिखने वाला इंडेक्स चुनता है।'],
  ['Generated = index strategy ne banayi trades • Selected = overlap hata kar monthly result me li gayi trades', 'Generated = इंडेक्स स्ट्रेटेजी द्वारा बनाए गए ट्रेड • Selected = ओवरलैप हटाने के बाद मासिक परिणाम में शामिल ट्रेड'],
  ['Generated = trades produced by the index strategy • Selected = non-overlapping trades included in the monthly result', 'Generated = इंडेक्स स्ट्रेटेजी द्वारा बनाए गए ट्रेड • Selected = ओवरलैप हटाने के बाद मासिक परिणाम में शामिल ट्रेड'],
  ['Monthly backtest job start ho raha hai...', 'मासिक बैकटेस्ट शुरू हो रहा है...'],
  ['Starting monthly backtest...', 'मासिक बैकटेस्ट शुरू हो रहा है...'],
  ['Monthly backtest background me start ho gaya...', 'मासिक बैकटेस्ट बैकग्राउंड में शुरू हो गया है...'],
  ['Monthly backtest started in the background...', 'मासिक बैकटेस्ट बैकग्राउंड में शुरू हो गया है...'],
  ['Broker login aur historical data prepare ho raha hai...', 'ब्रोकर लॉगिन और हिस्टोरिकल डेटा तैयार किया जा रहा है...'],
  ['Preparing broker login and historical data...', 'ब्रोकर लॉगिन और हिस्टोरिकल डेटा तैयार किया जा रहा है...'],
  ['Monthly backtest background me chal raha hai...', 'मासिक बैकटेस्ट बैकग्राउंड में चल रहा है...'],
  ['Monthly backtest is running in the background...', 'मासिक बैकटेस्ट बैकग्राउंड में चल रहा है...'],
  ['Monthly backtest abhi bhi chal raha hai. Thodi der baad dobara check karein.', 'मासिक बैकटेस्ट अभी भी चल रहा है। कृपया थोड़ी देर बाद दोबारा जांचें।'],
  ['The monthly backtest is still running. Please check again shortly.', 'मासिक बैकटेस्ट अभी भी चल रहा है। कृपया थोड़ी देर बाद दोबारा जांचें।'],
  ['Real candles load ho rahi hain.', 'लाइव कैंडल्स लोड हो रही हैं।'],
  ['Loading live candles...', 'लाइव कैंडल्स लोड हो रही हैं...'],
  ['Historical candles par strategy replay score prepare ho raha hai. Pull-down refresh karein.', 'हिस्टोरिकल कैंडल्स से स्ट्रेटेजी रीप्ले स्कोर तैयार हो रहा है। नीचे खींचकर रिफ्रेश करें।'],
  ['Preparing strategy replay scores from historical candles. Pull down to refresh.', 'हिस्टोरिकल कैंडल्स से स्ट्रेटेजी रीप्ले स्कोर तैयार हो रहा है। नीचे खींचकर रिफ्रेश करें।'],
  ['Bot start hone aur real signal points aane ke baad score line dikhegi.', 'बॉट शुरू होने और लाइव सिग्नल पॉइंट मिलने के बाद स्कोर लाइन दिखाई देगी।'],
  ['The score line will appear after the bot starts receiving live signal points.', 'बॉट शुरू होने और लाइव सिग्नल पॉइंट मिलने के बाद स्कोर लाइन दिखाई देगी।'],
  ['Closed paper trades aane ke baad cumulative profit/loss line dikhegi.', 'पेपर ट्रेड क्लोज़ होने के बाद कुल प्रॉफिट/लॉस लाइन दिखाई देगी।'],
  ['The cumulative profit/loss line will appear after paper trades are closed.', 'पेपर ट्रेड क्लोज़ होने के बाद कुल प्रॉफिट/लॉस लाइन दिखाई देगी।'],
  ['Strategy score ne entry allow ki.', 'स्ट्रेटेजी स्कोर ने एंट्री की अनुमति दी।'],
  ['The strategy score qualified the entry.', 'स्ट्रेटेजी स्कोर ने एंट्री की अनुमति दी।'],
  ['Detailed indicator breakdown next fresh trade se full milega.', 'अगले नए ट्रेड से पूरा इंडिकेटर ब्रेकडाउन उपलब्ध होगा।'],
  ['A complete indicator breakdown will be available from the next fresh trade.', 'अगले नए ट्रेड से पूरा इंडिकेटर ब्रेकडाउन उपलब्ध होगा।'],
  ['PE selected: bearish setup. PE premium index neeche jane par badhta hai.', 'PE चुना गया: सेटअप मंदी का है। इंडेक्स नीचे जाने पर PE प्रीमियम सामान्यतः बढ़ता है।'],
  ['PE selected for a bearish setup. PE premium generally rises as the index falls.', 'PE चुना गया: सेटअप मंदी का है। इंडेक्स नीचे जाने पर PE प्रीमियम सामान्यतः बढ़ता है।'],
  ['CE selected: bullish setup. CE premium index upar jane par badhta hai.', 'CE चुना गया: सेटअप तेजी का है। इंडेक्स ऊपर जाने पर CE प्रीमियम सामान्यतः बढ़ता है।'],
  ['CE selected for a bullish setup. CE premium generally rises as the index rises.', 'CE चुना गया: सेटअप तेजी का है। इंडेक्स ऊपर जाने पर CE प्रीमियम सामान्यतः बढ़ता है।'],
]);

const HI_WORDS = [
  [/\bnahi\b/gi, 'नहीं'], [/\bhai\b/gi, 'है'], [/\bhaI\b/g, 'है'], [/\baur\b/gi, 'और'],
  [/\babhi\b/gi, 'अभी'], [/\bsabse\b/gi, 'सबसे'], [/\bbetter\b/gi, 'बेहतर'],
  [/\bkam\b/gi, 'कम'], [/\bloss\b/gi, 'लॉस'], [/\bprofit\b/gi, 'प्रॉफिट'],
  [/\btrade\b/gi, 'ट्रेड'], [/\btrades\b/gi, 'ट्रेड्स'], [/\bscore\b/gi, 'स्कोर'],
  [/\bavailable\b/gi, 'उपलब्ध'], [/\bloading\b/gi, 'लोड हो रहा'], [/\bupdate\b/gi, 'अपडेट'],
  [/\brefresh\b/gi, 'रिफ्रेश'], [/\bselected\b/gi, 'चुना गया'], [/\bclosed\b/gi, 'क्लोज़्ड'],
];

function professionalEnglish(text) {
  if (EN_EXACT.has(text)) return EN_EXACT.get(text);

  let out = text;
  // Known malformed server-generated explanation from the breakdown card.
  out = out.replace(/Volume data available not is;?\s*neutral score use completed\.?/gi,
    'Volume data is currently unavailable, so a neutral volume score has been applied.');
  out = out.replace(/Volume data not received,?\s*isliye score\s*([0-9]+\/[0-9]+)\s*from\s*([0-9]+\/[0-9]+)\s*on adjust completed\.?/gi,
    'Volume data was not received, so the score was normalized from $2 to $1.');
  out = out.replace(/VWAP of backup method active is;?/gi,
    'VWAP backup validation is active;');
  out = out.replace(/price-chase rules trade to block not karega\.?/gi,
    'the price-chase rule will not block this trade.');

  // Common Hinglish fragments that may come from backend reasons.
  out = out.replace(/\bisliye\b/gi, 'therefore');
  out = out.replace(/\bnahi mila\b/gi, 'was not received');
  out = out.replace(/\bnahi hai\b/gi, 'is not available');
  out = out.replace(/\babhi\b/gi, 'currently');
  out = out.replace(/\bsabse better\b/gi, 'best');
  out = out.replace(/\bsabse kam loss\b/gi, 'lowest loss');
  out = out.replace(/\baur\b/gi, 'and');
  return out;
}

function professionalHindi(text) {
  if (HI_EXACT.has(text)) return HI_EXACT.get(text);
  if (/[\u0900-\u097F]/.test(text) && !/[A-Za-z]+\s+(nahi|hai|aur|abhi|karo|isliye)\b/i.test(text)) {
    return text;
  }

  let out = text;
  out = out.replace(/Volume data available not is;?\s*neutral score use completed\.?/gi,
    'वॉल्यूम डेटा फिलहाल उपलब्ध नहीं है, इसलिए न्यूट्रल वॉल्यूम स्कोर लागू किया गया है।');
  out = out.replace(/Volume data not received,?\s*isliye score\s*([0-9]+\/[0-9]+)\s*from\s*([0-9]+\/[0-9]+)\s*on adjust completed\.?/gi,
    'वॉल्यूम डेटा नहीं मिला, इसलिए स्कोर को $2 से $1 के अनुसार एडजस्ट किया गया है।');
  out = out.replace(/VWAP of backup method active is;?/gi,
    'VWAP बैकअप वैलिडेशन सक्रिय है;');
  out = out.replace(/price-chase rules trade to block not karega\.?/gi,
    'प्राइस-चेज़ नियम इस ट्रेड को ब्लॉक नहीं करेगा।');

  // Professionalize common mixed fragments while preserving technical terms.
  out = out.replace(/\bisliye\b/gi, 'इसलिए');
  out = out.replace(/\bkaro\b/gi, 'करें');
  out = out.replace(/\bkarein\b/gi, 'करें');
  out = out.replace(/\bho raha hai\b/gi, 'हो रहा है');
  out = out.replace(/\bho rahi hai\b/gi, 'हो रही है');
  out = out.replace(/\bho gaya\b/gi, 'हो गया');
  out = out.replace(/\bdobara\b/gi, 'दोबारा');
  out = out.replace(/\bthodi der baad\b/gi, 'थोड़ी देर बाद');
  out = out.replace(/\bme\b/gi, 'में');
  out = out.replace(/\bpar\b/gi, 'पर');
  out = out.replace(/\bsirf\b/gi, 'केवल');
  out = out.replace(/\balag\b/gi, 'अलग');
  out = out.replace(/\bliya jayega\b/gi, 'लिया जाएगा');
  HI_WORDS.forEach(([pattern, replacement]) => { out = out.replace(pattern, replacement); });
  return out;
}

function normalizeText(text) {
  if (typeof text !== 'string' || !text.trim()) return text;
  return currentLanguage === 'hi' ? professionalHindi(text) : professionalEnglish(text);
}

function normalizeChildren(value) {
  if (typeof value === 'string') return normalizeText(value);
  if (Array.isArray(value)) return value.map(normalizeChildren);
  return value;
}

function installAsyncStorageLanguageSync() {
  try {
    AsyncStorage.getItem(LANGUAGE_KEY).then((value) => {
      if (value === 'hi' || value === 'en') currentLanguage = value;
    }).catch(() => {});

    if (!AsyncStorage.__OKAI_LANGUAGE_SYNC_PATCHED__) {
      const previousSetItem = AsyncStorage.setItem.bind(AsyncStorage);
      AsyncStorage.setItem = async function okaiLanguageSetItem(key, value, ...rest) {
        if (key === LANGUAGE_KEY && (value === 'hi' || value === 'en')) {
          currentLanguage = value;
        }
        return previousSetItem(key, value, ...rest);
      };
      AsyncStorage.__OKAI_LANGUAGE_SYNC_PATCHED__ = true;
    }
  } catch (_) {}
}

function installCreateElementPatch() {
  if (React.__OKAI_PRO_LANGUAGE_CREATE_PATCHED__) return;
  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiProfessionalLanguageCreateElement(type, props, ...children) {
    if (type && (type.displayName === 'Text' || type.name === 'Text')) {
      children = children.map(normalizeChildren);
      if (props && typeof props.children === 'string') {
        props = { ...props, children: normalizeText(props.children) };
      }
    }
    return previousCreateElement(type, props, ...children);
  };
  React.__OKAI_PRO_LANGUAGE_CREATE_PATCHED__ = true;
}

function installJsxRuntimePatch() {
  try {
    const jsxRuntime = require('react/jsx-runtime');
    if (jsxRuntime.__OKAI_PRO_LANGUAGE_PATCHED__) return;
    ['jsx', 'jsxs'].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== 'function') return;
      jsxRuntime[key] = function okaiProfessionalLanguageJsx(type, props, reactKey) {
        if (type && (type.displayName === 'Text' || type.name === 'Text') && props?.children != null) {
          props = { ...props, children: normalizeChildren(props.children) };
        }
        return previous(type, props, reactKey);
      };
    });
    jsxRuntime.__OKAI_PRO_LANGUAGE_PATCHED__ = true;
  } catch (_) {}
}

function installProfessionalLanguagePatch() {
  if (installed) return;
  installed = true;
  installAsyncStorageLanguageSync();
  installCreateElementPatch();
  installJsxRuntimePatch();
}

module.exports = {
  installProfessionalLanguagePatch,
  professionalEnglish,
  professionalHindi,
  normalizeText,
};
