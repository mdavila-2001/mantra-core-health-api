// =============================================================================
// LiverTox (NIDDK/NLM) → secciones literales de hepatotoxicidad por fármaco.
// Funciones puras sobre el NXML (BITS) del paquete oficial del archivo de
// literatura de NCBI (`livertox_NBK547852.tar.gz`).
//
// - Identidad: `book-part-id`, título, fecha `updated`.
// - Principios: los números CAS de la tabla «CHEMICAL FORMULA AND STRUCTURE»
//   (enlaces `ext-link-type="pubchem"`). CAS → UNII por el CAS PRIMARY del GSRS
//   (`uniiForCas`); después, el mismo puente por código que openFDA. Sin CAS, o
//   con un CAS que no resuelve a una sola sustancia, no se enlaza: las fichas de
//   clase (p. ej. «ACE inhibitors») quedan afuera.
// - Secciones: sólo las hepáticas de «OVERVIEW» (hepatotoxicidad, mecanismo de
//   la lesión, evolución y manejo), con clave `adverse_reactions` y su título
//   como número oficial. «Introduction» y «Background» describen el fármaco en
//   general y no se publican.
//
// Licencia (leída el 2026-10-24, en el propio libro): «LiverTox is produced by
// the National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)
// and is copyright free. It is requested that use of LiverTox data in
// publications be given appropriate acknowledgment.» Más los términos de
// descarga de la NLM (atribución, sin respaldo, aviso de versión).
// =============================================================================

import { textSha256 } from './literal.mjs';
import { bookPartDate, bookChapterUrl, childSections, jatsText } from './ncbi-books.mjs';

export const LIVERTOX_SOURCE = 'niddk-livertox';
export const LIVERTOX_SOURCE_NAME = 'LiverTox: Clinical and Research Information on Drug-Induced Liver Injury — NIDDK / U.S. National Library of Medicine';
export const LIVERTOX_BOOK = 'NBK547852';
export const LIVERTOX_BOOK_URL = 'https://www.ncbi.nlm.nih.gov/books/NBK547852/';
export const LIVERTOX_LICENSE =
  'Courtesy of the U.S. National Library of Medicine. LiverTox (resumen del libro, leído el 2026-10-24): «LiverTox is produced by the National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK) ' +
  'and is copyright free. It is requested that use of LiverTox data in publications be given appropriate acknowledgment.» Términos de la NLM ' +
  '(https://www.nlm.nih.gov/databases/download/terms_and_conditions.html, leídos el 2026-10-24): atribuir, no sugerir respaldo y avisar si no es la versión vigente.';
export const LIVERTOX_DISCLAIMER =
  'Information presented in the LiverTox database is derived from the scientific literature and public databases and reflects professional expertise of the authors. Such information does not ' +
  'represent official policy of the U.S. Government or any agency thereof. The information in LiverTox is not meant as a substitute for FDA approved product labeling and professional judgment ' +
  'in the diagnosis and treatment of drug induced liver injury. The U.S. Government and its individual agencies, including the NIDDK, NLM and NIH, does not warrant or assume any legal ' +
  'responsibility for the accuracy, completeness, or usefulness of the information contained on this Site.';

/** Subsecciones de «OVERVIEW» que se publican (título exacto, con las variantes que usa el libro). */
export const LIVERTOX_SECTIONS = Object.freeze([
  'Hepatotoxicity',
  'Mechanism of Injury',
  'Mechanism of Liver Injury',
  'Mechanism of liver injury',
  'Mechanism of Hepatotoxicity',
  'Outcome and Management',
  'Hepatotoxicity, Outcome and Management',
]);

/** Identidad del registro (sin texto clínico). */
export function livertoxIdentity(xml) {
  const meta = /<book-part-meta>([\s\S]*?)<\/book-part-meta>/.exec(xml)?.[1] ?? '';
  const i = xml.indexOf('CHEMICAL FORMULA AND STRUCTURE');
  const table = i >= 0 ? xml.slice(i, xml.indexOf('</table-wrap>', i)) : '';
  return {
    id: /<book-part-id book-part-id-type="pmcid">([^<]+)<\/book-part-id>/.exec(meta)?.[1] ?? null,
    title: jatsText(/<title-group>\s*<title>([\s\S]*?)<\/title>/.exec(meta)?.[1] ?? ''),
    updated: bookPartDate(meta, 'updated'),
    cas: [...new Set([...table.matchAll(/ext-link-type="pubchem"[^>]*>\s*(\d{2,7}-\d{2}-\d)\s*</g)].map((m) => m[1]))].sort(),
  };
}

/** Registro → filas de sección literales (inglés) con su procedencia. */
export function livertoxSections(xml, retrievedAt, { accession = null, selection = {} } = {}) {
  const id = livertoxIdentity(xml);
  const body = /<body>([\s\S]*)<\/body>/.exec(xml)?.[1] ?? '';
  const overview = childSections(body).find((s) => s.title === 'OVERVIEW');
  if (!overview || !id.id) return [];
  const url = accession ? bookChapterUrl(accession) : LIVERTOX_BOOK_URL;
  const out = [];
  for (const s of childSections(overview.xml)) {
    if (!LIVERTOX_SECTIONS.includes(s.title)) continue;
    const text = jatsText(s.xml);
    if (!text) continue;
    out.push({
      key: 'adverse_reactions',
      source: LIVERTOX_SOURCE,
      sourceName: LIVERTOX_SOURCE_NAME,
      language: 'en',
      audience: 'professional',
      document: { type: 'livertox-record', id: id.id, accession, title: id.title, version: null, effectiveDate: id.updated, url, pageUrl: url },
      section: { number: s.title, title: s.title, url, apiUrl: 'https://ftp.ncbi.nlm.nih.gov/pub/litarch/file_list.txt' },
      html: null,
      text,
      tables: [],
      textSha256: textSha256(text),
      retrievedAt,
      license: LIVERTOX_LICENSE,
      disclaimer: LIVERTOX_DISCLAIMER,
      citation:
        `LiverTox: Clinical and Research Information on Drug-Induced Liver Injury. Bethesda (MD): National Institute of Diabetes and Digestive and Kidney Diseases; 2012-. ` +
        `${id.title} (${accession ?? 'sin accession NBK'}), actualizado el ${id.updated ?? '?'}, sección «${s.title}». ${url} (paquete de NCBI consultado el ${retrievedAt.slice(0, 10)}). ` +
        'Courtesy of the U.S. National Library of Medicine.',
      selection,
    });
  }
  return out;
}
