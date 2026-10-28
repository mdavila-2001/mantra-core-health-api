// =============================================================================
// Catálogo de alergias · tanda 2 · pasadas de saturación 21 en adelante.
//
// Cada pasada lee UNA fuente (descargada por `fetch-allergy-open-sources.mjs`) y
// devuelve registros comunes (`makeRecord`, como las pasadas 1–20) y «parches».
// Un parche agrega designaciones, propiedades o value sets a un concepto que ya
// existe (de la tanda 1 o de esta) sin tocar sus filas: el cargador los inserta
// con `ON CONFLICT DO NOTHING`. Los ids siguen siendo
// md5('mantra:allergy-catalog:concept:<codeSystem>:<código>'), así que un
// concepto que la tanda 1 ya cargó NO se vuelve a emitir.
//
// Reglas (las mismas de la tanda 1): nada se traduce, redacta ni infiere; el
// castellano sólo aparece si la fuente lo publica (EUR-Lex, Wikidata por id
// exacto); nunca se cruza por parecido de nombre, sólo por código exacto o por
// una equivalencia que la propia fuente declara; sin SNOMED CT, MedDRA, ATC de
// la OMS, DrugBank ni otra terminología con licencia.
// =============================================================================

import { createHash } from 'node:crypto';

import { CHEBI_ALLERGEN_CLASSES, conceptIdOf, makeRecord } from './catalog.mjs';
import {
  parseCvx,
  parseCvxTradenames,
  parseEuAdditives1333,
  parseEuAnnex1169,
  parseGsrs,
  parseIuis,
  parseJatsTable,
  parseMajorFoodAllergens,
  parseNcitConcept,
  parseSplIngredients,
  meshDescriptors,
  parseUniprotTsv,
  uniprotMainName,
} from './parse-open.mjs';
import { RXNORM_LEXICAL_GROUPS } from './sources.mjs';

const pref = (lang, value) => ({ lang, value, preferred: true });
const syn = (lang, value) => ({ lang, value, preferred: false });
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const uniq = (a) => [...new Set(a)];

/** Procedencia de un registro de esta tanda, desde `manifest-open.json`. */
export function openProvenance(ctx, key, extra = {}, file = null) {
  const s = ctx.manifest.sources[key];
  if (!s) throw new Error(`Falta «${key}» en manifest-open.json: corré fetch-allergy-open-sources.mjs.`);
  const f = file ? s.files?.find((x) => x.path === file) : s.files?.[0];
  // las fuentes con muchos archivos (SPL, GSRS, miembros de clases, estados) se declaran con un resumen (cantidad + SHA-256 del conjunto), no archivo por archivo
  const aggregated = Boolean(s.digest || s.splDigest || s.membersEpc || s.statusOfRetired);
  if (file && !f && !aggregated) throw new Error(`«${key}» no tiene el archivo ${file} en el manifiesto`);
  return {
    artifact: key,
    artifactSpec: s.files ? `${key}${file ? `/${file.split('/').slice(1).join('/')}` : ''}` : key,
    artifactVersion: s.version,
    artifactUrl: f?.url ?? extra.recordUrl ?? extra.url ?? null,
    artifactSha256: f?.sha256 ?? extra.sha256 ?? null,
    retrievedAt: s.retrievedAt,
    license: s.license,
    owner: s.owner,
    ...extra,
  };
}

/** Parche sobre un concepto ya existente: designaciones nuevas, propiedades nuevas y/o value sets. */
export function makePatch({ codeSystem, code, designations = [], properties = {}, valueSets = [], provenanceKey, provenance }) {
  return { patch: true, id: conceptIdOf(codeSystem, code), codeSystem, code, designations, properties, valueSets, provenanceKey, provenance };
}

const sortedBy = (arr, fn) => [...arr].sort((a, b) => (fn(a) < fn(b) ? -1 : fn(a) > fn(b) ? 1 : 0));

// --- 21–23 · allergen.org (WHO/IUIS) ---------------------------------------------------------------

function iuisData(ctx) {
  if (!ctx.cache.iuis) {
    const data = parseIuis(ctx.read('iuis/allergen.csv'), ctx.read('iuis/isoallergen.csv'));
    const dates = [...data.allergens.map((a) => a.dateUpdated), ...data.isoallergens.map((i) => i.dateUpdated)].sort();
    data.version = dates.at(-1).slice(0, 10);
    ctx.cache.iuis = data;
  }
  return ctx.cache.iuis;
}

const IUIS_URL = 'https://www.allergen.org/';
const TAXSOURCE = (t) => `taxsource:${t}`;
const TAXORDER = (t, o) => `taxorder:${t}|${o}`;

/** Pasada 21 · fuentes biológicas (especies) con su agrupación taxonómica tal como la publica allergen.org. */
export function passIuisSources(ctx) {
  const { allergens, version } = iuisData(ctx);
  const p = (code, extra = {}) => openProvenance(ctx, 'iuis', { sourceSystem: IUIS_URL, sourceCode: code, sourceVersion: version, ...extra }, 'iuis/allergen.csv');
  const out = [];
  const taxSources = uniq(allergens.map((a) => a.taxSource)).sort();
  for (const t of taxSources) {
    out.push(makeRecord({ codeSystem: 'allergy-iuis-sources', code: TAXSOURCE(t), designations: [pref('en', t)], valueSets: [], properties: { iuis_level: 'TaxSource' }, provenance: p(TAXSOURCE(t)), selectable: false }));
  }
  const orders = uniq(allergens.filter((a) => a.taxOrder).map((a) => `${a.taxSource}\u0000${a.taxOrder}`)).sort();
  for (const k of orders) {
    const [t, o] = k.split('\u0000');
    out.push(makeRecord({ codeSystem: 'allergy-iuis-sources', code: TAXORDER(t, o), designations: [pref('en', o)], parents: [TAXSOURCE(t)], properties: { iuis_level: 'TaxOrder' }, provenance: p(TAXORDER(t, o)), selectable: false }));
  }
  const bySpecies = new Map();
  for (const a of sortedBy(allergens, (x) => x.species)) {
    if (!bySpecies.has(a.species)) bySpecies.set(a.species, { species: a.species, taxSource: a.taxSource, taxOrder: a.taxOrder, commons: new Set(), allergens: [] });
    const s = bySpecies.get(a.species);
    if (a.common) s.commons.add(a.common);
    s.allergens.push(a.name);
  }
  for (const s of bySpecies.values()) {
    out.push(
      makeRecord({
        codeSystem: 'allergy-iuis-sources',
        code: s.species,
        designations: [pref('en', s.species), ...[...s.commons].sort().map((c) => syn('en', c))],
        valueSets: ['allergy-substances', 'allergy-substances-allergen-source'],
        parents: [s.taxOrder ? TAXORDER(s.taxSource, s.taxOrder) : TAXSOURCE(s.taxSource)],
        properties: { iuis_level: 'Species', common_names: [...s.commons].sort(), iuis_allergens: s.allergens },
        provenance: p(s.species),
      }),
    );
  }
  return out;
}

