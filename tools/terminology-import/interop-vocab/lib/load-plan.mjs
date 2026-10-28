// =============================================================================
// Plan de carga (puro, sin base): del corpus normalizado (data/) a las tuplas de `terminology.*`.
// Ids deterministas (md5 de una clave propia) → la carga es idempotente con ON CONFLICT DO NOTHING.
// =============================================================================

import { createReadStream, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';
import {
  INTERNAL,
  SOURCE_DEFS,
  codeSystemRowId,
  codeSystemVersionRowId,
  conceptRowId,
  md5uuid,
  memberRowId,
  sourceRowId,
  valueSetRowId,
  valueSetVersionRowId,
} from './model.mjs';

async function* readNdjsonGz(path) {
  const rl = createInterface({ input: createReadStream(path).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const line of rl) if (line.trim() !== '') yield JSON.parse(line);
}

/** Lee todo data/ (o la carpeta de un build alterno). Devuelve arrays; ~55 000 conceptos caben de sobra en memoria. */
export async function readCorpus(dir) {
  const need = (f) => {
    const p = join(dir, f);
    if (!existsSync(p)) throw new Error(`Falta ${p}: corré build-interop-vocab.mjs`);
    return p;
  };
  const out = { codeSystems: [], concepts: [], valueSets: [], conceptMaps: [] };
  for await (const r of readNdjsonGz(need('interop-vocab-codesystems.ndjson.gz'))) out.codeSystems.push(r);
  const parts = readdirSync(dir).filter((f) => /^interop-vocab-concepts\.part-\d+\.ndjson\.gz$/.test(f)).sort();
  if (!parts.length) throw new Error(`Sin partes de conceptos en ${dir}`);
  for (const f of parts) for await (const r of readNdjsonGz(join(dir, f))) out.concepts.push(r);
  for await (const r of readNdjsonGz(need('interop-vocab-valuesets.ndjson.gz'))) out.valueSets.push(r);
  for await (const r of readNdjsonGz(need('interop-vocab-conceptmaps.ndjson.gz'))) out.conceptMaps.push(r);
  return out;
}

// --- piezas -----------------------------------------------------------------------------------------

const RESERVED_PROPS = new Set(['interop_provenance', 'source_license', 'source_url', 'source_retrieved_at', 'source_sha256', 'fhir_designations', 'fhir_parent', 'fhir_extensions', 'display_source']);
const dataTypeOf = (v) => (typeof v === 'string' ? 'string' : typeof v === 'boolean' ? 'boolean' : Number.isInteger(v) ? 'integer' : typeof v === 'number' ? 'decimal' : 'json');
const prop = (conceptId, code, value) => ({ id: md5uuid(`mantra:interop-vocab:property:${conceptId}:${code}`), conceptId, code, dataType: dataTypeOf(value), value });
const validDate = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) || !/^\d{4}-\d{2}-\d{2}/.test(s) ? null : d.toISOString();
};
const keyOf = (cs, version) => `${cs}\u0000${version}`;

/** Propiedades de un concepto (la procedencia siempre; lo que la fuente no trae no genera fila). */
export function propertiesFor(c, conceptId, { createsHierarchy }) {
  const p = c.provenance;
  const out = [
    prop(conceptId, 'interop_provenance', { codeSystem: c.cs, version: c.version, code: c.code, ...p }),
    prop(conceptId, 'source_license', p.license),
    prop(conceptId, 'source_url', p.sourceUrl),
    prop(conceptId, 'source_retrieved_at', p.retrievedAt),
  ];
  if (p.sourceSha256 ?? p.artifactSha256) out.push(prop(conceptId, 'source_sha256', p.sourceSha256 ?? p.artifactSha256));
  if (c.displayFallback) out.push(prop(conceptId, 'display_source', 'code (la fuente no trae display; catalog_concepts.display es NOT NULL)'));
  for (const [k, v] of Object.entries(c.properties ?? {})) {
    if (v === null || v === undefined) continue;
    if (RESERVED_PROPS.has(k)) throw new Error(`propiedad de la fuente con nombre reservado: ${k} (${c.cs} ${c.code})`);
    out.push(prop(conceptId, k, v));
  }
  if (c.designations?.length) out.push(prop(conceptId, 'fhir_designations', c.designations));
  if (c.extensions?.length) out.push(prop(conceptId, 'fhir_extensions', c.extensions));
  if (c.parents?.length && !createsHierarchy) out.push(prop(conceptId, 'fhir_parent', c.parents));
  return out;
}

