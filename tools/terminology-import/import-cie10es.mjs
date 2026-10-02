#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): CIE-10-ES 2026 (Ministerio de Sanidad) →
// Enfermedades / Signos y síntomas / Otros términos (diagnósticos) y
// Procedimientos / Tratamientos / Pruebas diagnósticas / Imagenología
// (procedimientos, por sección ICD-10-PCS).
//
// Fuente oficial (descarga directa, sin cuenta):
//   https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/CIE10/2026/
//     Diagnosticos_Tabla_Referencia_CIE10ES_2026.xlsx
//     Procedimientos_Tabla_Referencia_CIE10ES_2026.xlsx
// enlazadas desde https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/home.htm
//
// Los archivos se cachean en `glossary-data-build/cache/cie10es/` (con SHA-256
// en el `.meta.json`); `--refresh` fuerza a bajarlos de nuevo.
// Salida: `ndjson/cie10es-diagnosticos.ndjson`, `ndjson/cie10es-procedimientos.ndjson`.
// =============================================================================

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import {
  HttpClient, assertRow, cacheDir, ndjsonPath, nowIso, sha256File, writeJson, writeNdjson,
} from './lib/glossary-es/common.mjs';
import { CIE_BASE, DX_FILE, FULL_SHEET, PX_FILE, dxRows, pxRows } from './lib/glossary-es/cie10es.mjs';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const REFRESH = process.argv.includes('--refresh');
const http = new HttpClient({ concurrency: 1, minDelayMs: 500 });
const CACHE = cacheDir('cie10es');

async function download(file) {
  const path = join(CACHE, file);
  if (REFRESH && existsSync(path)) rmSync(path);
  await http.getFileCached(`${CIE_BASE}/${file}`, path);
  return path;
}

function readSheet(path, sheet) {
  const wb = XLSX.readFile(path, { dense: true });
  if (!wb.Sheets[sheet]) throw new Error(`El libro ${path} no tiene la hoja «${sheet}» (hojas: ${wb.SheetNames.join(', ')})`);
  const intro = wb.Sheets['Introducción'] ? XLSX.utils.sheet_to_json(wb.Sheets['Introducción'], { header: 1 }) : [];
  return { rows: XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' }), intro };
}

/** «Fecha:» de la hoja Introducción (número de serie Excel) → ISO, para citar la última actualización. */
function editionDate(intro) {
  for (const r of intro) {
    const i = r.findIndex((c) => typeof c === 'string' && c.trim().startsWith('Fecha'));
    if (i >= 0) {
      const serial = r.slice(i + 1).find((c) => typeof c === 'number');
      if (serial) return new Date(Math.round((serial - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
    }
  }
  return null;
}

async function main() {
  const t0 = Date.now();
  const retrievedAt = nowIso();
  console.log('=== CIE-10-ES 2026 (Ministerio de Sanidad) → glosario ES ===');
  const meta = { source: 'sanidad-cie10es-2026', retrievedAt, files: [] };

  for (const [file, kind] of [[DX_FILE, 'diagnosticos'], [PX_FILE, 'procedimientos']]) {
    const path = await download(file);
    const { rows, intro } = readSheet(path, FULL_SHEET);
    const date = editionDate(intro);
    const prov = {
      sourceUrl: `${CIE_BASE}/${file}`,
      retrievedAt,
      sourceName: `CIE-10-ES ${kind === 'diagnosticos' ? 'Diagnósticos' : 'Procedimientos'}, 6.ª edición 2026 — Ministerio de Sanidad${date ? ` (tabla de referencia del ${date})` : ''}`,
    };
    const out = (kind === 'diagnosticos' ? dxRows(rows, prov) : pxRows(rows, prov)).map(assertRow);
    const slugs = new Set(out.map((r) => r.slug));
    if (slugs.size !== out.length) throw new Error(`Slugs duplicados en ${file}`);
    await writeNdjson(ndjsonPath(`cie10es-${kind}`), out);
    const byCategory = {};
    for (const r of out) byCategory[r.categoryKey] = (byCategory[r.categoryKey] ?? 0) + 1;
    const info = {
      file,
      url: prov.sourceUrl,
      sha256: sha256File(path),
      editionDate: date,
      sheet: FULL_SHEET,
      sheetDataRows: rows.length - 1,
      terms: out.length,
      finalCodes: out.filter((r) => r.flags?.final).length,
      byCategory,
    };
    meta.files.push(info);
    console.log(`[cie10es] ${kind}: ${out.length} términos (${info.sheetDataRows} filas en la hoja; capítulos y bloques van como jerarquía) → ${JSON.stringify(byCategory)}`);
  }
  meta.segundos = Math.round((Date.now() - t0) / 1000);
  writeJson(ndjsonPath('cie10es').replace(/\.ndjson$/, '.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-cie10es:', err);
  process.exitCode = 1;
});
