const fs = require("fs");

const app = fs.readFileSync("App.js", "utf8");
const overlay = fs.readFileSync(
  "src/components/SelectedBrokerOverlay.js",
  "utf8"
);

const angelFieldsStart = app.indexOf("angelone: [");
const zerodhaFieldsStart = app.indexOf("zerodha: [", angelFieldsStart);
if (angelFieldsStart < 0 || zerodhaFieldsStart < 0) {
  throw new Error("Angel One broker field definition was not found");
}

const angelFields = app.slice(angelFieldsStart, zerodhaFieldsStart);
if (angelFields.includes('label: "API Secret"')) {
  throw new Error("Angel One still shows a misleading API Secret field");
}
if (!angelFields.includes('key: "mpin"')) {
  throw new Error("Angel One MPIN field is missing");
}

const required = [
  'api_secret: broker === "angelone" ? mpin.trim() : apiSecret.trim()',
  '!/^\\d{4}$/.test(mpin.trim())',
  'DeviceEventEmitter.emit("okai:broker-saved"',
];

for (const text of required) {
  if (!app.includes(text)) {
    throw new Error(`Missing Angel One save protection: ${text}`);
  }
}

if (!overlay.includes('DeviceEventEmitter.addListener(') ||
    !overlay.includes('"okai:broker-saved"')) {
  throw new Error("Saved broker panel does not refresh immediately after save");
}

console.log("Angel One MPIN save and saved-list refresh verified");
