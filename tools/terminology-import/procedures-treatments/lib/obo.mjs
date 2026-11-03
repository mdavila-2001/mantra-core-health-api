// =============================================================================
// Lector OBO 1.2 en streaming (los archivos de NCIt pesan ~280 MB). Devuelve
// una stanza por término con sus etiquetas crudas; no interpreta semántica.
// =============================================================================

import { readLines } from './common.mjs';

/** Quita el comentario final ` ! etiqueta` de un valor OBO. */
function stripComment(value) {
  const i = value.indexOf(' ! ');
  return i >= 0 ? value.slice(0, i) : value;
}

/** `NCIT:C1 {source="A", source="B"}` → `{ value: 'NCIT:C1', qualifiers: [['source','A'],['source','B']] }`. */
export function splitQualifiers(raw) {
  const value = stripComment(raw).trim();
  const m = value.match(/^(.*?)\s*\{(.*)\}\s*$/);
  if (!m) return { value, qualifiers: [] };
  const qualifiers = [...m[2].matchAll(/([\w:.-]+)="((?:[^"\\]|\\.)*)"/g)].map(
    (q) => [q[1], q[2]],
  );
  return { value: m[1].trim(), qualifiers };
}

/** Une las líneas de una stanza en `{ type, id, tags: { tag: [valores crudos] } }`. */
function toStanza(type, lines) {
  const tags = {};
  for (const line of lines) {
    const i = line.indexOf(': ');
    if (i < 0) continue;
    const tag = line.slice(0, i);
    (tags[tag] ??= []).push(line.slice(i + 2));
  }
  return { type, id: tags.id?.[0] ?? null, tags };
}

/** Itera stanzas a partir de un iterable (async o sync) de líneas. La cabecera sale como `type: 'header'`. */
export async function* oboStanzas(lines) {
  let type = 'header';
  let buf = [];
  for await (const line of lines) {
    const m = line.match(/^\[(\w+)\]\s*$/);
    if (m) {
      yield toStanza(type, buf);
      type = m[1];
      buf = [];
    } else if (line.trim() !== '') {
      buf.push(line);
    }
  }
  yield toStanza(type, buf);
}

/** Primer valor de una etiqueta, sin comentario ni calificadores. */
export function tagValue(stanza, tag) {
  const raw = stanza.tags[tag]?.[0];
  return raw == null ? null : splitQualifiers(raw).value;
}

/** Valor de `name:` o `def:` (el def viene entre comillas). */
export function oboName(stanza) {
  return stanza.tags.name?.[0] ?? null;
}

/** `relationship: REL TARGET ! etiqueta` → `[{ rel, target }]`. */
export function relationships(stanza, tag = 'relationship') {
  return (stanza.tags[tag] ?? []).map((raw) => {
    const [rel, target] = splitQualifiers(raw).value.split(/\s+/);
    return { rel, target };
  });
}

/** Cabecera: `data-version` y `owl:versionInfo`, tal cual. */
export function headerVersion(header) {
  const dataVersion = header.tags['data-version']?.[0] ?? null;
  const info = (header.tags.property_value ?? [])
    .map((v) => v.match(/^owl:versionInfo "([^"]+)"/))
    .find(Boolean);
  return { dataVersion, versionInfo: info ? info[1] : null };
}
