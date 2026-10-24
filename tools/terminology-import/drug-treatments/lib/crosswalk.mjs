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

/** Códigos de enfermedad agregados por MONDO (un salto a MONDO y, si es único, sus exactMatch). */
export function resolveCondition(codes, mondo) {
  const own = new Set(codes.map(codeKey));
  const mondos = uniqueBy(
    codes.filter((c) => c.system === SYSTEM.MONDO).concat(codes.flatMap((c) => mondo.toMondo.get(codeKey(c)) ?? [])),
    codeKey,
  );
  const added = [];
  for (const m of mondos) if (!own.has(codeKey(m))) added.push({ ...m, via: 'mondo-sssom', predicate: 'skos:exactMatch', from: 'source codes' });
  if (mondos.length === 1) {
    for (const x of mondo.fromMondo.get(codeKey(mondos[0])) ?? []) {
      if (!own.has(codeKey(x))) added.push({ ...x, via: 'mondo-sssom', predicate: 'skos:exactMatch', from: codeKey(mondos[0]) });
    }
  }
  const canonical = mondos.length === 1 ? codeKey(mondos[0]) : codeKey(codes[0]);
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
    for (const x of drugCentral.byDrug.get(ids[0]) ?? []) {
      if (!own.has(codeKey(x))) added.push({ ...x, via: 'drugcentral-identifiers', predicate: 'DrugCentral identifier', from: `DRUGCENTRAL:${ids[0]}` });
    }
  }
  const canonical = ids.length === 1 ? `DRUGCENTRAL:${ids[0]}` : codeKey(codes[0]);
  return { added: uniqueBy(added, codeKey), canonical, drugCentralAmbiguous: ids.length > 1 ? ids : null };
}

/** Aplica los cruces a una afirmación (devuelve una copia con `crosswalk` y `pairKey`). */
export function withCrosswalk(assertion, { mondo, drugCentral }) {
  const condition = resolveCondition(assertion.condition.codes, mondo);
  const drug = resolveDrug(assertion.drug.codes, drugCentral, { combination: assertion.drug.combination === true });
  return {
    ...assertion,
    crosswalk: {
      drug: drug.added,
      condition: condition.added,
      ambiguous: { drugCentral: drug.drugCentralAmbiguous, mondo: condition.mondoAmbiguous },
    },
    pairKey: `${drug.canonical}|${condition.canonical}`,
  };
}
