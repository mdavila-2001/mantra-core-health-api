// =============================================================================
// openFDA drug labels (SPL de DailyMed) → secciones literales en inglés.
// Funciones puras sobre los objetos de `results[]` de las particiones de
// https://download.open.fda.gov/drug/label/ (índice en
// https://api.fda.gov/download.json). El contenido NO se traduce: se guarda en
// su idioma de origen (`language: 'en'`).
//
// Enlace con el ATC, sólo por código: ATC 5 → RxCUI del ingrediente (RxNorm,
// `idtype=ATC`) → UNII (propiedad `UNII_CODE` de RxNorm) → etiquetas cuyo
// `openfda.unii` es EXACTAMENTE ese conjunto de UNII. Nunca por nombre.
//
// ESTADO: escrito contra la lista de campos documentada por openFDA; NO
// validado contra una partición real (la red de la sesión que lo escribió
// bloqueaba download.open.fda.gov). Ver SOURCES.md.
// =============================================================================

import { extractTables, literalFromParagraphs } from './literal.mjs';
import { OPENFDA_FIELDS } from './sections.mjs';

export const OPENFDA_SOURCE = 'openfda-label';
export const OPENFDA_SOURCE_NAME = 'openFDA Drug Labeling (SPL de DailyMed, U.S. Food and Drug Administration)';
export const OPENFDA_LICENSE =
  'openFDA: datos de dominio público (CC0 1.0), «no copyright restrictions»; https://open.fda.gov/license/. ' +
  'El texto de la etiqueta es el aprobado por la FDA y publicado por la NLM en DailyMed.';
export const OPENFDA_DOWNLOAD_INDEX = 'https://api.fda.gov/download.json';

const first = (v) => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
const list = (v) => (Array.isArray(v) ? v.filter((x) => x != null && x !== '') : v == null || v === '' ? [] : [v]);

/** `20240131` → `2024-01-31` (la fecha tal como la publica la etiqueta). */
export function effectiveDate(label) {
  const t = String(label?.effective_time ?? '');
  return /^\d{8}$/.test(t) ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : null;
}

export const dailyMedSetUrl = (setId) => `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(setId)}`;
export const openFdaLabelApiUrl = (id) => `https://api.fda.gov/drug/label.json?search=id:%22${encodeURIComponent(id)}%22`;

/** Resumen de identidad de una etiqueta: lo necesario para elegir referencia sin cargar todo el texto. */
export function labelIdentity(label) {
  const o = label?.openfda ?? {};
  return {
    id: label?.id ?? null,
    setId: label?.set_id ?? null,
    version: label?.version ?? null,
    effectiveDate: effectiveDate(label),
    productType: first(o.product_type),
    unii: [...new Set(list(o.unii))].sort(),
    rxcui: [...new Set(list(o.rxcui))].sort(),
    routes: [...new Set(list(o.route))].sort(),
    brandName: first(o.brand_name),
    genericName: first(o.generic_name),
    manufacturer: first(o.manufacturer_name),
    splId: first(o.spl_id),
    applicationNumber: first(o.application_number),
    pharmClassEpc: list(o.pharm_class_epc),
    pharmClassMoa: list(o.pharm_class_moa),
  };
}

const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Etiqueta de referencia por (conjunto de UNII, vías): entre las etiquetas de
 * medicamento de prescripción humano cuyo `openfda.unii` es exactamente el
 * conjunto pedido, la de `effective_time` más reciente; a igualdad, el
 * `set_id` menor. Si no hay de prescripción, se acepta OTC (queda dicho en el
 * criterio). Determinista y auditable; no juzga cuál etiqueta es «mejor».
 * @param {ReturnType<typeof labelIdentity>[]} identities
 * @param {string[]} uniiSet  ordenado
 */
export function referenceLabels(identities, uniiSet) {
  const matching = identities.filter((l) => l.id && sameSet(l.unii, uniiSet));
  const rx = matching.filter((l) => l.productType === 'HUMAN PRESCRIPTION DRUG');
  const pool = rx.length > 0 ? rx : matching.filter((l) => l.productType === 'HUMAN OTC DRUG');
  const kind = rx.length > 0 ? 'de prescripción (HUMAN PRESCRIPTION DRUG)' : 'de venta libre (HUMAN OTC DRUG), porque no hay de prescripción';
  const groups = new Map();
  for (const l of pool) {
    const key = l.routes.join(' | ') || '(sin vía declarada)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(l);
  }
  return [...groups.entries()]
    .map(([routes, members]) => {
      const ref = [...members].sort((a, b) => String(b.effectiveDate).localeCompare(String(a.effectiveDate)) || String(a.setId).localeCompare(String(b.setId)))[0];
      return {
        identity: ref,
        criterion:
          `Etiqueta de referencia por (UNII exactos, vías): entre las etiquetas ${kind} con ese conjunto exacto de UNII, ` +
          'la de effective_time más reciente; a igualdad, el set_id menor.',
        group: { unii: uniiSet, routes, candidates: members.length },
      };
    })
    .sort((a, b) => a.group.routes.localeCompare(b.group.routes));
}

/** Etiqueta completa → filas de sección literales (inglés) con su procedencia. */
export function openFdaSections(label, ref, retrievedAt) {
  const id = labelIdentity(label);
  const out = [];
  for (const [field, key] of Object.entries(OPENFDA_FIELDS)) {
    const literal = literalFromParagraphs(label[field]);
    if (!literal) continue;
    const tables = extractTables(list(label[`${field}_table`]).join('\n'));
    const title = id.brandName ?? id.genericName ?? id.setId;
    out.push({
      key,
      source: OPENFDA_SOURCE,
      sourceName: OPENFDA_SOURCE_NAME,
      language: 'en',
      audience: 'professional',
      document: {
        type: 'spl',
        id: id.setId,
        title,
        holder: id.manufacturer,
        version: id.version ?? null,
        effectiveDate: id.effectiveDate,
        splId: id.id,
        applicationNumber: id.applicationNumber,
        url: dailyMedSetUrl(id.setId),
        pageUrl: dailyMedSetUrl(id.setId),
      },
      section: { number: field, title: null, url: dailyMedSetUrl(id.setId), apiUrl: openFdaLabelApiUrl(id.id) },
      ...literal,
      tables,
      retrievedAt,
      license: OPENFDA_LICENSE,
      citation:
        `U.S. FDA. openFDA drug label, set_id ${id.setId}, versión ${id.version ?? '?'} (effective_time ${id.effectiveDate ?? '?'}), ` +
        `campo «${field}». ${dailyMedSetUrl(id.setId)} (consultado el ${retrievedAt.slice(0, 10)}).`,
      selection: { criterion: ref.criterion, group: ref.group },
    });
  }
  return out;
}

/** Clases farmacológicas que la FDA publica en la etiqueta (EPC/MoA del NDF-RT/MED-RT), literales. */
export function openFdaPharmClasses(label, retrievedAt) {
  const id = labelIdentity(label);
  if (id.pharmClassEpc.length === 0 && id.pharmClassMoa.length === 0) return null;
  return { source: OPENFDA_SOURCE, epc: id.pharmClassEpc, moa: id.pharmClassMoa, document: { type: 'spl', id: id.setId, splId: id.id }, retrievedAt, license: OPENFDA_LICENSE };
}
