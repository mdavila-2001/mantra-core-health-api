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
