// =============================================================================
// Cruces de códigos publicados (puros). Sólo agregan códigos equivalentes que
// una fuente publica como tales; nunca por nombre. Cada código agregado lleva
// `via` (cruce) y `predicate` (lo que dice el cruce), para que el consumidor
// pueda filtrar lo que no le alcance.
//
//   MONDO SSSOM        skos:exactMatch entre MONDO y MeSH, UMLS, DOID, OMIM,
//                      Orphanet, ICD-10 (OMS y CM), ICD-11, NCIt, EFO
//   DrugCentral        identifiers.tsv: DRUG_ID ↔ RxCUI, DrugBank, ChEMBL,
//                      UNII, MeSH, CHEBI (lo publica DrugCentral)
//
// La «clave canónica» de cada lado sirve sólo para deduplicar pares entre
// fuentes (por código): MONDO si el cruce da exactamente uno; DrugCentral si da
// exactamente uno; si no, el primer código de la fuente.
// =============================================================================

import { SYSTEM, codeKey, curie } from './common.mjs';

const CROSSWALK_SYSTEMS = new Set([SYSTEM.MESH, SYSTEM.UMLS, SYSTEM.DOID, SYSTEM.OMIM, SYSTEM.ORPHA, SYSTEM.ICD10WHO, SYSTEM.ICD10CM, SYSTEM.ICD11, SYSTEM.NCIT, SYSTEM.EFO]);

