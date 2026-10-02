#!/usr/bin/env node
// =============================================================================
// ETL etapa 1: LOINC en castellano (variante lingüística) → Laboratorio / Imagenología.
//
// Requiere acción del usuario: crear cuenta gratuita en https://loinc.org/ ,
// aceptar la licencia y bajar el paquete completo («LOINC Table + Accessory
// Files»). Después:
//
//   node tools/terminology-import/import-loinc-es.mjs \
//     --file "<ruta>/AccessoryFiles/LinguisticVariants/esES<id>LinguisticVariant.csv" \
//     --release 2.81
//
// (cualquier variante `es*`; se puede repetir con otra, pero todas escriben el
// mismo `loinc-es.ndjson`: elegí una). Salida: `ndjson/loinc-es.ndjson`.
// =============================================================================

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { assertRow, ndjsonPath, nowIso, sha256File, writeJson, writeNdjson } from './lib/glossary-es/common.mjs';
import { loincEsRows } from './lib/glossary-es/loinc-es.mjs';

const args = process.argv.slice(2);
const file = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;
const release = args.includes('--release') ? args[args.indexOf('--release') + 1] : null;
if (!file || !release) {
  console.error('Uso: import-loinc-es.mjs --file <esXX…LinguisticVariant.csv> --release <versión LOINC, p. ej. 2.81>');
  process.exit(2);
}

const retrievedAt = nowIso();
const rows = loincEsRows(readFileSync(file, 'utf8'), {
  sourceName: `LOINC ${release} — variante lingüística ${basename(file)} (Regenstrief Institute)`,
  sourceUrl: 'https://loinc.org/downloads/',
  retrievedAt,
}).map(assertRow);
await writeNdjson(ndjsonPath('loinc-es'), rows);
const meta = { source: 'regenstrief-loinc-es', release, file: basename(file), sha256: sha256File(file), rows: rows.length, retrievedAt };
writeJson(ndjsonPath('loinc-es').replace(/\.ndjson$/, '.meta.json'), meta, true);
console.log(JSON.stringify(meta, null, 2));
