// =============================================================================
// Catálogo de alergias · normalización por fuente y pasadas de saturación.
//
// Cada pasada lee UNA fuente independiente y devuelve registros comunes
// (`makeRecord`). `runPasses` las aplica en orden y deduplica: un registro cuyo
// (codeSystem, code) ya existe no es nuevo; si la fuente declara una
// equivalencia con algo ya cargado (Mondo `equivalentTo` → DOID), tampoco. Lo
// que una pasada aporta queda contado en su informe, que es el registro del
// protocolo de saturación (`docs/seed-research/allergies.md`).
//
// Reglas: nada se traduce ni se infiere. El nombre en castellano sólo existe si
// la fuente lo publica (HPO con estado OFFICIAL y sobre la etiqueta vigente;
// Open Food Facts en `es:`); si no, el `display` es el de la fuente y lo dice
// `displayLanguage`. Los códigos SNOMED CT de los paquetes no se leen.
// =============================================================================

import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { flattenCodeSystem, oboDescendants, owlDescendants, valueSetMembers } from './parse.mjs';
import { RXNORM_LEXICAL_GROUPS } from './sources.mjs';

export const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';
export const NDFRT_SYSTEM = 'http://hl7.org/fhir/ndfrt';
export const CVX_SYSTEM = 'http://hl7.org/fhir/sid/cvx';

/** OID de los value sets de VSAC que se usan (procedencia de cada fila). */
export const VSAC = {
  CLINICAL_DRUG_INGREDIENT: '2.16.840.1.113762.1.4.1010.7',
  PRESCRIBABLE_BRAND_NAME: '2.16.840.1.113762.1.4.1237.18',
  MEDICINAL_INGREDIENTS: '2.16.840.1.113762.1.4.1237.22',
  MEDICATION_DRUG_CLASS: '2.16.840.1.113883.3.88.12.80.18',
  CVX_ADMINISTERED_VACCINE_SET: '2.16.840.1.113762.1.4.1010.6',
};

/** Prefijos de xref de OBO que NO se guardan: terminologías con licencia que no tenemos. */
const LICENSED_XREF_PREFIXES = /^(SCTID|SNOMEDCT|SNOMEDCT_US(_\d{4}_\d{2}_\d{2})?|MedDRA|MEDDRA)$/i;

export const conceptIdOf = (codeSystem, code) => md5uuid(`mantra:allergy-catalog:concept:${codeSystem}:${code}`);

/**
 * @param {object} input
 * @returns {object} registro común (ver SCHEMA en README)
 */
export function makeRecord(input) {
  const designations = input.designations ?? [];
  const es = designations.find((d) => d.lang === 'es' && d.preferred);
  const en = designations.find((d) => d.lang === 'en' && d.preferred);
  const display = es?.value ?? en?.value ?? input.code;
  return {
    id: conceptIdOf(input.codeSystem, input.code),
    codeSystem: input.codeSystem,
    code: input.code,
    display,
    displayLanguage: es ? 'es' : 'en',
    designations,
    definitions: input.definitions ?? {},
    valueSets: input.valueSets ?? [],
    parents: input.parents ?? [],
    crossParents: input.crossParents ?? [],
    properties: input.properties ?? {},
    provenance: input.provenance,
    selectable: input.selectable ?? true,
  };
}

const pref = (lang, value) => ({ lang, value, preferred: true });
const syn = (lang, value) => ({ lang, value, preferred: false });

function provenanceOf(manifest, key, extra) {
  const a = manifest.artifacts[key];
  if (!a) throw new Error(`Falta el artefacto «${key}» en manifest.json: corré fetch-allergy-sources.mjs.`);
  return {
    artifact: key,
    artifactSpec: a.spec,
    artifactVersion: a.version,
    artifactUrl: a.url,
    artifactSha256: a.sha256,
    retrievedAt: a.retrievedAt,
    license: a.license,
    owner: a.owner,
    ...extra,
  };
}

// --- Pasada 1 · enumeraciones HL7 -----------------------------------------------

/** CodeSystems de HL7 que se cargan completos, con el paquete de origen. */
export const HL7_CODE_SYSTEMS = [
  ['fhir-r5-core', 'CodeSystem-allergy-intolerance-type.json'],
  ['fhir-r5-core', 'CodeSystem-allergy-intolerance-category.json'],
  ['fhir-r5-core', 'CodeSystem-allergy-intolerance-criticality.json'],
  ['fhir-r5-core', 'CodeSystem-reaction-event-severity.json'],
  ['hl7-terminology', 'CodeSystem-allergyintolerance-clinical.json'],
  ['hl7-terminology', 'CodeSystem-allergyintolerance-verification.json'],
  ['hl7-terminology', 'CodeSystem-reaction-event-certainty.json'],
  ['hl7-terminology', 'CodeSystem-allerg-intol-substance-exp-risk.json'],
  ['hl7-terminology', 'CodeSystem-v2-0127.json'],
  ['hl7-terminology', 'CodeSystem-v2-0128.json'],
  ['hl7-terminology', 'CodeSystem-v2-0436.json'],
  ['hl7-terminology', 'CodeSystem-v2-0438.json'],
];

