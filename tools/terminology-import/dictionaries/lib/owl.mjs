// =============================================================================
// Lectores de OWL para las ontologías OBO que NO publican `.obo` usable
// (OGMS publica un ogms.obo con un solo término; IDO y OMRSE sólo publican
// OWL). Devuelven la MISMA forma que `parseObo` ({ header, terms, typedefs })
// para que la normalización de `terms.mjs` sea una sola.
//
// Sólo axiomas simples y explícitos: etiqueta, definición (IAO:0000115),
// sinónimos y xrefs de oboInOwl, deprecación, `SubClassOf(A B)` y
// `SubClassOf(A ObjectSomeValuesFrom(P B))`. Las expresiones anidadas
// (intersecciones, uniones, cardinalidades) no se interpretan: se ignoran.
// =============================================================================

const OBO = 'http://purl.obolibrary.org/obo/';

/** IRI o CURIE `obo:X_123` → `X:123`; otra cosa queda tal cual. */
export function oboCurie(ref) {
  let s = String(ref).replace(/^<|>$/g, '');
  if (s.startsWith('obo:')) s = OBO + s.slice(4);
  if (s.startsWith(OBO)) {
    const local = s.slice(OBO.length);
    const m = local.match(/^([A-Za-z]+)_(\w+)$/);
    return m ? `${m[1]}:${m[2]}` : local;
  }
  return s;
}

function newTerm(id) {
  return {
    id, name: null, def: null, defXrefs: [], namespace: null, synonyms: [], xrefs: [], isA: [], relationships: [],
    intersectionOf: [], subsets: [], altIds: [], propertyValues: [], obsolete: false, replacedBy: [], consider: [], comment: null, other: {},
  };
}

const SYN_SCOPE = { hasExactSynonym: 'EXACT', hasRelatedSynonym: 'RELATED', hasBroadSynonym: 'BROAD', hasNarrowSynonym: 'NARROW' };
const unescapeOfn = (s) => s.replace(/\\(["\\])/g, '$1');

/** Quita las anotaciones anidadas `Annotation(...)` del principio de un axioma. */
function stripAxiomAnnotations(body) {
  let s = body.trim();
  while (s.startsWith('Annotation(')) {
    let depth = 0;
    let i = 0;
    let inQ = false;
    for (; i < s.length; i++) {
      const c = s[i];
      if (c === '\\') { i++; continue; }
      if (c === '"') inQ = !inQ;
      if (inQ) continue;
      if (c === '(') depth++;
      if (c === ')' && --depth === 0) break;
    }
    s = s.slice(i + 1).trim();
  }
  return s;
}

/** OWL Functional Syntax (como lo escribe ROBOT/ODK en *-edit.owl). */
export function parseOfn(text) {
  const terms = new Map();
  const propLabels = new Map();
  const declaredProps = new Set();
  const header = {};
  const get = (id) => { if (!terms.has(id)) terms.set(id, newTerm(id)); return terms.get(id); };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    let m;
    if ((m = line.match(/^Ontology\(<([^>]+)>(?:\s+<([^>]+)>)?/))) { header.ontology = [m[1]]; if (m[2]) header['data-version'] = [m[2]]; continue; }
    if ((m = line.match(/^Declaration\(Class\(([^)\s]+)\)\)$/))) { get(oboCurie(m[1])); continue; }
    if ((m = line.match(/^Declaration\((ObjectProperty|AnnotationProperty)\(([^)\s]+)\)\)$/))) { declaredProps.add(oboCurie(m[2])); continue; }
    if (line.startsWith('AnnotationAssertion(')) {
      const body = stripAxiomAnnotations(line.slice('AnnotationAssertion('.length, -1));
      const a = body.match(/^(\S+)\s+(\S+)\s+"((?:[^"\\]|\\.)*)"/);
      if (!a) {
        const d = body.match(/^owl:deprecated\s+(\S+)\s+"true"/);
        if (d) get(oboCurie(d[1])).obsolete = true;
        continue;
      }
      const [, prop, subj, val] = a;
      const id = oboCurie(subj);
      const value = unescapeOfn(val);
      if (prop === 'rdfs:label' && declaredProps.has(id)) { propLabels.set(id, value); continue; }
      if (!terms.has(id) && prop !== 'rdfs:label') continue;
      const t = get(id);
      if (prop === 'rdfs:label') t.name ??= value;
      else if (prop === 'obo:IAO_0000115') t.def ??= value;
      else if (prop.startsWith('oboInOwl:') && SYN_SCOPE[prop.slice(9)]) t.synonyms.push({ value, scope: SYN_SCOPE[prop.slice(9)], type: null, xrefs: [] });
      else if (prop === 'oboInOwl:hasDbXref') t.xrefs.push({ id: value, description: null, qualifiers: {} });
      else if (prop === 'owl:deprecated' && value === 'true') t.obsolete = true;
      continue;
    }
    if (line.startsWith('SubClassOf(')) {
      const body = stripAxiomAnnotations(line.slice('SubClassOf('.length, -1));
      if ((m = body.match(/^(\S+)\s+(obo:\S+|<[^>]+>)$/))) { get(oboCurie(m[1])).isA.push({ target: oboCurie(m[2]), qualifiers: {} }); continue; }
      if ((m = body.match(/^(\S+)\s+ObjectSomeValuesFrom\((\S+)\s+(obo:[^\s()]+|<[^>]+>)\)$/))) {
        get(oboCurie(m[1])).relationships.push({ predicate: oboCurie(m[2]), target: oboCurie(m[3]), qualifiers: {} });
      }
    }
  }
  const typedefs = [...propLabels].map(([id, name]) => ({ ...newTerm(id), name }));
  return { header, terms: [...terms.values()], typedefs };
}

