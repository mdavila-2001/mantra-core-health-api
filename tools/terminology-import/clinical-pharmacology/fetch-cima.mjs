#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1a (red): CIMA (AEMPS).
//
//   1. medicamentos?pagina=N        listado completo        (caché compartida con import-cima.mjs)
//   2. medicamento?nregistro=X      detalle: ATC, principios (caché compartida)
//   3. maestras?maestra=7           nombres ATC de la AEMPS (los 5 niveles)
//   4. docSegmentado/contenido/1    ficha técnica COMPLETA de cada documento de
//                                   referencia (un pedido por ficha); las
//                                   secciones que no vengan se piden de a una
//   5. notas/X                      notas de seguridad (sólo si el listado dice `notas: true`)
//
// Reanudable: todo se cachea; volver a correr retoma donde quedó. Throttle:
// concurrencia ≤ 4 y 120 ms por carril, reintentos ante 429/5xx (HttpClient).
//
// Uso:
//   node tools/terminology-import/clinical-pharmacology/fetch-cima.mjs [--granularity route|product] [--limit-atc N] [--plan]
//   --plan          sólo cuenta cuántos pedidos faltan (lee lo cacheado; si no hay listado, lo baja)
// =============================================================================

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { mapPool, progressLogger, writeJson } from '../lib/glossary-es/common.mjs';
import { PoliteHttpClient, getJsonCachedGz, writeJsonGz } from './lib/polite-http.mjs';
import { CIMA_REST, atcMasterUrl, cimaProduct, fullDocUrl, groupByAtc5, missingSections, referenceDocuments, safetyNotesUrl, sectionApiUrl } from './lib/cima.mjs';
import { parseArgs, readJsonIfExists } from './lib/cli.mjs';
import { CIMA_SHARED_CACHE, atcMasterPath, cpCache, ftPath, ftSectionPath, notesPath } from './lib/paths.mjs';

const { opt, has } = parseArgs();
const GRANULARITY = opt('--granularity', 'route');
const LIMIT_ATC = Number(opt('--limit-atc', 0));
const PLAN = has('--plan');
const CONCURRENCY = Math.min(4, Number(opt('--concurrency', 4)));
const http = new PoliteHttpClient({ concurrency: CONCURRENCY, rps: Number(opt('--rps', 2)) });

async function fetchPaged(urlOf, pathOf, label) {
  const first = await http.getJsonCached(urlOf(1), pathOf(1));
  const pages = first?.totalFilas && first?.tamanioPagina ? Math.ceil(first.totalFilas / first.tamanioPagina) : 1;
  const rest = await mapPool(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => i + 2),
    CONCURRENCY,
    (p) => http.getJsonCached(urlOf(p), pathOf(p)),
    progressLogger(label, 20),
  );
  return { reported: first?.totalFilas ?? null, pages, rows: [first, ...rest].flatMap((d) => d?.resultados ?? []) };
}

const escapeHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Una sección suelta (respaldo si la ficha completa no la trae). Medido el 2026-10-27: este endpoint NO responde JSON
 * sino `text/plain` con el texto de la sección (la ficha completa sí es un arreglo JSON). Se guarda en la misma forma
 * `[{ seccion, titulo, contenido }]` que la ficha completa; el texto va escapado para que `htmlToText` lo devuelva igual
 * (un «< 1/10» no es una etiqueta). Vacío o 404 → `null`.
 */
async function fetchSection(nreg, section) {
  const path = ftSectionPath(nreg, section);
  if (existsSync(path)) return;
  const { status, body } = await http.get(sectionApiUrl(nreg, section), { allow404: true });
  const text = body.toString('utf8');
  let value = null;
  if (status !== 404 && text.trim() !== '') {
    try {
      const parsed = JSON.parse(text);
      value = Array.isArray(parsed) ? parsed : null;
    } catch {
      value = [{ seccion: section, titulo: null, contenido: `<div>${escapeHtml(text).replace(/\r?\n/g, '<br/>')}</div>`, formato: 'text/plain' }];
    }
  }
  writeJsonGz(path, value);
}

