// =============================================================================
// Ensamblado del artículo de un término (contrato §12.3). Aquí NO se redacta:
// cada `text` es una cadena literal de una fuente, y todo lo que escribe el
// sistema son etiquetas de campo («Código ORPHA», «Prevalencia (Orphanet)»…).
// Una sección sin fuente no existe; un término sin nada que mostrar no tiene
// artículo (y va a `rejected.ndjson` con su motivo).
// =============================================================================

import {
  CIE_SOURCE_URL, CODE_SYSTEM, GLOSSARY_SOURCE, REJECT_REASONS, SOURCES, WIKIDATA_FACT_PROPERTIES, WIKIPEDIA_REFERENCE,
} from './config.mjs';
import { imageHostOk, pickImage, sectionProblem } from './guards.mjs';
import { phenotypeItems } from './hpo.mjs';
import { noteItems } from './icd10cm.mjs';
import { icdSystemsFor } from './mondo.mjs';
import { isMeshDescriptor } from './remote.mjs';

const MAX_IMAGES = 3;
const WIKIDATA_ITEM_LABEL = 'Elemento de Wikidata';
const ICD_TITLE_LABEL = 'Título ICD-10-CM (inglés)';
const ORPHANET_EXPERT_FALLBACK = (orpha) => `https://www.orpha.net/en/disease/detail/${orpha}`;

const prefixed = (prefix) => (v) => (String(v).startsWith(prefix) ? String(v) : `${prefix}${v}`);
const FACT_PROP_BY_XREF = Object.freeze({
  OMIM: 'P492', MeSH: 'P486', UMLS: 'P2892', DOID: 'P699', MONDO: 'P5270', ORPHA: 'P1550',
});
const FACT_VALUE_FORMAT = Object.freeze({ P699: prefixed('DOID:'), P5270: prefixed('MONDO:') });
const formatFactValue = (prop, v) => (FACT_VALUE_FORMAT[prop] ?? String)(v);

function provenance(sourceId, ctx, extra) {
  return { source: sourceId, license: SOURCES[sourceId].license, retrievedAt: ctx.retrievedAt[sourceId], ...extra };
}

// --- secciones ---------------------------------------------------------------------

function orphanetDefinition(orpha, ctx) {
  if (!orpha?.definition) return null;
  return {
    kind: 'definition', text: orpha.definition, lang: 'es',
    ...provenance('orphanet-es', ctx, {
      sourceUrl: orpha.expertLink ?? ORPHANET_EXPERT_FALLBACK(orpha.orpha),
      sourceVersion: `Orphadata ${ctx.orphanet.header.date.slice(0, 10)}`,
      locator: `${orpha.definitionSectionType ?? 'Definición'} · ${orpha.name} (ORPHA:${orpha.orpha})`,
    }),
  };
}

function mondoDefinition(mondo, ctx) {
  if (!mondo?.definition) return null;
  return {
    kind: 'definition', text: mondo.definition, lang: 'en',
    ...provenance('mondo', ctx, {
      sourceUrl: `http://purl.obolibrary.org/obo/${mondo.id.replace(':', '_')}`,
      sourceVersion: `Mondo ${ctx.mondo.version}`,
      locator: `definition (IAO:0000115) · ${mondo.label} (${mondo.id})`,
    }),
    citesWikipedia: mondo.definitionXrefs.some((r) => WIKIPEDIA_REFERENCE.test(r)),
  };
}

function doidDefinitions(mondo, ctx, skipTexts, extraDoid = null) {
  const out = [];
  for (const n of [...(mondo?.exact.doid ?? []), ...(extraDoid ? [extraDoid] : [])]) {
    const term = ctx.doid.terms.get(`DOID:${n}`);
    if (!term?.definition || skipTexts.has(term.definition)) continue;
    out.push({
      kind: 'definition', text: term.definition, lang: 'en',
      ...provenance('disease-ontology', ctx, {
        sourceUrl: `http://purl.obolibrary.org/obo/DOID_${n}`,
        sourceVersion: `Disease Ontology ${ctx.doid.version}`,
        locator: `def · ${term.name} (DOID:${n})`,
      }),
      citesWikipedia: WIKIPEDIA_REFERENCE.test(term.definitionRefs ?? ''),
    });
  }
  return out;
}

