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

const FREE_LICENSE = /^(CC0|CC BY(-SA)?( \d(\.\d)?)?|CC-BY(-SA)?-\d(\.\d)?|Public domain|PD|GFDL|Attribution|FAL|Beerware|ODbL)/i;

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
