#!/usr/bin/env node
// =============================================================================
// ETL etapa 1 (fetch → NDJSON): CIMA (AEMPS) → Farmacología clínica en castellano.
//
// Fuente: API REST pública de CIMA, https://cima.aemps.es/cima/rest/ (sin cuenta).
//   1. `medicamentos?pagina=N`  → listado completo (200 por página; 25 471 filas
//      el 2026-09-30), con vtm, fotos, vías, forma farmacéutica, dosis y docs.
//   2. `medicamento?nregistro=X` → detalle: atcs, principiosActivos, presentaciones.
//   3. `docSegmentado/contenido/1?nregistro=X&seccion=S` → secciones de la ficha
//      técnica de la LISTA BLANCA (`FICHA_SECTIONS`: 4.1, 4.3, 4.4, 4.5, 4.6,
//      4.8, 5.1), sólo del producto de referencia de cada VTM (criterio en
//      `lib/glossary-es/cima.mjs#pickReferenceProduct`). La posología (4.2) no
//      se pide nunca (TAREA-41 F4.5).
//
// Throttle: el de `sources.json` («aemps-cima».rateLimit.policy). La AEMPS no
// publica límite; se aplica 1 petición a la vez y ≥ 1 s entre peticiones, con
// reintentos exponenciales ante 429/5xx/red. Todo se cachea en
// `glossary-data-build/cache/cima/` → una corrida interrumpida se reanuda
// donde quedó (`node import-cima.mjs` otra vez).
//
// Salida: `glossary-data-build/ndjson/cima.ndjson` + `cima.meta.json`.
// Carga a base: `load-glossary-es.mjs` (etapa 2).
//
// Opciones: `--limit-vtm N` (prueba de humo), `--skip-sections`.
//
// Seguridad del fármaco (TAREA-41 F4.2 y F4.3), sin descargar nada: lee
// `cima.ndjson`, los resúmenes de LactMed del corpus de `clinical-pharmacology/data`
// y las designaciones del glosario (base, sólo lectura) y escribe en `out/`:
//   node import-cima.mjs --safety                     # informe + cola, no escribe en la base
//   node import-cima.mjs --safety --load              # además carga 4.3/4.6/4.8 y LactMed (un lote por fuente)
//   node import-cima.mjs --safety --load --dry-run    # todo, y ROLLBACK al final
//   - cima-unmatched.csv        lo que no casó exacto (y las oraciones con dosis)
//   - cima-interactions.csv     4.5 → pares para `clinical_ext.drug_interactions`
//   - cima-safety.summary.json  conteos por sección
// Las interacciones NO se cargan: `severity_concept_id` es obligatorio y el
// modelo no declara un value set con `UNSPECIFIED` (BLOCKED, ver
// docs/trabajo/2026-10-26-l41-f4-drug-safety/REPORTE.md).
// =============================================================================

