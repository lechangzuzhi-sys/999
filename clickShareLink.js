const { chromium } = require('playwright');
const config = require('./MMSLS');

function getShareLinks() {
  if (Array.isArray(config.shareLinks)) {
    return config.shareLinks.filter(Boolean);
  }

  const fallback = [config.shareLink, config.link, process.env.SHARE_LINK]
    .filter(Boolean)
    .map((item) => String(item).trim());

  return fallback;
}

async function run() {
  const links = getShareLinks();

  if (links.length === 0) {
    throw new Error('没有找到分享链接，请在 MMSLS.js 中填写你的链接，或在 GitHub Secrets/Variables 中设置 SHARE_LINK。');
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  for (const rawLink of links) {
    const link = String(rawLink).trim();
    if (!link) continue;

    try {
      console.log(`正在打开: ${link}`);
      await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);

      const clickable = page.locator('a,button').filter({ hasText: /领取|打开|点击|立即|注册|分享|进入/i }).first();
      if (await clickable.count()) {
        await clickable.click({ timeout: 10000 }).catch(() => {});
      }

      await page.waitForTimeout(5000);
    } catch (error) {
      console.error(`打开失败: ${link}`);
      console.error(error.message);
    }
  }

  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
