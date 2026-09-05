const React = require('react');
const ReactNative = require('react-native');

let installed = false;

function componentName(type) {
  return String(type?.displayName || type?.name || '').toLowerCase();
}

function flattenStyle(style) {
  try {
    return ReactNative.StyleSheet?.flatten
      ? ReactNative.StyleSheet.flatten(style) || {}
      : style || {};
  } catch (_) {
    return style || {};
  }
}

function textFromNode(node, depth = 0) {
  if (depth > 9 || node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((item) => textFromNode(item, depth + 1)).join(' ');
  if (React.isValidElement(node)) return textFromNode(node.props?.children, depth + 1);
  return '';
}

function isMobileBottomNavigation(type, props) {
  if (ReactNative.Platform.OS !== 'web') return false;
  if (type !== ReactNative.View && componentName(type) !== 'view') return false;

  const style = flattenStyle(props?.style);
  if (style.position !== 'absolute' || Number(style.bottom) !== 0) return false;

  const text = ` ${textFromNode(props?.children).replace(/\s+/g, ' ').trim()} `;
  return /\s(Home|होम)\s/i.test(text)
    && /\s(Trade|ट्रेड)\s/i.test(text)
    && /\s(Account|खाता)\s/i.test(text);
}

function patchRuntime(runtime) {
  if (!runtime || typeof runtime !== 'object') return;
  for (const key of ['jsx', 'jsxs', 'jsxDEV']) {
    const previous = runtime[key];
    if (typeof previous !== 'function' || previous.__OKAI_WEB_BOTTOM_NAV_HIDDEN__) continue;

    const wrapped = function okaiWebHideBottomNavJsx(type, props, ...rest) {
      if (isMobileBottomNavigation(type, props || {})) return null;
      return previous(type, props, ...rest);
    };
    wrapped.__OKAI_WEB_BOTTOM_NAV_HIDDEN__ = true;
    runtime[key] = wrapped;
  }
}

function installWebHideBottomNavigation() {
  if (installed || ReactNative.Platform.OS !== 'web') return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiWebHideBottomNavCreateElement(type, props, ...children) {
    const mergedProps = children.length
      ? { ...(props || {}), children: children.length === 1 ? children[0] : children }
      : (props || {});
    if (isMobileBottomNavigation(type, mergedProps)) return null;
    return previousCreateElement(type, props, ...children);
  };

  try { patchRuntime(require('react/jsx-runtime')); } catch (_) {}
  try { patchRuntime(require('react/jsx-dev-runtime')); } catch (_) {}
}

module.exports = { installWebHideBottomNavigation };
