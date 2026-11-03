// =============================================================================
// openFDA `device/classification` (exportación oficial de la FDA, CC0) → filas
// con la forma del `foiclass` (`PCD_COLUMNS`), para que `pcdNode` y
// `derivePanelParts` las traten igual que al archivo de la FDA.
//
// Es el mismo Product Classification Database: openFDA lo publica como JSON
// (https://open.fda.gov/apis/device/classification/). No trae
// PHYSICALSTATE, TECHNICALMETHOD ni TARGETAREA: quedan vacíos.
// =============================================================================

import { PCD_COLUMNS } from './fda-pcd.mjs';

/** Campo de openFDA → columna del `foiclass`. */
export const OPENFDA_TO_PCD = Object.freeze({
  review_panel: 'REVIEW_PANEL',
  medical_specialty: 'MEDICALSPECIALTY',
  product_code: 'PRODUCTCODE',
  device_name: 'DEVICENAME',
  device_class: 'DEVICECLASS',
  unclassified_reason: 'UNCLASSIFIED_REASON',
  gmp_exempt_flag: 'GMPEXEMPTFLAG',
  third_party_flag: 'THIRDPARTYFLAG',
  review_code: 'REVIEWCODE',
  regulation_number: 'REGULATIONNUMBER',
  submission_type_id: 'SUBMISSION_TYPE_ID',
  definition: 'DEFINITION',
  implant_flag: 'Implant_Flag',
  life_sustain_support_flag: 'Life_Sustain_support_flag',
  summary_malfunction_reporting: 'SummaryMalfunctionReporting',
});

/** Texto del JSON de openFDA → `{ meta, rows }` con filas en forma `foiclass`. */
export function parseOpenfdaClassification(text) {
  const doc = JSON.parse(text);
  if (!Array.isArray(doc.results))
    throw new Error('openFDA classification: falta `results`');
  const rows = doc.results.map((r, i) => {
    if (typeof r.product_code !== 'string')
      throw new Error(`openFDA classification[${i}]: sin product_code`);
    const out = Object.fromEntries(PCD_COLUMNS.map((c) => [c, '']));
    for (const [k, col] of Object.entries(OPENFDA_TO_PCD))
      if (r[k] !== undefined && r[k] !== null) out[col] = String(r[k]);
    return out;
  });
  return { meta: doc.meta ?? null, rows };
}

/**
 * Compara dos copias del PCD por product code: códigos de una sola y, en los
 * comunes, cuántos difieren en nombre, clase y regulación (con ejemplos).
 */
export function comparePcdCopies(a, b) {
  const ia = new Map(a.map((r) => [r.PRODUCTCODE.trim(), r]));
  const ib = new Map(b.map((r) => [r.PRODUCTCODE.trim(), r]));
  const onlyA = [...ia.keys()].filter((k) => !ib.has(k)).sort();
  const onlyB = [...ib.keys()].filter((k) => !ia.has(k)).sort();
  const fields = {
    name: 'DEVICENAME',
    class: 'DEVICECLASS',
    regulation: 'REGULATIONNUMBER',
  };
  const diffs = Object.fromEntries(Object.keys(fields).map((f) => [f, []]));
  for (const [k, ra] of ia) {
    const rb = ib.get(k);
    if (!rb) continue;
    for (const [f, col] of Object.entries(fields)) {
      const va = (ra[col] ?? '').trim();
      const vb = (rb[col] ?? '').trim();
      if (va !== vb) diffs[f].push({ code: k, a: va, b: vb });
    }
  }
  return { countA: ia.size, countB: ib.size, onlyA, onlyB, diffs };
}
