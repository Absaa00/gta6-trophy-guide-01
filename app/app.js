/* Leonida Trophy Guide — tracker logic.
   Loads app/data/trophies.json, keeps progress in localStorage, renders the
   checklist, the roadmap, the missables page and export/import. No network
   requests at run time beyond loading the app's own files. */
'use strict';

var STORAGE_KEY = 'leonida-trophy-guide-v1';
var DATA_URL = 'data/trophies.json';

var TROPHIES = [];
var SOURCES = {};
var COUNTS = {};
var ROADMAP = [
  { title: 'Chapter 1 — secure the missable first', ids: [28, 2, 3],
    text: 'Before anything else: meditate at the spot at Jason\u2019s house in Chapter 1. PowerPyx flags it as the only missable moment in the game — once Chapter 1 ends, that spot is gone for good. Then finish the opening mission Gone Fishing and Chapter 1 itself.' },
  { title: 'Finish the story (Chapters 2–4 and the finale)', ids: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    text: 'Play the main missions in order. Every chapter and named mission pops its own trophy automatically, and none of them can be missed. The final mission ends the campaign and opens the 100% checklist.' },
  { title: 'Strangers and side stories', ids: [22, 23, 24, 25, 26, 27, 29],
    text: 'Eight stranger mission strands run across Leonida — Andy, Kenton, Billy, Randy and Tyrone each have one, plus three more strangers to find. Each strand ends with its own trophy. Bret Vogel\u2019s hunt opens after the Chapter 2 mission Coffee Break.' },
  { title: 'Activities and skills', ids: [15, 16, 17, 18, 19, 20, 21, 32, 36, 46, 51],
    text: 'The grind stage: 250 stunts, all nine activity types once, gold in all 42 Shooting Range challenges, 20 different races, 50 challenges, and the combat and bowling oddities. Most of this builds up while you do everything else.' },
  { title: 'Crime and money', ids: [33, 34, 37, 38, 39, 40, 41, 43, 52, 53, 54, 55],
    text: 'Robberies with your partner, bank vaults, the armored truck, the jewelry store, one illegal operation per gang, a stolen Rhino tank — and the money to match: $250,000 laundered through contacts, $100,000 spent in shops, every garage bought, ten vehicles registered.' },
  { title: 'Collectibles and the world', ids: [30, 31, 35, 42, 44, 45, 47, 48, 49, 50],
    text: 'Three card sets, WAiNK It at 100 locations, 100 vehicles discovered, every region of Leonida explored, plus the odd world moments — a cocktail on Ocean Beach, a showroom exit, and the strange events whose triggers the published guides have not pinned down yet.' },
  { title: '100% and the Platinum', ids: [14, 1],
    text: 'Open Progress > Stats > 100% Completion after the story. The bar is lenient — about 60% of true completion per PowerPyx — and most of it is already done if you followed the stages above. Finish the checklist, take A Long Road, and the Platinum pops by itself.' }
];

var state = {
  earned: {},
  counts: {},
  notes: {},
  spoiler: false,
  selected: 28,
  kind: 'all',
  grade: 'all',
  status: 'all',
  query: '',
  tab: 'checklist'
};

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    var saved = JSON.parse(raw);
    if (saved.earned) state.earned = saved.earned;
    if (saved.counts) state.counts = saved.counts;
    if (saved.notes) state.notes = saved.notes;
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
    if (saved.selected) state.selected = saved.selected;
  } catch (e) { /* corrupted save: start fresh */ }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: state.earned, counts: state.counts, notes: state.notes,
      spoiler: state.spoiler, selected: state.selected
    }));
  } catch (e) { /* storage full or blocked: progress stays in memory */ }
}

function trophyById(id) {
  for (var i = 0; i < TROPHIES.length; i++) if (TROPHIES[i].id === id) return TROPHIES[i];
  return null;
}

function isEarned(t) { return !!state.earned[t.id]; }

function spoilerHides(t) {
  return state.spoiler && t.story && !isEarned(t);
}

function displayName(t) {
  return spoilerHides(t) ? 'Hidden story trophy' : t.name;
}

function displayDescription(t) {
  return spoilerHides(t) ? 'Earn this trophy to reveal its name and description.' : t.description;
}

function gradeLabel(g) {
  return g.charAt(0).toUpperCase() + g.slice(1);
}

