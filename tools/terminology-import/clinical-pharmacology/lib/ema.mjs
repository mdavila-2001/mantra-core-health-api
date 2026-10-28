// =============================================================================
// EMA (European Medicines Agency) → indicación terapéutica literal de cada
// medicamento de autorización centralizada, desde el informe oficial
// «Medicines output» (https://www.ema.europa.eu/en/medicines/download-medicine-data,
// `medicines-output-medicines-report_en.xlsx`). Funciones puras sobre las filas
// del Excel (arreglo de arreglos, como lo entrega `xlsx.utils.sheet_to_json`
// con `header: 1`).
//
// Enlace por código: el ATC que la propia EMA asigna al medicamento (columna
// «ATC code (human)»). Sólo códigos ATC 5 válidos; si la EMA asigna varios
// (p. ej. insulinas), el medicamento cuenta en cada uno. Nunca por nombre.
//
// Licencia (aviso legal de la EMA, leído el 2026-10-24): reproducción y
// distribución permitidas, también con fines comerciales, «provided that EMA is
// always acknowledged as the source of the material. Such acknowledgement must
// be included in each copy of the material». Por eso cada fila lleva la cita.
// =============================================================================

import { literalFromParagraphs } from './literal.mjs';
import { isAtc5 } from './cima.mjs';

export const EMA_SOURCE = 'ema-epar';
export const EMA_SOURCE_NAME = 'European Medicines Agency (EMA) — Medicines output (EPAR)';
export const EMA_REPORT_URL = 'https://www.ema.europa.eu/en/documents/report/medicines-output-medicines-report_en.xlsx';
export const EMA_LICENSE =
  'Fuente: European Medicines Agency (EMA). Aviso legal de la EMA (https://www.ema.europa.eu/en/about-us/about-website/legal-notice, leído el 2026-10-24): ' +
  '«Information and documents made available on EMA\'s webpages are public and may be reproduced and / or distributed, totally or in part, … for non-commercial ' +
  'and commercial purposes, provided that EMA is always acknowledged as the source of the material. Such acknowledgement must be included in each copy of the material.»';

const COL = {
  category: 'Category',
  name: 'Name of medicine',
  productNumber: 'EMA product number',
  status: 'Medicine status',
  latestProcedure: 'Latest procedure affecting product information',
  inn: 'International non-proprietary name (INN) / common name',
  atc: 'ATC code (human)',
  indication: 'Therapeutic indication',
  holder: 'Marketing authorisation developer / applicant / holder',
  authorisationDate: 'Marketing authorisation date',
  revision: 'Revision number',
  firstPublished: 'First published date',
  lastUpdated: 'Last updated date',
  url: 'Medicine URL',
};

/** `23/10/2026` → `2026-10-23`; otra forma → null (no se adivina). */
export function emaDate(v) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v ?? '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Fecha de generación que el propio informe escribe en su primera fila («24/10/2026 - 18:10»). */
export function reportGeneratedAt(rows) {
  const cell = (rows[0] ?? []).find((c) => /^\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}:\d{2}$/.test(String(c ?? '').trim()));
  if (!cell) return null;
  const [d, t] = String(cell).split('-').map((x) => x.trim());
  return `${emaDate(d)}T${t}`;
}

/** Filas del informe → registros normalizados (todas las categorías y estados; el filtro va aparte). */
export function emaRecords(rows) {
  const hi = rows.findIndex((r) => Array.isArray(r) && r.includes(COL.productNumber));
  if (hi < 0) throw new Error('El informe de la EMA no tiene la columna «EMA product number»: revisar la forma del archivo.');
  const header = rows[hi];
  const idx = Object.fromEntries(Object.entries(COL).map(([k, name]) => [k, header.indexOf(name)]));
  return rows
    .slice(hi + 1)
    .filter((r) => r && r[idx.productNumber])
    .map((r) => {
      const get = (k) => (idx[k] >= 0 ? (r[idx[k]] ?? null) : null);
      const atcRaw = get('atc') == null ? null : String(get('atc'));
      return {
        category: get('category'),
        name: get('name'),
        productNumber: String(get('productNumber')),
        status: get('status'),
        latestProcedure: get('latestProcedure'),
        inn: get('inn'),
        atcRaw,
        atc5: atcRaw ? [...new Set(atcRaw.split(';').map((c) => c.trim()).filter(isAtc5))].sort() : [],
        indication: get('indication'),
        holder: get('holder'),
        authorisationDate: emaDate(get('authorisationDate')),
        revision: get('revision') == null ? null : String(get('revision')),
        firstPublished: emaDate(get('firstPublished')),
        lastUpdated: emaDate(get('lastUpdated')),
        url: get('url'),
      };
    });
}

/** Medicamentos de uso humano autorizados: los únicos cuya indicación se publica. */
export const isHumanAuthorised = (r) => r.category === 'Human' && r.status === 'Authorised';

/** Registro → sección de indicación literal (inglés) con su procedencia, o null si no trae texto. */
export function emaIndicationSection(r, retrievedAt) {
  const literal = literalFromParagraphs(r.indication);
  if (!literal) return null;
  return {
    key: 'indications',
    source: EMA_SOURCE,
    sourceName: EMA_SOURCE_NAME,
    language: 'en',
    audience: 'professional',
    document: {
      type: 'epar',
      id: r.productNumber,
      title: r.name,
      holder: r.holder,
      version: r.revision != null ? `revision ${r.revision}` : null,
      effectiveDate: r.lastUpdated,
      latestProcedure: r.latestProcedure,
      url: r.url,
      pageUrl: r.url,
      reportUrl: EMA_REPORT_URL,
    },
    section: { number: 'Therapeutic indication', title: null, url: r.url, apiUrl: EMA_REPORT_URL },
    ...literal,
    retrievedAt,
    license: EMA_LICENSE,
    citation:
      `European Medicines Agency (EMA). ${r.name} (${r.productNumber}), EPAR, revisión ${r.revision ?? '?'}, ` +
      `actualizado el ${r.lastUpdated ?? '?'}, campo «Therapeutic indication» del informe «Medicines output». ${r.url} (consultado el ${retrievedAt.slice(0, 10)}).`,
    selection: { criterion: 'Todos los medicamentos de uso humano autorizados por la EMA con ese ATC 5 asignado por la propia EMA.', group: { atc: r.atc5, atcRaw: r.atcRaw } },
  };
}
