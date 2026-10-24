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

import { decodeEntities } from '../../lib/glossary-es/common.mjs';
import { textSha256 } from './literal.mjs';

export const LACTMED_SOURCE = 'nlm-lactmed';
export const LACTMED_SOURCE_NAME = 'Drugs and Lactation Database (LactMed®) — NICHD / U.S. National Library of Medicine';
export const LACTMED_BOOK_URL = 'https://www.ncbi.nlm.nih.gov/books/NBK501922/';
export const LACTMED_LITARCH_LIST = 'https://ftp.ncbi.nlm.nih.gov/pub/litarch/file_list.txt';
export const LACTMED_LICENSE =
  'Courtesy of the U.S. National Library of Medicine. LactMed is a registered trademark of the U.S. Department of Health and Human Services. ' +
  'Políticas de NCBI (https://www.ncbi.nlm.nih.gov/home/about/policies/, leídas el 2026-10-24): «Information that is created by or for the US government on this site is within the public domain.» ' +
  'Términos de la NLM (https://www.nlm.nih.gov/databases/download/terms_and_conditions.html, leídos el 2026-10-24): atribuir con «Courtesy of the U.S. National Library of Medicine», ' +
  'no sugerir respaldo de la NLM, y quien redistribuye debe mantener la versión vigente o avisar con claridad que puede no serlo.';
export const LACTMED_DISCLAIMER =
  'Disclaimer: Information presented in this database is not meant as a substitute for professional judgment. You should consult your healthcare provider for breastfeeding advice ' +
  'related to your particular situation. The U.S. government does not warrant or assume any liability or responsibility for the accuracy or completeness of the information on this Site.';

export const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
export const lactmedSearchUrl = (start, max) => `${EUTILS}/esearch.fcgi?db=books&term=lactmed%5Bbook%5D&retstart=${start}&retmax=${max}&retmode=json`;
export const lactmedSummaryUrl = (uids) => `${EUTILS}/esummary.fcgi?db=books&id=${uids.join(',')}&retmode=json`;
/** URL canónica del capítulo en Bookshelf: la de su accession NBK (E-utilities); sin ella, la del libro. */
export const lactmedRecordUrl = (accession) => (accession ? `https://www.ncbi.nlm.nih.gov/books/${accession}/` : LACTMED_BOOK_URL);

/** Respuesta de esummary (db=books) → Map(id de capítulo LM… → accession NBK…), sólo capítulos de LactMed. */
export function accessionsFromSummary(json) {
  const out = new Map();
  for (const uid of json?.result?.uids ?? []) {
    const r = json.result[uid];
    const m = /^lactmed\/chapter\/([^/]+)\//.exec(r?.id ?? '');
    if (m && r.book === 'lactmed' && r.rtype === 'chapter' && /^NBK\d+$/.test(r.accessionid ?? '')) out.set(m[1], r.accessionid);
  }
  return out;
}

/** Secciones de «Drug Levels and Effects» que se publican (título exacto). */
export const LACTMED_SECTIONS = Object.freeze([
  'Summary of Use during Lactation',
  'Drug Levels',
  'Effects in Breastfed Infants',
  'Effects on Lactation and Breastmilk',
  'Alternate Drugs to Consider',
]);

/** Texto plano de un fragmento JATS: etiquetas fuera, párrafos y listas como saltos de línea. */
export function jatsText(xml) {
  const t = decodeEntities(
    String(xml)
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '')
      .replace(/<list-item\b[^>]*>/gi, '\n• ')
      .replace(/<break\s*\/?>/gi, '\n')
      .replace(/<\/(p|list-item|list|tr|table|sec)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return t.length ? t : null;
}

/** Hijos `<sec>` directos de un fragmento: `[{ title, xml }]`. */
function childSections(xml) {
  const re = /<(\/?)sec\b[^>]*>/g;
  const out = [];
  let depth = 0;
  let start = -1;
  for (let m = re.exec(xml); m !== null; m = re.exec(xml)) {
    if (!m[1]) {
      if (depth === 0) start = m.index;
      depth++;
    } else {
      depth--;
      if (depth === 0) {
        const sec = xml.slice(start, m.index + m[0].length);
        const inner = sec.slice(sec.indexOf('>') + 1, sec.lastIndexOf('</sec>'));
        const title = /^\s*<title\b[^>]*>([\s\S]*?)<\/title>/.exec(inner)?.[1];
        out.push({ title: title == null ? null : jatsText(title), xml: inner });
      }
    }
  }
  return out;
}

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
