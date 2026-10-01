// =============================================================================
// Relaciones clínicas del glosario desde Wikidata (CC0): enfermedad →
// síntomas (P780), medicamento o terapia (P2176), especialidad (P1995),
// tratamiento posible (P924), exámenes (P923) y localización anatómica (P927).
//
// Funciones puras. El importador (`import-wikidata-relations.mjs`) baja las
// ARISTAS tal como las declara Wikidata; acá se resuelven contra el corpus y se
// convierten en `relations` de las fichas, en los dos sentidos.
//
// Reglas de resolución — un código IDÉNTICO declarado por Wikidata, nunca un
// nombre parecido (regla 97.4):
//  - Enfermedad (origen): su CIE-10 OMS (P494) o ICD-10-CM (P4229) = código de
//    una ficha CIE-10-ES del glosario; si no, su MeSH (P486) = MeSH de un tema
//    de MedlinePlus. Sin ficha de origen, la arista se descarta.
//  - Destino: CIE-10 → ficha CIE-10-ES (p. ej. los síntomas del cap. R); ATC →
//    principio activo de CIMA; MeSH → tema de MedlinePlus; Q-id → estructura de
//    anatomía ya importada. Si no hay ficha y la propiedad lo permite, se crea
//    una con la etiqueta y la descripción en castellano de Wikidata. La
//    localización anatómica NUNCA crea fichas: sólo enlaza a las verificadas.
// =============================================================================

import { NO_IMAGE, assertRow } from './common.mjs';

export const WIKIDATA_LICENSE = 'CC0 1.0 (Wikidata, dominio público)';

/**
 * Cada propiedad: tipo de relación desde la enfermedad, tipo inverso desde el
 * destino, y cómo se crea la ficha del destino cuando no existe en el corpus.
 */
export const RELATION_PROPERTIES = {
  P780: { label: 'symptoms and signs', forward: 'SYMPTOM', inverse: 'DISEASE', create: { categoryKey: 'signs-symptoms', prefix: 'sintoma', noun: 'síntoma o signo' } },
  P2176: { label: 'drug or therapy used for treatment', forward: 'TREATMENT', inverse: 'DISEASE', create: { categoryKey: null, prefix: 'tratamiento', noun: 'medicamento o terapia' } },
  P1995: { label: 'health specialty', forward: 'SPECIALTY', inverse: 'DISEASE', create: { categoryKey: 'specialty', prefix: 'especialidad', noun: 'especialidad sanitaria' } },
  P924: { label: 'possible treatment', forward: 'TREATMENT', inverse: 'DISEASE', create: { categoryKey: 'treatment', prefix: 'tratamiento', noun: 'tratamiento posible' } },
  P923: { label: 'medical examination', forward: 'DIAGNOSTIC_TEST', inverse: 'DISEASE', create: { categoryKey: 'diagnostic-test', prefix: 'prueba', noun: 'examen médico' } },
  P927: { label: 'anatomical location', forward: 'ANATOMY', inverse: 'DISEASE', create: null },
};

/**
 * Clase que tiene que alcanzar el destino (P31/P279*) para que la arista valga.
 * P1995 la necesita: sin ella entraban «Veterinaria», «Pedagogía», «Pediatra»
 * (una profesión) o «Disciplina académica» como especialidades.
 */
export const TARGET_CLASS = { P1995: 'Q930752' }; // medical specialty

