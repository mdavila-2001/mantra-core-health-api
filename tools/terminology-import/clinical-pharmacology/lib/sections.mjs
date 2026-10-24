// =============================================================================
// Catálogo cerrado de secciones de una monografía y su correspondencia, por
// IGUALDAD EXACTA, con la sección oficial de cada fuente.
//
// La clave (`key`) sólo agrupa: el texto de cada fila es el de UNA sección de
// UN documento de UNA fuente, con su número o campo oficial en
// `section.number`. Dos fuentes nunca comparten texto, aunque compartan clave.
//
// Ficha técnica (CIMA): numeración del modelo QRD de la EMA, la que siguen
// todas las fichas técnicas autorizadas en España.
// openFDA: nombres de campo documentados en
// https://open.fda.gov/apis/drug/label/searchable-fields/ (formato PLR y
// formato antiguo; los dos se mapean, cada uno a su propia fila).
// =============================================================================

/** Claves de sección (identificadores en inglés) y su rótulo en castellano. */
export const SECTION_KEYS = Object.freeze({
  boxed_warning: 'Advertencia en recuadro',
  composition: 'Composición',
  pharmaceutical_form: 'Forma farmacéutica',
  indications: 'Indicaciones',
  posology: 'Posología y forma de administración',
  contraindications: 'Contraindicaciones',
  warnings: 'Advertencias y precauciones',
  interactions: 'Interacciones',
  pregnancy_lactation: 'Fertilidad, embarazo y lactancia',
  driving: 'Efectos sobre la capacidad para conducir',
  adverse_reactions: 'Reacciones adversas',
  overdose: 'Sobredosis',
  mechanism_of_action: 'Mecanismo de acción',
  pharmacodynamics: 'Propiedades farmacodinámicas',
  clinical_pharmacology: 'Farmacología clínica',
  pharmacokinetics: 'Propiedades farmacocinéticas',
  pharmacogenomics: 'Farmacogenómica',
  preclinical_safety: 'Datos preclínicos sobre seguridad',
  excipients: 'Lista de excipientes',
  incompatibilities: 'Incompatibilidades',
});

/** Ficha técnica de CIMA: número oficial → clave. La sección 10 se lee aparte (fecha de revisión). */
export const CIMA_SECTIONS = Object.freeze({
  '2': 'composition',
  '3': 'pharmaceutical_form',
  '4.1': 'indications',
  '4.2': 'posology',
  '4.3': 'contraindications',
  '4.4': 'warnings',
  '4.5': 'interactions',
  '4.6': 'pregnancy_lactation',
  '4.7': 'driving',
  '4.8': 'adverse_reactions',
  '4.9': 'overdose',
  '5.1': 'pharmacodynamics',
  '5.2': 'pharmacokinetics',
  '5.3': 'preclinical_safety',
  '6.1': 'excipients',
  '6.2': 'incompatibilities',
});

/** Etiqueta SPL vía openFDA: campo → clave. `*_table` no se lista: se guarda junto a su campo. */
export const OPENFDA_FIELDS = Object.freeze({
  boxed_warning: 'boxed_warning',
  description: 'composition',
  dosage_forms_and_strengths: 'pharmaceutical_form',
  indications_and_usage: 'indications',
  dosage_and_administration: 'posology',
  contraindications: 'contraindications',
  warnings_and_cautions: 'warnings',
  warnings: 'warnings',
  precautions: 'warnings',
  drug_interactions: 'interactions',
  use_in_specific_populations: 'pregnancy_lactation',
  pregnancy: 'pregnancy_lactation',
  teratogenic_effects: 'pregnancy_lactation',
  lactation: 'pregnancy_lactation',
  nursing_mothers: 'pregnancy_lactation',
  adverse_reactions: 'adverse_reactions',
  overdosage: 'overdose',
  mechanism_of_action: 'mechanism_of_action',
  pharmacodynamics: 'pharmacodynamics',
  clinical_pharmacology: 'clinical_pharmacology',
  pharmacokinetics: 'pharmacokinetics',
  pharmacogenomics: 'pharmacogenomics',
  nonclinical_toxicology: 'preclinical_safety',
  inactive_ingredient: 'excipients',
});

/**
 * Lo que el pedido exige de cada monografía. Una sección cuenta como presente si
 * la fuente trae CUALQUIERA de sus claves alternativas (p. ej. en la ficha
 * técnica el mecanismo de acción está dentro de 5.1; en las etiquetas antiguas
 * de la FDA, dentro de «clinical pharmacology»). Clase farmacológica (ATC) y
 * formas/vías se miden aparte, porque no son texto de ficha.
 */
export const REQUIRED_SECTIONS = Object.freeze({
  mechanism: ['mechanism_of_action', 'pharmacodynamics', 'clinical_pharmacology'],
  pharmacokinetics: ['pharmacokinetics', 'clinical_pharmacology'],
  indications: ['indications'],
  posology: ['posology'],
  contraindications: ['contraindications'],
  warnings: ['warnings', 'boxed_warning'],
  interactions: ['interactions'],
  adverse_reactions: ['adverse_reactions'],
  pregnancy_lactation: ['pregnancy_lactation'],
  overdose: ['overdose'],
});

/** Código de `concept_properties` de una sección. Uno por clave; varias filas por concepto (una por documento). */
export const sectionPropertyCode = (key) => {
  if (!(key in SECTION_KEYS)) throw new Error(`Clave de sección desconocida: ${key}`);
  return `pharmacology_section_${key}`;
};

/** Qué requisitos cubre un conjunto de claves presentes. */
export function requiredCoverage(presentKeys) {
  const present = new Set(presentKeys);
  const out = {};
  for (const [req, alternatives] of Object.entries(REQUIRED_SECTIONS)) out[req] = alternatives.some((k) => present.has(k));
  return out;
}
