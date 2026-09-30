// =============================================================================
// Normalización de las «Tablas de referencia» de CIE-10-ES 2026 (Ministerio de
// Sanidad de España) → filas del glosario. Funciones puras sobre filas de
// hoja de cálculo (`sheet_to_json(..., { header: 1 })`).
//
// Diagnósticos: hoja «ES2026 Completa + Marcadores» (capítulos, bloques y todos
// los códigos, finales y no finales, con los marcadores de validación).
// Procedimientos: hoja «ES2026 Completa + Marcadores» del libro de procedimientos.
//
// La fuente NO trae definiciones: `definition` es siempre null. El nombre
// oficial en castellano es la descripción del Ministerio, verbatim.
// =============================================================================

import { NO_IMAGE, slugify } from './common.mjs';
import { PCS_SECTIONS, dxTaxonomy, pcsTaxonomy } from './taxonomy.mjs';

export const CIE_BASE = 'https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/CIE10/2026';
export const DX_FILE = 'Diagnosticos_Tabla_Referencia_CIE10ES_2026.xlsx';
export const PX_FILE = 'Procedimientos_Tabla_Referencia_CIE10ES_2026.xlsx';
export const FULL_SHEET = 'ES2026 Completa + Marcadores';
export const CIE_SOURCE = 'sanidad-cie10es-2026';
export const CIE_LICENSE =
  'Ministerio de Sanidad, aviso legal (https://www.sanidad.gob.es/avisoLegal/home.htm): reutilización autorizada, también comercial, citando la fuente y la fecha de última actualización y sin desnaturalizar el contenido. CIE-10-ES es la traducción oficial de ICD-10-CM (© NCHS) e ICD-10-PCS (© CMS), obras del gobierno de EE. UU.';

const DX_FLAG_COLUMNS = {
  Manifestación: 'manifestation',
  Perinatal: 'perinatal',
  Pediátrico: 'pediatric',
  Obstétrico: 'obstetric',
  Adulto: 'adult',
  Mujer: 'female',
  Hombre: 'male',
  Poa_Exento: 'poaExempt',
  'Dp_no principal': 'notPrincipal',
  Vcdp: 'vcdp',
};

const isChapter = (code) => /^Cap\.\d+$/i.test(code);
const isBlock = (code) => /^[A-Z][0-9A-Z]{2}-[A-Z][0-9A-Z]{2}$/.test(code);

function blockContains(outer, inner) {
  const [a, b] = outer.split('-');
  const [c, d] = inner.split('-');
  return a <= c && d <= b;
}

/** Padre estructural de un código CIE-10-ES: quitar el último carácter (y el punto si queda colgando). */
export function dxParentCode(code) {
  if (code.length <= 3) return null;
  let p = code.slice(0, -1);
  if (p.endsWith('.')) p = p.slice(0, -1);
  return p;
}

/**
 * Filas del Excel de diagnósticos → filas del glosario.
 * @param {unknown[][]} sheetRows  incluye la cabecera
 * @param {{sourceUrl:string, retrievedAt:string, sourceName:string}} prov
 */
export function dxRows(sheetRows, prov) {
  const [header, ...rows] = sheetRows;
  const col = Object.fromEntries(header.map((h, i) => [String(h).trim(), i]));
  const byCode = new Map();
  let chapter = null;
  const blockStack = [];
  const out = [];
  for (const r of rows) {
    const code = r[col['Código']] == null ? '' : String(r[col['Código']]).trim();
    const desc = r[col['Descripción']] == null ? '' : String(r[col['Descripción']]).trim();
    if (!code || !desc) continue;
    if (isChapter(code)) {
      chapter = { code, display: desc };
      blockStack.length = 0;
      continue;
    }
    if (isBlock(code)) {
      while (blockStack.length && !blockContains(blockStack.at(-1).code, code)) blockStack.pop();
      blockStack.push({ code, display: desc });
      continue;
    }
    const flags = { final: Number(r[col['Nodo_Final']]) === 1 };
    for (const [h, key] of Object.entries(DX_FLAG_COLUMNS)) {
      if (col[h] !== undefined && String(r[col[h]] ?? '').trim() === '1') flags[key] = true;
    }
    const ancestors = [];
    for (let p = dxParentCode(code); p; p = dxParentCode(p)) {
      const a = byCode.get(p);
      if (a) ancestors.unshift({ code: a.code, display: a.esName });
    }
    const { categoryKey, tagKeys } = dxTaxonomy(code, flags);
    const row = {
      slug: `cie10es-dx-${slugify(code)}`,
      code,
      codeSystem: 'cie10es-diagnosticos-2026',
      display: desc,
      esName: desc,
      enDisplay: null,
      esSynonyms: [],
      definition: null,
      definitionHtml: null,
      definitionSource: null,
      plainSummaryEs: null,
      categoryKey,
      tagKeys,
      lang: 'es',
      hierarchy: [...(chapter ? [chapter] : []), ...blockStack.map((b) => ({ ...b })), ...ancestors],
      flags,
      // CIE-10-ES Diagnósticos es la traducción oficial de ICD-10-CM: el código es el mismo.
      externalIds: { icd10cm: code },
      relations: [],
      ...NO_IMAGE,
      source: CIE_SOURCE,
      sourceName: prov.sourceName,
      sourceUrl: prov.sourceUrl,
      sourceRetrievedAt: prov.retrievedAt,
      sourceLicense: CIE_LICENSE,
      reviewStatus: 'external-source',
    };
    byCode.set(code, row);
    out.push(row);
  }
  return out;
}

/** Filas del Excel de procedimientos → filas del glosario. */
export function pxRows(sheetRows, prov) {
  const [header, ...rows] = sheetRows;
  const col = Object.fromEntries(header.map((h, i) => [String(h).trim(), i]));
  const out = [];
  for (const r of rows) {
    const code = r[col['Código']] == null ? '' : String(r[col['Código']]).trim();
    const desc = r[col['Descripción']] == null ? '' : String(r[col['Descripción']]).trim();
    if (!/^[0-9A-HJ-NP-Z]{7}$/.test(code) || !desc) continue;
    const flags = { final: true };
    if (col.Hombre !== undefined && String(r[col.Hombre] ?? '').trim() === '1') flags.male = true;
    if (col.Mujer !== undefined && String(r[col.Mujer] ?? '').trim() === '1') flags.female = true;
    const { categoryKey, tagKeys, sectionName } = pcsTaxonomy(code);
    out.push({
      slug: `cie10es-px-${slugify(code)}`,
      code,
      codeSystem: 'cie10es-procedimientos-2026',
      display: desc,
      esName: desc,
      enDisplay: null,
      esSynonyms: [],
      definition: null,
      definitionHtml: null,
      definitionSource: null,
      plainSummaryEs: null,
      categoryKey,
      tagKeys,
      lang: 'es',
      hierarchy: sectionName ? [{ code: code[0], display: `Sección ${code[0]}: ${sectionName}` }] : [],
      flags,
      externalIds: { icd10pcs: code },
      relations: [],
      ...NO_IMAGE,
      source: CIE_SOURCE,
      sourceName: prov.sourceName,
      sourceUrl: prov.sourceUrl,
      sourceRetrievedAt: prov.retrievedAt,
      sourceLicense: CIE_LICENSE,
      reviewStatus: 'external-source',
    });
  }
  return out;
}

export { PCS_SECTIONS };
