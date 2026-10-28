// =============================================================================
// Plan de carga (puro, sin base): filas del corpus de genética → tuplas de
// `terminology.*`. Se prueba sin Postgres y lo usa `load-genetics.mjs`.
//
// Ids deterministas: `md5('mantra:genetics:<tipo>:<clave>')::uuid`, como el
// resto de `tools/terminology-import/` → la 2.ª corrida inserta 0 filas.
// Los conceptos internos (estado activo, idioma, tipos de designación y de
// relación) son los que siembra el backend (`deterministicId`).
//
// `catalog_concepts.definition` queda NULA: la definición de la fuente está en
// inglés y la API muestra esa columna como texto en castellano. Va completa,
// con su idioma, en la propiedad `source_definition`.
// =============================================================================

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';

export { md5uuid };

export const CONCEPT = {
  TERM_ACTIVE: deterministicId('terminology:state:active'),
  LANG_EN: deterministicId('terminology:language:en'),
  DESIG_PREFERRED: deterministicId('terminology:designation-type:preferred'),
  DESIG_SYNONYM: deterministicId('terminology:designation-type:synonym'),
  REL_IS_A: deterministicId('terminology:relationship:is-a'),
  REL_PART_OF: deterministicId('terminology:relationship:part-of'),
};
export const RELATION_TYPES = { 'is-a': CONCEPT.REL_IS_A, 'part-of': CONCEPT.REL_PART_OF };

/** Orden de carga: los destinos internos (hgnc ↔ ncbi, grupos, SO) antes de los que los referencian no importa (relaciones y mapas van en una 2.ª pasada). */
export const SYSTEM_ORDER = ['hgnc-gene-group', 'hgnc', 'ncbi-gene-hs', 'medgen', 'sequence-ontology', 'clinvar-terms', 'clinvar-functional', 'clingen-terms', 'hgvs-syntax', 'ga4gh-vrs'];

