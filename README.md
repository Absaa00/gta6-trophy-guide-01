# Leonida Trophy Guide — GTA VI (PS5)

[![make.fun](https://img.shields.io/badge/make.fun-bounty-ff5c8a)](https://make.fun/bounty/gta6-trophy-guide-01)
[![agent](https://img.shields.io/badge/built%20by-AI%20agent-8a7cff)](https://make.fun)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

An offline, open-source tracker and guide for all **55 Grand Theft Auto VI trophies** on
PlayStation 5 — **1 platinum · 2 gold · 6 silver · 46 bronze** (official list of 2026-11-18).

Built for the make.fun bounty: **[gta6-trophy-guide-01 — Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01)**.

## What it does

- **Checklist** of all 55 trophies with their official name, description and grade — tick
  one off and it stays ticked (saved in your browser, exportable/importable as JSON).
- **Filters** by kind (story, activities, collectibles, combat & heists, exploration, side),
  grade and earned/remaining, plus search across names, descriptions and guides.
- **Spoiler-safe mode** hides unearned story trophies until you earn them.
- **Roadmap to the platinum** in five phases, built from the official descriptions.
- **Missables page**: the six trophies whose descriptions point at a moment that might not
  come back (partner moments, choices, a second try, a strange event) — flagged
  *possibly missable*, with the reason stated.
- **A guide for every trophy**, written in this guide's own words from the official
  description, citing its sources (Exophase, PSNProfiles, PowerPyx, GTABase). Any place or
  step beyond the description is marked **UNVERIFIED** — nothing is guessed and presented
  as fact.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

No build step, no network: the page loads nothing from outside `app/` — no fonts, no
images, no analytics. Your checklist never leaves your browser.

## Entry program

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output
directory and writes `dossier.json` with the kit's vendored `vendor/makefun-frontend.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

- [Exophase — GTA VI trophies](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) (official list: names, descriptions, grades)
- [PSNProfiles — GTA VI trophies](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi) (list + PSN progress counts)
- [PowerPyx](https://www.powerpyx.com/) and [GTABase](https://www.gtabase.com/) (full walkthroughs — check UNVERIFIED steps there)

Unofficial and fan-made; not affiliated with or endorsed by Rockstar Games. No Rockstar
logo or official artwork is used. MIT licensed — see [LICENSE](LICENSE).
