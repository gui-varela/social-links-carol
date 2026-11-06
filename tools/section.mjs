import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

// uso: node section.mjs <largura> <altura> <seletor> <arquivo-saida> [acao]
const [w, h, selector, out, action] = process.argv.slice(2);
const URL = process.env.URL || 'http://127.0.0.1:8080/index.html';
const base = path.join(process.env.HOME, '.cache/ms-playwright');
const execPath = fs
  .readdirSync(base)
  .filter((d) => d.startsWith('chromium_headless_shell'))
  .map((d) => path.join(base, d, 'chrome-headless-shell-linux64/chrome-headless-shell'))[0];

const browser = await chromium.launch({ executablePath: execPath, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: +w, height: +h }, hasTouch: +w < 800 });
const page = await context.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'start' }), selector);
await page.waitForTimeout(1200);
if (action === 'open-faq') {
  await page.click('.faq-list details:nth-of-type(2) summary');
  await page.waitForTimeout(700);
}
if (action === 'next-review') {
  await page.click('.review-controls button[aria-label="Próximo depoimento"]');
  await page.waitForTimeout(900);
}
await page.screenshot({ path: out });
await browser.close();
