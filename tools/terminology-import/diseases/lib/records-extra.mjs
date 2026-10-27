// =============================================================================
// Fuentes de la pasada del 2026-10-27 → registro común del catálogo de enfermedades
// (mismo formato que `records.mjs`): MeSH oficial, NCIt oficial de NCI EVS, GARD,
// NANDO y OncoTree. Cada una declara su licencia en `lib/sources.mjs`.
//
// Reglas (iguales a las de `records.mjs`): nombres, sinónimos y definiciones
// verbatim en el idioma de la fuente; sólo cruces que la fuente publica; nada
// por parecido de nombre; SNOMED CT se descarta entero.
// =============================================================================

import { readFileSync } from 'node:fs';

import { SYSTEMS } from './code-systems.mjs';
import { isDiseaseDescriptor, parentTree } from './mesh.mjs';
import { gardCode, normalizeCurie, provenance, pushDesignation } from './records.mjs';

// --- MeSH 2026 -----------------------------------------------------------------

const MESH_DATES = (d) => ({
  ...(d.dateCreated ? { created: d.dateCreated } : {}),
  ...(d.dateEstablished ? { established: d.dateEstablished } : {}),
  ...(d.dateIntroduced ? { introduced: d.dateIntroduced } : {}),
  ...(d.dateRevised ? { revised: d.dateRevised } : {}),
  ...(d.lastUpdated ? { lastUpdated: d.lastUpdated } : {}),
});

/** Términos de un registro MeSH → designaciones EN. Los términos «permutados» (variantes léxicas que MeSH genera) no son sinónimos. */
function meshDesignations(name, concepts) {
  const designations = [];
  pushDesignation(designations, name, 'en', true);
  for (const c of concepts) for (const t of c.terms) if (!t.permuted) pushDesignation(designations, t.value, 'en', false);
  return designations;
}

/**
 * @param input { descriptors, supplementals } de `lib/mesh.mjs`
 * @param cited UI de MeSH (D…, C…) que otras fuentes de enfermedades citan por su código
 */
export function buildMesh({ descriptors, supplementals }, cited, meta, metaSupp = meta, version = '2026') {
  const byTree = new Map();
  for (const d of descriptors) for (const t of d.treeNumbers) byTree.set(t, d.ui);
  const selected = [];
  const excluded = { animalOnly: 0, outsideDiseaseTrees: descriptors.length };
  for (const d of descriptors) {
    const { keep, onlyAnimal } = isDiseaseDescriptor(d);
    if (keep || cited.has(d.ui)) selected.push({ d, byCitation: !keep });
    else if (onlyAnimal) excluded.animalOnly += 1;
  }
  excluded.outsideDiseaseTrees -= selected.length + excluded.animalOnly;
  const codes = new Set(selected.map(({ d }) => d.ui));
  const records = [];
  for (const { d, byCitation } of selected) {
    const parents = [...new Set(d.treeNumbers.map(parentTree).filter(Boolean).map((t) => byTree.get(t)).filter((p) => p && codes.has(p)))];
    records.push({
      cs: 'mesh',
      code: d.ui,
      display: d.name,
      lang: 'en',
      definition: d.scopeNote,
      definitionLang: d.scopeNote ? 'en' : null,
      definitionRefs: [],
      designations: meshDesignations(d.name, d.concepts),
      parents,
      status: 'active',
      replacedBy: null,
      properties: {
        mesh_record_kind: 'descriptor',
        mesh_tree_numbers: d.treeNumbers,
        mesh_dates: MESH_DATES(d),
        ...(byCitation ? { mesh_included_by: 'citado por otra fuente de enfermedades (fuera de los árboles C y F03)' } : {}),
        ...(d.concepts.length > 1 ? { mesh_concepts: d.concepts.map((c) => ({ ui: c.ui, name: c.name, preferred: c.preferred, terms: c.terms.filter((t) => !t.permuted).map((t) => t.value) })), mesh_concept_relations: d.conceptRelations } : {}),
        ...(d.annotation ? { mesh_annotation: d.annotation } : {}),
        ...(d.historyNote ? { mesh_history_note: d.historyNote } : {}),
        ...(d.onlineNote ? { mesh_online_note: d.onlineNote } : {}),
        ...(d.publicNote ? { mesh_public_note: d.publicNote } : {}),
        ...(d.considerAlso ? { mesh_consider_also: d.considerAlso } : {}),
        ...(d.seeRelated.length ? { mesh_see_related: d.seeRelated.filter(Boolean) } : {}),
      },
      xrefs: [],
      provenance: provenance(meta, version, d.ui, 'mesh'),
    });
  }
  for (const s of supplementals) {
    records.push({
      cs: 'mesh',
      code: s.ui,
      display: s.name,
      lang: 'en',
      definition: s.note,
      definitionLang: s.note ? 'en' : null,
      definitionRefs: [],
      designations: meshDesignations(s.name, s.concepts),
      parents: [],
      status: 'active',
      replacedBy: null,
      properties: {
        mesh_record_kind: 'supplemental-concept-record',
        mesh_scr_class: s.scrClass,
        mesh_heading_mapped_to: s.mappedTo,
        mesh_dates: MESH_DATES(s),
        ...(s.sources.length ? { mesh_sources: s.sources } : {}),
        ...(s.frequency ? { mesh_indexing_frequency: s.frequency } : {}),
      },
      // «Mapped to»: el descriptor al que NLM indiza el SCR. NLM no lo declara equivalencia.
      xrefs: s.mappedTo.map((h) => ({ cs: 'mesh', code: h.ui, equivalence: null, context: `mesh:HeadingMappedTo${h.major ? ' (tema principal)' : ''}${h.qualifier ? ` /${h.qualifier}` : ''}` })),
      provenance: provenance(metaSupp, version, s.ui, 'mesh'),
    });
  }
  return { version, records, excluded, counts: { descriptorsSelected: selected.length, descriptorsByCitationOnly: selected.filter((x) => x.byCitation).length, supplementals: supplementals.length } };
}