/** Pasada 22 · moléculas alergénicas con nomenclatura oficial WHO/IUIS. */
export function passIuisAllergens(ctx) {
  const { allergens, version } = iuisData(ctx);
  return sortedBy(allergens, (a) => Number(a.id)).map((a) =>
    makeRecord({
      codeSystem: 'allergy-iuis-allergens',
      code: a.id,
      designations: [pref('en', a.name)],
      valueSets: ['allergy-substances', 'allergy-substances-allergen-molecule'],
      properties: {
        iuis_allergen_id: a.id,
        source_species: a.species,
        source_species_code: { codeSystem: 'allergy-iuis-sources', code: a.species },
        source_common_name: a.common || null,
        taxonomic_group: [a.taxSource, a.taxOrder].filter(Boolean).join(' / '),
        biochemical_name: a.bioName || null,
        molecular_mass: a.molecularMass || null,
        obsolete_names: a.obsoleteName || null,
        allergenicity: a.allergenicity || null,
        allergenicity_pubmed_refs: a.allergenicityRef || null,
        exposure_route: a.exposure || null,
        iuis_date_added: a.dateAdded,
        iuis_date_updated: a.dateUpdated,
      },
      provenance: openProvenance(ctx, 'iuis', { sourceSystem: IUIS_URL, sourceCode: a.id, sourceVersion: version, recordUrl: `https://www.allergen.org/viewallergen.php?aid=${a.id}` }, 'iuis/allergen.csv'),
    }),
  );
}

/** Pasada 23 · isoalérgenos (variantes) con sus accesiones públicas. Sin secuencias. */
export function passIuisIsoallergens(ctx) {
  const { isoallergens, version } = iuisData(ctx);
  return sortedBy(isoallergens, (i) => Number(i.id)).map((i) =>
    makeRecord({
      codeSystem: 'allergy-iuis-allergens',
      code: `iso:${i.id}`,
      designations: [pref('en', i.name)],
      valueSets: ['allergy-substances', 'allergy-substances-allergen-molecule'],
      crossParents: [{ codeSystem: 'allergy-iuis-allergens', code: i.allergenId }],
      properties: {
        iuis_isoallergen_id: i.id,
        iuis_allergen_id: i.allergenId,
        old_names: i.oldNames || null,
        accession_nucleotide: i.accNucleotide || null,
        accession_protein: i.accProtein || null,
        accession_uniprot: splitAcc(i.accUniProt),
        accession_pdb: i.accPdb || null,
        calculated_mass: i.calcMw || null,
        exposure_route: i.exposure || null,
        iuis_date_added: i.dateAdded,
        iuis_date_updated: i.dateUpdated,
      },
      provenance: openProvenance(ctx, 'iuis', { sourceSystem: IUIS_URL, sourceCode: i.id, sourceVersion: version }, 'iuis/isoallergen.csv'),
    }),
  );
}

const splitAcc = (s) => {
  const parts = s.split(/[\s;,]+/).filter(Boolean);
  return parts.length === 0 ? null : parts;
};

// --- 24 · UniProt KW-0020 --------------------------------------------------------------------------

/** Pasada 24 · UniProtKB con la palabra clave KW-0020 «Allergen». */
export function passUniprot(ctx) {
  const rows = parseUniprotTsv(ctx.read('uniprot/uniprotkb-kw0020.tsv'));
  const release = ctx.manifest.sources.uniprot.version.match(/UniProt (\S+)/)[1];
  // vínculo por accesión exacta con los isoalérgenos de allergen.org
  const iuisByAcc = new Map();
  for (const i of iuisData(ctx).isoallergens) for (const acc of splitAcc(i.accUniProt) ?? []) (iuisByAcc.get(acc) ?? iuisByAcc.set(acc, []).get(acc)).push(i.name);
  return sortedBy(rows, (r) => r.accession).map((r) =>
    makeRecord({
      codeSystem: 'allergy-uniprot',
      code: r.accession,
      designations: [pref('en', uniprotMainName(r.proteinNames))],
      valueSets: ['allergy-substances', 'allergy-substances-protein-allergen'],
      properties: {
        uniprot_entry_name: r.entryName,
        protein_names: r.proteinNames,
        gene_names: r.geneNames || null,
        organism: r.organism,
        organism_taxon_id: r.organismId,
        allergenic_properties: r.allergenicProperties || null,
        keywords: r.keywords,
        reviewed: r.reviewed,
        protein_existence: r.proteinExistence || null,
        sequence_length: r.length || null,
        iuis_isoallergens: iuisByAcc.get(r.accession) ?? null,
      },
      provenance: openProvenance(ctx, 'uniprot', { sourceSystem: 'https://rest.uniprot.org/uniprotkb/', sourceCode: r.accession, sourceVersion: release, recordUrl: `https://rest.uniprot.org/uniprotkb/${r.accession}` }, 'uniprot/uniprotkb-kw0020.tsv'),
    }),
  );
}

// --- 25–26 · CDC CVX ---------------------------------------------------------------------------------

const CVX_NOT_A_SUBSTANCE = /^(no vaccine administered|unknown|unknown vaccine or immune globulin|RESERVED - do not use)$/i;
const CVX_SYSTEM = 'http://hl7.org/fhir/sid/cvx';

