const React = require("react");
const { Text, TouchableOpacity, View } = require("react-native");
const {
  THEMES,
  getAppTheme,
  setAppTheme,
  subscribeTheme,
} = require("../runtime/AppThemeEnhancement");

const C = {
  card: "#13131f",
  border: "#252540",
  text: "#e8e8f0",
  muted: "#a0a0c0",
  blue: "#4d9fff",
  green: "#00d4a0",
};

function ThemePickerCard({ lang }) {
  const hi = lang === "hi";
  const [theme, setTheme] = React.useState(getAppTheme());

  React.useEffect(() => subscribeTheme(setTheme), []);

  async function choose(id) {
    await setAppTheme(id);
  }

  return React.createElement(
    View,
    {
      style: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        marginTop: 12,
      },
    },
    React.createElement(
      Text,
      { style: { color: C.text, fontSize: 19, fontWeight: "900" } },
      hi ? "🎨 ऐप थीम" : "🎨 App Theme"
    ),
    React.createElement(
      Text,
      { style: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 12 } },
      hi
        ? "Black के अलावा अपनी पसंद की theme चुनें।"
        : "Choose a theme other than black."
    ),
    React.createElement(
      View,
      { style: { gap: 9 } },
      Object.entries(THEMES).map(([id, item]) =>
        React.createElement(
          TouchableOpacity,
          {
            key: id,
            onPress: () => choose(id),
            activeOpacity: 0.85,
            style: {
              minHeight: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme === id ? C.green : C.border,
              backgroundColor: theme === id ? C.green + "18" : "#0f0f1a",
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          },
          React.createElement(
            Text,
            { style: { color: C.text, fontSize: 13, fontWeight: "900" } },
            `${item.icon} ${item.label}`
          ),
          React.createElement(
            Text,
            { style: { color: theme === id ? C.green : C.blue, fontSize: 11, fontWeight: "900" } },
            theme === id ? "ACTIVE" : "USE"
          )
        )
      )
    )
  );
}

module.exports = ThemePickerCard;
module.exports.default = ThemePickerCard;
