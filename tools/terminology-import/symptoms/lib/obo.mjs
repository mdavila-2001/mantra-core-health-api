// =============================================================================
// Lector de OBO 1.2/1.4 (SYMP, MONDO, NCIt edición OBO). Puro y en streaming
// por líneas: NCIt pesa ~280 MB y no se carga entero en memoria como texto.
//
// Sólo se leen los campos que usa el corpus; el resto se ignora. Nada se
// interpreta: un `def:` se guarda tal cual (sin comillas de OBO, con sus
// referencias), un sinónimo con su alcance (EXACT/RELATED/BROAD/NARROW).
// =============================================================================

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

/** Quita el escape de OBO (`\"`, `\\`, `\n`) de un valor entre comillas. */
export function unescapeObo(s) {
  return s.replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c));
}

/** `"texto" SCOPE [refs]` → { text, rest }. */
export function parseQuoted(value) {
  const m = value.match(/^"((?:[^"\\]|\\.)*)"\s*(.*)$/);
  if (!m) return null;
  return { text: unescapeObo(m[1]), rest: m[2] };
}

function refsOf(rest) {
  const m = rest.match(/\[([^\]]*)\]/);
  if (!m || !m[1].trim()) return [];
  return m[1].split(/,\s*/).map((x) => x.trim()).filter(Boolean);
}

function emptyTerm(id) {
  return { id, name: null, def: null, defRefs: [], comment: null, synonyms: [], xrefs: [], isA: [], altIds: [], subsets: [], relationships: [], obsolete: false, replacedBy: [], consider: [], propertyValues: [] };
}

/** Aplica una línea `tag: value` a un término. Exportada para probarla sola. */
export function applyTag(term, tag, value) {
  const noComment = value.replace(/\s+!\s.*$/, '');
  switch (tag) {
    case 'name':
      term.name = value.trim();
      break;
    case 'def': {
      const q = parseQuoted(value);
      if (q) {
        term.def = q.text;
        term.defRefs = refsOf(q.rest);
      }
      break;
    }
    case 'comment':
      term.comment = value.trim();
      break;
    case 'synonym': {
      const q = parseQuoted(value);
      if (q) {
        const scope = q.rest.match(/^(EXACT|RELATED|BROAD|NARROW)\b/)?.[1] ?? 'RELATED';
        const type = q.rest.match(/^(?:EXACT|RELATED|BROAD|NARROW)\s+([A-Za-z_][\w:-]*)\s*\[/)?.[1] ?? null;
        term.synonyms.push({ text: q.text, scope, type, refs: refsOf(q.rest) });
      }
      break;
    }
    case 'xref': {
      const id = noComment.trim().split(/\s+/)[0];
      const src = value.match(/\{([^}]*)\}/)?.[1] ?? null;
      if (id) term.xrefs.push({ id, qualifiers: src });
      break;
    }
    case 'is_a': {
      const id = noComment.trim().split(/\s+/)[0];
      if (id) term.isA.push(id);
      break;
    }
    case 'alt_id':
      term.altIds.push(value.trim());
      break;
    case 'subset':
      term.subsets.push(value.trim());
      break;
    case 'relationship': {
      const [pred, target] = noComment.trim().split(/\s+/);
      if (pred && target) term.relationships.push({ pred, target, qualifiers: value.match(/\{([^}]*)\}/)?.[1] ?? null });
      break;
    }
    case 'is_obsolete':
      term.obsolete = value.trim() === 'true';
      break;
    case 'replaced_by':
      term.replacedBy.push(value.trim());
      break;
    case 'consider':
      term.consider.push(value.trim());
      break;
    case 'property_value':
      term.propertyValues.push(value.trim());
      break;
    default:
      break;
  }
}

/**
 * Recorre los `[Term]` de un OBO y llama a `onTerm(term)` por cada uno.
 * Devuelve la cabecera (`data-version`, `property_value`s, `remark`s).
 */
export async function readObo(path, onTerm) {
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  const header = { dataVersion: null, propertyValues: [], remarks: [] };
  let inHeader = true;
  let term = null;
  let skip = false;
  for await (const line of rl) {
    if (line.startsWith('[')) {
      inHeader = false;
      if (term) onTerm(term);
      term = null;
      skip = line !== '[Term]';
      continue;
    }
    const i = line.indexOf(': ');
    if (i < 0) continue;
    const tag = line.slice(0, i);
    const value = line.slice(i + 2);
    if (inHeader) {
      if (tag === 'data-version') header.dataVersion = value.trim();
      else if (tag === 'property_value') header.propertyValues.push(value.trim());
      else if (tag === 'remark') header.remarks.push(value.trim());
      continue;
    }
    if (skip) continue;
    if (tag === 'id') term = emptyTerm(value.trim());
    else if (term) applyTag(term, tag, value);
  }
  if (term) onTerm(term);
  return header;
}

/** Hijos por padre (is_a) de un mapa id → término. */
export function childrenIndex(terms) {
  const kids = new Map();
  for (const t of terms.values()) {
    for (const p of t.isA) {
      if (!kids.has(p)) kids.set(p, []);
      kids.get(p).push(t.id);
    }
  }
  return kids;
}

/** Ids alcanzables hacia abajo desde `roots` (incluidas las raíces). */
export function descendants(kids, roots) {
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const x = stack.pop();
    if (seen.has(x)) continue;
    seen.add(x);
    for (const c of kids.get(x) ?? []) stack.push(c);
  }
  return seen;
}