// --- NCIt oficial de NCI EVS (archivo plano) ----------------------------------------

/** `Thesaurus.txt`: code, IRI, parents, synonyms, definition, display name, concept status, semantic type, subsets (tabulado; listas con «|»). */
export function parseNcitFlat(path) {
  const rows = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line) continue;
    const f = line.split('\t');
    const list = (v) => (v ? v.split('|').filter(Boolean) : []);
    rows.push({ code: f[0], parents: list(f[2]), synonyms: list(f[3]), definition: f[4] || null, displayName: f[5] || null, statuses: list(f[6]), semanticTypes: list(f[7]), subsets: list(f[8]) });
  }
  return rows;
}

/** `nci_code_cui_map_<fecha>.dat`: «código|CUI|nombre…|» → Map<código, CUI[]>. */
export function parseNcitCuiMap(path) {
  const map = new Map();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line) continue;
    const [code, cui] = line.split('|');
    if (!map.has(code)) map.set(code, []);
    map.get(code).push(cui);
  }
  return map;
}

const NCIT_DEPRECATED = new Set(['Retired_Concept', 'Obsolete_Concept']);

function ncitRecord(cs, r, cuiMap, meta, version, parents) {
  const designations = [];
  r.synonyms.forEach((s, i) => pushDesignation(designations, s, 'en', i === 0));
  const cuis = cuiMap.get(r.code) ?? [];
  const umls = cuis.filter((c) => /^C\d{7}$/.test(c));
  const meta2 = cuis.filter((c) => !/^C\d{7}$/.test(c));
  const status = r.statuses.some((s) => NCIT_DEPRECATED.has(s)) ? 'deprecated' : 'active';
  const display = r.synonyms[0] ?? r.displayName ?? r.code;
  return {
    cs,
    code: r.code,
    display,
    lang: 'en',
    definition: r.definition,
    definitionLang: r.definition ? 'en' : null,
    definitionRefs: [],
    designations,
    parents,
    status,
    replacedBy: null,
    properties: {
      ...(r.semanticTypes.length ? { ncit_semantic_types: r.semanticTypes } : {}),
      ...(r.statuses.length ? { ncit_concept_status: r.statuses } : {}),
      ...(r.subsets.length ? { ncit_subsets: r.subsets } : {}),
      ...(r.displayName && r.displayName !== display ? { ncit_display_name: r.displayName } : {}),
      ...(meta2.length ? { disease_external_xrefs: { NCIMeta: meta2 } } : {}),
      ...(cs === 'ncit-xref' && r.parents.length ? { ncit_parents: r.parents } : {}),
    },
    xrefs: umls.map((c) => ({ cs: 'umls', code: c, equivalence: null, context: 'ncit:nci_code_cui_map' })),
    provenance: provenance(meta, version, `NCIT:${r.code}`, cs, r.code),
  };
}

