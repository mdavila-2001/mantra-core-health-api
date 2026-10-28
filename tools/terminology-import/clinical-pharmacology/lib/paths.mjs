// =============================================================================
// Rutas de la farmacología clínica. Todo lo descargado y lo generado vive FUERA
// de git, en `glossary-data-build/` (la misma carpeta hermana que usan los demás
// importadores; se redefine con `GLOSSARY_BUILD_DIR`).
//
//   cache/cima/                     listado y detalle de CIMA (compartido con
//                                   `import-cima.mjs`: no se baja dos veces)
//   clinical-pharmacology/cache/    fichas completas, notas de seguridad,
//                                   maestra ATC, RxNav, particiones de openFDA
//   clinical-pharmacology/out/      monografías NDJSON, informe de cobertura,
//                                   plan de carga en seco
//   clinical-pharmacology/out/product/  el corpus por PRODUCTO (`--granularity product`,
//                                   ~2,2 GB). Aparte, a propósito: ni `pack-data.mjs` ni
//                                   el cargador lo leen; nunca entra en `data/` (decisión
//                                   del propietario, 2026-10-26, issue 824).
// =============================================================================

import { join } from 'node:path';

import { BUILD_DIR, ensureDir } from '../../lib/glossary-es/common.mjs';

export const CP_DIR = process.env.CLINICAL_PHARMACOLOGY_DIR ?? join(BUILD_DIR, 'clinical-pharmacology');

/** Caché compartida con `import-cima.mjs` (listado paginado y detalle por nº de registro). */
export const CIMA_SHARED_CACHE = join(BUILD_DIR, 'cache', 'cima');

export const cpCache = (...parts) => join(CP_DIR, 'cache', ...parts);
export const cpOut = (...parts) => join(ensureDir(join(CP_DIR, 'out')), ...parts);

export const MONOGRAPHS_NDJSON = () => cpOut('monographs.ndjson');
export const MONOGRAPHS_META = () => cpOut('monographs.meta.json');
/** Corpus por producto: carpeta propia dentro de `out/`, fuera de lo que se empaqueta y de lo que se carga. */
export const cpOutProduct = (...parts) => join(ensureDir(join(CP_DIR, 'out', 'product')), ...parts);
export const MONOGRAPHS_PRODUCT_NDJSON = () => cpOutProduct('monographs.product.ndjson');
export const MONOGRAPHS_PRODUCT_META = () => cpOutProduct('monographs.product.meta.json');

/** Granularidades que `build-monographs.mjs` acepta. `route` (por principio activo y vías) es la única que se versiona y se carga. */
export const GRANULARITIES = Object.freeze(['route', 'product']);
/** Salida del armado según la granularidad: `route` → `out/`, `product` → `out/product/`. */
export function monographsOutputs(granularity) {
  if (!GRANULARITIES.includes(granularity)) throw new Error(`Granularidad desconocida «${granularity}»; válidas: ${GRANULARITIES.join(', ')}`);
  return granularity === 'product' ? { ndjson: MONOGRAPHS_PRODUCT_NDJSON(), meta: MONOGRAPHS_PRODUCT_META() } : { ndjson: MONOGRAPHS_NDJSON(), meta: MONOGRAPHS_META() };
}
export const COVERAGE_JSON = () => cpOut('coverage.json');
export const DRY_RUN_PLAN = () => cpOut('load-plan.dry-run.json');

// CIMA (propias de esta importación)
export const ftPath = (nreg) => cpCache('cima', 'ft', `${nreg}.json`);
export const ftSectionPath = (nreg, s) => cpCache('cima', 'ft-sections', String(nreg), `${s}.json`);
export const notesPath = (nreg) => cpCache('cima', 'notas', `${nreg}.json`);
export const atcMasterPath = (page) => cpCache('cima', 'maestra-atc', `page-${page}.json`);

// RxNav y openFDA
export const rxnavPath = (atc, kind, id = '') => cpCache('rxnav', atc, `${kind}${id ? `-${id}` : ''}.json`);
export const openFdaDir = () => cpCache('openfda');
export const splIdentityPath = (setid) => cpCache('dailymed', 'spl-id', `${setid}.json`);

// OMS eEML
export const emlRecommendationPath = (id) => cpCache('eml', 'recommendations', `${id}.json`);
