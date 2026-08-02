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
requireMarker(files.directRuntime, "isCurrentHomeScrollView", "current Home ScrollView detection");
requireMarker(files.directRuntime, '"start bot"', "English Start control signature");
requireMarker(files.directRuntime, '"stop bot"', "English Stop control signature");
requireMarker(files.directRuntime, '"बॉट प्रारंभ करें"', "Hindi Start control signature");
requireMarker(files.directRuntime, '"बॉट बंद करें"', "Hindi Stop control signature");
requireMarker(files.directRuntime, '"स्थिति रीफ्रेश करें"', "Hindi Refresh control signature");
requireMarker(files.directRuntime, '"बॉट स्थिति"', "Hindi Home dashboard identity");
requireMarker(files.directRuntime, "hasRefreshSlot", "spinner-safe refresh slot");
requireMarker(files.directRuntime, "okai-current-home-sector-v7", "card instance");
requireMarker(files.directRuntime, "OKAI-DIRECT-CURRENT-HOME-SCROLL-V7", "runtime marker");
requireMarker(files.directRuntime, "items.slice(0, 2)", "visible card placement");
requireMarker(files.biometric, "15 * 60 * 1000", "15-minute biometric grace");
requireMarker(files.biometric, "OKAI_BIOMETRIC_APP_LOCK_15M_V2", "biometric marker");
requireMarker(files.index, "BiometricAppLock15m", "15-minute lock wiring");

if (files.directRuntime.includes("function BotTab")) {
  throw new Error("Production sector injection must not depend on BotTab function names");
}

if (files.index.includes("installSectorRotationEnhancement")) {
  throw new Error("Legacy sector wrapper must not be installed from index.js");
}

console.log("Bilingual minification-safe Home sector injection and biometric grace checks passed");