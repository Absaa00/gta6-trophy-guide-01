// Leonida Ledger — the checklist: rows, filters, search and the spoiler rule.
// A story trophy the reader has not earned yet is masked while spoilers are on:
// its name and description are hidden, its grade stays visible.

export function isSpoilerMasked(trophy, state) {
  return Boolean(state.spoilers) && trophy.kind === 'story' && !state.earned[trophy.id];
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function kindLabel(kind) {
  if (kind === 'story') return 'Story';
  if (kind === 'collectibles') return 'Collectibles';
  return 'Activities';
}

export function matchesFilters(trophy, state, filters) {
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind === 'online') return false; // this list has no online trophies
  if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.status === 'earned' && !state.earned[trophy.id]) return false;
  if (filters.status === 'remaining' && state.earned[trophy.id]) return false;
  if (filters.search) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

export function trophyRow(trophy, state, selectedId, onToggle, onSelect) {
  const masked = isSpoilerMasked(trophy, state);
  const earned = Boolean(state.earned[trophy.id]);
  const row = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `trophy-row${earned ? ' earned' : ''}${trophy.id === selectedId ? ' selected' : ''}`;
  button.dataset.trophyId = String(trophy.id);
  button.setAttribute('aria-pressed', String(earned));

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned;
  box.setAttribute('aria-label', `Earned: ${masked ? 'hidden story trophy' : trophy.name}`);
  box.addEventListener('click', (event) => {
    event.stopPropagation();
    onToggle(trophy.id);
  });
  button.appendChild(box);

  const medal = document.createElement('span');
  medal.className = `medal ${trophy.grade}`;
  medal.title = gradeLabel(trophy.grade);
  button.appendChild(medal);

  const middle = document.createElement('span');
  const name = document.createElement('span');
  name.className = 'trophy-name';
  if (masked) {
    name.textContent = 'Hidden story trophy';
    name.classList.add('spoiler-mask');
  } else {
    name.textContent = trophy.name;
  }
  middle.appendChild(name);
  const desc = document.createElement('span');
  desc.className = 'trophy-desc';
  desc.style.display = 'block';
  desc.textContent = masked ? 'Earn it to reveal its name and description.' : trophy.description;
  if (masked) desc.classList.add('spoiler-mask');
  middle.appendChild(desc);

  const meta = document.createElement('span');
  meta.className = 'trophy-meta';
  const gradeChip = document.createElement('span');
  gradeChip.className = `chip grade-${trophy.grade}`;
  gradeChip.textContent = gradeLabel(trophy.grade);
  meta.appendChild(gradeChip);
  if (trophy.missable) {
    const miss = document.createElement('span');
    miss.className = 'chip missable';
    miss.textContent = 'Missable';
    meta.appendChild(miss);
  }
  if (masked) {
    const hid = document.createElement('span');
    hid.className = 'chip hidden-flag';
    hid.textContent = 'Hidden on PSN';
    meta.appendChild(hid);
  }
  if (trophy.target) {
    const have = state.counters[trophy.id] || 0;
    const count = document.createElement('span');
    count.className = 'chip counter';
    count.textContent = `${have} / ${trophy.target} ${trophy.targetUnit}`;
    meta.appendChild(count);
  }
  middle.appendChild(meta);
  button.appendChild(middle);

  const side = document.createElement('span');
  side.className = 'trophy-kind';
  side.textContent = trophy.missable ? 'Missable' : kindLabel(trophy.kind);
  const stage = document.createElement('span');
  stage.className = 'stage';
  stage.textContent = `Roadmap stage ${trophy.stage}`;
  side.appendChild(stage);
  button.appendChild(side);

  button.addEventListener('click', () => onSelect(trophy.id));
  row.appendChild(button);
  return row;
}

export function renderChecklist(listEl, noteEl, trophies, state, filters, selectedId, onToggle, onSelect) {
  listEl.innerHTML = '';
  const shown = trophies.filter((t) => matchesFilters(t, state, filters));
  for (const trophy of shown) {
    listEl.appendChild(trophyRow(trophy, state, selectedId, onToggle, onSelect));
  }
  const earnedCount = trophies.filter((t) => state.earned[t.id]).length;
  noteEl.textContent = shown.length === trophies.length
    ? `Showing all 55 trophies — ${earnedCount} earned. Click a trophy to read its guide.`
    : `Showing ${shown.length} of 55 trophies — ${earnedCount} earned. Click a trophy to read its guide.`;
  return shown.length;
}