const ENT = { '&apos;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>', '&amp;': '&' };
const unxml = (s) => s.replace(/&(apos|quot|lt|gt|amp);/g, (x) => ENT[x]);

/** Valor de `<tag …>texto</tag>` que puede ocupar varias líneas. */
function readValue(lines, i, tag) {
  let text = lines[i].replace(new RegExp(`^\\s*<${tag}[^>]*>`), '');
  let j = i;
  while (!text.includes(`</${tag}>`) && j + 1 < lines.length) text += '\n' + lines[++j];
  return [unxml(text.slice(0, text.indexOf(`</${tag}>`)).trim()), j];
}

// `&obo;X` es la entidad XML que algunos archivos (MF, MFOEM) usan por `http://purl.obolibrary.org/obo/X`.
const about = (l) => l.match(/rdf:(?:about|resource)="([^"]+)"/)?.[1]?.replace(/^&obo;/, OBO) ?? null;

/** RDF/XML como lo escribe la OWL API (bloques de primer nivel con 4 espacios). */
export function parseRdfXml(text) {
  const lines = text.split('\n');
  const terms = [];
  const typedefs = [];
  const header = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const v = line.match(/<owl:versionIRI rdf:resource="([^"]+)"/);
    if (v) header['data-version'] = [v[1]];
    const isClass = line.startsWith('    <owl:Class rdf:about=');
    const isProp = line.startsWith('    <owl:ObjectProperty rdf:about=');
    if (!isClass && !isProp) continue;
    const t = newTerm(oboCurie(about(line)));
    // Declaración de una sola línea (`<owl:Class rdf:about="…"/>`): sin cuerpo que leer.
    if (line.trimEnd().endsWith('/>')) {
      (isClass ? terms : typedefs).push(t);
      continue;
    }
    const close = isClass ? '    </owl:Class>' : '    </owl:ObjectProperty>';
    let depthEq = 0;
    let inSub = false;
    let onProp = null;
    for (i++; i < lines.length && !lines[i].startsWith(close); i++) {
      const l = lines[i];
      if (l.startsWith('        <owl:equivalentClass')) depthEq++;
      if (l.startsWith('        </owl:equivalentClass>')) depthEq--;
      if (depthEq) continue;
      if (l.startsWith('        <rdfs:subClassOf rdf:resource=')) { t.isA.push({ target: oboCurie(about(l)), qualifiers: {} }); continue; }
      if (l.startsWith('        <rdfs:subClassOf>')) { inSub = true; onProp = null; continue; }
      if (l.startsWith('        </rdfs:subClassOf>')) { inSub = false; continue; }
      if (inSub) {
        if (l.includes('<owl:onProperty rdf:resource=')) onProp = oboCurie(about(l));
        else if (l.includes('<owl:someValuesFrom rdf:resource=') && onProp) t.relationships.push({ predicate: onProp, target: oboCurie(about(l)), qualifiers: {} });
        continue;
      }
      const tag = l.match(/^\s{8}<([\w:]+)[\s>/]/)?.[1];
      if (!tag) continue;
      let val;
      if (tag === 'rdfs:label') { [val, i] = readValue(lines, i, tag); t.name ??= val; }
      else if (tag === 'obo:IAO_0000115') { [val, i] = readValue(lines, i, tag); t.def ??= val; }
      else if (tag.startsWith('oboInOwl:') && SYN_SCOPE[tag.slice(9)]) { [val, i] = readValue(lines, i, tag); t.synonyms.push({ value: val, scope: SYN_SCOPE[tag.slice(9)], type: null, xrefs: [] }); }
      else if (tag === 'oboInOwl:hasDbXref') { [val, i] = readValue(lines, i, tag); t.xrefs.push({ id: val, description: null, qualifiers: {} }); }
      else if (tag === 'owl:deprecated') { [val, i] = readValue(lines, i, tag); t.obsolete = val === 'true'; }
    }
    (isClass ? terms : typedefs).push(t);
  }
  return { header, terms, typedefs };
}