export function meshIdsFor(identity, extra = null) {
  const ids = new Set(identity.mondo?.exact.mesh ?? []);
  if (extra) ids.add(extra);
  for (const x of identity.orpha?.xrefs ?? []) if (x.source === 'MeSH' && x.exact) ids.add(x.reference);
  return [...ids].filter(isMeshDescriptor).sort();
}

function meshOverviews(identity, ctx, extra = null) {
  const out = [];
  for (const id of meshIdsFor(identity, extra)) {
    const entry = ctx.mesh.get(id);
    if (!entry?.scopeNote) continue;
    out.push({
      kind: 'overview', text: entry.scopeNote, lang: 'en',
      ...provenance('nlm-mesh', ctx, {
        sourceUrl: `https://meshb.nlm.nih.gov/record/ui?ui=${id}`,
        sourceVersion: `MeSH RDF vigente de NLM, consultado el ${ctx.retrievedAt['nlm-mesh']}`,
        locator: `Scope note · ${entry.label} (${id})`,
      }),
    });
  }
  return out;
}

function icdClassification(term, ctx) {
  const entry = ctx.icd10cm?.codes.get(term.code);
  const items = entry ? noteItems(entry) : [];
  if (!items.length) return null;
  return {
    kind: 'classification', text: null, lang: 'en', items,
    ...provenance('icd10cm-tabular', ctx, {
      sourceUrl: 'https://www.cdc.gov/nchs/icd/icd-10-cm/files.html',
      sourceVersion: `ICD-10-CM Tabular List ${ctx.icd10cm.version ?? ctx.icd10cm.label}`,
      locator: `Tabular List · ${term.code} · ${entry.title}`,
    }),
  };
}

/** Clave de `phenotype.hpoa` de la enfermedad: ORPHA exacto, o el único OMIM que MONDO declara exacto. */
export function hpoaKeyFor(identity) {
  if (identity.orpha) return `ORPHA:${identity.orpha.orpha}`;
  const omim = [...new Set(identity.mondo?.exact.omim ?? [])];
  return omim.length === 1 ? `OMIM:${omim[0]}` : null;
}

function hpoSymptoms(identity, ctx, flags) {
  const key = hpoaKeyFor(identity);
  const rows = key ? ctx.hpo.hpoa.diseases.get(key)?.P : null;
  if (!rows?.length) return null;
  if (!ctx.hpoAck) {
    flags.hpoBlocked = true;
    return null;
  }
  const items = phenotypeItems(rows, { esLabels: ctx.hpo.es, enLabels: ctx.hpo.en });
  if (!items.length) return null;
  const untranslated = items.filter((i) => !i.officialSpanish).length;
  return {
    kind: 'symptoms', text: null, lang: untranslated === 0 ? 'es' : 'en',
    items: items.map((i) => (i.freq.label ? `${i.label} — ${i.freq.label}` : i.label)),
    ...(untranslated > 0 ? { untranslatedItems: untranslated } : {}),
    ...provenance('hpo', ctx, {
      sourceUrl: `https://hpo.jax.org/browse/disease/${key}`,
      sourceVersion: `phenotype.hpoa ${ctx.hpo.hpoa.version} · HPO ${ctx.hpo.hpoa.hpoVersion?.match(/releases\/([\d-]+)\//)?.[1] ?? 's/d'}`,
      locator: `phenotype.hpoa · ${key} · aspecto P (fenotipo), orden por frecuencia`,
    }),
  };
}

// --- facts -------------------------------------------------------------------------

