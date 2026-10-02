#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): análisis clínicos del «Listado de Servicios y
// Aranceles del INLASA» (Instituto Nacional de Laboratorios de Salud, Bolivia),
// con su código oficial y su precio de referencia en bolivianos.
//
// La tabla viaja completa en el HTML (DataTables sólo pagina en el navegador).
// Reglas de inclusión y de caja del nombre en `lib/glossary-es/inlasa.mjs`.
// Salida: `ndjson/inlasa-aranceles.ndjson` (+ `.meta.json` con lo excluido).
//
// TLS: inlasa.gob.bo no envía el intermedio de Let's Encrypt (YR1, raíz
// «ISRG Root YR»), que el almacén de Node 24 no conoce: `fetch` falla con
// UNABLE_TO_VERIFY_LEAF_SIGNATURE. NO se desactiva la verificación: se baja la
// página con curl (que la valida con la confianza de macOS) y se pasa el archivo:
//
//   curl -sSL https://inlasa.gob.bo/servicios-y-aranceles-del-inlasa/ -o /tmp/inlasa.html
//   node tools/terminology-import/import-inlasa.mjs --html /tmp/inlasa.html
//
// El SHA-256 del HTML leído queda en el `.meta.json`.
// =============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HttpClient, cacheDir, ndjsonPath, nowIso, sha256File, writeJson, writeNdjson } from './lib/glossary-es/common.mjs';
import { INLASA_URL, inlasaRow, isPatientTest, parseInlasaTable } from './lib/glossary-es/inlasa.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });

async function main() {
  const retrievedAt = nowIso();
  const htmlArg = process.argv.indexOf('--html');
  const path = htmlArg > 0 ? process.argv[htmlArg + 1] : join(cacheDir('inlasa'), 'servicios-y-aranceles-del-inlasa.html');
  if (htmlArg < 0) await http.getFileCached(INLASA_URL, path);
  const all = parseInlasaTable(readFileSync(path, 'utf8'));
  if (all.length < 500) throw new Error(`La tabla de INLASA trajo ${all.length} filas: ¿cambió la página? Se esperaban más de 500.`);
  const kept = all.filter(isPatientTest);
  const rows = kept.map((item) => inlasaRow(item, retrievedAt)).sort((a, b) => a.code.localeCompare(b.code));
  await writeNdjson(ndjsonPath('inlasa-aranceles'), rows);

  const byArea = {};
  for (const r of kept) byArea[r.area] = (byArea[r.area] ?? 0) + 1;
  const meta = {
    source: 'inlasa-aranceles-2026',
    url: INLASA_URL,
    retrievedAt,
    archivoLeido: htmlArg > 0 ? 'copia local pasada con --html' : 'descarga directa (caché)',
    sha256: sha256File(path),
    filasEnLaTabla: all.length,
    analisisAPacientes: rows.length,
    porArea: byArea,
    excluidos: all.filter((a) => !isPatientTest(a)).map((a) => `${a.code} ${a.name}`),
  };
  writeJson(ndjsonPath('inlasa-aranceles').replace(/\.ndjson$/, '.meta.json'), meta, true);
  const { excluidos, ...short } = meta;
  console.log(JSON.stringify({ ...short, excluidos: excluidos.length }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-inlasa:', err);
  process.exitCode = 1;
});