/**
 * Subárbol C2991 «Disease or Disorder» (padres declarados por NCI) → `ncit-disease`; los códigos
 * que otras fuentes citan y quedan fuera de ese subárbol (cualquier estado) → `ncit-xref`.
 */
export function buildNcitFlat({ rows, cuiMap }, cited, meta, version) {
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const kids = new Map();
  for (const r of rows) for (const p of r.parents) (kids.get(p) ?? kids.set(p, []).get(p)).push(r.code);
  const tree = new Set();
  const stack = ['C2991'];
  while (stack.length) {
    const c = stack.pop();
    if (tree.has(c)) continue;
    tree.add(c);
    stack.push(...(kids.get(c) ?? []));
  }
  const disease = [];
  for (const c of tree) {
    const r = byCode.get(c);
    if (r) disease.push(ncitRecord('ncit-disease', r, cuiMap, meta, version, r.parents.filter((p) => tree.has(p))));
  }
  disease.sort((a, b) => (a.code < b.code ? -1 : 1));
  const xref = [];
  const missing = [];
  for (const c of [...cited].sort()) {
    if (tree.has(c)) continue;
    const r = byCode.get(c);
    if (!r) missing.push(c);
    else xref.push(ncitRecord('ncit-xref', r, cuiMap, meta, version, []));
  }
  return { version, records: disease, xrefRecords: xref, excluded: { outsideDiseaseOrDisorder: rows.length - disease.length, citedNotInNcit: missing.length }, citedMissing: missing };
}

// --- GARD --------------------------------------------------------------------

/** CSV de GARD (con BOM, comillas dobles) → [{ id, name, synonyms: [..], url }]. */
export function parseGardCsv(path) {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...data] = rows;
  const col = (n) => header.indexOf(n);
  return data.map((r) => ({
    id: r[col('ID')],
    name: r[col('Display Name')],
    synonyms: (r[col('Synonyms')] ?? '').split('|').map((s) => s.trim()).filter(Boolean),
    url: r[col('URL')] || null,
  }));
}

const GARD_PREDICATE = { Exact_match: 'equivalent', Close_match: 'inexact', Broad_match: 'wider', Narrow_match: 'narrower' };

/** Tokens de `Xref_IDs__c` con prefijo explícito → xrefs del catálogo; el resto queda textual y sin tipar. */
export function gardXrefs(single) {
  const xrefs = [];
  const external = {};
  const untyped = [];
  const links = [];
  const seen = new Set();
  const push = (target, context) => {
    const k = `${target.cs}|${target.code}|${context}`;
    if (seen.has(k)) return;
    seen.add(k);
    xrefs.push({ cs: target.cs, code: target.code, equivalence: null, context, external: Boolean(target.external) });
  };
  for (const raw of (single.Xref_IDs__c ?? '').split(';')) {
    const tok = raw.trim();
    if (!tok) continue;
    if (/^https?:/.test(tok)) {
      links.push(tok);
      continue;
    }
    const m = /^([A-Za-z_]+):(.+)$/.exec(tok);
    if (m) {
      if (m[1] === 'SNOMEDCT_US' || m[1] === 'SCTID') continue;
      const target = m[1] === 'ORPHA' ? normalizeCurie(`Orphanet:${m[2]}`) : normalizeCurie(tok);
      if (target) push(target, 'gard:Xref_IDs');
      else (external[m[1]] ??= []).push(tok);
    } else if (/^\d{6,}$/.test(tok)) continue; // identificador SNOMED CT sin prefijo: se descarta entero
    // Sin prefijo sólo se tipan las formas que no se confunden con otro sistema: CUI de UMLS (C + 7 dígitos), descriptor
    // de MeSH (D + 6 a 9 dígitos) y libro de GeneReviews (NBK…). «C» + 6 dígitos puede ser NCIt o un SCR de MeSH: queda sin tipar.
    else if (/^C\d{7}$/.test(tok)) push({ cs: 'umls', code: tok }, 'gard:Xref_IDs');
    else if (/^D\d{6,9}$/.test(tok)) push({ cs: 'mesh', code: tok }, 'gard:Xref_IDs');
    else if (/^NBK\d+$/.test(tok)) (external.GeneReviews ??= []).push(tok);
    else untyped.push(tok);
  }
  return { xrefs, external, untyped, links };
}

