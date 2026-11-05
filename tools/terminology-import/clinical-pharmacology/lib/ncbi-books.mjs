// =============================================================================
// NCBI Bookshelf (paquetes del archivo de literatura `pub/litarch`): utilidades
// comunes a LactMed y LiverTox. Texto JATS/BITS literal (sólo se quitan
// etiquetas) y accession NBK de cada capítulo por E-utilities (db=books).
// =============================================================================

import { decodeEntities } from '../../lib/glossary-es/common.mjs';

export const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
export const LITARCH_FILE_LIST = 'https://ftp.ncbi.nlm.nih.gov/pub/litarch/file_list.txt';
export const bookSearchUrl = (book, start, max) => `${EUTILS}/esearch.fcgi?db=books&term=${encodeURIComponent(book)}%5Bbook%5D&retstart=${start}&retmax=${max}&retmode=json`;
export const bookSummaryUrl = (uids) => `${EUTILS}/esummary.fcgi?db=books&id=${uids.join(',')}&retmode=json`;
export const bookChapterUrl = (accession) => `https://www.ncbi.nlm.nih.gov/books/${accession}/`;

/** Respuesta de esummary (db=books) → Map(id de capítulo → accession NBK…), sólo capítulos del libro dado. */
export function bookAccessions(json, book) {
  const out = new Map();
  const re = new RegExp(`^${book}/chapter/([^/]+)/`);
  for (const uid of json?.result?.uids ?? []) {
    const r = json.result[uid];
    const m = re.exec(r?.id ?? '');
    if (m && r.book === book && r.rtype === 'chapter' && /^NBK\d+$/.test(r.accessionid ?? '')) out.set(m[1], r.accessionid);
  }
  return out;
}

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
export function childSections(xml) {
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


/** Fecha `<date date-type="…">` de `pub-history` → AAAA-MM-DD, o null. */
export function bookPartDate(meta, type) {
  const m = new RegExp(`<date date-type="${type}">\\s*<day>(\\d+)</day>\\s*<month>(\\d+)</month>\\s*<year>(\\d{4})</year>`).exec(meta);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}
