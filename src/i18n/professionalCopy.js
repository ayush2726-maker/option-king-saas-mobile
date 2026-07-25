const BRAND_TOKENS = new Set([
  "Option King AI", "Angel One", "Angel", "Upstox", "Zerodha", "Razorpay",
  "NIFTY", "BANKNIFTY", "SENSEX", "CE", "PE", "API", "OTP", "TOTP",
  "MPIN", "JWT", "AES-256", "SSL", "P&L", "ADX", "RSI", "ATR", "VWAP",
  "MTF", "TQU", "IV", "OI", "PCR", "SEBI", "Railway", "Telegram",
  "WhatsApp", "Kite", "Expo", "EAS", "SaaS"
]);

const COPY = {
  "Fatal Crash Caught": { hi: "गंभीर ऐप त्रुटि", en: "Fatal App Error" },
  "Error Caught": { hi: "ऐप त्रुटि", en: "App Error" },
  "App Error": { hi: "ऐप त्रुटि", en: "App Error" },
  "Login ke baad dashboard me error aaya. Is error ka screenshot bhejo:": {
    hi: "लॉगिन के बाद डैशबोर्ड में त्रुटि आई है। कृपया इस स्क्रीन का स्क्रीनशॉट भेजें:",
    en: "An error occurred on the dashboard after login. Please send a screenshot of this screen:"
  },
  "Unknown error": { hi: "अज्ञात त्रुटि", en: "Unknown error" },
  "SaaS Trading Platform": { hi: "सास ट्रेडिंग प्लेटफ़ॉर्म", en: "SaaS Trading Platform" },
  "Email": { hi: "ईमेल", en: "Email" },
  "Email *": { hi: "ईमेल *", en: "Email *" },
  "Password": { hi: "पासवर्ड", en: "Password" },
  "New Password *": { hi: "नया पासवर्ड *", en: "New Password *" },
  "Confirm New Password *": { hi: "नए पासवर्ड की पुष्टि *", en: "Confirm New Password *" },
  "New Password Confirm *": { hi: "नए पासवर्ड की पुष्टि *", en: "Confirm New Password *" },
  "Login": { hi: "लॉगिन करें", en: "Log in" },
  "Login Karo": { hi: "लॉगिन करें", en: "Log in" },
  "Register": { hi: "पंजीकरण करें", en: "Register" },
  "Register Karo": { hi: "पंजीकरण करें", en: "Register" },
  "Forgot Login ID": { hi: "लॉगिन आईडी भूल गए?", en: "Forgot Login ID?" },
  "Forgot Password": { hi: "पासवर्ड भूल गए?", en: "Forgot Password?" },
  "Account nahi hai? Register Karo →": { hi: "खाता नहीं है? पंजीकरण करें →", en: "Don't have an account? Register →" },
  "Don't have an account? Register →": { hi: "खाता नहीं है? पंजीकरण करें →", en: "Don't have an account? Register →" },
  "Login fail ho gaya": { hi: "लॉगिन असफल रहा", en: "Login failed" },
  "Login failed": { hi: "लॉगिन असफल रहा", en: "Login failed" },
  "Server se connect nahi ho paya": { hi: "सर्वर से कनेक्ट नहीं हो पाया", en: "Could not connect to the server" },
  "Could not connect to server": { hi: "सर्वर से कनेक्ट नहीं हो पाया", en: "Could not connect to the server" },
  "Valid email daalo": { hi: "मान्य ईमेल दर्ज करें", en: "Enter a valid email" },
  "Enter a valid email": { hi: "मान्य ईमेल दर्ज करें", en: "Enter a valid email" },
  "OTP email par bhej diya gaya": { hi: "ओटीपी ईमेल पर भेज दिया गया है", en: "OTP sent to your email" },
  "OTP sent to your email": { hi: "ओटीपी ईमेल पर भेज दिया गया है", en: "OTP sent to your email" },
  "Email OTP send nahi hua": { hi: "ईमेल ओटीपी नहीं भेजा जा सका", en: "Could not send the email OTP" },
  "6-digit OTP daalo": { hi: "6 अंकों का ओटीपी दर्ज करें", en: "Enter the 6-digit OTP" },
  "Enter the 6-digit OTP": { hi: "6 अंकों का ओटीपी दर्ज करें", en: "Enter the 6-digit OTP" },
  "Email verify ho gaya": { hi: "ईमेल सत्यापित हो गया", en: "Email verified successfully" },
  "Email verified successfully": { hi: "ईमेल सत्यापित हो गया", en: "Email verified successfully" },
  "Email verify nahi hua": { hi: "ईमेल सत्यापित नहीं हो पाया", en: "Email verification failed" },
  "Passwords match nahi karte": { hi: "दोनों पासवर्ड मेल नहीं खाते", en: "Passwords do not match" },
  "Passwords do not match": { hi: "दोनों पासवर्ड मेल नहीं खाते", en: "Passwords do not match" },
  "Password kam se kam 6 characters": { hi: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए", en: "Password must be at least 6 characters" },
  "Password must be at least 6 characters": { hi: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए", en: "Password must be at least 6 characters" },
  "Valid WhatsApp number daalo": { hi: "मान्य व्हाट्सऐप नंबर दर्ज करें", en: "Enter a valid WhatsApp number" },
  "Enter a valid WhatsApp number": { hi: "मान्य व्हाट्सऐप नंबर दर्ज करें", en: "Enter a valid WhatsApp number" },
  "Registration ke liye sabhi mandatory acknowledgements accept karo": {
    hi: "पंजीकरण के लिए सभी अनिवार्य सहमतियाँ स्वीकार करें",
    en: "Accept all mandatory acknowledgements to register"
  },
  "Accept all mandatory acknowledgements to register": {
    hi: "पंजीकरण के लिए सभी अनिवार्य सहमतियाँ स्वीकार करें",
    en: "Accept all mandatory acknowledgements to register"
  },
  "Register karne se pehle email OTP verify karo": { hi: "पंजीकरण से पहले ईमेल ओटीपी सत्यापित करें", en: "Verify the email OTP before registration" },
  "Verify the email OTP before registration": { hi: "पंजीकरण से पहले ईमेल ओटीपी सत्यापित करें", en: "Verify the email OTP before registration" },
  "Registration fail ho gaya": { hi: "पंजीकरण असफल रहा", en: "Registration failed" },
  "Registration failed": { hi: "पंजीकरण असफल रहा", en: "Registration failed" },
  "← Wapas Login": { hi: "← लॉगिन पर वापस जाएँ", en: "← Back to Login" },
  "← Back to Login": { hi: "← लॉगिन पर वापस जाएँ", en: "← Back to Login" },
  "Naam *": { hi: "नाम *", en: "Name *" },
  "Name *": { hi: "नाम *", en: "Name *" },
  "Aapka poora naam": { hi: "अपना पूरा नाम दर्ज करें", en: "Your full name" },
  "Your full name": { hi: "अपना पूरा नाम दर्ज करें", en: "Your full name" },
  "aapka@email.com": { hi: "आपका@email.com", en: "your@email.com" },
  "aapki@email.com": { hi: "आपका@email.com", en: "your@email.com" },
  "your@email.com": { hi: "आपका@email.com", en: "your@email.com" },
  "✅ Email Verified": { hi: "✅ ईमेल सत्यापित", en: "✅ Email Verified" },
  "✉️ Email OTP Verification": { hi: "✉️ ईमेल ओटीपी सत्यापन", en: "✉️ Email OTP Verification" },
  "Resend Email OTP": { hi: "ईमेल ओटीपी दोबारा भेजें", en: "Resend Email OTP" },
  "Send Email OTP": { hi: "ईमेल ओटीपी भेजें", en: "Send Email OTP" },
  "6-digit Email OTP": { hi: "6 अंकों का ईमेल ओटीपी", en: "6-digit Email OTP" },
  "Verify Email": { hi: "ईमेल सत्यापित करें", en: "Verify Email" },
  "Email OTP service setup ho rahi hai; mobile verification abhi required nahi hai.": {
    hi: "ईमेल ओटीपी सेवा तैयार की जा रही है; फिलहाल मोबाइल सत्यापन आवश्यक नहीं है।",
    en: "The email OTP service is being configured; mobile verification is not currently required."
  },
  "WhatsApp Number *": { hi: "व्हाट्सऐप नंबर *", en: "WhatsApp Number *" },
  "10 digit mobile number": { hi: "10 अंकों का मोबाइल नंबर", en: "10-digit mobile number" },
  "10-digit mobile number": { hi: "10 अंकों का मोबाइल नंबर", en: "10-digit mobile number" },
  "Kam se kam 6 characters": { hi: "कम से कम 6 अक्षर", en: "At least 6 characters" },
  "At least 6 characters": { hi: "कम से कम 6 अक्षर", en: "At least 6 characters" },
  "Password dobara daalo": { hi: "पासवर्ड दोबारा दर्ज करें", en: "Re-enter password" },
  "Re-enter password": { hi: "पासवर्ड दोबारा दर्ज करें", en: "Re-enter password" },
  "⚠️ Risk & Rules Acknowledgement": { hi: "⚠️ जोखिम एवं नियमों की सहमति", en: "⚠️ Risk & Rules Acknowledgement" },
  "Risk & Rules Acknowledgement": { hi: "जोखिम एवं नियमों की सहमति", en: "Risk & Rules Acknowledgement" },
  "Register karne se pehle har point padhkar alag se agree karna mandatory hai.": {
    hi: "पंजीकरण से पहले प्रत्येक बिंदु पढ़कर अलग से सहमति देना अनिवार्य है।",
    en: "Read each point and accept it separately before registration."
  },
  "Read each point and accept it separately before registration.": {
    hi: "पंजीकरण से पहले प्रत्येक बिंदु पढ़कर अलग से सहमति देना अनिवार्य है।",
    en: "Read each point and accept it separately before registration."
  },
  "MANDATORY": { hi: "अनिवार्य", en: "MANDATORY" },
  "▲ Detailed risk points band karo": { hi: "▲ विस्तृत जोखिम बिंदु छिपाएँ", en: "▲ Hide detailed risk points" },
  "▲ Hide detailed risk points": { hi: "▲ विस्तृत जोखिम बिंदु छिपाएँ", en: "▲ Hide detailed risk points" },
  "▼ Detailed risk points padho": { hi: "▼ विस्तृत जोखिम बिंदु पढ़ें", en: "▼ Read detailed risk points" },
  "▼ Read detailed risk points": { hi: "▼ विस्तृत जोखिम बिंदु पढ़ें", en: "▼ Read detailed risk points" },
  "7 Din Free Trial": { hi: "7 दिन का निःशुल्क परीक्षण", en: "7-Day Free Trial" },
  "7-Day Free Trial": { hi: "7 दिन का निःशुल्क परीक्षण", en: "7-Day Free Trial" },
  "Register karo aur 7 din tak bilkul free use karo — koi credit card nahi": {
    hi: "पंजीकरण करें और 7 दिनों तक निःशुल्क उपयोग करें — क्रेडिट कार्ड आवश्यक नहीं है",
    en: "Register and use it completely free for 7 days — no credit card needed"
  },
  "Register and use it completely free for 7 days — no credit card needed": {
    hi: "पंजीकरण करें और 7 दिनों तक निःशुल्क उपयोग करें — क्रेडिट कार्ड आवश्यक नहीं है",
    en: "Register and use it completely free for 7 days — no credit card needed"
  },
  "Trade Quality Score": { hi: "ट्रेड गुणवत्ता स्कोर", en: "Trade Quality Score" },
  "TQU Indicators": { hi: "टीक्यूयू संकेतक", en: "TQU Indicators" },
  "ADX (Trend Strength)": { hi: "ADX (ट्रेंड की मजबूती)", en: "ADX (Trend Strength)" },
  "Volume Ratio": { hi: "वॉल्यूम अनुपात", en: "Volume Ratio" },
  "Multi-Timeframe (5m)": { hi: "मल्टी-टाइमफ्रेम (5 मिनट)", en: "Multi-Timeframe (5m)" },
  "STRONG": { hi: "मजबूत", en: "STRONG" },
  "WEAK": { hi: "कमज़ोर", en: "WEAK" },
  "HIGH": { hi: "उच्च", en: "HIGH" },
  "LOW": { hi: "कम", en: "LOW" },
  "CONFIRMED": { hi: "पुष्टि हुई", en: "CONFIRMED" },
  "WARNING": { hi: "चेतावनी", en: "WARNING" },
  "✅ 5-minute candle confirms signal": { hi: "✅ 5 मिनट की कैंडल सिग्नल की पुष्टि करती है", en: "✅ The 5-minute candle confirms the signal" },
  "⚠️ MTF weak — trade with caution": { hi: "⚠️ MTF कमज़ोर है — सावधानी से ट्रेड करें", en: "⚠️ MTF is weak — trade with caution" },
  "Score Breakdown": { hi: "स्कोर विवरण", en: "Score Breakdown" },
  "Base Signal": { hi: "मूल सिग्नल", en: "Base Signal" },
  "ADX Bonus": { hi: "ADX बोनस", en: "ADX Bonus" },
  "Volume Bonus": { hi: "वॉल्यूम बोनस", en: "Volume Bonus" },
  "MTF Bonus": { hi: "MTF बोनस", en: "MTF Bonus" },
  "Market Regime": { hi: "मार्केट स्थिति", en: "Market Regime" },
  "Signal load ho raha hai...": { hi: "सिग्नल लोड हो रहा है...", en: "Loading the signal..." },
  "🔍 Signal dhundh raha hai...": { hi: "🔍 सिग्नल खोजा जा रहा है...", en: "🔍 Searching for a signal..." },
  "📴 Koi active trade nahi": { hi: "📴 कोई सक्रिय ट्रेड नहीं है", en: "📴 No active trade" },
  "Aaj Ka Performance": { hi: "आज का प्रदर्शन", en: "Today's Performance" },
  "Today's Performance": { hi: "आज का प्रदर्शन", en: "Today's Performance" },
  "Total Trades": { hi: "कुल ट्रेड", en: "Total Trades" },
  "Winners": { hi: "लाभ वाले ट्रेड", en: "Winning Trades" },
  "Total P&L": { hi: "कुल P&L", en: "Total P&L" },
  "Capital Used": { hi: "उपयोग की गई पूँजी", en: "Capital Used" },
  "Broker Connect Karo": { hi: "ब्रोकर कनेक्ट करें", en: "Connect Broker" },
  "Connect Broker": { hi: "ब्रोकर कनेक्ट करें", en: "Connect Broker" },
  "Broker": { hi: "ब्रोकर", en: "Broker" },
  "Aapka Angel One Client ID": { hi: "अपना Angel One क्लाइंट आईडी दर्ज करें", en: "Your Angel One Client ID" },
  "Your Angel One Client ID": { hi: "अपना Angel One क्लाइंट आईडी दर्ज करें", en: "Your Angel One Client ID" },
  "TOTP Secret (Authenticator se)": { hi: "TOTP सीक्रेट (ऑथेंटिकेटर से)", en: "TOTP Secret (from Authenticator)" },
  "TOTP Secret (from Authenticator)": { hi: "TOTP सीक्रेट (ऑथेंटिकेटर से)", en: "TOTP Secret (from Authenticator)" },
  "Upstox Developer Apps ka API Key": { hi: "Upstox डेवलपर ऐप्स की API कुंजी", en: "Upstox Developer Apps API Key" },
  "Upstox Developer Apps ka API Secret": { hi: "Upstox डेवलपर ऐप्स का API सीक्रेट", en: "Upstox Developer Apps API Secret" },
  "Generate kiya hua standard Access Token": { hi: "जनरेट किया हुआ मानक एक्सेस टोकन", en: "Generated standard access token" },
  "Broker settings endpoint missing": { hi: "ब्रोकर सेटिंग्स सेवा उपलब्ध नहीं है", en: "Broker settings service is unavailable" },
  "✅ Broker credentials save ho gaye!": { hi: "✅ ब्रोकर क्रेडेंशियल सुरक्षित हो गए", en: "✅ Broker credentials saved" },
  "✅ Broker credentials saved!": { hi: "✅ ब्रोकर क्रेडेंशियल सुरक्षित हो गए", en: "✅ Broker credentials saved" },
  "Save nahi ho paya": { hi: "सुरक्षित नहीं हो पाया", en: "Save failed" },
  "Save failed": { hi: "सुरक्षित नहीं हो पाया", en: "Save failed" },
  "Server error": { hi: "सर्वर त्रुटि", en: "Server error" },
  "Credentials Save Karo": { hi: "क्रेडेंशियल सुरक्षित करें", en: "Save Credentials" },
  "Save Credentials": { hi: "क्रेडेंशियल सुरक्षित करें", en: "Save Credentials" },
  "Test Broker Connection": { hi: "ब्रोकर कनेक्शन जाँचें", en: "Test Broker Connection" },
  "Connection test fail ho gaya": { hi: "कनेक्शन परीक्षण असफल रहा", en: "Connection test failed" },
  "Connection test failed": { hi: "कनेक्शन परीक्षण असफल रहा", en: "Connection test failed" },
  "Zerodha token missing ya expire ho gaya hai. Naya access token generate karein.": {
    hi: "Zerodha टोकन उपलब्ध नहीं है या समाप्त हो गया है। नया एक्सेस टोकन जनरेट करें।",
    en: "The Zerodha token is missing or expired. Generate a new access token."
  },
  "Zerodha token missing or expired. Please generate a new access token.": {
    hi: "Zerodha टोकन उपलब्ध नहीं है या समाप्त हो गया है। नया एक्सेस टोकन जनरेट करें।",
    en: "The Zerodha token is missing or expired. Generate a new access token."
  },
  "🔒 Security": { hi: "🔒 सुरक्षा", en: "🔒 Security" },
  "Security": { hi: "सुरक्षा", en: "Security" },
  "Credentials encrypted store hote hain": { hi: "क्रेडेंशियल एन्क्रिप्ट होकर सुरक्षित रहते हैं", en: "Credentials are stored encrypted" },
  "Credentials are stored encrypted": { hi: "क्रेडेंशियल एन्क्रिप्ट होकर सुरक्षित रहते हैं", en: "Credentials are stored encrypted" },
  "Har request authenticated hai": { hi: "हर अनुरोध प्रमाणित होता है", en: "Every request is authenticated" },
  "Every request is authenticated": { hi: "हर अनुरोध प्रमाणित होता है", en: "Every request is authenticated" },
  "Kabhi plain text save nahi hota": { hi: "प्लेन टेक्स्ट कभी सुरक्षित नहीं किया जाता", en: "Plain text is never saved" },
  "Plain text is never saved": { hi: "प्लेन टेक्स्ट कभी सुरक्षित नहीं किया जाता", en: "Plain text is never saved" },
  "Markets / Instruments": { hi: "मार्केट / इंस्ट्रूमेंट", en: "Markets / Instruments" },
  "Bot, strategy aur backtest ke liye market select karo.": { hi: "बॉट, रणनीति और बैकटेस्ट के लिए मार्केट चुनें।", en: "Select markets for the bot, strategy, and backtest." },
  "Select markets for bot, strategy, and backtest.": { hi: "बॉट, रणनीति और बैकटेस्ट के लिए मार्केट चुनें।", en: "Select markets for the bot, strategy, and backtest." },
  "PRIMARY": { hi: "प्राथमिक", en: "PRIMARY" },
  "Primary Instrument": { hi: "प्राथमिक इंस्ट्रूमेंट", en: "Primary Instrument" },
  "Save Markets": { hi: "मार्केट सुरक्षित करें", en: "Save Markets" },
  "Markets save ho gaye": { hi: "मार्केट सेटिंग्स सुरक्षित हो गईं", en: "Markets saved" },
  "Markets saved": { hi: "मार्केट सेटिंग्स सुरक्षित हो गईं", en: "Markets saved" },
  "Markets save failed": { hi: "मार्केट सेटिंग्स सुरक्षित नहीं हो सकीं", en: "Could not save market settings" },
  "Loading...": { hi: "लोड हो रहा है...", en: "Loading..." },
  "Markets": { hi: "मार्केट", en: "Markets" },
  "⚠️ Live Trading Note": { hi: "⚠️ लाइव ट्रेडिंग सूचना", en: "⚠️ Live Trading Note" },
  "Live Trading Note": { hi: "लाइव ट्रेडिंग सूचना", en: "Live Trading Note" },
  "Backtest aur paper mode me NIFTY, BANKNIFTY, SENSEX ready hai. Live orders ke liye broker symbol/token mapping bhi properly connected honi chahiye.": {
    hi: "बैकटेस्ट और पेपर मोड में NIFTY, BANKNIFTY और SENSEX तैयार हैं। लाइव ऑर्डर के लिए ब्रोकर सिंबल और टोकन मैपिंग भी सही प्रकार से कनेक्ट होनी चाहिए।",
    en: "NIFTY, BANKNIFTY, and SENSEX are ready for backtest and paper mode. Live orders also require correct broker symbol and token mapping."
  },
  "Trade data load failed": { hi: "ट्रेड डेटा लोड नहीं हो सका", en: "Could not load trade data" },
  "Active Live Trade": { hi: "सक्रिय लाइव ट्रेड", en: "Active Live Trade" },
  "Active Paper Trade": { hi: "सक्रिय पेपर ट्रेड", en: "Active Paper Trade" },
  "Refresh": { hi: "रिफ्रेश करें", en: "Refresh" },
  "Abhi koi active trade nahi hai. Score 82+ hone par real signal ke basis par trade create hogi.": {
    hi: "अभी कोई सक्रिय ट्रेड नहीं है। स्कोर 82 या उससे अधिक होने पर वास्तविक सिग्नल के आधार पर ट्रेड बनेगी।",
    en: "There is no active trade. A trade will be created from a live signal when the score reaches 82 or higher."
  },
  "Symbol": { hi: "सिंबल", en: "Symbol" },
  "Side / Qty": { hi: "दिशा / मात्रा", en: "Side / Quantity" },
  "Entry": { hi: "एंट्री", en: "Entry" },
  "Current": { hi: "वर्तमान", en: "Current" },
  "Target": { hi: "लक्ष्य", en: "Target" },
  "Exit": { hi: "एग्ज़िट", en: "Exit" },
  "Status": { hi: "स्थिति", en: "Status" },
  "Trade History": { hi: "ट्रेड इतिहास", en: "Trade History" },
  "Abhi trade history nahi hai.": { hi: "अभी कोई ट्रेड इतिहास उपलब्ध नहीं है।", en: "No trade history is available yet." },
  "Qty": { hi: "मात्रा", en: "Quantity" },
  "Hero Zero start failed": { hi: "हीरो ज़ीरो प्रारंभ नहीं हो पाया", en: "Could not start Hero Zero" },
  "Hero Zero closed": { hi: "हीरो ज़ीरो बंद हो गया", en: "Hero Zero closed" },
  "Hero Zero close failed": { hi: "हीरो ज़ीरो बंद नहीं हो पाया", en: "Could not close Hero Zero" },
  "Expiry Hero Zero": { hi: "एक्सपायरी हीरो ज़ीरो", en: "Expiry Hero Zero" },
  "High risk paper mode. Real broker orders OFF. Real option premium tracking.": {
    hi: "उच्च जोखिम वाला पेपर मोड। वास्तविक ब्रोकर ऑर्डर बंद हैं। वास्तविक ऑप्शन प्रीमियम की निगरानी चालू है।",
    en: "High-risk paper mode. Real broker orders are OFF. Real option premiums are monitored."
  },
  "⚠️ Market closed. Hero Zero available only during market hours (Mon-Fri 09:15-15:30 IST).": {
    hi: "⚠️ मार्केट बंद है। हीरो ज़ीरो केवल बाज़ार समय में उपलब्ध है (सोमवार–शुक्रवार, 09:15–15:30 IST)।",
    en: "⚠️ The market is closed. Hero Zero is available only during market hours (Mon–Fri, 09:15–15:30 IST)."
  },
  "Force Close Open Trade": { hi: "खुली ट्रेड को बलपूर्वक बंद करें", en: "Force Close Open Trade" },
  "Active Hero Zero Trade": { hi: "सक्रिय हीरो ज़ीरो ट्रेड", en: "Active Hero Zero Trade" },
  "Live Feed Status": { hi: "लाइव फ़ीड स्थिति", en: "Live Feed Status" },
  "CONNECTED": { hi: "कनेक्टेड", en: "CONNECTED" },
  "NOT CONNECTED": { hi: "कनेक्ट नहीं है", en: "NOT CONNECTED" },
  "Checking...": { hi: "जाँच की जा रही है...", en: "Checking..." },
  "Live feed not connected": { hi: "लाइव फ़ीड कनेक्ट नहीं है", en: "Live feed is not connected" },
  "Test Live Price / Reconnect": { hi: "लाइव कीमत जाँचें / दोबारा कनेक्ट करें", en: "Test Live Price / Reconnect" },
  "Server responded": { hi: "सर्वर ने उत्तर दिया", en: "Server responded" },
  "Server unreachable": { hi: "सर्वर उपलब्ध नहीं है", en: "Server unreachable" },
  "Server Connection Test": { hi: "सर्वर कनेक्शन परीक्षण", en: "Server Connection Test" },
  "REACHABLE": { hi: "उपलब्ध", en: "REACHABLE" },
  "UNREACHABLE": { hi: "उपलब्ध नहीं", en: "UNREACHABLE" },
  "Response time": { hi: "प्रतिक्रिया समय", en: "Response time" },
  "Testing...": { hi: "परीक्षण चल रहा है...", en: "Testing..." },
  "Run Test Again": { hi: "परीक्षण दोबारा चलाएँ", en: "Run Test Again" },
  "Payment": { hi: "भुगतान", en: "Payment" },
  "Order create failed": { hi: "भुगतान ऑर्डर नहीं बन पाया", en: "Could not create the payment order" },
  "Monthly Pro": { hi: "मासिक प्रो", en: "Monthly Pro" },
  "Quarterly Pro": { hi: "त्रैमासिक प्रो", en: "Quarterly Pro" },
  "Annual Pro": { hi: "वार्षिक प्रो", en: "Annual Pro" },
  "/month": { hi: "/माह", en: "/month" },
  "/3 months": { hi: "/3 माह", en: "/3 months" },
  "/year": { hi: "/वर्ष", en: "/year" },
  "Unlimited Signals": { hi: "असीमित सिग्नल", en: "Unlimited Signals" },
  "All Strategies": { hi: "सभी रणनीतियाँ", en: "All Strategies" },
  "WhatsApp Alerts": { hi: "व्हाट्सऐप अलर्ट", en: "WhatsApp Alerts" },
  "Priority Support": { hi: "प्राथमिक सहायता", en: "Priority Support" },
  "Sab Monthly wala": { hi: "मासिक योजना की सभी सुविधाएँ", en: "Everything in the Monthly plan" },
  "Backtest Reports": { hi: "बैकटेस्ट रिपोर्ट", en: "Backtest Reports" },
  "Custom SL/TP": { hi: "कस्टम SL/TP", en: "Custom SL/TP" },
  "Dedicated Support": { hi: "समर्पित सहायता", en: "Dedicated Support" },
  "Sab Quarterly wala": { hi: "त्रैमासिक योजना की सभी सुविधाएँ", en: "Everything in the Quarterly plan" },
  "API Access": { hi: "API एक्सेस", en: "API Access" },
  "Admin Dashboard": { hi: "एडमिन डैशबोर्ड", en: "Admin Dashboard" },
  "1-on-1 Onboarding": { hi: "व्यक्तिगत ऑनबोर्डिंग", en: "1-on-1 Onboarding" },
  "SAVE 17%": { hi: "17% बचत", en: "SAVE 17%" },
  "BEST VALUE": { hi: "सर्वोत्तम मूल्य", en: "BEST VALUE" },
  "💎 Pro Subscription": { hi: "💎 प्रो सदस्यता", en: "💎 Pro Subscription" },
  "Pro Subscription": { hi: "प्रो सदस्यता", en: "Pro Subscription" },
  "Apna plan choose karo": { hi: "अपनी योजना चुनें", en: "Choose your plan" },
  "Subscribe": { hi: "सदस्यता लें", en: "Subscribe" },
  "🔒 Secure Payment": { hi: "🔒 सुरक्षित भुगतान", en: "🔒 Secure Payment" },
  "Secure Payment": { hi: "सुरक्षित भुगतान", en: "Secure Payment" },
  "India ka #1 payment gateway": { hi: "भारत का प्रमुख भुगतान गेटवे", en: "A leading payment gateway in India" },
  "100% secure transactions": { hi: "100% सुरक्षित लेनदेन", en: "100% secure transactions" },
  "Easy Refund": { hi: "सरल रिफंड", en: "Easy Refund" },
  "7-din refund policy": { hi: "7 दिन की रिफंड नीति", en: "7-day refund policy" },
  "Admin access chahiye": { hi: "एडमिन एक्सेस आवश्यक है", en: "Admin access required" },
  "Admin access required": { hi: "एडमिन एक्सेस आवश्यक है", en: "Admin access required" },
  "Paper Capital": { hi: "पेपर पूँजी", en: "Paper Capital" },
  "Paper mode aur Backtest dono ke liye capital update karo.": { hi: "पेपर मोड और बैकटेस्ट दोनों के लिए पूँजी अपडेट करें।", en: "Update capital for both Paper mode and Backtest." },
  "Update capital for both Paper mode and Backtest.": { hi: "पेपर मोड और बैकटेस्ट दोनों के लिए पूँजी अपडेट करें।", en: "Update capital for both Paper mode and Backtest." },
  "Update Karo": { hi: "अपडेट करें", en: "Update" },
  "Update": { hi: "अपडेट करें", en: "Update" },
  "P&L Reset Karo": { hi: "P&L रीसेट करें", en: "Reset P&L" },
  "Reset P&L": { hi: "P&L रीसेट करें", en: "Reset P&L" },
  "Refresh ke liye niche kheenchein": { hi: "रिफ्रेश करने के लिए नीचे खींचें", en: "Pull to refresh" },
  "Pull to refresh": { hi: "रिफ्रेश करने के लिए नीचे खींचें", en: "Pull to refresh" },
  "Total Users": { hi: "कुल उपयोगकर्ता", en: "Total Users" },
  "Active Subs": { hi: "सक्रिय सदस्यताएँ", en: "Active Subscriptions" },
  "Trial Users": { hi: "परीक्षण उपयोगकर्ता", en: "Trial Users" },
  "Revenue": { hi: "राजस्व", en: "Revenue" },
  "Bot Chal Raha Hai": { hi: "बॉट चल रहा है", en: "Bot Running" },
  "Bot Running": { hi: "बॉट चल रहा है", en: "Bot Running" },
  "HAAN": { hi: "हाँ", en: "YES" },
  "NAHI": { hi: "नहीं", en: "NO" },
  "YES": { hi: "हाँ", en: "YES" },
  "NO": { hi: "नहीं", en: "NO" },
  "Aaj Ke Trades": { hi: "आज के ट्रेड", en: "Trades Today" },
  "Trades Today": { hi: "आज के ट्रेड", en: "Trades Today" },
  "Recent Users": { hi: "हाल के उपयोगकर्ता", en: "Recent Users" },
  "Koi user nahi mila": { hi: "कोई उपयोगकर्ता नहीं मिला", en: "No users found" },
  "No users found": { hi: "कोई उपयोगकर्ता नहीं मिला", en: "No users found" },
  "Bot Control": { hi: "बॉट नियंत्रण", en: "Bot Control" },
  "Bot Start": { hi: "बॉट प्रारंभ करें", en: "Start Bot" },
  "Start Bot": { hi: "बॉट प्रारंभ करें", en: "Start Bot" },
  "Bot Stop": { hi: "बॉट बंद करें", en: "Stop Bot" },
  "Stop Bot": { hi: "बॉट बंद करें", en: "Stop Bot" },
  "Telegram saved": { hi: "टेलीग्राम सेटिंग्स सुरक्षित हो गईं", en: "Telegram settings saved" },
  "Telegram save failed": { hi: "टेलीग्राम सेटिंग्स सुरक्षित नहीं हो सकीं", en: "Could not save Telegram settings" },
  "✅ Test message sent": { hi: "✅ परीक्षण संदेश भेज दिया गया", en: "✅ Test message sent" },
  "Test failed": { hi: "परीक्षण असफल रहा", en: "Test failed" },
  "Telegram test failed": { hi: "टेलीग्राम परीक्षण असफल रहा", en: "Telegram test failed" },
  "📲 Telegram Updates": { hi: "📲 टेलीग्राम अपडेट", en: "📲 Telegram Updates" },
  "Bot start/stop, signal, strategy save aur backtest result Telegram par bhejo.": {
    hi: "बॉट प्रारंभ/बंद होने, सिग्नल, रणनीति सुरक्षित होने और बैकटेस्ट परिणाम के संदेश टेलीग्राम पर भेजें।",
    en: "Send bot start/stop, signal, strategy-save, and backtest-result updates to Telegram."
  },
  "✅ Telegram Enabled": { hi: "✅ टेलीग्राम चालू है", en: "✅ Telegram Enabled" },
  "❌ Telegram Disabled": { hi: "❌ टेलीग्राम बंद है", en: "❌ Telegram Disabled" },
  "Show password": { hi: "पासवर्ड दिखाएँ", en: "Show password" },
  "Hide password": { hi: "पासवर्ड छिपाएँ", en: "Hide password" },
  "Home": { hi: "होम", en: "Home" },
  "Trade": { hi: "ट्रेड", en: "Trade" },
  "Bot": { hi: "बॉट", en: "Bot" },
  "Tools": { hi: "टूल्स", en: "Tools" },
  "More": { hi: "अधिक", en: "More" },
  "Account": { hi: "खाता", en: "Account" },
  "Trial khatam — Subscribe karo → ₹1,999/month": { hi: "परीक्षण अवधि समाप्त — सदस्यता लें → ₹1,999/माह", en: "Trial ended — Subscribe → ₹1,999/month" },
  "Option King AI loading...": { hi: "Option King AI लोड हो रहा है...", en: "Option King AI is loading..." },
  "Trade Exited": { hi: "ट्रेड बंद कर दी गई", en: "Trade Exited" },
  "Exit Not Confirmed": { hi: "एग्ज़िट की पुष्टि नहीं हुई", en: "Exit Not Confirmed" },
  "Manual exit response nahi mila.": { hi: "मैन्युअल एग्ज़िट का उत्तर नहीं मिला।", en: "No response was received for the manual exit request." },
  "Exit Failed": { hi: "एग्ज़िट असफल रही", en: "Exit Failed" },
  "Server/broker se confirmation nahi mila. Trade ko closed nahi maana gaya.": {
    hi: "सर्वर या ब्रोकर से पुष्टि नहीं मिली। ट्रेड को बंद नहीं माना गया है।",
    en: "No confirmation was received from the server or broker. The trade has not been marked as closed."
  },
  "Exit Trade Now?": { hi: "ट्रेड अभी बंद करें?", en: "Exit Trade Now?" },
  "Market exit request turant bheji jayegi.": { hi: "मार्केट एग्ज़िट अनुरोध तुरंत भेजा जाएगा।", en: "The market exit request will be sent immediately." },
  "Cancel": { hi: "रद्द करें", en: "Cancel" },
  "EXIT NOW": { hi: "अभी बंद करें", en: "EXIT NOW" },
  "⛔ EXIT TRADE NOW": { hi: "⛔ ट्रेड अभी बंद करें", en: "⛔ EXIT TRADE NOW" },
  "🧠 Shared AI Decision": { hi: "🧠 साझा AI निर्णय", en: "🧠 Shared AI Decision" },
  "🧬 Advanced AI V2": { hi: "🧬 उन्नत AI V2", en: "🧬 Advanced AI V2" },
  "Local fallback": { hi: "स्थानीय बैकअप", en: "Local fallback" },
  "Hard safety gate passed": { hi: "सख्त सुरक्षा जाँच सफल", en: "Hard safety gate passed" },
  "Hard safety gate blocked": { hi: "सख्त सुरक्षा जाँच ने रोका", en: "Hard safety gate blocked" },
  "All available confirmations aligned": { hi: "सभी उपलब्ध पुष्टियाँ एक दिशा में हैं", en: "All available confirmations aligned" },
  "Railway AI refreshing...": { hi: "Railway AI रिफ्रेश हो रहा है...", en: "Railway AI is refreshing..." },
  "Same Railway AI model personal bot aur SaaS dono ke liye. Order execution OFF.": {
    hi: "एक ही Railway AI मॉडल व्यक्तिगत बॉट और SaaS दोनों के लिए उपयोग हो रहा है। ऑर्डर निष्पादन बंद है।",
    en: "The same Railway AI model is used by the personal bot and SaaS. Order execution is OFF."
  },
  "Advanced monitor retrying": { hi: "उन्नत मॉनिटर दोबारा प्रयास कर रहा है", en: "Advanced monitor retrying" },
  "Exact option outcomes collect ho rahe hain. 300 valid samples ke baad validated adaptive model shadow mode me active hoga.": {
    hi: "सटीक ऑप्शन परिणाम एकत्र किए जा रहे हैं। 300 मान्य नमूनों के बाद सत्यापित अनुकूली मॉडल शैडो मोड में सक्रिय होगा।",
    en: "Exact option outcomes are being collected. The validated adaptive model will activate in shadow mode after 300 valid samples."
  },
  "MONITOR ONLY • Trade blocking OFF • Order execution OFF": {
    hi: "केवल निगरानी • ट्रेड रोकना बंद • ऑर्डर निष्पादन बंद",
    en: "MONITOR ONLY • Trade blocking OFF • Order execution OFF"
  },
  "BROKER": { hi: "ब्रोकर", en: "BROKER" },
  "OPTION VIEW": { hi: "ऑप्शन दृष्टिकोण", en: "OPTION VIEW" },
  "DATA COVERAGE": { hi: "डेटा कवरेज", en: "DATA COVERAGE" },
  "OPTION RISK": { hi: "ऑप्शन जोखिम", en: "OPTION RISK" },
  "MAX PAIN": { hi: "मैक्स पेन", en: "MAX PAIN" },
  "MODEL": { hi: "मॉडल", en: "MODEL" },
  "15M RESULT": { hi: "15 मिनट परिणाम", en: "15M RESULT" },
  "WAITING": { hi: "प्रतीक्षा", en: "WAITING" },
  "WAITING FOR DATA": { hi: "डेटा की प्रतीक्षा", en: "WAITING FOR DATA" },
  "READY": { hi: "तैयार", en: "READY" },
  "LIVE": { hi: "लाइव", en: "LIVE" },
  "STANDBY": { hi: "स्टैंडबाय", en: "STANDBY" },
  "OPEN": { hi: "खुली", en: "OPEN" },
  "CLOSED": { hi: "बंद", en: "CLOSED" },
  "BUY": { hi: "खरीद", en: "BUY" },
  "SELL": { hi: "बिक्री", en: "SELL" },
  "TRIAL": { hi: "परीक्षण", en: "TRIAL" },
  "ACTIVE": { hi: "सक्रिय", en: "ACTIVE" },
  "ADMIN": { hi: "एडमिन", en: "ADMIN" },
  "SUCCESS": { hi: "सफल", en: "SUCCESS" },
  "FAILED": { hi: "असफल", en: "FAILED" },
  "ERROR": { hi: "त्रुटि", en: "ERROR" },
  "NO_TRADE": { hi: "कोई ट्रेड नहीं", en: "NO TRADE" },
  "NO TRADE": { hi: "कोई ट्रेड नहीं", en: "NO TRADE" },
  "COLLECTING": { hi: "डेटा संग्रह", en: "COLLECTING" },
  "ACTIVE_SHADOW": { hi: "सक्रिय शैडो", en: "ACTIVE SHADOW" },
  "VALIDATION_FAILED": { hi: "सत्यापन असफल", en: "VALIDATION FAILED" }
};

const DYNAMIC = [
  {
    re: /^Trial (\d+) din me khatam hoga — (.+)$/i,
    hi: (m) => `परीक्षण अवधि ${m[1]} दिन में समाप्त होगी — ${m[2].replace("/month", "/माह")}`,
    en: (m) => `Trial ends in ${m[1]} day${m[1] === "1" ? "" : "s"} — ${m[2]}`
  },
  {
    re: /^Window opens in: (\d+)h (\d+)m (\d+)s$/i,
    hi: (m) => `विंडो खुलने में: ${m[1]} घंटे ${m[2]} मिनट ${m[3]} सेकंड`,
    en: (m) => `Window opens in: ${m[1]}h ${m[2]}m ${m[3]}s`
  },
  {
    re: /^🔴 ACTIVE — (\d+)m (\d+)s remaining$/i,
    hi: (m) => `🔴 सक्रिय — ${m[1]} मिनट ${m[2]} सेकंड शेष`,
    en: (m) => `🔴 ACTIVE — ${m[1]}m ${m[2]}s remaining`
  },
  {
    re: /^⚡ Force exit in: (\d+)m (\d+)s$/i,
    hi: (m) => `⚡ बलपूर्वक एग्ज़िट में: ${m[1]} मिनट ${m[2]} सेकंड`,
    en: (m) => `⚡ Force exit in: ${m[1]}m ${m[2]}s`
  },
  {
    re: /^Last checked: (.+)$/i,
    hi: (m) => `अंतिम जाँच: ${m[1]}`,
    en: (m) => `Last checked: ${m[1]}`
  },
  {
    re: /^Order created!\nID: (.+)\n\nRazorpay checkout karo\.$/i,
    hi: (m) => `ऑर्डर बन गया है!\nआईडी: ${m[1]}\n\nRazorpay चेकआउट पूरा करें।`,
    en: (m) => `Order created!\nID: ${m[1]}\n\nComplete the Razorpay checkout.`
  },
  {
    re: /^Hero Zero (CE|PE) started$/i,
    hi: (m) => `हीरो ज़ीरो ${m[1]} प्रारंभ हो गया`,
    en: (m) => `Hero Zero ${m[1]} started`
  },
  {
    re: /^✅ (angelone|angel|upstox|zerodha) connected\. Status: (.+)$/i,
    hi: (m) => `✅ ${brokerDisplay(m[1])} कनेक्टेड है। स्थिति: ${localizeText(m[2], "hi")}`,
    en: (m) => `✅ ${brokerDisplay(m[1])} connected. Status: ${localizeText(m[2], "en")}`
  },
  {
    re: /^❌ (.+)$/,
    hi: (m) => `❌ ${localizeText(m[1], "hi")}`,
    en: (m) => `❌ ${localizeText(m[1], "en")}`
  },
  {
    re: /^✅ (.+)$/,
    hi: (m) => `✅ ${localizeText(m[1], "hi")}`,
    en: (m) => `✅ ${localizeText(m[1], "en")}`
  },
  {
    re: /^Subscribe — (.+)$/i,
    hi: (m) => `सदस्यता लें — ${m[1]}`,
    en: (m) => `Subscribe — ${m[1]}`
  },
  {
    re: /^Advanced vs base: ([+-]?₹.+) per lot \(15m evaluated\)$/i,
    hi: (m) => `उन्नत AI बनाम मूल AI: ${m[1]} प्रति लॉट (15 मिनट मूल्यांकन)`,
    en: (m) => `Advanced vs base: ${m[1]} per lot (15m evaluated)`
  },
  {
    re: /^Advanced monitor retrying: (.+)$/i,
    hi: (m) => `उन्नत मॉनिटर दोबारा प्रयास कर रहा है: ${localizeText(m[1], "hi")}`,
    en: (m) => `Advanced monitor retrying: ${localizeText(m[1], "en")}`
  },
  {
    re: /^Railway fallback active: (.+)$/i,
    hi: (m) => `Railway बैकअप सक्रिय है: ${localizeText(m[1], "hi")}`,
    en: (m) => `Railway fallback active: ${localizeText(m[1], "en")}`
  },
  {
    re: /^Live: (₹?.+)$/i,
    hi: (m) => `लाइव: ${m[1]}`,
    en: (m) => `Live: ${m[1]}`
  },
  {
    re: /^(CE|PE|NO_TRADE|NO TRADE) (\d+)% confidence$/i,
    hi: (m) => `${localizeText(m[1], "hi")} • ${m[2]}% विश्वास`,
    en: (m) => `${localizeText(m[1], "en")} • ${m[2]}% confidence`
  },
  {
    re: /^(\d+)% confidence$/i,
    hi: (m) => `${m[1]}% विश्वास`,
    en: (m) => `${m[1]}% confidence`
  },
  {
    re: /^(\d+) evaluated$/i,
    hi: (m) => `${m[1]} मूल्यांकित`,
    en: (m) => `${m[1]} evaluated`
  }
];

const SHORT_LABEL_WORDS_HI = {
  active: "सक्रिय", live: "लाइव", paper: "पेपर", trade: "ट्रेड", history: "इतिहास",
  current: "वर्तमान", open: "खुली", closed: "बंद", total: "कुल", today: "आज",
  performance: "प्रदर्शन", capital: "पूँजी", used: "उपयोग", settings: "सेटिंग्स",
  strategy: "रणनीति", strategies: "रणनीतियाँ", backtest: "बैकटेस्ट", reports: "रिपोर्ट",
  bot: "बॉट", broker: "ब्रोकर", connection: "कनेक्शन", test: "परीक्षण", save: "सुरक्षित करें",
  update: "अपडेट", reset: "रीसेट", start: "प्रारंभ", stop: "बंद", account: "खाता",
  tools: "टूल्स", more: "अधिक", home: "होम", score: "स्कोर", market: "मार्केट",
  markets: "मार्केट", instrument: "इंस्ट्रूमेंट", instruments: "इंस्ट्रूमेंट", primary: "प्राथमिक",
  security: "सुरक्षा", payment: "भुगतान", subscription: "सदस्यता", plan: "योजना",
  plans: "योजनाएँ", user: "उपयोगकर्ता", users: "उपयोगकर्ता", revenue: "राजस्व",
  details: "विवरण", status: "स्थिति", response: "प्रतिक्रिया", time: "समय",
  refresh: "रिफ्रेश", retry: "दोबारा प्रयास", loading: "लोड हो रहा है", waiting: "प्रतीक्षा",
  data: "डेटा", quality: "गुणवत्ता", signal: "सिग्नल", indicators: "संकेतक",
  trend: "ट्रेंड", strength: "मजबूती", volume: "वॉल्यूम", ratio: "अनुपात",
  bonus: "बोनस", breakdown: "विवरण", risk: "जोखिम", rules: "नियम", acknowledgement: "सहमति",
  secure: "सुरक्षित", encrypted: "एन्क्रिप्टेड", credentials: "क्रेडेंशियल",
  enabled: "चालू", disabled: "बंद", connected: "कनेक्टेड", disconnected: "डिस्कनेक्टेड",
  success: "सफल", failed: "असफल", error: "त्रुटि", warning: "चेतावनी",
  strong: "मजबूत", weak: "कमज़ोर", high: "उच्च", low: "कम", confirmed: "पुष्टि हुई",
  entry: "एंट्री", exit: "एग्ज़िट", target: "लक्ष्य", quantity: "मात्रा", side: "दिशा",
  option: "ऑप्शन", advanced: "उन्नत", shared: "साझा", decision: "निर्णय", model: "मॉडल",
  coverage: "कवरेज", result: "परिणाम", results: "परिणाम", monitor: "मॉनिटर",
  force: "बलपूर्वक", expiry: "एक्सपायरी", password: "पासवर्ड", email: "ईमेल",
  phone: "फ़ोन", name: "नाम", verify: "सत्यापित करें", verification: "सत्यापन",
  send: "भेजें", resend: "दोबारा भेजें", cancel: "रद्द करें", confirm: "पुष्टि करें",
  support: "सहायता", monthly: "मासिक", quarterly: "त्रैमासिक", annual: "वार्षिक"
};

const ROMAN_HINDI_TO_DEVANAGARI = {
  aaj: "आज", abhi: "अभी", account: "खाता", admin: "एडमिन", agree: "सहमत",
  aapka: "आपका", aapki: "आपकी", aapke: "आपके", apna: "अपना", apni: "अपनी",
  aur: "और", band: "बंद", baad: "बाद", bhejo: "भेजें", bhej: "भेज",
  bot: "बॉट", chahiye: "चाहिए", chalu: "चालू", choose: "चुनें", connect: "कनेक्ट",
  create: "बनाएँ", credentials: "क्रेडेंशियल", daalo: "दर्ज करें", data: "डेटा",
  din: "दिन", dobara: "दोबारा", dono: "दोनों", dhundh: "खोज", fail: "असफल",
  gaya: "गया", gaye: "गए", gayi: "गई", generate: "जनरेट", hai: "है", hain: "हैं",
  har: "हर", ho: "हो", hoga: "होगा", hogi: "होगी", hua: "हुआ", hui: "हुई",
  ka: "का", ki: "की", ke: "के", karo: "करें", karna: "करना", karne: "करने",
  karta: "करता", karti: "करती", khatam: "समाप्त", kheenchein: "खींचें", koi: "कोई",
  ko: "को", liye: "लिए", load: "लोड", login: "लॉगिन", market: "मार्केट",
  me: "में", mein: "में", mila: "मिला", missing: "उपलब्ध नहीं", naya: "नया",
  nahi: "नहीं", niche: "नीचे", number: "नंबर", par: "पर", password: "पासवर्ड",
  padhkar: "पढ़कर", padho: "पढ़ें", paya: "पाया", properly: "सही प्रकार से",
  raha: "रहा", rahi: "रही", rahe: "रहे", register: "पंजीकरण", required: "आवश्यक",
  save: "सुरक्षित", saved: "सुरक्षित", se: "से", server: "सर्वर", setup: "सेटअप",
  signal: "सिग्नल", start: "प्रारंभ", stop: "बंद", token: "टोकन", trade: "ट्रेड",
  trial: "परीक्षण", turant: "तुरंत", update: "अपडेट", use: "उपयोग", user: "उपयोगकर्ता",
  verify: "सत्यापित", wapas: "वापस", wala: "वाली सुविधाएँ", wali: "वाली सुविधाएँ",
  whatsapp: "व्हाट्सऐप", zimmedari: "ज़िम्मेदारी"
};

const ROMAN_HINDI_TO_ENGLISH = {
  aaj: "today", abhi: "currently", aapka: "your", aapki: "your", apna: "your",
  apni: "your", aur: "and", band: "close", baad: "after", bhejo: "send", chahiye: "required",
  chalu: "enabled", daalo: "enter", din: "days", dobara: "again", dono: "both",
  dhundh: "searching", fail: "failed", gaya: "was", gaye: "were", gayi: "was",
  hai: "is", hain: "are", har: "every", ho: "be", hoga: "will", hogi: "will",
  hua: "completed", hui: "completed", ka: "of", ki: "of", ke: "of", karo: "please",
  karna: "to", karne: "to", khatam: "ends", kheenchein: "pull", koi: "any", ko: "to",
  liye: "for", me: "in", mein: "in", mila: "received", naya: "new", nahi: "not",
  niche: "down", par: "on", padhkar: "after reading", padho: "read", paya: "could",
  raha: "is", rahi: "is", rahe: "are", se: "from", turant: "immediately", wapas: "back",
  wala: "included", wali: "included", zimmedari: "responsibility"
};

function brokerDisplay(value) {
  const key = String(value || "").toLowerCase();
  if (key === "angelone" || key === "angel") return "Angel One";
  if (key === "upstox") return "Upstox";
  if (key === "zerodha") return "Zerodha";
  return value;
}

function preserveOuterWhitespace(source, translated) {
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  return leading + translated + trailing;
}

function shouldSkip(value) {
  const text = String(value || "").trim();
  if (!text || text.length === 1) return true;
  if (/^https?:\/\//i.test(text)) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return true;
  if (/^[-+₹$€£]?\d[\d,.:/%\-\s]*$/.test(text)) return true;
  if (/^[A-Z0-9_.:@|+\-/]+$/.test(text) && !COPY[text]) return true;
  if (/\.(js|tsx?|jsx):\d+/i.test(text) || /\bat\s+\S+\s*\(/.test(text)) return true;
  if (BRAND_TOKENS.has(text)) return true;
  return false;
}

function exactTranslation(text, lang) {
  const item = COPY[text];
  return item ? item[lang] || item.en || text : null;
}

function dynamicTranslation(text, lang) {
  for (const rule of DYNAMIC) {
    const match = text.match(rule.re);
    if (match) return rule[lang](match);
  }
  return null;
}

function containsRomanHindi(text) {
  const lower = String(text || "").toLowerCase();
  const markers = [
    " karo", " nahi", " ho gaya", " ho paya", " daalo", " bhejo", " ke liye",
    " se ", " me ", " mein ", " aur ", " abhi", " aaj", " khatam", " wala",
    " rahi", " raha", " rahe", " mila", " chahiye", " naya", " dobara", " par "
  ];
  return markers.some((marker) => (` ${lower} `).includes(marker));
}

function replaceWords(text, dictionary) {
  return text.replace(/\b[A-Za-z][A-Za-z0-9_-]*\b/g, (word) => {
    const lower = word.toLowerCase();
    return dictionary[lower] || word;
  });
}

function translateShortEnglishLabel(text) {
  const words = text.match(/[A-Za-z]+(?:-[A-Za-z]+)?/g) || [];
  if (!words.length || words.length > 7) return null;
  const unknown = words.filter((word) => {
    const lower = word.toLowerCase();
    return !SHORT_LABEL_WORDS_HI[lower] && !BRAND_TOKENS.has(word) && !/^[A-Z]{2,}$/.test(word);
  });
  if (unknown.length) return null;
  return text.replace(/\b[A-Za-z]+(?:-[A-Za-z]+)?\b/g, (word) => {
    const lower = word.toLowerCase();
    return SHORT_LABEL_WORDS_HI[lower] || word;
  });
}

function normalizeHindiFallback(text) {
  if (containsRomanHindi(text)) {
    return replaceWords(text, { ...SHORT_LABEL_WORDS_HI, ...ROMAN_HINDI_TO_DEVANAGARI });
  }
  return translateShortEnglishLabel(text) || text;
}

function normalizeEnglishFallback(text) {
  if (containsRomanHindi(text)) {
    const rough = replaceWords(text, ROMAN_HINDI_TO_ENGLISH)
      .replace(/\s+/g, " ")
      .replace(/\s+([,.:;!?])/g, "$1")
      .trim();
    return rough.charAt(0).toUpperCase() + rough.slice(1);
  }
  return text;
}

function localizeText(value, lang = "en") {
  if (typeof value !== "string") return value;
  const target = lang === "hi" ? "hi" : "en";
  const core = value.trim();
  if (!core || shouldSkip(core)) return value;

  const exact = exactTranslation(core, target);
  if (exact != null) return preserveOuterWhitespace(value, exact);

  const dynamic = dynamicTranslation(core, target);
  if (dynamic != null) return preserveOuterWhitespace(value, dynamic);

  const fallback = target === "hi"
    ? normalizeHindiFallback(core)
    : normalizeEnglishFallback(core);

  return preserveOuterWhitespace(value, fallback);
}

function localizeValue(value, lang = "en") {
  if (typeof value === "string") return localizeText(value, lang);
  if (Array.isArray(value)) return value.map((item) => localizeValue(item, lang));
  return value;
}

module.exports = {
  COPY,
  localizeText,
  localizeValue,
  containsRomanHindi,
  shouldSkip
};
