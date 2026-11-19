// Leonida Ledger — screenshots. Serves app/ with serve.ts, opens it in headless
// Chromium (Playwright core, cached build), seeds a realistic save (13 of 55
// earned, counters part way), and takes 4 JPEG shots at 1280x800 — the cover with
// a trophy's guide open beside the checklist, then the roadmap, the missables
// page and the planner. Fails loudly on any console error or failed request.
//
// Usage: node shots.mjs   (run from this repository's root)

import { spawn } from 'node:child_process';
import { statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/makefun/playwright-core');

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 8901;
const SHOTS_DIR = join(here, 'screenshots');
const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';

// A realistic mid-run save: 13 earned, a few counters part way, one note.
const SEED = {
  app: 'Leonida Ledger',
  version: 1,
  earned: { 2: true, 3: true, 4: true, 5: true, 8: true, 9: true, 10: true, 16: true, 20: true, 21: true, 44: true, 46: true, 51: true },
  notes: { 28: 'Balcony meditation done in Ch1 — do not skip it.' },
  counters: { 15: 87, 28: 6, 31: 34, 35: 41, 42: 23, 52: 64000 },
  spoilers: true,
};

const SHOTS = [
  { file: '1-checklist.jpg', tab: 'checklist', spoilers: false, click: '[data-trophy-id="28"]' },
  { file: '2-roadmap.jpg', tab: 'roadmap', spoilers: true },
  { file: '3-missables.jpg', tab: 'missables', spoilers: true },
  { file: '4-planner.jpg', tab: 'planner', spoilers: true },
];

function startServer() {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: here, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    const timer = setTimeout(() => rejectPromise(new Error('server did not start in time')), 10000);
    child.stdout.on('data', (chunk) => {
      out += chunk;
      if (out.includes(`:${PORT}`)) { clearTimeout(timer); resolvePromise(child); }
    });
    child.stderr.on('data', (chunk) => { out += chunk; });
    child.on('error', rejectPromise);
  });
}

const server = await startServer();
const problems = [];
let browser;
try {
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  mkdirSync(SHOTS_DIR, { recursive: true });
  for (const shot of SHOTS) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const seed = { ...SEED, spoilers: shot.spoilers };
    await context.addInitScript((state) => {
      window.localStorage.setItem('leonida-ledger-v1', JSON.stringify(state));
    }, seed);
    const page = await context.newPage();
    page.on('console', (msg) => { if (msg.type() === 'error') problems.push(`${shot.file}: console error: ${msg.text()}`); });
    page.on('pageerror', (err) => problems.push(`${shot.file}: page error: ${err.message}`));
    page.on('requestfailed', (req) => problems.push(`${shot.file}: failed request: ${req.url()}`));
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.trophy-row', { timeout: 10000 });
    if (shot.tab !== 'checklist') await page.click(`#tab-${shot.tab}`);
    if (shot.click) {
      await page.click(shot.click);
      await page.waitForTimeout(300);
    }
    // The click scrolls the row into view; bring the header and toolbar back
    // into frame so the cover shows the whole guide at a glance. The detail
    // pane is sticky, so the open guide stays visible.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const path = join(SHOTS_DIR, shot.file);
    await page.screenshot({ path, type: 'jpeg', quality: 80 });
    const size = statSync(path).size;
    console.log(`${shot.file}: ${size} bytes${size > 262144 ? ' — OVER 256 KiB!' : ''}`);
    if (size > 262144) problems.push(`${shot.file}: over 256 KiB (${size})`);
    await context.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}

if (problems.length) {
  console.error('PROBLEMS:');
  for (const problem of problems) console.error(` - ${problem}`);
  process.exit(1);
}
console.log('All 4 screenshots taken, no console errors, no failed requests.');
