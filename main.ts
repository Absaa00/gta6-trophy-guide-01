// Leonida Trophy Guide — the entry program (Node 22, standard library only).
// It hands in the guide: copies this repo's app/ and screenshots/ into the
// output directory and writes dossier.json with the kit's vendored library,
// which the scorer requires byte for byte. The guide itself is plain static
// files (app/index.html + ES modules + CSS + data), fully offline — it fetches
// nothing over the network, so it runs the same in a browser, on makefun.sh,
// or in the finalist review with the network off.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide for a look with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  }
  // The scorer's own caps (reference/gate.json): at most 4 screenshots of at
  // most 256 KiB each, app/ at most 993 files and 48 MiB, dossier text at most
  // 163,840 bytes. Anything over a cap is refused, so the build refuses first.
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

handIn();
