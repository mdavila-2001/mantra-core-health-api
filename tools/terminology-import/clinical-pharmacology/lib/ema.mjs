// =============================================================================
// EMA · datos abiertos de medicamentos (JSON de «Download website data»). Funciones
// puras sobre el archivo descargado. Aporta, por medicamento autorizado de forma
// centralizada en la UE: el texto de «therapeutic_indication» (inglés, literal, el de
// la sección 4.1 del RCP), el grupo farmacoterapéutico y el área terapéutica.
//
// Enlace con el ATC SÓLO por código: `atc_code_human` (uno o varios códigos separados
// por «;»), igualdad exacta con un ATC 5. Los códigos de otro nivel no se enlazan.
//
// Licencia (leída el 2026-10-27 en https://www.ema.europa.eu/en/about-us/legal-notice):
// «Information and documents made available on EMA's webpages are public and may be
// reproduced and / or distributed, totally or in part, irrespective of the means and /
// or the formats used, for non-commercial and commercial purposes, provided that EMA is
// always acknowledged as the source of the material.»
// =============================================================================

import { literalFromParagraphs } from './literal.mjs';
import { isAtc5 } from './cima.mjs';

export const EMA_SOURCE = 'ema-medicines';
export const EMA_SOURCE_NAME = 'EMA — Medicines data (European Medicines Agency, datos abiertos en JSON)';
export const EMA_DATA_URL = 'https://www.ema.europa.eu/en/documents/report/medicines-output-medicines_json-report_en.json';
export const EMA_PAGE_URL = 'https://www.ema.europa.eu/en/about-us/about-website/download-website-data-json-data-format';
export const EMA_LICENSE =
  'EMA, aviso legal (https://www.ema.europa.eu/en/about-us/legal-notice): la información de las páginas de la EMA es pública y puede reproducirse y/o distribuirse, ' +
  'total o parcialmente, para fines comerciales y no comerciales, siempre que se cite a la EMA como fuente.';

const trim = (v) => (typeof v === 'string' ? v.trim() : '');

/** `27/10/2026` (formato del archivo) → `2026-10-27`; otra forma → null. */
export function emaDate(v) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trim(v));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Códigos ATC (de cualquier nivel) de un registro: `atc_code_human` partido por «;». */
export const emaAtcCodes = (r) => trim(r?.atc_code_human).split(';').map((s) => s.trim()).filter(Boolean);

/**
 * Registros del archivo → Map ATC5 → medicamentos humanos AUTORIZADOS con ese ATC 5 (igualdad exacta).
 * Devuelve también cuántos registros quedaron fuera y por qué.
 */
export function emaByAtc5(file) {
  const rows = Array.isArray(file?.data) ? file.data : [];
  const byAtc = new Map();
  const skipped = { notHuman: 0, notAuthorised: 0, withoutAtc5: 0 };
  for (const r of rows) {
    if (r.category !== 'Human') {
      skipped.notHuman++;
      continue;
    }
    if (r.medicine_status !== 'Authorised') {
      skipped.notAuthorised++;
      continue;
    }
    const codes = [...new Set(emaAtcCodes(r).filter(isAtc5))];
    if (codes.length === 0) {
      skipped.withoutAtc5++;
      continue;
    }
    for (const c of codes) {
      if (!byAtc.has(c)) byAtc.set(c, []);
      byAtc.get(c).push(r);
    }
  }
  return { byAtc, skipped, total: rows.length };
}

/** Resumen de los medicamentos de un ATC 5 (todos, sin texto largo). */
export function emaProductsSummary(records) {
  return records
    .map((r) => ({
      name: trim(r.name_of_medicine),
      emaProductNumber: trim(r.ema_product_number),
      activeSubstance: trim(r.active_substance),
      pharmacotherapeuticGroup: trim(r.pharmacotherapeutic_group_human) || null,
      therapeuticAreaMesh: trim(r.therapeutic_area_mesh) || null,
      generic: r.generic === 'Yes',
      biosimilar: r.biosimilar === 'Yes',
      orphan: r.orphan_medicine === 'Yes',
      url: trim(r.medicine_url) || null,
    }))
    .sort((a, b) => a.emaProductNumber.localeCompare(b.emaProductNumber));
}

/**
 * Documentos de referencia de un ATC 5: uno por sustancia activa (cadena exacta de `active_substance`),
 * el no genérico primero y, a igualdad, el número de producto EMA menor.
 */
export function emaReferenceRecords(records) {
  const groups = new Map();
  for (const r of records) {
    const key = trim(r.active_substance) || '(sin sustancia activa declarada)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return [...groups.entries()]
    .map(([activeSubstance, members]) => {
      const ref = [...members].sort((a, b) => Number(a.generic === 'Yes') - Number(b.generic === 'Yes') || trim(a.ema_product_number).localeCompare(trim(b.ema_product_number)))[0];
      return {
        record: ref,
        criterion: 'Un medicamento por sustancia activa (cadena exacta de active_substance): el no genérico primero y, a igualdad, el número de producto EMA menor.',
        group: { activeSubstance, candidates: members.length },
      };
    })
    .sort((a, b) => trim(a.record.ema_product_number).localeCompare(trim(b.record.ema_product_number)));
}

/**
 * Registro → fila de sección literal (la indicación terapéutica, en inglés, tal como la publica la EMA).
 * @param {object} record
 * @param {{ criterion: string, group: object }} ref
 * @param {{ retrievedAt: string, sha256: string, timestamp: string|null }} file  procedencia del archivo
 */
export function emaSections(record, ref, file) {
  const literal = literalFromParagraphs(record.therapeutic_indication);
  if (!literal) return [];
  const id = trim(record.ema_product_number);
  const name = trim(record.name_of_medicine);
  const url = trim(record.medicine_url) || EMA_PAGE_URL;
  const effectiveDate = emaDate(record.last_updated_date);
  return [
    {
      key: 'indications',
      source: EMA_SOURCE,
      sourceName: EMA_SOURCE_NAME,
      language: 'en',
      audience: 'professional',
      document: {
        type: 'epar-medicine',
        id,
        title: name,
        holder: trim(record.marketing_authorisation_developer_applicant_holder) || null,
        version: trim(record.revision_number) || null,
        effectiveDate,
        url,
        pageUrl: url,
      },
      section: { number: 'therapeutic_indication', title: null, url, apiUrl: EMA_DATA_URL },
      ...literal,
      tables: [],
      retrievedAt: file.retrievedAt,
      license: EMA_LICENSE,
      citation:
        `EMA. Medicines data, ${name} (${id}), campo «therapeutic_indication», revisión ${trim(record.revision_number) || '?'}` +
        `${effectiveDate ? ` (last_updated_date ${effectiveDate})` : ''}. ${url} — archivo ${EMA_DATA_URL}, sha256 ${file.sha256.slice(0, 16)}…, ` +
        `generado ${file.timestamp ?? '?'} (consultado el ${file.retrievedAt.slice(0, 10)}).`,
      selection: { criterion: ref.criterion, group: ref.group },
    },
  ];
}
