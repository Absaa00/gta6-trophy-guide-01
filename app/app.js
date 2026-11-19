// Leonida Ledger — boot and wiring. Loads the trophy data, keeps the header counts
// honest, and connects the toolbar, the checklist, the detail pane, the roadmap,
// the missables page and the planner. Runs entirely offline after this fetch,
// which reads a file from this guide's own folder.

import {
  loadState, saveState, toggleEarned, setCounter, setNote, setSpoilers,
  resetAll, exportProgress, importProgress,
} from './store.js';
import { renderChecklist } from './checklist.js';
import { renderDetail } from './detail.js';
import { renderRoadmap, renderMissables, renderPlanner, nextUp } from './roadmap.js';

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

const $ = (id) => document.getElementById(id);

async function bootApp() {
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  const trophies = data.trophies;
  let state = loadState();
  let selectedId = trophies[0].id;
  const filters = { search: '', kind: 'all', grade: 'all', status: 'all' };

  const listEl = $('trophyList');
  const noteEl = $('resultNote');
  const detailPane = $('detailPane');

  function selectedTrophy() {
    return trophies.find((t) => t.id === selectedId) || trophies[0];
  }

  function renderHeader() {
    const earned = trophies.filter((t) => state.earned[t.id]);
    const pct = Math.round((earned.length / trophies.length) * 100);
    $('bigCount').innerHTML = `${earned.length} <small>/ ${trophies.length} earned</small>`;
    $('progressBar').style.width = `${pct}%`;
    $('progressLabel').textContent = earned.length === trophies.length
      ? 'Platinum earned — Vice Got a Price!'
      : `${pct}% to the platinum — ${trophies.length - earned.length} trophies left`;
    $('gradeTally').innerHTML = GRADE_ORDER.map((grade) => {
      const total = trophies.filter((t) => t.grade === grade).length;
      const got = earned.filter((t) => t.grade === grade).length;
      return `<b>${got}/${total}</b> ${grade}`;
    }).join(' · ');
    $('tabCountChecklist').textContent = `${earned.length}/${trophies.length}`;
    $('tabCountPlanner').textContent = `${nextUp(trophies, state, 5).length} next`;
  }

  function renderAll() {
    renderHeader();
    renderChecklist(listEl, noteEl, trophies, state, filters, selectedId,
      (id) => { state = toggleEarned(state, id); renderAll(); },
      (id) => { selectedId = id; renderAll(); });
    renderDetail(detailPane, selectedTrophy(), state, {
      onToggle: (id) => { state = toggleEarned(state, id); renderAll(); },
      onCounter: (id, value) => { state = setCounter(state, id, value); renderAll(); },
      onNote: (id, text) => { state = setNote(state, id, text); },
    });
    renderRoadmap($('roadmapStages'), trophies, state, (id) => { selectedId = id; showTab('checklist'); });
    renderMissables($('missCallout'), $('safeRows'), trophies, state);
    renderPlanner($('plannerList'), trophies, state,
      (id) => { selectedId = id; showTab('checklist'); },
      (id) => { state = toggleEarned(state, id); renderAll(); });
  }

  function showTab(name) {
    for (const tab of document.querySelectorAll('nav.tabs button')) {
      tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
    }
    for (const view of document.querySelectorAll('main .view')) {
      view.classList.toggle('active', view.id === `view-${name}`);
    }
    if (name === 'checklist') renderAll();
  }

  for (const tab of document.querySelectorAll('nav.tabs button')) {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
  }

  $('search').addEventListener('input', (event) => { filters.search = event.target.value; renderAll(); });
  $('kindFilter').addEventListener('change', (event) => { filters.kind = event.target.value; renderAll(); });
  $('gradeFilter').addEventListener('change', (event) => { filters.grade = event.target.value; renderAll(); });
  $('statusFilter').addEventListener('change', (event) => { filters.status = event.target.value; renderAll(); });

  const spoilerBox = $('spoilerToggle');
  spoilerBox.checked = state.spoilers !== false;
  spoilerBox.addEventListener('change', () => {
    state = setSpoilers(state, spoilerBox.checked);
    renderAll();
  });

  $('exportBtn').addEventListener('click', () => exportProgress(state));
  $('importFile').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      state = importProgress(state, text, trophies.map((t) => t.id));
      renderAll();
      noteEl.textContent = `Imported progress from ${file.name}.`;
    } catch {
      noteEl.textContent = `Could not import ${file.name} — it is not a Leonida Ledger progress file.`;
    }
    event.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (window.confirm('Reset all earned trophies, counters and notes? This cannot be undone.')) {
      state = resetAll();
      selectedId = trophies[0].id;
      spoilerBox.checked = true;
      renderAll();
    }
  });

  // Keyboard: "/" focuses search, "?" is left alone.
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && document.activeElement !== $('search')) {
      event.preventDefault();
      $('search').focus();
    }
  });

  saveState(state);
  renderAll();
}

bootApp().catch((error) => {
  const note = $('resultNote');
  if (note) note.textContent = `Could not load the trophy list: ${error.message}`;
});
