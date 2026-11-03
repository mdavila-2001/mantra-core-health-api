import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** `tools/terminology-import/diagnostic-devices/us`. */
export const US_DIR = resolve(HERE, '..');
export const API_ROOT = resolve(US_DIR, '../../../..');

/** NDJSON normalizado y reportes (se versionan, en `.gz` < 50 MB por parte). */
export const OUT_DIR = join(US_DIR, 'out');

/**
 * Crudos FUERA de git (pesan GB). Por convención, hermano del repo, como
 * `glossary-data-build`; se redefine con `DX_DEVICES_US_RAW_DIR`.
 */
export const RAW_DIR = process.env.DX_DEVICES_US_RAW_DIR ?? resolve(API_ROOT, '..', 'dx-devices-data', 'us');
export const OFFICIAL_DIR = join(RAW_DIR, 'official');
export const MIRRORS_DIR = join(RAW_DIR, 'mirrors');
