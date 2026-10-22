#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): CIMA (AEMPS) → Farmacología clínica en castellano.
//
// Fuente: API REST pública de CIMA, https://cima.aemps.es/cima/rest/ (sin cuenta).
//   1. `medicamentos?pagina=N`  → listado completo (200 por página; 25 471 filas
//      el 2026-09-30), con vtm, fotos, vías, forma farmacéutica, dosis y docs.
//   2. `medicamento?nregistro=X` → detalle: atcs, principiosActivos, presentaciones.
//   3. `docSegmentado/contenido/1?nregistro=X&seccion=S` → secciones de la ficha
//      técnica (4.1, 4.2, 4.3, 4.4, 4.8, 5.1), sólo del producto de referencia de
//      cada VTM (criterio en `lib/glossary-es/cima.mjs#pickReferenceProduct`).
//
// Throttle: concurrencia 4, 120 ms entre pedidos por carril, reintentos
// exponenciales ante 429/5xx/red. Todo se cachea en
// `glossary-data-build/cache/cima/` → una corrida interrumpida se reanuda
// donde quedó (`node import-cima.mjs` otra vez).
//
// Salida: `glossary-data-build/ndjson/cima.ndjson` + `cima.meta.json`.
// Carga a base: `load-glossary-es.mjs` (etapa 2).
//
// Opciones: `--limit-vtm N` (prueba de humo), `--skip-sections`, `--concurrency N`.
// =============================================================================

import { join } from 'node:path';
import {
  HttpClient, assertRow, cacheDir, mapPool, ndjsonPath, nowIso, progressLogger, writeJson, writeNdjson,
} from './lib/glossary-es/common.mjs';
import { CIMA_REST, FICHA_SECTIONS, pickReferenceProduct, sectionUrl, toProduct, toSection, toVtmRow } from './lib/glossary-es/cima.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const LIMIT_VTM = Number(opt('--limit-vtm', 0));
const SKIP_SECTIONS = args.includes('--skip-sections');
const CONCURRENCY = Math.min(4, Number(opt('--concurrency', 4)));

const http = new HttpClient({ concurrency: CONCURRENCY, minDelayMs: 120 });
const CACHE = cacheDir('cima');

async function fetchList() {
  const first = await http.getJsonCached(`${CIMA_REST}/medicamentos?pagina=1`, join(CACHE, 'list', 'page-1.json'));
  const pages = Math.ceil(first.totalFilas / first.tamanioPagina);
  const rest = await mapPool(
    Array.from({ length: pages - 1 }, (_, i) => i + 2),
    CONCURRENCY,
    (p) => http.getJsonCached(`${CIMA_REST}/medicamentos?pagina=${p}`, join(CACHE, 'list', `page-${p}.json`)),
    progressLogger('cima:listado', 20),
  );
  const rows = [first, ...rest].flatMap((d) => d.resultados ?? []);
  // El listado es paginado sobre un conjunto vivo: se deduplica por nregistro.
  const byReg = new Map(rows.map((r) => [r.nregistro, r]));
  return { reported: first.totalFilas, pages, rows: [...byReg.values()] };
}

async function main() {
  const t0 = Date.now();
  const retrievedAt = nowIso();
  console.log('=== CIMA (AEMPS) → glosario ES (Farmacología clínica) ===');

  const list = await fetchList();
  console.log(`[cima] listado: ${list.rows.length} medicamentos únicos (API informa ${list.reported}) en ${list.pages} páginas`);

  // Agrupar por VTM.
  const byVtm = new Map();
  let withoutVtm = 0;
  for (const r of list.rows) {
    if (!r.vtm?.id) {
      withoutVtm++;
      continue;
    }
    if (!byVtm.has(r.vtm.id)) byVtm.set(r.vtm.id, { vtm: r.vtm, rows: [] });
    byVtm.get(r.vtm.id).rows.push(r);
  }
  let groups = [...byVtm.values()].sort((a, b) => a.vtm.id - b.vtm.id);
  if (LIMIT_VTM > 0) groups = groups.slice(0, LIMIT_VTM);
  console.log(`[cima] ${byVtm.size} principios activos (VTM); ${withoutVtm} medicamentos sin VTM (no se incluyen: no hay principio activo codificado al que colgarlos)`);

  // Detalle de cada medicamento de los grupos elegidos.
  const regs = groups.flatMap((g) => g.rows.map((r) => r.nregistro));
  const details = new Map();
  await mapPool(
    regs,
    CONCURRENCY,
    async (nreg) => {
      const d = await http.getJsonCached(
        `${CIMA_REST}/medicamento?nregistro=${encodeURIComponent(nreg)}`,
        join(CACHE, 'detail', `${nreg}.json`),
        { allow404: true },
      );
      details.set(nreg, d);
    },
    progressLogger('cima:detalle', 1000),
  );
  const missingDetail = regs.filter((n) => details.get(n) == null).length;

  // Filas + secciones de ficha técnica del producto de referencia.
  let sectionsFetched = 0;
  let sectionsEmpty = 0;
  const out = await mapPool(
    groups,
    CONCURRENCY,
    async (g) => {
      const products = g.rows.map((r) => toProduct(r, details.get(r.nregistro)));
      const ref = pickReferenceProduct(products);
      const sections = [];
      if (ref && !SKIP_SECTIONS) {
        for (const s of FICHA_SECTIONS) {
          const resp = await http.getJsonCached(sectionUrl(ref.nregistro, s), join(CACHE, 'sections', ref.nregistro, `${s}.json`), { allow404: true });
          const sec = toSection(s, resp, ref, retrievedAt);
          if (sec) {
            sections.push(sec);
            sectionsFetched++;
          } else sectionsEmpty++;
        }
      }
      return assertRow(toVtmRow(g.vtm, products, sections, retrievedAt));
    },
    progressLogger('cima:vtm', 200),
  );

  out.sort((a, b) => a.esName.localeCompare(b.esName, 'es'));
  await writeNdjson(ndjsonPath('cima'), out);

  const meta = {
    source: 'aemps-cima',
    endpoint: CIMA_REST,
    retrievedAt,
    reportedTotal: list.reported,
    medicamentosUnicos: list.rows.length,
    medicamentosSinVtm: withoutVtm,
    vtm: out.length,
    productos: regs.length,
    productosSinDetalle: missingDetail,
    conDefinicion: out.filter((r) => r.definition).length,
    conImagen: out.filter((r) => r.imageUrl).length,
    conAtc: out.filter((r) => r.drugFacts.atc.length > 0).length,
    seccionesFichaTecnica: sectionsFetched,
    seccionesVaciasO404: sectionsEmpty,
    http: http.stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(ndjsonPath('cima').replace(/\.ndjson$/, '.meta.json'), meta, true);
  console.log('\n=== RESUMEN CIMA ===');
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en import-cima:', err);
  process.exitCode = 1;
});
