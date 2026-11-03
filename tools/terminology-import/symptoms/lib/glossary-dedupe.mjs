// =============================================================================
// Deduplicación del glosario: fenotipos de HPO ↔ fichas `wikidata-sintoma-*`.
//
// Regla (determinista, por código publicado, nunca por nombre): un ítem de
// Wikidata `Q` que declara la propiedad P3841 («Human Phenotype Ontology ID»)
// con el código `HP:n` de un fenotipo del glosario —o con uno de sus ids
// alternativos, que publica el propio HPO— es el MISMO síntoma que ese
// fenotipo. Si la ficha `wikidata-sintoma-q<n>` ya está en el glosario, el
// término HPO no se suma al glosario (sigue en el code system `hpo`) y queda
// enlazado a la ficha con un `concept_maps`.
//
// Funciones puras: el cargador (`load-symptoms.mjs`) consulta la base y aplica.
// =============================================================================

import { conceptId as glossaryConceptId } from '../../lib/glossary-es/load-plan.mjs';
import { md5uuid } from './load-plan.mjs';

/** Propiedad de Wikidata que declara el id de HPO de un ítem. */
export const HPO_ID_PROPERTY = 'P3841';
export const HPO_ID_PROPERTY_LABEL = 'Human Phenotype Ontology ID';

export const HPO_WIKIDATA_SPARQL = `SELECT ?x ?hpo WHERE { ?x wdt:${HPO_ID_PROPERTY} ?hpo }`;

const Q_ID = /^Q[1-9]\d*$/;
const HP_ID = /^HP:\d{7}$/;

/** Slug de la ficha que `wikidata-relations` crea para un destino de P780. */
export const wikidataSintomaSlug = (q) => `wikidata-sintoma-${q.toLowerCase()}`;

/** Id del concepto de esa ficha en `terminology.catalog_concepts`. */
export const wikidataSintomaConceptId = (q) =>
  glossaryConceptId(wikidataSintomaSlug(q));

/**
 * Bindings de `HPO_WIKIDATA_SPARQL` → filas `{ q, hpo }` únicas y ordenadas.
 * Lo que no parece un Q-id o un HP:n se descarta y se cuenta: no se corrige.
 */
export function crosswalkRows(json) {
  const seen = new Set();
  const rows = [];
  let invalid = 0;
  for (const b of json?.results?.bindings ?? []) {
    const q = String(b.x?.value ?? '')
      .split('/')
      .pop();
    const hpo = b.hpo?.value;
    if (!Q_ID.test(q) || !HP_ID.test(hpo ?? '')) {
      invalid++;
      continue;
    }
    const key = `${q}|${hpo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ q, hpo });
  }
  rows.sort(
    (a, b) =>
      Number(a.q.slice(1)) - Number(b.q.slice(1)) || a.hpo.localeCompare(b.hpo),
  );
  return { rows, invalid };
}

/**
 * Fenotipos del glosario que Wikidata declara iguales a un ítem Q.
 * @param {{q:string,hpo:string}[]} crosswalk
 * @param {object[]} hpoRows filas del corpus `terms-hpo`
 * @param {(row:object)=>boolean} isGlossaryTerm
 * @returns {Map<string, string[]>} código HPO → Q-ids ordenados
 */
export function glossaryEquivalents(crosswalk, hpoRows, isGlossaryTerm) {
  const mainOf = new Map();
  for (const r of hpoRows) {
    if (!isGlossaryTerm(r)) continue;
    mainOf.set(r.code, r.code);
    for (const alt of r.altIds ?? [])
      if (!mainOf.has(alt)) mainOf.set(alt, r.code);
  }
  const out = new Map();
  for (const { q, hpo } of crosswalk) {
    const main = mainOf.get(hpo);
    if (!main) continue;
    const list = out.get(main) ?? [];
    if (!list.includes(q)) list.push(q);
    out.set(main, list);
  }
  for (const list of out.values())
    list.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  return out;
}

/**
 * Parte los equivalentes según qué fichas `wikidata-sintoma-*` están de verdad
 * en el glosario de la base. Un equivalente sin ficha en el glosario no es
 * duplicado: el término HPO entra al glosario como siempre.
 *
 * @param {Map<string,string[]>} equivalents salida de `glossaryEquivalents`
 * @param {Set<string>} presentConceptIds ids de concepto de fichas ya miembros del glosario
 * @returns {Map<string, { q: string, wikidataConceptId: string }>} HPO → la ficha que lo duplica
 */
export function duplicatesAgainst(equivalents, presentConceptIds) {
  const out = new Map();
  for (const [hpo, qs] of equivalents) {
    const q = qs.find((x) =>
      presentConceptIds.has(wikidataSintomaConceptId(x)),
    );
    if (q) out.set(hpo, { q, wikidataConceptId: wikidataSintomaConceptId(q) });
  }
  return out;
}

/** Fila de `concept_maps` HPO → ficha de Wikidata. Sin equivalencia exacta declarada: `equivalence_concept_id` nulo. */
export function dedupeMap(hpoRow, dup, hpoConceptId) {
  return {
    id: md5uuid(
      `mantra:symptoms:map:hpo:${hpoRow.code}:glossary-wikidata-sintoma:${dup.q}`,
    ),
    source: hpoConceptId,
    target: dup.wikidataConceptId,
    context: `Wikidata ${dup.q} declara ${HPO_ID_PROPERTY} (${HPO_ID_PROPERTY_LABEL}) = ${hpoRow.code}`,
    version: hpoRow.version,
  };
}
