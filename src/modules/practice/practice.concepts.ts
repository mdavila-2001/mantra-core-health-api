import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Practice (14 — Care Organizations, Sites, Units, Spaces
 * and Workforce). Cada columna `*_concept_id` NOT NULL de los inserts del módulo
 * (estados de ciclo de vida, tipos de sitio/unidad/espacio, tipos de servicio,
 * roles, tipos de acreditación, tipos de movimiento de inventario) toma su valor
 * de aquí, de modo que el módulo no necesita tocar el catálogo transversal ni
 * inventar UUID sueltos.
 *
 * `seeds` (→ `PRACTICE_CONCEPT_SEEDS`) lo consume el agregador central del seed;
 * `ids` (→ `PRAC`) lo consumen los servicios (`PRAC.SITE_ACTIVE`, …).
 */
export const { seeds: PRACTICE_CONCEPT_SEEDS, ids: PRAC } =
  defineModuleConcepts('practice', {
    // --- practices -------------------------------------------------------------
    PRACTICE_TYPE_CLINIC: {
      code: 'PR_TYPE_CLINIC',
      display: 'Clinic practice type',
    },
    PRACTICE_ACTIVE: { code: 'PR_ACTIVE', display: 'Practice active' },

    // --- practice_sites --------------------------------------------------------
    SITE_TYPE_HOSPITAL: {
      code: 'SITE_TYPE_HOSPITAL',
      display: 'Hospital site type',
    },
    SITE_PHYSICAL_BUILDING: {
      code: 'SITE_PHYS_BUILDING',
      display: 'Building physical type',
    },
    SITE_ACTIVE: { code: 'SITE_ACTIVE', display: 'Site active' },
    SITE_RETIRED: { code: 'SITE_RETIRED', display: 'Site retired' },
    SITE_OP_PLANNED: {
      code: 'SITE_OP_PLANNED',
      display: 'Site operational planned',
    },
    SITE_OP_CLOSED: {
      code: 'SITE_OP_CLOSED',
      display: 'Site operational closed',
    },

    // --- clinical_units --------------------------------------------------------
    UNIT_TYPE_DEPARTMENT: {
      code: 'UNIT_TYPE_DEPT',
      display: 'Department unit type',
    },
    UNIT_ACTIVE: { code: 'UNIT_ACTIVE', display: 'Clinical unit active' },
    UNIT_RETIRED: { code: 'UNIT_RETIRED', display: 'Clinical unit retired' },

    // --- care_spaces -----------------------------------------------------------
    SPACE_TYPE_ROOM: {
      code: 'SPACE_TYPE_ROOM',
      display: 'Room care space type',
    },
    SPACE_ACTIVE: { code: 'SPACE_ACTIVE', display: 'Care space active' },
    SPACE_RETIRED: { code: 'SPACE_RETIRED', display: 'Care space retired' },
    SPACE_OP_AVAILABLE: {
      code: 'SPACE_OP_AVAILABLE',
      display: 'Care space available',
    },
    SPACE_OP_CLOSED: { code: 'SPACE_OP_CLOSED', display: 'Care space closed' },

    // --- healthcare_services ---------------------------------------------------
    SERVICE_GENERAL: {
      code: 'SVC_GENERAL',
      display: 'General healthcare service',
    },
    SERVICE_ACTIVE: {
      code: 'SVC_ACTIVE',
      display: 'Healthcare service active',
    },
    SERVICE_SUSPENDED: {
      code: 'SVC_SUSPENDED',
      display: 'Healthcare service suspended',
    },

    // --- practice_settings -----------------------------------------------------
    SETTING_CATEGORY_GENERAL: {
      code: 'SET_CAT_GENERAL',
      display: 'General setting category',
    },

    // --- practitioner_role_assignments -----------------------------------------
    ROLE_ATTENDING: {
      code: 'ROLE_ATTENDING',
      display: 'Attending practitioner role',
    },
    ROLE_ASSIGNMENT_ACTIVE: {
      code: 'ROLE_ASG_ACTIVE',
      display: 'Role assignment active',
    },
    ROLE_ASSIGNMENT_ENDED: {
      code: 'ROLE_ASG_ENDED',
      display: 'Role assignment ended',
    },

    // --- practitioner_support_assignments --------------------------------------
    SUPPORT_ROLE_SECRETARY: {
      code: 'SUP_ROLE_SECRETARY',
      display: 'Secretary support role',
    },
    SUPPORT_SCOPE_SITE: {
      code: 'SUP_SCOPE_SITE',
      display: 'Site support scope',
    },
    SUPPORT_ACTIVE: {
      code: 'SUP_ACTIVE',
      display: 'Support assignment active',
    },

    // --- practice_accreditations -----------------------------------------------
    ACCRED_TYPE_ISO: {
      code: 'ACCRED_TYPE_ISO',
      display: 'ISO accreditation type',
    },
    ACCRED_PENDING: {
      code: 'ACCRED_PENDING',
      display: 'Accreditation pending verification',
    },
    ACCRED_VERIFIED: {
      code: 'ACCRED_VERIFIED',
      display: 'Accreditation verified',
    },
    ACCRED_EXPIRED: {
      code: 'ACCRED_EXPIRED',
      display: 'Accreditation expired',
    },

    // --- inventory_items -------------------------------------------------------
    PRODUCT_GENERIC: {
      code: 'PROD_GENERIC',
      display: 'Generic inventory product',
    },
    UNIT_EACH: { code: 'UNIT_EACH', display: 'Unit of measure: each' },
    INVENTORY_ACTIVE: { code: 'INV_ACTIVE', display: 'Inventory item active' },

    // --- inventory_movements ---------------------------------------------------
    MOVEMENT_IN: { code: 'MOV_IN', display: 'Inventory movement in' },
    MOVEMENT_OUT: { code: 'MOV_OUT', display: 'Inventory movement out' },
    MOVEMENT_ADJUST: {
      code: 'MOV_ADJUST',
      display: 'Inventory movement adjust',
    },
  });
