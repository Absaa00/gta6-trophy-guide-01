// Fresh r3 functional verification for gta6-trophy-guide-01.
// Run: node verify.mjs   (serves app/ itself on a throwaway port)
// Prints PASS/FAIL per check and exits 1 on any failure.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/makefun/playwright-core');

const REPO = '/home/hatch/workspace/makefun/entries/gta6-trophy-guide-01';
const KIT = '/home/hatch/workspace/makefun/gta6-trophy-guide-01-kit27/gta6-trophy-guide-01-kit/starter/app/data/trophies.json';
const PORT = 8095;
const BASE = `http://127.0.0.1:${PORT}`;

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- data checks (no browser) ---
const data = JSON.parse(readFileSync(join(REPO, 'app/data/trophies.json'), 'utf8'));
const kit = JSON.parse(readFileSync(KIT, 'utf8'));
check('data: 55 trophies', data.trophies.length === 55, `${data.trophies.length}`);
const grades = {};
for (const t of data.trophies) grades[t.grade] = (grades[t.grade] ?? 0) + 1;
check('data: grades 1/2/6/46', grades.platinum === 1 && grades.gold === 2 && grades.silver === 6 && grades.bronze === 46, JSON.stringify(grades));
check('data: names match the kit official list exactly',
  data.trophies.every((t, i) => t.name === kit.trophies[i].name));
check('data: descriptions match the kit official list exactly',
  data.trophies.every((t, i) => t.description === kit.trophies[i].description));
check('data: every guide non-blank', data.trophies.every((t) => t.guide.trim().length > 20));
check('data: every trophy cites Exophase + PSNProfiles',
  data.trophies.every((t) => t.sources.some((s) => s.name.startsWith('Exophase')) && t.sources.some((s) => s.name.startsWith('PSNProfiles'))));
const kinds = new Set(['story', 'activity', 'collectible', 'combat', 'exploration', 'side', 'misc']);
check('data: kinds valid, 6 possibly-missable',
  data.trophies.every((t) => kinds.has(t.kind)) &&
  data.trophies.filter((t) => t.missable === 'possible').length === 6);
check('data: ids 1..55 unique',
  new Set(data.trophies.map((t) => t.id)).size === 55 && data.trophies.every((t) => t.id >= 1 && t.id <= 55));

