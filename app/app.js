// Leonida Trophy Guide — tracker + guide for the 55 GTA VI PS5 trophies.
// Fresh r3 code. Offline: the only fetch is the local trophies.json beside this file.
const KEY = 'leonida-trophy-guide-v3';
const params = new URLSearchParams(location.search);

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

const PHASES = [
  { title: 'Phase 1 — Play the story', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 22, 23, 24, 26, 27, 25],
    text: 'Chapters 1–4, the final mission, the named story missions and the stranger strands. These pop from playing the main missions in order — no grinding, no detours needed.' },
  { title: 'Phase 2 — Do these at the first chance (possibly missable)', ids: [33, 34, 47, 48, 49, 50],
    text: 'The only six whose descriptions point at a moment that might not come back: two need your partner beside you, one counts choices, one needs a second try, one is a strange random event. Grab each the first time the chance appears.' },
  { title: 'Phase 3 — Activities & grinds', ids: [15, 16, 17, 18, 19, 20, 21, 28, 32, 36, 51],
    text: 'Stunts, the shooting range, drone races, fishing, the arcade, meditation, challenges and Combat Focus. All replayable — grind them in free roam after the story.' },
  { title: 'Phase 4 — World, heists & collectibles', ids: [29, 30, 31, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 52, 53, 54, 55],
    text: 'Cards, WAiNK spots, vehicles, areas, gang operations, bank vaults, armored trucks, the Ocean Beach cocktail, bowling and the money trophies. Sweep Leonida at your own pace.' },
  { title: 'Phase 5 — Cleanup: 100% & platinum', ids: [14, 1],
    text: 'Check the in-game stats for what 100% completion still needs, finish it, and the platinum pops with the last trophy.' },
];

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]').filter((id) => byId.has(id)));
let selectedId = Number(params.get('t')) || 1;
if (!byId.has(selectedId)) selectedId = 1;

const $ = (id) => document.getElementById(id);
const rowsEl = $('rows');
const detailEl = $('detail');

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function gradeCounts() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.id)) counts[t.grade] += 1;
  return counts;
}

function renderProgress() {
  const c = gradeCounts();
  $('earnedCount').textContent = String(earned.size);
  $('barFill').style.width = `${(earned.size / trophies.length) * 100}%`;
  $('gradeCounts').innerHTML =
    `Platinum <b>${c.platinum}/1</b> · Gold <b>${c.gold}/2</b> · Silver <b>${c.silver}/6</b> · Bronze <b>${c.bronze}/46</b>`;
}

function spoilerOn() { return $('spoiler').checked; }
function hiddenBySpoiler(t) {
  return spoilerOn() && t.kind === 'story' && !earned.has(t.id);
}

function visibleTrophies() {
  const q = $('q').value.trim().toLowerCase();
  const kind = $('kind').value;
  const grade = $('grade').value;
  const status = $('status').value;
  const missOnly = $('missableOnly').checked;
  return trophies.filter((t) => {
    if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (status === 'earned' && !earned.has(t.id)) return false;
    if (status === 'remaining' && earned.has(t.id)) return false;
    if (missOnly && t.missable !== 'possible') return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderRows() {
  const list = visibleTrophies();
  $('shownCount').textContent = `Showing ${list.length} of ${trophies.length} trophies — ${earned.size} earned.`;
  rowsEl.replaceChildren();
  for (const t of list) {
    const li = document.createElement('li');
    li.className = 'row' + (earned.has(t.id) ? ' earned' : '');
    li.dataset.id = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save(); renderAll();
    });

    const medal = document.createElement('span');
    medal.className = `medal ${t.grade}`;
    medal.title = t.grade;

    const main = document.createElement('div');
    if (hiddenBySpoiler(t)) {
      const name = document.createElement('div');
      name.className = 'name hidden-name';
      name.textContent = 'Hidden trophy — story spoiler';
      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = 'Spoiler-safe mode hides this story trophy until you earn it. Tick the box when it pops to reveal it.';
      main.append(name, desc);
    } else {
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = t.name;
      const tag = document.createElement('span');
      tag.className = 'grade-tag';
      tag.textContent = t.grade;
      name.append(tag);
      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = t.description;
      const guide = document.createElement('div');
      guide.className = 'guide-line';
      guide.textContent = t.guide;
      const chips = document.createElement('div');
      chips.className = 'chips';
      const kindChip = document.createElement('span');
      kindChip.className = 'chip';
      kindChip.textContent = t.kind;
      chips.append(kindChip);
      if (t.target) {
        const target = document.createElement('span');
        target.className = 'chip target';
        target.textContent = `Target: ${t.target}`;
        chips.append(target);
      }
      if (t.missable === 'possible') {
        const miss = document.createElement('span');
        miss.className = 'chip miss';
        miss.textContent = 'Possibly missable';
        chips.append(miss);
      }
      main.append(name, desc, guide, chips);
    }

    const side = document.createElement('div');
    side.className = 'side';
    const state = document.createElement('span');
    state.className = 'state' + (earned.has(t.id) ? '' : ' todo');
    state.textContent = earned.has(t.id) ? '✓ Earned' : 'Not yet';
    side.append(state);
    const idLine = document.createElement('span');
    idLine.textContent = `#${t.id} / 55`;
    side.append(idLine);

    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      selectedId = t.id;
      renderDetail();
    });
    li.append(box, medal, main, side);
    rowsEl.append(li);
  }
}

