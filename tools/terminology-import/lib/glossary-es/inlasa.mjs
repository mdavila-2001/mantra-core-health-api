// =============================================================================
// «Listado de Servicios y Aranceles del INLASA» (Instituto Nacional de
// Laboratorios de Salud, Ministerio de Salud y Deportes de Bolivia) → análisis
// clínicos del glosario, con su código oficial y su precio de referencia en Bs.
//
// Funciones puras sobre el HTML de https://inlasa.gob.bo/servicios-y-aranceles-del-inlasa/
// (la tabla viaja completa en el HTML; DataTables sólo pagina en el navegador).
//
// Qué entra: los análisis que se le hacen a una PERSONA, de las áreas clínicas.
// Qué no: control de alimentos y de aguas, salud ambiental, medios de cultivo,
// capacitación, producción, bioseguridad, evaluación externa de calidad, y —en
// las áreas clínicas— los servicios a laboratorios (evaluación de desempeño de
// kits, sueros control, cepas) o marcados «solo investigación».
//
// INLASA no publica definiciones: `definition` queda null. El nombre oficial va
// VERBATIM en `officialName`; `esName` sólo cambia mayúsculas (ver `displayCase`).
// =============================================================================

import { NO_IMAGE, assertRow, decodeEntities } from './common.mjs';

export const INLASA_URL = 'https://inlasa.gob.bo/servicios-y-aranceles-del-inlasa/';
export const INLASA_SOURCE = 'inlasa-aranceles-2026';
export const INLASA_LICENSE =
  'Información pública del Estado Plurinacional de Bolivia (INLASA, Ministerio de Salud y Deportes), publicada para consulta ciudadana; se cita la fuente.';

/** Áreas de INLASA cuyos servicios son análisis a pacientes → etiquetas del glosario. */
export const CLINICAL_AREAS = {
  'LAB. DE ANÁLISIS CLÍNICO': [],
  'LAB. DE INMUNOLOGÍA': [],
  'LAB. DE BACTERIOLOGÍA': ['infectious'],
  'LAB. DE VIROLOGÍA': ['infectious'],
  'LAB. DE ENTOMOLOGÍA Y PARASITOLOGÍA': ['infectious'],
  'LAB. DE TUBERCULOSIS': ['infectious', 'respiratory'],
  'LAB. DE DIAGNÓSTICO E INVESTIGACIÓN DE CÁNCER': ['oncologic'],
  CIGMO: [],
  GENÓMICA: [],
};

/** Servicios de las áreas clínicas que NO son un análisis a una persona. */
const NOT_A_PATIENT_TEST = new RegExp(
  [
    'EVALUACI[OÓ]N (DE|DEL) DESEMPE', 'VERIFICACI[OÓ]N DE LA PRECISI', 'CONTROL DE CALIDAD', 'SUEROS CONTROL',
    '^CEPAS', 'COPROTECA', 'L[AÁ]MINA AUTODID', 'MOSQUITEROS', 'INSECTICIDA', 'REPELENCIA', 'INSECTOS EN ALIMENTOS',
    'AGUA', 'VERDURAS', 'CARNES ANIMALES', 'HECES DE ANIMALES', 'SUPERFICIES', 'DE AMBIENTE', 'DISPOSITIVOS E INSTRUMENTAL',
    'ESTERILIDAD', 'MEDIOS DE CULTIVO', 'REVELADORES', 'BROTE', 'CONTROL MICROBIOL', 'TRANSMITIDAS POR ALIMENTOS',
    'INVESTIGACI[OÓ]N\\)',
  ].join('|'),
  'i',
);

