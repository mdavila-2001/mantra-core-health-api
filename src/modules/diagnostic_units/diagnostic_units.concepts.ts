import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo 23 — Diagnostic Units, Studies, Specialists and Prices.
 *
 * Cada columna `*_concept_id` NOT NULL de los inserts del módulo (tipo/estado de
 * unidad, verificación, roles de sitio, estados de oferta/precio/asignación,
 * tipos de equipo/acreditación/estudio/modalidad/moneda) toma su valor de aquí,
 * de modo que el módulo no toca el catálogo transversal ni inventa UUID sueltos.
 * Los ids `*_concept_id` que el cliente aporta (estudio, especialidad, tipo de
 * equipo, acreditación) también pueden referirse a estos conceptos sembrados.
 *
 * `seeds` (→ `DIAGNOSTIC_UNITS_CONCEPT_SEEDS`) lo consume el agregador central del
 * seed; `ids` (→ `DUNIT`) lo consumen los servicios (`DUNIT.UNIT_ACTIVE`, …).
 */
export const { seeds: DIAGNOSTIC_UNITS_CONCEPT_SEEDS, ids: DUNIT } = defineModuleConcepts(
  'diagnostic_units',
  {
    // --- diagnostic_units: tipo / propiedad / verificación / estado ----------
    UNIT_TYPE_LABORATORY: { code: 'DU_TYPE_LAB', display: 'Clinical laboratory unit' },
    UNIT_TYPE_IMAGING: { code: 'DU_TYPE_IMAGING', display: 'Diagnostic imaging unit' },
    OWNERSHIP_PRIVATE: { code: 'DU_OWN_PRIVATE', display: 'Privately owned unit' },
    VERIFICATION_PENDING: { code: 'DU_VERIF_PENDING', display: 'Verification pending' },
    VERIFICATION_VERIFIED: { code: 'DU_VERIF_VERIFIED', display: 'Verification verified' },
    UNIT_ACTIVE: { code: 'DU_UNIT_ACTIVE', display: 'Diagnostic unit active' },
    UNIT_RETIRED: { code: 'DU_UNIT_RETIRED', display: 'Diagnostic unit retired' },

    // --- diagnostic_unit_sites: rol / estado ---------------------------------
    SITE_ROLE_PRIMARY: { code: 'DU_SITE_PRIMARY', display: 'Primary operative site' },
    SITE_ROLE_COLLECTION: { code: 'DU_SITE_COLLECTION', display: 'Sample collection site' },
    SITE_ACTIVE: { code: 'DU_SITE_ACTIVE', display: 'Diagnostic unit site active' },

    // --- diagnostic_unit_specialties -----------------------------------------
    SPECIALTY_PATHOLOGY: { code: 'DU_SPEC_PATHOLOGY', display: 'Clinical pathology specialty' },

    // --- diagnostic_study_offerings: estudio / modalidad / estado ------------
    STUDY_GENERIC: { code: 'DU_STUDY_GENERIC', display: 'Generic diagnostic study' },
    MODALITY_LABORATORY: { code: 'DU_MODALITY_LAB', display: 'Laboratory modality' },
    COMPONENT_ROLE_PANEL: { code: 'DU_COMP_PANEL', display: 'Panel component role' },
    OFFERING_DRAFT: { code: 'DU_OFFER_DRAFT', display: 'Study offering draft' },
    OFFERING_ACTIVE: { code: 'DU_OFFER_ACTIVE', display: 'Study offering active' },
    OFFERING_RETIRED: { code: 'DU_OFFER_RETIRED', display: 'Study offering retired' },

    // --- diagnostic_price_schedules / diagnostic_study_prices ----------------
    PRICE_SCHEDULE_STANDARD: { code: 'DU_PS_STANDARD', display: 'Standard public price schedule' },
    PRICE_SCHEDULE_INSURER: { code: 'DU_PS_INSURER', display: 'Insurer price schedule' },
    CURRENCY_PEN: { code: 'DU_CUR_PEN', display: 'Peruvian sol' },
    SCHEDULE_ACTIVE: { code: 'DU_SCHED_ACTIVE', display: 'Price schedule active' },
    PRICE_ACTIVE: { code: 'DU_PRICE_ACTIVE', display: 'Study price active' },
    PRICE_SUPERSEDED: { code: 'DU_PRICE_SUPERSEDED', display: 'Study price superseded' },
    PRICE_RETIRED: { code: 'DU_PRICE_RETIRED', display: 'Study price retired' },

    // --- diagnostic_unit_accreditations --------------------------------------
    ACCREDITATION_ISO15189: { code: 'DU_ACC_ISO15189', display: 'ISO 15189 accreditation' },

    // --- diagnostic_equipment ------------------------------------------------
    EQUIPMENT_TYPE_ANALYZER: { code: 'DU_EQ_ANALYZER', display: 'Automated analyzer equipment' },
    EQUIPMENT_OPERATIONAL: { code: 'DU_EQ_OPERATIONAL', display: 'Equipment operational' },
    EQUIPMENT_MAINTENANCE: { code: 'DU_EQ_MAINTENANCE', display: 'Equipment under maintenance' },

    // --- diagnostic_unit_practitioner_assignments ----------------------------
    ASSIGNMENT_ROLE_SPECIALIST: { code: 'DU_ASSIGN_SPECIALIST', display: 'Specialist assignment role' },
    ASSIGNMENT_ACTIVE: { code: 'DU_ASSIGN_ACTIVE', display: 'Practitioner assignment active' },
  },
);
