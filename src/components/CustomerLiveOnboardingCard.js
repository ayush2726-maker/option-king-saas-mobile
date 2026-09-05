const React = require('react');
const RN = require('react-native');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
const UpstoxSetupGuideModule = require('./UpstoxSetupGuide');
const UpstoxSetupGuide = UpstoxSetupGuideModule.default || UpstoxSetupGuideModule;

const { ActivityIndicator, Modal, Platform, ScrollView, Text, TouchableOpacity, View } = RN;
const API = 'https://option-king-saas-production.up.railway.app';

const C = {
  card: '#101827', card2: '#0b1320', border: '#25344a', text: '#eef4ff',
  muted: '#8ea0b8', blue: '#4d9fff', green: '#00d4a0', gold: '#f5c842', red: '#ff5a6f',
};

async function getToken() {
  for (const key of ['saas_token','token','auth_token','okai_token','access_token']) {
    try {
      const v = await AsyncStorage.getItem(key);
      if (v && String(v).trim().length > 20) return String(v).trim();
    } catch (_) {}
  }
  return '';
}

async function apiGet(path, token) {
  const r = await fetch(API + path + (path.includes('?') ? '&' : '?') + '_okai_ts=' + Date.now(), {
    headers: { Authorization: 'Bearer ' + token, 'Cache-Control': 'no-cache, no-store' },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || data?.message || 'Status unavailable');
  return data;
}

function Step({ n, title, done, children }) {
  const color = done ? C.green : C.gold;
  return React.createElement(
    View,
    { style: { flexDirection: 'row', marginBottom: 14 } },
    React.createElement(View, { style: { width: 30, height: 30, borderRadius: 15, backgroundColor: color + '20', borderWidth: 1, borderColor: color + '88', alignItems: 'center', justifyContent: 'center', marginRight: 10 } },
      React.createElement(Text, { style: { color, fontWeight: '900', fontSize: 12 } }, done ? '✓' : String(n))
    ),
    React.createElement(View, { style: { flex: 1 } },
      React.createElement(Text, { style: { color: C.text, fontWeight: '900', fontSize: 13 } }, title),
      React.createElement(Text, { style: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 3 } }, children)
    )
  );
}

