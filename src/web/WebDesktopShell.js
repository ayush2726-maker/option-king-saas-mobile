const React = require('react');
const { View, Text, Platform, useWindowDimensions, TouchableOpacity } = require('react-native');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;

const BG = '#070b12';
const PANEL = '#0b1523';
const PANEL_2 = '#111a28';
const BORDER = '#1e2b3b';
const TEXT = '#edf4ff';
const MUTED = '#8da0b8';
const GREEN = '#00d4a0';
const APK_DOWNLOAD_URL = 'https://github.com/ayush2726-maker/option-king-saas-mobile/releases/download/option-king-ai-latest/Option-King-AI.apk';

function Dot() {
  return React.createElement(View, { style: { width: 7, height: 7, borderRadius: 99, backgroundColor: GREEN, marginRight: 7 } });
}

function directNavigate(route) {
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__OKAI_WEB_NAVIGATE__ === 'function') {
      return globalThis.__OKAI_WEB_NAVIGATE__(route);
    }
  } catch (_) {}
  return false;
}

function openApkDownload() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.document) {
      const a = globalThis.document.createElement('a');
      a.href = APK_DOWNLOAD_URL;
      a.download = 'Option-King-AI.apk';
      a.rel = 'noopener noreferrer';
      globalThis.document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    }
    if (typeof globalThis !== 'undefined' && globalThis.location) {
      globalThis.location.href = APK_DOWNLOAD_URL;
      return true;
    }
  } catch (_) {}
  return false;
}

async function directLogout() {
  try {
    await AsyncStorage.multiRemove(['okai_auth_session_v2', 'saas_token', 'saas_user', 'token', 'auth_token', 'okai_token', 'access_token']);
  } catch (_) {}
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__OKAI_WEB_LOGOUT__ === 'function') {
      await globalThis.__OKAI_WEB_LOGOUT__();
      return true;
    }
  } catch (_) {}
  try {
    if (typeof globalThis !== 'undefined' && globalThis.location) {
      globalThis.location.reload();
      return true;
    }
  } catch (_) {}
  return false;
}

function RailItem({ icon, label, active, compact, onPress, navKey }) {
  return React.createElement(
    TouchableOpacity,
    {
      onPress,
      activeOpacity: 0.78,
      accessibilityRole: 'button',
      accessibilityLabel: `okai-web-nav-${navKey || label}`,
      style: {
        minHeight: compact ? 50 : 48,
        marginHorizontal: 8,
        marginBottom: 3,
        borderRadius: 9,
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: active ? '#0f5ecf' : 'transparent',
        borderWidth: active ? 1 : 0,
        borderColor: active ? '#2581ff' : 'transparent',
        paddingHorizontal: compact ? 12 : 14,
      },
    },
    React.createElement(
      View,
      { style: { flexDirection: 'row', alignItems: 'center' } },
      React.createElement(
        View,
        { style: { width: 28, alignItems: 'center', justifyContent: 'center', marginRight: 10 } },
        React.createElement(Text, {
          style: {
            color: '#f1f6ff',
            fontSize: icon.length > 1 ? 13 : 24,
            fontWeight: '700',
            lineHeight: 28,
            fontFamily: 'Arial, sans-serif',
          },
        }, icon)
      ),
      React.createElement(Text, {
        style: {
          color: active ? '#ffffff' : '#c7d3e5',
          fontSize: 13,
          fontWeight: active ? '900' : '700',
        },
      }, label)
    )
  );
}

