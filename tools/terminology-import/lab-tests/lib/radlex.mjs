// =============================================================================
// RSNA RadLex Playbook → registros del catálogo de análisis (imagenología).
//
// Fuente: https://playbook.radlex.org/ (RSNA). Licencia «RadLex License Version 2.1»
// (copyright license mundial, sin cargo, para reproducir, adaptar y redistribuir con
// condiciones: ver SOURCES.md). Archivos que publica el propio sitio, sin cuenta:
//
//   complete-playbook-dev.csv        https://api3.rsna.org/radlex/v1/createCsv?csvType=new
//   subset-table-playbook-dev.csv    https://api3.rsna.org/radlex/v1/createCsv?csvType=subset
//   map-to-table-playbook-dev.xlsx   https://api3.rsna.org/radlex/v1/createXlsx
//
// Un concepto por RPID. `display` = LONG_NAME cuando existe (sólo el Core Playbook lo trae) y, si no,
// AUTOMATED_LONG_NAME, que es el nombre que RSNA publica para el resto; `radlex_display_source` dice cuál.
// La licencia prohíbe cambiar en una adaptación el RPID, el código de
// letras, el nombre corto, el nombre largo, la descripción y los pares atributo-valor: se cargan
// VERBATIM. Los marcadores « » (espacio) del CSV significan «sin valor» y no se escriben.
//
// Mapeos publicados (hoja 1 del .xlsx): RPID → código LOINC (OID 2.16.840.1.113883.6.1) o RID de
// RadLex (OID 2.16.840.1.113883.6.256). Van como propiedad: este catálogo no carga LOINC completo
// y no se crea una relación a un concepto que no está en el plan. La hoja 2 mapea a CPT (AMA,
// con licencia): NO se lee.
// =============================================================================

import { slugify } from '../../lib/glossary-es/common.mjs';
import { iterDelimited, objectsOf } from './delimited.mjs';
import { readXlsx } from './xlsx-min.mjs';
import { compact, conceptIdFor } from './records.mjs';

export const RADLEX_CODE_SYSTEM = 'radlex-playbook';

export const PLAYBOOK_COLUMNS = [
  'RPID', 'LETTER_CODE', 'SHORT_NAME', 'LONG_NAME', 'AUTOMATED_SHORT_NAME', 'AUTOMATED_LONG_NAME', 'AUTOMATED_LONG_DESCRIPTION', 'STATUS',
  'STATUS_REASON', 'STATUS_TEXT', 'CHANGE_TYPE', 'CHANGE_REASON_PUBLIC', 'EXPORTED_TO_LOINC', 'MODALITY', 'PLAYBOOK_TYPE', 'POPULATION',
  'BODY_REGION', 'BODY_REGION_2', 'BODY_REGION_3', 'BODY_REGION_4', 'BODY_REGION_5', 'MODALITY_MODIFIER', 'MODALITY_MODIFIER_2',
  'MODALITY_MODIFIER_3', 'PROCEDURE_MODIFIER', 'PROCEDURE_MODIFIER_2', 'ANATOMIC_FOCUS', 'ANATOMIC_FOCUS_2', 'LATERALITY', 'REASON_FOR_EXAM',
  'REASON_FOR_EXAM_2', 'REASON_FOR_EXAM_3', 'TECHNIQUE', 'PHARMACEUTICAL', 'PHARMACEUTICAL_2', 'VIEW', 'VIEW_2', 'VIEW_3', 'VIEW_4', 'RIDS',
];

/** OID → nombre del sistema de destino, sólo los dos que aparecen en la hoja de mapeos (registro de OID de HL7). */
export const MAP_TARGETS = { '2.16.840.1.113883.6.1': 'LOINC', '2.16.840.1.113883.6.256': 'RadLex' };

const clean = (v) => (v ?? '').trim();
const multi = (d, base, extra) => [d[base], ...extra.map((n) => d[`${base}_${n}`])].map(clean).filter(Boolean);

