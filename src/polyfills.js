// Compatibility helpers for older Android JavaScript engines.
// Expo/Hermes versions used by some installed builds do not provide
// String.prototype.replaceAll, which can crash the dashboard on 7/30-day views.
if (typeof String.prototype.replaceAll !== "function") {
  Object.defineProperty(String.prototype, "replaceAll", {
    configurable: true,
    writable: true,
    value: function replaceAll(search, replacement) {
      const source = String(this);

      if (search instanceof RegExp) {
        if (!search.global) {
          throw new TypeError("replaceAll requires a global RegExp");
        }
        return source.replace(search, replacement);
      }

      return source.split(String(search)).join(String(replacement));
    },
  });
}
