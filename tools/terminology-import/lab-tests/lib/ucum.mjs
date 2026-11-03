// =============================================================================
// Unidades UCUM con las que se informan los resultados.
//
// Dos fuentes reales, sin fusionar contenido (sólo se unen por el código UCUM
// sensible a mayúsculas, que es el identificador oficial):
//   1. `data/ucumDefs.min.json` de @lhncbc/ucum-lhc (NLM/LHNCBC): las unidades
//      de ucum-essence.xml más las combinaciones de unidades que usa LOINC
//      (`source_` = 'UCUM' | 'LOINC'), con nombre, propiedad, dimensión, etc.
//   2. `ValueSet-ucum-common.json` de HL7 THO: la lista de unidades comunes con
//      su `display` oficial de HL7.
// Los prefijos (k, m, µ…) no son unidades y no se cargan como conceptos.
// =============================================================================

import { compact, conceptIdFor } from './records.mjs';

export const UCUM_CODE_SYSTEM = 'ucum';
export const UCUM_VS_ALL = 'lab-catalog-ucum-units';
export const UCUM_VS_COMMON = 'lab-catalog-ucum-common-units';

/** `{ config: [...campos], data: [[...], ...] }` → objetos por nombre de campo (sin el `_` final). */
export function unpackUcumTable(table) {
  const fields = table.config.map((f) => (Array.isArray(f) ? f[0] : f).replace(/_$/, ''));
  return table.data.map((row) => Object.fromEntries(fields.map((f, i) => [f, row[i]])));
}

const splitSynonyms = (s) => (typeof s === 'string' ? [...new Set(s.split(';').map((x) => x.trim()).filter(Boolean))] : []);

/**
 * @param {object} ucumDefs contenido de ucumDefs.min.json
 * @param {object|null} ucumCommonVs ValueSet-ucum-common.json de THO (opcional)
 * @param {{ lhc: object, tho: object|null }} prov procedencia de cada archivo
 */
export function ucumRecords(ucumDefs, ucumCommonVs, prov) {
  if (!ucumDefs?.units?.config || !Array.isArray(ucumDefs.units.data)) throw new Error('ucumDefs.min.json sin units.config/units.data');
  const units = unpackUcumTable(ucumDefs.units);
  const byCode = new Map();
  const duplicates = [];
  for (const u of units) {
    if (!u.csCode) continue;
    if (byCode.has(u.csCode)) {
      duplicates.push(u.csCode);
      continue;
    }
    byCode.set(u.csCode, { lhc: u, common: null });
  }
  const common = [];
  if (ucumCommonVs) {
    for (const inc of ucumCommonVs.compose?.include ?? []) {
      if (inc.system !== 'http://unitsofmeasure.org') continue;
      for (const c of inc.concept ?? []) common.push(c);
    }
    for (const c of common) {
      const hit = byCode.get(c.code);
      if (hit) hit.common = c;
      else byCode.set(c.code, { lhc: null, common: c });
    }
  }

  const records = [];
  for (const [code, { lhc, common: cm }] of byCode) {
    const obsolete = lhc?.category === 'Obsolete' || Boolean(lhc?.defError);
    const lhcProv = {
      source: 'ucum',
      sourceName: `UCUM — tabla de @lhncbc/ucum-lhc ${prov.lhc.packageVersion}`,
      sourceId: code,
      sourceVersion: `${prov.lhc.packageName}@${prov.lhc.packageVersion}`,
      sourceUrl: 'https://ucum.org/ucum',
      sourceFile: prov.lhc.file,
      sourceSha256: prov.lhc.sha256,
      retrievedAt: prov.lhc.retrievedAt,
      license: prov.lhc.license,
    };
    const thoProv = prov.tho && {
      source: 'hl7-tho',
      sourceName: `HL7 Terminology (THO) ${prov.tho.packageVersion} — ValueSet ucum-common`,
      sourceId: `http://terminology.hl7.org/ValueSet/ucum-common#${code}`,
      sourceVersion: `${prov.tho.packageName}@${prov.tho.packageVersion}; ValueSet ${ucumCommonVs.version}`,
      sourceUrl: `https://terminology.hl7.org/${prov.tho.packageVersion}/ValueSet-ucum-common.html`,
      sourceFile: prov.tho.file,
      sourceSha256: prov.tho.sha256,
      retrievedAt: prov.tho.retrievedAt,
      license: prov.tho.license,
    };
    records.push({
      id: conceptIdFor(UCUM_CODE_SYSTEM, code),
      codeSystem: UCUM_CODE_SYSTEM,
      code,
      display: lhc?.name || cm?.display || code,
      definition: lhc?.guidance || null,
      lang: 'en',
      selectable: !obsolete,
      status: obsolete ? 'obsolete' : 'active',
      category: lhc?.category ? { scheme: 'ucum-lhc-category', code: lhc.category, display: lhc.category } : null,
      domain: null,
      domainRule: null,
      properties: compact({
        ucum_print_symbol: lhc?.printSymbol ?? null,
        ucum_property: lhc?.property ?? null,
        ucum_loinc_property: lhc?.loincProperty ?? null,
        ucum_is_base: typeof lhc?.isBase === 'boolean' ? lhc.isBase : null,
        ucum_is_metric: typeof lhc?.isMetric === 'boolean' ? lhc.isMetric : null,
        ucum_is_special: typeof lhc?.isSpecial === 'boolean' ? lhc.isSpecial : null,
        ucum_is_arbitrary: typeof lhc?.isArbitrary === 'boolean' ? lhc.isArbitrary : null,
        ucum_class: lhc?.class ?? null,
        ucum_magnitude: typeof lhc?.magnitude === 'number' ? lhc.magnitude : null,
        ucum_dimension: Array.isArray(lhc?.dim) ? lhc.dim : null,
        ucum_ci_code: lhc?.ciCode ?? null,
        ucum_synonyms: splitSynonyms(lhc?.synonyms),
        ucum_table_source: lhc?.source || null, // 'UCUM' = ucum-essence; 'LOINC' = combinación usada por LOINC
        ucum_common_display: cm?.display ?? null,
      }),
      designations: [],
      relations: [],
      valueSets: cm ? [UCUM_VS_ALL, UCUM_VS_COMMON] : [UCUM_VS_ALL],
      provenance: lhc ? lhcProv : thoProv,
      ...(lhc && cm ? { alsoIn: [thoProv] } : {}),
    });
  }
  return { records, stats: { lhcUnits: units.length, lhcDuplicateCodes: duplicates, thoCommon: common.length, merged: records.length } };
}
