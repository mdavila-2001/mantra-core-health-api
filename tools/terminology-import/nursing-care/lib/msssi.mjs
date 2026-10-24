// =============================================================================
// Arquetipos UNE-EN ISO 13606 del Ministerio de Sanidad de España para el
// Conjunto Mínimo de Datos de los Informes Clínicos (CMDIC, RD 1093/2010) y la
// receta (RD 1718/2010). Originales en castellano. Copia publicada en
// github.com/openEHR/adl-archetypes (Reference/ISO_13606/Spanish_MOH/ADL_14).
//
// El CMDIC define el «Informe de cuidados de enfermería» (anexo VII del RD): es
// la estructura oficial de ese informe en el SNS. Sus ranuras (`allow_archetype`)
// nombran por id los arquetipos que lo componen: esa es la relación publicada
// que se usa para marcar el subconjunto de enfermería (regla M2).
//
// Licencia: los archivos no declaran licencia y el repositorio no tiene archivo
// LICENSE. Se cargan con estado `official-publication-license-not-stated` y la
// base legal anotada (ver `LEGAL_BASIS`); queda para confirmar con el Ministerio.
// =============================================================================

export const MSSSI_CODE_SYSTEM = 'es-msssi-cmdic-13606';
export const MSSSI_SUBDIR = 'Reference/ISO_13606/Spanish_MOH/ADL_14';
export const ADL_ARCHETYPES_REPO_URL = 'https://github.com/openEHR/adl-archetypes';

export const NURSING_REPORT_ID = 'CEN-EN13606-COMPOSITION.InformeCuidadosEnfermeria.v1';

export const LEGAL_BASIS = [
  {
    field: 'legal-basis',
    text: 'Real Decreto 1093/2010, de 3 de septiembre, por el que se aprueba el conjunto mínimo de datos de los informes clínicos en el Sistema Nacional de Salud (BOE-A-2010-14199); el anexo VII define el informe de cuidados de enfermería.',
    url: 'https://www.boe.es/eli/es/rd/2010/09/03/1093/con/20100916',
  },
  {
    field: 'legal-basis',
    text: 'Texto refundido de la Ley de Propiedad Intelectual (RDL 1/1996), art. 13: no son objeto de propiedad intelectual las disposiciones legales o reglamentarias.',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930',
  },
  {
    field: 'publisher',
    text: 'Ministerio de Sanidad, «Recursos de Modelado Clínico (arquetipos)»: materiales elaborados para el Ministerio por la Universidad Politécnica de Valencia con VeraTech e Indizen, basados en UNE-EN ISO 13606. No se encontró una licencia de uso declarada.',
    url: 'https://www.sanidad.gob.es/profesionales/hcdsns/areaRecursosSem/Rec_mod_clinico_arquetipos.htm',
  },
];

/** Signos vitales del CMDIC (alcance «control de signos vitales» del pedido). */
const VITAL_SIGNS = /ENTRY\.(PresionSanguinea|Temperatura|FrecuenciaCardiaca|FrecuenciaRespiratoria|SaturacionOxigeno|GlucemiaCapilar)\./;

export const MSSSI_RULES = [
  { key: 'M1-nursing-care-report', test: (a) => a.archetypeId === NURSING_REPORT_ID || /Enfermeria/.test(a.archetypeId) },
  { key: 'M2-slot-of-nursing-care-report', test: (a, ctx) => ctx.slotTargets.has(a.archetypeId) },
  { key: 'M3-vital-signs', test: (a) => VITAL_SIGNS.test(a.archetypeId) },
];

/** Ids de arquetipo que admiten las ranuras del informe de enfermería (patrón exacto del archivo). */
export function slotTargets(nursingReport, allIds) {
  const patterns = nursingReport.definition.nodes.filter((n) => n.slot).flatMap((n) => n.includes);
  const out = new Set();
  for (const p of patterns) {
    const re = new RegExp(`^(?:${p})$`);
    for (const id of allIds) if (re.test(id)) out.add(id);
  }
  return out;
}

export function msssiProfile(targets) {
  return {
    codeSystem: MSSSI_CODE_SYSTEM,
    sourceLabel: 'Ministerio de Sanidad (España) — arquetipos UNE-EN ISO 13606 del CMDIC (copia en openEHR/adl-archetypes)',
    termRmTypes: new Set(['SECTION', 'ENTRY', 'CLUSTER', 'ELEMENT']),
    includeSlots: true,
    rmClass: (id) => /^CEN-EN13606-([A-Z_]+)\./.exec(id)?.[1] ?? null,
    classify: () => ({ status: 'official-publication-license-not-stated', evidence: LEGAL_BASIS, rule: 'msssi-cmdic' }),
    loadable: new Set(['official-publication-license-not-stated']),
    rules: (a) => MSSSI_RULES.filter((r) => r.test(a, { slotTargets: targets })).map((r) => r.key),
    // M2 incluye datos demográficos y administrativos del informe (dirección, centro):
    // van al value set de enfermería, no al glosario de cuidados.
    glossaryRule: (rule) => rule !== 'M2-slot-of-nursing-care-report',
  };
}