/** Pasada 25 · CVX completo del CDC: los códigos nuevos y el estado oficial de todos. */
export function passCdcCvx(ctx) {
  const rows = parseCvx(ctx.read('cdc-cvx/cvx.txt')).filter((r) => !CVX_NOT_A_SUBSTANCE.test(r.short) && !CVX_NOT_A_SUBSTANCE.test(r.full));
  const out = [];
  const p = (code) => openProvenance(ctx, 'cdc-cvx', { sourceSystem: CVX_SYSTEM, sourceCode: code, sourceVersion: null }, 'cdc-cvx/cvx.txt');
  for (const r of rows) {
    const props = { cdc_cvx: { status: r.status, last_updated: r.updated, short_name: r.short, full_name: r.full, notes: r.notes || null, non_vaccine: r.nonVaccine } };
    if (ctx.base.has(conceptIdOf('allergy-cvx-vaccines', r.code))) {
      out.push(makePatch({ codeSystem: 'allergy-cvx-vaccines', code: r.code, properties: props, designations: [syn('en', r.short)], provenanceKey: 'cdc-cvx', provenance: p(r.code) }));
    } else {
      out.push(
        makeRecord({
          codeSystem: 'allergy-cvx-vaccines',
          code: r.code,
          designations: [pref('en', r.full), ...(r.short !== r.full ? [syn('en', r.short)] : [])],
          definitions: r.notes ? { en: r.notes } : {},
          valueSets: ['allergy-substances', 'allergy-substances-vaccine'],
          properties: props,
          provenance: p(r.code),
        }),
      );
    }
  }
  return out;
}

/** Pasada 26 · nombres comerciales de vacunas (tradename.txt) como sinónimos del CVX exacto que declara el CDC. */
export function passCdcCvxTradenames(ctx) {
  const rows = parseCvxTradenames(ctx.read('cdc-cvx/tradename.txt'));
  const byCvx = new Map();
  for (const r of rows) {
    const code = r.cvx.trim();
    if (!ctx.known(conceptIdOf('allergy-cvx-vaccines', code))) continue;
    if (!byCvx.has(code)) byCvx.set(code, []);
    byCvx.get(code).push(r);
  }
  const out = [];
  for (const [code, list] of sortedBy([...byCvx], (x) => x[0])) {
    const names = uniq(list.map((x) => x.name));
    out.push(
      makePatch({
        codeSystem: 'allergy-cvx-vaccines',
        code,
        designations: names.map((n) => syn('en', n)),
        properties: { cdc_cvx_trade_names: list.map((x) => ({ name: x.name, description: x.description, manufacturer: x.manufacturer || null, mvx: x.mvx || null, status: x.productStatus, last_updated: x.updated })) },
        provenanceKey: 'cdc-cvx',
        provenance: openProvenance(ctx, 'cdc-cvx', { sourceSystem: CVX_SYSTEM, sourceCode: code, sourceVersion: null }, 'cdc-cvx/tradename.txt'),
      }),
    );
  }
  ctx.notes.cvxTradenamesWithoutConcept = rows.filter((r) => !ctx.known(conceptIdOf('allergy-cvx-vaccines', r.cvx.trim()))).length;
  return out;
}

// --- 29 · ChEBI completo (rol «allergen») -------------------------------------------------------------

const ROLE_REL = 'RO:0000087';
const ALLERGEN_ROLE = 'CHEBI:50904';

/** Pasada 29 · ChEBI lite: roles descendientes de «allergen» y todo compuesto con alguno de esos roles. */
export function passChebiFull(ctx) {
  const { terms, header } = ctx.chebi();
  const version = (header['data-version'] ?? ['chebi'])[0].replace('chebi/', '');
  const children = new Map();
  for (const t of terms.values()) for (const p of t.isA) (children.get(p) ?? children.set(p, []).get(p)).push(t.id);
  // grupos: el rol «allergen» y sus roles descendientes, más las clases de alérgeno que ya usó la tanda 1
  // (metal, catión metálico, penicilina, fármaco) con sus descendientes
  const roles = new Set([ALLERGEN_ROLE, ...CHEBI_ALLERGEN_CLASSES.filter((id) => terms.has(id))]);
  const stack = [...roles];
  while (stack.length) for (const c of children.get(stack.pop()) ?? []) if (!roles.has(c)) (roles.add(c), stack.push(c));
  const members = new Set(roles);
  for (const t of terms.values()) if (!t.obsolete && t.relationships.some((r) => r.rel === ROLE_REL && roles.has(r.target))) members.add(t.id);
  ctx.notes.chebiRoleClasses = [...roles].sort();
  const base = 'allergy-chebi';
  return sortedBy([...members], (x) => x)
    .map((id) => terms.get(id))
    .filter((t) => t?.name)
    .map((t) =>
      makeRecord({
        codeSystem: base,
        code: t.id,
        designations: [pref('en', t.name), ...t.synonyms.filter((s) => s.scope === 'EXACT').map((s) => syn('en', s.text))],
        definitions: t.def ? { en: t.def } : {},
        valueSets: ['allergy-substances', 'allergy-substances-chemical-allergen'],
        parents: t.isA.filter((p) => members.has(p)),
        properties: {
          ...(t.relationships.some((r) => r.rel === ROLE_REL && roles.has(r.target)) ? { chebi_allergen_roles: t.relationships.filter((r) => r.rel === ROLE_REL && roles.has(r.target)).map((r) => r.target) } : {}),
          chebi_release: version,
        },
        provenance: openProvenance(ctx, 'chebi-lite', { sourceSystem: 'http://purl.obolibrary.org/obo/chebi.owl', sourceCode: t.id, sourceVersion: `chebi/${version}` }, 'chebi-lite/chebi_lite.obo.gz'),
      }),
    );
}

// --- 30 · NCI Thesaurus ------------------------------------------------------------------------------------

const NCIT_ALLERGEN_ROOT = 'C62651';
const NCIT_HYPERSENSITIVITY_ROOT = 'C3114';

