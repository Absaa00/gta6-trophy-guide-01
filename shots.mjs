// Leonida Trophy Guide — screenshot maker (a dev tool, not part of the entry).
// Serves app/ on localhost, opens it in headless Chromium at 1280x800 and
// takes the 4 screenshots for screenshots/: the checklist with a guide open,
// the roadmap, the missables page, and the spoiler setting at work. Progress
// is seeded in localStorage for the screenshots only, the way a player with
// 13 trophies earned would see the guide; the app itself starts empty.
// Run: node shots.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pwPath = process.env.PLAYWRIGHT_CORE || '/home/hatch/workspace/makefun/playwright-core';
const { chromium } = require(pwPath);

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'app');
const outDir = join(fileURLToPath(new URL('.', import.meta.url)), 'screenshots');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const file = normalize(join(root, path));
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end('forbidden'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

const SEEDED = {
  earned: { 2: true, 3: true, 4: true, 8: true, 9: true, 15: true, 16: true, 19: true, 21: true, 31: true, 35: true, 36: true, 55: true },
  counts: { 15: 87, 19: 12, 31: 42, 35: 61, 55: 6 },
  notes: { 28: 'Do this FIRST — Jason\u2019s house spot, Chapter 1.' },
  spoiler: false,
  selected: 28,
};

await new Promise((resolve) => server.listen(8901, resolve));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
const failed = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => failed.push(r.url()));
page.on('response', (r) => { if (r.status() >= 400) failed.push(r.url() + ' -> ' + r.status()); });

await page.addInitScript((seeded) => {
  localStorage.setItem('leonida-trophy-guide-v1', JSON.stringify(seeded));
}, SEEDED);
await page.goto('http://localhost:8901/', { waitUntil: 'networkidle' });
await page.waitForSelector('#trophyList li:nth-child(55)', { timeout: 10000 });
await page.waitForTimeout(400);

async function shot(name) {
  const file = join(outDir, name);
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  const size = (await stat(file)).size;
  console.log(name, size + ' bytes' + (size > 262144 ? ' — OVER 256 KiB!' : ''));
}

// 1 — cover: checklist with the missable trophy's guide open beside it.
await shot('1-checklist.jpg');
// 2 — the roadmap to the Platinum.
await page.click('[data-tab="roadmap"]');
await page.waitForTimeout(300);
await shot('2-roadmap.jpg');
// 3 — the missables page.
await page.click('[data-tab="missables"]');
await page.waitForTimeout(300);
await shot('3-missables.jpg');
// 4 — checklist with the spoiler setting on: story trophies hidden.
await page.click('[data-tab="checklist"]');
await page.check('#spoilerToggle');
await page.waitForTimeout(300);
await shot('4-spoilers.jpg');

await browser.close();
server.close();
console.log('console errors:', errors.length ? errors : 'none');
console.log('failed requests:', failed.length ? failed : 'none');
