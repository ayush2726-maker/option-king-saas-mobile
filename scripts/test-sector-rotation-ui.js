const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = {
  index: fs.readFileSync(path.join(root, "index.js"), "utf8"),
  card: fs.readFileSync(
    path.join(root, "src/components/SectorRotationCard.js"),
    "utf8"
  ),
  homeRuntime: fs.readFileSync(
    path.join(root, "src/runtime/HomeAccordionEnhancementV3.js"),
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

requireMarker(files.index, "AppTradeExplanationPatched", "app root wiring");
requireMarker(files.card, "/market/sector-rotation?index=", "live API call");
requireMarker(files.card, '"NIFTY", "BANKNIFTY", "SENSEX"', "index tabs");
requireMarker(files.card, "OKAI_SECTOR_ROTATION_UI_V1", "card marker");
requireMarker(files.card, "Trade entry, exit aur orders untouched", "trade safety copy");
requireMarker(files.homeRuntime, 'require("../components/SectorRotationCard")', "active Home card import");
requireMarker(files.homeRuntime, "arrangeHomeDashboard", "direct Home injection");
requireMarker(files.homeRuntime, "okai-sector-rotation-home-v2", "Home card instance");
requireMarker(files.homeRuntime, "OKAI_SECTOR_ROTATION_HOME_RUNTIME_V2", "active runtime marker");
requireMarker(files.homeRuntime, "TODAY NET P&L", "Home dashboard targeting");
requireMarker(files.homeRuntime, "isSectorRotationCard", "duplicate prevention");
requireMarker(files.biometric, "15 * 60 * 1000", "15-minute biometric grace");
requireMarker(files.biometric, "OKAI_BIOMETRIC_APP_LOCK_15M_V2", "biometric marker");
requireMarker(files.index, "BiometricAppLock15m", "15-minute lock wiring");

if (files.index.includes("installSectorRotationEnhancement")) {
  throw new Error("Legacy sector wrapper must not be installed from index.js");
}

console.log("Sector rotation direct Home wiring and biometric grace checks passed");
