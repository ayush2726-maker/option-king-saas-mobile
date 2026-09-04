const React = require('react');
const { View, Text, Platform, useWindowDimensions } = require('react-native');

const BG = '#070b12';
const PANEL = '#0d1420';
const PANEL_2 = '#111a28';
const BORDER = '#1e2b3b';
const TEXT = '#edf4ff';
const MUTED = '#8da0b8';
const ACCENT = '#7c6deb';
const GREEN = '#00d4a0';

function Dot({ color = GREEN }) {
  return React.createElement(View, {
    style: { width: 8, height: 8, borderRadius: 99, backgroundColor: color, marginRight: 8 }
  });
}

function SidebarItem({ icon, label, active }) {
  return React.createElement(
    View,
    {
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 6,
        backgroundColor: active ? '#171f33' : 'transparent',
        borderWidth: active ? 1 : 0,
        borderColor: active ? '#2b3650' : 'transparent',
      },
    },
    React.createElement(Text, { style: { width: 26, fontSize: 16 } }, icon),
    React.createElement(Text, { style: { color: active ? TEXT : MUTED, fontSize: 13, fontWeight: active ? '800' : '600' } }, label)
  );
}

function WebDesktopShell({ children }) {
  if (Platform.OS !== 'web') return children;

  const { width } = useWindowDimensions();
  const compact = width < 980;

  if (compact) {
    return React.createElement(
      View,
      { style: { flex: 1, backgroundColor: BG } },
      React.createElement(
        View,
        {
          style: {
            height: 58,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: PANEL,
            borderBottomWidth: 1,
            borderBottomColor: BORDER,
          },
        },
        React.createElement(Text, { style: { color: TEXT, fontSize: 18, fontWeight: '900' } }, 'Option King AI'),
        React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
          React.createElement(Dot, null),
          React.createElement(Text, { style: { color: MUTED, fontSize: 12, fontWeight: '700' } }, 'Web')
        )
      ),
      React.createElement(View, { style: { flex: 1 } }, children)
    );
  }

  return React.createElement(
    View,
    { style: { flex: 1, flexDirection: 'row', backgroundColor: BG, minHeight: '100vh' } },
    React.createElement(
      View,
      {
        style: {
          width: 238,
          backgroundColor: PANEL,
          borderRightWidth: 1,
          borderRightColor: BORDER,
          paddingHorizontal: 16,
          paddingTop: 22,
          paddingBottom: 18,
        },
      },
      React.createElement(
        View,
        { style: { paddingHorizontal: 8, marginBottom: 24 } },
        React.createElement(Text, { style: { color: TEXT, fontSize: 20, fontWeight: '900', letterSpacing: 0.2 } }, 'Option King AI'),
        React.createElement(Text, { style: { color: MUTED, fontSize: 11, marginTop: 3 } }, 'Trading Workspace')
      ),
      React.createElement(SidebarItem, { icon: '◈', label: 'Trading Dashboard', active: true }),
      React.createElement(SidebarItem, { icon: '↗', label: 'Live & Paper Trades' }),
      React.createElement(SidebarItem, { icon: '◎', label: 'AI Signals' }),
      React.createElement(SidebarItem, { icon: '◫', label: 'Backtest & Reports' }),
      React.createElement(SidebarItem, { icon: '⚙', label: 'Broker & Settings' }),
      React.createElement(
        View,
        { style: { marginTop: 'auto', backgroundColor: PANEL_2, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12 } },
        React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 } },
          React.createElement(Dot, null),
          React.createElement(Text, { style: { color: TEXT, fontSize: 12, fontWeight: '800' } }, 'Railway Connected')
        ),
        React.createElement(Text, { style: { color: MUTED, fontSize: 10, lineHeight: 15 } }, 'Cloud workspace • Paper + Live ready')
      )
    ),
    React.createElement(
      View,
      { style: { flex: 1, minWidth: 0 } },
      React.createElement(
        View,
        {
          style: {
            height: 64,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0a1019',
            borderBottomWidth: 1,
            borderBottomColor: BORDER,
          },
        },
        React.createElement(View, null,
          React.createElement(Text, { style: { color: TEXT, fontSize: 15, fontWeight: '900' } }, 'Trading Dashboard'),
          React.createElement(Text, { style: { color: MUTED, fontSize: 10, marginTop: 2 } }, 'Option King AI • Web Console')
        ),
        React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', backgroundColor: PANEL_2, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9 } },
          React.createElement(Dot, null),
          React.createElement(Text, { style: { color: TEXT, fontSize: 11, fontWeight: '800' } }, 'System Online')
        )
      ),
      React.createElement(
        View,
        { style: { flex: 1, padding: 20, alignItems: 'center', overflow: 'hidden' } },
        React.createElement(
          View,
          {
            style: {
              flex: 1,
              width: '100%',
              maxWidth: 1280,
              backgroundColor: '#090e16',
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 18px 50px rgba(0,0,0,0.28)',
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