/** Pasada 30 · NCIt: «Allergen» (C62651) y «Hypersensitivity» (C3114) con todos sus descendientes. */
export function passNcit(ctx) {
  const concepts = new Map();
  for (const f of ctx.list('ncit/concepts')) {
    const c = parseNcitConcept(ctx.readJson(`ncit/concepts/${f}`));
    concepts.set(c.code, c);
  }
  const desc = (root) => new Set(ctx.readJson(`ncit/descendants-${root}.json`).map((d) => d.code));
  const allergen = new Set([NCIT_ALLERGEN_ROOT, ...desc(NCIT_ALLERGEN_ROOT)]);
  const hyper = new Set([NCIT_HYPERSENSITIVITY_ROOT, ...desc(NCIT_HYPERSENSITIVITY_ROOT)]);
  const inSet = new Set([...allergen, ...hyper]);
  const version = ctx.manifest.sources.ncit.version.match(/NCIt (\S+)/)[1];
  return sortedBy([...inSet], (x) => Number(x.slice(1))).map((code) => {
    const c = concepts.get(code);
    if (!c) throw new Error(`NCIt ${code} no se descargó`);
    const isAllergen = allergen.has(code);
    return makeRecord({
      codeSystem: 'allergy-ncit',
      code,
      designations: [pref('en', c.name), ...c.synonyms.map((s) => syn('en', s))],
      definitions: c.definition ? { en: c.definition } : {},
      valueSets: isAllergen ? ['allergy-substances', 'allergy-substances-ncit-allergen'] : ['allergy-conditions'],
      parents: c.parents.filter((p) => inSet.has(p)),
      properties: {
        ncit_semantic_types: c.semanticTypes,
        external_ids: Object.fromEntries(Object.entries({ CHEBI: c.chebi, UMLS_CUI: c.umls, NCI_META_CUI: c.ncitMeta }).filter(([, v]) => v.length > 0)),
        ncit_status: c.status,
      },
      provenance: openProvenance(ctx, 'ncit', { sourceSystem: 'http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl', sourceCode: code, sourceVersion: version, recordUrl: `https://api-evsrest.nci.nih.gov/api/v1/concept/ncit/${code}` }, `ncit/concepts/${code}.json`),
    });
  });
}

// --- 31–33 · normas oficiales -----------------------------------------------------------------------------------

/** Pasada 31 · Reglamento (UE) 1169/2011, anexo II: los 14 grupos, con texto oficial en castellano e inglés. */
export function passEuAllergens(ctx) {
  const consolidated = ctx.manifest.sources['eurlex-1169'].celex.consolidated;
  const es = parseEuAnnex1169(ctx.read(`eurlex-1169/${consolidated}.spa.xhtml`));
  const en = parseEuAnnex1169(ctx.read(`eurlex-1169/${consolidated}.eng.xhtml`));
  if (es.items.length !== en.items.length) throw new Error('El anexo II no tiene el mismo número de ítems en castellano e inglés');
  return es.items.map((it, i) => {
    const e = en.items[i];
    const code = `AII-${String(it.number).padStart(2, '0')}`;
    return makeRecord({
      codeSystem: 'allergy-eu-allergens',
      code,
      designations: [pref('es', it.title), pref('en', e.title)],
      definitions: { es: it.text, en: e.text },
      valueSets: ['allergy-substances', 'allergy-substances-eu-allergen'],
      properties: { annex_item: it.number, annex_title: { es: es.title, en: en.title }, exceptions: { es: it.exceptions, en: e.exceptions } },
      provenance: openProvenance(ctx, 'eurlex-1169', { sourceSystem: 'http://data.europa.eu/eli/reg/2011/1169/oj', sourceCode: String(it.number), sourceVersion: consolidated, legalAct: 'Reglamento (UE) n.º 1169/2011, anexo II (texto consolidado, informativo)', reuse: 'Decisión 2011/833/UE' }, `eurlex-1169/${consolidated}.spa.xhtml`),
    });
  });
}

/** Pasada 32 · Reglamento (CE) 1333/2008, anexo II parte B: número E y denominación oficial. */
export function passEuAdditives(ctx) {
  const consolidated = ctx.manifest.sources['eurlex-1333'].celex.consolidated;
  const es = parseEuAdditives1333(ctx.read(`eurlex-1333/${consolidated}.spa.xhtml`));
  const en = parseEuAdditives1333(ctx.read(`eurlex-1333/${consolidated}.eng.xhtml`));
  const byE = (rows) => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r.eNumber)) m.set(r.eNumber, { eNumber: r.eNumber, name: r.name, sections: [] });
      const x = m.get(r.eNumber);
      if (!x.sections.includes(r.section)) x.sections.push(r.section);
    }
    return m;
  };
  const esMap = byE(es);
  const enMap = byE(en);
  // correspondencia EXACTA por número E con la taxonomía de Open Food Facts ya cargada (propiedad e_number)
  const offByE = new Map();
  for (const r of ctx.base.values()) if (r.codeSystem === 'allergy-off-additives' && r.properties.e_number) offByE.set(r.properties.e_number.replace(/\s+/g, '').toUpperCase(), r.code);
  const normalize = (e) => e.replace(/\s+/g, '').toUpperCase();
  const consolidatedUrl = `http://publications.europa.eu/resource/celex/${consolidated}`;
  return sortedBy([...esMap.values()], (x) => x.eNumber.replace(/\D/g, '').padStart(5, '0') + x.eNumber).map((a) => {
    const e = enMap.get(a.eNumber);
    return makeRecord({
      codeSystem: 'allergy-eu-additives',
      code: a.eNumber,
      designations: [pref('es', a.name), ...(e ? [pref('en', e.name)] : [])],
      valueSets: ['allergy-substances', 'allergy-substances-eu-additive'],
      properties: {
        e_number: a.eNumber,
        annex_sections: { es: a.sections, en: e?.sections ?? null },
        ...(offByE.has(normalize(a.eNumber)) ? { same_e_number_as: { codeSystem: 'allergy-off-additives', code: offByE.get(normalize(a.eNumber)), basis: 'mismo número E (coincidencia exacta del código)' } } : {}),
      },
      provenance: openProvenance(ctx, 'eurlex-1333', { sourceSystem: 'http://data.europa.eu/eli/reg/2008/1333/oj', sourceCode: a.eNumber, sourceVersion: consolidated, legalAct: 'Reglamento (CE) n.º 1333/2008, anexo II, parte B (texto consolidado, informativo)', reuse: 'Decisión 2011/833/UE', url: consolidatedUrl }, `eurlex-1333/${consolidated}.spa.xhtml`),
    });
  });
}