// --- browser checks ---
const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', (d) => { serverLog += d; });
server.stderr.on('data', (d) => { serverLog += d; });
try {
  for (let i = 0; i < 40; i += 1) {
    try { const r = await fetch(`${BASE}/index.html`); if (r.ok) break; } catch { /* not up */ }
    await sleep(250);
  }
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  const external = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.hostname !== '127.0.0.1') external.push(r.url());
  });

  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__shotReady === true, { timeout: 15000 });
  check('app: loads, __shotReady', true);
  check('app: no console/page errors', errors.length === 0, errors.join(' | '));
  check('app: no request leaves localhost', external.length === 0, external.join(' | '));
  check('app: 55 rows render', (await page.locator('.row').count()) === 55);
  check('app: progress starts 0 of 55', (await page.locator('#earnedCount').textContent()) === '0');

  // Tick one trophy, reload, still ticked.
  await page.locator('.row[data-id="2"] input').check();
  await sleep(150);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__shotReady === true, { timeout: 15000 });
  check('app: tick persists across reload', (await page.locator('#earnedCount').textContent()) === '1');
  check('app: progress bar moves', Math.abs(parseFloat(await page.locator('#barFill').evaluate((el) => el.style.width)) - (1 / 55) * 100) < 0.001, await page.locator('#barFill').evaluate((el) => el.style.width));

  // Filters.
  await page.selectOption('#grade', 'silver');
  check('filter: grade silver shows 6', (await page.locator('.row').count()) === 6);
  await page.selectOption('#grade', 'all');
  await page.selectOption('#kind', 'collectible');
  check('filter: kind collectible shows 6', (await page.locator('.row').count()) === 6);
  await page.selectOption('#kind', 'all');
  await page.fill('#q', 'fishing');
  const fishing = await page.locator('.row').count();
  check('filter: search "fishing" finds trophies', fishing >= 2, `${fishing} rows`);
  await page.fill('#q', '');
  await page.selectOption('#status', 'earned');
  check('filter: earned-only shows 1', (await page.locator('.row').count()) === 1);
  await page.selectOption('#status', 'all');

  // Spoiler setting.
  await page.check('#spoiler');
  await sleep(150);
  const bodyHidden = await page.locator('body').innerText();
  check('spoiler: ON hides unearned story names', bodyHidden.includes('Hidden trophy') && !bodyHidden.includes('Paradise Lost'));
  await page.uncheck('#spoiler');
  await sleep(150);
  const bodyShown = await page.locator('body').innerText();
  check('spoiler: OFF shows story names again', bodyShown.includes('Paradise Lost'));

  // Detail pane: guide + sources + UNVERIFIED.
  await page.locator('.row[data-id="17"]').click();
  await sleep(150);
  const detail = await page.locator('#detail').innerText();
  check('detail: shows guide, sources, UNVERIFIED', detail.includes('The Shootist') && detail.includes('Sources') && detail.includes('UNVERIFIED') && detail.includes('42'));

  // Roadmap view: 5 phases covering all 55 exactly once.
  await page.locator('button[data-view="roadmap"]').click();
  await sleep(150);
  const phaseCount = await page.locator('.phase').count();
  const roadmapText = await page.locator('#view-roadmap').innerText();
  check('roadmap: 5 phases, platinum named', phaseCount === 5 && roadmapText.includes('Vice Got a Price!'));

  // Missables view: 6 cards.
  await page.locator('button[data-view="missables"]').click();
  await sleep(150);
  check('missables: 6 possibly-missable cards', (await page.locator('.miss-card').count()) === 6);

  // Export then import round-trip (back on the checklist view: the controls hide on other views).
  await page.locator('button[data-view="checklist"]').click();
  await sleep(150);
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 5000 }),
    page.locator('#exportBtn').click(),
  ]);
  const exported = JSON.parse(await readFileSync(await download.path(), 'utf8'));
  check('export: JSON lists the earned trophy', Array.isArray(exported.earned) && exported.earned.includes(2));
  // Reset, then import the export back.
  page.on('dialog', (d) => d.accept());
  await page.locator('#resetBtn').click();
  await sleep(150);
  check('reset: back to 0 earned', (await page.locator('#earnedCount').textContent()) === '0');
  const tmp = '/tmp/leonida-import-test.json';
  writeFileSync(tmp, JSON.stringify(exported));
  await page.setInputFiles('#importFile', tmp);
  await sleep(200);
  check('import: restores the earned trophy', (await page.locator('#earnedCount').textContent()) === '1');

  await browser.close();
} finally {
  server.kill();
}

// --- screenshot files ---
const shots = JSON.parse(readFileSync(join(REPO, 'shots.json'), 'utf8'));
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const m = buf[i + 1];
    if (m === 0xc0 || m === 0xc2) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}
let shotsOk = true;
for (const s of shots) {
  const p = join(REPO, 'screenshots', s.file);
  if (!existsSync(p)) { check(`shot: ${s.file} exists`, false); shotsOk = false; continue; }
  const buf = readFileSync(p);
  const dim = jpegSize(buf);
  const ok = buf.length <= 262144 && dim && dim.w === 1280 && dim.h === 800;
  if (!ok) shotsOk = false;
  check(`shot: ${s.file} 1280x800, <=256KiB`, ok, `${buf.length} bytes, ${dim ? `${dim.w}x${dim.h}` : 'no dims'}`);
}
check('shots: 4 files', shots.length === 4);

// --- determinism of main.ts ---
mkdirSync('/tmp/leonida-out1', { recursive: true });
mkdirSync('/tmp/leonida-out2', { recursive: true });
const { execFileSync } = await import('node:child_process');
try {
  execFileSync('node', ['main.ts'], { cwd: REPO, env: { ...process.env, MAKEFUN_OUTPUT_DIR: '/tmp/leonida-out1' }, stdio: 'pipe' });
  execFileSync('node', ['main.ts'], { cwd: REPO, env: { ...process.env, MAKEFUN_OUTPUT_DIR: '/tmp/leonida-out2' }, stdio: 'pipe' });
  const d1 = readFileSync('/tmp/leonida-out1/dossier.json');
  const d2 = readFileSync('/tmp/leonida-out2/dossier.json');
  check('determinism: dossier.json byte-identical across 2 runs', d1.equals(d2), `${d1.length} bytes`);
} catch (e) {
  check('determinism: main.ts runs twice', false, String(e.message).slice(0, 200));
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) { console.log('FAILED:', failed.map((c) => c.name).join(' | ')); process.exitCode = 1; }
