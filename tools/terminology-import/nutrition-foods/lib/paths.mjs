// Rutas de trabajo de nutrición y alimentos. Todo lo pesado queda FUERA de git, bajo la misma carpeta
// de build que el resto de los importadores (`GLOSSARY_BUILD_DIR`, por defecto `../glossary-data-build`).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILD_DIR } from '../../lib/glossary-es/common.mjs';

/** Archivos fuente tal cual se bajaron (un subdirectorio por fuente). */
export const SOURCES_DIR = join(BUILD_DIR, 'nutrition-foods-sources');
export const MANIFEST_PATH = join(SOURCES_DIR, 'manifest.json');
/** Corpus normalizado: `<capa>.ndjson` + `<capa>.meta.json`. */
export const NDJSON_DIR = join(BUILD_DIR, 'nutrition-foods', 'ndjson');
export const REPORT_PATH = join(BUILD_DIR, 'nutrition-foods', 'coverage.json');
/** Corpus normalizado versionado en git (gzip determinista). */
export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
