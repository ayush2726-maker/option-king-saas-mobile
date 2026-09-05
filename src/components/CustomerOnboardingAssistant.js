const React = require('react');
const RN = require('react-native');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

const { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } = RN;
const API = 'https://option-king-saas-production.up.railway.app';

async function authToken() {
  for (const key of ['saas_token', 'token', 'auth_token', 'okai_token', 'access_token']) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value && String(value).length > 20) return String(value);
    } catch (_) {}
  }
  return '';
}

async function api(path, token, options = {}) {
  const suffix = options.method ? '' : (path.includes('?') ? '&' : '?') + '_ts=' + Date.now();
  const response = await fetch(API + path + suffix, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + token,
      'Cache-Control': 'no-cache',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || data?.message || `Request failed (${response.status})`);
  return data;
}

function navigate(route) {
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__OKAI_WEB_NAVIGATE__ === 'function') {
      return Boolean(globalThis.__OKAI_WEB_NAVIGATE__(route));
    }
  } catch (_) {}
  return false;
}

function ActionButton({ label, onPress, disabled, tone = 'blue' }) {
  const color = tone === 'green' ? '#00d4a0' : tone === 'red' ? '#ff6478' : '#68adff';
  return React.createElement(
    TouchableOpacity,
    {
      onPress,
      disabled,
      activeOpacity: 0.84,
      style: {
        minHeight: 44,
        marginTop: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: disabled ? '#344154' : color + '99',
        backgroundColor: disabled ? '#182231' : color + '18',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.55 : 1,
      },
    },
    React.createElement(Text, { style: { color: disabled ? '#78869a' : color, fontSize: 12, fontWeight: '900', textAlign: 'center' } }, label)
  );
}

function Step({ n, title, detail, done, active, expanded, onPress, children }) {
  const color = done ? '#00d4a0' : active ? '#5ba5ff' : '#64758c';
  return React.createElement(
    View,
    { style: { marginBottom: 8 } },
    React.createElement(
      TouchableOpacity,
      { onPress, activeOpacity: 0.82, style: { flexDirection: 'row', gap: 12, paddingVertical: 8 } },
      React.createElement(
        View,
        { style: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: color, backgroundColor: color + '1f', alignItems: 'center', justifyContent: 'center' } },
        React.createElement(Text, { style: { color, fontWeight: '900', fontSize: 15 } }, done ? '✓' : String(n))
      ),
      React.createElement(
        View,
        { style: { flex: 1, minWidth: 0 } },
        React.createElement(
          View,
          { style: { flexDirection: 'row', alignItems: 'center', gap: 8 } },
          React.createElement(Text, { style: { color: '#f4f7ff', fontWeight: '900', fontSize: 15, flex: 1 } }, title),
          React.createElement(Text, { style: { color: '#83a6d3', fontWeight: '900', fontSize: 18 } }, expanded ? '⌃' : '›')
        ),
        React.createElement(Text, { style: { color: '#98a9bf', fontSize: 12, lineHeight: 18, marginTop: 3 } }, detail)
      )
    ),
    expanded ? React.createElement(View, { style: { marginLeft: 46, marginBottom: 10, padding: 12, borderRadius: 12, backgroundColor: '#111c2c', borderWidth: 1, borderColor: '#293d57' } }, children) : null
  );
}

function StatusPill({ label, value, good }) {
  const color = good ? '#00d4a0' : '#f6c85f';
  return React.createElement(
    View,
    { style: { flex: 1, minWidth: 0, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: color + '66', backgroundColor: color + '10' } },
    React.createElement(Text, { style: { color, fontSize: 10, fontWeight: '900' } }, label),
    React.createElement(Text, { style: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 3 } }, value)
  );
}

