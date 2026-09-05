const React = require('react');

let installed = false;

const replacements = new Map([
  [
    '₹5,000 for 30 days. Secure checkout opened. Pay using UPI / QR / supported payment method. After the verified payment, your account activates automatically.',
    '₹5,000 for 30 days. Your UPI / QR payment page has opened. After payment, the admin will verify it and activate your account manually for 30 days.'
  ],
  ['Automatic access after verified ₹5,000.00 payment', 'Manual activation by admin after ₹5,000 payment'],
  ['Automatic access after verified ₹5,000 payment', 'Manual activation by admin after ₹5,000 payment'],
  ['Server Verified', 'Admin Verified'],
  ['Secure verified payment checkout', 'Pay directly using UPI / QR'],
]);

function rewrite(value) {
  if (typeof value !== 'string') return value;
  if (replacements.has(value)) return replacements.get(value);
  return value;
}

function installManualSubscriptionCopyPatch() {
  if (installed) return;
  installed = true;
  const originalCreateElement = React.createElement;
  React.createElement = function patchedCreateElement(type, props, ...children) {
    const nextChildren = children.map(rewrite);
    return originalCreateElement.call(React, type, props, ...nextChildren);
  };
}

module.exports = { installManualSubscriptionCopyPatch };
