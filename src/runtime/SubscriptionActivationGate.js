const React = require('react');
const ReactNative = require('react-native');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

const { ActivityIndicator, Linking, Modal, Text, TouchableOpacity, View } = ReactNative;
const API = 'https://option-king-saas-production.up.railway.app';

async function getAuthToken() {
  const preferred = ['saas_token', 'token', 'auth_token', 'okai_token', 'access_token'];
  for (const key of preferred) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value && String(value).trim().length > 20) return String(value).trim();
    } catch (_) {}
  }
  try {
    const keys = await AsyncStorage.getAllKeys();
    for (const key of keys || []) {
      if (!/token|auth|session/i.test(String(key))) continue;
      const value = await AsyncStorage.getItem(key);
      if (value && String(value).trim().length > 20) return String(value).trim();
    }
  } catch (_) {}
  return '';
}

async function authGet(path, token) {
  const response = await fetch(API + path + (path.includes('?') ? '&' : '?') + '_okai_ts=' + Date.now(), {
    headers: {
      Authorization: 'Bearer ' + token,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || 'Status check failed');
  return data;
}

function SubscriptionActivationGate({ children }) {
  const [visible, setVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [access, setAccess] = React.useState(null);
  const dismissedRef = React.useRef(false);

  const checkStatus = React.useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setVisible(false);
      setAccess(null);
      dismissedRef.current = false;
      return;
    }
    try {
      const ent = await authGet('/subscription/entitlements', token);
      setAccess(ent);
      globalThis.__OKAI_ENTITLEMENTS__ = ent;

      // Important: after the 7-day LIVE trial, do NOT block the customer.
      // PAPER remains usable until its own 30-day expiry.
      if (!ent.paper_allowed) {
        setVisible(!dismissedRef.current);
      } else {
        setVisible(false);
        setMessage('');
      }
    } catch (_) {
      // Compatibility fallback while an older backend is still deploying.
      try {
        const data = await authGet('/subscription/status', token);
        globalThis.__OKAI_SUBSCRIPTION_STATUS__ = data;
        const status = String(data?.subscription_status || '').toLowerCase();
        const hardExpired = status === 'inactive' || status === 'suspended';
        if (hardExpired) setVisible(!dismissedRef.current);
      } catch (_) {
        setMessage('Access status check nahi ho paya. Refresh karein.');
      }
    }
  }, []);

  React.useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 10000);
    return () => clearInterval(timer);
  }, [checkStatus]);

  React.useEffect(() => {
    globalThis.__OKAI_OPEN_SUBSCRIPTION__ = () => {
      dismissedRef.current = false;
      setMessage('');
      setVisible(true);
    };
    return () => {
      if (globalThis.__OKAI_OPEN_SUBSCRIPTION__) delete globalThis.__OKAI_OPEN_SUBSCRIPTION__;
    };
  }, []);

  function dismissPopup() {
    dismissedRef.current = true;
    setVisible(false);
    setMessage('');
  }

  async function activateNow() {
    if (loading) return;
    setLoading(true);
    setMessage('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Please login again.');
      const response = await fetch(API + '/subscription/razorpay/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ plan_id: 'monthly_5000' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Payment page create nahi ho payi.');
      const checkoutUrl = String(data?.checkout_url || '').trim();
      if (!checkoutUrl) throw new Error('Payment page URL missing hai.');
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (!supported) throw new Error('Payment page open nahi ho pa rahi.');
      await Linking.openURL(checkoutUrl);
      setMessage('Payment ke baad admin 30 days activate karega. Activation ke baad Refresh dabayein.');
    } catch (error) {
      setMessage(error?.message || 'Could not open payment page.');
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    setLoading(true);
    setMessage('Checking access...');
    dismissedRef.current = false;
    await checkStatus();
    setLoading(false);
  }

  const liveExpiredPaperActive = Boolean(access && !access.live_allowed && access.paper_allowed);
  const liveDays = access?.live_days_remaining;
  const paperDays = access?.paper_days_remaining;

  return React.createElement(
    React.Fragment,
    null,
    children,

    liveExpiredPaperActive
      ? React.createElement(
          View,
          {
            style: {
              position: 'absolute', left: 12, right: 12, top: 54,
              backgroundColor: '#172033', borderWidth: 1, borderColor: '#d49a36',
              borderRadius: 14, padding: 12, zIndex: 50,
              shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
            },
          },
          React.createElement(Text, { style: { color: '#ffd27c', fontWeight: '900', fontSize: 13 } }, 'LIVE trial complete'),
          React.createElement(Text, { style: { color: '#d8e2f2', fontSize: 12, marginTop: 3, lineHeight: 17 } }, `Paper Trading abhi ${paperDays || 0} day(s) free hai. Live ke liye subscription activate karein.`),
          React.createElement(
            TouchableOpacity,
            { onPress: () => { dismissedRef.current = false; setVisible(true); }, style: { marginTop: 8, alignSelf: 'flex-start' } },
            React.createElement(Text, { style: { color: '#67b7ff', fontSize: 12, fontWeight: '900' } }, 'Enable Live →')
          )
        )
      : null,

    access?.live_allowed && access?.live_access === 'trial' && liveDays != null
      ? React.createElement(
          View,
          {
            style: {
              position: 'absolute', right: 12, top: 54, backgroundColor: '#0d2a22',
              borderWidth: 1, borderColor: '#24785f', borderRadius: 12,
              paddingHorizontal: 10, paddingVertical: 7, zIndex: 40,
            },
          },
          React.createElement(Text, { style: { color: '#73d6a2', fontSize: 11, fontWeight: '900' } }, `LIVE FREE TRIAL • ${liveDays}d`)
        )
      : null,

    React.createElement(
      Modal,
      { visible, transparent: true, animationType: 'fade', onRequestClose: dismissPopup },
      React.createElement(
        View,
        { style: { flex: 1, backgroundColor: 'rgba(3,8,20,0.92)', alignItems: 'center', justifyContent: 'center', padding: 22 } },
        React.createElement(
          View,
          { style: { width: '100%', maxWidth: 460, backgroundColor: '#10192c', borderWidth: 1, borderColor: '#27436c', borderRadius: 22, padding: 24, elevation: 14, position: 'relative' } },
          React.createElement(TouchableOpacity, { onPress: dismissPopup, style: { position: 'absolute', right: 14, top: 12, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18263b', zIndex: 5 } }, React.createElement(Text, { style: { color: '#d8e8ff', fontSize: 24, fontWeight: '700' } }, '×')),
          React.createElement(Text, { style: { color: '#67b7ff', fontSize: 12, fontWeight: '900', letterSpacing: 1 } }, 'OPTION KING AI'),
          React.createElement(Text, { style: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 8 } }, access?.paper_allowed ? 'Enable Live Trading' : 'Continue Option King AI'),
          React.createElement(Text, { style: { color: '#aab7cc', fontSize: 14, lineHeight: 21, marginTop: 10 } }, access?.paper_allowed ? 'Your 7-day Live trial is complete. Paper Trading continues free for 30 days from registration.' : 'Your 30-day Paper trial is complete. Subscribe for full Paper + Live access.'),
          React.createElement(
            View,
            { style: { marginTop: 18, backgroundColor: '#0b1424', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#233959' } },
            React.createElement(Text, { style: { color: '#fff', fontSize: 30, fontWeight: '900' } }, '₹5,000'),
            React.createElement(Text, { style: { color: '#8fa3bf', fontSize: 13, marginTop: 2 } }, '30 days • Paper + Live'),
            React.createElement(Text, { style: { color: '#73d6a2', fontSize: 12, marginTop: 10, lineHeight: 18 } }, '✓ Paytm / UPI\n✓ Admin-confirmed activation\n✓ Paper, Live, AI, Backtest & Reports')
          ),
          React.createElement(TouchableOpacity, { onPress: activateNow, disabled: loading, style: { marginTop: 18, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: loading ? '#31506f' : '#1677ff' } }, loading ? React.createElement(ActivityIndicator, { color: '#fff' }) : React.createElement(Text, { style: { color: '#fff', fontSize: 15, fontWeight: '900' } }, 'Subscribe ₹5,000')),
          React.createElement(TouchableOpacity, { onPress: refreshStatus, disabled: loading, style: { marginTop: 10, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#36516f' } }, React.createElement(Text, { style: { color: '#9bc8ff', fontSize: 13, fontWeight: '800' } }, 'Refresh Activation Status')),
          access?.paper_allowed ? React.createElement(TouchableOpacity, { onPress: dismissPopup, style: { marginTop: 8, minHeight: 40, alignItems: 'center', justifyContent: 'center' } }, React.createElement(Text, { style: { color: '#8fa3bf', fontSize: 12, fontWeight: '700' } }, `Continue Paper Trial (${paperDays || 0} days left)`)) : null,
          message ? React.createElement(Text, { style: { color: '#f3c969', fontSize: 11, lineHeight: 17, marginTop: 12, textAlign: 'center' } }, message) : null
        )
      )
    )
  );
}

module.exports = SubscriptionActivationGate;