/** Consulta SPARQL de una propiedad: enfermedad con código + destino con etiqueta ES. */
export function relationSparql(prop) {
  const cls = TARGET_CLASS[prop] ? `\n  ?x wdt:P31/wdt:P279* wd:${TARGET_CLASS[prop]} .` : '';
  return `SELECT ?d ?dIcd ?dIcdCm ?dMesh ?dEs ?x ?xEs ?xDesc ?xEn ?xIcd ?xIcdCm ?xAtc ?xMesh WHERE {
  ?d wdt:${prop} ?x .${cls}
  { ?d wdt:P494 ?dIcd } UNION { ?d wdt:P4229 ?dIcdCm } UNION { ?d wdt:P486 ?dMesh }
  ?x rdfs:label ?xEs FILTER(LANG(?xEs) = "es")
  OPTIONAL { ?d rdfs:label ?dEs FILTER(LANG(?dEs) = "es") }
  OPTIONAL { ?x schema:description ?xDesc FILTER(LANG(?xDesc) = "es") }
  OPTIONAL { ?x rdfs:label ?xEn FILTER(LANG(?xEn) = "en") }
  OPTIONAL { ?x wdt:P494 ?xIcd }
  OPTIONAL { ?x wdt:P4229 ?xIcdCm }
  OPTIONAL { ?x wdt:P267 ?xAtc }
  OPTIONAL { ?x wdt:P486 ?xMesh }
}`;
}

/**
 * Ítems con código CIE-10 (P494/P4229), con su descriptor MeSH (P486) y su
 * descripción en castellano si los tienen. Con MeSH, son la misma enfermedad
 * vista desde CIE-10-ES y desde MedlinePlus.
 */
export const IDENTITY_SPARQL = `SELECT ?d ?icd ?icdCm ?mesh ?desc WHERE {
  { ?d wdt:P494 ?icd } UNION { ?d wdt:P4229 ?icdCm }
  OPTIONAL { ?d wdt:P486 ?mesh }
  OPTIONAL { ?d schema:description ?desc FILTER(LANG(?desc) = "es") }
}`;

const qid = (uri) => String(uri ?? '').split('/').pop() || null;

/** Bindings de `IDENTITY_SPARQL` → una identidad por ítem, códigos ordenados. */
export function conceptIdentities(json) {
  const byQ = new Map();
  for (const b of json?.results?.bindings ?? []) {
    const q = qid(b.d?.value);
    if (!q) continue;
    const it = byQ.get(q) ?? { q, icd10: new Set(), icd10cm: new Set(), mesh: new Set(), descEs: null };
    it.descEs ??= b.desc?.value ?? null;
    if (b.icd?.value) it.icd10.add(b.icd.value);
    if (b.icdCm?.value) it.icd10cm.add(b.icdCm.value);
    if (b.mesh?.value) it.mesh.add(b.mesh.value);
    byQ.set(q, it);
  }
  return [...byQ.values()]
    .map((it) => ({ q: it.q, icd10: [...it.icd10].sort(), icd10cm: [...it.icd10cm].sort(), mesh: [...it.mesh].sort(), descEs: it.descEs }))
    .sort((a, b) => a.q.localeCompare(b.q));
}
const add = (set, v) => (v ? set.add(v) : set);

/**
 * Bindings de una propiedad → aristas agregadas (una por enfermedad+destino),
 * con todos los códigos de cada lado. Determinista: códigos ordenados.
 */
export function relationEdges(json, prop) {
  const byKey = new Map();
  for (const b of json?.results?.bindings ?? []) {
    const d = qid(b.d?.value);
    const x = qid(b.x?.value);
    if (!d || !x || d === x) continue;
    const key = `${d}|${x}`;
    const e = byKey.get(key) ?? {
      property: prop, diseaseQ: d, diseaseEs: null, targetQ: x, targetEs: b.xEs.value, targetDescEs: null, targetEn: null,
      disease: { icd10: new Set(), icd10cm: new Set(), mesh: new Set() },
      target: { icd10: new Set(), icd10cm: new Set(), atc: new Set(), mesh: new Set() },
    };
    e.diseaseEs ??= b.dEs?.value ?? null;
    e.targetDescEs ??= b.xDesc?.value ?? null;
    e.targetEn ??= b.xEn?.value ?? null;
    add(e.disease.icd10, b.dIcd?.value);
    add(e.disease.icd10cm, b.dIcdCm?.value);
    add(e.disease.mesh, b.dMesh?.value);
    add(e.target.icd10, b.xIcd?.value);
    add(e.target.icd10cm, b.xIcdCm?.value);
    add(e.target.atc, b.xAtc?.value);
    add(e.target.mesh, b.xMesh?.value);
    byKey.set(key, e);
  }
  const sorted = (s) => [...s].sort();
  return [...byKey.values()]
    .map((e) => ({
      ...e,
      disease: { icd10: sorted(e.disease.icd10), icd10cm: sorted(e.disease.icd10cm), mesh: sorted(e.disease.mesh) },
      target: { icd10: sorted(e.target.icd10), icd10cm: sorted(e.target.icd10cm), atc: sorted(e.target.atc), mesh: sorted(e.target.mesh) },
    }))
    .sort((a, b) => a.diseaseQ.localeCompare(b.diseaseQ) || a.targetQ.localeCompare(b.targetQ));
}

