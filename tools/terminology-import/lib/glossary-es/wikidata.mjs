// =============================================================================
// Imágenes con licencia libre vía Wikidata (P18 «imagen», P117 «estructura
// química») + metadatos de atribución de Wikimedia Commons (extmetadata).
//
// El vínculo término ↔ imagen NO se infiere: sale de que el ítem de Wikidata
// declara el MISMO código que el término (ICD-10-CM P4229, CIE-10 OMS P494,
// MeSH P486, ATC P267, LOINC P4338). La propiedad usada queda en `matchProperty`.
// =============================================================================

import { htmlToText } from './common.mjs';

export const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
export const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
export const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

/**
 * Etiqueta inglesa ESPERADA de cada propiedad/clase de Wikidata que usan los
 * importadores. Se contrasta contra la API en cada corrida
 * (`assertEntityLabels`): un id equivocado (p. ej. P7863, que es «aperture» y no
 * el identificador TA2) aborta la corrida en vez de colar datos fuera de dominio.
 */
export const EXPECTED_ENTITY_LABELS = {
  P1323: 'Terminologia Anatomica 98 ID',
  P7173: 'TA2 ID',
  P4229: 'ICD-10-CM',
  P494: 'ICD-10 ID',
  P486: 'MeSH descriptor ID',
  P267: 'ATC code',
  P4338: 'LOINC ID',
  P18: 'image',
  P117: 'chemical structure',
  P31: 'instance of',
  P279: 'subclass of',
  Q4936952: 'anatomical structure',
};

export function entityLabelsUrl(ids) {
  return `${WIKIDATA_API}?action=wbgetentities&format=json&props=labels&languages=en&ids=${ids.join('|')}`;
}

/** Lanza si alguna entidad no tiene la etiqueta inglesa esperada. */
export function assertEntityLabels(json, expected = EXPECTED_ENTITY_LABELS) {
  const bad = [];
  for (const [id, label] of Object.entries(expected)) {
    const got = json?.entities?.[id]?.labels?.en?.value;
    if (got !== label) bad.push(`${id}: esperado «${label}», Wikidata dice «${got ?? '—'}»`);
  }
  if (bad.length) throw new Error(`Ids de Wikidata que no son lo que se cree: ${bad.join('; ')}`);
}

/** `wbgetentities` (claims P279) → mapa clase → superclases directas. */
export function parentClasses(json) {
  const out = new Map();
  for (const [id, ent] of Object.entries(json?.entities ?? {})) {
    const parents = (ent.claims?.P279 ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
    out.set(id, parents);
  }
  return out;
}

/**
 * ¿Alguna de `startClasses` llega a `target` subiendo por P279? `parentsOf` es
 * el mapa completo ya cargado. Recorrido en anchura con visitados (hay ciclos).
 */
export function reachesClass(startClasses, target, parentsOf) {
  const seen = new Set();
  const queue = [...startClasses];
  while (queue.length) {
    const c = queue.shift();
    if (c === target) return true;
    if (seen.has(c)) continue;
    seen.add(c);
    for (const p of parentsOf.get(c) ?? []) queue.push(p);
  }
  return false;
}

/** Propiedades de código que se consultan, con su nombre para la procedencia. */
export const CODE_PROPERTIES = {
  P4229: 'ICD-10-CM',
  P494: 'CIE-10 (OMS)',
  P486: 'MeSH descriptor ID',
  P267: 'código ATC',
  P4338: 'LOINC',
};

/** Consulta SPARQL: ítems con código `prop` e imagen (`imgProp`), con etiqueta y descripción en castellano. */
export function sparqlFor(prop, imgProp = 'P18') {
  return `SELECT ?item ?code ?img ?esLabel ?esDesc WHERE {
  ?item wdt:${prop} ?code ; wdt:${imgProp} ?img .
  OPTIONAL { ?item rdfs:label ?esLabel FILTER(LANG(?esLabel) = "es") }
  OPTIONAL { ?item schema:description ?esDesc FILTER(LANG(?esDesc) = "es") }
}`;
}

/** URL `Special:FilePath/<archivo>` de Wikidata → nombre de archivo de Commons. */
export function fileNameFromCommonsUrl(url) {
  const m = String(url).match(/Special:FilePath\/(.+)$/);
  return m ? decodeURIComponent(m[1]).replace(/_/g, ' ') : null;
}

/** Bindings SPARQL → filas crudas (una por ítem+código+imagen). */
export function sparqlBindings(json, prop, imgProp) {
  return (json?.results?.bindings ?? []).map((b) => ({
    matchProperty: prop,
    imageProperty: imgProp,
    code: b.code?.value ?? null,
    wikidataId: b.item?.value?.split('/').pop() ?? null,
    esLabel: b.esLabel?.value ?? null,
    esDescription: b.esDesc?.value ?? null,
    file: fileNameFromCommonsUrl(b.img?.value),
  }));
}

// Licencias libres que Commons acepta (https://commons.wikimedia.org/wiki/Commons:Licensing);
// se valida igual y lo que no case (p. ej. licencia vacía) se descarta y se cuenta.
const FREE_LICENSE = /^(CC0|CC BY(-SA)?( \d(\.\d)?)?|CC-BY(-SA)?-\d(\.\d)?|CC SA|Public domain|PD|GFDL|L?GPL|Attribution|FAL|Beerware|ODbL|No restrictions|Copyrighted free use|Licence Ouverte|OGL|CeCILL|Apache License)/i;

/**
 * Página `imageinfo` de la API de Commons → mapa archivo → atribución.
 * Descarta lo que no tenga licencia libre declarada (Commons sólo aloja
 * contenido libre, pero se valida igual y se deja registro).
 */
export function commonsImageInfo(json) {
  const out = new Map();
  const pages = json?.query?.pages ?? {};
  const normalized = new Map((json?.query?.normalized ?? []).map((n) => [n.to, n.from]));
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const md = info.extmetadata ?? {};
    const license = md.LicenseShortName?.value ?? null;
    const artist = htmlToText(md.Artist?.value ?? '') ?? null;
    const credit = htmlToText(md.Credit?.value ?? '') ?? null;
    const title = page.title.replace(/^File:/, '');
    const entry = {
      file: title,
      imageUrl: info.url,
      imageThumbUrl: info.thumburl ?? info.url,
      imageSourcePage: info.descriptionurl,
      imageLicense: license,
      imageLicenseUrl: md.LicenseUrl?.value ?? null,
      imageAuthor: artist,
      imageCredit: credit,
      imageAttribution: [artist ?? credit ?? 'Autor desconocido', license, 'vía Wikimedia Commons'].filter(Boolean).join(' · '),
      free: license ? FREE_LICENSE.test(license) : false,
      mime: info.mime ?? null,
    };
    out.set(title, entry);
    const from = normalized.get(page.title);
    if (from) out.set(from.replace(/^File:/, ''), entry);
  }
  return out;
}