export function parsePlaybookCsv(text) {
  return [...objectsOf(iterDelimited(text, ','), PLAYBOOK_COLUMNS, 'RadLex Playbook complete')];
}

/** @returns {Map<string,{code:string, comment:string|null}[]>} RPID → subconjuntos a los que pertenece */
export function parseSubsets(text) {
  const map = new Map();
  for (const r of objectsOf(iterDelimited(text, ','), ['RPID', 'SUBSET_CODE', 'COMMENT'], 'RadLex Playbook subsets')) {
    if (!map.has(r.RPID)) map.set(r.RPID, []);
    map.get(r.RPID).push({ code: clean(r.SUBSET_CODE), comment: clean(r.COMMENT) || null });
  }
  return map;
}

/** Hoja 1 del .xlsx: RPID, MAP_TO, COMMENTS, TARGET_SYSTEM. Se ignora la hoja de CPT. */
export function parseMapTo(xlsxBuffer) {
  const sheets = readXlsx(xlsxBuffer);
  const sheet = sheets[0];
  const [head, ...rows] = sheet.rows;
  const want = ['RPID', 'MAP_TO', 'COMMENTS', 'TARGET_SYSTEM'];
  if (!head || want.some((c, i) => head[i] !== c)) throw new Error(`Hoja «${sheet.name}»: cabecera inesperada (${(head ?? []).join(' | ')})`);
  const map = new Map();
  const unknownTargets = {};
  for (const [rpid, to, comment, oid] of rows) {
    if (!rpid) continue;
    if (!MAP_TARGETS[oid]) unknownTargets[oid] = (unknownTargets[oid] ?? 0) + 1;
    if (!map.has(rpid)) map.set(rpid, []);
    map.get(rpid).push(compact({ targetSystemOid: oid, targetSystem: MAP_TARGETS[oid] ?? null, code: to, comment: clean(comment) }));
  }
  return { map, unknownTargets, sheetNames: sheets.map((s) => s.name) };
}

