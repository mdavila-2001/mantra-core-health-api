// =============================================================================
// Lector de OBO 1.2 en streaming (MONDO, DOID, NCIt OBO Edition).
//
// No interpreta nada clínico: devuelve cada `[Term]` con sus etiquetas tal como
// las escribe la fuente (nombre, definición con sus referencias, sinónimos con
// alcance y tipo, xrefs con sus anotaciones `source=`, is_a con las suyas,
// property_value, obsolescencia y reemplazos). Las reglas de qué es una
// enfermedad viven en `build-records.mjs`, una por fuente.
// =============================================================================

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

/** Lee una cadena OBO entre comillas desde `pos` (que apunta a la comilla de apertura). */
export function readQuoted(line, pos) {
  let out = '';
  let i = pos + 1;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '\\' && i + 1 < line.length) {
      const nx = line[i + 1];
      out += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx;
      i += 2;
      continue;
    }
    if (ch === '"') return { text: out, end: i + 1 };
    out += ch;
    i += 1;
  }
  return { text: out, end: i };
}

/** `{source="A", source="B"}` → ['A', 'B'] (sólo las anotaciones `source`). */
export function trailingSources(rest) {
  const m = /\{(.*)\}\s*$/.exec(rest);
  if (!m) return [];
  return [...m[1].matchAll(/source="([^"]*)"/g)].map((x) => x[1]);
}

/** `[A, B]` → ['A', 'B']. */
function bracketList(rest) {
  const m = /\[([^\]]*)\]/.exec(rest);
  if (!m || m[1].trim() === '') return [];
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Quita el comentario final ` ! nombre` y las anotaciones `{...}` de un valor simple. */
function bareValue(value) {
  return value
    .replace(/\s*\{[^}]*\}\s*$/, '')
    .replace(/\s+!\s.*$/, '')
    .trim();
}

export function parseTag(term, tag, value) {
  switch (tag) {
    case 'id':
      term.id = value.trim();
      break;
    case 'name':
      term.name = value.trim();
      break;
    case 'def': {
      const q = readQuoted(value, value.indexOf('"'));
      term.def = q.text;
      term.defRefs = bracketList(value.slice(q.end));
      break;
    }
    case 'comment':
      term.comment = value.trim();
      break;
    case 'synonym': {
      const q = readQuoted(value, value.indexOf('"'));
      const rest = value.slice(q.end).trim();
      const head = rest.split('[')[0].trim().split(/\s+/).filter(Boolean);
      term.synonyms.push({ text: q.text, scope: head[0] ?? 'RELATED', type: head[1] ?? null, refs: bracketList(rest) });
      break;
    }
    case 'xref': {
      const id = value.split(/[\s{]/)[0].trim();
      term.xrefs.push({ id, sources: trailingSources(value) });
      break;
    }
    case 'is_a':
      term.isA.push({ id: bareValue(value).split(/\s+/)[0], sources: trailingSources(value.replace(/\s+!\s.*$/, '')) });
      break;
    case 'subset':
      term.subsets.push(bareValue(value));
      break;
    case 'alt_id':
      term.altIds.push(bareValue(value));
      break;
    case 'is_obsolete':
      term.obsolete = value.trim() === 'true';
      break;
    case 'replaced_by':
      term.replacedBy.push(bareValue(value));
      break;
    case 'consider':
      term.consider.push(bareValue(value));
      break;
    case 'relationship': {
      const [rel, target] = bareValue(value).split(/\s+/);
      term.relationships.push({ rel, target });
      break;
    }
    case 'property_value': {
      const v = value.trim();
      const sp = v.indexOf(' ');
      const prop = v.slice(0, sp);
      const rest = v.slice(sp + 1);
      if (rest.startsWith('"')) {
        const q = readQuoted(rest, 0);
        term.propertyValues.push({ prop, value: q.text, literal: true });
      } else {
        term.propertyValues.push({ prop, value: rest.split(/\s+/)[0], literal: false });
      }
      break;
    }
    default:
      break;
  }
}

function emptyTerm() {
  return {
    id: null,
    name: null,
    def: null,
    defRefs: [],
    comment: null,
    synonyms: [],
    xrefs: [],
    isA: [],
    subsets: [],
    altIds: [],
    obsolete: false,
    replacedBy: [],
    consider: [],
    relationships: [],
    propertyValues: [],
  };
}

/**
 * Recorre un .obo y llama `onTerm(term)` por cada `[Term]`. Devuelve la cabecera
 * (`data-version`, `remark`, …) como mapa etiqueta → lista de valores.
 */
export async function readObo(path, onTerm) {
  const header = {};
  let inHeader = true;
  let current = null;
  const flush = () => {
    if (current && current.id) onTerm(current);
    current = null;
  };
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.startsWith('[')) {
      flush();
      inHeader = false;
      current = line.startsWith('[Term]') ? emptyTerm() : null;
      continue;
    }
    const idx = line.indexOf(': ');
    if (idx < 0) continue;
    const tag = line.slice(0, idx);
    const value = line.slice(idx + 2);
    if (inHeader) {
      (header[tag] ??= []).push(value);
      continue;
    }
    if (current) parseTag(current, tag, value);
  }
  flush();
  return header;
}
