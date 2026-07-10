const https = require("https");

const url = "https://option-king-saas-production.up.railway.app/ai/health";

const request = https.get(url, { timeout: 15000 }, (response) => {
  let body = "";

  response.on("data", (chunk) => {
    body += chunk;
  });

  response.on("end", () => {
    let data;
    try {
      data = JSON.parse(body);
    } catch (error) {
      console.error("Railway AI returned invalid JSON:");
      console.error(body.slice(0, 500));
      process.exit(1);
    }

    console.log(JSON.stringify(data, null, 2));

    if (response.statusCode !== 200) {
      console.error(`Railway AI health failed: HTTP ${response.statusCode}`);
      process.exit(1);
    }

    if (!data.success || data.service !== "Option King Shared Railway AI") {
      console.error("Railway AI health response did not match expected service.");
      process.exit(1);
    }

    console.log("\nRAILWAY SHARED AI HEALTH PASS");
  });
});

request.on("timeout", () => {
  request.destroy(new Error("Railway AI health request timed out"));
});

request.on("error", (error) => {
  console.error("Railway AI health failed:", error.message);
  process.exit(1);
});