function pushFact(facts, seen, fact) {
  const key = `${fact.label}\u0000${fact.value}`;
  if (seen.has(key) || fact.value == null || fact.value === '') return;
  seen.add(key);
  facts.push(fact);
}

function prevalenceValue(p) {
  const level = p.klass ?? p.mean;
  return level ? `${p.type}: ${level}${p.geographic ? ` · ${p.geographic}` : ''}` : null;
}

function buildFacts(term, identity, wd, ctx) {
  const facts = [];
  const seen = new Set();
  pushFact(facts, seen, { label: 'Código CIE-10-ES', value: term.code, source: GLOSSARY_SOURCE, sourceUrl: CIE_SOURCE_URL });
  const icd = ctx.icd10cm?.codes.get(term.code);
  if (icd?.title) pushFact(facts, seen, { label: ICD_TITLE_LABEL, value: icd.title, source: 'icd10cm-tabular', sourceUrl: 'https://www.cdc.gov/nchs/icd/icd-10-cm/files.html' });
  const { orpha, mondo } = identity;
  if (orpha) {
    const url = orpha.expertLink ?? ORPHANET_EXPERT_FALLBACK(orpha.orpha);
    pushFact(facts, seen, { label: 'Código ORPHA', value: `ORPHA:${orpha.orpha}`, source: 'orphanet-es', sourceUrl: url });
    pushFact(facts, seen, { label: 'Nombre en Orphanet', value: orpha.name, source: 'orphanet-es', sourceUrl: url });
    for (const syn of orpha.synonyms ?? []) pushFact(facts, seen, { label: 'Sinónimo (Orphanet)', value: syn, source: 'orphanet-es', sourceUrl: url });
    pushFact(facts, seen, { label: 'Tipo de entidad (Orphanet)', value: orpha.type, source: 'orphanet-es', sourceUrl: url });
    for (const p of ctx.orphanet.prevalence.get(orpha.orpha) ?? []) {
      pushFact(facts, seen, { label: 'Prevalencia (Orphanet)', value: prevalenceValue(p), source: 'orphanet-epidemiology-es', sourceUrl: url });
    }
    const ages = ctx.orphanet.ages.get(orpha.orpha);
    if (ages?.onset.length) pushFact(facts, seen, { label: 'Edad de inicio (Orphanet)', value: ages.onset.join(', '), source: 'orphanet-epidemiology-es', sourceUrl: url });
    if (ages?.inheritance.length) pushFact(facts, seen, { label: 'Herencia (Orphanet)', value: ages.inheritance.join(', '), source: 'orphanet-epidemiology-es', sourceUrl: url });
    for (const x of orpha.xrefs.filter((r) => r.exact)) {
      if (x.source === 'ICD-11') pushFact(facts, seen, { label: 'Código CIE-11 (Orphanet)', value: x.reference, source: 'orphanet-es', sourceUrl: url });
      const prop = FACT_PROP_BY_XREF[x.source];
      if (prop) pushFact(facts, seen, { label: WIKIDATA_FACT_PROPERTIES[prop].factLabel, value: formatFactValue(prop, x.reference), source: 'orphanet-es', sourceUrl: WIKIDATA_FACT_PROPERTIES[prop].urlOf(x.reference) });
    }
  }
  if (mondo) {
    const mondoUrl = `https://monarchinitiative.org/${mondo.id}`;
    pushFact(facts, seen, { label: WIKIDATA_FACT_PROPERTIES.P5270.factLabel, value: mondo.id, source: 'mondo', sourceUrl: mondoUrl });
    pushFact(facts, seen, { label: 'Nombre en MONDO (inglés)', value: mondo.label, source: 'mondo', sourceUrl: mondoUrl });
    for (const syn of mondo.synonyms ?? []) if (syn.toLowerCase() !== (mondo.label ?? '').toLowerCase()) pushFact(facts, seen, { label: 'Sinónimo en MONDO (inglés)', value: syn, source: 'mondo', sourceUrl: mondoUrl });
    for (const n of mondo.exact.ncit ?? []) pushFact(facts, seen, { label: 'NCI Thesaurus', value: n, source: 'mondo', sourceUrl: `https://ncit.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_Thesaurus&code=${n}` });
    for (const n of mondo.exact.medgen ?? []) pushFact(facts, seen, { label: 'MedGen', value: n, source: 'mondo', sourceUrl: `https://www.ncbi.nlm.nih.gov/medgen/${n}` });
    for (const n of mondo.exact.icd11foundation ?? []) pushFact(facts, seen, { label: 'Entidad CIE-11 (Foundation)', value: n, source: 'mondo', sourceUrl: `http://id.who.int/icd/entity/${n}` });
    for (const [key, prop] of [['doid', 'P699'], ['omim', 'P492'], ['mesh', 'P486'], ['umls', 'P2892']]) {
      for (const v of mondo.exact[key]) {
        const value = key === 'doid' ? `DOID:${v}` : v;
        pushFact(facts, seen, { label: WIKIDATA_FACT_PROPERTIES[prop].factLabel, value, source: 'mondo', sourceUrl: WIKIDATA_FACT_PROPERTIES[prop].urlOf(value) });
      }
    }
  }
  if (wd?.qid) {
    const wdUrl = `https://www.wikidata.org/wiki/${wd.qid}`;
    pushFact(facts, seen, { label: WIKIDATA_ITEM_LABEL, value: wd.qid, source: 'wikidata', sourceUrl: wdUrl });
    for (const [prop, values] of Object.entries(wd.facts)) {
      const meta = WIKIDATA_FACT_PROPERTIES[prop];
      if (!meta) continue;
      const label = prop === 'P7329' ? 'Identificador CIE-11 (MMS)' : meta.factLabel;
      for (const raw of values) {
        const value = formatFactValue(prop, raw);
        pushFact(facts, seen, { label, value, source: 'wikidata', sourceUrl: wdUrl });
      }
    }
  }
  return facts;
}