/** Pasada 33 · FDCA §201(qq): los nueve alérgenos alimentarios mayores (FALCPA + FASTER Act). */
export function passUsMajorAllergens(ctx) {
  const parsed = parseMajorFoodAllergens(ctx.read('usc-21-321/USCODE-2023-title21-sec321.htm'));
  return parsed.items.map((it, i) =>
    makeRecord({
      codeSystem: 'allergy-fda-major-allergens',
      code: `qq-1-${i + 1}`,
      designations: [pref('en', it.name)],
      valueSets: ['allergy-substances', 'allergy-substances-us-major-allergen'],
      properties: { statute: '21 U.S.C. 321(qq)(1)', examples: it.examples, statute_text: it.text },
      provenance: openProvenance(ctx, 'usc-21-321', { sourceSystem: 'https://www.govinfo.gov/app/collection/uscode', sourceCode: `321(qq)(1)#${i + 1}`, sourceVersion: 'US Code 2023 (título 21)' }, 'usc-21-321/USCODE-2023-title21-sec321.htm'),
    }),
  );
}

// --- 35–36 · pruebas de parche -------------------------------------------------------------------------------------

/** Pasada 35 · serie basal europea (ESCD): alérgenos y concentración de las tablas del artículo abierto (CC BY). */
export function passEbs(ctx) {
  const out = [];
  const sets = [
    ['PMC13238334', 'cod70134-tbl-0002', 'EBS-2021-22', 'Serie basal europea, auditoría 2021/22 (ESSCA y EBS-WG de la ESCD)'],
    ['PMC13441338', 'cod70183-tbl-0002', 'EBS-ADD-2021-22', 'Adiciones auditadas a la serie basal europea, 2021/22'],
  ];
  for (const [pmc, table, prefix, label] of sets) {
    const t = parseJatsTable(ctx.read(`europepmc-ebs/${pmc}.xml`), table);
    let group = null;
    let n = 0;
    for (const row of t.rows.slice(1)) {
      if (row.length === 1) {
        group = row[0];
        continue;
      }
      n += 1;
      const [name, conc] = row;
      out.push(
        makeRecord({
          codeSystem: 'allergy-patch-test-series',
          code: `${prefix}:${String(n).padStart(2, '0')}`,
          designations: [pref('en', name)],
          valueSets: ['allergy-substances', 'allergy-substances-patch-test'],
          properties: { test_series: label, allergen_group: group, test_concentration_pct_mg_cm2: conc, vehicle_note: t.footnote, source_table: table, source_article: pmc },
          provenance: openProvenance(ctx, 'europepmc-ebs', { sourceSystem: `https://europepmc.org/article/PMC/${pmc.replace('PMC', '')}`, sourceCode: `${table}#${n}`, sourceVersion: pmc }, `europepmc-ebs/${pmc}.xml`),
        }),
      );
    }
  }
  return out;
}

/** Pasada 36 · T.R.U.E. TEST: ingredientes activos con UNII de la etiqueta SPL en DailyMed. */
export function passTrueTest(ctx) {
  const products = parseSplIngredients(ctx.read('dailymed-true-test/true-test.xml'));
  const seen = new Map();
  for (const p of products) for (const i of p.ingredients) if (i.role === 'ACTIB') if (!seen.has(i.unii)) seen.set(i.unii, { ...i, ndc: [p.ndc] });
  const out = [];
  for (const i of sortedBy([...seen.values()], (x) => x.unii)) {
    out.push(
      makeRecord({
        codeSystem: 'allergy-patch-test-series',
        code: `TRUE:${i.unii}`,
        designations: [pref('en', i.name)],
        valueSets: ['allergy-substances', 'allergy-substances-patch-test'],
        properties: { test_series: 'T.R.U.E. TEST (SmartPractice)', unii: i.unii },
        provenance: openProvenance(ctx, 'dailymed-true-test', { sourceSystem: 'https://dailymed.nlm.nih.gov/', sourceCode: i.unii, sourceVersion: ctx.manifest.sources['dailymed-true-test'].version }, 'dailymed-true-test/true-test.xml'),
      }),
    );
  }
  return out;
}

export const _internal = { sha256, parseGsrs, parseCvx, RXNORM_LEXICAL_GROUPS };

// --- 27–28 · RxNorm vigente y clases RxClass --------------------------------------------------------------------

const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';
const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

/** `05-Oct-2026` (RxNav) → `10052026` (nombre de la versión completa de RxNorm, como `05052025` en la tanda 1). */
export const rxnormVersionOf = (rxnavVersion) => {
  const m = rxnavVersion.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) throw new Error(`Versión de RxNav inesperada: ${rxnavVersion}`);
  return `${MONTHS[m[2]]}${m[1]}${m[3]}`;
};

const rxnormProvenance = (ctx, code, version, file) =>
  openProvenance(ctx, 'rxnav', { sourceSystem: RXNORM_SYSTEM, sourceCode: code, sourceVersion: version, recordUrl: `https://rxnav.nlm.nih.gov/REST/rxcui/${code}/properties.json` }, file);

