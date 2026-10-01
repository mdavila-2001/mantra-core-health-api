// INVIMA (Colombia) · Código Único de Medicamentos Vigentes (datos.gov.co,
// dataset i7cb-raxc) → registro común.
//
// El dataset es por CUM (presentación) × principio activo: 155 807 filas para
// ~9 520 registros sanitarios. Se AGRUPA por `registrosanitario`: el producto
// que una farmacia vende es el registro, y sus presentaciones son los CUM.

import { makeRecord, normalizeAtc, textOrNull, unique } from './common.mjs';

export const INVIMA_CODE_SYSTEM = 'invima-medicamentos';
export const INVIMA_SOURCE_NAME = 'INVIMA — Código Único de Medicamentos Vigentes (datos.gov.co)';
export const INVIMA_SOURCE_URL = 'https://www.datos.gov.co/Salud-y-Protecci-n-Social/C-DIGO-NICO-DE-MEDICAMENTOS-VIGENTES/i7cb-raxc';
export const INVIMA_LICENSE =
  'Datos abiertos Colombia (datos.gov.co). Citar la fuente; confirmar condiciones de reutilización antes de producción.';

/** `12.5` + `mg` → «12.5 mg». */
function amountText(row) {
  const amount = textOrNull(row.cantidad);
  const unit = textOrNull(row.unidadmedida);
  if (amount === null) return null;
  return unit === null ? amount : `${amount} ${unit}`;
}

/**
 * @param {Record<string,string>[]} rows  todas las filas de UN registro sanitario
 * @param {string} retrievedAt
 */
export function invimaGroupToRecord(rows, retrievedAt) {
  const first = rows[0];
  const code = textOrNull(first.registrosanitario);
  const display = textOrNull(first.producto);
  if (code === null || display === null) return null;

  // Un principio activo repetido en varias presentaciones cuenta una vez.
  const ingredients = new Map();
  for (const row of rows) {
    const name = textOrNull(row.principioactivo);
    if (name === null) continue;
    const key = `${name}|${amountText(row) ?? ''}`;
    if (!ingredients.has(key)) {
      ingredients.set(key, { name, amount: textOrNull(row.cantidad), unit: textOrNull(row.unidadmedida) });
    }
  }
  const activeIngredients = [...ingredients.values()];

  // La muestra médica no se vende: el propio dataset la marca (`muestramedica`).
  const presentations = new Map();
  for (const row of rows) {
    if (row.muestramedica === 'Si') continue;
    const cum = textOrNull(row.consecutivocum);
    const key = cum ?? textOrNull(row.descripcioncomercial);
    if (key === null || presentations.has(key)) continue;
    presentations.set(key, {
      code: cum === null ? null : `${textOrNull(row.expedientecum) ?? ''}-${cum}`,
      name: textOrNull(row.descripcioncomercial) ?? display,
      gtin: null, // el CUM no es un GTIN
      active: row.estadocum === 'Activo' ? true : row.estadocum === 'Inactivo' ? false : null,
    });
  }

  const vigente = textOrNull(first.estadoregistro) === 'Vigente';
  return makeRecord({
    source: 'invima',
    codeSystem: INVIMA_CODE_SYSTEM,
    code,
    display,
    holder: textOrNull(first.titular),
    strengthText: activeIngredients.length === 0 ? null : activeIngredients.map((i) => [i.amount, i.unit].filter(Boolean).join(' ')).filter((t) => t !== '').join(' + ') || null,
    dosageForm: textOrNull(first.formafarmaceutica),
    routes: unique(rows.map((r) => textOrNull(r.viaadministracion))),
    activeIngredients,
    atc: unique(rows.map((r) => normalizeAtc(r.atc))),
    presentations: [...presentations.values()],
    regulatoryStatus: vigente ? 'ACTIVE' : 'INACTIVE',
    sourceUrl: INVIMA_SOURCE_URL,
    sourceName: INVIMA_SOURCE_NAME,
    sourceLicense: INVIMA_LICENSE,
    sourceRetrievedAt: retrievedAt,
  });
}