function HeaderBrand({ phone, menuOpen, setMenuOpen }) {
  return React.createElement(
    View,
    { style: { flexDirection: 'row', alignItems: 'center' } },
    phone && React.createElement(
      TouchableOpacity,
      {
        onPress: () => setMenuOpen(!menuOpen),
        activeOpacity: 0.8,
        accessibilityRole: 'button',
        accessibilityLabel: 'okai-web-menu-toggle',
        style: {
          width: 38, height: 38, borderRadius: 10,
          backgroundColor: '#151e31', borderWidth: 1, borderColor: '#2a3852',
          alignItems: 'center', justifyContent: 'center', marginRight: 10,
        },
      },
      React.createElement(Text, { style: { color: TEXT, fontSize: 20, fontWeight: '900' } }, menuOpen ? '×' : '☰')
    ),
    React.createElement(
      View,
      {
        style: {
          width: phone ? 30 : 34, height: phone ? 30 : 34, borderRadius: 9,
          backgroundColor: '#151e31', borderWidth: 1, borderColor: '#2a3852',
          alignItems: 'center', justifyContent: 'center', marginRight: 9,
        },
      },
      React.createElement(Text, { style: { color: '#9d86ff', fontSize: phone ? 14 : 18, fontWeight: '900' } }, 'OK')
    ),
    React.createElement(
      View,
      null,
      React.createElement(Text, { style: { color: TEXT, fontSize: phone ? 15 : 18, fontWeight: '900' } }, 'Option King AI'),
      !phone && React.createElement(Text, { style: { color: MUTED, fontSize: 9, marginTop: 1 } }, 'Trading Web Console')
    )
  );
}

function NavPanel({ compact, onClose, activeKey, setActiveKey }) {
  const go = (key, route) => {
    setActiveKey && setActiveKey(key);
    onClose && onClose();
    setTimeout(() => directNavigate(route), 0);
  };

  const items = [
    ['dashboard', '⌂', 'Dashboard', 'bot'],
    ['trades', '▥', 'Trades', 'trade'],
    ['ai', '✣', 'AI', 'ai'],
    ['reports', '▤', 'Reports', 'score'],
    ['settings', '⚙', 'Settings', 'tools'],
    ['broker', 'ϟ', 'Brokers', 'broker'],
    ['backtest', '↶', 'Backtest', 'backtest'],
    ['billing', '▭', 'Billing', 'plans'],
    ['help', '?', 'Help', 'guide'],
    ['account', '♙', 'Account', 'account'],
  ];

  return React.createElement(
    View,
    { nativeID: 'okai-web-drawer', style: { flex: 1, paddingTop: 12, paddingBottom: 14 } },
    React.createElement(
      View,
      { style: { paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 } },
      React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
        React.createElement(View, { style: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#32205f', alignItems: 'center', justifyContent: 'center', marginRight: 10 } },
          React.createElement(Text, { style: { color: '#b69cff', fontSize: 17, fontWeight: '900' } }, 'OK')
        ),
        React.createElement(View, null,
          React.createElement(Text, { style: { color: TEXT, fontSize: 13, fontWeight: '900' } }, 'Option King AI'),
          React.createElement(Text, { style: { color: MUTED, fontSize: 10, marginTop: 1 } }, 'Ayush')
        )
      )
    ),
    ...items.map(([key, icon, label, route]) =>
      React.createElement(RailItem, {
        key, navKey: key, icon, label, compact,
        active: activeKey === key,
        onPress: () => go(key, route),
      })
    ),
    React.createElement(RailItem, {
      key: 'download-apk', navKey: 'download-apk', icon: '⇩', label: 'Download APK', compact,
      active: false,
      onPress: () => { onClose && onClose(); openApkDownload(); },
    }),
    React.createElement(RailItem, {
      key: 'logout', navKey: 'logout', icon: '⇥', label: 'Logout', compact,
      active: false,
      onPress: async () => { onClose && onClose(); await directLogout(); },
    }),
    React.createElement(
      View,
      { style: { marginTop: 'auto', marginHorizontal: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#304055' } },
      React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 } },
        React.createElement(Dot, null),
        React.createElement(Text, { style: { color: '#3de7be', fontSize: 10, fontWeight: '800' } }, 'All Systems Online')
      ),
      React.createElement(Text, { style: { color: MUTED, fontSize: 9 } }, 'v2.1.0')
    )
  );
}

