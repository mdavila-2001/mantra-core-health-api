// =============================================================================
// ICD-10-CM Tabular List (NCHS/CDC, obra del gobierno de EE. UU.) → notas de
// clasificación por código. La CIE-10-ES es la traducción oficial de la
// ICD-10-CM, así que el MISMO código identifica la misma categoría: es una
// unión por código exacto declarado por la propia clasificación, no por etiqueta.
//
// Solo se toman las notas que la clasificación define para la categoría
// (incluye, término incluido, excluye 1/2, codifique primero, use código
// adicional, codifique también), literales y en inglés. Nada de esto es prosa
// del sistema.
// =============================================================================

import { decodeEntities } from '../../../lib/glossary-es/common.mjs';

/** Elemento XML de la ICD-10-CM → etiqueta de campo (la escribe el sistema; el texto es de la fuente). */
export const NOTE_FIELDS = Object.freeze({
  includes: 'Incluye',
  inclusionTerm: 'Término incluido',
  excludes1: 'Excluye 1',
  excludes2: 'Excluye 2',
  codeFirst: 'Codifique primero',
  useAdditionalCode: 'Use código adicional',
  codeAlso: 'Codifique también',
});

const TAG = /<(\/?)([A-Za-z0-9]+)(?:\s[^>]*)?(\/?)>|([^<]+)/g;
const clean = (s) => decodeEntities(s).replace(/\s+/g, ' ').trim();

/**
 * @param {string} xml  icd10cm_tabular_<año>.xml
 * @returns {{version: string|null, codes: Map<string, {code:string, title:string|null, notes: Record<string,string[]>}>}}
 */
export function parseTabular(xml) {
  const version = xml.match(/<version>([^<]+)<\/version>/)?.[1]?.trim() ?? null;
  const codes = new Map();
  const diagStack = [];
  const path = [];
  let text = '';
  for (const m of xml.matchAll(TAG)) {
    if (m[4] !== undefined) {
      text += m[4];
      continue;
    }
    const [, closing, name, selfClosing] = m;
    if (closing) {
      const value = clean(text);
      const top = diagStack.at(-1);
      if (top && value) {
        const parent = path.at(-2);
        if (name === 'name' && parent === 'diag') top.code = value;
        else if (name === 'desc' && parent === 'diag') top.title = value;
        else if (name === 'note' && NOTE_FIELDS[parent] && path.at(-3) === 'diag') (top.notes[parent] ??= []).push(value);
      }
      if (name === 'diag') {
        const d = diagStack.pop();
        if (d.code) codes.set(d.code, { code: d.code, title: d.title ?? null, notes: d.notes });
      }
      path.pop();
      text = '';
    } else {
      path.push(name);
      if (name === 'diag') diagStack.push({ code: null, title: null, notes: {} });
      if (selfClosing) path.pop();
      text = '';
    }
  }
  return { version, codes };
}

/** Ítems de la sección `classification`: «Campo: texto literal», en el orden del campo y de la fuente. */
export function noteItems(entry) {
  return Object.entries(NOTE_FIELDS).flatMap(([field, label]) => (entry.notes[field] ?? []).map((n) => `${label}: ${n}`));
}