// --- imágenes ----------------------------------------------------------------------

function buildImages(term, wd, ctx, rejected) {
  const images = [];
  for (const file of wd?.files ?? []) {
    if (images.length >= MAX_IMAGES) break;
    const info = ctx.commons.get(file);
    if (!info) {
      rejected.push({ level: 'image', reason: 'sin_metadatos_en_commons', detail: file });
      continue;
    }
    const picked = pickImage(info, { termName: term.esName, retrievedAt: ctx.retrievedAt.wikidata });
    if (picked.ok) images.push({ ...picked.image, wikidataId: wd.qid });
    else rejected.push({ level: 'image', reason: picked.reason, detail: picked.detail });
  }
  return images.filter((i) => imageHostOk(i.url));
}

// --- referencias -------------------------------------------------------------------

function buildReferences(identity, wd, sections, ctx) {
  const refs = [];
  const seen = new Set();
  const add = (title, url, source) => {
    if (!seen.has(url)) {
      seen.add(url);
      refs.push({ title, url, source });
    }
  };
  if (identity.orpha) add(`Orphanet · ${identity.orpha.name}`, identity.orpha.expertLink ?? ORPHANET_EXPERT_FALLBACK(identity.orpha.orpha), 'orphanet-es');
  if (identity.mondo) {
    add(`Mondo · ${identity.mondo.label}`, `http://purl.obolibrary.org/obo/${identity.mondo.id.replace(':', '_')}`, 'mondo');
    for (const x of identity.mondo.definitionXrefs.filter((r) => /^PMID:\d+$/.test(r))) add(x, `https://pubmed.ncbi.nlm.nih.gov/${x.slice(5)}/`, 'mondo');
  }
  for (const s of sections.filter((x) => x.source === 'nlm-mesh' || x.source === 'hpo' || x.source === 'disease-ontology')) add(`${SOURCES[s.source].name} · ${s.locator}`, s.sourceUrl, s.source);
  if (wd?.qid) add(`Wikidata · ${wd.qid}`, `https://www.wikidata.org/wiki/${wd.qid}`, 'wikidata');
  return refs;
}

