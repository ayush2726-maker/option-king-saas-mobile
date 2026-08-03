const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.js"), "utf8");
const patch = fs.readFileSync(
  path.join(root, "src/runtime/LiveScoreBodyPreserveV4.js"),
  "utf8"
);

function requireMarker(source, marker, label) {
  if (!source.includes(marker)) {
    throw new Error(`${label} missing marker: ${marker}`);
  }
}

requireMarker(index, "installLiveScoreBodyPreserveV4", "index installation");
requireMarker(patch, "items.length <= 1", "single-container preservation");
requireMarker(patch, "return children", "body preservation fallback");
requireMarker(patch, "FixedLiveScoreAccordionPanel", "fixed accordion");
requireMarker(patch, "__okaiLiveScoreV3Bypass", "legacy wrapper bypass");
requireMarker(patch, "OKAI-LIVE-SCORE-BODY-PRESERVE-V4", "runtime marker");

const patchInstall = index.indexOf("installLiveScoreBodyPreserveV4();");
const appLoad = index.indexOf("require('./AppTradeExplanationPatched')");
if (patchInstall < 0 || appLoad < 0 || patchInstall >= appLoad) {
  throw new Error("Live Score body guard must install before the app accordion runtime");
}

if (patch.includes("if (items.length <= 1) return items.slice(1)")) {
  throw new Error("Single-container Live Score body must never be removed");
}

console.log("Live Strategy Score single-container body preservation checks passed");