function CustomerOnboardingAssistant({ children }) {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(2);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState('');
  const [error, setError] = React.useState('');
  const [state, setState] = React.useState(null);

  const load = React.useCallback(async () => {
    const token = await authToken();
    if (!token) { setState(null); return; }
    setLoading(true);
    try {
      const [me, ent, brokers, provision, signal] = await Promise.all([
        api('/auth/me', token).catch(() => ({})),
        api('/subscription/entitlements', token).catch(() => ({})),
        api('/broker/list', token).catch(() => ({})),
        api('/local-gateway/provision/status', token).catch(() => ({})),
        api('/bot/signal', token).catch(() => ({})),
      ]);
      const user = me?.user || me || {};
      const selected = String(brokers?.selected_broker || '').trim().toLowerCase();
      const brokerReady = Boolean(selected);
      const p = provision?.provisioning || {};
      const gateway = provision?.gateway || {};
      const assignedIp = String(p?.static_ip || gateway?.expected_static_ip || '').trim();
      const expected = String(gateway?.expected_static_ip || assignedIp || '').trim();
      const observed = String(gateway?.observed_ip || '').trim();
      const exactIpMatch = Boolean(expected && observed && expected === observed);
      const gatewayReady = Boolean(gateway?.paired && gateway?.enabled && gateway?.online && exactIpMatch);
      const ipConfirmed = Boolean(p?.broker_ip_confirmed_at);
      const provisionState = String(p?.state || 'not_requested').toLowerCase();
      const userId = String(user?.id || 'unknown');
      let paperTested = false;
      try { paperTested = (await AsyncStorage.getItem('okai_paper_tested_' + userId)) === '1'; } catch (_) {}
      const signalMode = String(signal?.trading_mode || '').toLowerCase();
      if (brokerReady && signalMode === 'paper' && Boolean(signal?.is_running || signal?.running || Number(signal?.total_trades || 0) > 0)) {
        paperTested = true;
        try { await AsyncStorage.setItem('okai_paper_tested_' + userId, '1'); } catch (_) {}
      }
      const liveEnabled = Boolean(gateway?.server_armed && signalMode === 'live');
      setState({ user, isAdmin: Boolean(user?.is_admin), ent, selected, brokerReady, p, gateway, assignedIp, expected, observed, gatewayReady, ipConfirmed, provisionState, paperTested, signal, liveEnabled });
      setError('');
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  if (!state || state.isAdmin) return children;

  const liveAllowed = Boolean(state.ent?.live_allowed);
  const paperAllowed = Boolean(state.ent?.paper_allowed);
  const liveDays = Number(state.ent?.live_days_remaining || 0);
  const paperDays = Number(state.ent?.paper_days_remaining || 0);
  const secureDone = state.gatewayReady && state.ipConfirmed;
  const stage = !state.brokerReady ? 2 : !state.paperTested ? 3 : !secureDone ? 4 : !state.liveEnabled ? 5 : 6;
  const provisionStarted = ['requested', 'allocating', 'bootstrapping', 'ready'].includes(state.provisionState);

  const toggle = (n) => setExpanded((v) => (v === n ? 0 : n));
  const openRoute = (route) => { setOpen(false); setTimeout(() => navigate(route), 80); };

  const requestIp = async () => {
    const token = await authToken();
    if (!token) return;
    setBusy('ip'); setError('');
    try {
      await api('/local-gateway/provision/request', token, { method: 'POST', body: '{}' });
      await load();
    } catch (e) { setError(String(e?.message || e)); }
    finally { setBusy(''); }
  };

  const confirmIp = () => {
    if (!state.assignedIp) return;
    Alert.alert('Confirm Static IP', `Broker developer app me ${state.assignedIp} ko Primary Static IP ke roop me save kar diya hai?`, [
      { text: 'Not Yet', style: 'cancel' },
      { text: 'Yes, Saved', onPress: async () => {
        const token = await authToken();
        if (!token) return;
        setBusy('confirm-ip'); setError('');
        try {
          await api('/local-gateway/provision/confirm-ip', token, { method: 'POST', body: JSON.stringify({ confirmation: 'IP REGISTERED' }) });
          await load();
        } catch (e) { setError(String(e?.message || e)); }
        finally { setBusy(''); }
      } },
    ]);
  };

  const enableLive = () => {
    Alert.alert('Enable Live Trading?', 'Live mode real-money orders allow karega. Bot automatically start nahi hoga; real orders tabhi shuru honge jab aap Start Bot dabayenge.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Enable Live', onPress: async () => {
        const token = await authToken();
        if (!token) return;
        setBusy('live'); setError('');
        try {
          await api('/local-gateway/provision/enable-live', token, { method: 'POST', body: JSON.stringify({ confirmation: 'ENABLE LIVE TRADING' }) });
          await load();
        } catch (e) { setError(String(e?.message || e)); }
        finally { setBusy(''); }
      } },
    ]);
  };

  const disableLive = async () => {
    const token = await authToken();
    if (!token) return;
    setBusy('disable-live'); setError('');
    try {
      await api('/local-gateway/provision/disable-live', token, { method: 'POST', body: '{}' });
      await load();
    } catch (e) { setError(String(e?.message || e)); }
    finally { setBusy(''); }
  };

  const brokerIpInstruction = state.selected === 'upstox'
    ? 'Upstox Developer Apps → Option King AI app → Static IP / Primary IP me niche diya IP save karein.'
    : 'Angel One SmartAPI → My Apps → apni API app → Static IP / Primary IP me niche diya IP save karein.';

  return React.createElement(
    React.Fragment,
    null,
    children,
    React.createElement(TouchableOpacity, {
      onPress: () => { setExpanded(stage); setOpen(true); },
      activeOpacity: 0.86,
      style: { position: 'absolute', right: 12, bottom: RN.Platform.OS === 'web' ? 18 : 86, zIndex: 9999, minHeight: 46, paddingHorizontal: 15, borderRadius: 23, borderWidth: 1, borderColor: '#4d9fff', backgroundColor: '#0f5ecf', alignItems: 'center', justifyContent: 'center', elevation: 14 },
    }, React.createElement(Text, { style: { color: '#fff', fontSize: 12, fontWeight: '900' } }, '🚀 Set Up Live Trading')),
    React.createElement(Modal, { visible: open, transparent: true, animationType: 'slide', onRequestClose: () => setOpen(false) },
      React.createElement(View, { style: { flex: 1, backgroundColor: 'rgba(2,7,15,.92)', justifyContent: 'flex-end' } },
        React.createElement(View, { style: { maxHeight: '92%', backgroundColor: '#0b1220', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: '#263951', padding: 18 } },
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 } },
            React.createElement(View, { style: { flex: 1, paddingRight: 10 } },
              React.createElement(Text, { style: { color: '#fff', fontSize: 22, fontWeight: '900' } }, 'Live Trading Setup'),
              React.createElement(Text, { style: { color: '#91a4bd', fontSize: 12, marginTop: 3 } }, `Current step: ${stage} of 6 • Tap any step to open it`)
            ),
            React.createElement(TouchableOpacity, { onPress: () => setOpen(false), style: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#172338', alignItems: 'center', justifyContent: 'center' } }, React.createElement(Text, { style: { color: '#fff', fontSize: 22 } }, '×'))
          ),
          React.createElement(View, { style: { flexDirection: 'row', gap: 8, marginBottom: 14 } },
            React.createElement(StatusPill, { label: 'PAPER ACCESS', value: paperAllowed ? `${paperDays} days left` : 'Expired', good: paperAllowed }),
            React.createElement(StatusPill, { label: 'LIVE ACCESS', value: liveAllowed ? (state.ent?.live_access === 'trial' ? `${liveDays} trial days` : 'Active') : 'Locked', good: liveAllowed })
          ),
          error ? React.createElement(Text, { style: { color: '#ff8f9c', fontSize: 11, lineHeight: 16, marginBottom: 8 } }, error) : null,
          React.createElement(ScrollView, { keyboardShouldPersistTaps: 'handled', contentContainerStyle: { paddingBottom: 12 } },
            React.createElement(Step, { n: 1, title: 'Account Created', detail: 'Option King AI account ready.', done: true, active: false, expanded: expanded === 1, onPress: () => toggle(1) },
              React.createElement(Text, { style: { color: '#b7c5d8', fontSize: 12, lineHeight: 18 } }, 'Profile, subscription aur account details yahan check kar sakte hain.'),
              React.createElement(ActionButton, { label: 'Open Account', onPress: () => openRoute('account') })
            ),
            React.createElement(Step, { n: 2, title: 'Connect Your Broker', detail: state.brokerReady ? `${state.selected === 'upstox' ? 'Upstox' : 'Angel One'} connected.` : 'Angel One ya Upstox connect karein.', done: state.brokerReady, active: stage === 2, expanded: expanded === 2, onPress: () => toggle(2) },
              React.createElement(Text, { style: { color: '#b7c5d8', fontSize: 12, lineHeight: 18 } }, state.brokerReady ? 'Broker credentials verify ho chuke hain. Zarurat ho to yahan review/update kar sakte hain.' : 'Broker Setup screen required API Key, Client ID, password/token aur TOTP fields step-by-step dikhayegi.'),
              React.createElement(ActionButton, { label: state.brokerReady ? 'Review Broker' : 'Connect Broker Now', onPress: () => openRoute('broker') })
            ),
            React.createElement(Step, { n: 3, title: 'Test Paper Trading', detail: state.paperTested ? 'Paper bot test completed.' : 'Live se pehle Paper mode me bot start karke setup verify karein.', done: state.paperTested, active: stage === 3, expanded: expanded === 3, onPress: () => toggle(3) },
              React.createElement(Text, { style: { color: '#b7c5d8', fontSize: 12, lineHeight: 18 } }, paperAllowed ? 'Paper Bot kholein, mode PAPER rakhein aur Start Bot dabayein. App running Paper bot detect karke ye step automatically complete kar dega.' : 'Paper access expired hai. Subscription activate karna hoga.'),
              React.createElement(ActionButton, { label: paperAllowed ? 'Open Paper Bot' : 'Paper Access Expired', onPress: () => openRoute('bot'), disabled: !paperAllowed || !state.brokerReady })
            ),
            React.createElement(Step, { n: 4, title: 'Secure Static IP', detail: secureDone ? 'Dedicated AWS connection ready and IP registration confirmed.' : state.assignedIp ? 'Dedicated IP allocated. Broker me register karke confirm karein.' : provisionStarted ? 'AWS secure IP provisioning in progress…' : 'Option King AI automatically dedicated AWS IP allocate karega.', done: secureDone, active: stage === 4, expanded: expanded === 4, onPress: () => toggle(4) },
              React.createElement(Text, { style: { color: '#b7c5d8', fontSize: 12, lineHeight: 18 } }, 'Customer ko Termux, phone gateway, VPN, token pairing ya command chalane ki zarurat nahi hai. AWS worker + dedicated IP server side automatically banega.'),
              React.createElement(View, { style: { marginTop: 10, padding: 11, borderRadius: 11, backgroundColor: '#0c1725', borderWidth: 1, borderColor: '#2a4a6d' } },
                React.createElement(Text, { style: { color: '#7dbdff', fontSize: 10, fontWeight: '900' } }, 'YOUR DEDICATED EXECUTION IP'),
                React.createElement(Text, { selectable: true, style: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 4 } }, state.assignedIp || 'Allocation Pending'),
                React.createElement(Text, { style: { color: '#93a5bc', fontSize: 11, lineHeight: 16, marginTop: 6 } }, state.assignedIp ? brokerIpInstruction : 'Paper test ke baad Allocate My Secure IP dabayein. Exact IP yahin aa jayega.'),
                state.assignedIp ? React.createElement(Text, { style: { color: state.ipConfirmed ? '#00d4a0' : '#f6c85f', fontSize: 11, fontWeight: '900', marginTop: 7 } }, state.ipConfirmed ? '✓ Broker IP registration confirmed' : 'Waiting for your broker-IP confirmation') : null,
                state.gatewayReady ? React.createElement(Text, { style: { color: '#00d4a0', fontSize: 11, fontWeight: '900', marginTop: 5 } }, '✓ AWS worker online • outbound IP matched') : null
              ),
              !state.assignedIp
                ? React.createElement(ActionButton, { label: busy === 'ip' ? 'Allocating Secure IP…' : provisionStarted ? 'Refresh Provisioning Status' : 'Allocate My Secure IP', onPress: provisionStarted ? load : requestIp, disabled: busy === 'ip' || !state.paperTested || !liveAllowed, tone: 'green' })
                : !state.ipConfirmed
                  ? React.createElement(React.Fragment, null,
                      React.createElement(ActionButton, { label: 'Open Broker Setup / Instructions', onPress: () => openRoute('broker') }),
                      React.createElement(ActionButton, { label: busy === 'confirm-ip' ? 'Saving Confirmation…' : 'I Registered This IP', onPress: confirmIp, disabled: busy === 'confirm-ip', tone: 'green' })
                    )
                  : React.createElement(ActionButton, { label: state.gatewayReady ? 'Secure Connection Ready ✓' : 'Refresh Secure Connection', onPress: load, tone: 'green' })
            ),
            React.createElement(Step, { n: 5, title: 'Enable Live Trading', detail: state.liveEnabled ? 'Live mode enabled. Start Bot remains a separate final action.' : 'Broker + trial/subscription + static IP checks pass hone ke baad enable hoga.', done: state.liveEnabled, active: stage === 5, expanded: expanded === 5, onPress: () => toggle(5) },
              React.createElement(Text, { style: { color: '#b7c5d8', fontSize: 12, lineHeight: 18 } }, state.liveEnabled ? 'Live enabled hai, lekin real order tabhi place hoga jab aap Bot screen par Start Bot dabayenge. Aap kabhi bhi Live disable karke Paper par wapas ja sakte hain.' : 'Enable Live par explicit confirmation maangi jayegi. Confirmation ke bina server gateway arm nahi hoga.'),
              state.liveEnabled
                ? React.createElement(React.Fragment, null,
                    React.createElement(ActionButton, { label: 'Open Live Bot', onPress: () => openRoute('bot'), tone: 'green' }),
                    React.createElement(ActionButton, { label: busy === 'disable-live' ? 'Disabling…' : 'Disable Live & Return to Paper', onPress: disableLive, disabled: busy === 'disable-live', tone: 'red' })
                  )
                : React.createElement(ActionButton, { label: busy === 'live' ? 'Enabling Live…' : 'Enable Live Trading', onPress: enableLive, disabled: busy === 'live' || !liveAllowed || !secureDone, tone: 'green' })
            ),
            React.createElement(Step, { n: 6, title: 'Subscription', detail: 'Live trial 7 days • Paper free 30 days • Paid plan unlocks both.', done: false, active: stage === 6, expanded: expanded === 6, onPress: () => toggle(6) },
              React.createElement(Text, { style: { color: '#b7c5d8', fontSize: 12, lineHeight: 18 } }, 'Live trial khatam hone ke baad Paper registration date se 30 din tak continue karega. Paid activation ke baad Paper + Live dono active rahenge.'),
              React.createElement(ActionButton, { label: 'Open Subscription', onPress: () => openRoute('plans') })
            ),
            React.createElement(View, { style: { marginTop: 4, padding: 12, borderRadius: 12, backgroundColor: '#151b29', borderWidth: 1, borderColor: '#303c50' } },
              React.createElement(Text, { style: { color: '#f6c85f', fontSize: 11, fontWeight: '900' } }, 'LIVE SAFETY'),
              React.createElement(Text, { style: { color: '#aebbd0', fontSize: 11, lineHeight: 17, marginTop: 5 } }, 'Real orders remain blocked until Live entitlement is active, broker is connected, the dedicated AWS worker is online from the exact assigned IP, you confirm that IP in the broker app, and you explicitly Enable Live. Start Bot is still the final action.')
            )
          ),
          React.createElement(TouchableOpacity, { onPress: load, disabled: loading, style: { minHeight: 46, borderRadius: 13, backgroundColor: '#17253a', borderWidth: 1, borderColor: '#31557c', alignItems: 'center', justifyContent: 'center' } }, loading ? React.createElement(ActivityIndicator, { color: '#8bc2ff' }) : React.createElement(Text, { style: { color: '#8bc2ff', fontWeight: '900' } }, 'Refresh Setup Status'))
        )
      )
    )
  );
}

module.exports = CustomerOnboardingAssistant;
module.exports.default = CustomerOnboardingAssistant;