function WebDesktopShell({ children }) {
  if (Platform.OS !== 'web') return children;

  const { width } = useWindowDimensions();
  const phone = width < 700;
  const compact = width < 900;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [activeKey, setActiveKey] = React.useState('dashboard');

  const headerHeight = phone ? 56 : 64;
  const railWidth = compact ? 210 : 230;
  const outerPad = phone ? 0 : compact ? 8 : 18;

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const styleId = 'okai-web-safe-area-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `@media (max-width:699px){html,body,#root{min-height:100%;background:${BG};}#okai-web-content{padding-bottom:max(96px,env(safe-area-inset-bottom));}}`;
    document.head.appendChild(style);
    return () => { try { style.remove(); } catch (_) {} };
  }, []);

  const openLiveSetup = () => {
    setMenuOpen(false);
    setActiveKey('broker');
    setTimeout(() => directNavigate('broker'), 0);
  };

  return React.createElement(
    View,
    { style: { flex: 1, backgroundColor: BG, minHeight: '100vh', position: 'relative' } },
    React.createElement(
      View,
      {
        style: {
          height: headerHeight, paddingLeft: phone ? 8 : 18, paddingRight: phone ? 8 : 18,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: '#09111b', borderBottomWidth: 1, borderBottomColor: BORDER, zIndex: 40,
        },
      },
      React.createElement(HeaderBrand, { phone, menuOpen, setMenuOpen }),
      React.createElement(
        View,
        { style: { flexDirection: 'row', alignItems: 'center', backgroundColor: PANEL_2, borderWidth: 1, borderColor: BORDER, borderRadius: 999, paddingHorizontal: phone ? 8 : 11, paddingVertical: phone ? 5 : 7 } },
        React.createElement(Dot, null),
        React.createElement(Text, { style: { color: TEXT, fontSize: phone ? 9 : 11, fontWeight: '800' } }, phone ? 'WEB' : 'System Online')
      )
    ),
    React.createElement(
      View,
      { style: { flex: 1, flexDirection: 'row', minHeight: 0, position: 'relative' } },
      !phone && React.createElement(
        View,
        { style: { width: railWidth, backgroundColor: PANEL, borderRightWidth: 1, borderRightColor: BORDER } },
        React.createElement(NavPanel, { compact: false, activeKey, setActiveKey })
      ),
      phone && menuOpen && React.createElement(
        React.Fragment,
        null,
        React.createElement(TouchableOpacity, {
          activeOpacity: 1, onPress: () => setMenuOpen(false), accessibilityLabel: 'okai-web-nav-overlay',
          style: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.58)', zIndex: 29 },
        }),
        React.createElement(
          View,
          {
            style: {
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: Math.min(260, Math.max(220, width * 0.48)),
              backgroundColor: PANEL, borderRightWidth: 1, borderRightColor: BORDER, zIndex: 30,
              boxShadow: '8px 0 28px rgba(0,0,0,0.4)',
            },
          },
          React.createElement(NavPanel, { compact: true, activeKey, setActiveKey, onClose: () => setMenuOpen(false) })
        )
      ),
      React.createElement(
        View,
        { nativeID: 'okai-web-content', style: { flex: 1, minWidth: 0, padding: outerPad, paddingBottom: phone ? 34 : outerPad, backgroundColor: BG } },
        React.createElement(
          View,
          {
            style: {
              flex: 1, width: '100%', maxWidth: 1360, alignSelf: 'center', backgroundColor: '#090e16',
              borderWidth: phone ? 0 : 1, borderColor: BORDER, borderRadius: phone ? 0 : compact ? 10 : 16,
              overflow: 'hidden', boxShadow: phone ? 'none' : compact ? '0 8px 24px rgba(0,0,0,0.22)' : '0 18px 50px rgba(0,0,0,0.28)',
              paddingBottom: phone ? 96 : 0,
            },
          },
          children
        )
      )
    ),
    React.createElement(
      TouchableOpacity,
      {
        onPress: openLiveSetup,
        activeOpacity: 0.86,
        accessibilityRole: 'button',
        accessibilityLabel: 'okai-web-start-live-trading',
        style: {
          position: 'absolute', right: phone ? 14 : 22, bottom: phone ? 18 : 24,
          zIndex: 80, minHeight: 48, paddingHorizontal: 18,
          borderRadius: 999, backgroundColor: '#1677ff', borderWidth: 1, borderColor: '#5fa0ff',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(22,119,255,0.35)',
        },
      },
      React.createElement(Text, { style: { color: '#fff', fontSize: phone ? 12 : 13, fontWeight: '900' } }, '🚀 Start Live Trading')
    )
  );
}

module.exports = WebDesktopShell;
module.exports.default = WebDesktopShell;
