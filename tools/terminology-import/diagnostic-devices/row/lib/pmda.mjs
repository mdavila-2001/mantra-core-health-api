// =============================================================================
// PMDA (Japón) · aprobaciones y certificaciones de dispositivos → formato común.
//
// El espejo arma, desde los Excel oficiales de PMDA (承認品目一覧 y 認証品目リスト),
// un JSON embebido en `index.html` (`<script id="dataset">`) con `columns` y
// `rows`. Cada fila trae la URL del Excel oficial del que salió (`source_url`).
//
// - `generic_name` (一般的名称) es el término JMDN; la fuente no publica su código.
// - `manufacturer` es el titular japonés (製造販売業者), no necesariamente quien
//   fabrica: por eso no se asigna país.
// - La fuente no publica la clase de riesgo: `riskClass` queda en null.
// Los nombres se guardan en japonés tal cual; no se traducen.
// =============================================================================

import { isoDateOrNull, makeRow, textOrNull } from './row.mjs';

const OPEN_TAG = '<script id="dataset" type="application/json">';

/** Extrae `{ columns, category_labels, rows }` del `index.html` del espejo. */
export function extractPmdaDataset(html) {
  const start = html.indexOf(OPEN_TAG);
  if (start < 0) throw new Error('index.html sin <script id="dataset">');
  const end = html.indexOf('</script>', start);
  return JSON.parse(html.slice(start + OPEN_TAG.length, end));
}

/**
 * Si el 一般的名称 de la fila es, letra por letra, un nombre del maestro JMDN de
 * PMDA, `extra.deviceTypes` lleva su código, clase, 類別 y 中分類 tal como los
 * publica el 医療機器基準データベース. No se completa `deviceTypeCode` ni
 * `riskClass`: es una unión por nombre, y queda a la vista como tal.
 */
function jmdnTypes(name, jmdnByName) {
  const entry = name === null ? undefined : jmdnByName?.get(name);
  if (entry === undefined) return {};
  return {
    deviceTypes: [
      {
        system: 'jmdn',
        code: entry.code,
        name: entry.name,
        class: entry.class,
        category: entry.category,
        subcategory: entry.subcategory,
        joinedBy: 'exact-name',
      },
    ],
  };
}

/** Clave de la fila: un mismo número aparece en el trámite original y en cada cambio parcial (一変). */
export function pmdaRecordId(r) {
  return [r.approval_number, r.approval_date, r.approval_type, r.brand_name]
    .map((v) => v ?? '')
    .join('|');
}

/**
 * @param {{columns: string[], category_labels: string[], rows: unknown[][]}} dataset
 * @returns {{ rows: object[], duplicates: number, withoutManufacturer: number }}
 */
export function pmdaRows(dataset, ctx) {
  const rows = [];
  const byId = new Map();
  let duplicates = 0;
  // Sin titular publicado no hay fila: no se extrae la empresa del nombre comercial.
  let withoutManufacturer = 0;
  for (const cells of dataset.rows) {
    const r = Object.fromEntries(
      dataset.columns.map((name, i) => [name, cells[i]]),
    );
    const id = pmdaRecordId(r);
    const kept = byId.get(id);
    if (kept !== undefined) {
      // El mismo trámite publicado en otro listado (otra categoría u otro Excel):
      // se conserva la cita en vez de perderla.
      duplicates += 1;
      const listing = {
        category: dataset.category_labels[r.category] ?? null,
        sourceUrl: textOrNull(r.source_url),
      };
      const same =
        kept.extra.category === listing.category &&
        kept.sourceUrl === (listing.sourceUrl ?? kept.sourceUrl);
      const known = (kept.extra.alsoListedIn ?? []).some(
        (l) =>
          l.category === listing.category && l.sourceUrl === listing.sourceUrl,
      );
      if (!same && !known)
        kept.extra.alsoListedIn = [...(kept.extra.alsoListedIn ?? []), listing];
      continue;
    }
    if (textOrNull(r.manufacturer) === null) {
      withoutManufacturer += 1;
      continue;
    }
    const corporateNumber = textOrNull(r.corporate_number);
    const extra = {
      category: dataset.category_labels[r.category] ?? null,
      approvalType: textOrNull(r.approval_type),
      fiscalYear: r.fiscal_year ?? null,
      ...(textOrNull(r.medical_field)
        ? { medicalField: textOrNull(r.medical_field) }
        : {}),
      ...(textOrNull(r.classification)
        ? { classification: textOrNull(r.classification) }
        : {}),
      ...(textOrNull(r.us_approval_info) && r.us_approval_info !== '―'
        ? { usApprovalInfo: r.us_approval_info }
        : {}),
      ...(textOrNull(r.clinical_trial_type)
        ? { clinicalTrialType: textOrNull(r.clinical_trial_type) }
        : {}),
      ...(textOrNull(r.remarks) ? { remarks: r.remarks } : {}),
      ...(Array.isArray(r.review_report_urls) && r.review_report_urls.length > 0
        ? { reviewReportUrls: r.review_report_urls }
        : {}),
      ...jmdnTypes(textOrNull(r.generic_name), ctx.jmdnByName),
      manufacturerRole: '製造販売業者',
      mirror: ctx.mirror,
    };
    const row = makeRow({
      source: 'pmda-approvals',
      sourceRecordId: id,
      sourceUrl: textOrNull(r.source_url) ?? ctx.sourceUrl,
      sourceVersion: ctx.sourceVersion,
      retrievedAt: ctx.retrievedAt,
      deviceTypeCode: null,
      deviceTypeSystem: textOrNull(r.generic_name) === null ? null : 'jmdn',
      deviceTypeName: textOrNull(r.generic_name),
      manufacturerName: textOrNull(r.manufacturer),
      manufacturerCountry: null,
      manufacturerRegistryId:
        corporateNumber === null
          ? null
          : `jp-corporate-number:${corporateNumber}`,
      brandName: textOrNull(r.brand_name),
      model: null,
      udiDi: null,
      riskClass: null,
      authorizationId: textOrNull(r.approval_number),
      authorizationDate: isoDateOrNull(r.approval_date),
      status: textOrNull(r.cert_status),
      extra,
    });
    byId.set(id, row);
    rows.push(row);
  }
  return { rows, duplicates, withoutManufacturer };
}