/** Filas `<tr>` de la tabla → `{ area, code, name, priceBs }` (verbatim, espacios normalizados). */
export function parseInlasaTable(html) {
  const out = [];
  const rowRe = /<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/g;
  const clean = (s) => decodeEntities(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
  for (const m of html.matchAll(rowRe)) {
    const [area, code, name, price] = m.slice(1).map(clean);
    if (!/^[A-Z]+-\d+$/.test(code)) continue;
    const amount = price.match(/^(\d+(?:[.,]\d+)?)\s*Bs\.?$/i);
    out.push({ area, code, name, priceBs: amount ? Number(amount[1].replace(',', '.')) : null, priceText: price });
  }
  return out;
}

export function isPatientTest(item) {
  return Object.hasOwn(CLINICAL_AREAS, item.area) && !NOT_A_PATIENT_TEST.test(item.name);
}

/** Palabras que en el listado van en mayúsculas pero son siglas (se dejan así). */
const ACRONYMS = new Set([
  'ELISA', 'ANCA', 'BRCA', 'HTLV', 'TIBC', 'IGRA', 'VDRL', 'TORCH', 'HER-2', 'FISH', 'MERS', 'SARS', 'CK-MB',
  'BHCG', 'QUANTIFERON', 'GENEXPERT', 'VITEK', 'MALDI-TOF', 'HCV', 'HAV', 'HBC', 'HBS', 'HBE', 'HLA', 'NGS',
]);
const SPANISH_SHORT_WORDS = new Set([
  'A', 'AL', 'CON', 'DE', 'DEL', 'EL', 'EN', 'LA', 'LAS', 'LOS', 'O', 'PARA', 'POR', 'SIN', 'U', 'Y', 'E', 'DOS', 'TRES', 'UNA', 'UN',
  'GEN', 'PIE', 'OJO', 'ORAL', 'REAL', 'ANTI', 'TEST', 'TOMA', 'MOCO', 'ALTO', 'BAJO', 'NO', 'UREA', 'ZIKA',
]);
/** Nombres propios (epónimos, lugares, virus con nombre de lugar): mayúscula inicial. */
const PROPER_NOUNS = new Map(
  ['Epstein', 'Barr', 'Chagas', 'Graham', 'Widal', 'Coombs', 'Papanicolaou', 'Kato', 'Kaz', 'Nilo', 'Machupo', 'Chapare', 'Mayaro', 'Oropouche', 'Di', 'George', 'Gram', 'Ogawa', 'Illumina']
    .map((n) => [n.toUpperCase(), n]),
);

/**
 * Sólo mayúsculas → oración: «ÁCIDO ÚRICO EN ORINA» → «Ácido úrico en orina».
 * Los epónimos y nombres de lugar de `PROPER_NOUNS` llevan mayúscula inicial.
 * Se dejan como vienen las siglas (todo en mayúsculas de hasta 4 letras que no
 * son palabras castellanas, o las de `ACRONYMS`) y todo token que ya trae
 * minúsculas («IgM», «HBsAg», «Campylobacter spp.»). No cambia ninguna letra:
 * sólo su caja.
 */
export function displayCase(name) {
  const tokens = name.split(/(\s+|[(),/–-])/);
  let first = true;
  return tokens
    .map((tok) => {
      if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(tok)) return tok;
      const bare = tok.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9-]/g, '');
      if (PROPER_NOUNS.has(bare)) {
        first = false;
        return tok.replace(bare, PROPER_NOUNS.get(bare));
      }
      const isUpper = bare === bare.toUpperCase();
      const keep = !isUpper || ACRONYMS.has(bare) || /\d/.test(bare) || (bare.length <= 4 && !SPANISH_SHORT_WORDS.has(bare));
      let out = keep ? tok : tok.toLowerCase();
      if (first) {
        out = out.charAt(0).toUpperCase() + out.slice(1);
        first = false;
      }
      return out;
    })
    .join('');
}

/** Un análisis de INLASA → fila del glosario (categoría Laboratorio). */
export function inlasaRow(item, retrievedAt) {
  const esName = displayCase(item.name);
  return assertRow({
    slug: `inlasa-${item.code.toLowerCase()}`,
    code: item.code,
    codeSystem: INLASA_SOURCE,
    display: esName,
    esName,
    officialName: item.name,
    enDisplay: null,
    esSynonyms: [],
    definition: null,
    definitionHtml: null,
    definitionSource: null,
    plainSummaryEs: null,
    plainSummarySource: null,
    categoryKey: 'lab',
    tagKeys: [...CLINICAL_AREAS[item.area]].sort(),
    categoryRule: `área de INLASA «${item.area}»`,
    lang: 'es',
    hierarchy: [{ code: item.area, display: item.area }],
    externalIds: {},
    relations: [],
    referencePrice: item.priceBs == null ? null : { amount: item.priceBs.toFixed(2), currency: 'BOB', schedule: 'INLASA 2026', priceText: item.priceText },
    ...NO_IMAGE,
    source: INLASA_SOURCE,
    sourceName: 'INLASA — Listado de Servicios y Aranceles 2026 (Ministerio de Salud y Deportes de Bolivia)',
    sourceUrl: INLASA_URL,
    sourceRetrievedAt: retrievedAt,
    sourceLicense: INLASA_LICENSE,
    reviewStatus: 'external-source',
  });
}
