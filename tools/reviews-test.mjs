import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const base = path.join(process.env.HOME, '.cache/ms-playwright');
const execPath = fs
  .readdirSync(base)
  .filter((d) => d.startsWith('chromium_headless_shell'))
  .map((d) => path.join(base, d, 'chrome-headless-shell-linux64/chrome-headless-shell'))[0];

// carol.test aponta para 127.0.0.1 -> simula ambiente de produção (não-local)
const browser = await chromium.launch({
  executablePath: execPath,
  args: ['--no-sandbox', '--host-resolver-rules=MAP carol.test 127.0.0.1'],
});

const run = async (label, url, setup) => {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  if (setup) await setup(page);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const state = await page.$eval('#reviews-widget', (n) => ({
    hidden: n.hidden,
    text: n.textContent.trim().slice(0, 90),
    cards: n.querySelectorAll('.review-card').length,
  }));
  console.log(label, JSON.stringify(state));
};

await run('produção + dados de exemplo  ->', 'http://carol.test:8080/index.html');
await run('local + dados de exemplo     ->', 'http://127.0.0.1:8080/index.html');
await run('produção + JSON indisponível ->', 'http://carol.test:8080/index.html', (p) => p.route('**/reviews.json', (r) => r.fulfill({ status: 404 })));
await run(
  'produção + dados reais (simulado) ->',
  'http://carol.test:8080/index.html',
  (p) =>
    p.route('**/reviews.json', (r) =>
      r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ rating: 4.9, userRatingCount: 2, reviews: [{ author: '<b>Teste</b>', rating: 5, text: '<img src=x onerror=alert(1)> ok', when: 'há 1 mês' }] }),
      })
    )
);
await browser.close();
