# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Absaa00/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Absaa00/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Trophy Guide** — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a checklist saved in the browser, export and import, filters by kind, a spoiler setting that hides story trophies until they are earned, a staged roadmap to the Platinum, the one missable trophy flagged, and a guide to each trophy in our own words that cites its sources. Built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **All 55 official trophies** — 1 Platinum, 2 Gold, 6 Silver, 46 Bronze (28 hidden on PSN, 0 online), with exact official names, descriptions and grades from the list Exophase and PSNProfiles publish.
- **Checklist tracker** — tick trophies off as you earn them; progress is saved in localStorage and shown as a bar plus per-grade counts.
- **Progress counters** — steppers for the counted trophies (250 stunts, 42 shooting-range golds, 100 WAiNK locations, $250,000 laundered, …) and a personal note per trophy.
- **Filters** — by kind (Story, Missable, Collectibles, Activities, Online), by grade, by earned/remaining, plus text search.
- **Spoiler-safe mode** — hides the names and descriptions of story trophies until they are earned.
- **Roadmap to the Platinum** — seven stages in order, from the Chapter 1 missable (meditate at Jason's house first!) to the 100% checklist and the Platinum, with per-stage progress.
- **Missables page** — the one trophy PowerPyx flags as potentially missable (Positive Mental Attitude), with why, and every other trophy listed as safe with its reason.
- **Cited guides** — each trophy's guide names its sources beside it (Exophase, PSNProfiles, PowerPyx, GTA Zone, Planet GTA 6). Where a location or step is not yet pinned down in the published guides, the guide says so plainly instead of guessing.
- **Export / import** — download a JSON backup of your progress and restore it later.

All artwork and lettering is original. No Rockstar logo or official artwork is used.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network, no dependencies — plain static files under `app/`. The app makes no network request while it runs; source links open only when you follow them.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node ../gta6-trophy-guide-01-kit27/gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit ../gta6-trophy-guide-01-kit27/gta6-trophy-guide-01-kit --repo .
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
