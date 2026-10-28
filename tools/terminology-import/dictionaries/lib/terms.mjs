// =============================================================================
// Términos OBO → filas normalizadas del corpus de diccionarios (NDJSON).
//
// Reglas (las mismas del glosario ES, 97.4):
//  - Nombre, definición y sinónimos VERBATIM de la fuente, en su idioma (inglés
//    en todas las OBO): `lang: 'en'`. Nada se traduce ni se redacta.
//  - Sólo sinónimos EXACT pasan a designación (son equivalentes según la
//    fuente). NARROW/BROAD/RELATED quedan como dato, no como sinónimo.
//  - Relaciones: sólo las que el archivo DECLARA (is_a y `relationship:`), con
//    su predicado verificado contra el [Typedef] del propio archivo.
//  - Xrefs: tal cual, con su anotación; SNOMED CT, UMLS y MedDRA se descartan
//    (Bolivia no es miembro de SNOMED International; UMLS y MedDRA exigen
//    licencia) y se cuentan.
// =============================================================================

import { headerValue, typedefIndex } from './obo.mjs';

/**
 * Predicados que se cargan como relación tipada (concepto
 * `terminology:relationship:*` del backend). La clave es el id RO/BFO canónico;
 * `labels` son los nombres que tiene que tener su [Typedef] en el archivo
 * (si no coincide, se aborta: un id equivocado colaría relaciones falsas).
 */
export const LOADED_PREDICATES = {
  'BFO:0000050': { type: 'PART_OF', labels: ['part of', 'part_of'] },
  'RO:0002202': { type: 'DEVELOPS_FROM', labels: ['develops from', 'develops_from'] },
  'RO:0001025': { type: 'LOCATED_IN', labels: ['located in', 'located_in'] },
  'RO:0014001': { type: 'INFECTIOUS_AGENT', labels: ['disease has infectious agent'] },
  'MONDO:0100332': { type: 'INFECTIOUS_AGENT', labels: ['disease has primary infectious agent'] },
  'MONDO:0100333': { type: 'INFECTIOUS_AGENT', labels: ['disease caused by reactivation of latent infectious agent'] },
  'RO:0002451': { type: 'TRANSMITTED_BY', labels: ['transmitted by'] },
};

/** Nombres cortos sin xref RO (Sequence Ontology declara `part_of` a secas). */
const SHORT_PREDICATES = { part_of: 'BFO:0000050', develops_from: 'RO:0002202', located_in: 'RO:0001025', transmitted_by: 'RO:0002451' };

/** Prefijos de xref que NO se copian, con el motivo (queda en el reporte). */
export const DROPPED_XREF_PREFIXES = {
  SCTID: 'SNOMED CT: Bolivia no es miembro de SNOMED International',
  SNOMEDCT: 'SNOMED CT: Bolivia no es miembro de SNOMED International',
  SNOMEDCT_US: 'SNOMED CT: Bolivia no es miembro de SNOMED International',
  'SNOMEDCT_US_2023_09_01': 'SNOMED CT: Bolivia no es miembro de SNOMED International',
  UMLS: 'UMLS Metathesaurus: exige licencia UTS',
  UMLS_CUI: 'UMLS Metathesaurus: exige licencia UTS',
  MEDGEN: 'MedGen: identificadores derivados de UMLS',
  MedDRA: 'MedDRA: licencia comercial (MSSO)',
  MEDDRA: 'MedDRA: licencia comercial (MSSO)',
};

const xrefPrefix = (id) => String(id).split(':')[0];

/** Predicado del archivo → id canónico + nombre, según sus [Typedef]. */
export function canonicalPredicate(pred, typedefs) {
  const td = typedefs.get(pred);
  let canonical = td?.canonical ?? pred;
  if (!td && SHORT_PREDICATES[pred]) canonical = SHORT_PREDICATES[pred];
  else if (td && td.canonical === pred && !/^(RO|BFO|IDO|MONDO):\d+$/.test(canonical) && SHORT_PREDICATES[pred]) canonical = SHORT_PREDICATES[pred];
  return { canonical, label: td?.name ?? null };
}

/** Aborta si un predicado que se va a cargar tiene en el archivo un nombre distinto del esperado. */
export function assertPredicateLabels(typedefs, sourceId) {
  const bad = [];
  for (const [pred, td] of typedefs) {
    const { canonical } = canonicalPredicate(pred, typedefs);
    const spec = LOADED_PREDICATES[canonical];
    if (spec && td.name && !spec.labels.includes(td.name)) bad.push(`${pred} (→ ${canonical}): «${td.name}», se esperaba ${spec.labels.join(' | ')}`);
  }
  if (bad.length) throw new Error(`[${sourceId}] predicados con nombre inesperado: ${bad.join('; ')}`);
}

