// =============================================================================
// EMA — información de producto (anexo I, ficha técnica) en castellano, desde
// el PDF del EPAR pasado a texto con `pdftotext -layout` (poppler). Funciones
// puras sobre ese texto.
//
// - Ficha técnica: del «ANEXO I» al «ANEXO II». Un PDF puede traer varias
//   fichas (una por forma farmacéutica); cada una empieza en «1. NOMBRE DEL
//   MEDICAMENTO».
// - Secciones: por número QRD al inicio de línea (el mismo catálogo que CIMA,
//   `CIMA_SECTIONS`). El texto es el de las líneas tal como las deja
//   `pdftotext -layout`: sólo se quitan los números de página (la línea de sólo
//   dígitos antes de un salto de página) y los espacios al final de línea. Las
//   tablas quedan alineadas por columnas, como en el PDF; no se reinterpretan.
// - Números de autorización (sección 8): EU/1/AA/NNN(N)/PPP. En CIMA el mismo
//   medicamento lleva nº de registro AANNN(N)PPP: así se sabe, por código, si
//   la ficha ya está en CIMA.
// =============================================================================

import { textSha256 } from './literal.mjs';
import { CIMA_SECTIONS } from './sections.mjs';

export const EMA_PI_SOURCE = 'ema-product-information';
export const EMA_PI_SOURCE_NAME = 'European Medicines Agency (EMA) — Información del producto (EPAR), anexo I, en castellano';

/** «Medicine URL» del informe → último tramo (`…/EPAR/silapo` → `silapo`), o null. */
export function emaPiSlug(medicineUrl) {
  const m = /\/EPAR\/([a-z0-9-]+)\/?$/i.exec(String(medicineUrl ?? ''));
  return m ? m[1].toLowerCase() : null;
}

export const emaPiUrl = (slug) => `https://www.ema.europa.eu/es/documents/product-information/${slug}-epar-product-information_es.pdf`;

