// Compatibility helpers for older Android JavaScript engines.
// Expo/JSC versions used by some installed builds do not provide replaceAll.
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

// Today graph fallback:
// old engine warm-up rows were saved as score=0. App.js prefers saved history
// whenever at least one saved point exists, so those invalid rows could hide
// valid HISTORICAL_REPLAY scores supplied by /bot/chart-data. Filter only the
// unusable zero/no-price rows at the API boundary; real positive live scores
// remain unchanged.
if (
  typeof global !== "undefined" &&
  typeof global.fetch === "function" &&
  !global.__OKAI_SCORE_HISTORY_FETCH_PATCH_V1__
) {
  const nativeFetch = global.fetch.bind(global);

  global.fetch = async function okaiFetch(input, init) {
    const response = await nativeFetch(input, init);
    const url = String(
      typeof input === "string"
        ? input
        : input && input.url
        ? input.url
        : ""
    );

    if (!url.includes("/bot/signal-history")) {
      return response;
    }

    try {
      const originalJson = response.json.bind(response);
      Object.defineProperty(response, "json", {
        configurable: true,
        writable: true,
        value: async function patchedSignalHistoryJson() {
          const payload = await originalJson();
          if (!payload || !Array.isArray(payload.points)) {
            return payload;
          }

          const validPoints = payload.points.filter((point) => {
            const score = Number(point && point.score);
            const price = Number(point && point.price);
            return (
              Number.isFinite(score) &&
              score > 0 &&
              Number.isFinite(price) &&
              price > 0
            );
          });

          return {
            ...payload,
            points: validPoints,
            count: validPoints.length,
            ignored_invalid_points:
              payload.points.length - validPoints.length,
          };
        },
      });
    } catch (error) {
      // Keep the normal response when the runtime does not allow overriding
      // Response.json. Backend cleanup still provides the same fallback.
    }

    return response;
  };

  global.__OKAI_SCORE_HISTORY_FETCH_PATCH_V1__ = true;
}