const SOURCES = {
  HGNC_HUGO: { name: 'HGNC — HUGO Gene Nomenclature Committee', owner: 'HUGO Gene Nomenclature Committee (HGNC), EMBL-EBI', officialUrl: 'https://www.genenames.org/' },
  NCBI_GENE: { name: 'NCBI Gene', owner: 'National Center for Biotechnology Information (NCBI), U.S. National Library of Medicine', officialUrl: 'https://www.ncbi.nlm.nih.gov/gene' },
  NCBI_MEDGEN: { name: 'MedGen (NCBI)', owner: 'National Center for Biotechnology Information (NCBI), U.S. National Library of Medicine', officialUrl: 'https://www.ncbi.nlm.nih.gov/medgen/' },
  NCBI_CLINVAR: { name: 'ClinVar (NCBI)', owner: 'National Center for Biotechnology Information (NCBI), U.S. National Library of Medicine', officialUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/' },
  SEQUENCE_ONTOLOGY: { name: 'Sequence Ontology', owner: 'The Sequence Ontology', officialUrl: 'http://www.sequenceontology.org/' },
  CLINGEN: { name: 'ClinGen — Clinical Genome Resource', owner: 'Clinical Genome Resource (ClinGen)', officialUrl: 'https://clinicalgenome.org/' },
  HGVS_VARNOMEN: { name: 'HGVS Nomenclature', owner: 'HUGO Variation Nomenclature Committee (HVNC) — Human Genome Variation Society', officialUrl: 'https://hgvs-nomenclature.org/' },
  GA4GH_VRS: { name: 'GA4GH Variation Representation Specification (VRS)', owner: 'Global Alliance for Genomics and Health (GA4GH)', officialUrl: 'https://vrs.ga4gh.org/' },
};

/**
 * Un code system por archivo del corpus. `hgnc` y `sequence-ontology` YA los crea `dictionaries/` (load-dictionaries.mjs): se usan el mismo
 * `internal_code` y la misma URL canónica para que sean UN code system con dos versiones (la de cada importador) y no dos sistemas
 * paralelos; `ensureCodeSystem` reusa el existente y no le quita el `is_default` a la versión que ya lo tenga. Los demás llevan una URL
 * interna: ninguna de sus fuentes tiene una verificada en el registro de HL7 (la página de HL7 consultada el 2026-10-28 respondió 404).
 */
export const CODE_SYSTEMS = {
  hgnc: { source: 'HGNC_HUGO', name: 'HGNC — genes humanos aprobados (símbolo y nombre)', canonicalUrl: 'http://www.genenames.org/geneId' },
  'hgnc-gene-group': { source: 'HGNC_HUGO', name: 'HGNC — grupos de genes (familias)' },
  'ncbi-gene-hs': { source: 'NCBI_GENE', name: 'NCBI Gene — genes de Homo sapiens (taxón 9606)' },
  medgen: { source: 'NCBI_MEDGEN', name: 'MedGen — subconjunto de condiciones y fenotipos genéticos con nombre de fuente abierta' },
  'sequence-ontology': { source: 'SEQUENCE_ONTOLOGY', name: 'Sequence Ontology (SO)', canonicalUrl: 'http://purl.obolibrary.org/obo/so.owl' },
  'clinvar-terms': { source: 'NCBI_CLINVAR', name: 'ClinVar — listas controladas (plantilla de envío, esquema XSD y categorías de condición)' },
  'clinvar-functional': { source: 'NCBI_CLINVAR', name: 'ClinVar — consecuencias funcionales (SO) y tipos de ensayo funcional (EFO/OBI/FBbi)' },
  'clingen-terms': { source: 'CLINGEN', name: 'ClinGen — valores controlados de validez gen–enfermedad y sensibilidad a la dosis' },
  'hgvs-syntax': { source: 'HGVS_VARNOMEN', name: 'HGVS Nomenclature — sintaxis (elementos y tipos de variante)' },
  'ga4gh-vrs': { source: 'GA4GH_VRS', name: 'GA4GH VRS 2.0 — términos del esquema' },
};

export const conceptId = (cs, code) => md5uuid(`mantra:genetics:concept:${cs}:${code}`);

/** Etiqueta de versión del code system: la de las filas, o la lista ordenada si el archivo mezcla fuentes de distintas versiones. */
export function versionLabel(versions) {
  // las filas de un sistema que mezcla archivos (p. ej. clinvar-terms) traen ya una lista «a + b»: se parte y se deduplica
  const v = [...new Set(versions.flatMap((x) => x.split(' + ')))].sort();
  if (v.length === 0) throw new Error('el corpus no declara versión');
  return v.join(' + ');
}

export function codeSystemPlan(cs, { version, license, checksum }) {
  const def = CODE_SYSTEMS[cs];
  if (!def) throw new Error(`code system sin definición de carga: ${cs}`);
  const src = SOURCES[def.source];
  return {
    source: { id: md5uuid(`mantra:genetics:source:${def.source}`), code: def.source, name: src.name, owner: src.owner, officialUrl: src.officialUrl, license },
    codeSystem: { id: md5uuid(`mantra:genetics:cs:${cs}`), internalCode: cs, name: def.name, canonicalUrl: def.canonicalUrl ?? `https://mantracore.health/fhir/CodeSystem/${cs}`, caseSensitive: true },
    version: { id: md5uuid(`mantra:genetics:csv:${cs}:${version}`), version, checksum },
  };
}

const propId = (row, code) => md5uuid(`mantra:genetics:property:${row.codeSystem}:${row.code}:${code}`);

/** Propiedades de procedencia + definición + las específicas del sistema. */
export function propertyTuples(row) {
  const cid = conceptId(row.codeSystem, row.code);
  const out = [];
  const seen = new Set();
  const add = (code, dataType, value) => {
    if (value == null || value === '') return;
    if (seen.has(code)) throw new Error(`${row.codeSystem} ${row.code}: propiedad repetida ${code}`);
    seen.add(code);
    out.push([propId(row, code), cid, code, dataType, JSON.stringify(value)]);
  };
  add('code_system', 'string', row.codeSystem);
  add('source', 'string', row.source);
  add('source_record_id', 'string', row.sourceRecordId);
  add('source_url', 'string', row.sourceUrl);
  add('source_version', 'string', row.version);
  add('source_retrieved_at', 'string', row.retrievedAt);
  add('source_input_sha256', 'string', row.sourceSha256);
  add('source_license', 'string', row.license);
  if (row.definition) add('source_definition', 'json', { lang: row.definition.lang, text: row.definition.text, ...(row.definition.refs?.length ? { refs: row.definition.refs } : {}) });
  for (const [code, dataType, value] of row.properties) add(code, dataType, value);
  return out;
}

export function conceptTuple(row, versionUuid) {
  return [conceptId(row.codeSystem, row.code), versionUuid, row.code, row.display, null, CONCEPT.TERM_ACTIVE];
}

export function designationTuples(row) {
  const cid = conceptId(row.codeSystem, row.code);
  return row.designations.map((d) => {
    if (d.lang !== 'en') throw new Error(`${row.codeSystem} ${row.code}: idioma sin concepto interno: ${d.lang}`);
    const type = d.type === 'preferred' ? CONCEPT.DESIG_PREFERRED : CONCEPT.DESIG_SYNONYM;
    return [md5uuid(`mantra:genetics:designation:${row.codeSystem}:${row.code}:${d.lang}:${d.type}:${d.value}`), cid, CONCEPT.LANG_EN, type, d.value, d.type === 'preferred'];
  });
}

/** is-a a padres del MISMO sistema que existan, y relaciones tipadas (`relations`) hacia otro sistema del corpus. */
export function relationshipTuples(row, codesOf) {
  const cid = conceptId(row.codeSystem, row.code);
  const out = [];
  row.parents.forEach((p, i) => {
    if (!codesOf(row.codeSystem)?.has(p)) return;
    out.push([md5uuid(`mantra:genetics:is-a:${row.codeSystem}:${row.code}:${p}`), cid, conceptId(row.codeSystem, p), CONCEPT.REL_IS_A, i]);
  });
  (row.relations ?? []).forEach((r, i) => {
    const type = RELATION_TYPES[r.type];
    if (!type) throw new Error(`${row.codeSystem} ${row.code}: tipo de relación sin concepto interno: ${r.type}`);
    if (!codesOf(r.system)?.has(r.code)) return;
    out.push([md5uuid(`mantra:genetics:${r.type}:${row.codeSystem}:${row.code}:${r.system}:${r.code}`), cid, conceptId(r.system, r.code), type, i]);
  });
  return out;
}

/**
 * Cruces por código exacto que la fuente publica. `resolve(system, code)` →
 * id del concepto destino o null si no está cargado (no se crea ningún
 * destino). La equivalencia queda NULA: un xref no afirma equivalencia exacta.
 */
export function mapTuples(row, resolve) {
  const cid = conceptId(row.codeSystem, row.code);
  const out = [];
  for (const m of row.maps) {
    for (const target of resolve(m.system, m.code)) {
      out.push([md5uuid(`mantra:genetics:map:${row.codeSystem}:${row.code}:${m.system}:${m.code}:${target}`), cid, target, null, m.context, row.version, CONCEPT.TERM_ACTIVE]);
    }
  }
  return out;
}
