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

function SubscriptionActivationGate({ children }) {
  const [visible, setVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const dismissedRef = React.useRef(false);

  const checkStatus = React.useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setVisible(false);
      dismissedRef.current = false;
      return;
    }
    try {
      const response = await fetch(API + '/subscription/status?_okai_ts=' + Date.now(), {
        headers: {
          Authorization: 'Bearer ' + token,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.detail || 'Subscription status check failed.');
        return;
      }
      const status = String(data?.subscription_status || '').toLowerCase();
      const expired = status === 'expired' || status === 'inactive' || status === 'suspended';
      if (expired) {
        setVisible(!dismissedRef.current);
      } else {
        dismissedRef.current = false;
        setVisible(false);
        setMessage('');
      }
      globalThis.__OKAI_SUBSCRIPTION_STATUS__ = data;
    } catch (_) {
      setMessage('Subscription status check nahi ho paya. Refresh karein.');
    }
  }, []);

  React.useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 5000);
    return () => clearInterval(timer);
  }, [checkStatus]);

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ plan_id: 'monthly_5000' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Payment page create nahi ho payi.');
      const checkoutUrl = String(data?.checkout_url || '').trim();
      if (!checkoutUrl) throw new Error('Payment page URL missing hai.');
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (!supported) throw new Error('Payment page open nahi ho pa rahi.');
      await Linking.openURL(checkoutUrl);
      setMessage('Payment ke baad admin payment confirm karke 30 days activate karega. Activation ke baad Refresh dabayein.');
    } catch (error) {
      setMessage(error?.message || 'Could not open payment page.');
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    setLoading(true);
    setMessage('Checking activation status...');
    dismissedRef.current = false;
    await checkStatus();
    setLoading(false);
  }

  return React.createElement(
    React.Fragment,
    null,
    children,
    React.createElement(
      Modal,
      { visible, transparent: true, animationType: 'fade', onRequestClose: dismissPopup },
      React.createElement(
        View,
        {
          style: {
            flex: 1,
            backgroundColor: 'rgba(3,8,20,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 22,
          },
        },
        React.createElement(
          View,
          {
            style: {
              width: '100%',
              maxWidth: 460,
              backgroundColor: '#10192c',
              borderWidth: 1,
              borderColor: '#27436c',
              borderRadius: 22,
              padding: 24,
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 22,
              elevation: 14,
              position: 'relative',
            },
          },
          React.createElement(
            TouchableOpacity,
            {
              onPress: dismissPopup,
              accessibilityLabel: 'Close subscription popup',
              style: {
                position: 'absolute',
                right: 14,
                top: 12,
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#18263b',
                borderWidth: 1,
                borderColor: '#36516f',
                zIndex: 5,
              },
            },
            React.createElement(Text, { style: { color: '#d8e8ff', fontSize: 24, fontWeight: '700', lineHeight: 26 } }, '×')
          ),
          React.createElement(Text, { style: { color: '#67b7ff', fontSize: 12, fontWeight: '900', letterSpacing: 1, paddingRight: 42 } }, 'OPTION KING AI'),
          React.createElement(Text, { style: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginTop: 8, paddingRight: 42 } }, 'Subscription Required'),
          React.createElement(Text, { style: { color: '#aab7cc', fontSize: 14, lineHeight: 21, marginTop: 10 } }, 'Your subscription is inactive. Pay ₹5,000 for 30 days and the administrator will activate your account after payment confirmation.'),
          React.createElement(
            View,
            { style: { marginTop: 18, backgroundColor: '#0b1424', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#233959' } },
            React.createElement(Text, { style: { color: '#ffffff', fontSize: 30, fontWeight: '900' } }, '₹5,000'),
            React.createElement(Text, { style: { color: '#8fa3bf', fontSize: 13, marginTop: 2 } }, '30 days full platform access'),
            React.createElement(Text, { style: { color: '#73d6a2', fontSize: 12, marginTop: 10, lineHeight: 18 } }, '✓ Paytm / UPI payment\n✓ Admin-confirmed 30-day activation\n✓ Paper, Live, AI, Backtest & Reports'),
          ),
          React.createElement(
            TouchableOpacity,
            {
              onPress: activateNow,
              disabled: loading,
              style: {
                marginTop: 18,
                minHeight: 50,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: loading ? '#31506f' : '#1677ff',
              },
            },
            loading
              ? React.createElement(ActivityIndicator, { color: '#fff' })
              : React.createElement(Text, { style: { color: '#fff', fontSize: 15, fontWeight: '900' } }, 'Subscribe ₹5,000'),
          ),
          React.createElement(
            TouchableOpacity,
            {
              onPress: refreshStatus,
              disabled: loading,
              style: {
                marginTop: 10,
                minHeight: 44,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#36516f',
              },
            },
            React.createElement(Text, { style: { color: '#9bc8ff', fontSize: 13, fontWeight: '800' } }, 'Refresh Activation Status'),
          ),
          React.createElement(
            TouchableOpacity,
            {
              onPress: dismissPopup,
              style: {
                marginTop: 8,
                minHeight: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              },
            },
            React.createElement(Text, { style: { color: '#8fa3bf', fontSize: 12, fontWeight: '700' } }, 'Close for now')
          ),
          message ? React.createElement(Text, { style: { color: '#f3c969', fontSize: 11, lineHeight: 17, marginTop: 12, textAlign: 'center' } }, message) : null,
          React.createElement(Text, { style: { color: '#667892', fontSize: 10, lineHeight: 15, marginTop: 10, textAlign: 'center' } }, 'Payment does not activate automatically. Admin activation is required.'),
        )
      )
    )
  );
}

module.exports = SubscriptionActivationGate;
