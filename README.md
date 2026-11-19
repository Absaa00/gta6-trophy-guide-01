# Leonida Ledger — GTA VI Trophy Guide & Tracker

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-orange)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI,
built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Checklist** of all 55 official trophies — name, description and grade exactly as
  PlayStation publishes them (1 platinum, 2 gold, 6 silver, 46 bronze) — with progress
  saved in the browser, export to a file and import back.
- **Filters** by kind (story, missable, collectibles, activities), grade, earned/remaining,
  plus search — and a **spoiler setting** that hides the names and descriptions of story
  trophies until they are earned.
- **Roadmap to the Platinum** in 7 stages, in the order to play them; every trophy sits
  in exactly one stage.
- **Missables page**: the one possibly missable trophy (Positive Mental Attitude — see its
  card for the Chapter 1 warning) plus the other 54, each with the reason it is safe.
- **Next up planner**: your next five trophies in roadmap order, with a reason each.
- **A guide to every trophy** in this guide's own words, naming its sources (Exophase for
  the official list, PSNProfiles for PSN's counts, PowerPyx and GTABase for the roadmap and
  the missable flag). Where a location or step had not been pinned down in public guides by
  19 Nov 2026, the card says so plainly instead of guessing.
- **Progress counters** for every trophy with a target (250 stunts, 42 shooting-range golds,
  100 WAiNK spots, $250,000 laundered…) and a **personal note** per trophy.
- **Fully offline**: static files under `app/`, no network request at run time. No Rockstar
  logo or official artwork anywhere — the look is this guide's own.

## Try it

```sh
node serve.ts        # app/ on http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output
directory and writes `dossier.json` with the kit's vendored `vendor/makefun-frontend.ts`.

## Screenshots

```sh
node shots.mjs       # 4 real renders of the guide in headless Chromium
node verify.mjs      # drives every feature + rebuilds the dossier twice
```

## License

MIT — see [LICENSE](LICENSE). Unofficial fan guide, not affiliated with Rockstar Games
or PlayStation.
