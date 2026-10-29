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
    // Carril 18 — tipos de organización de la spec (líneas 1623-1633): hospitales,
    // clínicas (ya existía), consultorios, centros médicos, laboratorios, centros
    // de diagnóstico, universidades, fundaciones, aseguradoras. `typeConceptId` es
    // un FK abierto al catálogo, así que sumar valores no toca el esquema.
    PRACTICE_TYPE_HOSPITAL: {
      code: 'PR_TYPE_HOSPITAL',
      display: 'Hospital practice type',
    },
    PRACTICE_TYPE_OFFICE: {
      code: 'PR_TYPE_OFFICE',
      display: 'Medical office (consultorio) practice type',
    },
    PRACTICE_TYPE_MEDICAL_CENTER: {
      code: 'PR_TYPE_MED_CENTER',
      display: 'Medical center practice type',
    },
    PRACTICE_TYPE_LABORATORY: {
      code: 'PR_TYPE_LAB',
      display: 'Laboratory practice type',
    },
    PRACTICE_TYPE_DIAGNOSTIC_CENTER: {
      code: 'PR_TYPE_DIAG_CENTER',
      display: 'Diagnostic center practice type',
    },
    PRACTICE_TYPE_UNIVERSITY: {
      code: 'PR_TYPE_UNIVERSITY',
      display: 'University practice type',
    },
    PRACTICE_TYPE_FOUNDATION: {
      code: 'PR_TYPE_FOUNDATION',
      display: 'Foundation practice type',
    },
    PRACTICE_TYPE_INSURER: {
      code: 'PR_TYPE_INSURER',
      display: 'Insurer practice type',
    },
    // P50: la práctica propia de una farmacia, de la que cuelgan su casa central
    // y sus sucursales como sedes físicas (`pharmacy_sites.practice_site_id`).
    PRACTICE_TYPE_PHARMACY: {
      code: 'PR_TYPE_PHARMACY',
      display: 'Pharmacy practice type',
    },
    PRACTICE_ACTIVE: { code: 'PR_ACTIVE', display: 'Practice active' },

    // --- practice_sites --------------------------------------------------------
    SITE_TYPE_HOSPITAL: {
      code: 'SITE_TYPE_HOSPITAL',
      display: 'Hospital site type',
    },
    // ALV-005/006: hasta acá el único tipo de sitio sembrado era HOSPITAL y
    // `createSite` lo usaba de default para cualquier sede. Un consultorio
    // propio no es un hospital; el consultorio de un profesional que "atiende
    // en su propio consultorio" necesita su propio concepto, mismo patrón que
    // `PRACTICE_TYPE_OFFICE` arriba.
    SITE_TYPE_OFFICE: {
      code: 'SITE_TYPE_OFFICE',
      display: 'Medical office (consultorio) site type',
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
    // Carril 18 — ciclo de vida completo de la vinculación profesional-organización
    // (spec línea 1655: "una organización apruebe, rechace, suspenda o finalice la
    // vinculación"). Antes solo existían ACTIVE/ENDED porque el alta era siempre
    // inmediata y administrada por SECURITY_ADMIN; el auto-servicio del profesional
    // necesita un estado intermedio y sus salidas.
    ROLE_ASSIGNMENT_PENDING: {
      code: 'ROLE_ASG_PENDING',
      display: 'Role assignment pending organization approval',
    },
    ROLE_ASSIGNMENT_REJECTED: {
      code: 'ROLE_ASG_REJECTED',
      display: 'Role assignment rejected by organization',
    },
    ROLE_ASSIGNMENT_SUSPENDED: {
      code: 'ROLE_ASG_SUSPENDED',
      display: 'Role assignment suspended by organization',
    },
    // Centros médicos — la organización invita al profesional y la fila queda
    // `INVITED` hasta que él la acepte o la decline. Solo el profesional la saca
    // de ese estado: ninguna vinculación llega a `ACTIVE` sin la otra parte.
    ROLE_ASSIGNMENT_INVITED: {
      code: 'ROLE_ASG_INVITED',
      display: 'Role assignment invited by organization',
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

    // --- infraestructura hospitalaria F1: ciclo de vida (CONTRATO-F0-F1 §2) ----
    // `SPACE_ACTIVE`/`SPACE_RETIRED`/`UNIT_ACTIVE`/`UNIT_RETIRED` ya existían; se
    // suman los dos estados que faltaban para planificar y suspender sin borrar.

    // --- ciclo de vida ---------------------------------------------------------
    SPACE_PLANNED: { code: 'SPACE_PLANNED', display: 'Espacio planificado' },
    SPACE_SUSPENDED: { code: 'SPACE_SUSPENDED', display: 'Espacio suspendido' },
    UNIT_PLANNED: { code: 'UNIT_PLANNED', display: 'Unidad planificada' },
    UNIT_SUSPENDED: { code: 'UNIT_SUSPENDED', display: 'Unidad suspendida' },

    // Forma del lugar (FHIR `Location.form`, CodeSystem `location-physical-type`):
    // decide dónde puede colgar un espacio en el árbol físico.

    // --- forma (LOC_FORM_*) ----------------------------------------------------
    LOC_FORM_SITE: { code: 'LOC_FORM_SITE', display: 'Campus o predio' },
    LOC_FORM_BUILDING: { code: 'LOC_FORM_BUILDING', display: 'Edificio' },
    LOC_FORM_WING: { code: 'LOC_FORM_WING', display: 'Pabellón o ala' },
    LOC_FORM_LEVEL: { code: 'LOC_FORM_LEVEL', display: 'Piso' },
    LOC_FORM_WARD: { code: 'LOC_FORM_WARD', display: 'Sala de internación' },
    LOC_FORM_AREA: { code: 'LOC_FORM_AREA', display: 'Área o zona funcional' },
    LOC_FORM_CORRIDOR: { code: 'LOC_FORM_CORRIDOR', display: 'Pasillo' },
    LOC_FORM_ROOM: { code: 'LOC_FORM_ROOM', display: 'Local' },
    LOC_FORM_BED: { code: 'LOC_FORM_BED', display: 'Cama o puesto' },
    LOC_FORM_VIRTUAL: { code: 'LOC_FORM_VIRTUAL', display: 'Sala virtual' },

    // Función del lugar: para qué se usa y, por su perfil (`infrastructure-catalog.ts`),
    // cómo se comporta. `SPACE_TYPE_ROOM` (arriba) queda como la función genérica.

    // --- función (SPACE_FN_*) --------------------------------------------------
    SPACE_FN_CONSULTING_ROOM: {
      code: 'SPACE_FN_CONSULTING_ROOM',
      display: 'Consultorio',
    },
    SPACE_FN_INPATIENT_ROOM: {
      code: 'SPACE_FN_INPATIENT_ROOM',
      display: 'Habitación de internación',
    },
    SPACE_FN_OPERATING_ROOM: {
      code: 'SPACE_FN_OPERATING_ROOM',
      display: 'Quirófano',
    },
    SPACE_FN_PROCEDURE_ROOM: {
      code: 'SPACE_FN_PROCEDURE_ROOM',
      display: 'Sala de procedimientos',
    },
    SPACE_FN_DELIVERY_ROOM: {
      code: 'SPACE_FN_DELIVERY_ROOM',
      display: 'Sala de partos',
    },
    SPACE_FN_RECOVERY_PACU: {
      code: 'SPACE_FN_RECOVERY_PACU',
      display: 'Recuperación postanestésica',
    },
    SPACE_FN_ICU_BAY: {
      code: 'SPACE_FN_ICU_BAY',
      display: 'Puesto de terapia intensiva',
    },
    SPACE_FN_EMERGENCY_BOX: {
      code: 'SPACE_FN_EMERGENCY_BOX',
      display: 'Box de emergencias',
    },
    SPACE_FN_OBSERVATION: {
      code: 'SPACE_FN_OBSERVATION',
      display: 'Observación',
    },
    SPACE_FN_ISOLATION_AIIR: {
      code: 'SPACE_FN_ISOLATION_AIIR',
      display: 'Aislamiento aéreo (AIIR)',
    },
    SPACE_FN_PROTECTIVE_ENV: {
      code: 'SPACE_FN_PROTECTIVE_ENV',
      display: 'Ambiente protector',
    },
    SPACE_FN_IMAGING_ROOM: {
      code: 'SPACE_FN_IMAGING_ROOM',
      display: 'Sala de imagen',
    },
    SPACE_FN_SAMPLE_COLLECTION: {
      code: 'SPACE_FN_SAMPLE_COLLECTION',
      display: 'Toma de muestras',
    },
    SPACE_FN_LAB_AREA: {
      code: 'SPACE_FN_LAB_AREA',
      display: 'Área analítica de laboratorio',
    },
    SPACE_FN_PHARMACY: { code: 'SPACE_FN_PHARMACY', display: 'Farmacia' },
    SPACE_FN_STORAGE: { code: 'SPACE_FN_STORAGE', display: 'Depósito' },
    SPACE_FN_STERILIZATION: {
      code: 'SPACE_FN_STERILIZATION',
      display: 'Esterilización',
    },
    SPACE_FN_WAITING: { code: 'SPACE_FN_WAITING', display: 'Sala de espera' },
    SPACE_FN_NURSE_STATION: {
      code: 'SPACE_FN_NURSE_STATION',
      display: 'Puesto de enfermería',
    },
    SPACE_FN_OFFICE_ADMIN: {
      code: 'SPACE_FN_OFFICE_ADMIN',
      display: 'Oficina administrativa',
    },
    SPACE_FN_BED_STANDARD: {
      code: 'SPACE_FN_BED_STANDARD',
      display: 'Cama estándar',
    },
    SPACE_FN_BED_ICU: {
      code: 'SPACE_FN_BED_ICU',
      display: 'Cama de terapia intensiva',
    },
    SPACE_FN_CRIB: { code: 'SPACE_FN_CRIB', display: 'Cuna' },
    SPACE_FN_STRETCHER: { code: 'SPACE_FN_STRETCHER', display: 'Camilla' },
    SPACE_FN_BUILDING_GENERIC: {
      code: 'SPACE_FN_BUILDING_GENERIC',
      display: 'Edificio',
    },
    SPACE_FN_WING_GENERIC: {
      code: 'SPACE_FN_WING_GENERIC',
      display: 'Pabellón o ala',
    },
    SPACE_FN_LEVEL_GENERIC: { code: 'SPACE_FN_LEVEL_GENERIC', display: 'Piso' },
    SPACE_FN_WARD_GENERIC: {
      code: 'SPACE_FN_WARD_GENERIC',
      display: 'Sala de internación',
    },
    SPACE_FN_AREA_GENERIC: { code: 'SPACE_FN_AREA_GENERIC', display: 'Área' },

    // Regulatorio de Bolivia (`practice_sites`). El texto oficial de las normas de
    // caracterización no se pudo leer (dominio bloqueado en la investigación): los
    // displays dicen el nombre de la categoría, no citan artículos.

    // --- subsector -------------------------------------------------------------
    SUBSECTOR_PUBLIC: { code: 'SUBSECTOR_PUBLIC', display: 'Público' },
    SUBSECTOR_SOCIAL_SECURITY: {
      code: 'SUBSECTOR_SOCIAL_SECURITY',
      display: 'Seguridad social de corto plazo',
    },
    SUBSECTOR_PRIVATE: { code: 'SUBSECTOR_PRIVATE', display: 'Privado' },
    SUBSECTOR_PRIVATE_AGREEMENT: {
      code: 'SUBSECTOR_PRIVATE_AGREEMENT',
      display: 'Privado en convenio',
    },
    SUBSECTOR_NGO_CHURCH: {
      code: 'SUBSECTOR_NGO_CHURCH',
      display: 'ONG o iglesia',
    },

    // --- nivel de atención -----------------------------------------------------
    CARE_LEVEL_1: { code: 'CARE_LEVEL_1', display: 'Primer nivel' },
    CARE_LEVEL_2: { code: 'CARE_LEVEL_2', display: 'Segundo nivel' },
    CARE_LEVEL_3: { code: 'CARE_LEVEL_3', display: 'Tercer nivel' },
    CARE_LEVEL_4: { code: 'CARE_LEVEL_4', display: 'Cuarto nivel' },

    // --- tipología del establecimiento -----------------------------------------
    TYPOLOGY_HEALTH_POST: {
      code: 'TYPOLOGY_HEALTH_POST',
      display: 'Puesto de Salud (norma de caracterización de 1.er nivel)',
    },
    TYPOLOGY_HC_AMBULATORY: {
      code: 'TYPOLOGY_HC_AMBULATORY',
      display:
        'Centro de Salud ambulatorio (norma de caracterización de 1.er nivel)',
    },
    TYPOLOGY_HC_INPATIENT: {
      code: 'TYPOLOGY_HC_INPATIENT',
      display:
        'Centro de Salud con internación (norma de caracterización de 1.er nivel)',
    },
    TYPOLOGY_HC_INTEGRAL: {
      code: 'TYPOLOGY_HC_INTEGRAL',
      display:
        'Centro de Salud integral (norma de caracterización de 1.er nivel)',
    },
    TYPOLOGY_HOSPITAL_L2: {
      code: 'TYPOLOGY_HOSPITAL_L2',
      display:
        'Hospital de segundo nivel (norma de caracterización de 2.º nivel)',
    },
    TYPOLOGY_HOSPITAL_L3: {
      code: 'TYPOLOGY_HOSPITAL_L3',
      display:
        'Hospital de tercer nivel (norma de caracterización de 3.er nivel)',
    },
    TYPOLOGY_INSTITUTE_L4: {
      code: 'TYPOLOGY_INSTITUTE_L4',
      display: 'Instituto de cuarto nivel (Ley 738)',
    },
    TYPOLOGY_PRIVATE_CLINIC: {
      code: 'TYPOLOGY_PRIVATE_CLINIC',
      display: 'Clínica privada',
    },
    TYPOLOGY_MEDICAL_OFFICE: {
      code: 'TYPOLOGY_MEDICAL_OFFICE',
      display: 'Consultorio médico',
    },
    TYPOLOGY_DIAGNOSTIC_CENTER: {
      code: 'TYPOLOGY_DIAGNOSTIC_CENTER',
      display: 'Centro de diagnóstico',
    },
    TYPOLOGY_LABORATORY: {
      code: 'TYPOLOGY_LABORATORY',
      display: 'Laboratorio',
    },

    // --- SEDES (departamento) --------------------------------------------------
    SEDES_LPZ: { code: 'SEDES_LPZ', display: 'SEDES La Paz' },
    SEDES_CBB: { code: 'SEDES_CBB', display: 'SEDES Cochabamba' },
    SEDES_SCZ: { code: 'SEDES_SCZ', display: 'SEDES Santa Cruz' },
    SEDES_ORU: { code: 'SEDES_ORU', display: 'SEDES Oruro' },
    SEDES_PTS: { code: 'SEDES_PTS', display: 'SEDES Potosí' },
    SEDES_CHQ: { code: 'SEDES_CHQ', display: 'SEDES Chuquisaca' },
    SEDES_TJA: { code: 'SEDES_TJA', display: 'SEDES Tarija' },
    SEDES_BEN: { code: 'SEDES_BEN', display: 'SEDES Beni' },
    SEDES_PND: { code: 'SEDES_PND', display: 'SEDES Pando' },

    // --- estado de la habilitación ---------------------------------------------
    LIC_IN_PROCESS: {
      code: 'LIC_IN_PROCESS',
      display: 'Habilitación en trámite',
    },
    LIC_VALID: { code: 'LIC_VALID', display: 'Habilitación vigente' },
    LIC_EXPIRED: { code: 'LIC_EXPIRED', display: 'Habilitación vencida' },
    LIC_SUSPENDED: {
      code: 'LIC_SUSPENDED',
      display: 'Habilitación suspendida',
    },
    LIC_REVOKED: { code: 'LIC_REVOKED', display: 'Habilitación revocada' },

    // --- capacidad declarada ---------------------------------------------------
    CAP_BEDS_CENSABLE: {
      code: 'CAP_BEDS_CENSABLE',
      display: 'Camas censables',
    },
    CAP_BEDS_NON_CENSABLE: {
      code: 'CAP_BEDS_NON_CENSABLE',
      display: 'Camas no censables',
    },
    CAP_CONSULTING_ROOMS: {
      code: 'CAP_CONSULTING_ROOMS',
      display: 'Consultorios',
    },
    CAP_OPERATING_ROOMS: { code: 'CAP_OPERATING_ROOMS', display: 'Quirófanos' },
    CAP_DELIVERY_ROOMS: {
      code: 'CAP_DELIVERY_ROOMS',
      display: 'Salas de parto',
    },
    CAP_EMERGENCY_BAYS: {
      code: 'CAP_EMERGENCY_BAYS',
      display: 'Boxes de emergencia',
    },
    CAP_ICU_BEDS: {
      code: 'CAP_ICU_BEDS',
      display: 'Camas de terapia intensiva',
    },

    // Reglas de tipología: `TYPO_ALLOWED` / `TYPO_REQUIRED` (`facility_typology_rules`).

    // --- regla de tipología ----------------------------------------------------
    TYPO_ALLOWED: { code: 'TYPO_ALLOWED', display: 'Función permitida' },
    TYPO_REQUIRED: { code: 'TYPO_REQUIRED', display: 'Función obligatoria' },

    // Atributos técnicos del local y vínculo espacio ↔ unidad.

    // --- asepsia ---------------------------------------------------------------
    ASEPSIS_UNRESTRICTED: {
      code: 'ASEPSIS_UNRESTRICTED',
      display: 'Asepsia no restringida',
    },
    ASEPSIS_SEMI: { code: 'ASEPSIS_SEMI', display: 'Asepsia semirrestringida' },
    ASEPSIS_RESTRICTED: {
      code: 'ASEPSIS_RESTRICTED',
      display: 'Asepsia restringida',
    },

    // --- presión ---------------------------------------------------------------
    PRESSURE_NEUTRAL: { code: 'PRESSURE_NEUTRAL', display: 'Presión neutra' },
    PRESSURE_POSITIVE: {
      code: 'PRESSURE_POSITIVE',
      display: 'Presión positiva',
    },
    PRESSURE_NEGATIVE: {
      code: 'PRESSURE_NEGATIVE',
      display: 'Presión negativa',
    },

    // --- restricción de sexo ---------------------------------------------------
    SEX_ANY: { code: 'SEX_ANY', display: 'Sin restricción de sexo' },
    SEX_FEMALE: { code: 'SEX_FEMALE', display: 'Solo mujeres' },
    SEX_MALE: { code: 'SEX_MALE', display: 'Solo varones' },

    // --- grupo etario ----------------------------------------------------------
    AGE_ANY: { code: 'AGE_ANY', display: 'Todas las edades' },
    AGE_ADULT: { code: 'AGE_ADULT', display: 'Adultos' },
    AGE_PEDIATRIC: { code: 'AGE_PEDIATRIC', display: 'Pediátrico' },
    AGE_NEONATAL: { code: 'AGE_NEONATAL', display: 'Neonatal' },

    // --- categoría de cama -----------------------------------------------------
    BED_CAT_PRIVATE: { code: 'BED_CAT_PRIVATE', display: 'Cama privada' },
    BED_CAT_SHARED: { code: 'BED_CAT_SHARED', display: 'Cama compartida' },
    BED_CAT_ICU: { code: 'BED_CAT_ICU', display: 'Cama de terapia intensiva' },
    BED_CAT_INTERMEDIATE: {
      code: 'BED_CAT_INTERMEDIATE',
      display: 'Cama de cuidados intermedios',
    },
    BED_CAT_NEONATAL: { code: 'BED_CAT_NEONATAL', display: 'Cama neonatal' },

    // --- rol del vínculo espacio-unidad ----------------------------------------
    SPACE_UNIT_ROLE_OWNER: {
      code: 'SPACE_UNIT_ROLE_OWNER',
      display: 'Unidad dueña',
    },
    SPACE_UNIT_ROLE_SHARED: {
      code: 'SPACE_UNIT_ROLE_SHARED',
      display: 'Uso compartido',
    },
    SPACE_UNIT_ROLE_LOAN: { code: 'SPACE_UNIT_ROLE_LOAN', display: 'Préstamo' },

    // --- infraestructura hospitalaria F2–F5: claves que el SQL del modelo escribe como
    // literal UUID (uuid5 sobre «módulo:CLAVE»). No renombrar: ver
    // `infrastructure-concept-keys.spec.ts`, que las compara contra el SQL vendoreado. ---
    HYG_CLEAN: { code: 'HYG_CLEAN', display: 'Higiene: limpio' },
    ISO_NONE: { code: 'ISO_NONE', display: 'Sin aislamiento' },
    BLOCK_MAINTENANCE: {
      code: 'BLOCK_MAINTENANCE',
      display: 'Bloqueo por mantenimiento',
    },
    CLN_PENDING: { code: 'CLN_PENDING', display: 'Limpieza pendiente' },
    CLN_IN_PROGRESS: { code: 'CLN_IN_PROGRESS', display: 'Limpieza en curso' },
    CLN_DONE: { code: 'CLN_DONE', display: 'Limpieza hecha' },
  });