// --- identidad -----------------------------------------------------------------------

const ICD_SYSTEM_LABEL = { icd10cm: 'ICD10CM', icd10who: 'CIE-10 OMS' };

/**
 * Con qué se unió el término a cada fuente (extensión del contrato §12.3, para que el front y el
 * revisor sepan cuánta confianza tiene la identidad): `corroborated` solo si Orphanet y MONDO,
 * independientes, declaran la misma enfermedad.
 */
export function identityBasis(term, identity, wd, via = {}, icdEntry = null) {
  const basis = [];
  const bridgeMapping = (extra) => `puente Wikidata ${wd?.qid}: el ítem declara este código y ${extra} (T3, sugerencia; no corroborado por otra fuente)`;
  if (identity.orpha) {
    basis.push(via.orpha
      ? { source: 'orphanet-es', id: `ORPHA:${identity.orpha.orpha}`, mapping: bridgeMapping('P1550'), via: 'wikidata-bridge' }
      : { source: 'orphanet-es', id: `ORPHA:${identity.orpha.orpha}`, mapping: 'E (correspondencia exacta, validada) con el código CIE-10 de la OMS' });
  }
  if (identity.mondo) {
    const systems = icdSystemsFor(identity.mondo, term.code).map((s) => ICD_SYSTEM_LABEL[s]).join(' + ');
    basis.push(via.mondo
      ? { source: 'mondo', id: identity.mondo.id, mapping: bridgeMapping('P5270'), via: 'wikidata-bridge' }
      : { source: 'mondo', id: identity.mondo.id, mapping: `skos:exactMatch con ${systems}` });
  }
  if (via.meshId) basis.push({ source: 'nlm-mesh', id: via.meshId, mapping: bridgeMapping('P486'), via: 'wikidata-bridge' });
  if (via.doidId) basis.push({ source: 'disease-ontology', id: `DOID:${via.doidId}`, mapping: bridgeMapping('P699'), via: 'wikidata-bridge' });
  if (icdEntry) basis.push({ source: 'icd10cm-tabular', id: term.code, mapping: 'mismo código ICD-10-CM (la CIE-10-ES es su traducción oficial)' });
  if (wd?.qid) basis.push({ source: 'wikidata', id: wd.qid, mapping: 'el ítem declara este código (P4229/P494); único para el código y para el término' });
  return { basis, corroborated: Boolean(identity.orpha && identity.mondo && !via.orpha && !via.mondo) };
}

// --- API ---------------------------------------------------------------------------

/**
 * @returns {{article: object|null, rejected: object[], flags: {hpoBlocked: boolean}}}
 *  `rejected` incluye rechazos parciales (secciones/imágenes) aunque haya artículo.
 */