/** Pasada 27 · RxNorm vigente (IN, PIN, MIN): los ingredientes nuevos, el TTY vigente de los ya cargados y el estado de los que ya no figuran. */
export function passRxnormCurrent(ctx) {
  const all = ctx.readJson('rxnav/allconcepts-IN-PIN-MIN.json').minConceptGroup.minConcept;
  const version = rxnormVersionOf(ctx.readJson('rxnav/version.json').version);
  const file = 'rxnav/allconcepts-IN-PIN-MIN.json';
  const out = [];
  const current = new Set();
  for (const c of sortedBy(all, (x) => Number(x.rxcui))) {
    current.add(c.rxcui);
    const id = conceptIdOf('allergy-rxnorm-ingredients', c.rxcui);
    if (ctx.base.has(id)) {
      out.push(makePatch({ codeSystem: 'allergy-rxnorm-ingredients', code: c.rxcui, properties: { rxnorm_current: { version, tty: c.tty } }, provenanceKey: 'rxnav', provenance: rxnormProvenance(ctx, c.rxcui, version, file) }));
      continue;
    }
    const groups = RXNORM_LEXICAL_GROUPS.filter((g) => g.pattern.test(c.name));
    out.push(
      makeRecord({
        codeSystem: 'allergy-rxnorm-ingredients',
        code: c.rxcui,
        designations: [pref('en', c.name)],
        valueSets: ['allergy-substances', 'allergy-substances-medication-ingredient', ...groups.map((g) => `allergy-substances-rxnorm-${g.key}`)],
        properties: {
          rxnorm_tty: c.tty,
          rxnorm_current: { version, tty: c.tty },
          ...(groups.length > 0 ? { category_rule: groups.map((g) => ({ group: g.key, rule: `nombre RxNorm coincide con ${g.pattern}` })) } : {}),
        },
        provenance: rxnormProvenance(ctx, c.rxcui, version, file),
      }),
    );
  }
  // ingredientes de la tanda 1 que ya no figuran: estado según RxNav
  const gone = [];
  for (const r of ctx.base.values()) if (r.codeSystem === 'allergy-rxnorm-ingredients' && !current.has(r.code)) gone.push(r.code);
  const statuses = {};
  for (const code of gone.sort((a, b) => Number(a) - Number(b))) {
    const rel = `rxnav/status/${code}.json`;
    if (!ctx.exists(rel)) continue;
    const h = ctx.readJson(rel)?.rxcuiStatusHistory;
    const m = h?.metaData;
    if (!m) continue;
    statuses[m.status] = (statuses[m.status] ?? 0) + 1;
    out.push(makePatch({ codeSystem: 'allergy-rxnorm-ingredients', code, properties: { rxnorm_status_in_current_release: { version, status: m.status, is_current: m.isCurrent === 'YES', release_start: m.releaseStartDate || null, release_end: m.releaseEndDate || null, remapped_date: m.remappedDate || null } }, provenanceKey: 'rxnav', provenance: rxnormProvenance(ctx, code, version, `rxnav/status/${code}.json`) }));
  }
  ctx.notes.rxnormRetired = { notInCurrentIngredientList: gone.length, statuses };
  return out;
}

const RXCLASS_URL = 'https://rxnav.nlm.nih.gov/REST/rxclass/allClasses.json';
const MEDRT_TYPES = ['EPC', 'MOA', 'PE', 'PK', 'TC', 'CHEM', 'VA'];
const MEDRT_SOURCE = { EPC: 'MED-RT / DailyMed', MOA: 'MED-RT', PE: 'MED-RT', PK: 'MED-RT', TC: 'MED-RT', CHEM: 'RxClass', VA: 'VA National Formulary' };

/** Pasada 28 · clases vigentes de RxClass: las que NDF-RT 20180301 no tenía, y la vigencia de las que sí. EPC con sus miembros RxNorm. */
export function passRxclass(ctx) {
  const out = [];
  const version = rxnormVersionOf(ctx.readJson('rxnav/version.json').version);
  const renamed = [];
  for (const type of MEDRT_TYPES) {
    const file = `rxnav/allClasses-${type}.json`;
    const classes = ctx.readJson(file).rxclassMinConceptList.rxclassMinConcept;
    for (const k of sortedBy(classes, (x) => x.classId)) {
      const p = openProvenance(ctx, 'rxnav', { sourceSystem: RXCLASS_URL, sourceCode: k.classId, sourceVersion: version, classType: type, classSource: MEDRT_SOURCE[type] }, file);
      const old = conceptIdOf('allergy-ndfrt-drug-classes', k.classId);
      if (ctx.base.has(old)) {
        const was = ctx.base.get(old).display.replace(/\s*\[[^\]]+\]\s*$/, '');
        if (was !== k.className) renamed.push({ classId: k.classId, ndfrt_2018: ctx.base.get(old).display, rxclass_now: k.className });
        out.push(makePatch({ codeSystem: 'allergy-ndfrt-drug-classes', code: k.classId, properties: { rxclass_current: { class_type: type, class_name: k.className, rxnorm_version: version } }, provenanceKey: 'rxnav', provenance: p }));
        continue;
      }
      out.push(
        makeRecord({
          codeSystem: 'allergy-medrt-classes',
          code: k.classId,
          designations: [pref('en', k.className)],
          valueSets: ['allergy-substances', 'allergy-substances-drug-class-medrt'],
          properties: { rxclass_class_type: type, class_source: MEDRT_SOURCE[type], ...(k.classUrl ? { class_url: k.classUrl } : {}) },
          provenance: p,
        }),
      );
    }
  }
  ctx.notes.rxclassRenamed = renamed;
  // miembros de cada EPC (RxClass, relaSource DAILYMED): propiedad en el ingrediente RxNorm cuyo RxCUI es exacto
  const epc = ctx.readJson('rxnav/allClasses-EPC.json').rxclassMinConceptList.rxclassMinConcept;
  const byRxcui = new Map();
  for (const k of epc) {
    const rel = `rxnav/members-EPC/${k.classId}.json`;
    if (!ctx.exists(rel)) continue;
    const members = ctx.readJson(rel)?.drugMemberGroup?.drugMember ?? [];
    for (const m of members) {
      if (!byRxcui.has(m.minConcept.rxcui)) byRxcui.set(m.minConcept.rxcui, []);
      byRxcui.get(m.minConcept.rxcui).push({ classId: k.classId, className: k.className, relation: (m.nodeAttr ?? []).find((a) => a.attrName === 'Relation')?.attrValue ?? null });
    }
  }
  ctx.notes.epcMembers = { classesWithMembers: epc.filter((k) => ctx.exists(`rxnav/members-EPC/${k.classId}.json`) && (ctx.readJson(`rxnav/members-EPC/${k.classId}.json`)?.drugMemberGroup?.drugMember ?? []).length > 0).length, rxcuiWithEpc: byRxcui.size };
  const epcFile = 'rxnav/allClasses-EPC.json';
  for (const [rxcui, classes] of sortedBy([...byRxcui], (x) => Number(x[0]))) {
    if (!ctx.known(conceptIdOf('allergy-rxnorm-ingredients', rxcui))) continue;
    out.push(makePatch({ codeSystem: 'allergy-rxnorm-ingredients', code: rxcui, properties: { fda_epc_classes: classes }, provenanceKey: 'rxnav', provenance: openProvenance(ctx, 'rxnav', { sourceSystem: 'https://rxnav.nlm.nih.gov/REST/rxclass/classMembers.json', sourceCode: rxcui, sourceVersion: version, relaSource: 'DAILYMED' }, epcFile) }));
  }
  return out;
}