function kindLabel(k) {
  return { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', platinum: 'Platinum', online: 'Online' }[k] || k;
}

function countOf(t) {
  var v = state.counts[t.id];
  return typeof v === 'number' && v >= 0 ? v : 0;
}

function formatTarget(t) {
  if (!t.target) return '';
  if (t.targetUnit === '$') return '$' + t.target.toLocaleString('en-US');
  return String(t.target);
}

function formatCount(t) {
  if (t.targetUnit === '$') return '$' + countOf(t).toLocaleString('en-US');
  return String(countOf(t));
}

function applyFilters() {
  var q = state.query.trim().toLowerCase();
  return TROPHIES.filter(function (t) {
    if (state.kind === 'story' && !t.story) return false;
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind === 'collectibles' && t.kind !== 'collectibles') return false;
    if (state.kind === 'activities' && t.kind !== 'activities') return false;
    if (state.kind === 'online') return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.status === 'earned' && !isEarned(t)) return false;
    if (state.status === 'remaining' && isEarned(t)) return false;
    if (q && t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
}

function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderProgress() {
  var earned = TROPHIES.filter(isEarned).length;
  var total = TROPHIES.length;
  document.getElementById('earnedCount').textContent = earned + ' / ' + total;
  document.getElementById('progressPct').textContent =
    Math.round(earned / total * 100) + '% to Platinum';
  document.getElementById('progressFill').style.width = (earned / total * 100) + '%';
  var parts = ['platinum', 'gold', 'silver', 'bronze'].map(function (g) {
    var got = TROPHIES.filter(function (t) { return t.grade === g && isEarned(t); }).length;
    var all = TROPHIES.filter(function (t) { return t.grade === g; }).length;
    return '<span><b>' + got + '/' + all + '</b> ' + gradeLabel(g) + '</span>';
  });
  document.getElementById('gradeCounts').innerHTML = parts.join('');
  var next = nextUpTrophy();
  document.getElementById('nextUp').innerHTML = next
    ? 'Next up: <b>' + escapeHtml(displayName(next)) + '</b>'
    : '<b>Platinum earned — Leonida Legend!</b>';
}

function nextUpTrophy() {
  for (var s = 0; s < ROADMAP.length; s++) {
    for (var i = 0; i < ROADMAP[s].ids.length; i++) {
      var t = trophyById(ROADMAP[s].ids[i]);
      if (t && !isEarned(t)) return t;
    }
  }
  return null;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderList() {
  var list = document.getElementById('trophyList');
  list.innerHTML = '';
  var shown = applyFilters();
  var earnedShown = shown.filter(isEarned).length;
  var meta = document.getElementById('listMeta');
  if (state.kind === 'online') {
    meta.textContent = 'No online trophies — all 55 are offline and single-player (PowerPyx).';
  } else {
    meta.textContent = 'Showing ' + shown.length + ' of 55 trophies · ' + earnedShown + ' earned in this view';
  }
  document.getElementById('emptyState').hidden = shown.length > 0;
  shown.forEach(function (t) {
    var li = el('li');
    var btn = el('button', 'trophy' + (isEarned(t) ? ' earned' : '') + (state.selected === t.id ? ' selected' : ''));
    btn.type = 'button';
    btn.setAttribute('data-id', t.id);
    btn.addEventListener('click', function (ev) {
      if (ev.target.tagName === 'INPUT') return;
      selectTrophy(t.id);
    });
    var box = el('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', 'Mark ' + displayName(t) + ' as earned');
    box.addEventListener('change', function () {
      setEarned(t.id, box.checked);
    });
    btn.appendChild(box);
    btn.appendChild(el('span', 'grade-dot ' + t.grade));
    var mid = el('span');
    var name = el('span', 'trophy-name', displayName(t));
    if (t.hidden && !spoilerHides(t)) name.appendChild(el('span', 'hidden-tag', ' · hidden on PSN'));
    mid.appendChild(name);
    mid.appendChild(el('div', 'trophy-desc', displayDescription(t)));
    var tags = el('span', 'trophy-tags');
    tags.appendChild(el('span', 'tag grade-' + t.grade, gradeLabel(t.grade)));
    if (t.story) tags.appendChild(el('span', 'tag story', 'Story'));
    if (t.missable) tags.appendChild(el('span', 'tag missable', 'Missable'));
    if (t.kind === 'collectibles') tags.appendChild(el('span', 'tag', 'Collectible'));
    mid.appendChild(tags);
    btn.appendChild(mid);
    var right = el('span', 'trophy-count');
    if (t.target) {
      right.innerHTML = '<b>' + escapeHtml(formatCount(t)) + '</b> / ' + escapeHtml(formatTarget(t));
    } else if (isEarned(t)) {
      right.innerHTML = '<span class="done">✓ earned</span>';
    }
    btn.appendChild(right);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function setEarned(id, on) {
  if (on) state.earned[id] = true; else delete state.earned[id];
  saveState();
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function selectTrophy(id) {
  state.selected = id;
  saveState();
  renderList();
  renderDetail();
}

function renderDetail() {
  var box = document.getElementById('detail');
  box.innerHTML = '';
  var t = trophyById(state.selected) || TROPHIES[0];
  if (!t) { box.appendChild(el('p', 'detail-empty', 'Loading trophies…')); return; }
  var hidden = spoilerHides(t);
  var tags = el('div', 'trophy-tags');
  tags.appendChild(el('span', 'tag grade-' + t.grade, gradeLabel(t.grade)));
  if (t.story) tags.appendChild(el('span', 'tag story', 'Story'));
  if (t.missable) tags.appendChild(el('span', 'tag missable', 'Missable'));
  if (t.hidden) tags.appendChild(el('span', 'tag', 'Hidden on PSN'));
  tags.appendChild(el('span', 'tag', kindLabel(t.kind)));
  box.appendChild(tags);
  box.appendChild(el('h2', null, displayName(t)));
  box.appendChild(el('p', 'official', '“' + displayDescription(t) + '” — official description'));
  if (hidden) {
    box.appendChild(el('p', 'guide-text', 'Spoiler-safe mode is on: the guide for this story trophy stays hidden until you earn it. Turn the spoiler setting off above to read it now.'));
  } else {
    box.appendChild(el('p', 'guide-text', t.guide));
  }
  if (t.target && !hidden) {
    box.appendChild(el('h3', null, 'Progress counter'));
    var row = el('div', 'counter-row');
    var minus = el('button', null, '−');
    minus.type = 'button';
    minus.setAttribute('aria-label', 'Decrease counter');
    minus.addEventListener('click', function () { setCounter(t.id, countOf(t) - counterStep(t)); });
    var val = el('span', 'counter-value');
    val.innerHTML = escapeHtml(formatCount(t)) + ' <small>/ ' + escapeHtml(formatTarget(t)) + '</small>';
    var plus = el('button', null, '+');
    plus.type = 'button';
    plus.setAttribute('aria-label', 'Increase counter');
    plus.addEventListener('click', function () { setCounter(t.id, countOf(t) + counterStep(t)); });
    row.appendChild(minus);
    row.appendChild(val);
    row.appendChild(plus);
    box.appendChild(row);
    var note = el('p', 'counter-note');
    note.textContent = countOf(t) >= t.target
      ? 'Target reached — tick the trophy off on the left when it pops in-game.'
      : 'Counts are your own notes; the trophy pops in-game, not here.';
    box.appendChild(note);
  }
  if (!hidden) {
    box.appendChild(el('h3', null, 'Sources'));
    var ul = el('ul', 'source-list');
    (t.sources || []).forEach(function (key) {
      var s = SOURCES[key];
      if (!s) return;
      var li = el('li');
      var a = el('a', null, s.name);
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      li.appendChild(a);
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }
  box.appendChild(el('h3', null, 'Your note'));
  var ta = el('textarea');
  ta.value = state.notes[t.id] || '';
  ta.placeholder = 'Your own note for this trophy…';
  ta.setAttribute('aria-label', 'Your note for ' + displayName(t));
  ta.addEventListener('input', function () {
    if (ta.value) state.notes[t.id] = ta.value; else delete state.notes[t.id];
    saveState();
  });
  box.appendChild(ta);
  var earn = el('div', 'earn-row');
  var lab = el('label');
  var cb = el('input');
  cb.type = 'checkbox';
  cb.checked = isEarned(t);
  cb.addEventListener('change', function () { setEarned(t.id, cb.checked); });
  lab.appendChild(cb);
  lab.appendChild(document.createTextNode('Earned'));
  earn.appendChild(lab);
  box.appendChild(earn);
}

function counterStep(t) {
  return t.targetUnit === '$' ? 1000 : 1;
}

function setCounter(id, value) {
  var t = trophyById(id);
  if (!t || !t.target) return;
  value = Math.max(0, Math.min(t.target, Math.round(value)));
  state.counts[id] = value;
  saveState();
  renderProgress();
  renderList();
  renderDetail();
}

function renderRoadmap() {
  var list = document.getElementById('roadmapList');
  list.innerHTML = '';
  ROADMAP.forEach(function (stage) {
    var li = el('li', 'stage');
    var head = el('div', 'stage-head');
    head.appendChild(el('h3', null, stage.title));
    var done = stage.ids.filter(function (id) { var t = trophyById(id); return t && isEarned(t); }).length;
    var prog = el('span', 'stage-progress');
    prog.innerHTML = '<b>' + done + '/' + stage.ids.length + '</b> earned';
    head.appendChild(prog);
    li.appendChild(head);
    li.appendChild(el('p', null, stage.text));
    var chips = el('div', 'stage-trophies');
    stage.ids.forEach(function (id) {
      var t = trophyById(id);
      if (!t) return;
      var chip = el('button', 'stage-chip' + (isEarned(t) ? ' earned' : '') + (t.missable ? ' missable' : ''));
      chip.type = 'button';
      chip.textContent = (isEarned(t) ? '✓ ' : '') + displayName(t) + ' · ' + gradeLabel(t.grade);
      chip.addEventListener('click', function () {
        selectTrophy(id);
        switchTab('checklist');
      });
      chips.appendChild(chip);
    });
    li.appendChild(chips);
    list.appendChild(li);
  });
}

function safeReason(t) {
  if (t.grade === 'platinum') return 'Pops when the other 54 are earned.';
  if (t.id === 14) return 'The 100% checklist stays open after the story.';
  if (t.story) return 'Automatic story trophy — unlocks by playing the campaign.';
  if (t.kind === 'collectibles') return 'Collectibles stay available after the story.';
  return 'Repeatable after the story — nothing locks it out.';
}

function renderMissables() {
  var hero = document.getElementById('missableHero');
  hero.innerHTML = '';
  var t = trophyById(28);
  hero.appendChild(el('h2', null, '⚠ ' + t.name + ' — the only missable trophy'));
  hero.appendChild(el('p', null, '“' + t.description + '”'));
  hero.appendChild(el('p', 'why', t.guide));
  var safe = document.getElementById('safeList');
  safe.innerHTML = '';
  TROPHIES.filter(function (x) { return !x.missable; }).forEach(function (x) {
    var li = el('li');
    li.appendChild(el('b', null, displayName(x)));
    li.appendChild(el('span', null, safeReason(x)));
    safe.appendChild(li);
  });
}

function renderSources() {
  var ul = document.getElementById('sourceList');
  ul.innerHTML = '';
  Object.keys(SOURCES).forEach(function (key) {
    var s = SOURCES[key];
    var li = el('li');
    var a = el('a', null, s.name);
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    li.appendChild(a);
    ul.appendChild(li);
  });
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('#tabs .tab').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-tab') === tab);
  });
  document.querySelectorAll('main .view').forEach(function (v) {
    v.classList.toggle('active', v.id === 'view-' + tab);
  });
  document.getElementById('controls').style.display = tab === 'checklist' ? '' : 'none';
}

function exportProgress() {
  var payload = {
    app: 'leonida-trophy-guide',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: Object.keys(state.earned).map(Number),
    counts: state.counts,
    notes: state.notes
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 100);
}

function importProgress(file) {
  var status = document.getElementById('importStatus');
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object') throw new Error('not an object');
      var earned = {};
      (data.earned || []).forEach(function (id) {
        if (trophyById(Number(id))) earned[Number(id)] = true;
      });
      var counts = {};
      Object.keys(data.counts || {}).forEach(function (id) {
        var t = trophyById(Number(id));
        if (t && t.target && typeof data.counts[id] === 'number') {
          counts[Number(id)] = Math.max(0, Math.min(t.target, Math.round(data.counts[id])));
        }
      });
      state.earned = earned;
      state.counts = counts;
      state.notes = data.notes && typeof data.notes === 'object' ? data.notes : {};
      saveState();
      renderAll();
      status.textContent = 'Imported: ' + Object.keys(earned).length + ' trophies earned.';
    } catch (e) {
      status.textContent = 'That file could not be imported — it is not a progress backup from this guide.';
    }
  };
  reader.readAsText(file);
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
  renderSources();
}

function loadTrophies() {
  return fetch(DATA_URL).then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function (data) {
    TROPHIES = data.trophies || [];
    SOURCES = data.sources || {};
    COUNTS = data.counts || {};
    TROPHIES.sort(function (a, b) { return a.id - b.id; });
  });
}

function bindControls() {
  document.querySelectorAll('#tabs .tab').forEach(function (b) {
    b.addEventListener('click', function () { switchTab(b.getAttribute('data-tab')); });
  });
  document.querySelectorAll('#kindChips .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      state.kind = b.getAttribute('data-kind');
      document.querySelectorAll('#kindChips .chip').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      renderList();
    });
  });
  document.getElementById('gradeFilter').addEventListener('change', function (e) {
    state.grade = e.target.value;
    renderList();
  });
  document.getElementById('statusFilter').addEventListener('change', function (e) {
    state.status = e.target.value;
    renderList();
  });
  document.getElementById('search').addEventListener('input', function (e) {
    state.query = e.target.value;
    renderList();
  });
  var spoiler = document.getElementById('spoilerToggle');
  spoiler.checked = state.spoiler;
  spoiler.addEventListener('change', function () {
    state.spoiler = spoiler.checked;
    saveState();
    renderList();
    renderDetail();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', function () {
    if (!window.confirm('Clear every earned mark, counter and note? This cannot be undone.')) return;
    state.earned = {};
    state.counts = {};
    state.notes = {};
    saveState();
    renderAll();
  });
}

loadState();
bindControls();
loadTrophies().then(renderAll).catch(function (err) {
  document.getElementById('listMeta').textContent =
    'Could not load app/data/trophies.json (' + err.message + '). Serve app/ over HTTP — for example with node serve.ts — instead of opening the file directly.';
});