/** El código propio es `<id del CodeSystem>|<código>`: los códigos HL7 se repiten entre sistemas (`confirmed`). */
export const hl7Code = (codeSystemId, code) => `${codeSystemId}|${code}`;

export function passHl7(ctx) {
  const out = [];
  for (const [key, file] of HL7_CODE_SYSTEMS) {
    const cs = ctx.readPackageJson(key, file);
    for (const c of flattenCodeSystem(cs)) {
      out.push(
        makeRecord({
          codeSystem: 'allergy-hl7-fhir',
          code: hl7Code(cs.id, c.code),
          designations: [pref('en', c.display)],
          definitions: c.definition ? { en: c.definition } : {},
          parents: c.parent ? [hl7Code(cs.id, c.parent)] : [],
          properties: { hl7_code_system: cs.url, hl7_code_system_version: cs.version ?? null },
          provenance: provenanceOf(ctx.manifest, key, { sourceSystem: cs.url, sourceCode: c.code, sourceVersion: cs.version ?? null, file }),
        }),
      );
    }
  }
  return out;
}

// --- Pasadas VSAC (RxNorm, NDF-RT, CVX) -----------------------------------------

function vsacSet(ctx, oid) {
  return ctx.readPackageJson('vsac', `ValueSet-${oid}.json`);
}

/** Pasada 2 · ingredientes RxNorm de «Clinical Drug Ingredient», sin las marcas (BN). */
export function passRxnormIngredients(ctx) {
  const vs = vsacSet(ctx, VSAC.CLINICAL_DRUG_INGREDIENT);
  const brand = new Set(valueSetMembers(vsacSet(ctx, VSAC.PRESCRIBABLE_BRAND_NAME)).map((m) => m.code));
  const ingredients = new Set(valueSetMembers(vsacSet(ctx, VSAC.MEDICINAL_INGREDIENTS)).map((m) => m.code));
  const rxVersion = vs.compose?.include?.find((i) => i.system === RXNORM_SYSTEM)?.version ?? null;
  const out = [];
  ctx.discarded.push({ pass: 'rxnorm-ingredients', reason: 'marca comercial (TTY=BN según el value set VSAC 1237.18): la alergia se registra al ingrediente', count: 0 });
  const brandDiscard = ctx.discarded.at(-1);
  for (const m of valueSetMembers(vs)) {
    if (m.system !== RXNORM_SYSTEM) continue;
    if (brand.has(m.code) && !ingredients.has(m.code)) {
      brandDiscard.count += 1;
      continue;
    }
    out.push(rxnormRecord(ctx, m, VSAC.CLINICAL_DRUG_INGREDIENT, vs.version, rxVersion, ingredients.has(m.code)));
  }
  return out;
}

function rxnormRecord(ctx, m, oid, vsVersion, rxVersion, ttyIngredient) {
  const groups = RXNORM_LEXICAL_GROUPS.filter((g) => g.pattern.test(m.display));
  return makeRecord({
    codeSystem: 'allergy-rxnorm-ingredients',
    code: m.code,
    designations: [pref('en', m.display)],
    valueSets: ['allergy-substances', 'allergy-substances-medication-ingredient', ...groups.map((g) => `allergy-substances-rxnorm-${g.key}`)],
    properties: {
      rxnorm_tty_group: ttyIngredient ? 'IN|PIN|MIN' : 'IN|PIN|MIN|BN (sin desambiguar en VSAC)',
      ...(groups.length > 0 ? { category_rule: groups.map((g) => ({ group: g.key, rule: `nombre RxNorm coincide con ${g.pattern}` })) } : {}),
    },
    provenance: provenanceOf(ctx.manifest, 'vsac', { sourceSystem: RXNORM_SYSTEM, sourceCode: m.code, sourceVersion: rxVersion, viaValueSet: `urn:oid:${oid}`, viaValueSetVersion: vsVersion }),
  });
}

/** Pasada 3 · clases NDF-RT de «Medication Drug Class». */
export function passNdfrtClasses(ctx) {
  const vs = vsacSet(ctx, VSAC.MEDICATION_DRUG_CLASS);
  const version = vs.compose?.include?.[0]?.version ?? null;
  return valueSetMembers(vs)
    .filter((m) => m.system === NDFRT_SYSTEM)
    .map((m) => {
      const kind = m.display.match(/\[([^\]]+)\]\s*$/)?.[1] ?? null;
      return makeRecord({
        codeSystem: 'allergy-ndfrt-drug-classes',
        code: m.code,
        designations: [pref('en', m.display)],
        valueSets: ['allergy-substances', 'allergy-substances-drug-class'],
        properties: kind ? { ndfrt_kind: kind } : {},
        provenance: provenanceOf(ctx.manifest, 'vsac', { sourceSystem: NDFRT_SYSTEM, sourceCode: m.code, sourceVersion: version, viaValueSet: `urn:oid:${VSAC.MEDICATION_DRUG_CLASS}`, viaValueSetVersion: vs.version }),
      });
    });
}