// --- 37 · MeSH -----------------------------------------------------------------------------------------------------

const MESH_ALLERGEN_TREE = 'D23.050.063';
const MESH_HYPERSENSITIVITY_TREE = 'C20.543';

/** Pasada 37 · MeSH: «Allergens» (D23.050.063) e «Hypersensitivity» (C20.543) con sus descendientes. */
export function passMesh(ctx) {
  const descs = meshDescriptors(ctx.read('mesh/desc2026.allergy-subset.xml'), [MESH_ALLERGEN_TREE, MESH_HYPERSENSITIVITY_TREE]);
  const inSet = new Set(descs.map((d) => d.ui));
  const byTree = new Map();
  for (const d of descs) for (const t of d.trees) byTree.set(t, d.ui);
  const parentsOf = (d) => {
    const out = new Set();
    for (const t of d.trees) {
      const i = t.lastIndexOf('.');
      if (i > 0 && byTree.has(t.slice(0, i))) out.add(byTree.get(t.slice(0, i)));
    }
    return [...out].filter((p) => p !== d.ui);
  };
  return sortedBy(descs, (d) => d.ui).map((d) => {
    const allergen = d.trees.some((t) => t === MESH_ALLERGEN_TREE || t.startsWith(`${MESH_ALLERGEN_TREE}.`));
    return makeRecord({
      codeSystem: 'allergy-mesh',
      code: d.ui,
      designations: [pref('en', d.name), ...d.terms.map((t) => syn('en', t))],
      definitions: d.scopeNote ? { en: d.scopeNote } : {},
      valueSets: allergen ? ['allergy-substances', 'allergy-substances-mesh-allergen'] : ['allergy-conditions'],
      parents: parentsOf(d).filter((p) => inSet.has(p)),
      properties: { mesh_tree_numbers: d.trees },
      provenance: openProvenance(ctx, 'mesh', { sourceSystem: 'http://id.nlm.nih.gov/mesh/', sourceCode: d.ui, sourceVersion: '2026', recordUrl: `https://id.nlm.nih.gov/mesh/${d.ui}` }, 'mesh/desc2026.allergy-subset.xml'),
    });
  });
}

// --- 34 · FDA: sustancias activas (UNII) de los extractos alergénicos --------------------------------------------------

/**
 * Pasada 34 · UNII de los ingredientes activos (ACTIB) de las etiquetas SPL de los productos
 * alergénicos del directorio NDC de openFDA. El nombre oficial y la clase salen del GSRS.
 * El vínculo producto → etiqueta es el NDC de producto exacto; el de ingrediente → sustancia, el UNII que
 * la propia etiqueta declara (nunca el nombre).
 */
export function passFdaUnii(ctx) {
  const ndc = new Map();
  for (const f of ctx.list('openfda').filter((x) => x.startsWith('ndc-'))) for (const r of ctx.readJson(`openfda/${f}`).results) ndc.set(r.product_ndc, r);
  const bySubstance = new Map();
  let productsInSpl = 0;
  let productsWithoutNdcRow = 0;
  for (const f of ctx.list('dailymed/spl')) {
    const spl = ctx.readJson(`dailymed/spl/${f}`);
    for (const p of spl.products) {
      const row = p.ndc ? ndc.get(p.ndc) : null;
      if (!row) {
        productsWithoutNdcRow += 1;
        continue;
      }
      productsInSpl += 1;
      for (const i of p.ingredients.filter((x) => x.role === 'ACTIB')) {
        if (!bySubstance.has(i.unii)) bySubstance.set(i.unii, { unii: i.unii, names: new Set(), products: new Set(), types: new Set(), classes: new Set(), setids: new Set() });
        const s = bySubstance.get(i.unii);
        s.names.add(i.name);
        s.products.add(p.ndc);
        s.types.add(row.product_type);
        for (const c of row.pharm_class ?? []) s.classes.add(c);
        s.setids.add(spl.setid);
      }
    }
  }
  ctx.notes.fdaUnii = { ndcAllergenicProducts: ndc.size, splProductsLinkedToNdc: productsInSpl, splProductsNotAllergenicNdc: productsWithoutNdcRow, activeSubstances: bySubstance.size };
  const version = ctx.manifest.sources.openfda.version.match(/last_updated (\S+)/)?.[1] ?? null;
  const out = [];
  let gsrsMissing = 0;
  for (const s of sortedBy([...bySubstance.values()], (x) => x.unii)) {
    const gfile = `gsrs/substances/${s.unii}.json`;
    const g = ctx.exists(gfile) ? ctx.readJson(gfile) : null;
    const gs = g && g.approvalID ? parseGsrs(g) : null;
    if (!gs) gsrsMissing += 1;
    const splNames = [...s.names].sort();
    const display = gs?.name ?? splNames[0];
    // nombres del GSRS: los que llevan una etiqueta de origen entre corchetes («HOPS [VANDF]») no son sinónimos útiles de búsqueda: se conservan en una propiedad aparte
    const gsAll = (gs?.names ?? []).filter((n) => !n.preferred && ['cn', 'sys', 'bn'].includes(n.type));
    const TAGGED = /\s\[[A-Za-z0-9 .\-]+\]$/;
    const gsNames = gsAll.filter((n) => !TAGGED.test(n.name));
    const gsTagged = gsAll.filter((n) => TAGGED.test(n.name)).map((n) => n.name);
    out.push(
      makeRecord({
        codeSystem: 'allergy-fda-unii',
        code: s.unii,
        designations: [pref('en', display), ...uniq([...gsNames.map((n) => n.name), ...splNames]).filter((n) => n !== display).map((n) => syn('en', n))],
        valueSets: ['allergy-substances', 'allergy-substances-allergenic-extract-substance'],
        properties: {
          unii: s.unii,
          gsrs_substance_class: gs?.substanceClass ?? null,
          gsrs_status: gs?.status ?? null,
          source_organism: gs && (gs.organism.genus || gs.organism.species) ? gs.organism : null,
          gsrs_codes: gs && gs.codes.length > 0 ? gs.codes : null,
          ndc_product_types: [...s.types].sort(),
          ndc_pharm_classes: [...s.classes].sort(),
          ndc_product_count: s.products.size,
          spl_setid_count: s.setids.size,
          spl_names: splNames,
          gsrs_source_tagged_names: gsTagged.length > 0 ? gsTagged : null,
        },
        provenance: openProvenance(ctx, 'gsrs', { sourceSystem: 'https://gsrs.ncats.nih.gov/', sourceCode: s.unii, sourceVersion: version, recordUrl: `https://gsrs.ncats.nih.gov/api/v1/substances(${s.unii})`, via: ['openFDA NDC (product_type alergénico)', 'DailyMed SPL (ingredient classCode=ACTIB)'], gsrsLastEdited: gs?.lastEdited ?? null, gsrsVersion: gs?.version ?? null }, null),
      }),
    );
  }
  ctx.notes.fdaUnii.gsrsMissing = gsrsMissing;
  return out;
}

