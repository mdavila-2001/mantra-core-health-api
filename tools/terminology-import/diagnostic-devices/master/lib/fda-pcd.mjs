// =============================================================================
// FDA Product Classification Database (`foiclass.txt`, campos separados por
// `|`) → nodos de la taxonomía `fda-product-code`.
//
// El archivo oficial se baja de https://www.fda.gov/medical-devices/classify-your-medical-device/download-product-code-classification-files
// (se actualiza los domingos). Desde este entorno la FDA no responde (403 del
// proxy), así que se lee una copia publicada en git (ver `sources.mjs`); el
// parser es el mismo para el oficial: misma cabecera.
// =============================================================================

import { IVD_PARTS, classifyRegulation } from './cfr.mjs';

/** Cabecera del archivo (orden publicado por la FDA). */
export const PCD_COLUMNS = Object.freeze([
  'REVIEW_PANEL',
  'MEDICALSPECIALTY',
  'PRODUCTCODE',
  'DEVICENAME',
  'DEVICECLASS',
  'UNCLASSIFIED_REASON',
  'GMPEXEMPTFLAG',
  'THIRDPARTYFLAG',
  'REVIEWCODE',
  'REGULATIONNUMBER',
  'SUBMISSION_TYPE_ID',
  'DEFINITION',
  'PHYSICALSTATE',
  'TECHNICALMETHOD',
  'TARGETAREA',
  'Implant_Flag',
  'Life_Sustain_support_flag',
  'SummaryMalfunctionReporting',
]);

/**
 * Panel → partes del 21 CFR, medido en el propio archivo: para cada
 * `REVIEW_PANEL`, en qué partes caen sus product codes que sí tienen
 * regulación. No se usa ninguna tabla de paneles escrita a mano.
 */
export function derivePanelParts(rows) {
  const out = {};
  for (const r of rows) {
    const panel = nz(r.REVIEW_PANEL);
    const m = /^(\d{3})\./.exec((r.REGULATIONNUMBER ?? '').trim());
    if (!panel || !m) continue;
    out[panel] ??= {};
    out[panel][m[1]] = (out[panel][m[1]] ?? 0) + 1;
  }
  return out;
}

/**
 * Paneles IVD: aquellos cuyos product codes con regulación caen **todos** en
 * las partes IVD (862, 864, 866). Se usan solo para los product codes sin
 * regulación (no clasificados, PMA o De Novo sin sección propia).
 */
export function ivdPanelsFrom(panelParts) {
  const ivd = new Set(Object.keys(IVD_PARTS));
  return new Set(
    Object.entries(panelParts)
      .filter(
        ([, parts]) =>
          Object.keys(parts).length > 0 &&
          Object.keys(parts).every((p) => ivd.has(p)),
      )
      .map(([panel]) => panel),
  );
}

const flag = (v) => (v === 'Y' ? true : v === 'N' ? false : null);
const nz = (v) => {
  const t = (v ?? '').trim();
  return t === '' ? null : t;
};

/** Parte `foiclass` en filas (objeto por línea, claves de la cabecera). */
export function parsePcd(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  const header = lines[0].split('|').map((h) => h.trim());
  const missing = PCD_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length)
    throw new Error(`foiclass: faltan columnas ${missing.join(', ')}`);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split('|');
    if (cells.length !== header.length)
      throw new Error(
        `foiclass:${i + 1}: ${cells.length} campos, se esperaban ${header.length}`,
      );
    rows.push(Object.fromEntries(header.map((h, j) => [h, cells[j]])));
  }
  return rows;
}

/**
 * Decide si un product code es de diagnóstico con lo publicado:
 *  1. Regulación en una subparte diagnóstica/de monitoreo o parte IVD.
 *  2. Sin regulación: el panel es IVD según `ivdPanelsFrom` (medido en el
 *     mismo archivo).
 *  3. Si no, `null` (queda en la taxonomía, fuera del catálogo, para revisión).
 */
export function decidePcd(row, ivdPanels = new Set()) {
  const cfr = classifyRegulation(row.REGULATIONNUMBER);
  if (cfr.diagnostic !== null)
    return {
      cfr,
      diagnostic: cfr.diagnostic,
      branch: cfr.diagnostic ? cfr.kind : null,
      basis: cfr.basis,
    };
  const panel = nz(row.REVIEW_PANEL);
  if (cfr.basis === 'no-regulation' && panel && ivdPanels.has(panel)) {
    return {
      cfr,
      diagnostic: true,
      branch: 'ivd',
      basis: 'fda-review-panel-ivd',
    };
  }
  return { cfr, diagnostic: null, branch: null, basis: cfr.basis };
}

/** Fila de `foiclass` → nodo de taxonomía. `provenance` la arma el llamador. */
export function pcdNode(row, provenance, ivdPanels = new Set()) {
  const code = nz(row.PRODUCTCODE);
  if (!code || !/^[A-Z0-9]{3}$/.test(code))
    throw new Error(`foiclass: PRODUCTCODE inválido: ${row.PRODUCTCODE}`);
  const decision = decidePcd(row, ivdPanels);
  const panel = nz(row.REVIEW_PANEL);
  const specialty = nz(row.MEDICALSPECIALTY);
  return {
    system: 'fda-product-code',
    code,
    name: nz(row.DEVICENAME),
    definition: nz(row.DEFINITION),
    parent: null,
    diagnostic: decision.diagnostic,
    branch: decision.branch,
    basis: decision.basis,
    attributes: {
      deviceClass: nz(row.DEVICECLASS),
      reviewPanel: panel,
      medicalSpecialty: specialty,
      regulationNumber: decision.cfr.regulation,
      cfrPart: decision.cfr.part,
      cfrSubpart: decision.cfr.subpart,
      cfrSubpartTitle: decision.cfr.subpartTitle,
      cfrUrl: decision.cfr.url,
      submissionTypeId: nz(row.SUBMISSION_TYPE_ID),
      unclassifiedReason: nz(row.UNCLASSIFIED_REASON),
      gmpExempt: flag(nz(row.GMPEXEMPTFLAG)),
      thirdPartyReview: flag(nz(row.THIRDPARTYFLAG)),
      implant: flag(nz(row.Implant_Flag)),
      lifeSustaining: flag(nz(row.Life_Sustain_support_flag)),
      physicalState: nz(row.PHYSICALSTATE),
      technicalMethod: nz(row.TECHNICALMETHOD),
      targetArea: nz(row.TARGETAREA),
      summaryMalfunctionReporting: nz(row.SummaryMalfunctionReporting),
    },
    provenance: { ...provenance, sourceRecordId: code },
  };
}
