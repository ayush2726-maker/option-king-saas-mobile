const React = require('react');
const ReactNative = require('react-native');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

const { ActivityIndicator, Linking, Modal, Text, TouchableOpacity, View } = ReactNative;
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
      const response = await fetch(API + '/subscription/status', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const status = String(data?.subscription_status || '').toLowerCase();
      setVisible(status === 'expired' || status === 'inactive');
      if (status === 'active' || status === 'trial') setMessage('');
    } catch (_) {}
  }, []);

  React.useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 30000);
    return () => clearInterval(timer);
  }, [checkStatus]);

  async function activateNow() {
    if (loading) return;
    setLoading(true);
    setMessage('');
    try {
      const token = await AsyncStorage.getItem('saas_token');
      if (!token) throw new Error('Please login again.');
      const response = await fetch(API + '/subscription/phonepe/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.checkout_url) {
        throw new Error(data?.detail || 'Secure payment is not available right now.');
      }
      await Linking.openURL(data.checkout_url);
      setMessage('After payment, return here and tap Refresh Activation Status.');
    } catch (error) {
      setMessage(error?.message || 'Could not open payment.');
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
            backgroundColor: 'rgba(3,8,20,0.88)',
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
          React.createElement(Text, { style: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginTop: 8 } }, 'Activate Your Account'),
          React.createElement(Text, { style: { color: '#aab7cc', fontSize: 14, lineHeight: 21, marginTop: 10 } }, 'Your subscription is currently inactive. Activate Option King AI to continue using the platform.'),
          React.createElement(
            View,
            { style: { marginTop: 18, backgroundColor: '#0b1424', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#233959' } },
            React.createElement(Text, { style: { color: '#ffffff', fontSize: 30, fontWeight: '900' } }, '₹5,000'),
            React.createElement(Text, { style: { color: '#8fa3bf', fontSize: 13, marginTop: 2 } }, '30 days full platform access'),
            React.createElement(Text, { style: { color: '#73d6a2', fontSize: 12, marginTop: 10, lineHeight: 18 } }, '✓ Paper & Live trading tools\n✓ AI, backtest, reports & strategy tools\n✓ Secure server-side payment verification'),
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
              : React.createElement(Text, { style: { color: '#fff', fontSize: 15, fontWeight: '900' } }, 'Activate for ₹5,000'),
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
          React.createElement(Text, { style: { color: '#667892', fontSize: 10, lineHeight: 15, marginTop: 14, textAlign: 'center' } }, 'If your account is activated manually by the administrator, tap Refresh Activation Status to continue.'),
        )
      )
    )
  );
}

module.exports = SubscriptionActivationGate;
