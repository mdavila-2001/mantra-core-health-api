import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo 29 (Delegated Access). Se declaran aquí para no
 * tocar el catálogo transversal (`src/common/constants/concepts.ts`) ni el
 * agregador `module-concepts.ts` (lo cablea el orquestador). Cubren todas las
 * columnas `*_concept_id` NOT NULL que insertan los endpoints y que no tienen un
 * equivalente reutilizable en `CONCEPTS.*` (donde sí lo hay se usa el transversal:
 * `STATE_ACTIVE`, `STATE_REVOKED`, `STATE_EXPIRED`, `STATE_PENDING`).
 *
 * El array `DELEGATED_ACCESS_CONCEPT_SEEDS` alimenta el seed; el mapa `DELEG`
 * resuelve nombre lógico -> UUID determinista que consumen servicios y smoke.
 */
export const { seeds: DELEGATED_ACCESS_CONCEPT_SEEDS, ids: DELEG } =
  defineModuleConcepts('delegated_access', {
    // --- Estados de agregado no cubiertos por STATE_* transversales ---
    STATE_SUSPENDED: { code: 'DA_SUSPENDED', display: 'Suspended' },

    // --- Estado de la solicitud de aprobación (status_concept_id) ---
    REQUEST_OPEN: { code: 'DA_REQ_OPEN', display: 'Request open' },
    REQUEST_CLOSED: { code: 'DA_REQ_CLOSED', display: 'Request closed' },
    REQUEST_CANCELLED: {
      code: 'DA_REQ_CANCELLED',
      display: 'Request cancelled',
    },

    // --- Decisión de la solicitud (decision_concept_id) ---
    DECISION_APPROVED: { code: 'DA_APPROVED', display: 'Approved' },
    DECISION_DENIED: { code: 'DA_DENIED', display: 'Denied' },

    // --- Rol de la asignación de usuario de organización (assignment_role_concept_id) ---
    ASSIGN_ROLE_STAFF: { code: 'DA_ASSIGN_STAFF', display: 'Staff assignment' },
    ASSIGN_ROLE_SECRETARY: {
      code: 'DA_ASSIGN_SECRETARY',
      display: 'Secretary assignment',
    },
    ASSIGN_ROLE_ASSISTANT: {
      code: 'DA_ASSIGN_ASSISTANT',
      display: 'Assistant assignment',
    },
    ASSIGN_ROLE_NURSE: { code: 'DA_ASSIGN_NURSE', display: 'Nurse assignment' },
    ASSIGN_ROLE_BILLING: {
      code: 'DA_ASSIGN_BILLING',
      display: 'Billing assignment',
    },

    // --- Alcance de acceso (access_scope_concept_id) ---
    SCOPE_TENANT: { code: 'DA_SCOPE_TENANT', display: 'Tenant scope' },
    SCOPE_PRACTICE: { code: 'DA_SCOPE_PRACTICE', display: 'Practice scope' },
    SCOPE_SITE: { code: 'DA_SCOPE_SITE', display: 'Site scope' },
    SCOPE_UNIT: { code: 'DA_SCOPE_UNIT', display: 'Clinical unit scope' },

    // --- Tipo de delegado del set de permisos (delegate_type_concept_id) ---
    DELEGATE_TYPE_SECRETARY: {
      code: 'DA_DELEG_SECRETARY',
      display: 'Secretary delegate type',
    },
    DELEGATE_TYPE_ASSISTANT: {
      code: 'DA_DELEG_ASSISTANT',
      display: 'Assistant delegate type',
    },
    DELEGATE_TYPE_NURSE: {
      code: 'DA_DELEG_NURSE',
      display: 'Nurse delegate type',
    },
    DELEGATE_TYPE_BILLING: {
      code: 'DA_DELEG_BILLING',
      display: 'Billing delegate type',
    },

    // --- Rol del delegado de practitioner (delegate_role_concept_id) ---
    DELEGATE_ROLE_ASSISTANT: {
      code: 'DA_DROLE_ASSISTANT',
      display: 'Assistant delegate role',
    },
    DELEGATE_ROLE_SECRETARY: {
      code: 'DA_DROLE_SECRETARY',
      display: 'Secretary delegate role',
    },
    DELEGATE_ROLE_NURSE: {
      code: 'DA_DROLE_NURSE',
      display: 'Nurse delegate role',
    },

    // --- Alcance de paciente / cita (patient_scope / appointment_scope) ---
    PATIENT_SCOPE_ASSIGNED: {
      code: 'DA_PSCOPE_ASSIGNED',
      display: 'Assigned patients',
    },
    PATIENT_SCOPE_ALL: { code: 'DA_PSCOPE_ALL', display: 'All patients' },
    APPOINTMENT_SCOPE_TODAY: {
      code: 'DA_ASCOPE_TODAY',
      display: "Today's appointments",
    },
    APPOINTMENT_SCOPE_ALL: {
      code: 'DA_ASCOPE_ALL',
      display: 'All appointments',
    },

    // --- Tipo de grant (grant_type_concept_id) ---
    GRANT_TYPE_PREAUTHORIZED: {
      code: 'DA_GRANT_PREAUTH',
      display: 'Pre-authorized grant',
    },
    GRANT_TYPE_APPROVED: {
      code: 'DA_GRANT_APPROVED',
      display: 'Approved grant',
    },

    // --- Propósito de uso (purpose_of_use_concept_id) ---
    PURPOSE_TREATMENT: { code: 'DA_POU_TREATMENT', display: 'Treatment' },
    PURPOSE_BILLING: { code: 'DA_POU_BILLING', display: 'Billing' },
    PURPOSE_OPERATIONS: { code: 'DA_POU_OPERATIONS', display: 'Operations' },

    // --- Tipo de recurso del grant (resource_type_concept_id) ---
    RESOURCE_CLINICAL_NOTE: {
      code: 'DA_RES_CLINICAL_NOTE',
      display: 'Clinical note',
    },
    RESOURCE_APPOINTMENT: {
      code: 'DA_RES_APPOINTMENT',
      display: 'Appointment',
    },
    RESOURCE_PRESCRIPTION: {
      code: 'DA_RES_PRESCRIPTION',
      display: 'Prescription',
    },

    // --- Tipos de evento del ledger de delegación (event_type_concept_id) ---
    EVENT_DELEGATION_CREATED: {
      code: 'DA_EVT_DELEG_CREATED',
      display: 'Delegation created',
    },
    EVENT_ACCESS_REQUESTED: {
      code: 'DA_EVT_ACCESS_REQUESTED',
      display: 'Access requested',
    },
    EVENT_ACCESS_APPROVED: {
      code: 'DA_EVT_ACCESS_APPROVED',
      display: 'Access approved',
    },
    EVENT_ACCESS_DENIED: {
      code: 'DA_EVT_ACCESS_DENIED',
      display: 'Access denied',
    },
    EVENT_GRANT_ISSUED: {
      code: 'DA_EVT_GRANT_ISSUED',
      display: 'Grant issued',
    },
    EVENT_DELEGATION_REVOKED: {
      code: 'DA_EVT_DELEG_REVOKED',
      display: 'Delegation revoked',
    },
    EVENT_DELEGATION_EXPIRED: {
      code: 'DA_EVT_DELEG_EXPIRED',
      display: 'Delegation expired',
    },
    EVENT_ACCESS_EVALUATED: {
      code: 'DA_EVT_ACCESS_EVALUATED',
      display: 'Access evaluated',
    },
    EVENT_STEP_UP_REQUIRED: {
      code: 'DA_EVT_STEP_UP',
      display: 'Step-up required',
    },
    EVENT_ASSIGNMENT_UPDATED: {
      code: 'DA_EVT_ASSIGN_UPDATED',
      display: 'Assignment updated',
    },
    EVENT_ASSIGNMENT_SUSPENDED: {
      code: 'DA_EVT_ASSIGN_SUSPENDED',
      display: 'Assignment suspended',
    },

    // --- Motivos (reason_concept_id) ---
    REASON_REVOKED_MANUAL: {
      code: 'DA_RSN_REVOKED_MANUAL',
      display: 'Manual revocation',
    },
    REASON_SUSPENDED_ADMIN: {
      code: 'DA_RSN_SUSPENDED_ADMIN',
      display: 'Administrative suspension',
    },
    REASON_EXPIRED: { code: 'DA_RSN_EXPIRED', display: 'Expired by sweep' },
  });