function cvxRecord(ctx, artifactKey, m, oid, vsVersion) {
  return makeRecord({
    codeSystem: 'allergy-cvx-vaccines',
    code: m.code,
    designations: [pref('en', m.display ?? m.code)],
    valueSets: ['allergy-substances', 'allergy-substances-vaccine'],
    provenance: provenanceOf(ctx.manifest, artifactKey, { sourceSystem: CVX_SYSTEM, sourceCode: m.code, sourceVersion: null, viaValueSet: `urn:oid:${oid}`, viaValueSetVersion: vsVersion }),
  });
}

/** Pasada 4 · CVX del value set de vacunas administradas de VSAC (activas, inactivas y no-EE. UU.). */
export function passCvxVsac(ctx) {
  const vs = vsacSet(ctx, VSAC.CVX_ADMINISTERED_VACCINE_SET);
  return valueSetMembers(vs).filter((m) => m.system === CVX_SYSTEM).map((m) => cvxRecord(ctx, 'vsac', m, VSAC.CVX_ADMINISTERED_VACCINE_SET, vs.version));
}

/**
 * Value sets de PHIN VADS con CVX que se leen: los de «vacunas administradas».
 * El resto (p. ej. 1049 «Substance Administered (CRA)») trae códigos CVX nunca
 * activos con rótulos abreviados («Hep C», «malaria»): no son productos.
 */
export const PHINVADS_CVX_SETS = new Set(['2.16.840.1.114222.4.11.934', '2.16.840.1.114222.4.11.7448']);

/** Rótulos CVX que no nombran una sustancia (códigos administrativos del propio CVX). */
const CVX_NOT_A_SUBSTANCE = /^(no vaccine administered|unknown|unknown vaccine or immune globulin|RESERVED - do not use)$/i;

/** Pasada 5 · los demás value sets con CVX de VSAC y los de vacunas administradas de PHIN VADS. */
export function passCvxOthers(ctx) {
  const out = [];
  const skipped = { administrative: new Set(), otherSets: new Set() };
  for (const key of ['vsac', 'phinvads']) {
    for (const vs of ctx.listPackageValueSets(key)) {
      const oid = vs.id;
      if (key === 'vsac' && oid === VSAC.CVX_ADMINISTERED_VACCINE_SET) continue;
      for (const m of valueSetMembers(vs)) {
        if (m.system !== CVX_SYSTEM || !m.display) continue;
        if (CVX_NOT_A_SUBSTANCE.test(m.display.trim())) {
          skipped.administrative.add(m.code);
          continue;
        }
        if (key === 'phinvads' && !PHINVADS_CVX_SETS.has(oid)) {
          skipped.otherSets.add(m.code);
          continue;
        }
        out.push(cvxRecord(ctx, key, m, oid, vs.version ?? null));
      }
    }
  }
  const kept = new Set(out.map((r) => r.code));
  ctx.discarded.push({ pass: 'cvx-others', reason: 'código CVX administrativo («no vaccine administered», «unknown», «RESERVED»)', count: skipped.administrative.size });
  ctx.discarded.push({ pass: 'cvx-others', reason: 'código CVX sólo presente en value sets de PHIN VADS que no son de vacunas administradas (códigos nunca activos)', count: [...skipped.otherSets].filter((c) => !kept.has(c)).length });
  return out;
}

/** Pasada 6 · ingredientes de «Medicinal Ingredients RXNORM» (IN/PIN/MIN) que no estaban en la pasada 2. */
export function passRxnormMedicinalIngredients(ctx) {
  const vs = vsacSet(ctx, VSAC.MEDICINAL_INGREDIENTS);
  const rxVersion = vs.compose?.include?.find((i) => i.system === RXNORM_SYSTEM)?.version ?? null;
  return valueSetMembers(vs).filter((m) => m.system === RXNORM_SYSTEM).map((m) => rxnormRecord(ctx, m, VSAC.MEDICINAL_INGREDIENTS, vs.version, rxVersion, true));
}

/**
 * Pasada 7 · value sets de VSAC cuyo título habla de alergia o intolerancia y
 * listan RxNorm. No aportan sustancias nuevas que no sean ingredientes (los
 * productos SCD/SBD no son sustancia); sí aportan el agrupamiento que declara
 * VSAC («Penicillin Allergy RXNORM»…), que se guarda en `vsac_allergy_value_sets`.
 */
