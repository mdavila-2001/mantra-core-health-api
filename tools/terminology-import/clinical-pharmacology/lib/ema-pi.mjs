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

/** Anexo I → fichas: `[{ sections: Map(número → { title, text }), euNumbers: ['EU/1/AA/NNN/PPP', …] }]`. */
export function piSmpcs(text) {
  const lines = annexI(piLines(text));
  const smpcs = [];
  let cur = null;
  let sec = null;
  const close = () => {
    if (cur && sec) cur.sections.set(sec.number, { title: sec.title, text: clean(sec.lines) });
    sec = null;
  };
  for (const l of lines) {
    const h = HEADING.exec(l);
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
export const piMonographSections = (smpc) => [...smpc.sections].filter(([n, s]) => CIMA_SECTIONS[n] && s.text).map(([n, s]) => ({ number: n, key: CIMA_SECTIONS[n], title: s.title, text: s.text }));

/** Clave de comparación entre fuentes: el texto sin ningún espacio en blanco. Sólo para medir, nunca se publica. */
export const comparisonKey = (text) => String(text ?? '').replace(/\s+/g, '');

export const EMA_PI_TEXT_WITHHELD =
  'Texto no publicado: la extracción del PDF (pdftotext) no es literal en todos los casos. Medida contra la ficha de CIMA del mismo nº de registro, ' +
  'pierde símbolos de fuentes sin mapa a Unicode (p. ej. Deferasirox Accord, 4.1: CIMA «(≥7 ml/kg/mes» → PDF «( 7 ml/kg/mes»; 705 de 1 397 PDF tienen alguna ' +
  'fuente así) y no conserva la estructura de las tablas (4.8: 34 de 1 042 idénticas). Se guarda el puntero al documento oficial.';

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
    sections: piMonographSections(smpc).map((s) => ({ number: s.number, key: s.key, title: s.title })),
    atc5: r.atc5,
    atcLinkRule: 'ATC 5 asignado por la EMA (informe «Medicines output»)',
    textWithheld: EMA_PI_TEXT_WITHHELD,
    license,
    retrievedAt,
  };
}
