const React = require('react');
const { View, Text, Platform, useWindowDimensions, TouchableOpacity } = require('react-native');

const BG = '#070b12';
const PANEL = '#0d1420';
const PANEL_2 = '#111a28';
const BORDER = '#1e2b3b';
const TEXT = '#edf4ff';
const MUTED = '#8da0b8';
const GREEN = '#00d4a0';

function Dot() {
  return React.createElement(View, {
    style: { width: 7, height: 7, borderRadius: 99, backgroundColor: GREEN, marginRight: 7 }
  });
}

function isOwnWebNavNode(node) {
  try {
    const aria = String(node.getAttribute?.('aria-label') || '');
    if (aria.startsWith('okai-web-nav-')) return true;
    if (node.closest?.('#okai-web-drawer')) return true;
    return false;
  } catch (_) {
    return false;
  }
}

function clickMatchingButton(labels) {
  if (typeof document === 'undefined') return false;
  const wanted = labels.map((x) => String(x).trim().toLowerCase());
  const nodes = Array.from(document.querySelectorAll('[role="button"],button,a'))
    .filter((node) => !isOwnWebNavNode(node));

  const exact = nodes.find((node) => {
    const text = String(node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const aria = String(node.getAttribute?.('aria-label') || '').trim().toLowerCase();
    return wanted.some((label) => text === label || aria === label);
  });
  const match = exact || nodes.find((node) => {
    const text = String(node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const aria = String(node.getAttribute?.('aria-label') || '').trim().toLowerCase();
    return wanted.some((label) => aria.includes(label) || text.includes(label));
  });

  if (!match) return false;
  try {
    match.click();
    return true;
  } catch (_) {
    try {
      match.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return true;
    } catch (_) {
      return false;
    }
  }
}

function navigateTo(primaryLabels, secondaryLabels) {
  const primaryWorked = clickMatchingButton(primaryLabels);
  if (secondaryLabels && secondaryLabels.length) {
    setTimeout(() => clickMatchingButton(secondaryLabels), primaryWorked ? 260 : 80);
  }
}

function RailItem({ icon, label, active, compact, onPress, navKey }) {
  return React.createElement(
    TouchableOpacity,
    {
      onPress,
      activeOpacity: 0.75,
      accessibilityRole: 'button',
      accessibilityLabel: `okai-web-nav-${navKey || label}`,
      style: {
        minHeight: compact ? 48 : 46,
        marginHorizontal: compact ? 8 : 10,
        marginBottom: 5,
        borderRadius: 10,
        alignItems: compact ? 'flex-start' : 'center',
        justifyContent: 'center',
        backgroundColor: active ? '#17335e' : 'transparent',
        borderWidth: active ? 1 : 0,
        borderColor: active ? '#285eaa' : 'transparent',
        paddingHorizontal: compact ? 14 : 6,
      },
    },
    React.createElement(View, { style: { flexDirection: compact ? 'row' : 'column', alignItems: 'center' } },
      React.createElement(Text, { style: { fontSize: 17, marginRight: compact ? 12 : 0, marginBottom: compact ? 0 : 3 } }, icon),
      React.createElement(Text, {
        style: {
          color: active ? '#ffffff' : '#b2bfd1',
          fontSize: compact ? 12 : 11,
          fontWeight: active ? '900' : '700',
          textAlign: compact ? 'left' : 'center',
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
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: '#151e31',
          borderWidth: 1,
          borderColor: '#2a3852',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        },
      },
      React.createElement(Text, { style: { color: TEXT, fontSize: 20, fontWeight: '900' } }, menuOpen ? '×' : '☰')
    ),
    React.createElement(
      View,
      {
        style: {
          width: phone ? 30 : 34,
          height: phone ? 30 : 34,
          borderRadius: 9,
          backgroundColor: '#151e31',
          borderWidth: 1,
          borderColor: '#2a3852',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 9,
        },
      },
      React.createElement(Text, { style: { color: '#8d7cff', fontSize: phone ? 14 : 18, fontWeight: '900' } }, 'OK')
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
  const go = (key, primary, secondary) => {
    setActiveKey && setActiveKey(key);
    onClose && onClose();
    setTimeout(() => navigateTo(primary, secondary), 80);
  };

  const items = [
    ['dashboard', '⌂', 'Dashboard', ['Home', 'Bot'], null],
    ['trades', '↗', 'Trades', ['Trade', 'Trades'], null],
    ['ai', '◎', 'AI', ['AI', 'Advanced AI'], null],
    ['reports', '▤', 'Reports', ['Trade', 'Trades'], ['Reports', 'Report', 'History', 'Trade History']],
    ['settings', '⚙', 'Settings', ['Settings', 'Tools'], null],
    ['broker', '⌁', 'Brokers', ['Settings', 'Tools'], ['Broker', 'Broker Setup', 'Angel One', 'Upstox']],
    ['backtest', '↺', 'Backtest', ['Settings', 'Tools'], ['Backtest']],
    ['help', '?', 'Help', ['Help', 'Guide'], null],
    ['account', '◉', 'Account', ['Account'], null],
  ];

  return React.createElement(
    View,
    { nativeID: 'okai-web-drawer', style: { flex: 1, paddingTop: 12, paddingBottom: 14 } },
    ...items.map(([key, icon, label, primary, secondary]) =>
      React.createElement(RailItem, {
        key,
        navKey: key,
        icon,
        label,
        compact,
        active: activeKey === key,
        onPress: () => go(key, primary, secondary),
      })
    ),
    React.createElement(
      View,
      {
        style: {
          marginTop: 'auto',
          marginHorizontal: 10,
          borderRadius: 10,
          backgroundColor: PANEL_2,
          borderWidth: 1,
          borderColor: BORDER,
          padding: 10,
        },
      },
      React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
        React.createElement(Dot, null),
        React.createElement(Text, { style: { color: TEXT, fontSize: 10, fontWeight: '800' } }, 'Railway Connected')
      )
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
  const railWidth = compact ? 82 : 210;
  const outerPad = phone ? 0 : compact ? 8 : 18;

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const styleId = 'okai-web-safe-area-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media (max-width: 699px) {
        html, body, #root { min-height: 100%; background: ${BG}; }
        #okai-web-content { padding-bottom: max(96px, env(safe-area-inset-bottom)); }
      }
    `;
    document.head.appendChild(style);
    return () => { try { style.remove(); } catch (_) {} };
  }, []);

  return React.createElement(
    View,
    { style: { flex: 1, backgroundColor: BG, minHeight: '100vh' } },
    React.createElement(
      View,
      {
        style: {
          height: headerHeight,
          paddingLeft: phone ? 8 : 18,
          paddingRight: phone ? 8 : 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#09111b',
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
          zIndex: 40,
        },
      },
      React.createElement(HeaderBrand, { phone, menuOpen, setMenuOpen }),
      React.createElement(
        View,
        {
          style: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: PANEL_2,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 999,
            paddingHorizontal: phone ? 8 : 11,
            paddingVertical: phone ? 5 : 7,
          },
        },
        React.createElement(Dot, null),
        React.createElement(Text, { style: { color: TEXT, fontSize: phone ? 9 : 11, fontWeight: '800' } }, phone ? 'WEB' : 'System Online')
      )
    ),
    React.createElement(
      View,
      { style: { flex: 1, flexDirection: 'row', minHeight: 0, position: 'relative' } },
      !phone && React.createElement(
        View,
        {
          style: {
            width: railWidth,
            backgroundColor: PANEL,
            borderRightWidth: 1,
            borderRightColor: BORDER,
          },
        },
        React.createElement(NavPanel, { compact, activeKey, setActiveKey })
      ),
      phone && menuOpen && React.createElement(
        React.Fragment,
        null,
        React.createElement(TouchableOpacity, {
          activeOpacity: 1,
          onPress: () => setMenuOpen(false),
          accessibilityLabel: 'okai-web-nav-overlay',
          style: {
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.58)', zIndex: 29,
          },
        }),
        React.createElement(
          View,
          {
            style: {
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: Math.min(292, Math.max(238, width * 0.82)),
              backgroundColor: PANEL,
              borderRightWidth: 1,
              borderRightColor: BORDER,
              zIndex: 30,
              boxShadow: '8px 0 28px rgba(0,0,0,0.4)',
            },
          },
          React.createElement(NavPanel, {
            compact: true,
            activeKey,
            setActiveKey,
            onClose: () => setMenuOpen(false),
          })
        )
      ),
      React.createElement(
        View,
        {
          nativeID: 'okai-web-content',
          style: {
            flex: 1,
            minWidth: 0,
            padding: outerPad,
            paddingBottom: phone ? 34 : outerPad,
            backgroundColor: BG,
          },
        },
        React.createElement(
          View,
          {
            style: {
              flex: 1,
              width: '100%',
              maxWidth: 1360,
              alignSelf: 'center',
              backgroundColor: '#090e16',
              borderWidth: phone ? 0 : 1,
              borderColor: BORDER,
              borderRadius: phone ? 0 : compact ? 10 : 16,
              overflow: 'hidden',
              boxShadow: phone ? 'none' : compact ? '0 8px 24px rgba(0,0,0,0.22)' : '0 18px 50px rgba(0,0,0,0.28)',
              paddingBottom: phone ? 96 : 0,
            },
          },
          children
        )
      )
    )
  );
}

module.exports = WebDesktopShell;
module.exports.default = WebDesktopShell;
