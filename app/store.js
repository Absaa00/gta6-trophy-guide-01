// Leonida Ledger — saved progress. Everything lives in this browser's localStorage
// under one key; export writes it to a file, import reads such a file back. No network.

export const STORAGE_KEY = 'leonida-ledger-v1';
export const APP_NAME = 'Leonida Ledger';
export const APP_VERSION = 1;

export function blankState() {
  return { app: APP_NAME, version: APP_VERSION, earned: {}, notes: {}, counters: {}, spoilers: true };
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return blankState();
    return {
      app: APP_NAME,
      version: APP_VERSION,
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
      spoilers: parsed.spoilers !== false,
    };
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function toggleEarned(state, id) {
  if (state.earned[id]) delete state.earned[id];
  else state.earned[id] = true;
  saveState(state);
  return state;
}

export function setCounter(state, id, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  if (n === 0) delete state.counters[id];
  else state.counters[id] = n;
  saveState(state);
  return state;
}

export function setNote(state, id, text) {
  const clean = String(text || '').slice(0, 2000);
  if (!clean.trim()) delete state.notes[id];
  else state.notes[id] = clean;
  saveState(state);
  return state;
}

export function setSpoilers(state, on) {
  state.spoilers = Boolean(on);
  saveState(state);
  return state;
}

export function resetAll() {
  const fresh = blankState();
  saveState(fresh);
  return fresh;
}

// Export: download the state as a JSON file the reader owns.
export function exportProgress(state) {
  const payload = { ...state, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-ledger-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Import: read a file exported by this guide (or hand-edited in the same shape) and
// merge it over the current state. Unknown trophy ids are dropped, not trusted.
export function importProgress(state, fileText, knownIds) {
  const parsed = JSON.parse(fileText);
  if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
  const known = new Set(knownIds);
  const pick = (obj) => {
    const out = {};
    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const id = Number(key);
        if (known.has(id)) out[id] = value;
      }
    }
    return out;
  };
  const next = blankState();
  next.earned = pick(parsed.earned);
  for (const id of Object.keys(next.earned)) next.earned[id] = true;
  const notes = pick(parsed.notes);
  for (const [id, text] of Object.entries(notes)) {
    if (typeof text === 'string' && text.trim()) next.notes[id] = text.slice(0, 2000);
  }
  const counters = pick(parsed.counters);
  for (const [id, value] of Object.entries(counters)) {
    const n = Math.floor(Number(value) || 0);
    if (n > 0) next.counters[id] = n;
  }
  if (typeof parsed.spoilers === 'boolean') next.spoilers = parsed.spoilers;
  // Merge: imported progress adds to what is already saved, never erases it.
  next.earned = { ...state.earned, ...next.earned };
  next.notes = { ...state.notes, ...next.notes };
  next.counters = { ...state.counters, ...next.counters };
  saveState(next);
  return next;
}
