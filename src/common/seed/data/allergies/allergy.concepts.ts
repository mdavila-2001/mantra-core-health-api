import { defineModuleConcepts } from '../../concept-seed';

/**
 * Conceptos de las enumeraciones de HL7 FHIR `AllergyIntolerance` que la
 * plataforma todavía no tenía.
 *
 * `clinical.concepts.ts` ya declaraba un valor de cada campo (el que el alta usa
 * por omisión: activa, confirmada, alergia, medicamento, criticidad alta). Acá
 * están los hermanos que faltaban para que cada campo tenga su enumeración
 * completa; los cinco existentes **se reutilizan** en
 * `allergy-dynamic-enums.ts`, no se duplican.
 *
 * Procedencia de cada valor (sistema, código y versión exactos):
 * `fhir-allergy-enum-codes.json`, que también lee el importador
 * (`tools/terminology-import/allergies/`) para cargar los sistemas de HL7 y su
 * correspondencia con estos conceptos.
 *
 * El prefijo `clinical-allergy` es propio para que la clave (semilla del UUIDv5)
 * no choque nunca con un concepto que el módulo clínico agregue más adelante.
 */
export const { seeds: ALLERGY_CONCEPT_SEEDS, ids: ALG } = defineModuleConcepts(
  'clinical-allergy',
  {
    // --- allergy-intolerance-type (HL7 FHIR) ----------------------------------
    TYPE_INTOLERANCE: { code: 'ALG_INTOLERANCE', display: 'Intolerance' },

    // --- allergy-intolerance-category (HL7 FHIR) ------------------------------
    CATEGORY_FOOD: { code: 'ALG_FOOD', display: 'Food' },
    CATEGORY_ENVIRONMENT: { code: 'ALG_ENVIRONMENT', display: 'Environment' },
    CATEGORY_BIOLOGIC: { code: 'ALG_BIOLOGIC', display: 'Biologic' },

    // --- allergy-intolerance-criticality (HL7 FHIR) ---------------------------
    CRITICALITY_LOW: { code: 'ALG_LOW', display: 'Low Risk' },
    CRITICALITY_UNABLE_TO_ASSESS: {
      code: 'ALG_UNABLE_TO_ASSESS',
      display: 'Unable to Assess Risk',
    },

    // --- allergyintolerance-clinical (HL7 Terminology) ------------------------
    CLINICAL_INACTIVE: { code: 'ALG_INACTIVE', display: 'Inactive' },
    CLINICAL_RESOLVED: { code: 'ALG_RESOLVED', display: 'Resolved' },

    // --- allergyintolerance-verification (HL7 Terminology) --------------------
    VERIFICATION_UNCONFIRMED: {
      code: 'ALG_UNCONFIRMED',
      display: 'Unconfirmed',
    },
    VERIFICATION_PRESUMED: { code: 'ALG_PRESUMED', display: 'Presumed' },
    VERIFICATION_REFUTED: { code: 'ALG_REFUTED', display: 'Refuted' },
    VERIFICATION_ENTERED_IN_ERROR: {
      code: 'ALG_ENTERED_IN_ERROR',
      display: 'Entered in Error',
    },

    // --- reaction-event-severity (HL7 FHIR) -----------------------------------
    REACTION_SEVERITY_MILD: { code: 'ALG_REACTION_MILD', display: 'Mild' },
    REACTION_SEVERITY_MODERATE: {
      code: 'ALG_REACTION_MODERATE',
      display: 'Moderate',
    },
    REACTION_SEVERITY_SEVERE: {
      code: 'ALG_REACTION_SEVERE',
      display: 'Severe',
    },
  },
);
