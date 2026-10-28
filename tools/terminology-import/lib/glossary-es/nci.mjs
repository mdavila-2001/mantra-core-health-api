// =============================================================================
// Normalización de los diccionarios del Instituto Nacional del Cáncer (NCI, EE. UU.)
// en español → filas del glosario. Funciones puras sobre la respuesta JSON de
// https://webapis.cancer.gov/glossary/v1/Terms/{diccionario}/{audiencia}/es
//
// Nada se redacta: `termName` y `definition` son verbatim de la fuente; el nombre en
// inglés es el que la propia fuente declara en `otherLanguages`. La fuente NO clasifica
// sus términos, así que la categoría es «Otros términos» (regla documentada en
// `categoryRule`) y la única etiqueta es «Oncológico» para el Diccionario de cáncer,
// cuyo alcance declarado es el cáncer.
// =============================================================================

import { NO_IMAGE, htmlToText, sanitizeHtml } from './common.mjs';

export const NCI_API = 'https://webapis.cancer.gov/glossary/v1';
export const NCI_LICENSE =
  'NCI, «Reuse of NCI Information» (https://www.cancer.gov/policies/copyright-reuse): «Unless otherwise indicated, all text within National Cancer Institute (NCI) products is free of copyright and may be reused without our permission. Credit the National Cancer Institute as the source.» Se cita al NCI como fuente en cada fila; los gráficos de NCI pueden tener derechos de terceros y no se importan.';

/** Los cuatro diccionario×audiencia que publican términos en castellano (conteos del 2026-10-27). */
export const NCI_DICTIONARIES = [
  {
    dictionary: 'Cancer.gov',
    audience: 'Patient',
    codeSystem: 'nci-diccionario-cancer-es',
    sourceName: 'Diccionario de cáncer del NCI (en español, para pacientes)',
    pageBase: 'https://www.cancer.gov/espanol/publicaciones/diccionarios/diccionario-cancer/def',
    tags: ['oncologic'],
  },
  {
    dictionary: 'Cancer.gov',
    audience: 'HealthProfessional',
    codeSystem: 'nci-diccionario-cancer-es',
    sourceName: 'Diccionario de cáncer del NCI (en español, para profesionales de la salud)',
    pageBase: 'https://www.cancer.gov/espanol/publicaciones/diccionarios/diccionario-cancer/def',
    tags: ['oncologic'],
  },
  {
    dictionary: 'Genetics',
    audience: 'HealthProfessional',
    codeSystem: 'nci-diccionario-genetica-es',
    sourceName: 'Diccionario de genética del NCI (en español, para profesionales de la salud)',
    pageBase: 'https://www.cancer.gov/espanol/publicaciones/diccionarios/diccionario-genetica/def',
    tags: [],
  },
  {
    dictionary: 'Genetics',
    audience: 'Patient',
    codeSystem: 'nci-diccionario-genetica-es',
    sourceName: 'Diccionario de genética del NCI (en español, para pacientes)',
    pageBase: 'https://www.cancer.gov/espanol/publicaciones/diccionarios/diccionario-genetica/def',
    tags: [],
  },
];

export function termsUrl(d, from, size) {
  return `${NCI_API}/Terms/${d.dictionary}/${d.audience}/es?size=${size}&from=${from}`;
}

/** Un término de la API → fila del glosario (o null si no trae nombre o definición). */
export function nciRow(term, d, prov) {
  const name = typeof term.termName === 'string' ? term.termName.trim() : '';
  const html = term.definition?.html ?? null;
  const text = term.definition?.text ? term.definition.text.trim() : htmlToText(html);
  if (!name || !text) return null;
  const en = (term.otherLanguages ?? []).find((o) => o.language === 'en');
  const pageUrl = `${d.pageBase}/${term.prettyUrlName}`;
  const slugPrefix = d.dictionary === 'Cancer.gov' ? 'nci-cancer' : 'nci-genetica';
  return {
    slug: `${slugPrefix}-${term.termId}`,
    code: String(term.termId),
    codeSystem: d.codeSystem,
    display: name,
    esName: name,
    enDisplay: en?.termName ?? null,
    esSynonyms: [],
    definition: text,
    definitionHtml: sanitizeHtml(html),
    definitionKind: 'nci-dictionary',
    definitionSource: {
      name: `${d.sourceName} — «${name}»`,
      url: pageUrl,
      retrievedAt: prov.retrievedAt,
      license: NCI_LICENSE,
    },
    plainSummaryEs: null,
    categoryKey: 'other',
    categoryRule: 'nci-diccionario:la-fuente-no-clasifica',
    tagKeys: [...d.tags],
    lang: 'es',
    hierarchy: [{ code: `${d.dictionary}/${d.audience}`, display: d.sourceName }],
    externalIds: { nciTermId: String(term.termId), ...(en?.prettyUrlName ? { nciEnglishSlug: en.prettyUrlName } : {}) },
    relations: [],
    ...NO_IMAGE,
    source: 'nci-glossary',
    sourceName: d.sourceName,
    sourceUrl: pageUrl,
    sourceApiUrl: `${NCI_API}/Terms/${d.dictionary}/${d.audience}/es/${term.termId}`,
    sourceRetrievedAt: prov.retrievedAt,
    sourceLicense: NCI_LICENSE,
    reviewStatus: 'external-source',
  };
}