export function passVsacAllergyGroupings(ctx, loaded) {
  const out = [];
  const products = new Set();
  const groupings = new Map();
  for (const vs of ctx.listPackageValueSets('vsac')) {
    const title = vs.title ?? vs.name ?? '';
    if (!/allerg|intoleran/i.test(title)) continue;
    for (const m of valueSetMembers(vs)) {
      if (m.system !== RXNORM_SYSTEM) continue;
      const id = conceptIdOf('allergy-rxnorm-ingredients', m.code);
      if (!loaded.has(id)) {
        products.add(m.code);
        continue;
      }
      if (!groupings.has(id)) groupings.set(id, []);
      groupings.get(id).push({ oid: vs.id, title, version: vs.version ?? null });
    }
  }
  ctx.discarded.push({ pass: 'vsac-allergy-groupings', reason: 'código RxNorm de producto (no ingrediente): no es una sustancia', count: products.size });
  for (const [id, sets] of groupings) loaded.get(id).properties.vsac_allergy_value_sets = sets;
  return out;
}

// --- Pasadas OBO (HPO, DOID, Mondo) --------------------------------------------

/** Traducciones oficiales de la HPO, sólo si traducen la etiqueta VIGENTE. */
export function hpoSpanish(terms, babelonRows) {
  const labels = new Map();
  const synonyms = new Map();
  const defs = new Map();
  let stale = 0;
  for (const r of babelonRows) {
    if (r.translation_status !== 'OFFICIAL' || r.translation_language !== 'es') continue;
    const term = terms.get(r.subject_id);
    if (!term) continue;
    if (r.predicate_id === 'rdfs:label') {
      if (term.name !== r.source_value) {
        stale += 1;
        continue;
      }
      labels.set(r.subject_id, r.translation_value);
    } else if (r.predicate_id === 'oboInOwl:hasExactSynonym') {
      if (!synonyms.has(r.subject_id)) synonyms.set(r.subject_id, []);
      synonyms.get(r.subject_id).push(r.translation_value);
    } else if (r.predicate_id === 'IAO:0000115' && term.def === r.source_value) {
      defs.set(r.subject_id, r.translation_value);
    }
  }
  return { labels, synonyms, defs, stale };
}

function xrefsOf(term) {
  const out = {};
  for (const x of term.xrefs) {
    const [prefix] = x.id.split(':');
    if (!prefix || LICENSED_XREF_PREFIXES.test(prefix)) continue;
    (out[prefix] ??= []).push(x.id);
  }
  return out;
}

function oboRecord(ctx, { artifactKey, codeSystem, term, valueSets, inSet, es, sourceSystem, sourceVersion }) {
  const designations = [pref('en', term.name)];
  for (const s of term.synonyms) if (s.scope === 'EXACT') designations.push(syn('en', s.text));
  if (es?.labels.has(term.id)) designations.push(pref('es', es.labels.get(term.id)));
  for (const s of es?.synonyms.get(term.id) ?? []) designations.push(syn('es', s));
  const definitions = {};
  if (term.def) definitions.en = term.def;
  if (es?.defs.has(term.id)) definitions.es = es.defs.get(term.id);
  const xrefs = xrefsOf(term);
  return makeRecord({
    codeSystem,
    code: term.id,
    designations,
    definitions,
    valueSets,
    parents: term.isA.filter((p) => inSet.has(p)),
    properties: Object.keys(xrefs).length > 0 ? { external_ids: xrefs } : {},
    provenance: provenanceOf(ctx.manifest, artifactKey, { sourceSystem, sourceCode: term.id, sourceVersion }),
  });
}

export const HPO_ALLERGY_ROOT = 'HP:0012393';
export const HPO_PHENOTYPE_ROOT = 'HP:0000118';
export const DOID_ALLERGY_ROOT = 'DOID:1205';
export const MONDO_ALLERGY_ROOT = 'MONDO:0005271';

/** Pasada 8 · HPO: «Allergy» (tipos de alergia) y «Phenotypic abnormality» (manifestaciones). */
export function passHpo(ctx) {
  const { header, terms } = ctx.readObo('hpo');
  const es = hpoSpanish(terms, ctx.readTsv('hpo-es'));
  ctx.notes.hpoStaleTranslations = es.stale;
  const version = header['data-version']?.[0] ?? null;
  const allergy = new Set([HPO_ALLERGY_ROOT, ...oboDescendants(terms, HPO_ALLERGY_ROOT)]);
  const phenotype = new Set([HPO_PHENOTYPE_ROOT, ...oboDescendants(terms, HPO_PHENOTYPE_ROOT)]);
  const out = [];
  for (const id of phenotype) {
    const term = terms.get(id);
    if (!term || term.obsolete) continue;
    const valueSets = ['allergy-manifestations'];
    if (allergy.has(id)) valueSets.push('allergy-conditions');
    out.push(oboRecord(ctx, { artifactKey: 'hpo', codeSystem: 'allergy-hpo', term, valueSets, inSet: phenotype, es, sourceSystem: 'http://purl.obolibrary.org/obo/hp.owl', sourceVersion: version }));
  }
  return out;
}

