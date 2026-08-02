const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = {
  index: fs.readFileSync(path.join(root, "index.js"), "utf8"),
  card: fs.readFileSync(
    path.join(root, "src/components/SectorRotationCard.js"),
    "utf8"
  ),
  runtime: fs.readFileSync(
    path.join(root, "src/runtime/SectorRotationEnhancement.js"),
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

requireMarker(files.index, "installSectorRotationEnhancement", "index wiring");
requireMarker(files.card, "/market/sector-rotation?index=", "live API call");
requireMarker(files.card, '"NIFTY", "BANKNIFTY", "SENSEX"', "index tabs");
requireMarker(files.card, "OKAI_SECTOR_ROTATION_UI_V1", "card marker");
requireMarker(files.card, "Trade entry, exit aur orders untouched", "trade safety copy");
requireMarker(files.runtime, "OKAI_SECTOR_ROTATION_RUNTIME_V1", "runtime marker");
requireMarker(files.runtime, "TODAY NET P&L", "Home dashboard targeting");
requireMarker(files.runtime, "isSectorRotationCard", "duplicate prevention");
requireMarker(files.biometric, "15 * 60 * 1000", "15 minute biometric grace");
requireMarker(files.biometric, "OKAI_BIOMETRIC_APP_LOCK_15M_V2", "biometric marker");
requireMarker(files.index, "BiometricAppLock15m", "15 minute lock wiring");

const appLoad = files.index.indexOf("require('./AppTradeExplanationPatched')");
const sectorInstall = files.index.indexOf("installSectorRotationEnhancement();");
if (appLoad < 0 || sectorInstall < 0 || sectorInstall <= appLoad) {
  throw new Error("Sector rotation must install after the app/Home wrappers load");
}

console.log("Sector rotation UI and 15-minute biometric checks passed");
