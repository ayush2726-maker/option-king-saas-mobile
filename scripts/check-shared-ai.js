const https = require("https");

const url = "https://option-king-saas-production.up.railway.app/ai/health";
const attempts = 3;
const timeoutMs = 60000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkOnce(attempt) {
  return new Promise((resolve, reject) => {
    console.log(`Railway AI health attempt ${attempt}/${attempts}...`);

    const request = https.get(url, { timeout: timeoutMs }, (response) => {
      let body = "";

      response.on("data", (chunk) => {
        body += chunk;
      });

      response.on("end", () => {
        let data;
        try {
          data = JSON.parse(body);
        } catch (error) {
          reject(new Error(`Invalid JSON: ${body.slice(0, 300)}`));
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${body.slice(0, 300)}`));
          return;
        }

        if (!data.success || data.service !== "Option King Shared Railway AI") {
          reject(new Error("Health response did not match expected service"));
          return;
        }

        resolve(data);
      });
    });

    request.on("timeout", () => {
      request.destroy(new Error(`request timed out after ${timeoutMs / 1000}s`));
    });

    request.on("error", reject);
  });
}

async function main() {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const data = await checkOnce(attempt);
      console.log(JSON.stringify(data, null, 2));
      console.log("\nRAILWAY SHARED AI HEALTH PASS");
      return;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt < attempts) await sleep(5000);
    }
  }

  console.error("Railway AI health failed after all retries:", lastError?.message || "unknown error");
  process.exit(1);
}

main();