function renderDetail() {
  const t = byId.get(selectedId);
  detailEl.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = hiddenBySpoiler(t) ? 'Hidden trophy' : t.name;
  const gradeLine = document.createElement('p');
  gradeLine.className = 'grade-line';
  gradeLine.textContent = `#${t.id} of 55 · ${t.grade} · ${t.kind}` +
    (t.target ? ` · target: ${t.target}` : '') +
    (t.missable === 'possible' ? ' · POSSIBLY MISSABLE' : '');
  detailEl.append(h, gradeLine);
  if (hiddenBySpoiler(t)) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Spoiler-safe mode hides this story trophy until you earn it. Turn the spoiler setting off, or tick it earned in the checklist, to read its guide.';
    detailEl.append(p);
    return;
  }
  const desc = document.createElement('p');
  desc.innerHTML = '<strong>Official description:</strong> ';
  desc.append(document.createTextNode(t.description));
  const guideBox = document.createElement('div');
  guideBox.className = 'guide-box';
  const guideTitle = document.createElement('strong');
  guideTitle.textContent = 'How to get it';
  const guideText = document.createElement('p');
  guideText.textContent = t.guide;
  guideBox.append(guideTitle, guideText);
  detailEl.append(desc, guideBox);
  if (t.missable === 'possible') {
    const flag = document.createElement('p');
    flag.innerHTML = '<span class="flag">⚠ Possibly missable.</span> ';
    flag.append(document.createTextNode(t.missable_reason));
    detailEl.append(flag);
  } else {
    const ok = document.createElement('p');
    ok.textContent = 'Missable? No — ' + t.missable_reason;
    detailEl.append(ok);
  }
  const srcTitle = document.createElement('p');
  srcTitle.innerHTML = '<strong>Sources</strong> — names, descriptions and grades from the official list; guides are this guide’s own words:';
  const srcList = document.createElement('ul');
  srcList.className = 'sources';
  for (const s of t.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = s.name;
    a.rel = 'noopener';
    li.append(a);
    srcList.append(li);
  }
  const verifyNote = document.createElement('p');
  verifyNote.className = 'sources';
  verifyNote.textContent = 'Steps marked UNVERIFIED go beyond the official description and have not been checked in the game — confirm them against the full guides above.';
  detailEl.append(srcTitle, srcList, verifyNote);
}

function renderRoadmap() {
  const host = $('phases');
  host.replaceChildren();
  for (const phase of PHASES) {
    const div = document.createElement('div');
    div.className = 'phase';
    const done = phase.ids.filter((id) => earned.has(id)).length;
    const h = document.createElement('h3');
    h.textContent = phase.title;
    const count = document.createElement('span');
    count.className = 'phase-count';
    count.textContent = `${done} / ${phase.ids.length} done`;
    h.append(count);
    const p = document.createElement('p');
    p.textContent = phase.text;
    const chips = document.createElement('div');
    chips.className = 'trophies';
    for (const id of phase.ids) {
      const t = byId.get(id);
      const s = document.createElement('span');
      if (earned.has(id)) s.className = 'done';
      s.textContent = t.name;
      s.title = `${t.grade} — ${t.description}`;
      chips.append(s);
    }
    div.append(h, p, chips);
    host.append(div);
  }
}

function renderMissables() {
  const host = $('missableList');
  host.replaceChildren();
  for (const t of trophies.filter((x) => x.missable === 'possible')) {
    const div = document.createElement('div');
    div.className = 'miss-card';
    const h = document.createElement('h3');
    h.textContent = `${t.name} — ${t.grade}`;
    const desc = document.createElement('p');
    desc.textContent = t.description;
    const why = document.createElement('p');
    why.innerHTML = '<strong>Why it might be missable:</strong> ';
    why.append(document.createTextNode(t.missable_reason));
    const how = document.createElement('p');
    how.textContent = t.guide;
    div.append(h, desc, why, how);
    host.append(div);
  }
}

function setView(name) {
  for (const btn of document.querySelectorAll('.tabs button')) {
    btn.classList.toggle('active', btn.dataset.view === name);
  }
  for (const v of ['checklist', 'roadmap', 'missables', 'sources']) {
    $(`view-${v}`).hidden = v !== name;
  }
  $('controls').style.display = name === 'checklist' ? '' : 'none';
  detailEl.style.display = name === 'checklist' ? '' : 'none';
}

function renderAll() {
  renderProgress();
  renderRows();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

for (const btn of document.querySelectorAll('.tabs button')) {
  btn.addEventListener('click', () => setView(btn.dataset.view));
}
$('q').addEventListener('input', renderRows);
for (const id of ['kind', 'grade', 'status', 'missableOnly', 'spoiler']) {
  $(id).addEventListener('change', () => { renderRows(); renderDetail(); });
}
$('exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((x, y) => x - y) }, null, 1)], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  a.click();
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    const next = new Set(ids.filter((id) => byId.has(id)));
    if (next.size === 0 && ids.length > 0) throw new Error('no known trophy ids');
    earned = next;
    save(); renderAll();
  } catch {
    alert('That file is not a Leonida Trophy Guide progress export.');
  }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all 55 ticks?')) return;
  earned = new Set();
  save(); renderAll();
});

// Deep links for screenshots and sharing: ?view=roadmap|missables|sources, ?t=<id>, ?spoiler=on, ?grade=, ?kind=
if (params.get('spoiler') === 'on') $('spoiler').checked = true;
if (params.get('grade')) $('grade').value = params.get('grade');
if (params.get('kind')) $('kind').value = params.get('kind');
const view = params.get('view');
if (['checklist', 'roadmap', 'missables', 'sources'].includes(view)) setView(view);

renderAll();
window.__shotReady = true;
