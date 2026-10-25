// =============================================================================
// Plan de carga de TÉRMINOS (puro, sin base): filas del corpus → tuplas de
// `terminology.*`. Probable sin Postgres y usado por `load-symptoms.mjs`.
//
// Ids: `md5('mantra:symptoms:<tipo>:<clave>')::uuid`, como el resto de
// `tools/terminology-import/`. Conceptos internos y value sets del glosario:
// los ids que ya siembra el backend (`deterministicId`).
//
// Idioma: `display` = nombre oficial en castellano cuando la fuente lo publica
// (traducción OFICIAL de HPO); si no, el nombre de la fuente en inglés. Las
// designaciones dicen el idioma de cada nombre. La definición de la fuente está
// en inglés: va a la propiedad `source_definition` con su idioma, no a la
// columna `definition` (que la API muestra como texto en castellano).
// =============================================================================

import { md5uuid, valueSetMemberId, valueSetVersionId } from '../../lib/glossary-es/load-plan.mjs';
import { deterministicId } from '../../lib/glossary-es/common.mjs';

export { md5uuid };

export const CONCEPT = {
  TERM_ACTIVE: deterministicId('terminology:state:active'),
  LANG_ES: deterministicId('terminology:language:es'),
  LANG_EN: deterministicId('terminology:language:en'),
  DESIG_PREFERRED: deterministicId('terminology:designation-type:preferred'),
  DESIG_SYNONYM: deterministicId('terminology:designation-type:synonym'),
  REL_IS_A: deterministicId('terminology:relationship:is-a'),
};

/**
 * Un code system por fuente. Las URL canónicas son las que publica cada fuente
 * (HPO y NCIt figuran así en HL7 Terminology); SYMP no tiene una registrada en
 * HL7 y se usa su PURL de OBO.
 */
export const CODE_SYSTEMS = {
  hpo: {
    sourceCode: 'HPO_CONSORTIUM',
    sourceName: 'Human Phenotype Ontology (HPO Consortium / Monarch Initiative)',
    owner: 'Human Phenotype Ontology Consortium — The Jackson Laboratory / Monarch Initiative',
    officialUrl: 'https://hpo.jax.org/',
    name: 'Human Phenotype Ontology (HPO)',
    canonicalUrl: 'http://human-phenotype-ontology.org',
    caseSensitive: true,
  },
  symp: {
    sourceCode: 'DO_SYMPTOM_ONTOLOGY',
    sourceName: 'Symptom Ontology (Disease Ontology project)',
    owner: 'Institute for Genome Sciences, University of Maryland School of Medicine',
    officialUrl: 'https://github.com/DiseaseOntology/SymptomOntology',
    name: 'Symptom Ontology (SYMP)',
    canonicalUrl: 'http://purl.obolibrary.org/obo/symp.owl',
    caseSensitive: true,
  },
  ncit: {
    sourceCode: 'NCI_EVS',
    sourceName: 'National Cancer Institute — Enterprise Vocabulary Services (NCI EVS)',
    owner: 'National Cancer Institute — Enterprise Vocabulary Services',
    officialUrl: 'https://evs.nci.nih.gov/',
    // «NCI Thesaurus» identifica sólo la edición publicada por NCI: un subconjunto
    // no se nombra así (docs/terminology-expansion/SOURCE-REGISTER.md).
    name: 'Subconjunto de signos, síntomas y hallazgos clínicos de la NCIt OBO Edition',
    canonicalUrl: 'http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl',
    caseSensitive: true,
  },
};

export const conceptId = (cs, code) => md5uuid(`mantra:symptoms:concept:${cs}:${code}`);
export const versionId = (cs, version) => md5uuid(`mantra:symptoms:csv:${cs}:${version}`);

export function codeSystemPlan(cs, rows, license) {
  const def = CODE_SYSTEMS[cs];
  if (!def) throw new Error(`code system sin definición de carga: ${cs}`);
  const version = rows[0]?.version;
  if (!version) throw new Error(`${cs}: las filas no declaran versión`);
  return {
    source: { id: md5uuid(`mantra:symptoms:source:${def.sourceCode}`), code: def.sourceCode, name: def.sourceName, owner: def.owner, officialUrl: def.officialUrl, license },
    codeSystem: { id: md5uuid(`mantra:symptoms:cs:${cs}`), internalCode: cs, name: def.name, canonicalUrl: def.canonicalUrl, caseSensitive: def.caseSensitive },
    version: { id: versionId(cs, version), version },
  };
}

const prop = (row, code, dataType, value) => ({ id: md5uuid(`mantra:symptoms:property:${row.codeSystem}:${row.code}:${code}`), conceptId: conceptId(row.codeSystem, row.code), code, dataType, value });

/** Nombre a mostrar: castellano oficial si existe; si no, el de la fuente. */
export const displayOf = (row) => row.esName ?? row.enName;

export function conceptTuple(row, versionUuid) {
  return [conceptId(row.codeSystem, row.code), versionUuid, row.code, displayOf(row), null, CONCEPT.TERM_ACTIVE];
}

