// =============================================================================
// Fila de Anatomía a partir de un ítem de Wikidata ya verificado como
// estructura anatómica. Pura (sin red) para poder probarla.
// =============================================================================

import { NO_IMAGE, assertRow } from './common.mjs';

/** «anatomical structure» — la etiqueta se verifica en cada corrida. */
export const ANATOMICAL_STRUCTURE = 'Q4936952';

export const WIKIDATA_LICENSE =
  'Wikidata: datos bajo CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/). Etiquetas y descripciones en castellano aportadas por la comunidad de Wikidata. Imagen: licencia de su archivo en Wikimedia Commons.';

/**
 * @param it  ítem agregado ({ q, esLabel, esDesc, enLabel, imgs:Set, aliases:Set, ta98:Set, ta2:Set, anatomyClassVerified })
 * @param info mapa archivo → metadatos de Commons (`commonsImageInfo`)
 */
export function anatomyRow(it, info, retrievedAt) {
  if (it.anatomyClassVerified !== true) {
    throw new Error(`Fuera de dominio: ${it.q} («${it.esLabel}») no es subclase/instancia de ${ANATOMICAL_STRUCTURE} (estructura anatómica)`);
  }
  const file = [...it.imgs].sort()[0];
  const im = file ? info.get(file) : null;
  const img = im && im.free ? im : null;
  const esName = it.esLabel.charAt(0).toUpperCase() + it.esLabel.slice(1);
  const url = `https://www.wikidata.org/wiki/${it.q}`;
  return assertRow({
    slug: `wikidata-anatomia-${it.q.toLowerCase()}`,
    code: it.q,
    codeSystem: 'wikidata-anatomia',
    display: esName,
    esName,
    enDisplay: it.enLabel ?? null,
    esSynonyms: [...it.aliases].filter((a) => a.toLowerCase() !== it.esLabel.toLowerCase()).sort((a, b) => a.localeCompare(b, 'es')),
    definition: it.esDesc ?? null,
    definitionKind: it.esDesc ? 'wikidata-description' : null,
    definitionHtml: null,
    definitionSource: it.esDesc ? { name: `Wikidata ${it.q} — descripción en castellano (comunidad de Wikidata)`, url, retrievedAt, license: 'CC0 1.0' } : null,
    plainSummaryEs: null,
    plainSummarySource: null,
    categoryKey: 'anatomy',
    tagKeys: [],
    lang: 'es',
    hierarchy: [],
    externalIds: { wikidata: it.q, ...(it.ta98.size ? { ta98: [...it.ta98].sort() } : {}), ...(it.ta2.size ? { ta2: [...it.ta2].sort() } : {}) },
    anatomyClassVerified: true,
    relations: [],
    ...NO_IMAGE,
    ...(img
      ? { imageUrl: img.imageUrl, imageThumbUrl: img.imageThumbUrl, imageAttribution: img.imageAttribution, imageLicense: img.imageLicense, imageLicenseUrl: img.imageLicenseUrl, imageSourcePage: img.imageSourcePage, imageOrigin: 'wikimedia-commons' }
      : {}),
    source: 'wikidata',
    sourceName: 'Wikidata — estructuras anatómicas (Q4936952) con identificador TA98 (P1323) o TA2 (P7173); etiqueta y descripción ES de la comunidad',
    sourceUrl: url,
    sourceRetrievedAt: retrievedAt,
    sourceLicense: WIKIDATA_LICENSE,
    reviewStatus: 'external-source',
  });
}
