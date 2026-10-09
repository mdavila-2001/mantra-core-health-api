// =============================================================================
// Acceso a la API de Wikidata con la cortesía que pide la ficha §12.6:
// User-Agent identificable, 1 petición por segundo, reintento con retroceso
// (lo da `HttpClient`) y caché en disco por lote → la corrida es reanudable e
// idempotente: el mismo conjunto de ids produce los mismos archivos de caché.
// =============================================================================

import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { HttpClient } from '../../../lib/glossary-es/common.mjs';
import { CACHE_DIR, MIN_DELAY_MS, USER_AGENT } from './config.mjs';

export const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
export const BATCH_SIZE = 50;

export function makeHttp() {
  return new HttpClient({ concurrency: 1, minDelayMs: MIN_DELAY_MS, headers: { 'User-Agent': USER_AGENT } });
}

/** Parte `items` (ya ordenados) en lotes de `size`. */
export function chunk(items, size = BATCH_SIZE) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function batchKey(ids) {
  return createHash('sha1').update(ids.join('|')).digest('hex').slice(0, 16);
}

/** URL de `wbgetentities` para un lote. */
export function entitiesUrl(ids, { props, languages = ['es', 'en'] }) {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    format: 'json',
    ids: ids.join('|'),
    props: props.join('|'),
    languages: languages.join('|'),
  });
  return `${WIKIDATA_API}?${params}`;
}

/**
 * Pide las entidades de Wikidata en lotes de 50 y devuelve un `Map id → entidad`.
 * `tag` separa las cachés por tipo de consulta (claims completos vs. solo etiquetas).
 */
export async function fetchEntities(http, ids, { props, tag, languages = ['es', 'en'], onProgress } = {}) {
  const unique = [...new Set(ids)].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)) || a.localeCompare(b));
  const entities = new Map();
  const batches = chunk(unique);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const json = await http.getJsonCached(entitiesUrl(batch, { props, languages }), join(CACHE_DIR, 'wikidata', tag, `${batchKey(batch)}.json`));
    if (json?.error) throw new Error(`Wikidata devolvió error en el lote ${i}: ${JSON.stringify(json.error)}`);
    for (const [id, entity] of Object.entries(json?.entities ?? {})) if (!entity.missing) entities.set(id, entity);
    onProgress?.(i + 1, batches.length);
  }
  return entities;
}

/** Valores `wikibase-item` (Q-ids) de una propiedad, en el orden de la fuente, sin duplicados y sin rangos deprecados. */
export function itemValues(entity, property) {
  const statements = entity?.claims?.[property] ?? [];
  const out = [];
  for (const st of statements) {
    if (st.rank === 'deprecated') continue;
    const dv = st.mainsnak?.datavalue;
    if (st.mainsnak?.snaktype !== 'value' || dv?.type !== 'wikibase-entityid') continue;
    const id = dv.value?.id;
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/** Valores de cadena (external-id, string) de una propiedad. */
export function stringValues(entity, property) {
  const statements = entity?.claims?.[property] ?? [];
  const out = [];
  for (const st of statements) {
    if (st.rank === 'deprecated') continue;
    const dv = st.mainsnak?.datavalue;
    if (st.mainsnak?.snaktype !== 'value' || dv?.type !== 'string') continue;
    if (dv.value && !out.includes(dv.value)) out.push(dv.value);
  }
  return out;
}

/** Etiqueta en `lang` o `null`. */
export function labelIn(entity, lang) {
  return entity?.labels?.[lang]?.value ?? null;
}

export function descriptionIn(entity, lang) {
  return entity?.descriptions?.[lang]?.value ?? null;
}
