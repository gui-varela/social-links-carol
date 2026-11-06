import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const URL = process.env.URL || 'http://127.0.0.1:8080/index.html';
const base = path.join(process.env.HOME, '.cache/ms-playwright');
const execPath = fs
  .readdirSync(base)
  .filter((d) => d.startsWith('chromium_headless_shell'))
  .map((d) => path.join(base, d, 'chrome-headless-shell-linux64/chrome-headless-shell'))[0];

const browser = await chromium.launch({ executablePath: execPath, args: ['--no-sandbox'] });

for (const [w, h] of [[390, 844], [1440, 900]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-visible')));
  await page.waitForTimeout(1000);
  await page.evaluate(axeSource);
  const results = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }));
  console.log(`\n== ${w}px: ${results.violations.length} violações`);
  for (const v of results.violations) {
    console.log(`- [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 4)) console.log(`    ${n.target.join(' ')} :: ${(n.failureSummary || '').split('\n')[1] || ''}`);
  }

  // Ordem de foco e checagem de links
  if (w === 1440) {
    const links = await page.$$eval('a[href]', (as) => as.map((a) => ({ href: a.getAttribute('href'), target: a.target, rel: a.rel })));
    const bad = links.filter((l) => l.target === '_blank' && !/noopener/.test(l.rel));
    console.log('links:', links.length, 'target=_blank sem noopener:', bad.length);
    const wa = [...new Set(links.filter((l) => l.href.includes('whatsapp')).map((l) => l.href))];
    console.log('deeplinks únicos do WhatsApp:', wa.length);
    for (const u of wa) console.log('  ', decodeURIComponent(new globalThis.URL(u.replace(/&amp;/g, '&')).searchParams.get('text')), '| phone=', new globalThis.URL(u).searchParams.get('phone'));
  }
}
await browser.close();