/** Pasada 9 · Disease Ontology: DOID:1205 «allergic disease» y descendientes. */
export function passDoid(ctx) {
  const { header, terms } = ctx.readObo('doid');
  const version = header['data-version']?.[0] ?? null;
  const set = new Set([DOID_ALLERGY_ROOT, ...oboDescendants(terms, DOID_ALLERGY_ROOT)]);
  return [...set].map((id) =>
    oboRecord(ctx, { artifactKey: 'doid', codeSystem: 'allergy-doid', term: terms.get(id), valueSets: ['allergy-conditions'], inSet: set, sourceSystem: 'http://purl.obolibrary.org/obo/doid.owl', sourceVersion: version }),
  );
}

/**
 * Pasada 10 · Mondo: MONDO:0005271 y descendientes. Un término que Mondo
 * declara `equivalentTo` un DOID ya cargado no es nuevo: su id Mondo se agrega a
 * los `external_ids` del DOID y no se crea otro concepto.
 */
export function passMondo(ctx, loaded) {
  const { terms } = ctx.readObo('mondo');
  const version = ctx.manifest.artifacts.mondo?.version ?? null;
  const set = new Set([MONDO_ALLERGY_ROOT, ...oboDescendants(terms, MONDO_ALLERGY_ROOT)]);
  /** id Mondo → registro DOID equivalente ya cargado. */
  const merged = new Map();
  for (const id of set) {
    const doid = terms.get(id).xrefs.find((x) => x.id.startsWith('DOID:') && x.sources.includes('MONDO:equivalentTo'));
    const doidRecord = doid ? loaded.get(conceptIdOf('allergy-doid', doid.id)) : undefined;
    if (doidRecord) merged.set(id, doidRecord);
  }
  const out = [];
  for (const id of set) {
    const doidRecord = merged.get(id);
    if (doidRecord) {
      const ext = (doidRecord.properties.external_ids ??= {});
      ext.MONDO = [...new Set([...(ext.MONDO ?? []), id])];
      doidRecord.properties.mondo_equivalence = 'MONDO:equivalentTo (declarado por Mondo)';
      continue;
    }
    const term = terms.get(id);
    const record = oboRecord(ctx, { artifactKey: 'mondo', codeSystem: 'allergy-mondo', term, valueSets: ['allergy-conditions'], inSet: set, sourceSystem: 'http://purl.obolibrary.org/obo/mondo.owl', sourceVersion: version });
    // Un padre que se fusionó con su DOID equivalente: la relación apunta al DOID.
    record.parents = record.parents.filter((p) => !merged.has(p));
    record.crossParents = term.isA.filter((p) => merged.has(p)).map((p) => ({ codeSystem: 'allergy-doid', code: merged.get(p).code }));
    out.push(record);
  }
  ctx.discarded.push({ pass: 'mondo', reason: 'Mondo lo declara equivalentTo un DOID ya cargado (se anota como external_id)', count: merged.size });
  return out;
}

// --- Pasadas Open Food Facts ------------------------------------------------------

function offRecord(ctx, artifactKey, codeSystem, entry, valueSets, byName) {
  const designations = [pref('en', entry.names.en[0]), ...entry.names.en.slice(1).map((n) => syn('en', n))];
  if (entry.names.es?.length) designations.push(pref('es', entry.names.es[0]), ...entry.names.es.slice(1).map((n) => syn('es', n)));
  const properties = {};
  if (entry.props.wikidata) properties.wikidata = entry.props.wikidata;
  if (entry.props.e_number) properties.e_number = `E${entry.props.e_number}`;
  if (entry.props.efsa_evaluation_url) properties.efsa_evaluation = { title: entry.props.efsa_evaluation ?? null, date: entry.props.efsa_evaluation_date ?? null, url: entry.props.efsa_evaluation_url };
  if (entry.props.additives_classes) properties.additive_classes = entry.props.additives_classes.split(',').map((s) => s.trim());
  const parents = entry.parents.map((p) => byName.get(`${p.lang}:${p.name.toLowerCase()}`)).filter(Boolean);
  return makeRecord({
    codeSystem,
    code: entry.id,
    designations,
    valueSets,
    parents,
    properties,
    provenance: provenanceOf(ctx.manifest, artifactKey, { sourceSystem: `https://world.openfoodfacts.org/${artifactKey === 'off-allergens' ? 'allergen' : 'additive'}/`, sourceCode: entry.id, sourceVersion: ctx.manifest.artifacts[artifactKey]?.version ?? null }),
  });
}

/** Índice nombre→id de una taxonomía OFF para resolver `< en: padre`. */
function offNameIndex(entries) {
  const byName = new Map();
  for (const e of entries) for (const [lang, names] of Object.entries(e.names)) for (const n of names) byName.set(`${lang}:${n.toLowerCase()}`, e.id);
  return byName;
}

/** Pasada 11 · alérgenos de Open Food Facts (sin la entrada «none»). */
export function passOffAllergens(ctx) {
  const entries = ctx.readOff('off-allergens').filter((e) => e.id !== 'en:none');
  const byName = offNameIndex(entries);
  return entries.map((e) => offRecord(ctx, 'off-allergens', 'allergy-off-allergens', e, ['allergy-substances', 'allergy-substances-food-allergen'], byName));
}

