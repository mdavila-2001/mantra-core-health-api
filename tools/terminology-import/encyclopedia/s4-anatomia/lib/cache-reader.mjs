// =============================================================================
// Lectura OFFLINE de la caché de red. El armado de artículos (`build-articles`)
// no hace ninguna petición: lee lo que las etapas `fetch-*` dejaron en disco.
// Esto lo hace determinista y repetible: mismos archivos de caché → mismo NDJSON.
// =============================================================================

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CACHE_DIR } from './config.mjs';
import { parseCommonsResponse } from './commons.mjs';
import { loadHpo } from './hpo.mjs';
import { parseMeshBindings } from './mesh.mjs';

function jsonFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => join(dir, f));
}

/** Entidades de Wikidata de una pasada (`main`, `referenced`, `properties`) → `Map id → entidad`. */
export function readEntityCache(tag, cacheDir = CACHE_DIR) {
  const entities = new Map();
  for (const file of jsonFiles(join(cacheDir, 'wikidata', tag))) {
    const json = JSON.parse(readFileSync(file, 'utf8'));
    for (const [id, entity] of Object.entries(json?.entities ?? {})) if (!entity.missing) entities.set(id, entity);
  }
  return entities;
}

/** Etiquetas `{ es, en }` por id a partir de varias pasadas. */
export function labelMapOf(...entityMaps) {
  const labels = new Map();
  for (const map of entityMaps) {
    for (const [id, entity] of map) labels.set(id, { es: entity.labels?.es?.value ?? null, en: entity.labels?.en?.value ?? null });
  }
  return labels;
}

export function readMeshCache(cacheDir = CACHE_DIR) {
  const out = new Map();
  for (const file of jsonFiles(join(cacheDir, 'mesh'))) {
    for (const [id, entry] of parseMeshBindings(JSON.parse(readFileSync(file, 'utf8')))) out.set(id, entry);
  }
  return out;
}

export function readCommonsCache(cacheDir = CACHE_DIR) {
  const out = new Map();
  for (const file of jsonFiles(join(cacheDir, 'commons'))) {
    for (const [name, info] of parseCommonsResponse(JSON.parse(readFileSync(file, 'utf8')))) out.set(name, info);
  }
  return out;
}

export function readHpoCache(cacheDir = CACHE_DIR) {
  const hpJsonPath = join(cacheDir, 'hpo', 'hp.json');
  if (!existsSync(hpJsonPath)) return null;
  return loadHpo({ hpJsonPath });
}