/** Xrefs conservados (con anotación) y conteo de descartados por prefijo. */
export function splitXrefs(xrefs, dropped, extraDropped = {}) {
  const kept = [];
  for (const x of xrefs) {
    const p = xrefPrefix(x.id);
    if (DROPPED_XREF_PREFIXES[p] || extraDropped[p]) {
      dropped[p] = (dropped[p] ?? 0) + 1;
      continue;
    }
    const sources = [].concat(x.qualifiers?.source ?? []);
    kept.push({
      id: x.id,
      ...(x.description ? { description: x.description } : {}),
      ...(sources.length ? { sources } : {}),
      // Mondo marca sus mapeos de identidad con source="MONDO:equivalentTo".
      equivalent: sources.includes('MONDO:equivalentTo'),
    });
  }
  return kept;
}

/**
 * Linaje humano: NCBITaxon:9606 y todos sus ancestros por is_a, a partir del
 * grafo de taxones ya cargado (mapa id → padres).
 */
export function humanLineage(parentsOf) {
  const out = new Set();
  const queue = ['NCBITaxon:9606'];
  while (queue.length) {
    const t = queue.shift();
    if (out.has(t)) continue;
    out.add(t);
    for (const p of parentsOf.get(t) ?? []) queue.push(p);
  }
  if (!out.has('NCBITaxon:1')) throw new Error('El linaje de Homo sapiens no llega a la raíz NCBITaxon:1: falta un eslabón en el módulo de taxones');
  return out;
}

/**
 * Términos que la fuente declara fuera de humanos: `in_taxon T` con T fuera del
 * linaje humano, o `never_in_taxon T` con T dentro. La exclusión baja por is_a y
 * part_of (una parte de la aleta es tan no humana como la aleta).
 */
export function nonHumanTerms(terms, typedefs, lineage) {
  const direct = new Set();
  for (const t of terms) {
    for (const r of t.relationships) {
      const { canonical } = canonicalPredicate(r.predicate, typedefs);
      const isIn = canonical === 'RO:0002162' || r.predicate === 'in_taxon' || r.predicate === 'only_in_taxon';
      const isNever = canonical === 'RO:0002161' || r.predicate === 'never_in_taxon';
      if (isIn && !lineage.has(r.target)) direct.add(t.id);
      if (isNever && lineage.has(r.target)) direct.add(t.id);
    }
  }
  const children = new Map();
  for (const t of terms) {
    const parents = [...t.isA.map((x) => x.target), ...t.relationships.filter((r) => canonicalPredicate(r.predicate, typedefs).canonical === 'BFO:0000050').map((r) => r.target)];
    for (const p of parents) {
      if (!children.has(p)) children.set(p, []);
      children.get(p).push(t.id);
    }
  }
  const out = new Set(direct);
  const queue = [...direct];
  while (queue.length) {
    for (const c of children.get(queue.shift()) ?? []) {
      if (!out.has(c)) {
        out.add(c);
        queue.push(c);
      }
    }
  }
  return { excluded: out, direct: direct.size };
}

/**
 * Fila del corpus para un término OBO. `ctx` = { source, typedefs, file, dataVersion, retrievedAt, droppedXrefs }.
 */
export function oboTermRow(t, ctx) {
  const { source } = ctx;
  const relations = [];
  const otherRelations = [];
  for (const p of t.isA) relations.push({ type: 'IS_A', predicate: 'is_a', target: p.target });
  for (const r of t.relationships) {
    const { canonical, label } = canonicalPredicate(r.predicate, ctx.typedefs);
    const spec = LOADED_PREDICATES[canonical];
    if (spec) relations.push({ type: spec.type, predicate: canonical, target: r.target });
    else otherRelations.push({ predicate: canonical, label, target: r.target });
  }
  const exact = [];
  const other = [];
  for (const s of t.synonyms) {
    // Sinónimos que la propia fuente atribuye a un tercero con licencia restrictiva (KEGG, DrugBank, HMDB, ChEMBL…): no se cargan.
    if (source.dropSynonym?.(s)) {
      ctx.droppedSynonyms[source.id] = (ctx.droppedSynonyms[source.id] ?? 0) + 1;
      continue;
    }
    if (s.scope === 'EXACT' && s.value !== t.name) exact.push(s.value);
    else if (s.value !== t.name) other.push({ value: s.value, scope: s.scope, ...(s.type ? { type: s.type } : {}) });
  }
  const code = source.codeOf ? source.codeOf(t.id) : t.id;
  return {
    key: `${source.codeSystem}|${code}`,
    codeSystem: source.codeSystem,
    code,
    domain: source.domain,
    lang: 'en',
    display: t.name,
    definition: t.def ?? null,
    definitionXrefs: t.defXrefs,
    synonymsExact: [...new Set(exact)],
    synonymsOther: other,
    xrefs: splitXrefs(t.xrefs, ctx.droppedXrefs, source.dropXrefPrefixes),
    subsets: t.subsets,
    namespace: t.namespace,
    altIds: t.altIds,
    relations,
    otherRelations,
    extra: source.extraOf ? source.extraOf(t) : {},
    provenance: provenance(source, t.id, ctx),
  };
}

