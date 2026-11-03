// Rutas y fuentes fijas del importador de enfermería (todo fuera de git).
import { join } from 'node:path';
import { BUILD_DIR } from '../../lib/glossary-es/common.mjs';

export const NURSING_CACHE = join(BUILD_DIR, 'cache', 'nursing-care');
export const NURSING_OUT = join(BUILD_DIR, 'nursing-care');
export const CKM_REPO_URL = 'https://github.com/openEHR/CKM-mirror';
export const THO_PACKAGE = { name: 'hl7.terminology', version: '7.0.1' };
export const SOURCES_META = join(NURSING_CACHE, 'sources.meta.json');
