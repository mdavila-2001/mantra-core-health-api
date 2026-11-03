// =============================================================================
// Parser del formato OBO 1.2/1.4 (https://owlcollab.github.io/oboformat/doc/obo-syntax.html),
// el que publican Uberon, CL, GO, SO, PATO, EHDAA2, Mondo, DOID y el resto de
// OBO Foundry. Puro (sin red ni disco) para poder probarlo con recortes reales.
//
// Sólo lee lo que el archivo declara: no razona sobre axiomas OWL ni completa
// relaciones implícitas. Lo que no reconoce lo guarda tal cual en `other`.
// =============================================================================

/** Quita el comentario final ` ! …` que no esté dentro de comillas. */
function stripComment(value) {
  let inQuote = false;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '\\') { i++; continue; }
    if (c === '"') inQuote = !inQuote;
    if (!inQuote && c === '!' && (i === 0 || value[i - 1] === ' ')) return value.slice(0, i).trimEnd();
  }
  return value;
}

/** Separa los calificadores finales `{source="x", …}` (fuera de comillas). */
function splitQualifiers(value) {
  let inQuote = false;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '\\') { i++; continue; }
    if (c === '"') inQuote = !inQuote;
    if (!inQuote && c === '{' && value.trimEnd().endsWith('}')) {
      return { body: value.slice(0, i).trimEnd(), qualifiers: parseQualifiers(value.slice(i + 1, value.lastIndexOf('}'))) };
    }
  }
  return { body: value, qualifiers: {} };
}

function parseQualifiers(text) {
  const out = {};
  const re = /([\w:.-]+)\s*=\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(text))) {
    const v = unescape(m[2]);
    out[m[1]] = out[m[1]] === undefined ? v : [].concat(out[m[1]], v);
  }
  return out;
}

function unescape(s) {
  return s.replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c === 't' ? '\t' : c));
}

/** `"texto" resto` → { text, rest } (o null si no empieza con comillas). */
function readQuoted(value) {
  if (!value.startsWith('"')) return null;
  for (let i = 1; i < value.length; i++) {
    if (value[i] === '\\') { i++; continue; }
    if (value[i] === '"') return { text: unescape(value.slice(1, i)), rest: value.slice(i + 1).trim() };
  }
  return null;
}

/** `[A:1, B:2 "x"]` → ['A:1', 'B:2']. Respeta comas escapadas y comillas. */
function readXrefList(text) {
  const m = text.match(/\[(.*)\]\s*$/s);
  if (!m || m[1].trim() === '') return [];
  const out = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < m[1].length; i++) {
    const c = m[1][i];
    if (c === '\\') { cur += m[1][i + 1] ?? ''; i++; continue; }
    if (c === '"') inQuote = !inQuote;
    if (c === ',' && !inQuote) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim().replace(/\s+".*"$/, '')).filter(Boolean);
}

const SCOPES = new Set(['EXACT', 'NARROW', 'BROAD', 'RELATED']);

function parseSynonym(value) {
  const q = readQuoted(value);
  if (!q) return null;
  const parts = q.rest.replace(/\[.*\]\s*$/s, '').trim().split(/\s+/).filter(Boolean);
  let scope = 'RELATED'; // OBO 1.2: «synonym» sin alcance = RELATED
  let type = null;
  if (parts[0] && SCOPES.has(parts[0])) {
    scope = parts[0];
    type = parts[1] ?? null;
  }
  return { value: q.text, scope, type, xrefs: readXrefList(q.rest) };
}

function parseXref(value) {
  const m = value.match(/^(\S+)(?:\s+"((?:[^"\\]|\\.)*)")?/);
  return m ? { id: unescape(m[1]), description: m[2] ? unescape(m[2]) : null } : null;
}

/**
 * Archivo OBO → { header, terms[], typedefs[] }.
 * Cada término: { id, name, def, defXrefs, namespace, synonyms[], xrefs[], isA[],
 * relationships[], intersectionOf[], subsets[], altIds[], propertyValues[],
 * obsolete, replacedBy[], consider[], comment, other{} }.
 */