/** Números QRD que abren una sección (todos los del modelo, para saber dónde termina la anterior). */
const QRD_NUMBERS = new Set(['1', '2', '3', '4', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '5', '5.1', '5.2', '5.3', '6', '6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '7', '8', '9', '10']);
const HEADING = /^\s{0,8}(\d{1,2}(?:\.\d)?)\.?\s+(\S.*)$/;

/** Texto de `pdftotext -layout` → líneas sin números de página ni espacios finales. */
export function piLines(text) {
  const pages = String(text).split('\f');
  const out = [];
  for (const page of pages) {
    const lines = page.split('\n').map((l) => l.replace(/\s+$/, ''));
    // Número de página: la última línea no vacía de la página, si es sólo dígitos.
    let last = lines.length - 1;
    while (last >= 0 && lines[last] === '') last--;
    if (last >= 0 && /^\s*\d{1,3}$/.test(lines[last])) lines.splice(last, 1);
    out.push(...lines);
  }
  return out;
}

/** Bloque del anexo I (ficha técnica), o [] si el PDF no lo trae. */
export function annexI(lines) {
  const start = lines.findIndex((l) => /^\s*ANEXO I\s*$/.test(l));
  if (start < 0) return [];
  const end = lines.findIndex((l, i) => i > start && /^\s*ANEXO II\s*$/.test(l));
  return lines.slice(start + 1, end < 0 ? lines.length : end);
}

const clean = (lines) => {
  const t = lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
  return t.trim() === '' ? null : t;
};

/** Líneas `{ text, table }` del anexo I → fichas (ver `piSmpcs`). */
function smpcsFromLines(lines) {
  const smpcs = [];
  let cur = null;
  let sec = null;
  const close = () => {
    if (cur && sec) {
      const marked = sec.lines.some((l) => l.html);
      cur.sections.set(sec.number, {
        title: sec.title,
        text: clean(sec.lines.map((l) => l.text)),
        // Superíndices y subíndices (p. ej. 10⁹/l) no caben en el texto plano: van en HTML, como en CIMA.
        html: marked ? clean(sec.lines.map((l) => l.html ?? escapeHtml(l.text))).replace(/\n/g, '<br>\n') : null,
        table: sec.lines.some((l) => l.table),
        unresolved: sec.lines.reduce((n, l) => n + (l.text.match(/\uFFFD/g)?.length ?? 0), 0),
      });
    }
    sec = null;
  };
  for (const l of lines) {
    const h = HEADING.exec(l.text);
    const isHeading = h && QRD_NUMBERS.has(h[1]) && /^[A-ZÁÉÍÓÚÑÜ]/.test(h[2]);
    if (isHeading && h[1] === '1' && /^NOMBRE DEL MEDICAMENTO/.test(h[2])) {
      close();
      cur = { sections: new Map() };
      smpcs.push(cur);
    }
    if (!cur) continue;
    if (isHeading && !cur.sections.has(h[1]) && !(sec && sec.number === h[1])) {
      close();
      sec = { number: h[1], title: h[2].trim(), lines: [] };
      continue;
    }
    if (sec) sec.lines.push(l);
  }
  close();
  for (const s of smpcs) {
    const auth = s.sections.get('8')?.text ?? '';
    s.euNumbers = [...new Set([...auth.matchAll(/EU\/1\/(\d{2})\/(\d{3,4})\/(\d{3})/g)].map((m) => `EU/1/${m[1]}/${m[2].replace(/^0(?=\d{3})/, '')}/${m[3]}`))].sort();
  }
  return smpcs;
}

/**
 * Texto de `pdftotext -layout` → fichas: `[{ sections: Map(número → { title, text, table, unresolved }), euNumbers }]`.
 * Sirve para leer la sección 8 (nº EU); este texto no se publica (pierde símbolos, ver EMA_PI_TEXT_WITHHELD).
 */
export const piSmpcs = (text) => smpcsFromLines(annexI(piLines(text)).map((t) => ({ text: t, table: false })));

/**
 * Salida de `py/ema_pi_extract.py` (filas por página, con la marca de tabla) → fichas, con el mismo
 * parser. Cada sección lleva `table` (alguna fila dentro de una grilla dibujada) y `unresolved` (U+FFFD).
 */
export function piSmpcsFromRows(doc) {
  const lines = (doc?.pages ?? []).flatMap((p) => p.rows.map((r) => ({ text: r.text.replace(/\s+$/, ''), table: Boolean(r.table), html: r.html ? r.html.replace(/\s+$/, '') : null })));
  const start = lines.findIndex((l) => /^\s*ANEXO I\s*$/.test(l.text));
  if (start < 0) return [];
  const end = lines.findIndex((l, i) => i > start && /^\s*ANEXO II\s*$/.test(l.text));
  return smpcsFromLines(lines.slice(start + 1, end < 0 ? lines.length : end));
}

const escapeHtml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Guion a final de línea entre dos letras: en el PDF no se distingue un guion real de uno de corte de palabra. */
const AMBIGUOUS_HYPHEN = /\p{L}-\n\p{L}/u;

/** Por qué una sección no se publica, o null si se publica. */
export function withheldReason(s) {
  if (!s?.text) return 'sin texto';
  if (s.table) return 'tabla';
  if (s.unresolved > 0 || s.text.includes('\uFFFD')) return 'glifo sin resolver';
  if (AMBIGUOUS_HYPHEN.test(s.text)) return 'guion de fin de línea ambiguo';
  return null;
}

/** Sección publicable: sin tablas, sin glifos sin resolver y sin guiones de fin de línea ambiguos. */
export const isVerifiedSection = (s) => withheldReason(s) === null;

/**
 * Nº de autorización EU → nº de registro con que CIMA publica el mismo medicamento. CIMA usa dos formas
 * (EU/1/11/732/004 → `11732004`; EU/1/13/823/002 → `113823002`): se prueban las dos, nunca otra cosa.
 */
export function cimaNregCandidates(eu) {
  const m = /^EU\/1\/(\d{2})\/(\d{3,4})\/(\d{3})$/.exec(eu);
  if (!m) return [];
  const n = `${m[1]}${m[2].replace(/^0(?=\d{3})/, '')}${m[3]}`;
  return [n, `1${n}`];
}

/** Secciones de una ficha que entran en la monografía (catálogo de CIMA, por número QRD). */
export const piMonographSections = (smpc) =>
  [...smpc.sections].filter(([n, s]) => CIMA_SECTIONS[n] && s.text).map(([n, s]) => ({ number: n, key: CIMA_SECTIONS[n], title: s.title, text: s.text, html: s.html ?? null, table: s.table, unresolved: s.unresolved }));

/** Clave de comparación entre fuentes: el texto sin ningún espacio en blanco. Sólo para medir, nunca se publica. */
export const comparisonKey = (text) => String(text ?? '').replace(/\s+/g, '');

/**
 * Clave para medir la fidelidad frente a CIMA (nunca se publica): NFKC (µ y μ son el mismo carácter),
 * sin espacios y sin «•», porque CIMA agrega «•» a cada ítem de lista al pasar su HTML a texto.
 */
export const fidelityKey = (text) =>
  comparisonKey(
    String(text ?? '')
      .normalize('NFKC')
      // Marcador de lista de un carácter que el extractor separa del texto con un tabulador (columna distinta en el PDF).
      .replace(/(^|\n)\s*[-–•o▪·][\t ]+/g, '$1')
      .replace(/•/g, ''),
  );

/** Dónde difieren dos claves: el tramo distinto de cada una, sin el prefijo ni el sufijo comunes. */
export function keyDiff(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let j = 0;
  while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  return { at: i, a: a.slice(i, a.length - j), b: b.slice(i, b.length - j) };
}

export const EMA_PI_TEXT_WITHHELD =
  'Texto publicado sólo en las secciones de extracción verificada (py/ema_pi_extract.py): cada carácter sale del mapa ToUnicode o de la codificación ' +
  'declarada de una fuente de texto; los símbolos de fuentes Symbol se traducen con la tabla oficial de Adobe (unicode.org). Una sección con algún ' +
  'glifo que no se puede resolver, con filas dentro de una tabla o con un guion de fin de línea ambiguo no se publica: queda este puntero al documento oficial.';

/** Sección verificada de una ficha EMA que no está en CIMA → fila literal (castellano) con su procedencia. */
export function emaPiSection(r, smpc, s, { url, retrievedAt, license }) {
  return {
    key: s.key,
    source: EMA_PI_SOURCE,
    sourceName: EMA_PI_SOURCE_NAME,
    language: 'es',
    audience: 'professional',
    document: {
      type: 'epar-product-information',
      id: r.productNumber,
      title: r.name,
      holder: r.holder,
      version: r.revision != null ? `revision ${r.revision}` : null,
      effectiveDate: r.lastUpdated,
      euNumbers: smpc.euNumbers,
      url,
      pageUrl: r.url,
    },
    section: { number: s.number, title: s.title, url, apiUrl: url },
    html: s.html ?? null,
    text: s.text,
    tables: [],
    textSha256: textSha256(s.text),
    extraction:
      'pdfminer.six (py/ema_pi_extract.py): carácter por carácter desde el mapa ToUnicode o la codificación declarada; símbolos de fuentes Symbol con la tabla ' +
      'oficial de Adobe (unicode.org), en su forma NFKC cuando la tabla da varios valores equivalentes (μ); superíndices y subíndices en `html`. ' +
      'Verificada: sin glifos sin resolver, sin tablas y sin guiones de fin de línea ambiguos.',
    retrievedAt,
    license,
    citation:
      `European Medicines Agency (EMA). ${r.name} (${r.productNumber}), EPAR — Información del producto, anexo I (ficha técnica), sección ${s.number} «${s.title}», ` +
      `revisión ${r.revision ?? '?'}, actualizado el ${r.lastUpdated ?? '?'}. ${url} (consultado el ${retrievedAt.slice(0, 10)}).`,
    selection: { criterion: 'Medicamento de autorización centralizada con ATC 5 asignado por la EMA cuyo nº de autorización EU no figura en CIMA.', group: { atc: r.atc5 } },
  };
}

/** Ficha de un medicamento EMA que no está en CIMA → puntero citable al PDF oficial, sin texto. */
export function emaPiPointer(r, smpc, { url, retrievedAt, license }) {
  return {
    source: EMA_PI_SOURCE,
    sourceName: EMA_PI_SOURCE_NAME,
    document: {
      type: 'epar-product-information',
      id: r.productNumber,
      title: r.name,
      holder: r.holder,
      version: r.revision != null ? `revision ${r.revision}` : null,
      effectiveDate: r.lastUpdated,
      euNumbers: smpc.euNumbers,
      url,
      pageUrl: r.url,
    },
    sections: piMonographSections(smpc).map((s) => ({
      number: s.number,
      key: s.key,
      title: s.title,
      textPublished: isVerifiedSection(s),
      ...(isVerifiedSection(s) ? {} : { withheldBecause: withheldReason(s) }),
    })),
    atc5: r.atc5,
    atcLinkRule: 'ATC 5 asignado por la EMA (informe «Medicines output»)',
    textWithheld: EMA_PI_TEXT_WITHHELD,
    license,
    retrievedAt,
  };
}
