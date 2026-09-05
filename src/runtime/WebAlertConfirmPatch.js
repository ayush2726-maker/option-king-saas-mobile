const { Alert, Platform } = require('react-native');

let installed = false;

function installWebAlertConfirmPatch() {
  if (installed || Platform.OS !== 'web') return;
  if (typeof window === 'undefined' || !Alert || typeof Alert.alert !== 'function') return;
  installed = true;

  const originalAlert = Alert.alert.bind(Alert);
  Alert.alert = function patchedAlert(title, message, buttons, options) {
    try {
      const list = Array.isArray(buttons) ? buttons : [];
      const actionable = list.filter((button) => button && typeof button.onPress === 'function');
      const cancel = list.find((button) => button && (button.style === 'cancel' || /cancel|no/i.test(String(button.text || ''))));

      if (actionable.length > 0) {
        const preferred = [...actionable].reverse().find((button) => button !== cancel) || actionable[0];
        const confirmed = window.confirm([title, message].filter(Boolean).join('\n\n'));
        if (confirmed) {
          Promise.resolve(preferred.onPress()).catch(() => {});
        } else if (cancel && typeof cancel.onPress === 'function') {
          Promise.resolve(cancel.onPress()).catch(() => {});
        }
        return;
      }

      window.alert([title, message].filter(Boolean).join('\n\n'));
    } catch (_) {
      return originalAlert(title, message, buttons, options);
    }
  };
}

module.exports = { installWebAlertConfirmPatch };
