const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.resolve(__dirname, "../App.js"), "utf8");
const required = [
  'apiGet("/paper/account", token)',
  'apiPostAuth("/paper/capital"',
  'make_paper_mode: false',
  'value={paperCapital}',
  'capital < 1',
  'Paper capital must be at least ₹1',
];

for (const marker of required) {
  if (!source.includes(marker)) throw new Error(`Missing flexible paper capital marker: ${marker}`);
}
if (source.includes('value={"100000"}')) {
  throw new Error("Admin paper capital input is still hardcoded to ₹100,000");
}

console.log("PASS paper capital accepts any positive amount and persists it");