export function designationsFor(row) {
  const cid = conceptId(row.codeSystem, row.code);
  const key = (k) => md5uuid(`mantra:symptoms:designation:${row.codeSystem}:${row.code}:${k}`);
  const out = [];
  if (row.enName) out.push({ id: key('en:preferred'), conceptId: cid, lang: CONCEPT.LANG_EN, type: CONCEPT.DESIG_PREFERRED, value: row.enName, preferred: true });
  if (row.esName) out.push({ id: key('es:preferred'), conceptId: cid, lang: CONCEPT.LANG_ES, type: CONCEPT.DESIG_PREFERRED, value: row.esName, preferred: true });
  // Sólo los sinónimos EXACT son sinónimos; los RELATED/BROAD/NARROW quedan en
  // la propiedad `synonyms` con su alcance (no se presentan como equivalentes).
  const seen = new Set([row.enName?.toLowerCase()]);
  for (const s of row.synonyms) {
    if (s.scope !== 'EXACT' || seen.has(s.text.toLowerCase())) continue;
    seen.add(s.text.toLowerCase());
    out.push({ id: key(`en:synonym:${s.text}`), conceptId: cid, lang: CONCEPT.LANG_EN, type: CONCEPT.DESIG_SYNONYM, value: s.text, preferred: false });
  }
  return out;
}

export function propertiesFor(row, labelOf) {
  const str = (code, v) => (v == null || v === '' ? [] : [prop(row, code, 'string', String(v))]);
  const js = (code, v) => (v == null || (Array.isArray(v) && v.length === 0) ? [] : [prop(row, code, 'json', v)]);
  return [
    ...str('code_system', row.codeSystem),
    ...str('source', row.source),
    ...str('source_record_id', row.sourceRecordId),
    ...str('source_url', row.sourceUri),
    ...str('source_version', row.version),
    ...str('source_retrieved_at', row.retrievedAt),
    ...str('source_license', row.license),
    ...js('source_definition', row.definition ? { lang: row.definitionLang, text: row.definition, refs: row.definitionRefs ?? [] } : null),
    ...js('es_name_provenance', row.esName ? { kind: row.esNameKind, source: 'HPO Translation Project — hp-es.babelon.tsv (translation_status = OFFICIAL)', url: 'https://github.com/obophenotype/hpo-translations/blob/main/babelon/hp-es.babelon.tsv' } : null),
    ...js('synonyms', row.synonyms.length ? row.synonyms : null),
    ...js('alt_ids', row.altIds),
    ...js('xrefs', row.xrefs.map((x) => `${x.system}:${x.code}`)),
    ...js('body_systems', row.systems.map((s) => { const l = labelOf(row.codeSystem, s); return { code: s, en: l.en ?? row.systemLabels?.[s] ?? null, es: l.es ?? null }; })),
    ...str('subontology', row.subontology),
    ...js('semantic_types', row.semanticTypes ?? null),
    ...str('scope_rule', row.scopeRule ?? null),
    ...js('source_comments', row.comments?.length ? row.comments : null),
  ];
}

export function isARelationships(row) {
  return row.parents.map((p, i) => ({
    id: md5uuid(`mantra:symptoms:is-a:${row.codeSystem}:${row.code}:${p}`),
    source: conceptId(row.codeSystem, row.code),
    target: conceptId(row.codeSystem, p),
    type: CONCEPT.REL_IS_A,
    ordinal: i,
  }));
}

/**
 * Cruces declarados por la fuente hacia otro sistema de este corpus (hoy: HPO
 * → NCIt). Un xref no afirma equivalencia exacta: `equivalence_concept_id`
 * queda nulo y `context` dice quién lo declaró.
 */
export function mapsFor(row, codesBySystem) {
  const out = [];
  for (const x of row.xrefs) {
    if (x.system === 'NCIT' && row.codeSystem !== 'ncit' && codesBySystem.ncit?.has(x.code)) {
      out.push({
        id: md5uuid(`mantra:symptoms:map:${row.codeSystem}:${row.code}:ncit:${x.code}`),
        source: conceptId(row.codeSystem, row.code),
        target: conceptId('ncit', x.code),
        context: `xref declarado por ${row.codeSystem.toUpperCase()} ${row.code} (database_cross_reference)`,
        version: row.version,
      });
    }
  }
  return out;
}

// --- Glosario (opcional, `--glossary`) ----------------------------------------

export const GLOSSARY_VALUE_SETS = ['glossary-all-terms', 'glossary-category-signs-symptoms'];

/**
 * El glosario está activado por defecto (decisión del propietario, 2026-10-24);
 * `--no-glossary` lo apaga. `--glossary` se sigue aceptando y no cambia nada.
 */
export const glossaryEnabled = (args) => !args.includes('--no-glossary');

/** ¿Entra al glosario? Fenotipos de HPO con nombre OFICIAL en castellano. */
export const isGlossaryTerm = (row) => row.codeSystem === 'hpo' && row.subontology === 'HP:0000118' && Boolean(row.esName);

export const glossarySlug = (row) => `hpo-${row.code.toLowerCase().replace(':', '-')}`;

export function glossaryFor(row) {
  const cid = conceptId(row.codeSystem, row.code);
  return {
    memberships: GLOSSARY_VALUE_SETS.map((vs) => ({ id: valueSetMemberId(vs, cid), versionId: valueSetVersionId(vs), conceptId: cid })),
    properties: [
      prop(row, 'glossary-slug', 'string', glossarySlug(row)),
      prop(row, 'source_name', 'string', 'Human Phenotype Ontology — nombre oficial en castellano (HPO Translation Project)'),
      prop(row, 'glossary-external-ids', 'json', { hpo: row.code }),
      prop(row, 'glossary-provenance', 'json', { reviewStatus: 'external-source', categoryRule: 'HPO: descendiente de HP:0000118 (Phenotypic abnormality) con traducción OFFICIAL', imageMatch: null }),
    ],
  };
}
