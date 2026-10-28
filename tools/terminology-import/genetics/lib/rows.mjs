// =============================================================================
// Forma común de las filas del corpus de genética y procedencia por fila.
//
// Fila (una por concepto):
//   codeSystem   internal_code del code system (ver CODE_SYSTEMS en load-plan.mjs)
//   code         código TAL CUAL lo publica la fuente (o, donde la fuente no
//                publica código, `<lista>:<valor>` armado con los textos verbatim)
//   display      nombre a mostrar (verbatim de la fuente)
//   designations [{ value, lang, type: 'preferred'|'synonym' }]
//   definition   null | { text, lang }   (verbatim; va a la propiedad source_definition)
//   properties   [[code, dataType('string'|'json'), value]]  específicas del sistema
//   parents      códigos del MISMO sistema (relación is-a que declara la fuente)
//   maps         [{ system, code, context }]  equivalencias/xrefs que la fuente
//                publica hacia otro sistema; se resuelven al cargar y sólo si el
//                destino existe en la base
//   source, sourceRecordId, sourceUrl, version, retrievedAt, sourceSha256, license
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOURCES_DIR, sourceByKey } from './sources.mjs';

let manifestCache = null;
function manifest() {
  if (manifestCache) return manifestCache;
  const p = join(SOURCES_DIR, 'manifest.json');
  manifestCache = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { files: [] };
  return manifestCache;
}
export function resetManifestCache() {
  manifestCache = null;
}

/**
 * Procedencia de una capa a partir de las fuentes (`keys`) que la alimentan.
 * `versionKey` = la fuente cuya versión nombra la capa (la primera por defecto).
 */
export function provenance(keys, { versionKey = keys[0] } = {}) {
  const files = keys.map((k) => {
    const m = manifest().files.find((f) => f.key === k);
    if (!m) throw new Error(`Falta ${k} en manifest.json: corré fetch-genetics-sources.mjs`);
    return m;
  });
  const main = files.find((f) => f.key === versionKey);
  const license = sourceByKey(versionKey).license;
  return {
    version: main.declaredVersion,
    retrievedAt: files.map((f) => f.retrievedAt).sort()[0],
    sourceSha256: files.map((f) => `${f.file.split('/').pop()}=${f.sha256}`).join(' '),
    license,
    sourceUrl: files.map((f) => f.url).join(' '),
  };
}

/** Une los campos de procedencia a una fila ya armada. */
export function withProvenance(row, prov, { source, sourceRecordId = row.code, sourceUrl = prov.sourceUrl } = {}) {
  return { ...row, source, sourceRecordId, sourceUrl, version: prov.version, retrievedAt: prov.retrievedAt, sourceSha256: prov.sourceSha256, license: prov.license };
}

/** Valores únicos, en orden de aparición. */
export const uniq = (xs) => [...new Set(xs)];

/** `a|b|c` → ['a','b','c'] (vacío → []). */
export const pipeList = (v) => (v == null || v === '' ? [] : v.split('|').filter((x) => x !== ''));

/** Designación preferida + sinónimos sin repetir el mismo texto exacto. */
export function designationList(preferred, synonyms = [], lang = 'en') {
  const out = [];
  const seen = new Set();
  const add = (value, type) => {
    if (value == null || value === '' || seen.has(`${lang}\u0000${value}`)) return;
    seen.add(`${lang}\u0000${value}`);
    out.push({ value, lang, type });
  };
  add(preferred, 'preferred');
  for (const s of synonyms) add(s, 'synonym');
  return out;
}

export const prop = (code, dataType, value) => [code, dataType, value];

/** Propiedades no vacías: descarta null/''/[]/{} para no sembrar filas sin contenido. */
export function cleanProps(list) {
  return list.filter(([, , v]) => !(v == null || v === '' || (Array.isArray(v) && v.length === 0)));
}
