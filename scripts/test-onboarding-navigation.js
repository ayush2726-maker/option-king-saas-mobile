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

const assistant = fs.readFileSync(
  path.join(__dirname, "../src/components/CustomerOnboardingAssistant.js"),
  "utf8"
);

const buttonWiring = [
  ["Open Account", /label:'Open Account',onPress:\(\)=>openRoute\('account'\)/],
  ["Secure IP", /onPress:\(state\.gatewayReady \|\| ipReady \|\| provisionStarted\)\?load:requestProvisioning/],
  ["Connect Broker", /label:state\.brokerReady\?'Review Broker':ipReady\?'Connect Broker Now':'Complete Static IP First',onPress:\(\)=>openRoute\('broker'\),disabled:!ipReady/],
  ["Paper Bot", /label:!state\.brokerReady\?'Connect Broker First':paperAllowed\?'Open Paper Bot':'Paper Access Expired',onPress:\(\)=>openRoute\('bot'\),disabled:!state\.brokerReady \|\| !paperAllowed/],
  ["Live Controls", /label:liveAllowed && state\.gatewayReady\?'Go to Live Controls':'Live Not Ready',onPress:\(\)=>openRoute\('bot'\)/],
  ["Subscription", /label:'Open Subscription',onPress:openSubscription/],
  ["Refresh", /onPress:load,disabled:loading/],
];

buttonWiring.forEach(([name, pattern]) => {
  assert(pattern.test(assistant), `${name} button is not wired to its expected action`);
});

const orderedSteps = [
  "Account Created",
  "Get Your Dedicated Static IP",
  "Connect Your Broker",
  "Test with Paper Trading",
  "Enable Live Trading",
  "Choose a Plan After the Trial",
];
let previousIndex = -1;
orderedSteps.forEach((title) => {
  const currentIndex = assistant.indexOf(`title:'${title}'`);
  assert(currentIndex > previousIndex, `${title} is not in the correct setup order`);
  previousIndex = currentIndex;
});

assert(
  /const stage=!ipReady\?2:!state\.brokerReady\?3:/.test(assistant),
  "Broker setup must not become the active step before a static IP is ready"
);

assert(
  /if \(nav\(route\)\) \{\s*setOpen\(false\)/.test(assistant),
  "The popup must close only after navigation succeeds"
);

console.log("PASS OKAI-ONBOARDING-BUTTON-NAVIGATION");