import { createReadStream, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';
import {
  HttpClient, assertRow, cacheDir, mapPool, ndjsonPath, nowIso, progressLogger, readNdjson, writeJson, writeNdjson,
} from './lib/glossary-es/common.mjs';
import { CIMA_REST, pickReferenceProduct, sectionRequests, toProduct, toSection, toVtmRow } from './lib/glossary-es/cima.mjs';
import {
  CLINICAL_TARGET_CATEGORIES, LACTATION_TERMS, buildTermIndex, catalogDrugsByAtc, cimaSafety, fixedTarget, ingredientDesignations, interactionsCsv,
  lactmedSafety, lactmedSummariesFromMonograph, safetyInputFromRow, safetySummary, unmatchedCsv,
} from './lib/glossary-es/cima-safety.mjs';
import { LACTMED_LICENSE } from './clinical-pharmacology/lib/lactmed.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, 'out');
/** Corpus de `clinical-pharmacology` (una monografía por ATC 5, ya enlazada a LactMed por UNII). */
const MONOGRAPHS_DIR = join(HERE, 'clinical-pharmacology', 'data');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const LIMIT_VTM = Number(opt('--limit-vtm', 0));
const SKIP_SECTIONS = args.includes('--skip-sections');

/** Política de peticiones registrada en `sources.json` (verificada antes de descargar). */
const REQUEST_POLICY = JSON.parse(readFileSync(join(HERE, 'sources.json'), 'utf8')).sources['aemps-cima'].rateLimit.policy;
const CONCURRENCY = REQUEST_POLICY.concurrency;

const http = new HttpClient({ concurrency: CONCURRENCY, minDelayMs: REQUEST_POLICY.minIntervalMs });
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
        for (const { section: s, url } of sectionRequests(ref.nregistro)) {
          const resp = await http.getJsonCached(url, join(CACHE, 'sections', ref.nregistro, `${s}.json`), { allow404: true });
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

/** Designaciones de los conceptos activos con su categoría del glosario (misma consulta que NNAC F2). */
async function readDesignations(client, activeConceptId) {
  const { rows } = await client.query(
    `SELECT d.concept_id AS "conceptId", d.value AS text,
            (SELECT substr(vs.internal_code, length('glossary-category-') + 1)
               FROM terminology.value_set_members m
               JOIN terminology.value_set_versions vv ON vv.id = m.value_set_version_id AND vv.is_default = true
               JOIN terminology.value_sets vs ON vs.id = vv.value_set_id
              WHERE m.concept_id = d.concept_id AND m.included = true AND vs.internal_code LIKE 'glossary-category-%'
              LIMIT 1) AS "categoryKey"
       FROM terminology.concept_designations d
       JOIN terminology.catalog_concepts c ON c.id = d.concept_id AND c.state_concept_id = $1`,
    [activeConceptId],
  );
  return rows;
}

/** F4.3: resúmenes de LactMed del corpus de monografías (sólo esa sección; el resto se descarta al leer). */
async function readLactmedSummaries() {
  const parts = readdirSync(MONOGRAPHS_DIR).filter((f) => /^monographs\.part-\d+\.ndjson\.gz$/.test(f)).sort();
  const summaries = [];
  for (const part of parts) {
    const lines = createInterface({ input: createReadStream(join(MONOGRAPHS_DIR, part)).pipe(createGunzip()), crlfDelay: Infinity });
    for await (const line of lines) if (line.trim()) summaries.push(...lactmedSummariesFromMonograph(JSON.parse(line)));
  }
  return summaries;
}

/** F4.2 + F4.3: relaciones de seguridad desde las fichas ya descargadas y LactMed. */
async function safety() {
  // `.env` antes que `db.mjs`, que lee `DB_*` al evaluarse. Imports diferidos: el modo
  // descarga no necesita `pg`.
  await import('dotenv/config');
  const [{ default: pg }, { DB_CONFIG, ensureCodeSystem }, { CONCEPT, codeSystemPlan }, { bulkLoadRelationships }] = await Promise.all([
    import('pg'),
    import('./symptoms/lib/db.mjs'),
    import('./lib/glossary-es/load-plan.mjs'),
    import('./lib/bulk-copy.mjs'),
  ]);
  const rows = readNdjson(ndjsonPath('cima'));
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const designations = await readDesignations(client, CONCEPT.TERM_ACTIVE);
    const clinicalIndex = buildTermIndex(designations, { categories: CLINICAL_TARGET_CATEGORIES });
    const ingredientIndex = buildTermIndex(ingredientDesignations(rows));
    const result = { relationships: [], interactions: [], unmatched: [] };
    for (const row of rows) {
      const r = cimaSafety({ ...safetyInputFromRow(row), clinicalIndex, ingredientIndex });
      result.relationships.push(...r.relationships);
      result.interactions.push(...r.interactions);
      result.unmatched.push(...r.unmatched);
    }
    const lactmedSummaries = await readLactmedSummaries();
    const lactmed = lactmedSafety({
      summaries: lactmedSummaries,
      drugsByAtc: catalogDrugsByAtc(rows),
      lactationTarget: fixedTarget(clinicalIndex, LACTATION_TERMS),
    });

    // Sólo se cargan relaciones cuyos dos extremos existen en la base.
    const all = [...result.relationships, ...lactmed.relationships];
    const ids = [...new Set(all.flatMap((r) => [r.sourceConceptId, r.targetConceptId]))];
    const { rows: present } = await client.query('SELECT id FROM terminology.catalog_concepts WHERE id = ANY($1::uuid[])', [ids]);
    const known = new Set(present.map((p) => p.id));
    const isLoadable = (r) => known.has(r.sourceConceptId) && known.has(r.targetConceptId);
    const loadable = result.relationships.filter(isLoadable);
    const loadableLactmed = lactmed.relationships.filter(isLoadable);

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, 'cima-unmatched.csv'), unmatchedCsv([...result.unmatched, ...lactmed.unmatched]));
    writeFileSync(join(OUT_DIR, 'cima-interactions.csv'), interactionsCsv(result.interactions));
    const summary = {
      drugs: rows.length,
      ...safetySummary(result),
      loadableRelationships: loadable.length,
      missingConcepts: result.relationships.length - loadable.length,
      lactmed: {
        summaries: lactmedSummaries.length,
        relationships: lactmed.relationships.length,
        loadableRelationships: loadableLactmed.length,
        unmatchedByReason: safetySummary({ relationships: [], interactions: [], unmatched: lactmed.unmatched }).unmatchedByReason,
      },
    };
    writeFileSync(join(OUT_DIR, 'cima-safety.summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary, null, 2));

    if (!args.includes('--load')) return;
    // Un lote por fuente: la evidencia lleva la fuente que la publica (AEMPS o NLM).
    const dryRun = args.includes('--dry-run');
    // En --dry-run la cabecera (fuente, code system, versión) entra en la misma transacción que
    // abre el lote: su BEGIN sólo avisa «already in progress» y su ROLLBACK la deshace también.
    const begin = () => (dryRun ? client.query('BEGIN') : null);
    await begin();
    const cima = await ensureCodeSystem(client, codeSystemPlan('cima-vtm', rows), CONCEPT.TERM_ACTIVE);
    const loaded = await bulkLoadRelationships(client, {
      terminologySourceId: cima.sourceId,
      codeSystemVersionId: cima.versionId,
      rows: loadable,
      dryRun,
      log: console.log,
    });
    console.log('[cima safety]', JSON.stringify(loaded));
    if (loadableLactmed.length > 0) {
      const lactmedPlanRows = lactmedSummaries.map((s) => ({ sourceRetrievedAt: s.retrievedAt, sourceLicense: LACTMED_LICENSE }));
      await begin();
      const nlm = await ensureCodeSystem(client, codeSystemPlan('nlm-lactmed', lactmedPlanRows), CONCEPT.TERM_ACTIVE);
      const loadedLactmed = await bulkLoadRelationships(client, {
        terminologySourceId: nlm.sourceId,
        codeSystemVersionId: nlm.versionId,
        rows: loadableLactmed,
        dryRun,
        log: console.log,
      });
      console.log('[lactmed safety]', JSON.stringify(loadedLactmed));
    }
    console.log('[cima safety] interacciones NO cargadas (BLOCKED: sin value set de severidad con UNSPECIFIED); ver out/cima-interactions.csv');
  } finally {
    await client.end();
  }
}

(args.includes('--safety') ? safety() : main()).catch((err) => {
  console.error('ERROR FATAL en import-cima:', err);
  process.exitCode = 1;
});