function CustomerLiveOnboardingCard() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [me, setMe] = React.useState(null);
  const [ent, setEnt] = React.useState(null);
  const [broker, setBroker] = React.useState(null);
  const [gateway, setGateway] = React.useState(null);
  const [error, setError] = React.useState('');

  const refresh = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const token = await getToken();
      if (!token) { setLoading(false); return; }
      const results = await Promise.allSettled([
        apiGet('/auth/me', token),
        apiGet('/subscription/entitlements', token),
        apiGet('/broker/list', token),
        apiGet('/local-gateway/access', token),
      ]);
      const m = results[0].status === 'fulfilled' ? results[0].value : null;
      const e = results[1].status === 'fulfilled' ? results[1].value : null;
      const b = results[2].status === 'fulfilled' ? results[2].value : null;
      const g = results[3].status === 'fulfilled' ? results[3].value : null;
      setMe(m); setEnt(e); setBroker(b); setGateway(g);
      if (m?.user?.is_admin) setOpen(false);
    } catch (e) {
      setError(String(e?.message || e));
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { refresh(); const t = setInterval(refresh, 15000); return () => clearInterval(t); }, [refresh]);

  const user = me?.user || {};
  if (user?.is_admin) return null;

  const brokers = Array.isArray(broker?.brokers) ? broker.brokers : [];
  const selectedBroker = String(broker?.selected_broker || '').toLowerCase();
  const brokerConnected = Boolean(selectedBroker || brokers.length);
  const gatewayInfo = gateway?.gateway || {};
  const liveServerReady = Boolean(gateway?.access?.allowed && gatewayInfo?.paired && gatewayInfo?.online);
  const paperAllowed = ent?.paper_allowed !== false;
  const liveAllowed = ent?.live_allowed !== false;
  const paperDays = ent?.paper_days_remaining;
  const liveDays = ent?.live_days_remaining;

  let stage = 'Connect Broker';
  if (brokerConnected && !liveServerReady) stage = 'Secure Live Connection';
  if (brokerConnected && liveServerReady && liveAllowed) stage = 'Ready for Live';
  if (!liveAllowed && paperAllowed) stage = 'Live Trial Ended';
  if (!paperAllowed) stage = 'Subscription Required';

  function go(route) {
    try {
      if (Platform.OS === 'web' && typeof globalThis.__OKAI_WEB_NAVIGATE__ === 'function') {
        globalThis.__OKAI_WEB_NAVIGATE__(route);
        setOpen(false);
        return;
      }
    } catch (_) {}
    setOpen(true);
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      View,
      { style: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.blue + '55', padding: 15, marginBottom: 12 } },
      React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement(View, { style: { flex: 1, paddingRight: 10 } },
          React.createElement(Text, { style: { color: C.text, fontSize: 16, fontWeight: '900' } }, 'Live Trading Setup'),
          React.createElement(Text, { style: { color: C.muted, fontSize: 11, marginTop: 3 } }, 'Naye customer ke liye step-by-step setup')
        ),
        React.createElement(View, { style: { backgroundColor: C.blue + '18', borderRadius: 10, borderWidth: 1, borderColor: C.blue + '55', paddingHorizontal: 9, paddingVertical: 6 } },
          React.createElement(Text, { style: { color: stage === 'Ready for Live' ? C.green : C.blue, fontSize: 10, fontWeight: '900' } }, stage)
        )
      ),
      React.createElement(View, { style: { flexDirection: 'row', marginTop: 12, gap: 8 } },
        React.createElement(View, { style: { flex: 1, backgroundColor: C.card2, borderRadius: 10, padding: 10 } },
          React.createElement(Text, { style: { color: C.muted, fontSize: 9, fontWeight: '900' } }, 'PAPER FREE'),
          React.createElement(Text, { style: { color: paperAllowed ? C.green : C.red, fontSize: 13, fontWeight: '900', marginTop: 2 } }, paperAllowed ? `${paperDays ?? '--'} days left` : 'Expired')
        ),
        React.createElement(View, { style: { flex: 1, backgroundColor: C.card2, borderRadius: 10, padding: 10 } },
          React.createElement(Text, { style: { color: C.muted, fontSize: 9, fontWeight: '900' } }, 'LIVE FREE'),
          React.createElement(Text, { style: { color: liveAllowed ? C.green : C.gold, fontSize: 13, fontWeight: '900', marginTop: 2 } }, liveAllowed ? `${liveDays ?? '--'} days left` : 'Trial ended')
        )
      ),
      React.createElement(TouchableOpacity, { onPress: () => setOpen(true), style: { marginTop: 12, minHeight: 44, borderRadius: 12, backgroundColor: '#1677ff', alignItems: 'center', justifyContent: 'center' } },
        React.createElement(Text, { style: { color: '#fff', fontWeight: '900', fontSize: 13 } }, brokerConnected ? 'Check Live Setup Steps →' : 'Start Live Setup →')
      )
    ),

    React.createElement(
      Modal,
      { visible: open, animationType: 'slide', onRequestClose: () => setOpen(false) },
      React.createElement(ScrollView, { style: { flex: 1, backgroundColor: '#070b12' }, contentContainerStyle: { padding: 16, paddingBottom: 50 } },
        React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } },
          React.createElement(View, null,
            React.createElement(Text, { style: { color: C.text, fontSize: 22, fontWeight: '900' } }, 'Live Trading Setup'),
            React.createElement(Text, { style: { color: C.muted, fontSize: 12, marginTop: 3 } }, 'Register se Live Bot tak complete guide')
          ),
          React.createElement(TouchableOpacity, { onPress: () => setOpen(false), style: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' } },
            React.createElement(Text, { style: { color: C.text, fontSize: 22 } }, '×')
          )
        ),

        loading ? React.createElement(ActivityIndicator, { color: C.blue, style: { marginVertical: 20 } }) : null,
        error ? React.createElement(Text, { style: { color: C.red, fontSize: 11, marginBottom: 12 } }, error) : null,

        React.createElement(Step, { n: 1, title: 'Account Create & Login', done: Boolean(user?.id) }, 'Registration complete karein, email/mobile verify karein aur app me login karein.'),
        React.createElement(Step, { n: 2, title: 'Broker Choose & Connect', done: brokerConnected }, 'Account/Broker section me Angel One ya Upstox choose karein. App me jo credential fields dikhte hain wahi broker account se fill karke Save + Test Connection karein.'),
        React.createElement(Step, { n: 3, title: 'Broker API Setup', done: brokerConnected }, selectedBroker === 'upstox' ? 'Upstox developer app create karein, exact Redirect URL/Postback URL app guide se copy karein, API Key/Secret aur daily Access Token save karein.' : 'Angel One SmartAPI app/API key ready rakhein. Client ID, MPIN/password, TOTP secret aur API key app ke Broker Setup me save karke connection test karein.'),
        selectedBroker === 'upstox' ? React.createElement(UpstoxSetupGuide, { compact: false }) : null,
        React.createElement(Step, { n: 4, title: 'Paper Trading Test', done: paperAllowed && brokerConnected }, 'Pehle Paper mode me bot start karein. Signal, trade entry/exit, capital aur report sahi update ho rahe hain ye check karein. Paper trial registration se 30 days free hai.'),
        React.createElement(Step, { n: 5, title: 'Secure Live Connection', done: liveServerReady }, 'Customer ko IP/token/Termux command handle nahi karna hai. App secure server connection status check karega. Ready na ho to Paper chalta rahega aur Admin/Support backend connection prepare karega.'),
        React.createElement(Step, { n: 6, title: 'Enable Live Trading', done: liveAllowed && liveServerReady }, liveAllowed ? 'Live trial 7 days free hai. Broker connected + secure connection ready hone ke baad Live mode select karein, risk details padhein aur explicit confirmation ke baad Start Bot karein.' : '7-day Live trial complete hai. ₹5,000 / 30 days subscription activate hone ke baad Live dobara enable hoga.'),

        React.createElement(View, { style: { backgroundColor: '#15101a', borderRadius: 14, borderWidth: 1, borderColor: C.red + '55', padding: 13, marginTop: 4 } },
          React.createElement(Text, { style: { color: C.red, fontWeight: '900', fontSize: 12 } }, 'Before first LIVE order'),
          React.createElement(Text, { style: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 6 } }, 'Broker connection green ho • Secure Live Connection Ready ho • correct broker selected ho • capital/risk verify ho • koi old/open position mismatch na ho • Live mode user khud confirm kare. App kabhi registration ke turant baad automatically real order start nahi karega.')
        ),

        React.createElement(View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 } },
          React.createElement(TouchableOpacity, { onPress: () => go('broker'), style: { flexGrow: 1, minWidth: 140, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: C.blue + '77', backgroundColor: C.blue + '18', alignItems: 'center', justifyContent: 'center' } }, React.createElement(Text, { style: { color: C.blue, fontWeight: '900', fontSize: 12 } }, 'Open Broker Setup')),
          React.createElement(TouchableOpacity, { onPress: refresh, style: { flexGrow: 1, minWidth: 120, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: C.green + '77', backgroundColor: C.green + '18', alignItems: 'center', justifyContent: 'center' } }, React.createElement(Text, { style: { color: C.green, fontWeight: '900', fontSize: 12 } }, 'Refresh Status')),
          React.createElement(TouchableOpacity, { onPress: () => { try { if (typeof globalThis.__OKAI_OPEN_SUBSCRIPTION__ === 'function') globalThis.__OKAI_OPEN_SUBSCRIPTION__(); } catch (_) {} }, style: { flexGrow: 1, minWidth: 130, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: C.gold + '77', backgroundColor: C.gold + '18', alignItems: 'center', justifyContent: 'center' } }, React.createElement(Text, { style: { color: C.gold, fontWeight: '900', fontSize: 12 } }, 'Subscription'))
        )
      )
    )
  );
}

module.exports = CustomerLiveOnboardingCard;
module.exports.default = CustomerLiveOnboardingCard;