// --- Resolución contra el corpus ----------------------------------------------

/** Índices de código → slug sobre las filas ya cargadas. */
export function indexCorpus(rows) {
  const icd = new Map();
  const atc = new Map();
  const mesh = new Map();
  const wikidata = new Map();
  const put = (map, k, slug) => { if (k && !map.has(k)) map.set(k, slug); };
  for (const r of rows) {
    if (r.codeSystem === 'cie10es-diagnosticos-2026') put(icd, r.code.toUpperCase(), r.slug);
    for (const a of r.externalIds?.atc ?? []) put(atc, a, r.slug);
    for (const m of r.externalIds?.mesh ?? []) put(mesh, m, r.slug);
    if (r.codeSystem === 'wikidata-anatomia') put(wikidata, r.code, r.slug);
  }
  return { icd, atc, mesh, wikidata };
}

function firstHit(map, keys) {
  for (const k of keys) {
    const hit = map.get(k);
    if (hit) return { slug: hit, via: k };
  }
  return null;
}

/** Ficha de origen (la enfermedad) de una arista, o null. */
export function resolveDisease(edge, idx) {
  const icd = firstHit(idx.icd, [...edge.disease.icd10, ...edge.disease.icd10cm].map((c) => c.toUpperCase()));
  if (icd) return { slug: icd.slug, provenance: `CIE-10 = ${icd.via}` };
  const mesh = firstHit(idx.mesh, edge.disease.mesh);
  return mesh ? { slug: mesh.slug, provenance: `MeSH = ${mesh.via}` } : null;
}