// --- 38 · Wikidata (CC0): etiquetas en castellano por identificador EXACTO --------------------------------------------------

/**
 * Propiedad de Wikidata y formato del valor para el identificador exacto de cada code system.
 * Nunca se busca por nombre: sólo `?item wdt:Pxxx "<id>"`.
 */
export const WIKIDATA_TARGETS = {
  'allergy-rxnorm-ingredients': { prop: 'P3345', label: 'RxCUI', value: (c) => c },
  'allergy-fda-unii': { prop: 'P652', label: 'UNII', value: (c) => c },
  'allergy-chebi': { prop: 'P683', label: 'ChEBI', value: (c) => c.replace(/^CHEBI:/, '') },
  'allergy-doid': { prop: 'P699', label: 'DOID', value: (c) => c },
  'allergy-mondo': { prop: 'P5270', label: 'Mondo', value: (c) => c.replace(/^MONDO:/, 'MONDO_') },
  'allergy-ncit': { prop: 'P1748', label: 'NCIt', value: (c) => c },
  'allergy-mesh': { prop: 'P486', label: 'MeSH', value: (c) => c },
  'allergy-uniprot': { prop: 'P352', label: 'UniProt', value: (c) => c },
};

/** Pasada 38 · etiquetas y alias en castellano de Wikidata, unidos por el identificador exacto de cada concepto. */
export function passWikidataEs(ctx) {
  if (!ctx.exists('wikidata') || ctx.list('wikidata').filter((f) => f.endsWith('.json')).length === 0) {
    ctx.discarded.push({ pass: 'wikidata-es', reason: 'sin descarga de Wikidata en esta corrida (corré fetch-allergy-wikidata.mjs)', count: 0 });
    return [];
  }
  const found = new Map(); // `${prop}|${valor}` → { items:Set, label:Set, alias:Set }
  for (const f of ctx.list('wikidata').filter((x) => x.endsWith('.json'))) {
    const prop = f.split('-')[0];
    for (const b of ctx.readJson(`wikidata/${f}`).results.bindings) {
      const k = `${prop}|${b.v.value}`;
      if (!found.has(k)) found.set(k, { items: new Set(), label: new Set(), alias: new Set() });
      const e = found.get(k);
      e.items.add(b.item.value.replace('http://www.wikidata.org/entity/', ''));
      if (b.es) e.label.add(b.es.value);
      if (b.alias) e.alias.add(b.alias.value);
    }
  }
  const out = [];
  const stats = { targets: 0, matched: 0, withSpanishLabel: 0, ambiguousItem: 0, noItem: 0 };
  const retrieved = ctx.manifest.sources.wikidata;
  for (const r of sortedBy(ctx.allRecords(), (x) => `${x.codeSystem}|${x.code}`)) {
    const t = WIKIDATA_TARGETS[r.codeSystem];
    if (!t) continue;
    stats.targets += 1;
    const e = found.get(`${t.prop}|${t.value(r.code)}`);
    if (!e) {
      stats.noItem += 1;
      continue;
    }
    if (e.items.size !== 1) {
      stats.ambiguousItem += 1;
      continue;
    }
    stats.matched += 1;
    if (e.label.size === 0) continue;
    if (e.label.size > 1) throw new Error(`Más de una etiqueta en castellano para ${r.codeSystem}|${r.code}`);
    stats.withSpanishLabel += 1;
    const [qid] = e.items;
    const [label] = e.label;
    const aliases = [...e.alias].sort().filter((a) => a !== label);
    out.push(
      makePatch({
        codeSystem: r.codeSystem,
        code: r.code,
        designations: [pref('es', label), ...aliases.map((a) => syn('es', a))],
        properties: { wikidata: { qid, matched_by: `${t.label} (${t.prop}) = ${t.value(r.code)}`, license: 'CC0-1.0' } },
        provenanceKey: 'wikidata',
        provenance: { artifact: 'wikidata', artifactSpec: `wdt:${t.prop}`, artifactVersion: retrieved.version, artifactUrl: `https://www.wikidata.org/wiki/${qid}`, artifactSha256: null, retrievedAt: retrieved.retrievedAt, license: retrieved.license, owner: retrieved.owner, sourceSystem: 'https://query.wikidata.org/sparql', sourceCode: qid },
      }),
    );
  }
  ctx.notes.wikidata = stats;
  return out;
}
