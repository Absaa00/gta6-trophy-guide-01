// Leonida Ledger — roadmap, missables and the Next up planner.
// The roadmap has seven stages; every trophy sits in exactly one. The planner reads
// the same stages in order, so "next" always means "earliest unfinished stage first".

export const STAGES = [
  { n: 1, title: 'Chapter 1 — start clean', blurb: 'Play the opening, and meditate while you can: the Chapter 1 balcony session for Positive Mental Attitude may not come back.' },
  { n: 2, title: 'Chapters 2–3 — the crew comes together', blurb: 'Story missions plus the partner trophies. Rob shops and lose the heat while Lucia and Jason are paired up.' },
  { n: 3, title: 'Chapter 4 — side stories', blurb: 'The chapter, its mission, and the side-character strands — Andy, Kenton, Billy, Randy, Tyrone — plus the stranger strands and the hunt.' },
  { n: 4, title: 'The finale — and the one-offs', blurb: 'Finish the story, then knock out the single-moment trophies while Leonida is still fresh.' },
  { n: 5, title: 'Free roam — activities and grinds', blurb: 'The long counts: 250 stunts, 42 gold shooting medals, races, vaults, challenges. Start the counters early and let them stack.' },
  { n: 6, title: 'Free roam — collections and money', blurb: 'Cards, WAiNK spots, vehicles, areas, garages, and the money trophies that feed off the robberies.' },
  { n: 7, title: '100% and the Platinum', blurb: 'The 100% checklist unlocks after the story under Progress, then Stats. Finish it and the platinum pops on its own.' },
];

export function renderRoadmap(container, trophies, state, onSelect) {
  container.innerHTML = '';
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.stage === stage.n);
    const earned = members.filter((t) => state.earned[t.id]).length;
    const box = document.createElement('section');
    box.className = 'stage';
    const head = document.createElement('div');
    head.className = 'stage-head';
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(stage.n);
    head.appendChild(num);
    const title = document.createElement('h2');
    title.textContent = stage.title;
    head.appendChild(title);
    const tally = document.createElement('span');
    tally.className = 'st';
    tally.textContent = `${earned} / ${members.length} earned`;
    head.appendChild(tally);
    box.appendChild(head);
    const blurb = document.createElement('p');
    blurb.className = 'blurb';
    blurb.textContent = stage.blurb;
    box.appendChild(blurb);
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const trophy of members) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = state.earned[trophy.id] ? 'done' : '';
      chip.textContent = `${trophy.name} `;
      const grade = document.createElement('span');
      grade.className = 'g';
      grade.textContent = trophy.grade;
      chip.appendChild(grade);
      chip.addEventListener('click', () => onSelect(trophy.id));
      chips.appendChild(chip);
    }
    box.appendChild(chips);
    container.appendChild(box);
  }
}

export function renderMissables(calloutEl, rowsEl, trophies, state) {
  const flagged = trophies.filter((t) => t.missable);
  calloutEl.innerHTML = '';
  for (const trophy of flagged) {
    const title = document.createElement('h2');
    title.textContent = `⚠ ${trophy.name} — the one to watch`;
    calloutEl.appendChild(title);
    const body = document.createElement('p');
    body.textContent = trophy.guide;
    calloutEl.appendChild(body);
    const mark = document.createElement('p');
    const earned = Boolean(state.earned[trophy.id]);
    mark.innerHTML = earned
      ? '<b>Done — you earned it.</b>'
      : '<b>Not earned yet.</b> Do the Chapter 1 meditation before Chapter 1 ends.';
    calloutEl.appendChild(mark);
  }
  rowsEl.innerHTML = '';
  for (const trophy of trophies.filter((t) => !t.missable)) {
    const row = document.createElement('tr');
    const name = document.createElement('td');
    name.textContent = `${state.earned[trophy.id] ? '✓ ' : ''}${trophy.name}`;
    row.appendChild(name);
    const grade = document.createElement('td');
    grade.textContent = trophy.grade;
    row.appendChild(grade);
    const why = document.createElement('td');
    why.className = 'why';
    why.textContent = trophy.safe;
    row.appendChild(why);
    rowsEl.appendChild(row);
  }
}

export function nextUp(trophies, state, count = 5) {
  const remaining = trophies.filter((t) => !state.earned[t.id]);
  remaining.sort((a, b) => a.stage - b.stage || a.id - b.id);
  return remaining.slice(0, count);
}

export function nextUpWhy(trophy) {
  if (trophy.missable) return 'Do this first — it is the list’s only possibly missable trophy, and its Chapter 1 moment may not return.';
  if (trophy.stage <= 3) return `Story stage ${trophy.stage} — it comes to you as you play the chapters.`;
  if (trophy.stage === 4) return 'A one-off moment right after the finale — quick, and it clears the board for the grinds.';
  if (trophy.stage === 5) return `An activity grind (stage ${trophy.stage}) — start its counter now so it stacks while you play.`;
  if (trophy.stage === 6) return `A collection (stage ${trophy.stage}) — fold it into exploration instead of backtracking later.`;
  return 'The last step — the 100% checklist, then the platinum.';
}

export function renderPlanner(container, trophies, state, onSelect, onToggle) {
  container.innerHTML = '';
  const picks = nextUp(trophies, state, 5);
  if (picks.length === 0) {
    const done = document.createElement('p');
    done.className = 'planner-note';
    done.textContent = 'Every trophy is earned — the platinum is yours. Leonida Legend.';
    container.appendChild(done);
    return;
  }
  for (const trophy of picks) {
    const card = document.createElement('article');
    card.className = 'next-card';
    const title = document.createElement('h2');
    title.textContent = `${trophy.name} — ${trophy.grade}`;
    card.appendChild(title);
    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = nextUpWhy(trophy);
    card.appendChild(why);
    const guide = document.createElement('p');
    guide.textContent = trophy.guide;
    card.appendChild(guide);
    const actions = document.createElement('div');
    actions.className = 'row-actions';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'btn ghost small';
    open.textContent = 'Open guide';
    open.addEventListener('click', () => onSelect(trophy.id));
    const mark = document.createElement('button');
    mark.type = 'button';
    mark.className = 'btn small';
    mark.textContent = 'Mark earned';
    mark.addEventListener('click', () => onToggle(trophy.id));
    actions.append(open, mark);
    card.appendChild(actions);
    container.appendChild(card);
  }
}