/** Pasada 12 · aditivos de Open Food Facts con número E declarado. */
export function passOffAdditives(ctx) {
  const all = ctx.readOff('off-additives');
  const entries = all.filter((e) => e.props.e_number);
  ctx.discarded.push({ pass: 'off-additives', reason: 'entrada de la taxonomía sin número E (clase o agrupador, no aditivo)', count: all.length - entries.length });
  const byName = offNameIndex(entries);
  return entries.map((e) => offRecord(ctx, 'off-additives', 'allergy-off-additives', e, ['allergy-substances', 'allergy-substances-food-additive'], byName));
}

// --- Pasadas de control (fuentes independientes que no deberían aportar) ---------

/**
 * Pasada 13 · barrido léxico de DOID, Mondo y HPO: términos vigentes cuyo
 * NOMBRE contiene «allergy»/«allergic» fuera de los subárboles ya cargados.
 * Sólo se cuentan y se listan; no se cargan, porque estar fuera del subárbol
 * significa que la propia ontología no los clasifica como alergia (y el texto
 * incluye «non-allergic…»).
 */
export function passLexicalSweep(ctx, loaded) {
  const found = [];
  for (const [key, codeSystem] of [['doid', 'allergy-doid'], ['mondo', 'allergy-mondo'], ['hpo', 'allergy-hpo']]) {
    const { terms } = ctx.readObo(key);
    for (const term of terms.values()) {
      if (term.obsolete || !term.name || !/\ballerg(y|ic|ies)\b/i.test(term.name)) continue;
      if (loaded.has(conceptIdOf(codeSystem, term.id))) continue;
      if (codeSystem === 'allergy-mondo' && term.xrefs.some((x) => x.sources.includes('MONDO:equivalentTo') && loaded.has(conceptIdOf('allergy-doid', x.id)))) continue;
      found.push({ id: term.id, name: term.name });
    }
  }
  ctx.notes.lexicalSweep = found;
  ctx.discarded.push({ pass: 'lexical-sweep', reason: 'nombre con «allerg…» pero fuera del subárbol de alergia de su ontología: no se carga (ver lista en meta)', count: found.length });
  return [];
}

/** Pasada 14 · value sets no-SNOMED de PHIN VADS sobre alergias (tipos v2 0127/0128): ya cubiertos por la pasada 1. */
export function passPhinvadsAllergyTypes(ctx) {
  const out = [];
  for (const vs of ctx.listPackageValueSets('phinvads')) {
    for (const m of valueSetMembers(vs)) {
      const csId = { 'http://terminology.hl7.org/CodeSystem/v2-0127': 'v2-0127', 'http://terminology.hl7.org/CodeSystem/v2-0128': 'v2-0128', 'http://terminology.hl7.org/CodeSystem/v2-0436': 'v2-0436', 'http://terminology.hl7.org/CodeSystem/v2-0438': 'v2-0438' }[m.system];
      if (!csId) continue;
      out.push(
        makeRecord({
          codeSystem: 'allergy-hl7-fhir',
          code: hl7Code(csId, m.code),
          designations: [pref('en', m.display ?? m.code)],
          provenance: provenanceOf(ctx.manifest, 'phinvads', { sourceSystem: m.system, sourceCode: m.code, sourceVersion: null, viaValueSet: vs.id }),
        }),
      );
    }
  }
  return out;
}

// --- Pasadas OWL (ChEBI vía ECTO, OAE, FoodOn) ------------------------------------

function owlRecord(ctx, { artifactKey, codeSystem, cls, valueSets, inSet, sourceSystem, sourceVersion, extraProps = {} }) {
  const designations = [pref('en', cls.label), ...cls.synonyms.map((x) => syn('en', x))];
  return makeRecord({
    codeSystem,
    code: cls.id,
    designations,
    definitions: cls.def ? { en: cls.def } : {},
    valueSets,
    parents: cls.subClassOf.filter((p) => inSet.has(p)),
    properties: extraProps,
    provenance: provenanceOf(ctx.manifest, artifactKey, { sourceSystem, sourceCode: cls.id, sourceVersion }),
  });
}

/** Clases de alérgeno de ChEBI (rol y agrupadores) tal como las publica ECTO. */
export const CHEBI_ALLERGEN_CLASSES = ['CHEBI:50904', 'CHEBI:88184', 'CHEBI:88186', 'CHEBI:88187', 'CHEBI:88188'];
const HAS_ROLE = 'RO:0000087';

/**
 * Pasada 15 · ChEBI (extracto publicado por ECTO): químicos con
 * `has role` → alérgeno (o una de sus clases), los descendientes de esas clases
 * y las clases mismas. Sólo ids CHEBI:*.
 */