async function main() {
  const t0 = Date.now();
  console.log(`=== Farmacología clínica · CIMA (granularidad ${GRANULARITY}) ===`);
  const list = await fetchPaged((p) => `${CIMA_REST}/medicamentos?pagina=${p}`, (p) => join(CIMA_SHARED_CACHE, 'list', `page-${p}.json`), 'cima:listado');
  const rows = [...new Map(list.rows.map((r) => [r.nregistro, r])).values()];
  console.log(`[cima] listado: ${rows.length} medicamentos únicos (API informa ${list.reported})`);

  // La maestra ATC va ANTES de los ~25 500 detalles: el universo de ATC 5 (que necesita RxNav) sale de ella.
  const master = PLAN ? null : await fetchPaged(atcMasterUrl, atcMasterPath, 'cima:maestra-atc');
  if (master) console.log(`[cima] maestra ATC: ${master.rows.length} filas`);

  const details = new Map();
  const missingDetails = rows.filter((r) => !existsSync(join(CIMA_SHARED_CACHE, 'detail', `${r.nregistro}.json`))).length;
  if (PLAN) {
    console.log(`[plan] detalles por bajar: ${missingDetails}`);
    for (const r of rows) details.set(r.nregistro, readJsonIfExists(join(CIMA_SHARED_CACHE, 'detail', `${r.nregistro}.json`)) ?? null);
  } else {
    await mapPool(
      rows,
      CONCURRENCY,
      async (r) => details.set(r.nregistro, await http.getJsonCached(`${CIMA_REST}/medicamento?nregistro=${encodeURIComponent(r.nregistro)}`, join(CIMA_SHARED_CACHE, 'detail', `${r.nregistro}.json`), { allow404: true })),
      progressLogger('cima:detalle', 1000),
    );
  }

  const products = rows.map((r) => cimaProduct(r, details.get(r.nregistro)));
  const { byAtc, withoutAtc5 } = groupByAtc5(products);
  let atcCodes = [...byAtc.keys()].sort();
  if (LIMIT_ATC > 0) atcCodes = atcCodes.slice(0, LIMIT_ATC);
  const refs = [...new Map(atcCodes.flatMap((c) => referenceDocuments(byAtc.get(c), GRANULARITY)).map((r) => [r.product.nregistro, r])).values()];
  const flagged = new Set(rows.filter((r) => r.notas === true).map((r) => r.nregistro));
  console.log(`[cima] ${byAtc.size} ATC 5; ${withoutAtc5.length} medicamentos sin ATC 5; ${refs.length} fichas de referencia`);

  const pendingDocs = refs.filter((r) => !existsSync(ftPath(r.product.nregistro))).length;
  const pendingNotes = refs.filter((r) => flagged.has(r.product.nregistro) && !existsSync(notesPath(r.product.nregistro))).length;
  if (PLAN) {
    console.log(`[plan] fichas completas por bajar: ${pendingDocs}; notas de seguridad por bajar: ${pendingNotes}`);
    return;
  }

  let sectionFallbacks = 0;
  await mapPool(
    refs,
    CONCURRENCY,
    async (r) => {
      const nreg = r.product.nregistro;
      const doc = await getJsonCachedGz(http, fullDocUrl(nreg), ftPath(nreg), { allow404: true });
      if (!Array.isArray(doc)) return; // 404 o vacío: no hay ficha segmentada que completar
      for (const s of [...missingSections(doc), ...(doc.some((x) => x?.seccion === '10') ? [] : ['10'])]) {
        await fetchSection(nreg, s);
        sectionFallbacks++;
      }
      if (flagged.has(nreg)) await http.getJsonCached(safetyNotesUrl(nreg), notesPath(nreg), { allow404: true });
    },
    progressLogger('cima:fichas', 100),
  );

  const meta = {
    source: 'aemps-cima',
    endpoint: CIMA_REST,
    finishedAt: new Date().toISOString(),
    granularity: GRANULARITY,
    medicamentos: rows.length,
    sinAtc5: withoutAtc5.length,
    atc5: byAtc.size,
    fichasReferencia: refs.length,
    pedidosSeccionSuelta: sectionFallbacks,
    maestraAtc: master?.rows.length ?? null,
    http: http.stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(cpCache('cima', 'fetch.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-cima:', err);
  process.exitCode = 1;
});
