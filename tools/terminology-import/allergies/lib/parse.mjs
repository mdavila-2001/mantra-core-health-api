// =============================================================================
// Catálogo de alergias · lectores de formato (puros, sin red ni base).
//
// OBO 1.4 (HPO, DOID, Mondo), TSV Babelon (traducciones de la HPO), taxonomías
// de Open Food Facts y recursos FHIR (CodeSystem / ValueSet). Sólo leen: no
// deciden contenido. Lo que el archivo no trae queda vacío.
// =============================================================================

/**
 * @typedef {Object} OboTerm
 * @property {string} id
 * @property {string|null} name
 * @property {string|null} def        texto de la definición, sin las citas
 * @property {string[]} defRefs       citas de la definición ([...])
 * @property {{text:string, scope:string}[]} synonyms
 * @property {{id:string, sources:string[]}[]} xrefs
 * @property {string[]} isA
 * @property {boolean} obsolete
 * @property {string[]} replacedBy
 */

/** Lee el texto entre comillas de una línea OBO respetando `\"` escapadas. */
function quoted(value) {
  if (!value.startsWith('"')) return { text: null, rest: value };
  let i = 1;
  let text = '';
  while (i < value.length) {
    const ch = value[i];
    if (ch === '\\' && i + 1 < value.length) {
      text += value[i + 1];
      i += 2;
      continue;
    }
    if (ch === '"') break;
    text += ch;
    i += 1;
  }
  return { text, rest: value.slice(i + 1).trim() };
}

/** Quita el comentario final `! …` y los calificadores `{…}` de un valor OBO. */
function bare(value) {
  return value.replace(/\s*\{[^}]*\}\s*$/, '').replace(/\s+!.*$/, '').trim();
}

/** `{source="A", source="B"}` → `['A','B']`. */
function qualifierSources(value) {
  const m = value.match(/\{([^}]*)\}\s*$/);
  if (!m) return [];
  return [...m[1].matchAll(/source="([^"]*)"/g)].map((x) => x[1]);
}

/**
 * Parsea un .obo. Devuelve la cabecera (clave → valores) y los términos por id.
 * @param {string} text
 */
export function parseObo(text) {
  const header = {};
  /** @type {Map<string, OboTerm>} */
  const terms = new Map();
  let current = null;
  let inHeader = true;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line.startsWith('[')) {
      inHeader = false;
      current = line === '[Term]' ? { id: null, name: null, def: null, defRefs: [], synonyms: [], xrefs: [], isA: [], obsolete: false, replacedBy: [] } : null;
      continue;
    }
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const key = line.slice(0, colon);
    const value = line.slice(colon + 1).trim();
    if (inHeader) {
      (header[key] ??= []).push(value);
      continue;
    }
    if (current === null) continue;
    switch (key) {
      case 'id':
        current.id = value;
        terms.set(value, current);
        break;
      case 'name':
        current.name = value;
        break;
      case 'def': {
        const { text: defText, rest } = quoted(value);
        current.def = defText;
        const refs = rest.match(/^\[([^\]]*)\]/);
        current.defRefs = refs && refs[1] ? refs[1].split(/,\s*/) : [];
        break;
      }
      case 'synonym': {
        const { text: synText, rest } = quoted(value);
        if (synText) current.synonyms.push({ text: synText, scope: rest.split(/\s+/)[0] ?? 'RELATED' });
        break;
      }
      case 'xref':
        current.xrefs.push({ id: bare(value).split(/\s+/)[0], sources: qualifierSources(value) });
        break;
      case 'is_a':
        current.isA.push(bare(value).split(/\s+/)[0]);
        break;
      case 'is_obsolete':
        current.obsolete = value === 'true';
        break;
      case 'replaced_by':
        current.replacedBy.push(bare(value));
        break;
      default:
        break;
    }
  }
  return { header, terms };
}

/** Descendientes (por `is_a`) de `rootId`, sin incluirlo, ignorando obsoletos. */
export function oboDescendants(terms, rootId) {
  const children = new Map();
  for (const term of terms.values()) {
    if (term.obsolete) continue;
    for (const parent of term.isA) {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(term.id);
    }
  }
  const out = new Set();
  const stack = [rootId];
  while (stack.length > 0) {
    for (const child of children.get(stack.pop()) ?? []) {
      if (!out.has(child)) {
        out.add(child);
        stack.push(child);
      }
    }
  }
  return out;
}