export function radlexRecords({ playbook, subsets, mapTo }, prov) {
  const records = [];
  const stats = { rows: playbook.length, byStatus: {}, byModality: {}, selectable: 0, displayFromAutomatedLongName: 0, withLoincMap: 0, withRadlexMap: 0, mapsForUnknownRpid: 0 };
  const seen = new Set(playbook.map((d) => d.RPID));
  for (const rpid of mapTo.map.keys()) if (!seen.has(rpid)) stats.mapsForUnknownRpid += 1;
  const dup = new Set();
  for (const d of playbook) {
    if (dup.has(d.RPID)) throw new Error(`RPID repetido: ${d.RPID}`);
    dup.add(d.RPID);
    const status = clean(d.STATUS);
    const selectable = status === 'ACTIVE' || status === 'TRIAL';
    if (selectable) stats.selectable += 1;
    stats.byStatus[status] = (stats.byStatus[status] ?? 0) + 1;
    const modality = clean(d.MODALITY);
    stats.byModality[modality || '(sin modalidad)'] = (stats.byModality[modality || '(sin modalidad)'] ?? 0) + 1;
    const subs = subsets.get(d.RPID) ?? [];
    const maps = mapTo.map.get(d.RPID) ?? [];
    if (maps.some((m) => m.targetSystem === 'LOINC')) stats.withLoincMap += 1;
    if (maps.some((m) => m.targetSystem === 'RadLex')) stats.withRadlexMap += 1;
    // Sólo el Core Playbook trae LONG_NAME curado; el resto trae únicamente el nombre automático que publica RSNA.
    const hasLongName = clean(d.LONG_NAME) !== '';
    const display = hasLongName ? d.LONG_NAME : d.AUTOMATED_LONG_NAME;
    if (!clean(display)) throw new Error(`${d.RPID}: sin LONG_NAME ni AUTOMATED_LONG_NAME`);
    stats.displayFromAutomatedLongName += hasLongName ? 0 : 1;
    const category = modality ? { scheme: 'radlex-playbook-modality', code: slugify(modality), display: modality } : null;
    records.push({
      id: conceptIdFor(RADLEX_CODE_SYSTEM, d.RPID),
      codeSystem: RADLEX_CODE_SYSTEM,
      code: d.RPID,
      display,
      definition: clean(d.AUTOMATED_LONG_DESCRIPTION) || null,
      lang: 'en',
      selectable,
      status: status.toLowerCase(),
      category,
      domain: 'imaging',
      domainRule: `${RADLEX_CODE_SYSTEM}:playbook-de-radiologia`,
      properties: compact({
        radlex_letter_code: clean(d.LETTER_CODE),
        radlex_display_source: hasLongName ? 'LONG_NAME' : 'AUTOMATED_LONG_NAME',
        radlex_short_name: clean(d.SHORT_NAME),
        radlex_automated_short_name: clean(d.AUTOMATED_SHORT_NAME),
        radlex_automated_long_name: clean(d.AUTOMATED_LONG_NAME),
        radlex_status: status,
        radlex_status_reason: clean(d.STATUS_REASON),
        radlex_status_text: clean(d.STATUS_TEXT),
        radlex_change_type: clean(d.CHANGE_TYPE),
        radlex_change_reason_public: clean(d.CHANGE_REASON_PUBLIC),
        radlex_exported_to_loinc: d.EXPORTED_TO_LOINC === 'TRUE' ? true : d.EXPORTED_TO_LOINC === 'FALSE' ? false : null,
        radlex_modality: modality,
        radlex_playbook_type: clean(d.PLAYBOOK_TYPE),
        radlex_population: clean(d.POPULATION),
        radlex_body_regions: multi(d, 'BODY_REGION', [2, 3, 4, 5]),
        radlex_modality_modifiers: multi(d, 'MODALITY_MODIFIER', [2, 3]),
        radlex_procedure_modifiers: multi(d, 'PROCEDURE_MODIFIER', [2]),
        radlex_anatomic_focus: multi(d, 'ANATOMIC_FOCUS', [2]),
        radlex_laterality: clean(d.LATERALITY),
        radlex_reasons_for_exam: multi(d, 'REASON_FOR_EXAM', [2, 3]),
        radlex_technique: clean(d.TECHNIQUE),
        radlex_pharmaceuticals: multi(d, 'PHARMACEUTICAL', [2]),
        radlex_views: multi(d, 'VIEW', [2, 3, 4]),
        radlex_rids: clean(d.RIDS),
        radlex_subsets: subs.map((s) => s.code),
        radlex_map_to: maps,
        lab_catalog_domain: 'imaging',
        lab_catalog_domain_rule: `${RADLEX_CODE_SYSTEM}:playbook-de-radiologia`,
      }),
      designations: [],
      relations: [],
      valueSets: [
        'lab-catalog-radlex-playbook',
        'lab-catalog-domain-imaging',
        ...(category ? [`lab-catalog-radlex-playbook-cat-${category.code}`] : []),
        ...subs.map((s) => `lab-catalog-radlex-playbook-subset-${slugify(s.code)}`),
      ],
      valueSetLabels: Object.fromEntries(subs.map((s) => [`lab-catalog-radlex-playbook-subset-${slugify(s.code)}`, s.comment && s.comment !== s.code ? `${s.code} (${s.comment})` : s.code])),
      provenance: {
        source: RADLEX_CODE_SYSTEM,
        sourceName: prov.sourceName,
        sourceId: d.RPID,
        sourceVersion: prov.sourceVersion,
        sourceUrl: prov.sourceUrl,
        sourceFile: prov.sourceFile,
        sourceSha256: prov.sourceSha256,
        retrievedAt: prov.retrievedAt,
        license: prov.license,
      },
    });
  }
  return { records, stats };
}