/**
 * @param csv filas de `parseGardCsv`
 * @param trimmed `diseases.trimmed.json` (etiquetas propias de GARD, por id numérico)
 * @param singles Map<id numérico, ficha JSON>
 */
export function buildGard({ csv, trimmed, singles }, meta, version) {
  const tags = new Map(trimmed.map((t) => [String(t.id), t]));
  const records = [];
  for (const row of csv) {
    const digits = row.id.replace(/^GARD:/, '');
    const code = gardCode(digits);
    const num = String(Number(digits));
    const single = singles.get(num) ?? null;
    const tag = tags.get(num) ?? null;
    const designations = [];
    pushDesignation(designations, row.name, 'en', true);
    row.synonyms.forEach((s) => pushDesignation(designations, s, 'en', false));
    let xrefs = [];
    const props = {};
    const external = {};
    let status = 'active';
    let replacedBy = null;
    if (single) {
      const g = gardXrefs(single);
      xrefs = g.xrefs;
      Object.assign(external, g.external);
      if (g.untyped.length) props.gard_untyped_xrefs = g.untyped;
      if (g.links.length) props.gard_links = g.links;
      if (single.Disease_Concept_Type__c) props.gard_concept_type = single.Disease_Concept_Type__c;
      if (single.SourceID__c) props.gard_source_id = single.SourceID__c;
      if (single.Description_Source__c) props.gard_description_source = single.Description_Source__c;
      if (single.Category_Linearization__c) props.gard_category_linearization = single.Category_Linearization__c;
      // Castellano: GARD lo toma de Orphanet (`Spanish_Description_Source__c`); se conserva esa fuente.
      const es = single.Display_Spanish_Disease_Name__c?.trim();
      if (es) {
        pushDesignation(designations, es, 'es', true);
        for (const s of (single.Spanish_GARD_Synonym__c ?? '').split(';')) pushDesignation(designations, s.trim(), 'es', false);
        if (single.Spanish_Description_Source__c) props.gard_spanish_source = single.Spanish_Description_Source__c;
      }
      if (single.Deprecated__c === 'Yes') {
        status = 'deprecated';
        replacedBy = single.Replaced_By_ID__c ? gardCode(String(single.Replaced_By_ID__c).replace(/^GARD:/, '')) : null;
      }
    }
    if (tag) {
      props.gard_tags = {
        ...(tag.tagsDiseaseCategory?.length ? { category: tag.tagsDiseaseCategory } : {}),
        ...(tag.tagsAccount?.length ? { account: tag.tagsAccount } : {}),
        ...(tag.tagsSpecialist?.length ? { specialist: tag.tagsSpecialist } : {}),
        ...(tag.tagsCause?.length ? { cause: tag.tagsCause } : {}),
      };
    }
    if (Object.keys(external).length) props.disease_external_xrefs = external;
    records.push({
      cs: 'gard',
      code,
      display: row.name,
      lang: 'en',
      definition: null,
      definitionLang: null,
      definitionRefs: [],
      designations,
      parents: [],
      status,
      replacedBy,
      properties: props,
      xrefs,
      provenance: { ...provenance(meta, version, code, 'gard'), uri: row.url ?? SYSTEMS.gard.uri(code) },
    });
  }
  return { version, records, excluded: {}, counts: { csv: csv.length, withFicha: records.filter((r) => singles.has(String(Number(r.code.slice(5))))).length } };
}

// --- NANDO (Turtle) -------------------------------------------------------------

