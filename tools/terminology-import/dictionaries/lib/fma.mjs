// =============================================================================
// FMA (Foundational Model of Anatomy, Universidad de Washington) — lector del
// `fma.owl` RDF/XML que publica el Structural Informatics Group en Bitbucket.
//
// Línea a línea (200 MB, ~100 mil clases): el archivo lo genera Protégé con una
// estructura fija —bloques de primer nivel con 4 espacios de sangría—, así que
// no hace falta un parser XML general. Lee:
//  - owl:Class: etiqueta, preferred_name, synonym, definition, FMAID, is_a
//    (`rdfs:subClassOf rdf:resource`) y restricciones `someValuesFrom` dentro de
//    `rdfs:subClassOf` (NO las de `owl:equivalentClass`).
//  - owl:Axiom: los atributos de cada nombre (annotatedSource/Property/Target):
//    `language` (lo declara FMA: Spanish, Latin, French…), `TA_ID` (código de la
//    Terminologia Anatomica 1998), `Eponym` (true), `abbreviation`.
//  - owl:ObjectProperty: `rdfs:subPropertyOf`, para saber qué predicados son
//    partes de `part_of` según el propio archivo.
// =============================================================================

import { provenance } from './terms.mjs';

const ENT = { '&apos;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>', '&amp;': '&' };
const unxml = (s) => s.replace(/&(apos|quot|lt|gt|amp);/g, (m) => ENT[m]);
const fmaRef = (s) => {
  const m = String(s).match(/&fma;([^"]+)"/);
  return m ? m[1] : null;
};
const fmaCode = (local) => (/^fma\d+$/.test(local) ? `FMA:${local.slice(3)}` : null);

/** Texto de `<tag …>valor</tag>` aunque ocupe varias líneas; devuelve [valor, índice de la última línea]. */
function readValue(lines, i, tag) {
  let text = lines[i].replace(new RegExp(`^\\s*<${tag}[^>]*>`), '');
  let j = i;
  while (!text.includes(`</${tag}>`) && j + 1 < lines.length) text += '\n' + lines[++j];
  return [unxml(text.slice(0, text.indexOf(`</${tag}>`)).trim()), j];
}

const TAG = /^\s*<([A-Za-z_:-]+)[\s>]/;

export function parseFma(text) {
  const lines = text.split('\n');
  const classes = new Map();
  const axioms = [];
  const subProperty = new Map();
  let ontologyComment = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Declaraciones de una sola línea (`<… rdf:about="…"/>`) no tienen cuerpo: buscar su cierre se tragaría el archivo.
    if (line.startsWith('    <owl:') && line.trimEnd().endsWith('/>')) continue;
    if (line.startsWith('    <owl:Class rdf:about=')) {
      const local = fmaRef(line);
      const c = { local, label: null, preferred: null, synonyms: [], definition: null, fmaId: null, isA: [], restrictions: [] };
      let inEquivalent = 0;
      let inSub = false;
      let onProperty = null;
      for (i++; i < lines.length && !lines[i].startsWith('    </owl:Class>'); i++) {
        const l = lines[i];
        if (l.startsWith('        <owl:equivalentClass')) inEquivalent++;
        if (l.startsWith('        </owl:equivalentClass>')) inEquivalent--;
        if (inEquivalent) continue;
        if (l.startsWith('        <rdfs:subClassOf rdf:resource=')) { const r = fmaRef(l); if (r) c.isA.push(r); continue; }
        if (l.startsWith('        <rdfs:subClassOf>')) { inSub = true; onProperty = null; continue; }
        if (l.startsWith('        </rdfs:subClassOf>')) { inSub = false; continue; }
        if (inSub) {
          if (l.includes('<owl:onProperty rdf:resource=')) onProperty = fmaRef(l);
          else if (l.includes('<owl:someValuesFrom rdf:resource=') && onProperty) c.restrictions.push({ property: onProperty, target: fmaRef(l) });
          continue;
        }
        const tag = l.match(TAG)?.[1];
        if (!tag || !l.startsWith('        <')) continue;
        if (tag === 'rdfs:label') { [c.label, i] = readValue(lines, i, 'rdfs:label'); }
        else if (tag === 'preferred_name') { [c.preferred, i] = readValue(lines, i, 'preferred_name'); }
        else if (tag === 'synonym') { let v; [v, i] = readValue(lines, i, 'synonym'); c.synonyms.push(v); }
        else if (tag === 'definition') { [c.definition, i] = readValue(lines, i, 'definition'); }
        else if (tag === 'FMAID') { [c.fmaId, i] = readValue(lines, i, 'FMAID'); }
      }
      if (local) classes.set(local, c);
      continue;
    }
    if (line.startsWith('    <owl:Axiom>')) {
      const a = { source: null, property: null, target: null, language: null, taIds: [], eponym: false, abbreviations: [], termStatus: null };
      for (i++; i < lines.length && !lines[i].startsWith('    </owl:Axiom>'); i++) {
        const l = lines[i];
        const tag = l.match(TAG)?.[1];
        if (tag === 'owl:annotatedSource') a.source = fmaRef(l);
        else if (tag === 'owl:annotatedProperty') a.property = fmaRef(l);
        else if (tag === 'owl:annotatedTarget') { [a.target, i] = readValue(lines, i, 'owl:annotatedTarget'); }
        else if (tag === 'language') { [a.language, i] = readValue(lines, i, 'language'); }
        else if (tag === 'TA_ID') { let v; [v, i] = readValue(lines, i, 'TA_ID'); a.taIds.push(v); }
        else if (tag === 'Eponym') { let v; [v, i] = readValue(lines, i, 'Eponym'); a.eponym = v === 'true'; }
        else if (tag === 'abbreviation') { let v; [v, i] = readValue(lines, i, 'abbreviation'); a.abbreviations.push(v); }
        else if (tag === 'term_status') { [a.termStatus, i] = readValue(lines, i, 'term_status'); }
      }
      if (a.source) axioms.push(a);
      continue;
    }
    if (line.startsWith('    <owl:ObjectProperty rdf:about=')) {
      const p = fmaRef(line);
      const parents = [];
      for (i++; i < lines.length && !lines[i].startsWith('    </owl:ObjectProperty>'); i++) {
        if (lines[i].includes('<rdfs:subPropertyOf rdf:resource=')) parents.push(fmaRef(lines[i]));
      }
      if (p) subProperty.set(p, parents.filter(Boolean));
      continue;
    }
    if (!ontologyComment && line.startsWith('        <rdfs:comment>')) ontologyComment = readValue(lines, i, 'rdfs:comment')[0];
  }
  return { classes, axioms, subProperty, ontologyComment };
}

/** Predicados que el archivo declara (transitivamente) subpropiedad de `part_of`, incluido éste. */
export function partOfPredicates(subProperty) {
  const out = new Set(['part_of']);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [p, parents] of subProperty) if (!out.has(p) && parents.some((x) => out.has(x))) { out.add(p); grew = true; }
  }
  return out;
}

