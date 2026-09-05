const React = require('react');
const { View, Text, Platform, useWindowDimensions } = require('react-native');

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

function RailItem({ icon, label, active, compact }) {
  return React.createElement(
    View,
    {
      style: {
        minHeight: compact ? 58 : 48,
        marginHorizontal: compact ? 6 : 10,
        marginBottom: 6,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? '#172133' : 'transparent',
        borderWidth: active ? 1 : 0,
        borderColor: active ? '#2d3b55' : 'transparent',
        paddingHorizontal: 6,
      },
    },
    React.createElement(Text, { style: { fontSize: compact ? 17 : 16, marginBottom: 3 } }, icon),
    React.createElement(Text, {
      numberOfLines: compact ? 2 : 1,
      style: {
        color: active ? TEXT : MUTED,
        fontSize: compact ? 8 : 11,
        fontWeight: active ? '900' : '700',
        textAlign: 'center',
      },
    }, label)
  );
}

function WebDesktopShell({ children }) {
  if (Platform.OS !== 'web') return children;

  const { width } = useWindowDimensions();
  const compact = width < 900;
  const railWidth = compact ? 82 : 210;
  const headerHeight = compact ? 54 : 64;
  const outerPad = compact ? 8 : 18;

  return React.createElement(
    View,
    { style: { flex: 1, backgroundColor: BG, minHeight: '100vh' } },
    React.createElement(
      View,
      {
        style: {
          height: headerHeight,
          paddingLeft: compact ? 12 : 18,
          paddingRight: compact ? 10 : 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#09111b',
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
          zIndex: 20,
        },
      },
      React.createElement(
        View,
        { style: { flexDirection: 'row', alignItems: 'center' } },
        React.createElement(
          View,
          {
            style: {
              width: compact ? 28 : 34,
              height: compact ? 28 : 34,
              borderRadius: 9,
              backgroundColor: '#151e31',
              borderWidth: 1,
              borderColor: '#2a3852',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 9,
            },
          },
          React.createElement(Text, { style: { color: '#8d7cff', fontSize: compact ? 15 : 18, fontWeight: '900' } }, 'OK')
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: { color: TEXT, fontSize: compact ? 14 : 18, fontWeight: '900' } }, 'Option King AI'),
          !compact && React.createElement(Text, { style: { color: MUTED, fontSize: 9, marginTop: 1 } }, 'Trading Web Console')
        )
      ),
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
            paddingHorizontal: compact ? 8 : 11,
            paddingVertical: compact ? 5 : 7,
          },
        },
        React.createElement(Dot, null),
        React.createElement(Text, { style: { color: TEXT, fontSize: compact ? 9 : 11, fontWeight: '800' } }, compact ? 'WEB' : 'System Online')
      )
    ),
    React.createElement(
      View,
      { style: { flex: 1, flexDirection: 'row', minHeight: 0 } },
      React.createElement(
        View,
        {
          style: {
            width: railWidth,
            backgroundColor: PANEL,
            borderRightWidth: 1,
            borderRightColor: BORDER,
            paddingTop: compact ? 10 : 16,
            paddingBottom: 12,
          },
        },
        React.createElement(RailItem, { icon: '⌂', label: compact ? 'Dashboard' : 'Trading Dashboard', active: true, compact }),
        React.createElement(RailItem, { icon: '↗', label: compact ? 'Trades' : 'Live & Paper Trades', compact }),
        React.createElement(RailItem, { icon: '◎', label: compact ? 'AI' : 'AI Signals', compact }),
        React.createElement(RailItem, { icon: '▤', label: compact ? 'Reports' : 'Backtest & Reports', compact }),
        React.createElement(RailItem, { icon: '⚙', label: compact ? 'Settings' : 'Broker & Settings', compact }),
        React.createElement(
          View,
          {
            style: {
              marginTop: 'auto',
              marginHorizontal: compact ? 7 : 12,
              borderRadius: 10,
              backgroundColor: PANEL_2,
              borderWidth: 1,
              borderColor: BORDER,
              padding: compact ? 7 : 10,
            },
          },
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: compact ? 'center' : 'flex-start' } },
            React.createElement(Dot, null),
            !compact && React.createElement(Text, { style: { color: TEXT, fontSize: 10, fontWeight: '800' } }, 'Railway Connected')
          )
        )
      ),
      React.createElement(
        View,
        {
          style: {
            flex: 1,
            minWidth: 0,
            padding: outerPad,
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
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: compact ? 10 : 16,
              overflow: 'hidden',
              boxShadow: compact ? '0 8px 24px rgba(0,0,0,0.22)' : '0 18px 50px rgba(0,0,0,0.28)',
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