/** TSV con encabezado → filas objeto. Sin comillas (Babelon no las usa). */
export function parseTsv(text) {
  const [head, ...lines] = text.split(/\r?\n/).filter((l) => l !== '');
  const cols = head.split('\t');
  return lines.map((l) => {
    const cells = l.split('\t');
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? '']));
  });
}

/**
 * Id de etiqueta de Open Food Facts para un nombre (`en:<id>`): port de
 * `get_string_id_for_lang` de `lib/ProductOpener/Store.pm` (mismo commit que la
 * taxonomía): NFC, minúsculas, `.` → `-`, los signos ASCII y tipográficos de su
 * lista → `-`, guiones colapsados y sin guion inicial ni final. Sin quitar
 * tildes (sólo el francés lo hace, y acá se usa `en`).
 */
const OFF_SPECIAL = /[\s!"#$%&'()*+,/:;<=>?@[\\\]^_`{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼⅓½⅔¾¿×ˆ˜–—‘’‚“”„†‡•…‰‹›€™\t]/gu;
export function offTagId(lang, name) {
  const id = String(name)
    .normalize('NFC')
    .replace(/\u1E9E/g, 'ß')
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[\u0000-\u001f\u200b]/g, '-')
    .replace(/&(quot|lt|gt);/g, '-')
    .replace(OFF_SPECIAL, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
  return `${lang}:${id}`;
}

/**
 * Taxonomía de Open Food Facts: bloques separados por línea en blanco.
 * `xx: a, b` = nombres por idioma (el primero es el preferido); `< xx: n` =
 * padre; `prop:xx: v` = propiedad. Las líneas `#` y `stopwords:`/`synonyms:`
 * no son entradas.
 */
export function parseOffTaxonomy(text) {
  const entries = [];
  for (const block of text.split(/\r?\n\s*\r?\n/)) {
    const names = {};
    const parents = [];
    const props = {};
    for (const raw of block.split(/\r?\n/)) {
      const line = raw.trim();
      if (line === '' || line.startsWith('#')) continue;
      if (line.startsWith('<')) {
        const m = line.slice(1).trim().match(/^([a-z]{2,3}(?:[_-][a-zA-Z]{2,4})?):\s*(.+)$/);
        if (m) parents.push({ lang: m[1], name: m[2].trim() });
        continue;
      }
      const prop = line.match(/^([a-z0-9_]+):([a-z]{2,3}):\s*(.*)$/);
      if (prop && prop[1].length > 3) {
        props[prop[1]] = prop[3].trim();
        continue;
      }
      const name = line.match(/^([a-z]{2,3}(?:_[a-zA-Z]{2,4})?):\s*(.*)$/);
      if (name) names[name[1]] = name[2].split(',').map((s) => s.trim()).filter((s) => s !== '');
    }
    if (names.stopwords || names.synonyms) continue;
    if (!names.en || names.en.length === 0) continue;
    entries.push({ id: offTagId('en', names.en[0]), names, parents, props });
  }
  return entries;
}

/** Conceptos de un CodeSystem FHIR, aplanados con su padre (jerarquía anidada). */
export function flattenCodeSystem(codeSystem) {
  const out = [];
  const walk = (concepts, parent) => {
    for (const c of concepts ?? []) {
      out.push({ code: c.code, display: c.display ?? c.code, definition: c.definition ?? null, parent, designations: c.designation ?? [] });
      walk(c.concept, c.code);
    }
  };
  walk(codeSystem.concept, null);
  return out;
}

/** Miembros de un ValueSet FHIR: la expansión si existe; si no, los `concept` explícitos del compose. */
export function valueSetMembers(valueSet) {
  const expansion = valueSet.expansion?.contains;
  if (Array.isArray(expansion) && expansion.length > 0) return expansion.map((c) => ({ system: c.system, code: c.code, display: c.display ?? null, version: c.version ?? null }));
  const out = [];
  for (const inc of valueSet.compose?.include ?? []) {
    for (const c of inc.concept ?? []) out.push({ system: inc.system, code: c.code, display: c.display ?? null, version: inc.version ?? null });
  }
  return out;
}

// --- OWL en RDF/XML (salida de ROBOT: OAE, ECTO, FoodOn) -------------------------

const decodeXml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const iriTail = (iri) => iri.replace(/^.*\/obo\//, '').replace('_', ':');

/**
 * Clases nombradas (`<owl:Class rdf:about="…">`) de un OWL en RDF/XML con el
 * formato de ROBOT. Devuelve id CURIE (`CHEBI:123`), etiqueta, sinónimos
 * exactos, definición, superclases nombradas y restricciones
 * `onProperty`/`someValuesFrom`. Las clases anónimas anidadas no se leen como
 * clases, pero no cortan el bloque (se cuentan las aperturas anidadas).
 * @param {string} text
 */
export function parseOwlClasses(text) {
  const classes = new Map();
  const open = /<owl:Class rdf:about="([^"]+)"\s*(\/?)>/g;
  let m;
  while ((m = open.exec(text)) !== null) {
    const id = iriTail(m[1]);
    if (m[2] === '/') {
      if (!classes.has(id)) classes.set(id, { id, iri: m[1], label: null, synonyms: [], def: null, subClassOf: [], restrictions: [], deprecated: false });
      continue;
    }
    let depth = 1;
    const tag = /<owl:Class\b[^>]*?(\/?)>|<\/owl:Class>/g;
    tag.lastIndex = open.lastIndex;
    let t;
    let end = text.length;
    while ((t = tag.exec(text)) !== null) {
      if (t[0].startsWith('</')) depth -= 1;
      else if (t[1] !== '/') depth += 1;
      if (depth === 0) {
        end = t.index;
        break;
      }
    }
    const body = text.slice(open.lastIndex, end);
    open.lastIndex = end;
    const label = body.match(/<rdfs:label(?:\s+[^>]*)?>([^<]*)<\/rdfs:label>/);
    const def = body.match(/<obo:IAO_0000115(?:\s+[^>]*)?>([^<]*)<\/obo:IAO_0000115>/);
    const record = {
      id,
      iri: m[1],
      label: label ? decodeXml(label[1]) : null,
      synonyms: [...body.matchAll(/<oboInOwl:hasExactSynonym(?:\s+[^>]*)?>([^<]*)<\/oboInOwl:hasExactSynonym>/g)].map((x) => decodeXml(x[1])),
      def: def ? decodeXml(def[1]) : null,
      subClassOf: [...body.matchAll(/<rdfs:subClassOf rdf:resource="([^"]+)"\s*\/>/g)].map((x) => iriTail(x[1])),
      restrictions: [...body.matchAll(/<owl:onProperty rdf:resource="([^"]+)"\s*\/>\s*<owl:someValuesFrom rdf:resource="([^"]+)"\s*\/>/g)].map((x) => ({ property: iriTail(x[1]), value: iriTail(x[2]) })),
      deprecated: /<owl:deprecated rdf:datatype="[^"]*boolean">true<\/owl:deprecated>/.test(body),
    };
    const prev = classes.get(id);
    classes.set(id, prev && prev.label && !record.label ? prev : record);
  }
  return classes;
}

/** Descendientes por `rdfs:subClassOf` nombrado, sin incluir la raíz ni los deprecados. */
export function owlDescendants(classes, rootId) {
  const children = new Map();
  for (const c of classes.values()) {
    if (c.deprecated) continue;
    for (const p of c.subClassOf) {
      if (!children.has(p)) children.set(p, []);
      children.get(p).push(c.id);
    }
  }
  const out = new Set();
  const stack = [rootId];
  while (stack.length > 0) {
    for (const child of children.get(stack.pop()) ?? []) {
      if (!out.has(child)) {
        out.add(child);
        stack.push(child);
      }
    }
  }
  return out;
}

/** `owl:versionIRI` de la ontología (versión publicada), o null. */
export function owlVersionIri(text) {
  return text.match(/<owl:versionIRI rdf:resource="([^"]+)"/)?.[1] ?? null;
}
