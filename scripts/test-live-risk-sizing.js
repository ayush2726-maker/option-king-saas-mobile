const fs = require("fs");

const help = fs.readFileSync("src/screens/HelpScreen.js", "utf8");
const gateway = fs.readFileSync("src/screens/LocalGatewayScreen.js", "utf8");
const app = fs.readFileSync("App.js", "utf8");

if (/ARM LIVE 1 LOT|one-lot/i.test(help + gateway + app)) {
  throw new Error("Old fixed one-lot LIVE instruction is still visible");
}
if (!help.includes("same capital and risk sizing as Paper Mode")) {
  throw new Error("Paper-equivalent LIVE sizing guidance is missing");
}
if (!gateway.includes("ARM LIVE RISK SIZING")) {
  throw new Error("Risk-sizing gateway arm phrase is missing");
}
if (!app.includes("it is not fixed at one lot")) {
  throw new Error("Live confirmation does not explain dynamic PAPER sizing");
}

console.log("LIVE paper-rule sizing copy verified");
