const React = require("react");

let installed = false;

function groupIndianDigits(value) {
  const text = String(value || "0");
  if (text.length <= 3) return text;
  const lastThree = text.slice(-3);
  const leading = text.slice(0, -3);
  return `${leading.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThree}`;
}

function formatAmount(value) {
  const parsed = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return null;
  const fixed = Math.abs(parsed).toFixed(2);
  const [whole, decimal] = fixed.split(".");
  return `${groupIndianDigits(whole)}.${decimal}`;
}

function formatMoneyText(value) {
  if (typeof value !== "string" || !value.includes("₹")) return value;

  return value.replace(
    /([+-]?)₹\s*(-?\d[\d,]*(?:\.\d+)?)/g,
    (match, prefix, rawNumber) => {
      const parsed = Number(String(rawNumber).replace(/,/g, ""));
      const amount = formatAmount(parsed);
      if (amount == null) return match;
      const sign = parsed < 0 ? "-" : prefix === "-" ? "-" : prefix === "+" ? "+" : "";
      return `${sign}₹${amount}`;
    }
  );
}

function normalizeValue(value) {
  if (typeof value === "string") return formatMoneyText(value);
  if (Array.isArray(value)) return value.map(normalizeValue);
  return value;
}

function normalizeProps(props) {
  if (!props || typeof props !== "object") return props;
  let changed = false;
  const next = { ...props };

  ["label", "title", "message", "accessibilityLabel", "children"].forEach((key) => {
    if (!(key in next)) return;
    const normalized = normalizeValue(next[key]);
    if (normalized !== next[key]) {
      next[key] = normalized;
      changed = true;
    }
  });

  return changed ? next : props;
}

function installMoneyDisplayEnhancement() {
  if (installed || React.__OKAI_MONEY_DISPLAY_PATCHED__) return;
  installed = true;

  const previousCreateElement = React.createElement.bind(React);
  React.createElement = function okaiMoneyCreateElement(type, props, ...children) {
    return previousCreateElement(
      type,
      normalizeProps(props),
      ...children.map(normalizeValue)
    );
  };

  try {
    const jsxRuntime = require("react/jsx-runtime");
    ["jsx", "jsxs"].forEach((key) => {
      const previous = jsxRuntime[key];
      if (typeof previous !== "function") return;
      jsxRuntime[key] = function okaiMoneyJsx(type, props, reactKey) {
        return previous(type, normalizeProps(props), reactKey);
      };
    });
  } catch (_) {}

  React.__OKAI_MONEY_DISPLAY_PATCHED__ = true;
}

module.exports = { installMoneyDisplayEnhancement, formatMoneyText };
