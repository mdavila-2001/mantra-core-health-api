import { join, resolve } from 'node:path';
import { API_ROOT, BUILD_DIR } from '../../../lib/glossary-es/common.mjs';

/** `--flag` y `--clave valor` → objeto. Sin dependencias. */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

/** Caché fuera de git, con la misma convención que el resto de importadores (`GLOSSARY_BUILD_DIR`). */
export const defaultCacheDir = () => process.env.S2_CACHE_DIR ?? join(BUILD_DIR, 'cache', 'encyclopedia-s2-cie10');
export const defaultOutDir = () => process.env.S2_OUT_DIR ?? join(BUILD_DIR, 'encyclopedia', 's2-cie10');
export const defaultSeedDir = () => resolve(API_ROOT, '..', 'mantra-core-health', 'public', 'glossary-seed', 'shards');
