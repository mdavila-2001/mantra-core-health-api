import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Organization Extensions (22 — Healthcare Organization
 * Specializations). Cada columna `*_concept_id` NOT NULL de los inserts del
 * módulo (tipo de hospital, estado del hospital, tipo/estado de línea de
 * servicio, tipo de instalación, tipo/estado de verificación de licencia, tipo y
 * estado de afiliación, tipo y estado de frontera de datos) toma su valor de aquí
 * cuando el cliente no envía uno explícito, de modo que el módulo no necesita
 * tocar el catálogo transversal ni inventar UUID sueltos.
 *
 * `seeds` (→ `ORGANIZATION_EXTENSIONS_CONCEPT_SEEDS`) lo consume el agregador
 * central del seed; `ids` (→ `ORGEXT`) lo consumen los servicios
 * (`ORGEXT.HOSPITAL_ACTIVE`, …).
 */
export const { seeds: ORGANIZATION_EXTENSIONS_CONCEPT_SEEDS, ids: ORGEXT } =
  defineModuleConcepts('organization_extensions', {
    // --- hospitals -----------------------------------------------------------
    HOSPITAL_TYPE_GENERAL: {
      code: 'OE_HOSP_TYPE_GENERAL',
      display: 'General hospital type',
    },
    HOSPITAL_CARE_LEVEL_TERTIARY: {
      code: 'OE_HOSP_CARE_TERTIARY',
      display: 'Tertiary care level',
    },
    HOSPITAL_OWNERSHIP_PRIVATE: {
      code: 'OE_HOSP_OWN_PRIVATE',
      display: 'Private ownership type',
    },
    HOSPITAL_DRAFT: {
      code: 'OE_HOSP_DRAFT',
      display: 'Hospital draft/inactive',
    },
    HOSPITAL_ACTIVE: { code: 'OE_HOSP_ACTIVE', display: 'Hospital active' },

    // --- hospital_service_lines ---------------------------------------------
    SERVICE_LINE_GENERAL: {
      code: 'OE_SL_GENERAL',
      display: 'General service line',
    },
    SERVICE_LINE_ACTIVE: {
      code: 'OE_SL_ACTIVE',
      display: 'Service line active',
    },
    SERVICE_LINE_RETIRED: {
      code: 'OE_SL_RETIRED',
      display: 'Service line retired',
    },

    // --- facility_licenses ---------------------------------------------------
    FACILITY_TYPE_HOSPITAL: {
      code: 'OE_FAC_TYPE_HOSPITAL',
      display: 'Hospital facility type',
    },
    LICENSE_TYPE_OPERATING: {
      code: 'OE_LIC_TYPE_OPERATING',
      display: 'Operating license type',
    },
    LICENSE_PENDING: {
      code: 'OE_LIC_PENDING',
      display: 'License verification pending',
    },
    LICENSE_VERIFIED: { code: 'OE_LIC_VERIFIED', display: 'License verified' },
    LICENSE_REJECTED: { code: 'OE_LIC_REJECTED', display: 'License rejected' },

    // --- organization_affiliations ------------------------------------------
    AFFILIATION_TYPE_REFERRAL: {
      code: 'OE_AFF_TYPE_REFERRAL',
      display: 'Referral affiliation type',
    },
    AFFILIATION_ACTIVE: {
      code: 'OE_AFF_ACTIVE',
      display: 'Affiliation active',
    },
    AFFILIATION_TERMINATED: {
      code: 'OE_AFF_TERMINATED',
      display: 'Affiliation terminated',
    },

    // --- organization_data_boundaries ---------------------------------------
    BOUNDARY_TYPE_RESIDENCY: {
      code: 'OE_BND_TYPE_RESIDENCY',
      display: 'Data residency boundary type',
    },
    BOUNDARY_ACTIVE: { code: 'OE_BND_ACTIVE', display: 'Data boundary active' },
  });
