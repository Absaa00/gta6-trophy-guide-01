// Leonida Ledger — the detail pane: one trophy's guide, its sources, its progress
// counter and the reader's own note. Counters step by 1, or by 1,000 for money.

import { gradeLabel, kindLabel, isSpoilerMasked } from './checklist.js';

function money(value) {
  return `$${Number(value).toLocaleString('en-US')}`;
}

function formatCount(trophy, value) {
  if (trophy.targetUnit && trophy.targetUnit.startsWith('$')) return money(value);
  return String(value);
}

export function counterStep(trophy) {
  return trophy.targetUnit && trophy.targetUnit.startsWith('$') ? 1000 : 1;
}

export function renderDetail(pane, trophy, state, callbacks) {
  pane.innerHTML = '';
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Pick a trophy from the checklist to read its guide, its sources and its progress counter.';
    pane.appendChild(empty);
    return;
  }

  const masked = isSpoilerMasked(trophy, state);
  const earned = Boolean(state.earned[trophy.id]);

  const head = document.createElement('div');
  head.className = 'trophy-meta';
  const gradeChip = document.createElement('span');
  gradeChip.className = `chip grade-${trophy.grade}`;
  gradeChip.textContent = gradeLabel(trophy.grade);
  head.appendChild(gradeChip);
  const kindChip = document.createElement('span');
  kindChip.className = 'chip';
  kindChip.textContent = trophy.missable ? 'Missable' : kindLabel(trophy.kind);
  head.appendChild(kindChip);
  const stageChip = document.createElement('span');
  stageChip.className = 'chip';
  stageChip.textContent = `Roadmap stage ${trophy.stage}`;
  head.appendChild(stageChip);
  pane.appendChild(head);

  const title = document.createElement('h2');
  title.textContent = masked ? 'Hidden story trophy' : trophy.name;
  if (masked) title.classList.add('spoiler-mask');
  pane.appendChild(title);

  const official = document.createElement('p');
  official.className = 'official';
  const label = document.createElement('span');
  label.className = 'lbl';
  label.textContent = 'Official description (PlayStation)';
  official.appendChild(label);
  official.appendChild(document.createTextNode(masked ? 'Hidden until earned.' : trophy.description));
  pane.appendChild(official);

  if (trophy.missable) {
    const warn = document.createElement('p');
    warn.className = 'warn';
    warn.innerHTML = '<b>Possibly missable — do it in Chapter 1.</b> ';
    warn.appendChild(document.createTextNode(
      'Both PowerPyx and GTABase flag this as the list’s only possibly missable trophy: the first ' +
      'meditation (Lucia on the balcony at Jason’s house, after Down to Earth) may disappear after ' +
      'Chapter 1, and it is unconfirmed whether it counts. Do it while you can.'));
    pane.appendChild(warn);
  }

  const guideHead = document.createElement('h3');
  guideHead.textContent = 'Guide';
  pane.appendChild(guideHead);
  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = trophy.guide;
  pane.appendChild(guide);

  const srcHead = document.createElement('h3');
  srcHead.textContent = 'Sources';
  pane.appendChild(srcHead);
  const srcList = document.createElement('ul');
  srcList.className = 'sources';
  for (const source of trophy.sources) {
    const item = document.createElement('li');
    if (source.url) {
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.name;
      item.appendChild(link);
    } else {
      item.textContent = source.name;
    }
    srcList.appendChild(item);
  }
  pane.appendChild(srcList);

  if (trophy.target) {
    const have = state.counters[trophy.id] || 0;
    const step = counterStep(trophy);
    const cHead = document.createElement('h3');
    cHead.textContent = 'Your progress';
    pane.appendChild(cHead);
    const box = document.createElement('div');
    box.className = 'counter-box';
    const count = document.createElement('div');
    count.className = 'c-count';
    count.textContent = `${formatCount(trophy, have)} `;
    const of = document.createElement('small');
    of.textContent = `/ ${formatCount(trophy, trophy.target)} ${trophy.targetUnit}`;
    count.appendChild(of);
    box.appendChild(count);
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('i');
    fill.style.width = `${Math.min(100, Math.round((have / trophy.target) * 100))}%`;
    bar.appendChild(fill);
    box.appendChild(bar);
    const row = document.createElement('div');
    row.className = 'counter-row';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.className = 'btn ghost small';
    minus.textContent = `− ${formatCount(trophy, step)}`;
    minus.addEventListener('click', () => callbacks.onCounter(trophy.id, have - step));
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'btn small';
    plus.textContent = `+ ${formatCount(trophy, step)}`;
    plus.addEventListener('click', () => callbacks.onCounter(trophy.id, have + step));
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'btn ghost small';
    done.textContent = earned ? 'Earned ✓' : 'Mark earned';
    done.addEventListener('click', () => callbacks.onToggle(trophy.id));
    row.append(minus, plus, done);
    box.appendChild(row);
    const hint = document.createElement('p');
    hint.className = 'result-note';
    hint.textContent = have >= trophy.target
      ? 'Target reached — mark it earned when the trophy pops.'
      : 'Counts are yours alone, kept in this browser.';
    box.appendChild(hint);
    pane.appendChild(box);
  } else {
    const row = document.createElement('div');
    row.className = 'counter-row';
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'btn small';
    done.textContent = earned ? 'Earned ✓ — tap to unmark' : 'Mark earned';
    done.addEventListener('click', () => callbacks.onToggle(trophy.id));
    row.appendChild(done);
    pane.appendChild(row);
  }

  const noteHead = document.createElement('h3');
  noteHead.textContent = 'Your note';
  pane.appendChild(noteHead);
  const noteBox = document.createElement('div');
  noteBox.className = 'note-box';
  const area = document.createElement('textarea');
  area.value = state.notes[trophy.id] || '';
  area.placeholder = 'Your own note for this trophy — a spot, a loadout, a reminder…';
  area.setAttribute('aria-label', `Note for ${masked ? 'hidden story trophy' : trophy.name}`);
  area.addEventListener('input', () => callbacks.onNote(trophy.id, area.value));
  noteBox.appendChild(area);
  pane.appendChild(noteBox);
}
