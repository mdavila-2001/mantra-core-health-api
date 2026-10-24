// =============================================================================
// LactMed (Drugs and Lactation Database, NICHD/NLM) → secciones literales de
// lactancia por sustancia. Funciones puras sobre el NXML (JATS/BITS) del
// paquete oficial del archivo de literatura de NCBI
// (`https://ftp.ncbi.nlm.nih.gov/pub/litarch/…/lactmed_NBK501922.tar.gz`).
//
// - Identidad: `book-part-id` (p. ej. LM514), título, fecha `revised`.
// - Principios: UNII de las palabras clave (`<kwd>UNII-XXXXXXXXXX</kwd>`). El
//   enlace al ATC usa el mismo puente por código que openFDA (GSRS + RxNav),
//   nunca el nombre. Sin UNII no se enlaza.
// - Secciones: las de segundo nivel de «Drug Levels and Effects», cada una en
//   su fila (clave `pregnancy_lactation`), con su título como número oficial.
//   «Substance Identification» y «References» no son texto de monografía.
//
// Licencia (leída el 2026-10-24): obra creada por o para el Gobierno de EE. UU.
// (dominio público según las políticas de NCBI); términos de descarga de la NLM:
// atribución «Courtesy of the U.S. National Library of Medicine», sin sugerir
// respaldo, y avisar si lo redistribuido no es la versión vigente. Van en cada fila.
// =============================================================================

import { textSha256 } from './literal.mjs';
import { LITARCH_FILE_LIST, bookAccessions, bookChapterUrl, bookSearchUrl, bookSummaryUrl, childSections, jatsText } from './ncbi-books.mjs';

export { jatsText };

export const LACTMED_SOURCE = 'nlm-lactmed';
export const LACTMED_SOURCE_NAME = 'Drugs and Lactation Database (LactMed®) — NICHD / U.S. National Library of Medicine';
export const LACTMED_BOOK_URL = 'https://www.ncbi.nlm.nih.gov/books/NBK501922/';
export const LACTMED_LITARCH_LIST = LITARCH_FILE_LIST;
export const LACTMED_LICENSE =
  'Courtesy of the U.S. National Library of Medicine. LactMed is a registered trademark of the U.S. Department of Health and Human Services. ' +
  'Políticas de NCBI (https://www.ncbi.nlm.nih.gov/home/about/policies/, leídas el 2026-10-24): «Information that is created by or for the US government on this site is within the public domain.» ' +
  'Términos de la NLM (https://www.nlm.nih.gov/databases/download/terms_and_conditions.html, leídos el 2026-10-24): atribuir con «Courtesy of the U.S. National Library of Medicine», ' +
  'no sugerir respaldo de la NLM, y quien redistribuye debe mantener la versión vigente o avisar con claridad que puede no serlo.';
export const LACTMED_DISCLAIMER =
  'Disclaimer: Information presented in this database is not meant as a substitute for professional judgment. You should consult your healthcare provider for breastfeeding advice ' +
  'related to your particular situation. The U.S. government does not warrant or assume any liability or responsibility for the accuracy or completeness of the information on this Site.';

export const lactmedSearchUrl = (start, max) => bookSearchUrl('lactmed', start, max);
export const lactmedSummaryUrl = bookSummaryUrl;
/** URL canónica del capítulo en Bookshelf: la de su accession NBK (E-utilities); sin ella, la del libro. */
export const lactmedRecordUrl = (accession) => (accession ? bookChapterUrl(accession) : LACTMED_BOOK_URL);
/** Respuesta de esummary → Map(id de capítulo LM… → accession NBK…), sólo capítulos de LactMed. */
export const accessionsFromSummary = (json) => bookAccessions(json, 'lactmed');

/** Secciones de «Drug Levels and Effects» que se publican (título exacto). */
export const LACTMED_SECTIONS = Object.freeze([
  'Summary of Use during Lactation',
  'Drug Levels',
  'Effects in Breastfed Infants',
  'Effects on Lactation and Breastmilk',
  'Alternate Drugs to Consider',
]);

/** Identidad del registro (sin texto clínico). */
export function lactmedIdentity(xml) {
  const meta = /<book-part-meta>([\s\S]*?)<\/book-part-meta>/.exec(xml)?.[1] ?? '';
  const rev = /<date date-type="revised">\s*<day>(\d+)<\/day>\s*<month>(\d+)<\/month>\s*<year>(\d{4})<\/year>/.exec(meta);
  return {
    id: /<book-part-id book-part-id-type="pmcid">([^<]+)<\/book-part-id>/.exec(meta)?.[1] ?? null,
    title: jatsText(/<title-group>\s*<title>([\s\S]*?)<\/title>/.exec(meta)?.[1] ?? ''),
    revised: rev ? `${rev[3]}-${rev[2].padStart(2, '0')}-${rev[1].padStart(2, '0')}` : null,
    unii: [...new Set([...meta.matchAll(/<kwd>UNII-([A-Z0-9]{10})<\/kwd>/g)].map((m) => m[1]))].sort(),
    casrn: /<p>CASRN:\s*([0-9-]+)<\/p>/.exec(xml)?.[1] ?? null,
  };
}

/** Registro → filas de sección literales (inglés) con su procedencia. */
export function lactmedSections(xml, retrievedAt, { accession = null, selection = {} } = {}) {
  const id = lactmedIdentity(xml);
  const body = /<body>([\s\S]*)<\/body>/.exec(xml)?.[1] ?? '';
  const top = childSections(body).find((s) => s.title === 'Drug Levels and Effects');
  if (!top || !id.id) return [];
  const out = [];
  for (const s of childSections(top.xml)) {
    if (!LACTMED_SECTIONS.includes(s.title)) continue;
    const text = jatsText(s.xml);
    if (!text) continue;
    out.push({
      key: 'pregnancy_lactation',
      source: LACTMED_SOURCE,
      sourceName: LACTMED_SOURCE_NAME,
      language: 'en',
      audience: 'professional',
      document: { type: 'lactmed-record', id: id.id, accession, title: id.title, version: null, effectiveDate: id.revised, url: lactmedRecordUrl(accession), pageUrl: lactmedRecordUrl(accession) },
      section: { number: s.title, title: s.title, url: lactmedRecordUrl(accession), apiUrl: LACTMED_LITARCH_LIST },
      html: null,
      text,
      tables: [],
      textSha256: textSha256(text),
      retrievedAt,
      license: LACTMED_LICENSE,
      disclaimer: LACTMED_DISCLAIMER,
      citation:
        `Drugs and Lactation Database (LactMed®). Bethesda (MD): National Institute of Child Health and Human Development; 2006-. ${id.title} (${id.id}), ` +
        `${accession ?? 'sin accession NBK'}, revisado el ${id.revised ?? '?'}, sección «${s.title}». ${lactmedRecordUrl(accession)} (paquete de NCBI consultado el ${retrievedAt.slice(0, 10)}). ` +
        'Courtesy of the U.S. National Library of Medicine.',
      selection,
    });
  }
  return out;
}
