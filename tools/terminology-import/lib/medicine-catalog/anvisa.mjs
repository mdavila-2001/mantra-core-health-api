// ANVISA (Brasil) · dados abertos de medicamentos → registro común.
// CSV con «;» en latin-1. No trae concentración, forma, vía, ATC ni presentación:
// todo eso queda en `null`/`[]` — no se deduce del nombre.

import { makeRecord, textOrNull } from './common.mjs';

export const ANVISA_CODE_SYSTEM = 'anvisa-medicamentos';
export const ANVISA_SOURCE_NAME = 'ANVISA — Dados abertos de medicamentos registrados';
export const ANVISA_SOURCE_URL = 'https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv';
/** Dados abertos del gobierno brasileño: se cita la fuente. Condiciones a confirmar antes de producción. */
export const ANVISA_LICENSE =
  'Dados abertos ANVISA (Governo do Brasil). Citar la fuente; confirmar condiciones de reutilización antes de producción.';

/** «42493502000141 - SOCIEDADE FARMACÊUTICA HENFER LTDA» → «SOCIEDADE FARMACÊUTICA HENFER LTDA». */
function holderOf(raw) {
  const text = textOrNull(raw);
  if (text === null) return null;
  return text.replace(/^\d{8,14}\s*-\s*/, '');
}

/** Los principios activos vienen en un solo texto separado por comas. */
function ingredientsOf(raw) {
  const text = textOrNull(raw);
  if (text === null) return [];
  return text
    .split(/\s*[,+]\s*/)
    .map((name) => textOrNull(name))
    .filter((name) => name !== null)
    .map((name) => ({ name, amount: null, unit: null }));
}

/**
 * @param {Record<string,string>} row
 * @param {string} retrievedAt
 * @returns {import('./common.mjs').CatalogRecord | null} `null` si la fila no tiene nº de registro (sin identidad).
 */
export function anvisaToRecord(row, retrievedAt) {
  const code = textOrNull(row.NUMERO_REGISTRO_PRODUTO);
  const display = textOrNull(row.NOME_PRODUTO);
  if (code === null || display === null) return null;
  const active = textOrNull(row.SITUACAO_REGISTRO) === 'Ativo';
  return makeRecord({
    source: 'anvisa',
    codeSystem: ANVISA_CODE_SYSTEM,
    code,
    display,
    holder: holderOf(row.EMPRESA_DETENTORA_REGISTRO),
    generic: textOrNull(row.CATEGORIA_REGULATORIA) === null ? null : row.CATEGORIA_REGULATORIA === 'Genérico',
    activeIngredients: ingredientsOf(row.PRINCIPIO_ATIVO),
    regulatoryStatus: active ? 'ACTIVE' : 'INACTIVE',
    sourceUrl: ANVISA_SOURCE_URL,
    sourceName: ANVISA_SOURCE_NAME,
    sourceLicense: ANVISA_LICENSE,
    sourceRetrievedAt: retrievedAt,
  });
}