/** Objeto Turtle: literal con idioma, IRI o token. Soporta `\"`, `\\`, `\n`, `\t` y `\uXXXX`. */
function readObjects(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === ',' || ch === '\t') {
      i++;
      continue;
    }
    if (ch === '"') {
      let value = '';
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\') {
          const nx = src[i + 1];
          if (nx === 'u') {
            value += String.fromCodePoint(parseInt(src.slice(i + 2, i + 6), 16));
            i += 6;
            continue;
          }
          value += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx;
          i += 2;
          continue;
        }
        value += src[i++];
      }
      i++;
      let lang = null;
      let datatype = null;
      if (src[i] === '@') {
        const m = /^@([A-Za-z0-9-]+)/.exec(src.slice(i));
        lang = m[1];
        i += m[0].length;
      } else if (src.startsWith('^^', i)) {
        const m = /^\^\^(<[^>]*>|\S+)/.exec(src.slice(i));
        datatype = m[1];
        i += m[0].length;
      }
      out.push({ type: 'literal', value, lang, datatype });
    } else if (ch === '<') {
      const end = src.indexOf('>', i);
      out.push({ type: 'iri', value: src.slice(i + 1, end) });
      i = end + 1;
    } else {
      const m = /^[^\s,;]+/.exec(src.slice(i));
      out.push({ type: 'token', value: m[0] });
      i += m[0].length;
    }
  }
  return out;
}

/** Turtle de NANDO → Map<IRI, Map<predicado, objetos[]>> (un bloque por sujeto, una línea por predicado). */
export function parseTurtleBlocks(text) {
  const subjects = new Map();
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split('\n').filter((l) => l.trim() !== '' && !l.startsWith('@prefix'));
    if (!lines.length || !lines[0].startsWith('<')) continue;
    const subject = lines[0].trim().replace(/^<|>$/g, '');
    const preds = new Map();
    for (const line of lines.slice(1)) {
      const m = /^\s+(\S+)\s+([\s\S]*?)\s*[;.]\s*$/.exec(line);
      if (!m) continue;
      const list = preds.get(m[1]) ?? preds.set(m[1], []).get(m[1]);
      list.push(...readObjects(m[2]));
    }
    subjects.set(subject, preds);
  }
  return subjects;
}

const NANDO_NS = 'http://nanbyodata.jp/ontology/NANDO_';
const OBO_NS = 'http://purl.obolibrary.org/obo/';
const NANDO_MATCH = { 'skos:exactMatch': 'equivalent', 'skos:closeMatch': 'inexact', 'skos:broadMatch': 'wider', 'skos:narrowMatch': 'narrower' };

export function nandoHeader(subjects) {
  for (const [, preds] of subjects) {
    if ((preds.get('a') ?? []).some((o) => o.value === 'owl:Ontology')) {
      return {
        license: preds.get('dcterms:license')?.[0]?.value ?? null,
        version: preds.get('owl:versionInfo')?.[0]?.value ?? null,
        modified: preds.get('dcterms:modified')?.[0]?.value?.slice(0, 10) ?? null,
      };
    }
  }
  return null;
}