export function buildArticle(term, identity, wd, ctx) {
  const conceptRef = { system: CODE_SYSTEM, code: term.code, slug: term.slug };
  const rejected = [];
  const flags = { hpoBlocked: false, wikipediaWithheld: 0 };
  const reject = (level, reason, detail) => rejected.push({ conceptRef, level, reason, detail: detail ?? null });

  for (const note of identity.notes) {
    const [reason, ...rest] = note.split(':');
    reject('identity', reason, rest.join(':'));
  }
  if (wd?.rejectReason) reject('wikidata', wd.rejectReason, wd.detail);

  // Identidad efectiva: la unión por código y, en su defecto, el puente de Wikidata (T3).
  const bridge = ctx.bridges?.get(term.code) ?? null;
  const via = { orpha: Boolean(!identity.orpha && bridge?.orpha), mondo: Boolean(!identity.mondo && bridge?.mondo), meshId: bridge?.meshId ?? null, doidId: bridge?.doidId ?? null };
  const eff = { ...identity, orpha: identity.orpha ?? bridge?.orpha ?? null, mondo: identity.mondo ?? bridge?.mondo ?? null };
  const viaTag = ` · vía puente Wikidata ${wd?.qid}`;

  const candidates = [];
  const orphaDef = orphanetDefinition(eff.orpha, ctx);
  const mondoDef = mondoDefinition(eff.mondo, ctx);
  if (orphaDef) candidates.push(via.orpha ? { ...orphaDef, locator: orphaDef.locator + viaTag } : orphaDef);
  if (mondoDef) candidates.push(via.mondo ? { ...mondoDef, locator: mondoDef.locator + viaTag } : mondoDef);
  const seenTexts = new Set([mondoDef?.text].filter(Boolean));
  const tagIf = (flag) => (s) => (flag ? { ...s, locator: s.locator + viaTag } : s);
  candidates.push(...doidDefinitions(eff.mondo, ctx, seenTexts, via.doidId).map((s) => tagIf(via.mondo || (via.doidId && s.locator.endsWith(`(DOID:${via.doidId})`)))(s)));
  candidates.push(...meshOverviews(eff, ctx, via.meshId).map((s) => tagIf(s.sourceUrl.endsWith(`ui=${via.meshId}`) || via.mondo || via.orpha)(s)));
  const symptoms = hpoSymptoms(eff, ctx, flags);
  if (symptoms) candidates.push(via.orpha || via.mondo ? { ...symptoms, locator: symptoms.locator + viaTag } : symptoms);
  const classification = icdClassification(term, ctx);
  if (classification) candidates.push(classification);

  const sections = [];
  for (const { citesWikipedia, ...s } of candidates) {
    if (citesWikipedia && !ctx.includeWikipediaCited) {
      flags.wikipediaWithheld++;
      reject('section', REJECT_REASONS.WIKIPEDIA_CITED, `${s.kind}/${s.source}: ${s.locator}`);
      continue;
    }
    const problem = sectionProblem(s);
    if (problem) reject('section', problem.reason, `${s.kind}/${s.source}: ${problem.detail}`);
    else sections.push(s);
  }

  const imageRejects = [];
  const images = buildImages(term, wd, ctx, imageRejects);
  for (const r of imageRejects) reject(r.level, r.reason, r.detail);

  const facts = buildFacts(term, eff, wd, ctx);
  // Ni el puntero al ítem de Wikidata ni el título de la ICD-10-CM bastan para tener artículo: son un enlace y un nombre.
  const hasSourceFacts = facts.some((f) => f.source !== GLOSSARY_SOURCE && f.label !== WIKIDATA_ITEM_LABEL && f.label !== ICD_TITLE_LABEL);
  if (sections.length === 0 && images.length === 0 && !hasSourceFacts) {
    const linked = eff.orpha || eff.mondo || wd?.qid;
    reject('term', linked ? REJECT_REASONS.EMPTY_ARTICLE : REJECT_REASONS.NO_EXACT_SOURCE, null);
    return { article: null, rejected, flags };
  }

  const hasSpanish = sections.some((s) => s.lang === 'es');
  const article = {
    conceptRef,
    identity: identityBasis(term, eff, wd, via, ctx.icd10cm?.codes.get(term.code) && classification ? true : null),
    lang: hasSpanish || sections.length === 0 ? 'es' : 'en',
    sections,
    images,
    facts,
    references: buildReferences(eff, wd, sections, ctx),
  };
  return { article, rejected, flags };
}

/** Clasificación para COVERAGE: con qué contenido quedó el término. */
export function articleKind(article) {
  if (!article) return 'none';
  if (article.sections.length) return 'text';
  if (article.images.length) return 'image-only';
  return 'facts-only';
}
