// =============================================================================
// Catálogo de análisis · NPU Terminology (IFCC-IUPAC), versión internacional.
//
// Fuente: `npu-codes-latest.csv` publicado por IFCC (enlazado desde
// https://npu-terminology.org/npu-database/). Una fila por código NPU con sus
// partes oficiales (sistema, componente, tipo de propiedad, procedimiento,
// unidad), la especialidad y la vigencia. Se cargan las filas activas de la
// versión vigente, con el texto tal cual: la licencia prohíbe cambiar
// códigos, definiciones o términos, y traducirlos.
//
// Dominio: NPU se define como terminología de «resultados de laboratorios
// clínicos» (npu-terminology.org), así que todo entra como laboratorio. La
// especialidad es la categoría, con la sigla tal como se publica: el archivo
// no trae su nombre y no se deduce.
// =============================================================================

import { compact, conceptIdFor } from './records.mjs';

export const NPU_CODE_SYSTEM = 'npu-ifcc';
export const NPU_LICENSE =
  'NPU Terminology © IFCC e IUPAC (www.labterm.dk). Licencia de uso sin cargo, comercial o no comercial, para identificar observaciones clínicas de pacientes (NPU License & Terms of Use, 2023-05-17, https://cms.npu-terminology.org/wp-content/uploads/2024/06/NPU-License-Terms-of-Use.pdf): no se modifican códigos, definiciones ni términos, y no se traducen.';

export const NPU_COLUMNS = [
  'id', 'created_date', 'change_date', 'change_comment', 'npu_code', 'short_definition', 'system_short', 'sys_spec_short', 'component_short', 'comp_spec_short',
  'kind_of_property_short', 'proc_short', 'unit_short', 'full_definition', 'system', 'sys_spec', 'component', 'kind_of_property', 'proc', 'unit', 'specialty',
  'context_dependent', 'npu_group', 'scale_type', 'replaces', 'replaced_by', 'effective_from', 'effective_to', 'active', 'current_version',
];

/** `rows` = filas del CSV como arrays (con cabecera); valida la cabecera. */
export function npuObjects(rows) {
  const [header, ...data] = rows;
  if (NPU_COLUMNS.some((c, i) => header[i]?.trim() !== c)) throw new Error(`NPU: cabecera inesperada: ${header.join(' | ')}`);
  return data.filter((r) => r.length > 1).map((r) => Object.fromEntries(NPU_COLUMNS.map((c, i) => [c, (r[i] ?? '').trim()])));
}

const date = (s) => (!s || s.startsWith('0000') ? null : s.slice(0, 10));

export function npuRecords(items, prov) {
  const included = items.filter((r) => r.active === '1' && r.current_version === 'true');
  const seen = new Set();
  const records = [];
  for (const r of included) {
    if (seen.has(r.npu_code)) throw new Error(`NPU: ${r.npu_code} dos veces en la versión vigente`);
    seen.add(r.npu_code);
    const specialty = r.specialty || '(sin especialidad)';
    records.push({
      id: conceptIdFor(NPU_CODE_SYSTEM, r.npu_code),
      codeSystem: NPU_CODE_SYSTEM,
      code: r.npu_code,
      display: r.short_definition,
      definition: r.full_definition || null,
      lang: 'en',
      selectable: true,
      status: 'active',
      category: { scheme: 'npu-specialty', code: specialty, display: specialty },
      domain: 'laboratory',
      domainRule: 'npu:terminologia-de-resultados-de-laboratorio',
      properties: compact({
        npu_system: r.system,
        npu_system_specification: r.sys_spec,
        npu_component: r.component,
        npu_component_specification: r.comp_spec_short,
        npu_kind_of_property: r.kind_of_property,
        npu_procedure: r.proc,
        npu_unit: r.unit,
        npu_short_parts: compact({ system: r.system_short, systemSpecification: r.sys_spec_short, component: r.component_short, componentSpecification: r.comp_spec_short, kindOfProperty: r.kind_of_property_short, procedure: r.proc_short, unit: r.unit_short }),
        npu_specialty: r.specialty,
        npu_scale_type: r.scale_type,
        npu_context_dependent: r.context_dependent,
        npu_group_raw: r.npu_group,
        npu_replaces: r.replaces,
        npu_replaced_by: r.replaced_by,
        npu_effective_from: date(r.effective_from),
        npu_effective_to: date(r.effective_to),
        npu_created_date: date(r.created_date),
        npu_change_date: date(r.change_date),
        npu_change_comment: r.change_comment,
        lab_catalog_domain: 'laboratory',
        lab_catalog_domain_rule: 'npu:terminologia-de-resultados-de-laboratorio',
      }),
      designations: [],
      relations: [],
      valueSets: [`lab-catalog-${NPU_CODE_SYSTEM}`, `lab-catalog-${NPU_CODE_SYSTEM}-cat-${specialty.toLowerCase()}`, 'lab-catalog-domain-laboratory'],
      provenance: {
        source: NPU_CODE_SYSTEM,
        sourceName: 'NPU Terminology (IFCC-IUPAC), versión internacional',
        sourceId: r.npu_code,
        sourceVersion: prov.sourceVersion,
        sourceUrl: 'https://npu-terminology.org/npu-database/',
        sourceFile: prov.sourceFile,
        sourceSha256: prov.sourceSha256,
        retrievedAt: prov.retrievedAt,
        license: NPU_LICENSE,
      },
    });
  }
  return { records, stats: { rows: items.length, included: included.length, excluded: items.length - included.length } };
}