export function buildNando(text, meta) {
  const subjects = parseTurtleBlocks(text);
  const header = nandoHeader(subjects);
  const version = `${header?.version ?? '?'} (${header?.modified ?? '?'})`;
  const records = [];
  for (const [iri, preds] of subjects) {
    if (!iri.startsWith(NANDO_NS)) continue;
    const get = (p) => preds.get(p) ?? [];
    // Hay sujetos que sólo traen `rdfs:seeAlso` (anotaciones sueltas, no clases): no son conceptos.
    if (!get('a').some((o) => o.value === 'owl:Class')) continue;
    const code = `NANDO:${iri.slice(NANDO_NS.length)}`;
    const labelsEn = get('rdfs:label').filter((o) => o.lang === 'en').map((o) => o.value);
    const labelsJa = get('rdfs:label').filter((o) => o.lang === 'ja').map((o) => o.value);
    const hira = get('rdfs:label').filter((o) => o.lang === 'ja-Hira').map((o) => o.value);
    const altEn = get('skos:altLabel').filter((o) => o.lang === 'en').map((o) => o.value);
    const altJa = get('skos:altLabel').filter((o) => o.lang === 'ja').map((o) => o.value);
    const prefJa = get('skos:prefLabel').find((o) => o.lang === 'ja')?.value ?? null;
    const description = get('dcterms:description').find((o) => o.lang === 'ja')?.value ?? null;
    const display = labelsEn[0] ?? prefJa ?? code;
    const designations = [];
    if (labelsEn.length) {
      pushDesignation(designations, labelsEn[0], 'en', true);
      labelsEn.slice(1).forEach((s) => pushDesignation(designations, s, 'en', false));
    }
    altEn.forEach((s) => pushDesignation(designations, s, 'en', false));
    const deprecated = get('owl:deprecated').some((o) => o.value === 'true');
    const xrefs = [];
    for (const [pred, equivalence] of Object.entries(NANDO_MATCH)) {
      for (const o of get(pred)) {
        if (o.type !== 'iri' && o.type !== 'token') continue;
        const curie = o.type === 'token' ? o.value.replace(/^obo:/, `${OBO_NS}`) : o.value;
        const m = /^http:\/\/purl\.obolibrary\.org\/obo\/MONDO_(\d+)$/.exec(curie);
        if (m) xrefs.push({ cs: 'mondo', code: `MONDO:${m[1]}`, equivalence, context: `nando:${pred}` });
      }
    }
    const parents = get('rdfs:subClassOf')
      .map((o) => o.value)
      .filter((v) => v.startsWith(NANDO_NS))
      .map((v) => `NANDO:${v.slice(NANDO_NS.length)}`);
    records.push({
      cs: 'nando',
      code,
      display,
      lang: labelsEn.length ? 'en' : 'ja',
      definition: null,
      definitionLang: null,
      definitionRefs: [],
      designations,
      parents,
      status: deprecated ? 'deprecated' : 'active',
      replacedBy: null,
      properties: {
        nando_ja: {
          ...(prefJa ? { prefLabel: prefJa } : {}),
          ...(labelsJa.length ? { labels: labelsJa } : {}),
          ...(hira.length ? { hiragana: hira } : {}),
          ...(altJa.length ? { altLabels: altJa } : {}),
          ...(description ? { description } : {}),
        },
        ...(get('nando:hasNotificationNumber').length ? { nando_notification_number: get('nando:hasNotificationNumber').map((o) => o.value) } : {}),
        ...(get('dcterms:source').length ? { nando_sources: get('dcterms:source').map((o) => o.value) } : {}),
        ...(get('rdfs:seeAlso').length ? { nando_see_also: get('rdfs:seeAlso').map((o) => o.value) } : {}),
      },
      xrefs,
      provenance: provenance(meta, version, code, 'nando'),
    });
  }
  return { version, header, records, excluded: {} };
}

// --- OncoTree ---------------------------------------------------------------------

export function buildOncotree(tree, meta, version) {
  const records = [];
  const walk = (nodes) => {
    for (const n of Object.values(nodes ?? {})) {
      const refs = n.externalReferences ?? {};
      const xrefs = [
        ...(refs.NCI ?? []).map((c) => ({ cs: 'ncit-disease', code: c, equivalence: null, context: 'oncotree:externalReferences NCI' })),
        ...(refs.UMLS ?? []).map((c) => ({ cs: 'umls', code: c, equivalence: null, context: 'oncotree:externalReferences UMLS' })),
      ];
      const designations = [];
      pushDesignation(designations, n.name, 'en', true);
      records.push({
        cs: 'oncotree',
        code: n.code,
        display: n.name,
        lang: 'en',
        definition: null,
        definitionLang: null,
        definitionRefs: [],
        designations,
        parents: n.parent ? [n.parent] : [],
        status: 'active',
        replacedBy: null,
        properties: {
          oncotree_level: n.level,
          ...(n.mainType ? { oncotree_main_type: n.mainType } : {}),
          ...(n.tissue ? { oncotree_tissue: n.tissue } : {}),
          ...(n.history?.length ? { oncotree_history: n.history } : {}),
          ...(n.revocations?.length ? { oncotree_revocations: n.revocations } : {}),
          ...(n.precursors?.length ? { oncotree_precursors: n.precursors } : {}),
        },
        xrefs,
        provenance: provenance(meta, version, n.code, 'oncotree'),
      });
      walk(n.children);
    }
  };
  walk(tree);
  return { version, records, excluded: {} };
}
