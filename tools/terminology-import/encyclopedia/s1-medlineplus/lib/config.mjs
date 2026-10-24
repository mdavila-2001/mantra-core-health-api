// =============================================================================
// Rutas por defecto de la canalización S1 (F9 · TAREA-41 §12). Todo se puede
// redefinir por variable de entorno o por argumento de línea de comandos.
//
// Los insumos viven FUERA de git, en la raíz del workspace (hermana de los
// repos): el corpus descargado por `import-medlineplus-es.mjs`, la semilla
// del glosario del front y la caché de páginas que baja este corte.
// =============================================================================

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Raíz del repo de la API (…/tools/terminology-import/encyclopedia/s1-medlineplus/lib → 5 niveles). */
export const API_ROOT = resolve(HERE, '../../../../..');
/** Raíz del workspace `Mantra Core Health/` (hermana de los repos). */
export const WORKSPACE_ROOT = process.env.S1_WORKSPACE_ROOT ?? resolve(API_ROOT, '..');

export const DEFAULTS = Object.freeze({
  corpusDir: process.env.S1_CORPUS_DIR ?? join(WORKSPACE_ROOT, 'glossary-data-build-catalogos', 'ndjson'),
  /** Caché de páginas HTML de medlineplus.gov y de respuestas de Commons (solo lo que este corte baja). */
  cacheDir: process.env.S1_CACHE_DIR ?? join(WORKSPACE_ROOT, 'glossary-data-build-catalogos', 'cache', 'encyclopedia-s1'),
  /** XML de temas descargado por este corte (`fetch-xml.mjs`), con su sidecar .meta.json. */
  xmlDir: process.env.S1_XML_DIR ?? join(WORKSPACE_ROOT, 'glossary-data-build-catalogos', 'cache', 'encyclopedia-s1', 'xml'),
  /** Caché de las guías de pruebas que ya bajó `import-medlineplus-es.mjs`. */
  labCacheDir: process.env.S1_LAB_CACHE_DIR ?? join(WORKSPACE_ROOT, 'glossary-data-build-catalogos', 'cache', 'medlineplus', 'pruebas'),
  seedShardsDir: process.env.S1_SEED_SHARDS_DIR ?? join(WORKSPACE_ROOT, 'mantra-core-health', 'public', 'glossary-seed', 'shards'),
  imagesNdjson: process.env.S1_IMAGES_NDJSON ?? join(WORKSPACE_ROOT, 'glossary-data-build-catalogos', 'ndjson', 'wikidata-images.ndjson'),
  outDir: process.env.S1_OUT_DIR ?? join(WORKSPACE_ROOT, 'docs', 'progress', 'evidence', 'lane-41', 'F9', 's1-medlineplus', 'output'),
});

/** Identidad HTTP de este corte (política de buena ciudadanía de NLM y Wikimedia). */
export const S1_USER_AGENT =
  process.env.GLOSSARY_USER_AGENT ??
  'AloVida-GlossaryImporter/1.0 (Mantra Core Health; F9-S1 enciclopedia; contacto: equipo AloVida)';
