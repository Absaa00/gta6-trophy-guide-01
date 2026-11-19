// Leonida Trophy Guide — a gta6-trophy-guide-01 entry (Node 22, standard library only).
//
// The program hands the guide in: it copies app/ and screenshots/ from beside
// this file into the output directory and writes dossier.json there with
// buildDossier from the kit's vendored make.fun library. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output; without it, /output is used.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// The bounty gate's own caps for this competition: the dossier text at most
// 163,840 bytes, 3 to 4 screenshots of at most 256 KiB each, app/ at most
// 993 files and 48 MiB, the dossier at most 1.5 MiB.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyEntry(name) {
  const from = join(repoRoot, name);
  const to = join(outDir, name);
  if (!existsSync(from)) throw new Error('missing in repository: ' + name);
  cpSync(from, to, { recursive: true });
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyEntry('app');
copyEntry('screenshots');
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_CAPS));
console.log('wrote ' + outDir + '/dossier.json from app/ and screenshots/');
