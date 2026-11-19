// Leonida Ledger — local verification. Drives the guide in headless Chromium and
// checks every feature the task promises: 55 trophies render, checklist toggle
// persists across reload, kind/grade/status filters, search, the spoiler setting,
// counters, notes, export and import, the roadmap's 55 chips in 7 stages, the
// missables page (1 flagged + 54 safe), the planner, zero console errors and
// zero failed requests. Then runs main.ts twice and checks the dossier.
//
// Usage: node verify.mjs   (run from this repository's root; exits non-zero on failure)

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/makefun/playwright-core');

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 8902;
const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';

const failures = [];
const problems = [];
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}

function startServer() {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: here, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    const timer = setTimeout(() => rejectPromise(new Error('server did not start in time')), 10000);
    child.stdout.on('data', (chunk) => {
      out += chunk;
      if (out.includes(`:${PORT}`)) { clearTimeout(timer); resolvePromise(child); }
    });
    child.on('error', rejectPromise);
  });
}

const server = await startServer();
let browser;
try {
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`); });
  page.on('pageerror', (err) => problems.push(`page error: ${err.message}`));
  page.on('requestfailed', (req) => problems.push(`failed request: ${req.url()}`));

  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.trophy-row', { timeout: 10000 });

  // 55 rows render; header counts agree.
  check('55 trophies render', (await page.locator('.trophy-row').count()) === 55);
  check('header starts 0 / 55', (await page.locator('#bigCount').innerText()).includes('0'));

  // Toggle persists across reload.
  await page.click('[data-trophy-id="2"] input[type="checkbox"]');
  await page.waitForTimeout(200);
  check('toggle updates header', (await page.locator('#bigCount').innerText()).includes('1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.trophy-row');
  check('toggle persists after reload', (await page.locator('#bigCount').innerText()).includes('1'));
  await page.click('[data-trophy-id="2"] input[type="checkbox"]');
  await page.waitForTimeout(200);

  // Filters.
  await page.selectOption('#kindFilter', 'collectibles');
  check('kind filter collectibles = 8', (await page.locator('.trophy-row').count()) === 8);
  await page.selectOption('#kindFilter', 'all');
  await page.selectOption('#gradeFilter', 'silver');
  check('grade filter silver = 6', (await page.locator('.trophy-row').count()) === 6);
  await page.selectOption('#gradeFilter', 'all');
  await page.fill('#search', 'meditat');
  check('search "meditat" = 3', (await page.locator('.trophy-row').count()) === 3);
  await page.fill('#search', 'WAiNK');
  check('search "WAiNK" = 1', (await page.locator('.trophy-row').count()) === 1);
  await page.fill('#search', '');
  await page.selectOption('#statusFilter', 'remaining');
  check('status remaining = 55', (await page.locator('.trophy-row').count()) === 55);
  await page.selectOption('#statusFilter', 'all');

  // Spoiler setting: on (default) masks un-earned story trophies; off reveals them.
  const masked = await page.locator('.trophy-row .spoiler-mask').count();
  check('spoiler on masks story trophies', masked > 0, `${masked} masked`);
  await page.uncheck('#spoilerToggle');
  await page.waitForTimeout(200);
  check('spoiler off unmasks all', (await page.locator('.trophy-row .spoiler-mask').count()) === 0);
  check('spoiler off shows chapter name', (await page.locator('.trophy-row').first().innerText()).includes('Vice Got a Price'));
  await page.check('#spoilerToggle');

  // Detail pane: guide + sources for a trophy.
  await page.uncheck('#spoilerToggle');
  await page.click('[data-trophy-id="28"]');
  await page.waitForTimeout(200);
  const detail = await page.locator('#detailPane').innerText();
  check('detail shows guide + sources', detail.includes('Possibly missable') && detail.includes('SOURCES') && detail.includes('PowerPyx'));

  // Counter: +1 on Cunning Stunts, persists across reload.
  await page.click('[data-trophy-id="15"]');
  await page.waitForTimeout(200);
  await page.locator('#detailPane .counter-row .btn').nth(1).click();
  await page.waitForTimeout(200);
  check('counter increments', (await page.locator('#detailPane .c-count').innerText()).includes('1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.trophy-row');
  await page.uncheck('#spoilerToggle');
  await page.click('[data-trophy-id="15"]');
  await page.waitForTimeout(200);
  check('counter persists after reload', (await page.locator('#detailPane .c-count').innerText()).includes('1'));

  // Note: typed note persists.
  await page.locator('#detailPane textarea').fill('test note: range by the docks');
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.trophy-row');
  await page.click('[data-trophy-id="15"]');
  await page.waitForTimeout(200);
  check('note persists after reload', (await page.locator('#detailPane textarea').inputValue()) === 'test note: range by the docks');

  // Export downloads a file carrying the earned trophy and the note. Mark one
  // earned first, so the round-trip has something to restore.
  await page.locator('#detailPane .counter-row .btn').nth(2).click();
  await page.waitForTimeout(200);
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await page.click('#exportBtn');
  const download = await downloadPromise;
  const exportPath = join(here, 'out-export-check.json');
  await download.saveAs(exportPath);
  const exported = JSON.parse(readFileSync(exportPath, 'utf8'));
  check('export carries earned + note', Boolean(exported.earned && exported.notes && exported.notes['15'] === 'test note: range by the docks'));

  // Import: clear state, import the file back, progress returns.
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.trophy-row');
  check('cleared state is 0 / 55', (await page.locator('#bigCount').innerText()).includes('0'));
  await page.locator('#importFile').setInputFiles(exportPath);
  await page.waitForTimeout(400);
  check('import restores progress', (await page.locator('#bigCount').innerText()).includes('1'));

  // Roadmap: 7 stages, 55 chips, each trophy exactly once.
  await page.click('#tab-roadmap');
  const stageCount = await page.locator('#roadmapStages .stage').count();
  const chipCount = await page.locator('#roadmapStages .chips button').count();
  check('roadmap has 7 stages', stageCount === 7, `${stageCount} stages`);
  check('roadmap has 55 chips', chipCount === 55, `${chipCount} chips`);

  // Missables: 1 flagged + 54 safe rows.
  await page.click('#tab-missables');
  const safeRows = await page.locator('#safeRows tr').count();
  const callout = await page.locator('#missCallout').innerText();
  check('missables page: 54 safe rows', safeRows === 54, `${safeRows} rows`);
  check('missables callout names the one', callout.includes('Positive Mental Attitude'));

  // Planner: 5 next-up cards.
  await page.click('#tab-planner');
  check('planner shows 5 next-up cards', (await page.locator('#plannerList .next-card').count()) === 5);

  check('zero console errors / failed requests', problems.length === 0, problems.join(' | ') || 'clean');
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill();
}

// main.ts: run twice, dossier must be byte-identical and under the 1.5 MiB cap.
const { execFileSync } = await import('node:child_process');
function runMain(outDir) {
  execFileSync('node', ['main.ts'], { cwd: here, env: { ...process.env, MAKEFUN_OUTPUT_DIR: outDir }, stdio: 'pipe' });
}
runMain(join(here, 'out'));
const dossier1 = readFileSync(join(here, 'out', 'dossier.json'));
runMain(join(here, 'out2'));
const dossier2 = readFileSync(join(here, 'out2', 'dossier.json'));
check('dossier under 1.5 MiB', dossier1.length <= 1572864, `${dossier1.length} bytes`);
check('dossier deterministic across runs', createHash('sha256').update(dossier1).digest('hex') === createHash('sha256').update(dossier2).digest('hex'));
check('out has app + screenshots + dossier', statSync(join(here, 'out', 'app', 'index.html')).isFile() && statSync(join(here, 'out', 'screenshots', '1-checklist.jpg')).isFile());
const shotSizes = [1, 2, 3, 4].map((n) => statSync(join(here, 'screenshots', `${n}-${['checklist', 'roadmap', 'missables', 'planner'][n - 1]}.jpg`)).size);
check('all screenshots ≤ 256 KiB', shotSizes.every((s) => s <= 262144), shotSizes.join(', '));

console.log(failures.length ? `\n${failures.length} FAILURES` : '\nAll checks passed.');
process.exit(failures.length ? 1 : 0);
