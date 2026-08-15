import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Pharma Lab (carril 17). El prefijo `pharma_lab` aísla las
 * claves para que el UUID determinista no colisione con conceptos homónimos de
 * otros módulos (`pharmacy`, `insurance`, `scheduling`… todos tienen un
 * `ACTIVE`).
 *
 * Solo se declaran los estados/tipos que los servicios usan para poblar alguna
 * columna `*_concept_id NOT NULL`. Los estados genéricos que ya existen en el
 * catálogo transversal (`CONCEPTS.STATE_ACTIVE`, `STATE_REVOKED`…) NO se
 * redeclaran: el visitador desactivado reutiliza `STATE_REVOKED` de `common`
 * para que la revocación de sesiones comparta vocabulario con `iam`.
 *
 * El agregador central (`src/common/seed/module-concepts.ts`) reúne el array
 * exportado `PHARMA_LAB_CONCEPT_SEEDS`; los servicios consumen el mapa `PHL`.
 */
export const { seeds: PHARMA_LAB_CONCEPT_SEEDS, ids: PHL } =
  defineModuleConcepts('pharma_lab', {
    /* -- Tipos de organización (spec 5228-5234) --------------------------- */
    LAB_TYPE_PHARMACEUTICAL: {
      code: 'LAB_TYPE_PHARMACEUTICAL',
      display: 'Laboratorio farmacéutico',
    },
    LAB_TYPE_DRUG_DEVELOPER: {
      code: 'LAB_TYPE_DRUG_DEVELOPER',
      display: 'Desarrollador de medicamentos',
    },
    LAB_TYPE_DRUG_MANUFACTURER: {
      code: 'LAB_TYPE_DRUG_MANUFACTURER',
      display: 'Fabricante de medicamentos',
    },
    LAB_TYPE_BIOTECH: {
      code: 'LAB_TYPE_BIOTECH',
      display: 'Empresa biotecnológica',
    },
    LAB_TYPE_AUTHORIZED_DISTRIBUTOR: {
      code: 'LAB_TYPE_AUTHORIZED_DISTRIBUTOR',
      display: 'Distribuidor autorizado',
    },
    LAB_TYPE_RESEARCH_ORGANIZATION: {
      code: 'LAB_TYPE_RESEARCH_ORGANIZATION',
      display: 'Organización de investigación farmacéutica',
    },

    /* -- Estado del laboratorio ------------------------------------------- */
    LAB_ACTIVE: { code: 'PHL_LAB_ACTIVE', display: 'Laboratorio activo' },
    LAB_SUSPENDED: {
      code: 'PHL_LAB_SUSPENDED',
      display: 'Laboratorio suspendido',
    },
    LAB_CLOSED: { code: 'PHL_LAB_CLOSED', display: 'Laboratorio cerrado' },

    /* -- Tipos de personal (spec 5264-5277) ------------------------------- */
    STAFF_TYPE_ADMINISTRATIVE: {
      code: 'PHL_STAFF_ADMINISTRATIVE',
      display: 'Personal administrativo',
    },
    STAFF_TYPE_RESEARCHER: {
      code: 'PHL_STAFF_RESEARCHER',
      display: 'Investigador',
    },
    STAFF_TYPE_PHARMACIST: {
      code: 'PHL_STAFF_PHARMACIST',
      display: 'Farmacéutico',
    },
    STAFF_TYPE_CHEMIST: { code: 'PHL_STAFF_CHEMIST', display: 'Químico' },
    STAFF_TYPE_BIOCHEMIST: {
      code: 'PHL_STAFF_BIOCHEMIST',
      display: 'Bioquímico',
    },
    STAFF_TYPE_MEDICAL: {
      code: 'PHL_STAFF_MEDICAL',
      display: 'Personal médico',
    },
    STAFF_TYPE_COMMERCIAL: {
      code: 'PHL_STAFF_COMMERCIAL',
      display: 'Personal comercial',
    },
    STAFF_TYPE_MEDICAL_VISITOR: {
      code: 'PHL_STAFF_MEDICAL_VISITOR',
      display: 'Visitador médico',
    },
    STAFF_TYPE_LEGAL: { code: 'PHL_STAFF_LEGAL', display: 'Personal legal' },
    STAFF_TYPE_REGULATORY: {
      code: 'PHL_STAFF_REGULATORY',
      display: 'Personal regulatorio',
    },
    STAFF_TYPE_PHARMACOVIGILANCE: {
      code: 'PHL_STAFF_PHARMACOVIGILANCE',
      display: 'Personal de farmacovigilancia',
    },
    STAFF_TYPE_ACCOUNTING: {
      code: 'PHL_STAFF_ACCOUNTING',
      display: 'Personal contable',
    },
    STAFF_TYPE_OTHER: {
      code: 'PHL_STAFF_OTHER',
      display: 'Otro colaborador',
    },

    /* -- Estado de vinculación de personal/visitador ---------------------- */
    LINK_ACTIVE: { code: 'PHL_LINK_ACTIVE', display: 'Vinculación activa' },
    LINK_TERMINATED: {
      code: 'PHL_LINK_TERMINATED',
      display: 'Vinculación terminada',
    },
    LINK_SUSPENDED: {
      code: 'PHL_LINK_SUSPENDED',
      display: 'Vinculación suspendida',
    },

    /* -- Eventos de vinculación (bitácora de personal/visitadores) -------- */
    LINK_EVENT_LINKED: { code: 'PHL_LINK_EVENT_LINKED', display: 'Vinculado' },
    LINK_EVENT_UNLINKED: {
      code: 'PHL_LINK_EVENT_UNLINKED',
      display: 'Desvinculado',
    },
    LINK_EVENT_REACTIVATED: {
      code: 'PHL_LINK_EVENT_REACTIVATED',
      display: 'Revinculado',
    },
    LINK_EVENT_PERMISSIONS_CHANGED: {
      code: 'PHL_LINK_EVENT_PERMISSIONS_CHANGED',
      display: 'Permisos modificados',
    },

    /* -- Verificación de credenciales ------------------------------------- */
    VERIFICATION_PENDING: {
      code: 'PHL_VERIFICATION_PENDING',
      display: 'Verificación pendiente',
    },
    VERIFICATION_VERIFIED: {
      code: 'PHL_VERIFICATION_VERIFIED',
      display: 'Verificado',
    },
    VERIFICATION_REJECTED: {
      code: 'PHL_VERIFICATION_REJECTED',
      display: 'Verificación rechazada',
    },

    /* -- Estados de visita (spec 5382-5394, lista cerrada) ---------------- */
    VISIT_REQUESTED: { code: 'PHL_VISIT_REQUESTED', display: 'Solicitada' },
    VISIT_PENDING_CONFIRMATION: {
      code: 'PHL_VISIT_PENDING_CONFIRMATION',
      display: 'Pendiente de confirmación',
    },
    VISIT_CONFIRMED: { code: 'PHL_VISIT_CONFIRMED', display: 'Confirmada' },
    VISIT_REJECTED: { code: 'PHL_VISIT_REJECTED', display: 'Rechazada' },
    VISIT_RESCHEDULED: {
      code: 'PHL_VISIT_RESCHEDULED',
      display: 'Reprogramada',
    },
    VISIT_CANCELLED_BY_VISITOR: {
      code: 'PHL_VISIT_CANCELLED_BY_VISITOR',
      display: 'Cancelada por el visitador',
    },
    VISIT_CANCELLED_BY_DOCTOR: {
      code: 'PHL_VISIT_CANCELLED_BY_DOCTOR',
      display: 'Cancelada por el doctor',
    },
    VISIT_IN_PROGRESS: { code: 'PHL_VISIT_IN_PROGRESS', display: 'En curso' },
    VISIT_COMPLETED: { code: 'PHL_VISIT_COMPLETED', display: 'Completada' },
    VISIT_VISITOR_NO_SHOW: {
      code: 'PHL_VISIT_VISITOR_NO_SHOW',
      display: 'No asistió el visitador',
    },
    VISIT_DOCTOR_NO_SHOW: {
      code: 'PHL_VISIT_DOCTOR_NO_SHOW',
      display: 'No asistió el doctor',
    },

    /* -- Acciones del doctor sobre la solicitud --------------------------- */
    VISIT_ACTION_ACCEPT: {
      code: 'PHL_VISIT_ACTION_ACCEPT',
      display: 'Aceptar visita',
    },
    VISIT_ACTION_REJECT: {
      code: 'PHL_VISIT_ACTION_REJECT',
      display: 'Rechazar visita',
    },
    VISIT_ACTION_PROPOSE_TIME: {
      code: 'PHL_VISIT_ACTION_PROPOSE_TIME',
      display: 'Proponer otro horario',
    },
    VISIT_ACTION_REQUEST_INFO: {
      code: 'PHL_VISIT_ACTION_REQUEST_INFO',
      display: 'Solicitar información adicional',
    },

    /* -- Modalidad de la visita ------------------------------------------- */
    MODALITY_IN_PERSON: {
      code: 'PHL_MODALITY_IN_PERSON',
      display: 'Presencial',
    },
    MODALITY_VIRTUAL: { code: 'PHL_MODALITY_VIRTUAL', display: 'Virtual' },

    /* -- Agenda de visitas del doctor ------------------------------------- */
    POLICY_ACTIVE: {
      code: 'PHL_POLICY_ACTIVE',
      display: 'Política de visitas activa',
    },
    POLICY_INACTIVE: {
      code: 'PHL_POLICY_INACTIVE',
      display: 'Política de visitas inactiva',
    },
    BLOCK_ACTIVE: { code: 'PHL_BLOCK_ACTIVE', display: 'Bloqueo vigente' },
    BLOCK_LIFTED: { code: 'PHL_BLOCK_LIFTED', display: 'Bloqueo levantado' },

    /* -- Catálogo de medicamentos (spec 5441-5448) ------------------------ */
    PRODUCT_RESEARCH: {
      code: 'PHL_PRODUCT_RESEARCH',
      display: 'En investigación',
    },
    PRODUCT_DEVELOPMENT: {
      code: 'PHL_PRODUCT_DEVELOPMENT',
      display: 'En desarrollo',
    },
    PRODUCT_EVALUATION: {
      code: 'PHL_PRODUCT_EVALUATION',
      display: 'En evaluación',
    },
    PRODUCT_APPROVED: { code: 'PHL_PRODUCT_APPROVED', display: 'Aprobado' },
    PRODUCT_MARKETED: {
      code: 'PHL_PRODUCT_MARKETED',
      display: 'Comercializado',
    },
    PRODUCT_SUSPENDED: { code: 'PHL_PRODUCT_SUSPENDED', display: 'Suspendido' },
    PRODUCT_WITHDRAWN: { code: 'PHL_PRODUCT_WITHDRAWN', display: 'Retirado' },

    /* -- Niveles de divulgación (spec 5451-5455) -------------------------- */
    DISCLOSURE_PUBLIC: { code: 'PHL_DISCLOSURE_PUBLIC', display: 'Pública' },
    DISCLOSURE_PROFESSIONAL: {
      code: 'PHL_DISCLOSURE_PROFESSIONAL',
      display: 'Profesional',
    },
    DISCLOSURE_INTERNAL: {
      code: 'PHL_DISCLOSURE_INTERNAL',
      display: 'Interna',
    },
    DISCLOSURE_CONFIDENTIAL: {
      code: 'PHL_DISCLOSURE_CONFIDENTIAL',
      display: 'Confidencial',
    },

    /* -- Material informativo --------------------------------------------- */
    MATERIAL_DRAFT: { code: 'PHL_MATERIAL_DRAFT', display: 'Borrador' },
    MATERIAL_IN_REVIEW: {
      code: 'PHL_MATERIAL_IN_REVIEW',
      display: 'En revisión interna',
    },
    MATERIAL_APPROVED: { code: 'PHL_MATERIAL_APPROVED', display: 'Aprobado' },
    MATERIAL_REJECTED: { code: 'PHL_MATERIAL_REJECTED', display: 'Rechazado' },
    MATERIAL_EXPIRED: { code: 'PHL_MATERIAL_EXPIRED', display: 'Vencido' },
    MATERIAL_ARCHIVED: { code: 'PHL_MATERIAL_ARCHIVED', display: 'Archivado' },
    MATERIAL_KIND_DATA_SHEET: {
      code: 'PHL_MATERIAL_KIND_DATA_SHEET',
      display: 'Ficha técnica',
    },
    MATERIAL_KIND_STUDY: {
      code: 'PHL_MATERIAL_KIND_STUDY',
      display: 'Estudio',
    },
    MATERIAL_KIND_SCIENTIFIC_DOC: {
      code: 'PHL_MATERIAL_KIND_SCIENTIFIC_DOC',
      display: 'Documento científico',
    },
    MATERIAL_KIND_PRESENTATION: {
      code: 'PHL_MATERIAL_KIND_PRESENTATION',
      display: 'Presentación',
    },
    MATERIAL_KIND_VIDEO: {
      code: 'PHL_MATERIAL_KIND_VIDEO',
      display: 'Video',
    },
    MATERIAL_KIND_REGULATORY: {
      code: 'PHL_MATERIAL_KIND_REGULATORY',
      display: 'Información regulatoria',
    },

    /* -- Registro de visita ------------------------------------------------ */
    ATTENDANCE_ATTENDED: {
      code: 'PHL_ATTENDANCE_ATTENDED',
      display: 'Asistió',
    },
    ATTENDANCE_MISSED: { code: 'PHL_ATTENDANCE_MISSED', display: 'No asistió' },
    RECORD_PENDING_DOCTOR_CONFIRMATION: {
      code: 'PHL_RECORD_PENDING_DOCTOR_CONFIRMATION',
      display: 'Pendiente de confirmación del doctor',
    },
    RECORD_CONFIRMED: {
      code: 'PHL_RECORD_CONFIRMED',
      display: 'Visita confirmada por el doctor',
    },
    RECORD_DISPUTED: {
      code: 'PHL_RECORD_DISPUTED',
      display: 'Visita desconocida por el doctor',
    },

    /* -- Calificación de la visita ---------------------------------------- */
    RATING_INTERNAL: {
      code: 'PHL_RATING_INTERNAL',
      display: 'Calificación interna',
    },
    RATING_PRIVATE_SURVEY: {
      code: 'PHL_RATING_PRIVATE_SURVEY',
      display: 'Encuesta privada',
    },
    RATING_FORMAL_COMPLAINT: {
      code: 'PHL_RATING_FORMAL_COMPLAINT',
      display: 'Reclamación formal',
    },

    /* -- Encuestas post-visita --------------------------------------------- */
    SURVEY_DRAFT: { code: 'PHL_SURVEY_DRAFT', display: 'Encuesta borrador' },
    SURVEY_ACTIVE: { code: 'PHL_SURVEY_ACTIVE', display: 'Encuesta vigente' },
    SURVEY_CLOSED: { code: 'PHL_SURVEY_CLOSED', display: 'Encuesta cerrada' },
    ANSWER_TYPE_SCALE: {
      code: 'PHL_ANSWER_TYPE_SCALE',
      display: 'Respuesta: escala',
    },
    ANSWER_TYPE_TEXT: {
      code: 'PHL_ANSWER_TYPE_TEXT',
      display: 'Respuesta: texto',
    },
    ANSWER_TYPE_BOOLEAN: {
      code: 'PHL_ANSWER_TYPE_BOOLEAN',
      display: 'Respuesta: sí/no',
    },
    ANSWER_TYPE_SINGLE_CHOICE: {
      code: 'PHL_ANSWER_TYPE_SINGLE_CHOICE',
      display: 'Respuesta: opción única',
    },
    RESPONSE_PENDING: {
      code: 'PHL_RESPONSE_PENDING',
      display: 'Respuesta pendiente',
    },
    RESPONSE_SUBMITTED: {
      code: 'PHL_RESPONSE_SUBMITTED',
      display: 'Respuesta enviada',
    },

    /* -- Publicaciones de visitador (aprobación previa) ------------------- */
    POST_SUBMISSION_PENDING: {
      code: 'PHL_POST_SUBMISSION_PENDING',
      display: 'Publicación pendiente de aprobación',
    },
    POST_SUBMISSION_APPROVED: {
      code: 'PHL_POST_SUBMISSION_APPROVED',
      display: 'Publicación aprobada',
    },
    POST_SUBMISSION_REJECTED: {
      code: 'PHL_POST_SUBMISSION_REJECTED',
      display: 'Publicación rechazada',
    },

    /* -- Farmacovigilancia (spec 5577-5583) ------------------------------- */
    PV_EVENT_ADVERSE_REACTION: {
      code: 'PHL_PV_ADVERSE_REACTION',
      display: 'Reacción adversa',
    },
    PV_EVENT_QUALITY_DEFECT: {
      code: 'PHL_PV_QUALITY_DEFECT',
      display: 'Problema de calidad',
    },
    PV_EVENT_MEDICATION_ERROR: {
      code: 'PHL_PV_MEDICATION_ERROR',
      display: 'Error de medicación',
    },
    PV_EVENT_LACK_OF_EFFICACY: {
      code: 'PHL_PV_LACK_OF_EFFICACY',
      display: 'Falta de eficacia',
    },
    PV_EVENT_MISUSE: { code: 'PHL_PV_MISUSE', display: 'Uso indebido' },
    PV_EVENT_OTHER: {
      code: 'PHL_PV_OTHER',
      display: 'Otro evento relacionado',
    },
    PV_SEVERITY_MILD: { code: 'PHL_PV_SEVERITY_MILD', display: 'Leve' },
    PV_SEVERITY_MODERATE: {
      code: 'PHL_PV_SEVERITY_MODERATE',
      display: 'Moderada',
    },
    PV_SEVERITY_SEVERE: { code: 'PHL_PV_SEVERITY_SEVERE', display: 'Grave' },
    PV_SEVERITY_FATAL: { code: 'PHL_PV_SEVERITY_FATAL', display: 'Mortal' },
    PV_RECEIVED: { code: 'PHL_PV_RECEIVED', display: 'Reporte recibido' },
    PV_UNDER_ASSESSMENT: {
      code: 'PHL_PV_UNDER_ASSESSMENT',
      display: 'En evaluación',
    },
    PV_FOLLOW_UP: { code: 'PHL_PV_FOLLOW_UP', display: 'En seguimiento' },
    PV_REPORTED_TO_AUTHORITY: {
      code: 'PHL_PV_REPORTED_TO_AUTHORITY',
      display: 'Notificado a la autoridad',
    },
    PV_CLOSED: { code: 'PHL_PV_CLOSED', display: 'Reporte cerrado' },
    PV_ACTION_ASSESSMENT: {
      code: 'PHL_PV_ACTION_ASSESSMENT',
      display: 'Evaluación registrada',
    },
    PV_ACTION_AUTHORITY_COMMUNICATION: {
      code: 'PHL_PV_ACTION_AUTHORITY_COMMUNICATION',
      display: 'Comunicación con autoridad',
    },
    PV_ACTION_FOLLOW_UP: {
      code: 'PHL_PV_ACTION_FOLLOW_UP',
      display: 'Seguimiento',
    },
    PV_REPORTER_DOCTOR: {
      code: 'PHL_PV_REPORTER_DOCTOR',
      display: 'Reportante: doctor',
    },
    PV_REPORTER_PHARMACY: {
      code: 'PHL_PV_REPORTER_PHARMACY',
      display: 'Reportante: farmacia',
    },
    PV_REPORTER_ORGANIZATION: {
      code: 'PHL_PV_REPORTER_ORGANIZATION',
      display: 'Reportante: organización',
    },

    /* -- Documentación legal y regulatoria (spec 5603-5614) --------------- */
    DOC_TYPE_LICENSE: { code: 'PHL_DOC_LICENSE', display: 'Licencia' },
    DOC_TYPE_SANITARY_REGISTRY: {
      code: 'PHL_DOC_SANITARY_REGISTRY',
      display: 'Registro sanitario',
    },
    DOC_TYPE_AUTHORIZATION: {
      code: 'PHL_DOC_AUTHORIZATION',
      display: 'Autorización',
    },
    DOC_TYPE_CERTIFICATE: {
      code: 'PHL_DOC_CERTIFICATE',
      display: 'Certificado',
    },
    DOC_TYPE_PATENT: { code: 'PHL_DOC_PATENT', display: 'Patente' },
    DOC_TYPE_CONTRACT: { code: 'PHL_DOC_CONTRACT', display: 'Contrato' },
    DOC_TYPE_STUDY: { code: 'PHL_DOC_STUDY', display: 'Estudio' },
    DOC_TYPE_PRODUCT_DOSSIER: {
      code: 'PHL_DOC_PRODUCT_DOSSIER',
      display: 'Documentación de producto',
    },
    DOC_TYPE_VISITOR_DOSSIER: {
      code: 'PHL_DOC_VISITOR_DOSSIER',
      display: 'Documentación de visitador',
    },
    DOC_TYPE_PROTOCOL: { code: 'PHL_DOC_PROTOCOL', display: 'Protocolo' },
    DOC_TYPE_REGULATORY_REPORT: {
      code: 'PHL_DOC_REGULATORY_REPORT',
      display: 'Informe regulatorio',
    },
    DOC_VALID: { code: 'PHL_DOC_VALID', display: 'Vigente' },
    DOC_EXPIRING: { code: 'PHL_DOC_EXPIRING', display: 'Próximo a vencer' },
    DOC_EXPIRED: { code: 'PHL_DOC_EXPIRED', display: 'Vencido' },
    DOC_SUPERSEDED: { code: 'PHL_DOC_SUPERSEDED', display: 'Sustituido' },
    DOC_INVALIDATED: { code: 'PHL_DOC_INVALIDATED', display: 'Invalidado' },

    /* -- Contabilidad: dimensiones de imputación (spec 5649-5655) --------- */
    ALLOCATION_DIM_PRODUCT: {
      code: 'PHL_ALLOCATION_PRODUCT',
      display: 'Imputación: producto',
    },
    ALLOCATION_DIM_PROJECT: {
      code: 'PHL_ALLOCATION_PROJECT',
      display: 'Imputación: proyecto',
    },
    ALLOCATION_DIM_BRANCH: {
      code: 'PHL_ALLOCATION_BRANCH',
      display: 'Imputación: sede',
    },
    ALLOCATION_DIM_AREA: {
      code: 'PHL_ALLOCATION_AREA',
      display: 'Imputación: área',
    },
    ALLOCATION_DIM_VISITOR: {
      code: 'PHL_ALLOCATION_VISITOR',
      display: 'Imputación: visitador',
    },
    ALLOCATION_DIM_CAMPAIGN: {
      code: 'PHL_ALLOCATION_CAMPAIGN',
      display: 'Imputación: campaña',
    },
    COST_TYPE_RESEARCH: {
      code: 'PHL_COST_RESEARCH',
      display: 'Costo de investigación',
    },
    COST_TYPE_DEVELOPMENT: {
      code: 'PHL_COST_DEVELOPMENT',
      display: 'Costo de desarrollo',
    },
    COST_TYPE_PRODUCTION: {
      code: 'PHL_COST_PRODUCTION',
      display: 'Costo de producción',
    },
    COST_TYPE_COMMERCIAL: {
      code: 'PHL_COST_COMMERCIAL',
      display: 'Costo comercial',
    },
  });
