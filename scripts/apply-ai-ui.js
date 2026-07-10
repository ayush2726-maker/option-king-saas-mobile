const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const appPath = path.join(root, "App.js");
const backupPath = path.join(root, "App.js.before_ai_ui");

if (!fs.existsSync(appPath)) {
  console.error("App.js not found:", appPath);
  process.exit(1);
}

let app = fs.readFileSync(appPath, "utf8");
const original = app;

const storageImport = 'import AsyncStorage from "@react-native-async-storage/async-storage";';
const aiImport = 'const AiDecisionCard = require("./src/components/AiDecisionCard");';

if (!app.includes(aiImport)) {
  if (!app.includes(storageImport)) {
    console.error("AsyncStorage import marker not found. App.js was not changed.");
    process.exit(1);
  }
  app = app.replace(storageImport, `${storageImport}\n${aiImport}`);
}

const uiMarker = `      </Card>\n\n      {/* Start/Stop/Refresh */}`;
const uiReplacement = `      </Card>\n\n      <AiDecisionCard signal={signal} />\n\n      {/* Start/Stop/Refresh */}`;

if (!app.includes("<AiDecisionCard signal={signal} />")) {
  if (!app.includes(uiMarker)) {
    console.error("Bot status card marker not found. App.js was not changed.");
    process.exit(1);
  }
  app = app.replace(uiMarker, uiReplacement);
}

if (app === original) {
  console.log("AI Decision UI is already applied. No changes needed.");
  process.exit(0);
}

if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, original, "utf8");
  console.log("Backup created:", backupPath);
}

fs.writeFileSync(appPath, app, "utf8");
console.log("AI Decision card added to Bot screen.");
console.log("Run: npm run ai:test");
console.log("Then start Expo and open the Bot tab.");
