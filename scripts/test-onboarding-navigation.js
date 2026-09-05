const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Module = require("module");

const originalLoad = Module._load;
const fakeReact = {
  useState(initialValue) {
    return [initialValue, () => {}];
  },
};

Module._load = function mockNavigationDependencies(request, parent, isMain) {
  if (request === "react") return fakeReact;
  if (request === "react-native") return { Platform: { OS: "android" } };
  return originalLoad.call(this, request, parent, isMain);
};

const {
  captureDashboardSetter,
  navigate,
} = require("../src/runtime/WebNavigationBridge");

Module._load = originalLoad;

let openedRoute = null;
assert.strictEqual(
  captureDashboardSetter("home", "home", (route) => { openedRoute = route; }),
  true,
  "Android dashboard navigation setter should be captured"
);

["account", "broker", "bot", "plans", "localgateway"].forEach((route) => {
  openedRoute = null;
  assert.strictEqual(navigate(route), true, `${route} should be a valid route`);
  assert.strictEqual(openedRoute, route, `${route} should reach the dashboard setter`);
});

assert.strictEqual(navigate("unknown-page"), false, "Unknown routes must remain blocked");

const indexSource = fs.readFileSync(path.join(__dirname, "../index.js"), "utf8");
assert(
  indexSource.includes("require('./src/components/CustomerOnboardingAssistantV2')"),
  "The tested onboarding assistant must be the one mounted by index.js"
);

const assistant = fs.readFileSync(
  path.join(__dirname, "../src/components/CustomerOnboardingAssistantV2.js"),
  "utf8"
);

const buttonWiring = [
  ["Open Account", /label:'Open Account',onPress:\(\)=>openRoute\('account'\)/],
  ["Allocate IP", /label:state\.assignedIp\?'Refresh IP Status':busy==='allocate'\?'Starting\.\.\.':'Allocate My Secure IP'/],
  ["Angel One portal", /angelone: 'https:\/\/smartapi\.angelone\.in\/publisher-login\/v2\/login\/'/],
  ["Upstox portal", /upstox: 'https:\/\/account\.upstox\.com\/developer\/apps'/],
  ["Open selected portal", /await RN\.Linking\.openURL\(portal\)/],
  ["Persist broker choice", /\{broker_name:brokerName\}/],
  ["Enter credentials", /'Enter Credentials in Option King AI'/],
  ["Broker setup", /onPress:\(\)=>openRoute\('broker'\),disabled:!state\.assignedIp \|\| !state\.chosenBroker/],
  ["Paper Bot", /label:paperAllowed\?'Open Paper Bot':'Paper Access Expired'/],
  ["Subscription", /label:'Open Subscription',onPress:\(\)=>openRoute\('plans'\)/],
  ["Refresh", /onPress:load,disabled:loading/],
];

buttonWiring.forEach(([name, pattern]) => {
  assert(pattern.test(assistant), `${name} button is not wired to its expected action`);
});

const orderedSteps = [
  "Account Created",
  "Get Your Dedicated Static IP",
  "Select Broker & Create API Credentials",
  "Test Paper Trading First",
  "Verify Secure Connection",
];
let previousIndex = -1;
orderedSteps.forEach((title) => {
  const currentIndex = assistant.indexOf(`title:'${title}'`);
  assert(currentIndex > previousIndex, `${title} is not in the correct setup order`);
  previousIndex = currentIndex;
});

assert(
  /let stage = 2;\s*if \(state\.assignedIp\) stage = 3;\s*if \(state\.brokerReady\) stage = 4;/.test(assistant),
  "Static IP must be completed before broker credentials become the active step"
);

assert(
  /setPaperAck\(true\);\s*setExpanded\(5\)/.test(assistant),
  "Completing Paper Trading must open the secure connection step"
);

console.log("PASS OKAI-ONBOARDING-BUTTON-NAVIGATION");