export function passChebiAllergens(ctx) {
  const { classes, version } = ctx.readOwl('ecto');
  const groups = new Set(CHEBI_ALLERGEN_CLASSES.filter((id) => classes.has(id)));
  for (const g of [...groups]) for (const d of owlDescendants(classes, g)) groups.add(d);
  const set = new Set(groups);
  for (const c of classes.values()) {
    if (c.deprecated || !c.id.startsWith('CHEBI:')) continue;
    if (c.restrictions.some((r) => r.property === HAS_ROLE && groups.has(r.value))) set.add(c.id);
  }
  const out = [];
  for (const id of set) {
    const cls = classes.get(id);
    if (!cls?.label || !id.startsWith('CHEBI:')) continue;
    const roles = cls.restrictions.filter((r) => r.property === HAS_ROLE && groups.has(r.value)).map((r) => r.value);
    out.push(owlRecord(ctx, { artifactKey: 'ecto', codeSystem: 'allergy-chebi', cls, valueSets: ['allergy-substances', 'allergy-substances-chemical-allergen'], inSet: set, sourceSystem: 'http://purl.obolibrary.org/obo/chebi.owl', sourceVersion: version, extraProps: roles.length > 0 ? { chebi_allergen_roles: roles } : {} }));
  }
  return out;
}

export const OAE_ALLERGY_ROOT = 'OAE:0000568';

/** Pasada 16 · OAE: «allergy AE» y descendientes (tipos de evento adverso alérgico). */
export function passOaeAllergy(ctx) {
  const { classes, version } = ctx.readOwl('oae');
  const set = new Set([OAE_ALLERGY_ROOT, ...owlDescendants(classes, OAE_ALLERGY_ROOT)]);
  return [...set]
    .map((id) => classes.get(id))
    .filter((c) => c?.label)
    .map((cls) => owlRecord(ctx, { artifactKey: 'oae', codeSystem: 'allergy-oae', cls, valueSets: ['allergy-adverse-event-types'], inSet: set, sourceSystem: 'http://purl.obolibrary.org/obo/oae.owl', sourceVersion: version }));
}

export const FOODON_LABELLING_ROOT = 'FOODON:03510213';

/** Pasada 17 · FoodOn: «food allergen labelling» y sus categorías. */
export function passFoodonLabelling(ctx) {
  const { classes, version } = ctx.readOwl('foodon');
  const set = new Set([FOODON_LABELLING_ROOT, ...owlDescendants(classes, FOODON_LABELLING_ROOT)]);
  return [...set]
    .map((id) => classes.get(id))
    .filter((c) => c?.label)
    .map((cls) => owlRecord(ctx, { artifactKey: 'foodon', codeSystem: 'allergy-foodon', cls, valueSets: ['allergy-food-allergen-labelling'], inSet: set, sourceSystem: 'http://purl.obolibrary.org/obo/foodon.owl', sourceVersion: version }));
}

/** Pasada 18 · guías FHIR nacionales (Chile CL Core, HL7 Europe EU Base): códigos de alergia que no sean SNOMED CT. */
export function passNationalFhirIgs(ctx) {
  const found = [];
  for (const key of ['fhir-cl-core', 'fhir-eu-base']) {
    for (const res of ctx.listPackageResources(key, /^(CodeSystem|ValueSet)-/)) {
      const text = `${res.title ?? ''} ${res.name ?? ''} ${res.description ?? ''}`;
      if (!/alerg|allerg|intoler/i.test(text)) continue;
      const members = res.resourceType === 'CodeSystem' ? flattenCodeSystem(res).map((c) => ({ system: res.url, code: c.code })) : valueSetMembers(res);
      found.push({ key, id: res.id, members: members.filter((m) => m.system && !m.system.includes('snomed')).length });
    }
  }
  ctx.notes.nationalFhirIgs = found;
  ctx.discarded.push({ pass: 'national-fhir-igs', reason: 'recursos de alergia de CL Core / EU Base sin códigos propios fuera de SNOMED CT', count: found.reduce((a, f) => a + f.members, 0) });
  return [];
}

/**
 * Pasada 19 · Symptom Ontology: términos de reacción alérgica. Se listan y no
 * se cargan: la HPO ya ofrece esas manifestaciones con nombre oficial en
 * castellano y SYMP no declara equivalencias con la HPO.
 */
export function passSymptomOntology(ctx) {
  const { terms } = ctx.readObo('symp');
  const found = [...terms.values()].filter((t) => !t.obsolete && t.name && /\b(allerg\w*|urticaria|anaphyla\w*|angioedema|hypersensitivity)\b/i.test(t.name)).map((t) => ({ id: t.id, name: t.name }));
  ctx.notes.symptomOntology = found;
  ctx.discarded.push({ pass: 'symptom-ontology', reason: 'manifestación ya cubierta por la HPO (con castellano oficial); SYMP no declara equivalencia', count: found.length });
  return [];
}