/**
 * Rama y nivel de carga de cada término según la jerarquía is_a que publica la
 * fuente (no se elige a mano): `source.branches` = [{ root, domain, tier }], el
 * primero que contenga al término manda; `source.excludeRoots` saca ramas
 * enteras (p. ej. la rama de enfermedades de NCIt, que carga otra sesión).
 * Devuelve Map id → { excluded } | { domain, tier }.
 */
export function assignBranches(terms, source) {
  const byId = new Map(terms.map((t) => [t.id, t]));
  const children = new Map();
  for (const t of terms) for (const p of t.isA) {
    if (!children.has(p.target)) children.set(p.target, []);
    children.get(p.target).push(t.id);
  }
  const below = (root) => {
    if (!byId.has(root)) throw new Error(`[${source.id}] la raíz de rama ${root} no está en el archivo: el formato o la versión cambiaron`);
    const seen = new Set([root]);
    const queue = [root];
    while (queue.length) for (const c of children.get(queue.shift()) ?? []) if (!seen.has(c)) { seen.add(c); queue.push(c); }
    return seen;
  };
  const excluded = new Set();
  for (const r of source.excludeRoots ?? []) for (const id of below(r)) excluded.add(id);
  const branchSets = (source.branches ?? []).map((b) => ({ ...b, ids: below(b.root) }));
  const out = new Map();
  for (const t of terms) {
    if (excluded.has(t.id)) { out.set(t.id, { excluded: true }); continue; }
    const b = branchSets.find((x) => x.ids.has(t.id));
    out.set(t.id, b ? { domain: b.domain, tier: b.tier, branch: b.root } : { domain: source.fallbackDomain ?? source.domain, tier: source.tierOf ? source.tierOf(t) : source.fallbackTier ?? 'default', branch: null });
  }
  return out;
}

export function provenance(source, id, ctx) {
  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceTermId: id,
    version: source.version ?? ctx.dataVersion ?? null,
    dataVersion: ctx.dataVersion ?? null,
    uri: source.termUri(id),
    fileUrl: ctx.file.url,
    fileSha256: ctx.file.sha256,
    retrievedAt: ctx.file.retrievedAt,
    license: source.license,
    licenseUrl: source.licenseUrl,
  };
}

/**
 * Archivo OBO parseado → filas de UNA fuente: sólo ids propios, sin obsoletos,
 * sin los que la fuente declara fuera de humanos (si `source.humanOnly`).
 */
export function oboSourceRows(parsed, source, file, { lineage } = {}) {
  const typedefs = typedefIndex(parsed.typedefs);
  // Predicados que la fuente define de forma ambigua (BTO: «derives from/develops from»
  // mezcla dos relaciones de la RO): no se cargan tipados, quedan como dato.
  for (const p of source.unmappedPredicates ?? []) {
    const td = typedefs.get(p);
    if (td) typedefs.set(p, { ...td, canonical: `${source.id}:${p}` });
  }
  assertPredicateLabels(typedefs, source.id);
  const own = parsed.terms.filter((t) => t.id && source.idPrefixes.includes(t.id.split(':')[0]));
  const stats = { terms: parsed.terms.length, own: own.length, obsolete: 0, unnamed: 0, nonHuman: 0, nonHumanDirect: 0, droppedXrefs: {} };
  let excluded = new Set();
  if (source.humanOnly) {
    if (!lineage) throw new Error(`[${source.id}] humanOnly exige el linaje humano (taxones)`);
    const r = nonHumanTerms(own, typedefs, lineage);
    excluded = r.excluded;
    stats.nonHumanDirect = r.direct;
  }
  const dataVersion = headerValue(parsed.header, 'data-version');
  if (source.expectDataVersion && dataVersion !== source.expectDataVersion) {
    throw new Error(`[${source.id}] data-version «${dataVersion}» distinta de la fijada «${source.expectDataVersion}»: el archivo bajado no es el que describe el registro`);
  }
  const droppedSynonyms = source.dropSynonym ? (stats.droppedSynonyms = {}) : {};
  const ctx = { source, typedefs, file, dataVersion, droppedXrefs: stats.droppedXrefs, droppedSynonyms };
  const assigned = source.branches || source.excludeRoots ? assignBranches(own.filter((t) => !t.obsolete && t.name), source) : null;
  if (assigned) { stats.excludedBranch = 0; stats.byDomain = {}; stats.byTier = {}; }
  const rows = [];
  for (const t of own) {
    if (t.obsolete) { stats.obsolete++; continue; }
    if (!t.name) { stats.unnamed++; continue; }
    if (excluded.has(t.id)) { stats.nonHuman++; continue; }
    const a = assigned?.get(t.id);
    if (a?.excluded) { stats.excludedBranch++; continue; }
    const row = oboTermRow(t, ctx);
    if (a) {
      row.domain = a.domain;
      row.tier = a.tier;
      stats.byDomain[a.domain] = (stats.byDomain[a.domain] ?? 0) + 1;
      stats.byTier[a.tier] = (stats.byTier[a.tier] ?? 0) + 1;
    }
    rows.push(row);
  }
  stats.rows = rows.length;
  stats.dataVersion = ctx.dataVersion;
  return { rows, stats };
}