export function parseObo(text) {
  const header = {};
  const terms = [];
  const typedefs = [];
  let cur = null;
  let kind = 'header';
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '' || line.startsWith('!')) continue;
    const stanza = line.match(/^\[(\w+)\]$/);
    if (stanza) {
      kind = stanza[1];
      cur = newEntry();
      if (kind === 'Term') terms.push(cur);
      else if (kind === 'Typedef') typedefs.push(cur);
      else cur = null; // [Instance] u otros: se ignoran
      continue;
    }
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const tag = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (kind === 'header') {
      (header[tag] ??= []).push(value);
      continue;
    }
    if (!cur) continue;
    applyTag(cur, tag, value);
  }
  return { header, terms, typedefs };
}

function newEntry() {
  return {
    id: null, name: null, def: null, defXrefs: [], namespace: null, synonyms: [], xrefs: [], isA: [],
    relationships: [], intersectionOf: [], subsets: [], altIds: [], propertyValues: [], obsolete: false,
    replacedBy: [], consider: [], comment: null, other: {},
  };
}

function applyTag(e, tag, rawValue) {
  const keepQuotes = tag === 'def' || tag === 'synonym' || tag === 'property_value' || tag === 'comment' || tag === 'name';
  const noComment = keepQuotes ? rawValue : stripComment(rawValue);
  const { body, qualifiers } = splitQualifiers(tag === 'name' || tag === 'comment' ? rawValue : noComment);
  switch (tag) {
    case 'id': e.id = body; break;
    case 'name': e.name = rawValue; break;
    case 'namespace': e.namespace = body; break;
    case 'def': {
      const q = readQuoted(body);
      if (q) { e.def = q.text; e.defXrefs = readXrefList(q.rest); }
      break;
    }
    case 'comment': e.comment = rawValue; break;
    case 'synonym': {
      const s = parseSynonym(body);
      if (s) e.synonyms.push(s);
      break;
    }
    case 'xref': {
      const x = parseXref(body);
      if (x) e.xrefs.push({ ...x, qualifiers });
      break;
    }
    case 'is_a': e.isA.push({ target: body.split(/\s+/)[0], qualifiers }); break;
    case 'relationship': {
      const [predicate, target] = body.split(/\s+/);
      if (predicate && target) e.relationships.push({ predicate, target, qualifiers });
      break;
    }
    case 'intersection_of': e.intersectionOf.push(body.split(/\s+/)); break;
    case 'subset': e.subsets.push(body); break;
    case 'alt_id': e.altIds.push(body); break;
    case 'is_obsolete': e.obsolete = body === 'true'; break;
    case 'replaced_by': e.replacedBy.push(body); break;
    case 'consider': e.consider.push(body); break;
    case 'property_value': {
      const m = body.match(/^(\S+)\s+(?:"((?:[^"\\]|\\.)*)"|(\S+))(?:\s+(\S+))?/);
      if (m) e.propertyValues.push({ property: m[1], value: m[2] !== undefined ? unescape(m[2]) : m[3], datatype: m[4] ?? null });
      break;
    }
    default:
      (e.other[tag] ??= []).push(body);
  }
}

/**
 * Typedefs → mapa predicado → { id, name, canonical }. `canonical` es el id
 * RO/BFO del xref si el typedef usa un nombre corto (`part_of` con
 * `xref: BFO:0000050`); si no, el propio id.
 */
export function typedefIndex(typedefs) {
  const out = new Map();
  for (const t of typedefs) {
    if (!t.id) continue;
    const roXref = t.xrefs.map((x) => x.id).find((x) => /^(RO|BFO):\d+$/.test(x));
    out.set(t.id, { id: t.id, name: t.name, canonical: /^(RO|BFO|IDO):\d+$/.test(t.id) ? t.id : roXref ?? t.id });
  }
  return out;
}

/** Valor único de una cabecera (`data-version`, `ontology`, `date`). */
export function headerValue(header, tag) {
  return header?.[tag]?.[0] ?? null;
}
