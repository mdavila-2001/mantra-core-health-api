#!/usr/bin/env node
// =============================================================================
// S3 · etapa 1c: fecha de la ficha para los productos de referencia cuyo `docs[].fecha`
// no viene en la API de CIMA. Se lee de la sección 10 («Fecha de la revisión del texto»)
// de la propia ficha y SOLO si el documento escribe una fecha. Sin fecha escrita, el
// producto queda sin fecha y sus secciones no se publican (el aviso legal de AEMPS exige
// citarla). 1 petición por segundo, caché en disco, reanudable.
// =============================================================================

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CACHE_DIR } from './lib/paths.mjs';
import { PoliteClient } from './lib/polite-client.mjs';
import { parseRevisionDate } from './lib/revision-date.mjs';
import { revisionDateUrl } from './lib/sections.mjs';

async function main() {
  const manifest = JSON.parse(readFileSync(join(CACHE_DIR, 'sections-manifest.json'), 'utf8'));
  const pending = Object.entries(manifest)
    .filter(([, sections]) => Object.values(sections).some((s) => !s.fichaDate))
    .map(([nreg]) => nreg)
    .sort();
  console.log(`${pending.length} productos de referencia sin fecha en la API`);
  const client = new PoliteClient({ minIntervalMs: 1000 });
  const outPath = join(CACHE_DIR, 'revision-dates.json');
  const out = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {};
  let n = 0;
  for (const nreg of pending) {
    const response = await client.getJsonCached(revisionDateUrl(nreg), join(CACHE_DIR, 'revision', `${nreg}.json`));
    const parsed = parseRevisionDate(response);
    out[nreg] = parsed ? { value: parsed.value, precision: parsed.precision, origin: 'ficha-section-10' } : null;
    if (++n % 50 === 0) {
      writeFileSync(outPath, JSON.stringify(out));
      console.log(`${n}/${pending.length} ${JSON.stringify(client.stats)}`);
    }
  }
  writeFileSync(outPath, JSON.stringify(out));
  const withDate = Object.values(out).filter(Boolean).length;
  console.log(JSON.stringify({ pending: pending.length, withDate, withoutDate: Object.keys(out).length - withDate, http: client.stats }));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error('ERROR FATAL en fetch-revision-dates:', e);
    process.exitCode = 1;
  });
}
