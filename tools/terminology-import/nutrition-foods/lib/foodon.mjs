// =============================================================================
// Ontologías OBO en RDF/XML de OWLAPI (FoodOn, CDNO, FOBI, ONS) · clases de un prefijo (`FOODON_`, `CDNO_`…). Lector por bloques: cada clase de primer nivel empieza en una línea
// `    <owl:Class rdf:about="http://purl.obolibrary.org/obo/FOODON_…">` y termina en `    </owl:Class>` (sangría de 4
// espacios); lo anidado (restricciones, equivalencias) tiene más sangría. El formato se verifica contra el archivo real
// en los tests. Solo se cargan las clases FOODON_: las de NCBITaxon, CHEBI, UBERON… son de otras ontologías con su
// propia licencia y quedan como referencia (`external_parents`).
// =============================================================================
import { decodeXml } from './xml.mjs';

const OBO = 'http://purl.obolibrary.org/obo/';
/** Parte local del IRI OBO (p. ej. FOODON_03301941, RO_0001000): igual al código que usa la fuente en la URL. */
const curie = (iri) => (iri.startsWith(OBO) ? iri.slice(OBO.length) : iri);
const classRe = (prefix) => new RegExp(`\\n {4}<owl:Class rdf:about="http://purl\\.obolibrary\\.org/obo/(${prefix}_\\d+)">([\\s\\S]*?)\\n {4}</owl:Class>`, 'g');

/** Valores de un elemento de texto de primer nivel (8 espacios), con su idioma si lo trae. */
function textValues(body, tag) {
  const re = new RegExp(`\\n {8}<${tag}(?: xml:lang="([^"]*)")?(?: rdf:datatype="[^"]*")?>([\\s\\S]*?)</${tag}>`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(body))) out.push({ lang: m[1] ?? null, value: decodeXml(m[2]) });
  return out;
}

function resourceValues(body, tag) {
  const re = new RegExp(`\\n {8}<${tag} rdf:resource="([^"]*)"\\s*/>`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(body))) out.push(decodeXml(m[1]));
  return out;
}

/** `rdfs:subClassOf` con restricción simple (onProperty + someValuesFrom) de primer nivel. */
function restrictions(body) {
  const re = /\n {8}<rdfs:subClassOf>\s*<owl:Restriction>\s*<owl:onProperty rdf:resource="([^"]*)"\/>\s*<owl:someValuesFrom rdf:resource="([^"]*)"\/>\s*<\/owl:Restriction>\s*<\/rdfs:subClassOf>/g;
  const out = [];
  let m;
  while ((m = re.exec(body))) out.push({ property: curie(m[1]), target: curie(m[2]) });
  return out;
}

export function parseOboClasses(text, prefix) {
  const out = [];
  const CLASS_RE = classRe(prefix);
  let m;
  while ((m = CLASS_RE.exec(text))) {
    const code = m[1];
    const body = m[2];
    const labels = textValues(body, 'rdfs:label');
    const label = (labels.find((l) => l.lang === 'en') ?? labels[0])?.value;
    const definitions = textValues(body, 'obo:IAO_0000115');
    const parentsAll = resourceValues(body, 'rdfs:subClassOf');
    const syn = [];
    for (const [tag, scope] of [['oboInOwl:hasExactSynonym', 'exact'], ['oboInOwl:hasNarrowSynonym', 'narrow'], ['oboInOwl:hasBroadSynonym', 'broad'], ['oboInOwl:hasRelatedSynonym', 'related'], ['oboInOwl:hasSynonym', 'unspecified'], ['skos:altLabel', 'alt']]) {
      for (const s of textValues(body, tag)) syn.push({ scope, value: s.value, ...(s.lang ? { lang: s.lang } : {}) });
    }
    const deprecated = textValues(body, 'owl:deprecated').some((d) => d.value === 'true');
    const replaced = resourceValues(body, 'obo:IAO_0100001');
    out.push({
      code,
      label,
      definition: definitions[0]?.value,
      definitionsExtra: definitions.slice(1).map((d) => d.value),
      synonyms: syn,
      xrefs: textValues(body, 'oboInOwl:hasDbXref').map((x) => x.value),
      parents: parentsAll.filter((p) => p.startsWith(`${OBO}${prefix}_`)).map((p) => p.slice(OBO.length)),
      externalParents: parentsAll.filter((p) => !p.startsWith(`${OBO}${prefix}_`)).map(curie),
      restrictions: restrictions(body),
      comment: textValues(body, 'rdfs:comment').map((c) => c.value),
      curationStatus: resourceValues(body, 'obo:IAO_0000114').map(curie),
      seeAlso: resourceValues(body, 'rdfs:seeAlso'),
      replacedBy: replaced.map(curie),
      deprecated,
      hasEquivalentClassAxiom: /\n {8}<owl:equivalentClass/.test(body),
    });
  }
  return out;
}

export const parseFoodOnClasses = (text) => parseOboClasses(text, 'FOODON');

export function oboRecords(classes, { cs, prov }) {
  const codes = new Set(classes.map((c) => c.code));
  let danglingParents = 0;
  const records = classes.map((c) => {
    const props = {};
    if (c.xrefs.length) props.xrefs = c.xrefs;
    if (c.synonyms.length) props.synonyms = c.synonyms;
    if (c.externalParents.length) props.external_parents = c.externalParents;
    if (c.restrictions.length) props.restrictions = c.restrictions;
    if (c.comment.length) props.comment = c.comment;
    if (c.curationStatus.length) props.curation_status = c.curationStatus;
    if (c.seeAlso.length) props.see_also = c.seeAlso;
    if (c.replacedBy.length) props.replaced_by = c.replacedBy;
    if (c.definitionsExtra.length) props.definitions_extra = c.definitionsExtra;
    if (c.hasEquivalentClassAxiom) props.has_equivalent_class_axiom = true;
    const parents = c.parents.filter((p) => (codes.has(p) ? true : (danglingParents++, false))).map((p) => [cs, p]);
    const display = c.label ?? c.code;
    return {
      cs,
      code: c.code,
      display,
      ...(c.label ? {} : { displayFallback: true }),
      definition: c.definition,
      state: c.deprecated ? 'retired' : 'active',
      designations: [
        ...(c.label ? [{ lang: 'en', value: c.label, preferred: true }] : []),
        ...c.synonyms.filter((s) => !s.lang || s.lang === 'en').map((s) => ({ lang: 'en', value: s.value, preferred: false })),
      ],
      parents,
      properties: props,
      prov,
    };
  });
  return { records, danglingParents };
}

export const foodOnRecords = oboRecords;