/** Ficha de destino ya existente en el corpus, o null. */
export function resolveTarget(edge, idx) {
  if (edge.property === 'P927') {
    const a = idx.wikidata.get(edge.targetQ);
    return a ? { slug: a, provenance: `Wikidata = ${edge.targetQ}` } : null;
  }
  const icd = firstHit(idx.icd, [...edge.target.icd10, ...edge.target.icd10cm].map((c) => c.toUpperCase()));
  if (icd) return { slug: icd.slug, provenance: `CIE-10 = ${icd.via}` };
  const atc = firstHit(idx.atc, edge.target.atc);
  if (atc) return { slug: atc.slug, provenance: `ATC = ${atc.via}` };
  const mesh = firstHit(idx.mesh, edge.target.mesh);
  return mesh ? { slug: mesh.slug, provenance: `MeSH = ${mesh.via}` } : null;
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * ¿La «etiqueta en castellano» de Wikidata es en realidad la inglesa copiada?
 * Sólo cuando coincide con la inglesa Y tiene una marca inequívoca del inglés:
 * «Necrosis», «Apnea» o «Rituximab» se escriben igual y son castellano válido.
 */
export function isUntranslatedLabel(es, en) {
  if (!en || es.trim().toLowerCase() !== en.trim().toLowerCase()) return false;
  return /\b(and|of|the|for|with)\b|ology\b|tion\b|\bmedicine\b|\bsurgery\b/i.test(es);
}

/** ¿Un texto «en castellano» de Wikidata está en realidad en inglés? Marcas inequívocas del inglés. */
export function looksEnglish(text) {
  return /\b(the|of|and|with|which|caused by|disease|disorder)\b/i.test(text ?? '');
}

/** Etiqueta con la misma palabra pegada dos veces («Aminofilinaaminofilina»): error de carga en Wikidata. */
export function isDoubledLabel(es) {
  return /^(.{4,})\1$/i.test(es.trim());
}

/** ¿Se puede crear una ficha con la etiqueta de este destino? */
export function hasUsableSpanishLabel(edge) {
  return !isUntranslatedLabel(edge.targetEs, edge.targetEn) && !isDoubledLabel(edge.targetEs);
}

/** Ficha nueva para un destino que el corpus no tiene (síntoma, especialidad…). */
export function targetRow(edge, retrievedAt) {
  const spec = RELATION_PROPERTIES[edge.property].create;
  // Con código ATC es un medicamento, venga por P2176 o por P924.
  const categoryKey = edge.target.atc.length ? 'pharmacology' : (spec.categoryKey ?? 'treatment');
  const prefix = categoryKey === 'pharmacology' ? 'medicamento' : spec.prefix;
  const url = `https://www.wikidata.org/wiki/${edge.targetQ}`;
  const esName = capitalize(edge.targetEs);
  return assertRow({
    slug: `wikidata-${prefix}-${edge.targetQ.toLowerCase()}`,
    code: edge.targetQ,
    codeSystem: `wikidata-${prefix}`,
    display: esName,
    esName,
    enDisplay: edge.targetEn,
    esSynonyms: [],
    definition: edge.targetDescEs,
    definitionKind: edge.targetDescEs ? 'wikidata-description' : null,
    definitionHtml: null,
    definitionSource: edge.targetDescEs ? { name: `Wikidata ${edge.targetQ} — descripción en castellano (comunidad de Wikidata)`, url, retrievedAt, license: 'CC0 1.0' } : null,
    plainSummaryEs: null,
    plainSummarySource: null,
    categoryKey,
    tagKeys: [],
    lang: 'es',
    hierarchy: [],
    externalIds: {
      wikidata: edge.targetQ,
      ...(edge.target.atc.length ? { atc: edge.target.atc } : {}),
      ...(edge.target.mesh.length ? { mesh: edge.target.mesh } : {}),
    },
    relations: [],
    ...NO_IMAGE,
    source: 'wikidata-relaciones',
    sourceName: `Wikidata — ${spec.noun} declarado por la enfermedad (${edge.property}); etiqueta y descripción ES de la comunidad`,
    sourceUrl: url,
    sourceRetrievedAt: retrievedAt,
    sourceLicense: WIKIDATA_LICENSE,
    reviewStatus: 'external-source',
  });
}

/**
 * Aplica las aristas al corpus: agrega relaciones en los dos sentidos y crea
 * las fichas de destino que falten. Muta `rows` (agrega) y las relaciones de
 * cada fila; devuelve el conteo para el `.meta`/`index.json`. Las etiquetas de
 * las fichas creadas las pone después `inheritTagsFromDiseases` (graph.mjs).
 */
export function applyRelationEdges(rows, edges, { retrievedAt } = {}) {
  const idx = indexCorpus(rows);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const created = new Map();
  const createdByQ = new Map();
  const stats = { edges: edges.length, sinOrigen: 0, sinDestino: 0, aplicadas: 0, fichasCreadas: 0, porPropiedad: {} };

  const link = (from, type, to, provenance) => {
    const row = bySlug.get(from);
    row.relations ??= [];
    if (row.relations.some((r) => r.type === type && r.targetSlug === to)) return false;
    row.relations.push({ type, targetSlug: to, provenance });
    return true;
  };

  for (const e of edges) {
    const spec = RELATION_PROPERTIES[e.property];
    const origin = resolveDisease(e, idx);
    if (!origin) { stats.sinOrigen++; continue; }
    let target = resolveTarget(e, idx);
    if (!target && spec.create && hasUsableSpanishLabel(e)) {
      // Una sola ficha por ítem de Wikidata, aunque llegue por dos propiedades.
      let row = createdByQ.get(e.targetQ);
      if (!row) {
        row = targetRow(e, retrievedAt ?? e.retrievedAt ?? null);
        rows.push(row);
        bySlug.set(row.slug, row);
        created.set(row.slug, row);
        createdByQ.set(e.targetQ, row);
      }
      target = { slug: row.slug, provenance: `Wikidata = ${e.targetQ}` };
    }
    if (!target) { stats.sinDestino++; continue; }
    if (target.slug === origin.slug) continue;
    const prov = `wikidata:${e.property} ${e.diseaseQ}→${e.targetQ} (${origin.provenance}; ${target.provenance})`;
    const a = link(origin.slug, spec.forward, target.slug, prov);
    link(target.slug, spec.inverse, origin.slug, prov);
    if (a) {
      stats.aplicadas++;
      stats.porPropiedad[e.property] = (stats.porPropiedad[e.property] ?? 0) + 1;
    }
  }
  stats.fichasCreadas = created.size;
  return stats;
}

/**
 * Une la ficha CIE-10-ES y la de MedlinePlus de una misma enfermedad cuando un
 * ítem de Wikidata declara los dos códigos (RELATED_TERM, en los dos sentidos).
 * Si la ficha CIE-10-ES no tiene definición —la fuente no publica ninguna— toma
 * la de MedlinePlus **citando a MedlinePlus**: es la definición del mismo
 * concepto por su propia fuente, no una redacción nueva. Y si no tiene resumen
 * breve, usa la descripción en castellano del ítem (CC0), como ya hace
 * `enrich.mjs` con los ítems que aportan imagen.
 */
export function applyConceptIdentities(rows, identities) {
  const idx = indexCorpus(rows);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const stats = { identidades: identities.length, unidas: 0, definicionesTomadas: 0, resumenesWikidata: 0 };
  const link = (from, to, provenance) => {
    const row = bySlug.get(from);
    row.relations ??= [];
    if (row.relations.some((r) => r.targetSlug === to)) return false;
    row.relations.push({ type: 'RELATED_TERM', targetSlug: to, provenance });
    return true;
  };
  for (const it of identities) {
    const icd = firstHit(idx.icd, [...it.icd10, ...it.icd10cm].map((c) => c.toUpperCase()));
    if (!icd) continue;
    const icdRow = bySlug.get(icd.slug);
    if (!icdRow.plainSummaryEs && it.descEs && !looksEnglish(it.descEs)) {
      icdRow.plainSummaryEs = it.descEs;
      icdRow.plainSummarySource = { name: `Wikidata ${it.q} — descripción en castellano (comunidad de Wikidata, CC0)`, url: `https://www.wikidata.org/wiki/${it.q}`, retrievedAt: null, kind: 'wikidata-description' };
      stats.resumenesWikidata++;
    }
    const mesh = firstHit(idx.mesh, it.mesh);
    if (!mesh || icd.slug === mesh.slug) continue;
    const dx = bySlug.get(icd.slug);
    const topic = bySlug.get(mesh.slug);
    if (dx.codeSystem !== 'cie10es-diagnosticos-2026' || !String(topic.codeSystem).startsWith('medlineplus')) continue;
    const prov = `wikidata:identidad ${it.q} (CIE-10 = ${icd.via}; MeSH = ${mesh.via})`;
    if (link(dx.slug, topic.slug, prov)) stats.unidas++;
    link(topic.slug, dx.slug, prov);
    if (!dx.definition && topic.definition) {
      dx.definition = topic.definition;
      dx.definitionHtml = topic.definitionHtml ?? null;
      dx.definitionKind = 'same-concept-medlineplus';
      const base = topic.definitionSource ?? { name: topic.sourceName, url: topic.sourceUrl, retrievedAt: topic.sourceRetrievedAt, license: topic.sourceLicense };
      dx.definitionSource = { ...base, name: `${base.name} — «${topic.esName}», el mismo concepto según Wikidata ${it.q}` };
      stats.definicionesTomadas++;
    }
  }
  return stats;
}