/**
 * Clases → filas. `coreCodes` (opcional): códigos que entran por defecto
 * (`namespace: 'fma-core'`); el resto queda `fma-extended` (opt-in).
 */
export function fmaRows(parsed, source, file, { uberonFmaXrefs = new Set() } = {}) {
  const partOf = partOfPredicates(parsed.subProperty);
  const byClass = new Map();
  for (const a of parsed.axioms) {
    if (!byClass.has(a.source)) byClass.set(a.source, []);
    byClass.get(a.source).push(a);
  }
  const rows = [];
  const stats = { classes: parsed.classes.size, rows: 0, withTa98: 0, spanish: 0, latin: 0, eponyms: 0, partOfPredicates: [...partOf].sort(), core: 0 };
  const core = new Set();
  const parentsOf = new Map();
  for (const [local, c] of parsed.classes) {
    const code = fmaCode(local);
    if (!code) continue;
    const name = c.preferred ?? c.label;
    if (!name) continue;
    const ax = byClass.get(local) ?? [];
    const names = { es: [], la: [], other: [] };
    const ta98 = new Set();
    const eponyms = new Set();
    const abbreviations = new Set();
    for (const a of ax) {
      for (const t of a.taIds) ta98.add(t);
      if (a.eponym && a.target) eponyms.add(a.target);
      for (const x of a.abbreviations) abbreviations.add(x);
      if (a.property === 'non-English_equivalent' && a.target) {
        if (a.language === 'Spanish') names.es.push(a.target);
        else if (a.language === 'Latin') names.la.push(a.target);
        else names.other.push({ value: a.target, language: a.language ?? null });
      }
    }
    const relations = c.isA.map(fmaCode).filter(Boolean).map((t) => ({ type: 'IS_A', predicate: 'is_a', target: t }));
    const otherRelations = [];
    for (const r of c.restrictions) {
      const t = fmaCode(r.target);
      if (!t) continue;
      if (partOf.has(r.property)) relations.push({ type: 'PART_OF', predicate: `fma:${r.property}`, target: t });
      else otherRelations.push({ predicate: `fma:${r.property}`, label: r.property.replace(/_/g, ' '), target: t });
    }
    parentsOf.set(code, relations.filter((x) => x.type === 'IS_A').map((x) => x.target));
    if (ta98.size || names.es.length || names.la.length || eponyms.size || uberonFmaXrefs.has(code)) core.add(code);
    rows.push({
      key: `${source.codeSystem}|${code}`,
      codeSystem: source.codeSystem,
      code,
      domain: source.domain,
      lang: 'en',
      display: name,
      definition: c.definition ?? null,
      definitionXrefs: [],
      synonymsExact: [...new Set(c.synonyms)].filter((s) => s !== name),
      synonymsOther: [],
      designationsEs: [...new Set(names.es)],
      designationsLa: [...new Set(names.la)],
      xrefs: [...ta98].sort().map((t) => ({ id: `TA98:${t}`, equivalent: false })),
      subsets: eponyms.size ? ['eponym'] : [],
      namespace: null,
      altIds: [],
      relations,
      otherRelations,
      extra: {
        fmaId: c.fmaId,
        ...(eponyms.size ? { eponyms: [...eponyms].sort() } : {}),
        ...(abbreviations.size ? { abbreviations: [...abbreviations].sort() } : {}),
        ...(names.other.length ? { otherLanguageNames: names.other } : {}),
      },
      provenance: provenance(source, code, { file }),
    });
  }
  // Núcleo: clases con TA98, nombre ES/latín, epónimo o xref desde Uberon + sus ancestros is_a.
  const queue = [...core];
  while (queue.length) {
    const t = queue.shift();
    for (const p of parentsOf.get(t) ?? []) if (!core.has(p)) { core.add(p); queue.push(p); }
  }
  for (const r of rows) {
    r.namespace = core.has(r.code) ? 'fma-core' : 'fma-extended';
    if (r.xrefs.length) stats.withTa98++;
    if (r.designationsEs.length) stats.spanish++;
    if (r.designationsLa.length) stats.latin++;
    if (r.extra.eponyms) stats.eponyms++;
  }
  stats.rows = rows.length;
  stats.core = core.size;
  return { rows, stats };
}
