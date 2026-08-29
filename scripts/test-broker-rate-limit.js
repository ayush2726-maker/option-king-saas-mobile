const fs = require("fs");

const app = fs.readFileSync("App.js", "utf8");

const required = [
  "const [testCooldown, setTestCooldown] = useState(0)",
  "const testInFlight = useRef(false)",
  "if (testInFlight.current || testing || testCooldown > 0) return",
  "d?.rate_limited || d?.status === \"rate_limited\"",
  "disabled={testCooldown > 0}",
  "Retry in ${testCooldown}s",
  "Upstox request limit reached",
];

for (const text of required) {
  if (!app.includes(text)) {
    throw new Error(`Missing broker rate-limit guard: ${text}`);
  }
}

console.log("Broker rate-limit UI guard verified");
