const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const component = fs.readFileSync(
  path.join(root, "src/components/AdminUserPnlCard.js"),
  "utf8"
);
const app = fs.readFileSync(path.join(root, "App.js"), "utf8");

function requireText(source, marker, label) {
  if (!source.includes(marker)) {
    throw new Error(`Missing ${label}: ${marker}`);
  }
}

requireText(component, '"/admin/users/pnl"', "secure P&L endpoint");
requireText(component, "Today Net P&L", "today summary");
requireText(component, "Current Open P&L", "open summary");
requireText(component, "All-time Net P&L", "all-time summary");
requireText(component, "user?.paper?.all_time?.net_pnl", "paper P&L");
requireText(component, "user?.live?.all_time?.net_pnl", "live P&L");
requireText(component, "user?.active_mode", "active mode label");
requireText(component, "user?.open_pnl", "mode-aware open P&L");
requireText(component, "unpriced_open_trades", "unpriced trade warning");
if (component.includes("user?.combined?.all_time?.open_pnl")) {
  throw new Error("User card must not mix paper and live open P&L");
}
requireText(app, 'require("./src/components/AdminUserPnlCard")', "component import");

const renderCount = (app.match(/<AdminUserPnlCard token=\{token\} \/>/g) || []).length;
if (renderCount !== 2) {
  throw new Error(`Expected P&L card in Admin and Account screens, found ${renderCount}`);
}

console.log("Admin user P&L is available natively in Admin and Account screens");
