// Leonida Ledger — the hand-in program (Node 22, standard library only).
//
// The guide itself is plain static files in app/ (index.html, its modules, styles
// and data/trophies.json), and the screenshots in screenshots/ are real renders of
// it. This program copies both into the output directory and writes
// dossier.json with the kit's vendored library, which is the summary the judge
// reads: the screenshots, the first load's files and bytes, and the source.
// vendor/makefun-frontend.ts is the kit's copy, unchanged — the scorer rebuilds
// the dossier with its own copy and compares the two byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse an
// entry the scorer would refuse (more than 4 screenshots or one over 256 KiB; more
// than 993 files and directories in app/ or 48 MiB of app files — app/ counts
// beside /output's own 1,000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
