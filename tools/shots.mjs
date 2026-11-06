import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.URL || 'http://127.0.0.1:8080/index.html';
const outDir = process.env.OUT;
fs.mkdirSync(outDir, { recursive: true });

const viewports = (process.env.VIEWPORTS || '360x780,390x844,768x1024,1024x768,1440x900')
  .split(',')
  .map((v) => v.split('x').map(Number));

const execPath = fs
  .readdirSync(path.join(process.env.HOME, '.cache/ms-playwright'))
  .filter((d) => d.startsWith('chromium_headless_shell'))
  .map((d) => path.join(process.env.HOME, '.cache/ms-playwright', d, 'chrome-headless-shell-linux64/chrome-headless-shell'))[0];

const browser = await chromium.launch({ executablePath: execPath, args: ['--no-sandbox'] });

for (const [width, height] of viewports) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 800 });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`console.${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`http ${r.status()}: ${r.url()}`));

  await page.goto(URL, { waitUntil: 'networkidle' });
  // Revela tudo e carrega imagens lazy antes da captura
  await page.evaluate(async () => {
    document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-visible'));
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 400));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);

  const metrics = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth,
    winW: window.innerWidth,
    docH: document.documentElement.scrollHeight,
    wide: [...document.querySelectorAll('body *')]
      .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1 && !e.closest('.cmt-gallery'))
      .slice(0, 5)
      .map((e) => `${e.tagName.toLowerCase()}.${e.className}`),
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`),
  }));

  await page.screenshot({ path: path.join(outDir, `full-${width}.png`), fullPage: true });
  await page.screenshot({ path: path.join(outDir, `fold-${width}.png`) });
  console.log(`${width}x${height}`, JSON.stringify({ ...metrics, overflowX: metrics.docW > metrics.winW }), problems.length ? problems : 'sem erros');
  await context.close();
}
await browser.close();