/** Pasada 20 · ECTO: exposiciones a alérgenos. Son exposiciones, no sustancias: se cuentan y no se cargan. */
export function passEctoExposures(ctx) {
  const { classes } = ctx.readOwl('ecto');
  const found = [...classes.values()].filter((c) => !c.deprecated && c.id.startsWith('ECTO:') && c.restrictions.some((r) => CHEBI_ALLERGEN_CLASSES.includes(r.value))).map((c) => ({ id: c.id, name: c.label }));
  ctx.notes.ectoExposures = found;
  ctx.discarded.push({ pass: 'ecto-exposures', reason: 'clase de exposición (ECTO), no sustancia: la sustancia ya está en la pasada 15', count: found.length });
  return [];
}

/**
 * Orden de las pasadas. Cada una es una fuente (o un value set) independiente;
 * el informe cuenta cuántos conceptos nuevos dejó tras deduplicar.
 */
export const PASSES = [
  { n: 1, key: 'hl7-enums', title: 'HL7 FHIR R5 + HL7 Terminology: enumeraciones de AllergyIntolerance y tablas v2', run: passHl7 },
  { n: 2, key: 'rxnorm-ingredients', title: 'VSAC «Clinical Drug Ingredient» (RxNorm IN/PIN/MIN/BN, sin BN)', run: passRxnormIngredients },
  { n: 3, key: 'ndfrt-classes', title: 'VSAC «Medication Drug Class» (NDF-RT)', run: passNdfrtClasses },
  { n: 4, key: 'cvx-vsac', title: 'VSAC «CVX Vaccines Administered Vaccine Set»', run: passCvxVsac },
  { n: 5, key: 'cvx-others', title: 'Resto de value sets con CVX (VSAC + PHIN VADS)', run: passCvxOthers },
  { n: 6, key: 'rxnorm-medicinal-ingredients', title: 'VSAC «Medicinal Ingredients RXNORM» (otra versión de RxNorm)', run: passRxnormMedicinalIngredients },
  { n: 7, key: 'vsac-allergy-groupings', title: 'Value sets de VSAC sobre alergia con RxNorm (agrupamientos por clase)', run: passVsacAllergyGroupings },
  { n: 8, key: 'hpo', title: 'HPO (fenotipos y alergias) + traducción oficial al castellano', run: passHpo },
  { n: 9, key: 'doid', title: 'Disease Ontology — DOID:1205 allergic disease', run: passDoid },
  { n: 10, key: 'mondo', title: 'Mondo — MONDO:0005271 allergic disease (dedup. por equivalentTo)', run: passMondo },
  { n: 11, key: 'off-allergens', title: 'Open Food Facts — alérgenos', run: passOffAllergens },
  { n: 12, key: 'off-additives', title: 'Open Food Facts — aditivos (número E)', run: passOffAdditives },
  { n: 13, key: 'lexical-sweep', title: 'Barrido léxico «allerg…» en DOID/Mondo/HPO fuera de los subárboles', run: passLexicalSweep },
  { n: 14, key: 'phinvads-allergy-types', title: 'PHIN VADS — value sets HL7 v2 de alergia (0127/0128/0436/0438)', run: passPhinvadsAllergyTypes },
  { n: 15, key: 'chebi-allergens', title: 'ChEBI (vía ECTO) — químicos con rol «allergen» y clases de alérgeno', run: passChebiAllergens },
  { n: 16, key: 'oae-allergy', title: 'OAE — «allergy AE» y descendientes', run: passOaeAllergy },
  { n: 17, key: 'foodon-labelling', title: 'FoodOn — «food allergen labelling»', run: passFoodonLabelling },
  { n: 18, key: 'national-fhir-igs', title: 'Guías FHIR nacionales: HL7 Chile CL Core 1.9.4, HL7 Europe EU Base 2.0.0-ballot', run: passNationalFhirIgs },
  { n: 19, key: 'symptom-ontology', title: 'Symptom Ontology (DOID) — reacciones alérgicas', run: passSymptomOntology },
  { n: 20, key: 'ecto-exposures', title: 'ECTO — exposiciones a alérgenos', run: passEctoExposures },
];

/**
 * Aplica las pasadas en orden. `loaded` (id → registro) es el catálogo
 * deduplicado; un registro repetido no se agrega, pero sus value sets se suman
 * al existente (p. ej. el mismo CVX citado por otro value set).
 */
export function runPasses(ctx, passes = PASSES) {
  const loaded = new Map();
  const report = [];
  for (const pass of passes) {
    const produced = pass.run(ctx, loaded);
    let added = 0;
    let duplicates = 0;
    for (const record of produced) {
      const prev = loaded.get(record.id);
      if (prev) {
        duplicates += 1;
        prev.valueSets = [...new Set([...prev.valueSets, ...record.valueSets])];
        continue;
      }
      loaded.set(record.id, { ...record, pass: pass.n });
      added += 1;
    }
    report.push({ n: pass.n, key: pass.key, title: pass.title, read: produced.length, added, duplicates });
  }
  return { records: [...loaded.values()], report };
}