/** Designaciones en inglés, español o sin idioma → `concept_designations`. El resto de los idiomas queda sólo en `fhir_designations`. */
export function designationsFor(c, conceptId) {
  const out = [];
  (c.designations ?? []).forEach((d, i) => {
    const lang = d.language ? d.language.toLowerCase().split('-')[0] : null;
    if (lang !== null && !INTERNAL.LANG[lang]) return;
    const preferred = d.use?.code === 'preferredForLanguage';
    out.push({
      id: md5uuid(`mantra:interop-vocab:designation:${conceptId}:${i}`),
      conceptId,
      lang: lang ? INTERNAL.LANG[lang] : null,
      type: preferred ? INTERNAL.DESIG_PREFERRED : INTERNAL.DESIG_SYNONYM,
      value: d.value,
      preferred,
    });
  });
  return out;
}

/** Cuántas relaciones jerárquicas se crean: sólo si la fuente declara el significado del árbol. */
const hierarchyType = (cs) => (cs.hierarchyMeaning === 'is-a' ? INTERNAL.REL_IS_A : cs.hierarchyMeaning === 'part-of' ? INTERNAL.REL_PART_OF : null);

/** Plan completo. `corpus` = salida de readCorpus. */
export function buildPlan(corpus) {
  // fuentes
  const sourceCodes = [...new Set(corpus.codeSystems.map((s) => s.sourceCode))].sort();
  for (const c of sourceCodes) if (!SOURCE_DEFS[c]) throw new Error(`fuente sin definición: ${c}`);
  const sources = sourceCodes.map((code) => ({ id: sourceRowId(code), code, ...SOURCE_DEFS[code] }));

  // code systems (uno por internal_code) y ediciones (versiones)
  const csByCode = new Map();
  for (const s of corpus.codeSystems) {
    const list = csByCode.get(s.internalCode) ?? [];
    list.push(s);
    csByCode.set(s.internalCode, list);
  }
  const codeSystems = [...csByCode.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([internalCode, editions]) => {
    const def = editions.find((e) => e.isDefault) ?? editions[0];
    const urls = new Set(editions.map((e) => e.canonicalUrl));
    if (urls.size !== 1) throw new Error(`${internalCode}: URL canónica distinta entre ediciones`);
    return {
      id: codeSystemRowId(internalCode),
      internalCode,
      name: def.name,
      canonicalUrl: def.canonicalUrl,
      oid: def.oid ?? null,
      caseSensitive: def.caseSensitive ?? null,
      supportsComposition: def.compositional ?? null,
      state: def.state,
      sourceCode: def.sourceCode,
    };
  });
  const editions = corpus.codeSystems.map((s) => ({
    id: codeSystemVersionRowId(s.internalCode, s.version),
    codeSystemId: codeSystemRowId(s.internalCode),
    internalCode: s.internalCode,
    version: s.version,
    publishedAt: validDate(s.date),
    checksum: s.provenance.sourceSha256 ?? s.provenance.artifactSha256 ?? null,
    isDefault: s.isDefault,
    state: s.state,
    sourceCode: s.sourceCode,
    concepts: s.concepts,
    hierarchy: hierarchyType(s),
  }));
  const editionByKey = new Map(editions.map((e) => [keyOf(e.internalCode, e.version), e]));

  // conceptos
  const ids = new Set();
  const concepts = [];
  const properties = [];
  const designations = [];
  const relationships = [];
  const stats = { parentsDeclaredButUnresolved: 0, languagesOnlyInProperty: 0 };
  const knownCodes = new Map(); // edición → Set(code)
  for (const c of corpus.concepts) {
    const ed = editionByKey.get(keyOf(c.cs, c.version));
    if (!ed) throw new Error(`concepto sin edición: ${c.cs} ${c.version} ${c.code}`);
    if (!knownCodes.has(ed)) knownCodes.set(ed, new Set());
    knownCodes.get(ed).add(c.code);
  }
  for (const c of corpus.concepts) {
    const ed = editionByKey.get(keyOf(c.cs, c.version));
    const id = conceptRowId(c.cs, c.version, c.code);
    if (ids.has(id)) throw new Error(`concepto repetido: ${c.cs} ${c.version} ${c.code}`);
    ids.add(id);
    concepts.push({ id, versionId: ed.id, editionKey: keyOf(c.cs, c.version), code: c.code, display: c.display, definition: c.definition ?? null, abstract: !!c.abstract, selectable: !!c.selectable, state: c.state });
    properties.push(...propertiesFor(c, id, { createsHierarchy: ed.hierarchy !== null }));
    designations.push(...designationsFor(c, id));
    if (ed.hierarchy) {
      (c.parents ?? []).forEach((parent, i) => {
        if (!knownCodes.get(ed).has(parent)) {
          stats.parentsDeclaredButUnresolved++;
          return;
        }
        const target = conceptRowId(c.cs, c.version, parent);
        relationships.push({ id: md5uuid(`mantra:interop-vocab:rel:${ed.hierarchy}:${id}:${target}`), source: id, target, type: ed.hierarchy, ordinal: i });
      });
    }
  }

  // value sets
  const vsByCode = new Map();
  for (const v of corpus.valueSets) {
    const list = vsByCode.get(v.internalCode) ?? [];
    list.push(v);
    vsByCode.set(v.internalCode, list);
  }
  const valueSets = [...vsByCode.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([internalCode, eds]) => {
    const def = eds.find((e) => e.isDefault) ?? eds[0];
    return { id: valueSetRowId(internalCode), internalCode, name: def.name, canonicalUrl: def.canonicalUrl, description: def.description ?? null, state: def.state };
  });
  const valueSetVersions = corpus.valueSets.map((v) => ({ id: valueSetVersionRowId(v.internalCode, v.version), valueSetId: valueSetRowId(v.internalCode), version: v.version, isDefault: v.isDefault, state: v.state }));
  const members = [];
  for (const v of corpus.valueSets) {
    const vsvId = valueSetVersionRowId(v.internalCode, v.version);
    v.members.forEach(([cs, ver, code], i) => {
      const conceptId = conceptRowId(cs, ver, code);
      if (!ids.has(conceptId)) throw new Error(`el value set ${v.canonicalUrl}|${v.version} incluye ${cs}|${ver}|${code}, que no está en el corpus`);
      members.push({ id: memberRowId(vsvId, conceptId), versionId: vsvId, conceptId, ordinal: i });
    });
  }

  // concept maps
  const conceptMaps = corpus.conceptMaps.map((m) => {
    const source = conceptRowId(m.source.cs, m.source.version, m.source.code);
    const target = conceptRowId(m.target.cs, m.target.version, m.target.code);
    if (!ids.has(source) || !ids.has(target)) throw new Error(`ConceptMap ${m.mapUrl}: extremo fuera del corpus (${m.source.code} → ${m.target.code})`);
    return { id: md5uuid(`mantra:interop-vocab:map:${m.mapUrl}|${m.mapVersion}:${source}:${target}:${m.relationship}`), source, target, equivalence: INTERNAL.EQUIVALENCE[m.equivalence], context: m.mapUrl, version: m.mapVersion };
  });

  return { sources, codeSystems, editions, concepts, properties, designations, relationships, valueSets, valueSetVersions, members, conceptMaps, stats };
}

/** Conceptos internos que la carga necesita y que siembra la API. */
export function requiredInternalIds() {
  return {
    'state:active': INTERNAL.STATE.active,
    'state:draft': INTERNAL.STATE.draft,
    'state:retired': INTERNAL.STATE.retired,
    'state:deprecated': INTERNAL.STATE.deprecated,
    'language:en': INTERNAL.LANG.en,
    'language:es': INTERNAL.LANG.es,
    'designation-type:preferred': INTERNAL.DESIG_PREFERRED,
    'designation-type:synonym': INTERNAL.DESIG_SYNONYM,
    'relationship:is-a': INTERNAL.REL_IS_A,
    'relationship:part-of': INTERNAL.REL_PART_OF,
    'content-type:complete': INTERNAL.CS_CONTENT_COMPLETE,
    'equivalence:equivalent': INTERNAL.EQUIVALENCE.equivalent,
    'equivalence:wider': INTERNAL.EQUIVALENCE.wider,
    'equivalence:narrower': INTERNAL.EQUIVALENCE.narrower,
    'equivalence:inexact': INTERNAL.EQUIVALENCE.inexact,
    'equivalence:unmatched': INTERNAL.EQUIVALENCE.unmatched,
  };
}
