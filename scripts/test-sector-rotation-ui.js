const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = {
  index: fs.readFileSync(path.join(root, "index.js"), "utf8"),
  card: fs.readFileSync(
    path.join(root, "src/components/SectorRotationCard.js"),
    "utf8"
  ),
  aiRuntime: fs.readFileSync(
    path.join(root, "src/runtime/AdvancedAiTabEnhancement.js"),
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
requireMarker(files.aiRuntime, 'require("../components/SectorRotationCard")', "AI tab card import");
requireMarker(files.aiRuntime, "aiScreenChildren", "AI screen render path");
requireMarker(files.aiRuntime, "okai-ai-tab-sector-rotation-v1", "AI tab card instance");
requireMarker(files.aiRuntime, "OKAI-AI-TAB-SECTOR-ROTATION-V1", "AI placement marker");
requireMarker(files.aiRuntime, "okai-advanced-ai-screen", "Advanced AI screen remains present");
requireMarker(files.biometric, "15 * 60 * 1000", "15-minute biometric grace");
requireMarker(files.biometric, "OKAI_BIOMETRIC_APP_LOCK_15M_V2", "biometric marker");
requireMarker(files.index, "BiometricAppLock15m", "15-minute lock wiring");

if (files.index.includes("installDirectHomeSectorRotationV4")) {
  throw new Error("Sector Rotation must not be installed on Home");
}

if (files.index.includes("installSectorRotationEnhancement")) {
  throw new Error("Legacy Home Sector Rotation wrapper must stay disabled");
}

const sectorPosition = files.aiRuntime.indexOf("okai-ai-tab-sector-rotation-v1");
const aiScreenPosition = files.aiRuntime.indexOf("okai-advanced-ai-screen");
if (sectorPosition < 0 || aiScreenPosition < 0 || sectorPosition > aiScreenPosition) {
  throw new Error("Sector Rotation must render before the Advanced AI report inside AI tab");
}

console.log("Sector Rotation renders only in the dedicated AI tab");
