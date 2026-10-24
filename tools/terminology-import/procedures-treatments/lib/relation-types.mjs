// =============================================================================
// Tipos de relación: uno por predicado LITERAL de cada fuente. No se agrupan
// ni se traducen a un «indicado para» genérico: «trata según una anotación
// curada con cita» no es lo mismo que «parte del cuerpo por definición del
// código» ni que «en estudio en un ensayo». La etiqueta en castellano describe
// la relación y nombra la fuente; no es una traducción oficial.
//
// `assertion` dice qué clase de afirmación es:
//   curated-literature  anotación curada por personas, con referencia bibliográfica
//   ontology-axiom      axioma lógico de la ontología (definición del término)
//   terminology-role    rol declarado por la terminología (NCIt)
//   by-definition       eje del propio código (ICD-10-PCS Body Part, ICHI Target)
//   investigational     ensayo clínico registrado: SIEMPRE «en estudio», nunca «indicado»
//   collaborative-referenced  fuente colaborativa (Wikidata) con referencia citada; no oficial
// =============================================================================

export const RELATION_TYPES = {
  // --- MAxO / POET (procedimiento → enfermedad) --------------------------------
  'maxo-poet:TREATS': {
    kind: 'procedure-disease',
    sourcePredicate: 'TREATS',
    assertion: 'curated-literature',
    label: 'Trata (anotación curada MAxO/POET, con cita bibliográfica)',
  },
  'maxo-poet:PREVENTS': {
    kind: 'procedure-disease',
    sourcePredicate: 'PREVENTS',
    assertion: 'curated-literature',
    label: 'Previene (anotación curada MAxO/POET, con cita bibliográfica)',
  },
  'maxo-poet:CONTRAINDICATED': {
    kind: 'procedure-disease',
    sourcePredicate: 'CONTRAINDICATED',
    assertion: 'curated-literature',
    label:
      'Contraindicado (anotación curada MAxO/POET, con cita bibliográfica)',
  },
  'maxo-poet:NO_OBSERVED_BENEFIT': {
    kind: 'procedure-disease',
    sourcePredicate: 'NO_OBSERVED_BENEFIT',
    assertion: 'curated-literature',
    label:
      'Sin beneficio observado (anotación curada MAxO/POET, con cita bibliográfica)',
  },

  // --- MAxO (procedimiento → sitio anatómico) -----------------------------------
  'maxo:RO:0002233': {
    kind: 'procedure-site',
    sourcePredicate: 'RO:0002233 has input',
    assertion: 'ontology-axiom',
    label: 'Tiene como entrada la estructura (axioma «has input» de MAxO)',
  },

  // --- OHD (procedimiento odontológico → sitio anatómico) ---------------------
  'ohd:OBI:0000293': {
    kind: 'procedure-site',
    sourcePredicate: 'OBI:0000293 has specified input',
    assertion: 'ontology-axiom',
    label: 'Tiene como entrada especificada la estructura (axioma de OHD)',
  },
  'ohd:RO:0002233': {
    kind: 'procedure-site',
    sourcePredicate: 'RO:0002233 has input',
    assertion: 'ontology-axiom',
    label: 'Tiene como entrada la estructura (axioma «has input» de OHD)',
  },

  // --- NCIt (procedimiento → sitio anatómico) -----------------------------------
  'ncit:R163': {
    kind: 'procedure-site',
    sourcePredicate: 'R163 Procedure_Has_Target_Anatomy',
    assertion: 'terminology-role',
    label: 'Anatomía diana del procedimiento (rol NCIt)',
  },
  'ncit:R165': {
    kind: 'procedure-site',
    sourcePredicate: 'R165 Procedure_Has_Imaged_Anatomy',
    assertion: 'terminology-role',
    label: 'Anatomía estudiada por imagen (rol NCIt)',
  },
  'ncit:R166': {
    kind: 'procedure-site',
    sourcePredicate: 'R166 Procedure_May_Have_Excised_Anatomy',
    assertion: 'terminology-role',
    label: 'Anatomía que puede extirparse (rol NCIt)',
  },
  'ncit:R167': {
    kind: 'procedure-site',
    sourcePredicate: 'R167 Procedure_Has_Excised_Anatomy',
    assertion: 'terminology-role',
    label: 'Anatomía extirpada (rol NCIt)',
  },
  'ncit:R168': {
    kind: 'procedure-site',
    sourcePredicate: 'R168 Procedure_May_Have_Partially_Excised_Anatomy',
    assertion: 'terminology-role',
    label: 'Anatomía que puede extirparse parcialmente (rol NCIt)',
  },
  'ncit:R169': {
    kind: 'procedure-site',
    sourcePredicate: 'R169 Procedure_Has_Partially_Excised_Anatomy',
    assertion: 'terminology-role',
    label: 'Anatomía extirpada parcialmente (rol NCIt)',
  },
  'ncit:R170': {
    kind: 'procedure-site',
    sourcePredicate: 'R170 Procedure_May_Have_Completely_Excised_Anatomy',
    assertion: 'terminology-role',
    label: 'Anatomía que puede extirparse por completo (rol NCIt)',
  },
  'ncit:R171': {
    kind: 'procedure-site',
    sourcePredicate: 'R171 Procedure_Has_Completely_Excised_Anatomy',
    assertion: 'terminology-role',
    label: 'Anatomía extirpada por completo (rol NCIt)',
  },
  'ncit:R180': {
    kind: 'procedure-disease',
    sourcePredicate: 'R180 Procedure_Has_Target_Disease',
    assertion: 'terminology-role',
    label: 'Enfermedad diana del procedimiento (rol NCIt)',
  },

  // --- ICD-10-PCS (procedimiento → sitio, por definición del código) -----------
  // Un tipo por título literal del eje 4 de la tabla de CMS.
  ...Object.fromEntries(
    [
      'Body Part',
      'Body Region',
      'Treatment Site',
      'Body System / Region',
      'Body System',
    ].map((axis) => [
      `icd10pcs:${axis}`,
      {
        kind: 'procedure-site',
        sourcePredicate: `ICD-10-PCS axis 4 «${axis}»`,
        assertion: 'by-definition',
        label: `Eje «${axis}» del propio código ICD-10-PCS (tablas oficiales de CMS)`,
      },
    ]),
  ),

  // --- Wikidata (fuente colaborativa, solo con referencia real) ----------------
  'wikidata:P924': {
    kind: 'procedure-disease',
    sourcePredicate: 'P924 possible treatment',
    assertion: 'collaborative-referenced',
    label:
      'Tratamiento posible según Wikidata (fuente colaborativa, no oficial; declaración con referencia)',
  },

  // --- ClinicalTrials.gov (procedimiento ↔ condición, solo en estudio) --------
  'ctgov:investigational': {
    kind: 'procedure-disease',
    sourcePredicate:
      'MeSH de intervención y MeSH de condición derivados por NLM para el mismo estudio intervencional',
    assertion: 'investigational',
    label:
      'En estudio: registrados juntos en ensayos intervencionales de ClinicalTrials.gov (no implica indicación ni eficacia)',
  },
};

export const NCIT_PROCEDURE_ROLES = Object.keys(RELATION_TYPES)
  .filter((k) => k.startsWith('ncit:'))
  .map((k) => k.slice('ncit:'.length));

export function relationType(code) {
  const t = RELATION_TYPES[code];
  if (!t) throw new Error(`Tipo de relación no registrado: ${code}`);
  return { code, ...t };
}
