const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = {
  index: fs.readFileSync(path.join(root, "index.js"), "utf8"),
  navigation: fs.readFileSync(
    path.join(root, "src/runtime/NavigationHelpEnhancement.js"),
    "utf8"
  ),
  card: fs.readFileSync(
    path.join(root, "src/components/SectorRotationCard.js"),
    "utf8"
  ),
  directRuntime: fs.readFileSync(
    path.join(root, "src/runtime/DirectHomeSectorRotationV4.js"),
    "utf8"
  ),
  biometric: fs.readFileSync(
    path.join(root, "src/security/BiometricAppLock15m.js"),
    "utf8"
  ),
};

function requireMarker(source, marker, label) {
  if (!source.includes(marker)) {
    throw new Error(`${label} missing marker: ${marker}`);
  }
}

requireMarker(files.index, "installDirectHomeSectorRotationV4", "current Home install");
requireMarker(files.index, "AppTradeExplanationPatched", "app root wiring");
requireMarker(files.navigation, 'return value === "home" ? "bot" : value', "Home to Bot route mapping");
requireMarker(files.card, "/market/sector-rotation?index=", "live API call");
requireMarker(files.card, '"NIFTY", "BANKNIFTY", "SENSEX"', "index tabs");
requireMarker(files.card, "OKAI_SECTOR_ROTATION_UI_V1", "card marker");
requireMarker(files.card, "Trade entry, exit aur orders untouched", "trade safety copy");
requireMarker(files.directRuntime, "function BotTab", "current BotTab detection");
requireMarker(files.directRuntime, "originalType", "direct function render");
requireMarker(files.directRuntime, "injectIntoCurrentHomeTree", "current Home render-tree injection");
requireMarker(files.directRuntime, "okai-direct-bot-home-sector-v5", "card instance");
requireMarker(files.directRuntime, "OKAI-DIRECT-BOT-HOME-SECTOR-V5", "runtime marker");
requireMarker(files.directRuntime, "Math.min(2, items.length)", "visible card placement");
requireMarker(files.biometric, "15 * 60 * 1000", "15-minute biometric grace");
requireMarker(files.biometric, "OKAI_BIOMETRIC_APP_LOCK_15M_V2", "biometric marker");
requireMarker(files.index, "BiometricAppLock15m", "15-minute lock wiring");

if (files.index.includes("installSectorRotationEnhancement")) {
  throw new Error("Legacy sector wrapper must not be installed from index.js");
}

console.log("Current BotTab/Home sector injection and biometric grace checks passed");
