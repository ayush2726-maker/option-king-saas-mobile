const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const share = 'https://firestorage.ai/ja/f/aLo6OncAb6_I';
  let saved = false;

  await page.goto(share, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(10000);

  const candidates = [
    page.getByText('Option King AI.apk', { exact: false }),
    page.getByRole('link', { name: /Option King AI\.apk/i }),
    page.getByRole('button', { name: /Option King AI\.apk/i }),
    page.getByRole('button', { name: /download|ダウンロード/i }),
    page.getByRole('link', { name: /download|ダウンロード/i })
  ];

  for (const locator of candidates) {
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < count && !saved; i++) {
      const el = locator.nth(i);
      if (!(await el.isVisible().catch(() => false))) continue;
      try {
        const dlPromise = page.waitForEvent('download', { timeout: 30000 });
        await el.click({ timeout: 15000 });
        const dl = await dlPromise;
        await dl.saveAs('Option-King-AI.apk');
        saved = true;
      } catch (_) {}
    }
    if (saved) break;
  }

  await browser.close();
  if (!saved || !fs.existsSync('Option-King-AI.apk')) {
    throw new Error('Could not download APK from firestorage share');
  }
  const size = fs.statSync('Option-King-AI.apk').size;
  console.log('APK SIZE', size);
  if (size < 80000000 || size > 95000000) {
    throw new Error(`Unexpected APK size ${size}`);
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
