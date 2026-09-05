const React = require('react');
const ReactNative = require('react-native');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

const { ActivityIndicator, AppState, Linking, Modal, Text, TouchableOpacity, View } = ReactNative;
const API = 'https://option-king-saas-production.up.railway.app';

function SubscriptionActivationGate({ children }) {
  const [visible, setVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const checkStatus = React.useCallback(async () => {
    const token = await AsyncStorage.getItem('saas_token');
    if (!token) {
      setVisible(false);
      return;
    }
    try {
      const response = await fetch(API + '/subscription/status?_okai_ts=' + Date.now(), {
        headers: { Authorization: 'Bearer ' + token, 'Cache-Control': 'no-cache' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const status = String(data?.subscription_status || '').toLowerCase();
      const expired = status === 'expired' || status === 'inactive';
      setVisible(expired);
      if (!expired) setMessage('');
    } catch (_) {}
  }, []);

  React.useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 10000);
    const subscription = AppState?.addEventListener
      ? AppState.addEventListener('change', (state) => {
          if (state === 'active') checkStatus();
        })
      : null;
    return () => {
      clearInterval(timer);
      if (subscription?.remove) subscription.remove();
    };
  }, [checkStatus]);

  async function activateNow() {
    if (loading) return;
    setLoading(true);
    setMessage('');
    try {
      const token = await AsyncStorage.getItem('saas_token');
      if (!token) throw new Error('Please login again.');
      const response = await fetch(API + '/subscription/razorpay/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.checkout_url) {
        throw new Error(data?.detail || 'Payment page is not available right now.');
      }
      await Linking.openURL(data.checkout_url);
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
    await checkStatus();
    setLoading(false);
  }

  return React.createElement(
    React.Fragment,
    null,
    children,
    React.createElement(
      Modal,
      { visible, transparent: true, animationType: 'fade', onRequestClose: () => {} },
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
            },
          },
          React.createElement(Text, { style: { color: '#67b7ff', fontSize: 12, fontWeight: '900', letterSpacing: 1 } }, 'OPTION KING AI'),
          React.createElement(Text, { style: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginTop: 8 } }, 'Subscription Required'),
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
              : React.createElement(Text, { style: { color: '#fff', fontSize: 15, fontWeight: '900' } }, 'Pay ₹5,000 with Paytm / UPI'),
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
          message ? React.createElement(Text, { style: { color: '#f3c969', fontSize: 11, lineHeight: 17, marginTop: 12, textAlign: 'center' } }, message) : null,
          React.createElement(Text, { style: { color: '#667892', fontSize: 10, lineHeight: 15, marginTop: 14, textAlign: 'center' } }, 'Payment does not activate automatically. Admin activation is required.'),
        )
      )
    )
  );
}

module.exports = SubscriptionActivationGate;
