const fs = require('fs');
const path = 'App.js';
let s = fs.readFileSync(path, 'utf8');

const marker = 'OKAI-DAILY-BACKTEST-ASYNC-V3';
if (s.includes(marker)) {
  console.log('Daily async V3 already applied');
  process.exit(0);
}

const anchor = '  async function runBacktest() {';
if (!s.includes(anchor)) throw new Error('runBacktest anchor not found');

const poll = `  // ${marker}\n  async function pollDailyJob(jobId) {\n    for (let attempt = 0; attempt < 300; attempt += 1) {\n      await new Promise((resolve) => setTimeout(resolve, 2000));\n      const status = await apiGet(\n        \`/backtest/daily/status/\${jobId}\`,\n        token,\n      );\n\n      if (status?.status === \"COMPLETED\") {\n        return status.result;\n      }\n\n      if (\n        status?.status === \"FAILED\" ||\n        status?.status === \"NOT_FOUND\" ||\n        status?.status === \"FORBIDDEN\"\n      ) {\n        throw new Error(\n          status?.error || status?.message || \"Daily backtest failed\",\n        );\n      }\n    }\n\n    throw new Error(\"Daily backtest timeout. Please try again.\");\n  }\n\n`;
s = s.replace(anchor, poll + anchor);

const oldBlock = `      } else {\n        body.date = date;\n\n        const dailyResult = await apiPostAuth(\n          \"/backtest/run\",\n          body,\n          token,\n        );\n        setResult(dailyResult ? {\n          ...dailyResult,\n          trades: Array.isArray(dailyResult?.trades) ? dailyResult.trades.slice(0, 100) : dailyResult?.trades,\n        } : dailyResult);\n      }`;

const newBlock = `      } else {\n        body.date = date;\n\n        const started = await apiPostAuth(\n          \"/backtest/daily/start\",\n          body,\n          token,\n        );\n\n        if (!started?.success) {\n          throw new Error(\n            started?.message || started?.error || \"Daily job start failed\",\n          );\n        }\n\n        if (!started?.job_id) {\n          throw new Error(\"Daily job id missing\");\n        }\n\n        const dailyResult = await pollDailyJob(started.job_id);\n        setResult(dailyResult ? {\n          ...dailyResult,\n          trades: Array.isArray(dailyResult?.trades) ? dailyResult.trades.slice(0, 100) : dailyResult?.trades,\n        } : dailyResult);\n      }`;

if (!s.includes(oldBlock)) throw new Error('Old synchronous daily block not found');
s = s.replace(oldBlock, newBlock);
fs.writeFileSync(path, s);
console.log('Applied Daily Backtest async V3');
