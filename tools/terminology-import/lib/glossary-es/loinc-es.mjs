// =============================================================================
// Parseo de la variante lingüística de LOINC en castellano (archivo que aporta
// el usuario: requiere cuenta gratuita en loinc.org y aceptar la licencia).
//
// El archivo vive en el paquete completo de LOINC, carpeta
// `AccessoryFiles/LinguisticVariants/`, con nombre `es<PAÍS><id>LinguisticVariant.csv`
// (p. ej. España, Argentina, México; el índice es `LinguisticVariants.csv`).
//
// ADVERTENCIA HONESTA: este parser NO se validó contra un archivo real (no hay
// cuenta y no se crean cuentas desde acá). Por eso es por CABECERA, no por
// posición: exige `LOINC_NUM` y al menos una columna de nombre
// (`LONG_COMMON_NAME` o `LinguisticVariantDisplayName`) y, si no las encuentra,
// aborta mostrando las cabeceras reales en vez de adivinar.
// =============================================================================

import { NO_IMAGE, slugify } from './common.mjs';

export const LOINC_LICENSE =
  'LOINC® es propiedad de Regenstrief Institute, Inc. y se usa bajo la licencia LOINC (https://loinc.org/license/), con su aviso de copyright y atribución. La variante lingüística la produce el socio de traducción indicado en LinguisticVariants.csv.';

/** CSV RFC 4180 (comillas dobles, comillas escapadas, saltos de línea dentro de campo). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

export function loincEsRows(csvText, prov) {
  const [header, ...data] = parseCsv(csvText);
  const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  const nameCol = ['LONG_COMMON_NAME', 'LinguisticVariantDisplayName'].find((h) => col[h] !== undefined);
  if (col.LOINC_NUM === undefined || !nameCol) {
    throw new Error(`El archivo no tiene las columnas esperadas (LOINC_NUM y LONG_COMMON_NAME|LinguisticVariantDisplayName). Cabeceras encontradas: ${header.join(', ')}`);
  }
  const get = (r, h) => (col[h] === undefined ? '' : String(r[col[h]] ?? '').trim());
  const out = [];
  for (const r of data) {
    const code = get(r, 'LOINC_NUM');
    const name = get(r, nameCol) || get(r, 'LinguisticVariantDisplayName');
    if (!/^\d{1,7}-\d$/.test(code) || !name) continue;
    const related = get(r, 'RELATEDNAMES2');
    const shortName = get(r, 'SHORTNAME');
    const cls = get(r, 'CLASS');
    const synonyms = [...new Set([shortName, ...related.split(/;\s*/)].map((x) => x.trim()).filter((x) => x && x.toLowerCase() !== name.toLowerCase()))];
    out.push({
      slug: `loinc-es-${slugify(code)}`,
      code,
      codeSystem: 'loinc-es',
      display: name,
      esName: name,
      enDisplay: null,
      esSynonyms: synonyms,
      definition: null,
      definitionHtml: null,
      definitionSource: null,
      plainSummaryEs: null,
      // La clase LOINC «RAD*» agrupa estudios de imagen; el resto son observaciones de laboratorio/clínicas.
      categoryKey: /^RAD/i.test(cls) ? 'imaging' : 'lab',
      categoryRule: /^RAD/i.test(cls) ? 'loinc:CLASS=RAD*' : 'loinc:resto',
      tagKeys: [],
      lang: 'es',
      hierarchy: cls ? [{ code: cls, display: `Clase LOINC ${cls}` }] : [],
      loincParts: {
        component: get(r, 'COMPONENT') || null,
        property: get(r, 'PROPERTY') || null,
        timing: get(r, 'TIME_ASPCT') || null,
        system: get(r, 'SYSTEM') || null,
        scale: get(r, 'SCALE_TYP') || null,
        method: get(r, 'METHOD_TYP') || null,
      },
      externalIds: { loinc: code },
      relations: [],
      ...NO_IMAGE,
      source: 'regenstrief-loinc-es',
      sourceName: prov.sourceName,
      sourceUrl: prov.sourceUrl,
      sourceRetrievedAt: prov.retrievedAt,
      sourceLicense: LOINC_LICENSE,
      reviewStatus: 'external-source',
    });
  }
  return out;
}
