// =============================================================================
// Rutas del corte S3 (fármacos). Todo lo que se escribe cae en la carpeta de
// evidencia del corte, FUERA de git; el repositorio solo guarda código y
// fixtures. Se puede redefinir con `S3_EVIDENCE_DIR`.
// =============================================================================

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Raíz del repo de la API (…/tools/terminology-import/encyclopedia/s3-farmacos/lib → ../../../../..). */
export const API_ROOT = resolve(HERE, '../../../../..');

/** Raíz del workspace `Mantra Core Health/` (hermana de los repos y de los worktrees `wt-*`). */
export const WORKSPACE_ROOT = process.env.S3_WORKSPACE_ROOT ?? resolve(API_ROOT, '..');

export const EVIDENCE_DIR =
  process.env.S3_EVIDENCE_DIR ?? join(WORKSPACE_ROOT, 'docs/progress/evidence/lane-41/F9/s3-farmacos');

export const CACHE_DIR = join(EVIDENCE_DIR, 'cache');
export const OUT_DIR = join(EVIDENCE_DIR, 'out');

/** Corpus ya descargado por `import-cima.mjs` (solo lectura). */
export const GLOSSARY_NDJSON_DIR =
  process.env.GLOSSARY_NDJSON_DIR ?? join(WORKSPACE_ROOT, 'glossary-data-build-catalogos/ndjson');

/** Caché de secciones del importador anterior (solo lectura; se consulta únicamente por la lista blanca). */
export const LEGACY_CIMA_CACHE = process.env.LEGACY_CIMA_CACHE ?? join(WORKSPACE_ROOT, 'glossary-data-build/cache/cima');

/** Semilla del glosario del front (solo lectura). */
export const SEED_PHARMACOLOGY_DIR =
  process.env.SEED_PHARMACOLOGY_DIR ??
  join(WORKSPACE_ROOT, 'mantra-core-health/public/glossary-seed/shards/pharmacology');