function push(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

/** Índices de MONDO SSSOM, sólo `skos:exactMatch`. */
export function mondoIndex(text) {
  const toMondo = new Map();
  const fromMondo = new Map();
  let header = null;
  for (const line of text.split(/\r?\n/)) {
    if (line === '' || line.startsWith('#')) continue;
    const cells = line.split('\t');
    if (!header) {
      header = Object.fromEntries(cells.map((c, i) => [c, i]));
      continue;
    }
    if (cells[header.predicate_id] !== 'skos:exactMatch') continue;
    const mondo = curie(cells[header.subject_id]);
    const other = curie(cells[header.object_id]);
    if (!mondo || mondo.system !== SYSTEM.MONDO || !other || !CROSSWALK_SYSTEMS.has(other.system)) continue;
    push(toMondo, codeKey(other), mondo);
    push(fromMondo, codeKey(mondo), other);
  }
  return { toMondo, fromMondo };
}

/** Índice inverso de DrugCentral: código externo → DRUG_ID(s). */
export function drugCentralIndex(byDrug) {
  const toDrugCentral = new Map();
  for (const [drugId, codes] of byDrug) for (const c of codes) push(toDrugCentral, codeKey(c), drugId);
  return { byDrug, toDrugCentral };
}

const uniqueBy = (list, keyOf) => [...new Map(list.map((x) => [keyOf(x), x])).values()];

/**
 * Códigos de enfermedad agregados por cruces publicados:
 *   1. MeSH concepto (M#) → descriptor (D#), solo si el concepto es el PREFERIDO del descriptor (`mesh`);
 *      encabezado MeSH publicado como texto (EMA) → descriptor, solo por igualdad exacta con un único DescriptorName.
 *   2. Un salto a MONDO (SSSOM exactMatch) y, si es único, sus exactMatch.
 */
export function resolveCondition(codes, mondo, mesh = null) {
  const own = new Set(codes.map(codeKey));
  const added = [];
  const expanded = [];
  for (const c of codes) {
    let d = null;
    let via = 'mesh-descriptor-concepts';
    let predicate = 'preferred concept of descriptor';
    if (c.system === SYSTEM.MESH_CONCEPT) d = mesh?.byConcept.get(c.code) ?? null;
    else if (c.system === SYSTEM.MESH_HEADING) {
      // El encabezado publicado por la fuente es EXACTAMENTE el nombre de un único descriptor MeSH.
      const hits = mesh?.byHeading.get(c.code) ?? [];
      d = hits.length === 1 ? hits[0] : null;
      via = 'mesh-main-heading-exact';
      predicate = 'exact string equality with MeSH DescriptorName (source declares the field as MeSH)';
    }
    if (d && !own.has(`MESH:${d}`) && !expanded.some((e) => e.code === d)) {
      const x = { system: SYSTEM.MESH, code: d };
      expanded.push(x);
      added.push({ ...x, via, predicate, from: codeKey(c) });
    }
  }
  const base = codes.concat(expanded);
  const mondos = uniqueBy(
    base.filter((c) => c.system === SYSTEM.MONDO).concat(base.flatMap((c) => mondo.toMondo.get(codeKey(c)) ?? [])),
    codeKey,
  );
  for (const m of mondos) if (!own.has(codeKey(m))) added.push({ ...m, via: 'mondo-sssom', predicate: 'skos:exactMatch', from: 'source codes' });
  if (mondos.length === 1) {
    for (const x of mondo.fromMondo.get(codeKey(mondos[0])) ?? []) {
      if (!own.has(codeKey(x)) && !expanded.some((e) => codeKey(e) === codeKey(x))) added.push({ ...x, via: 'mondo-sssom', predicate: 'skos:exactMatch', from: codeKey(mondos[0]) });
    }
  }
  // Clave canónica: MONDO si el cruce da uno solo; si no, el descriptor MeSH; si no, el primer código de la fuente.
  const canonical = mondos.length === 1 ? codeKey(mondos[0]) : expanded.length > 0 ? codeKey(expanded[0]) : codeKey(codes[0]);
  return { added: uniqueBy(added, codeKey), canonical, mondoAmbiguous: mondos.length > 1 ? mondos.map(codeKey) : null };
}

/** Códigos de fármaco agregados por DrugCentral (sólo si el cruce da un único DRUG_ID). Una combinación no se resuelve. */
export function resolveDrug(codes, drugCentral, { combination = false } = {}) {
  if (combination) return { added: [], canonical: `COMBINATION(${codes.map(codeKey).sort().join('+')})`, drugCentralAmbiguous: null };
  const own = new Set(codes.map(codeKey));
  const ids = [...new Set(codes.flatMap((c) => (c.system === SYSTEM.DRUGCENTRAL ? [c.code] : drugCentral.toDrugCentral.get(codeKey(c)) ?? [])))];
  const added = [];
  if (ids.length === 1) {
    const dc = { system: SYSTEM.DRUGCENTRAL, code: ids[0] };
    if (!own.has(codeKey(dc))) added.push({ ...dc, via: 'drugcentral-identifiers', predicate: 'DrugCentral identifier', from: 'source codes' });
    for (const { via, ...x } of drugCentral.byDrug.get(ids[0]) ?? []) {
      if (!own.has(codeKey(x))) added.push({ ...x, via: via ?? 'drugcentral-identifiers', predicate: 'DrugCentral identifier', from: `DRUGCENTRAL:${ids[0]}` });
    }
  }
  const canonical = ids.length === 1 ? `DRUGCENTRAL:${ids[0]}` : codeKey(codes[0]);
  return { added: uniqueBy(added, codeKey), canonical, drugCentralAmbiguous: ids.length > 1 ? ids : null };
}

/**
 * Índice DrugCentral de una versión posterior, SIN pisar lo que ya dice el índice anterior:
 * un código que ya apunta a un DRUG_ID conserva ese apuntador (no se vuelve ambiguo por una
 * versión nueva). Las entradas nuevas llevan su `via` (versión) para poder filtrarlas por licencia.
 */
export function extendDrugCentralIndex(index, byDrug, via) {
  for (const [drugId, codes] of byDrug) {
    if (!index.byDrug.has(drugId)) index.byDrug.set(drugId, []);
    const have = new Set(index.byDrug.get(drugId).map(codeKey));
    for (const c of codes) {
      const key = codeKey(c);
      if (have.has(key)) continue;
      if (index.toDrugCentral.has(key) && !index.toDrugCentral.get(key).includes(drugId)) continue; // ya apunta a otro fármaco
      index.byDrug.get(drugId).push({ ...c, via });
      have.add(key);
      if (!index.toDrugCentral.has(key)) index.toDrugCentral.set(key, []);
      if (!index.toDrugCentral.get(key).includes(drugId)) index.toDrugCentral.get(key).push(drugId);
    }
  }
  return index;
}

const ATC_PREDICATE = {
  'rxclass-atc': 'RxClass classMembers relaSource=ATC',
  'chembl-atc': 'ChEMBL molecule.atc_classifications',
  'wikidata-ids': 'Wikidata P267 (ATC code)',
  'drugcentral-ids': 'DrugCentral struct2atc',
};

/**
 * ATC (nivel 5) de un fármaco: por CÓDIGO EXACTO, usando cada índice publicado
 * (`atcIndexes`: lista de `{ via, map: codeKey → [{system:'ATC', code}] }`). Se consultan los
 * códigos de la fuente y los agregados por el cruce de identificadores de DrugCentral.
 * Un fármaco puede tener varios ATC (los publica la fuente); todos se conservan.
 * Una combinación de ingredientes no se resuelve.
 */
export function resolveAtc(drugCodes, atcIndexes, { combination = false } = {}) {
  if (combination) return [];
  const added = [];
  for (const { via, map } of atcIndexes) {
    for (const c of drugCodes) {
      for (const atc of map.get(codeKey(c)) ?? []) {
        added.push({ system: SYSTEM.ATC, code: atc.code, via, predicate: ATC_PREDICATE[via] ?? via, from: codeKey(c) });
      }
    }
  }
  // Un mismo ATC puede venir del mismo cruce por varios códigos del fármaco (RxCUI, ChEMBL, DrugBank…): se deja
  // uno solo por (ATC, cruce) con el primer código que lo justifica, en el orden en que `drugCodes` los trae.
  const first = new Map();
  for (const x of added) if (!first.has(`${x.code}|${x.via}`)) first.set(`${x.code}|${x.via}`, x);
  return [...first.values()];
}

/** Aplica los cruces a una afirmación (devuelve una copia con `crosswalk` y `pairKey`). */
export function withCrosswalk(assertion, { mondo, drugCentral, mesh = null, atc = [] }) {
  const condition = resolveCondition(assertion.condition.codes, mondo, mesh);
  const drug = resolveDrug(assertion.drug.codes, drugCentral, { combination: assertion.drug.combination === true });
  const atcAdded = resolveAtc([...assertion.drug.codes, ...drug.added], atc, { combination: assertion.drug.combination === true });
  return {
    ...assertion,
    crosswalk: {
      drug: [...drug.added, ...atcAdded],
      condition: condition.added,
      ambiguous: { drugCentral: drug.drugCentralAmbiguous, mondo: condition.mondoAmbiguous },
    },
    pairKey: `${drug.canonical}|${condition.canonical}`,
  };
}
