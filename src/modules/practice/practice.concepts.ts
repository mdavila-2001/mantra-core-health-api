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
    // F1: ciclo de vida completo de la unidad (contrato §2).
    UNIT_PLANNED: {
      code: 'UNIT_PLANNED',
      display: 'Unidad clínica planificada',
    },
    UNIT_SUSPENDED: {
      code: 'UNIT_SUSPENDED',
      display: 'Unidad clínica suspendida',
    },

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
    // F1 infraestructura hospitalaria: ciclo de vida completo (contrato §2).
    // `SPACE_ACTIVE`/`SPACE_RETIRED` de arriba siguen siendo los mismos.
    SPACE_PLANNED: { code: 'SPACE_PLANNED', display: 'Espacio planificado' },
    SPACE_SUSPENDED: { code: 'SPACE_SUSPENDED', display: 'Espacio suspendido' },

    // --- care_spaces.form_concept_id: forma FHIR Location.form (F1) ---------
    // El código FHIR va en el display; el catálogo lo expone además como
    // `fhirCode` (domain/structure/structure-catalog.ts).
    LOC_FORM_SITE: {
      code: 'LOC_FORM_SITE',
      display: 'Establecimiento (FHIR si)',
    },
    LOC_FORM_BUILDING: {
      code: 'LOC_FORM_BUILDING',
      display: 'Edificio (FHIR bu)',
    },
    LOC_FORM_WING: {
      code: 'LOC_FORM_WING',
      display: 'Pabellón o ala (FHIR wi)',
    },
    LOC_FORM_LEVEL: { code: 'LOC_FORM_LEVEL', display: 'Piso (FHIR lvl)' },
    LOC_FORM_WARD: {
      code: 'LOC_FORM_WARD',
      display: 'Sala de internación (FHIR wa)',
    },
    LOC_FORM_AREA: { code: 'LOC_FORM_AREA', display: 'Área (FHIR area)' },
    LOC_FORM_CORRIDOR: {
      code: 'LOC_FORM_CORRIDOR',
      display: 'Pasillo (FHIR co)',
    },
    LOC_FORM_ROOM: {
      code: 'LOC_FORM_ROOM',
      display: 'Local o habitación (FHIR ro)',
    },
    LOC_FORM_BED: { code: 'LOC_FORM_BED', display: 'Cama o puesto (FHIR bd)' },
    LOC_FORM_VIRTUAL: {
      code: 'LOC_FORM_VIRTUAL',
      display: 'Virtual (FHIR vi)',
    },

    // --- care_spaces.space_type_concept_id: FUNCIÓN del espacio (F1) --------
    // `SPACE_TYPE_ROOM` (arriba) queda como la función GENERIC: su código no se
    // renombra porque ya está sembrado y referenciado.
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
      display: 'Recuperación (URPA)',
    },
    SPACE_FN_ICU_BAY: {
      code: 'SPACE_FN_ICU_BAY',
      display: 'Box de terapia intensiva',
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
      display: 'Aislamiento de infección aérea (AIIR)',
    },
    SPACE_FN_PROTECTIVE_ENV: {
      code: 'SPACE_FN_PROTECTIVE_ENV',
      display: 'Ambiente protegido (PE)',
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
      display: 'Área de laboratorio',
    },
    SPACE_FN_PHARMACY: { code: 'SPACE_FN_PHARMACY', display: 'Farmacia' },
    SPACE_FN_STORAGE: { code: 'SPACE_FN_STORAGE', display: 'Depósito' },
    SPACE_FN_STERILIZATION: {
      code: 'SPACE_FN_STERILIZATION',
      display: 'Esterilización (central de esterilización)',
    },
    SPACE_FN_WAITING: { code: 'SPACE_FN_WAITING', display: 'Sala de espera' },
    SPACE_FN_NURSE_STATION: {
      code: 'SPACE_FN_NURSE_STATION',
      display: 'Estación de enfermería',
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
      display: 'Edificio (genérico)',
    },
    SPACE_FN_WING_GENERIC: {
      code: 'SPACE_FN_WING_GENERIC',
      display: 'Pabellón (genérico)',
    },
    SPACE_FN_LEVEL_GENERIC: {
      code: 'SPACE_FN_LEVEL_GENERIC',
      display: 'Piso (genérico)',
    },
    SPACE_FN_WARD_GENERIC: {
      code: 'SPACE_FN_WARD_GENERIC',
      display: 'Sala de internación (genérica)',
    },
    SPACE_FN_AREA_GENERIC: {
      code: 'SPACE_FN_AREA_GENERIC',
      display: 'Área (genérica)',
    },

    // ===== F1 infraestructura hospitalaria: regulatorio y atributos =========
    // --- Establecimiento regulado de Bolivia: subsector (Ley 475, DS 1984)
    SUBSECTOR_PUBLIC: {
      code: 'SUBSECTOR_PUBLIC',
      display: 'Subsector público',
    },
    SUBSECTOR_SOCIAL_SECURITY: {
      code: 'SUBSECTOR_SOCIAL_SECURITY',
      display: 'Subsector de la seguridad social de corto plazo',
    },
    SUBSECTOR_PRIVATE: {
      code: 'SUBSECTOR_PRIVATE',
      display: 'Subsector privado',
    },
    SUBSECTOR_PRIVATE_AGREEMENT: {
      code: 'SUBSECTOR_PRIVATE_AGREEMENT',
      display: 'Subsector privado con convenio',
    },
    SUBSECTOR_NGO_CHURCH: {
      code: 'SUBSECTOR_NGO_CHURCH',
      display: 'Subsector de ONG e iglesia',
    },
    // --- Nivel de atención
    CARE_LEVEL_1: { code: 'CARE_LEVEL_1', display: 'Primer nivel de atención' },
    CARE_LEVEL_2: {
      code: 'CARE_LEVEL_2',
      display: 'Segundo nivel de atención',
    },
    CARE_LEVEL_3: { code: 'CARE_LEVEL_3', display: 'Tercer nivel de atención' },
    CARE_LEVEL_4: { code: 'CARE_LEVEL_4', display: 'Cuarto nivel de atención' },
    // --- Tipología (normas de caracterización de 1.º, 2.º y 3.º nivel)
    TYPOLOGY_HEALTH_POST: {
      code: 'TYPOLOGY_HEALTH_POST',
      display: 'Puesto de Salud',
    },
    TYPOLOGY_HC_AMBULATORY: {
      code: 'TYPOLOGY_HC_AMBULATORY',
      display: 'Centro de Salud ambulatorio',
    },
    TYPOLOGY_HC_INPATIENT: {
      code: 'TYPOLOGY_HC_INPATIENT',
      display: 'Centro de Salud con internación',
    },
    TYPOLOGY_HC_INTEGRAL: {
      code: 'TYPOLOGY_HC_INTEGRAL',
      display: 'Centro de Salud integral',
    },
    TYPOLOGY_HOSPITAL_L2: {
      code: 'TYPOLOGY_HOSPITAL_L2',
      display: 'Hospital de segundo nivel',
    },
    TYPOLOGY_HOSPITAL_L3: {
      code: 'TYPOLOGY_HOSPITAL_L3',
      display: 'Hospital de tercer nivel',
    },
    TYPOLOGY_INSTITUTE_L4: {
      code: 'TYPOLOGY_INSTITUTE_L4',
      display: 'Instituto de cuarto nivel',
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
    // --- SEDES departamental
    SEDES_LPZ: { code: 'SEDES_LPZ', display: 'SEDES La Paz' },
    SEDES_CBB: { code: 'SEDES_CBB', display: 'SEDES Cochabamba' },
    SEDES_SCZ: { code: 'SEDES_SCZ', display: 'SEDES Santa Cruz' },
    SEDES_ORU: { code: 'SEDES_ORU', display: 'SEDES Oruro' },
    SEDES_PTS: { code: 'SEDES_PTS', display: 'SEDES Potosí' },
    SEDES_CHQ: { code: 'SEDES_CHQ', display: 'SEDES Chuquisaca' },
    SEDES_TJA: { code: 'SEDES_TJA', display: 'SEDES Tarija' },
    SEDES_BEN: { code: 'SEDES_BEN', display: 'SEDES Beni' },
    SEDES_PND: { code: 'SEDES_PND', display: 'SEDES Pando' },
    // --- Estado de una habilitación (fachada sobre organization_extensions.facility_licenses)
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
    // --- Tipo de capacidad declarada (site_declared_capacities)
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
      display: 'Salas de partos',
    },
    CAP_EMERGENCY_BAYS: {
      code: 'CAP_EMERGENCY_BAYS',
      display: 'Boxes de emergencia',
    },
    CAP_ICU_BEDS: {
      code: 'CAP_ICU_BEDS',
      display: 'Camas de terapia intensiva',
    },
    // --- Atributos técnicos del espacio: asepsia
    ASEPSIS_UNRESTRICTED: {
      code: 'ASEPSIS_UNRESTRICTED',
      display: 'Zona no restringida',
    },
    ASEPSIS_SEMI: { code: 'ASEPSIS_SEMI', display: 'Zona semirrestringida' },
    ASEPSIS_RESTRICTED: {
      code: 'ASEPSIS_RESTRICTED',
      display: 'Zona restringida',
    },
    // --- Presión relativa (ASHRAE 170)
    PRESSURE_NEUTRAL: { code: 'PRESSURE_NEUTRAL', display: 'Presión neutra' },
    PRESSURE_POSITIVE: {
      code: 'PRESSURE_POSITIVE',
      display: 'Presión positiva',
    },
    PRESSURE_NEGATIVE: {
      code: 'PRESSURE_NEGATIVE',
      display: 'Presión negativa',
    },
    // --- Restricción de sexo
    SEX_ANY: { code: 'SEX_ANY', display: 'Sin restricción de sexo' },
    SEX_FEMALE: { code: 'SEX_FEMALE', display: 'Sólo mujeres' },
    SEX_MALE: { code: 'SEX_MALE', display: 'Sólo varones' },
    // --- Grupo etario
    AGE_ANY: { code: 'AGE_ANY', display: 'Sin restricción de edad' },
    AGE_ADULT: { code: 'AGE_ADULT', display: 'Adultos' },
    AGE_PEDIATRIC: { code: 'AGE_PEDIATRIC', display: 'Pediatría' },
    AGE_NEONATAL: { code: 'AGE_NEONATAL', display: 'Neonatología' },
    // --- Categoría de cama (facturación del día-cama)
    BED_CAT_PRIVATE: { code: 'BED_CAT_PRIVATE', display: 'Cama privada' },
    BED_CAT_SHARED: { code: 'BED_CAT_SHARED', display: 'Cama compartida' },
    BED_CAT_ICU: { code: 'BED_CAT_ICU', display: 'Cama de terapia intensiva' },
    BED_CAT_INTERMEDIATE: {
      code: 'BED_CAT_INTERMEDIATE',
      display: 'Cama de terapia intermedia',
    },
    BED_CAT_NEONATAL: { code: 'BED_CAT_NEONATAL', display: 'Cama neonatal' },
    // --- Rol del vínculo espacio ↔ unidad (space_unit_assignments)
    SPACE_UNIT_ROLE_OWNER: {
      code: 'SPACE_UNIT_ROLE_OWNER',
      display: 'Unidad propietaria',
    },
    SPACE_UNIT_ROLE_SHARED: {
      code: 'SPACE_UNIT_ROLE_SHARED',
      display: 'Unidad que comparte el espacio',
    },
    SPACE_UNIT_ROLE_LOAN: {
      code: 'SPACE_UNIT_ROLE_LOAN',
      display: 'Unidad con el espacio en préstamo',
    },
    // --- Reglas de tipología (facility_typology_rules.rule_concept_id). semántica de lista blanca, ver domain/structure/structure-catalog.ts
    TYPO_ALLOWED: {
      code: 'TYPO_ALLOWED',
      display: 'Función permitida por la tipología',
    },
    TYPO_REQUIRED: {
      code: 'TYPO_REQUIRED',
      display: 'Función obligatoria para la tipología',
    },

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
    // Vínculo secretaria–doctor por solicitud y aceptación: nace PENDING y
    // sólo la otra parte lo lleva a ACTIVE o REJECTED.
    SUPPORT_PENDING: {
      code: 'SUP_PENDING',
      display: 'Support assignment pending acceptance',
    },
    SUPPORT_REJECTED: {
      code: 'SUP_REJECTED',
      display: 'Support assignment rejected',
    },
    SUPPORT_ENDED: {
      code: 'SUP_ENDED',
      display: 'Support assignment ended',
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
