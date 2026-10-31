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

    // --- Personal de apoyo (claves fijadas por el modelo; ver CONCEPTOS.md) ---
    SUPPORT_TARGET_PRACTITIONER: {
      code: 'SUPPORT_TARGET_PRACTITIONER',
      display: 'Support grant target: practitioner',
    },
    SUPPORT_TARGET_SERVICE: {
      code: 'SUPPORT_TARGET_SERVICE',
      display: 'Support grant target: service',
    },
    SUPPORT_TARGET_LOCATION: {
      code: 'SUPPORT_TARGET_LOCATION',
      display: 'Support grant target: location',
    },
    SUPPORT_TARGET_PRACTITIONER_SERVICE: {
      code: 'SUPPORT_TARGET_PRACTITIONER_SERVICE',
      display: 'Support grant target: practitioner service',
    },
    SUPPORT_TARGET_PRACTITIONER_LOCATION: {
      code: 'SUPPORT_TARGET_PRACTITIONER_LOCATION',
      display: 'Support grant target: practitioner location',
    },
    SUPPORT_TARGET_SERVICE_LOCATION: {
      code: 'SUPPORT_TARGET_SERVICE_LOCATION',
      display: 'Support grant target: service location',
    },
    SUPPORT_TARGET_ALL_PRACTITIONERS: {
      code: 'SUPPORT_TARGET_ALL_PRACTITIONERS',
      display: 'Support grant target: all practitioners',
    },
    SUPPORT_TARGET_ALL_SERVICES: {
      code: 'SUPPORT_TARGET_ALL_SERVICES',
      display: 'Support grant target: all services',
    },
    SUPPORT_TARGET_ALL_LOCATIONS: {
      code: 'SUPPORT_TARGET_ALL_LOCATIONS',
      display: 'Support grant target: all locations',
    },
    SUPPORT_TARGET_ALL: {
      code: 'SUPPORT_TARGET_ALL',
      display: 'Support grant target: all',
    },
    SUPPORT_EXPANSION_DYNAMIC: {
      code: 'SUPPORT_EXPANSION_DYNAMIC',
      display: 'Support grant expansion: dynamic (follows the organization)',
    },
    SUPPORT_EXPANSION_FIXED: {
      code: 'SUPPORT_EXPANSION_FIXED',
      display: 'Support grant expansion: fixed snapshot',
    },
    SUPPORT_GRANT_ACTIVE: {
      code: 'SUPPORT_GRANT_ACTIVE',
      display: 'Support grant active',
    },
    SUPPORT_GRANT_SUSPENDED: {
      code: 'SUPPORT_GRANT_SUSPENDED',
      display: 'Support grant suspended',
    },
    SUPPORT_GRANT_REVOKED: {
      code: 'SUPPORT_GRANT_REVOKED',
      display: 'Support grant revoked',
    },
    SUPPORT_GRANT_EXPIRED: {
      code: 'SUPPORT_GRANT_EXPIRED',
      display: 'Support grant expired',
    },
    ENGAGEMENT_DIRECTION_REQUEST: {
      code: 'ENGAGEMENT_DIRECTION_REQUEST',
      display: 'Engagement direction: person asks the organization',
    },
    ENGAGEMENT_DIRECTION_INVITATION: {
      code: 'ENGAGEMENT_DIRECTION_INVITATION',
      display: 'Engagement direction: organization invites the person',
    },
    ENGAGEMENT_STATUS_PENDING: {
      code: 'ENGAGEMENT_STATUS_PENDING',
      display: 'Engagement request pending',
    },
    ENGAGEMENT_STATUS_APPROVED: {
      code: 'ENGAGEMENT_STATUS_APPROVED',
      display: 'Engagement request approved',
    },
    ENGAGEMENT_STATUS_REJECTED: {
      code: 'ENGAGEMENT_STATUS_REJECTED',
      display: 'Engagement request rejected',
    },
    ENGAGEMENT_STATUS_EXPIRED: {
      code: 'ENGAGEMENT_STATUS_EXPIRED',
      display: 'Engagement request expired',
    },
    ENGAGEMENT_STATUS_CANCELLED: {
      code: 'ENGAGEMENT_STATUS_CANCELLED',
      display: 'Engagement request cancelled',
    },
    ENGAGEMENT_DECISION_PENDING: {
      code: 'ENGAGEMENT_DECISION_PENDING',
      display: 'Engagement item decision pending',
    },
    ENGAGEMENT_DECISION_APPROVED: {
      code: 'ENGAGEMENT_DECISION_APPROVED',
      display: 'Engagement item approved',
    },
    ENGAGEMENT_DECISION_ADJUSTED: {
      code: 'ENGAGEMENT_DECISION_ADJUSTED',
      display: 'Engagement item approved with adjustments',
    },
    ENGAGEMENT_DECISION_REJECTED: {
      code: 'ENGAGEMENT_DECISION_REJECTED',
      display: 'Engagement item rejected',
    },
    ENGAGEMENT_ORIGIN_REQUEST: {
      code: 'ENGAGEMENT_ORIGIN_REQUEST',
      display: 'Engagement origin: request',
    },
    ENGAGEMENT_ORIGIN_INVITATION: {
      code: 'ENGAGEMENT_ORIGIN_INVITATION',
      display: 'Engagement origin: invitation',
    },
    ENGAGEMENT_ORIGIN_QR: {
      code: 'ENGAGEMENT_ORIGIN_QR',
      display: 'Engagement origin: QR code',
    },
    OWNER_KIND_ORGANIZATION: {
      code: 'OWNER_KIND_ORGANIZATION',
      display: 'Support owner: organization',
    },
    OWNER_KIND_PRIVATE_PRACTICE: {
      code: 'OWNER_KIND_PRIVATE_PRACTICE',
      display: 'Support owner: private practice',
    },
    REPLY_DISCLOSURE_SHOW: {
      code: 'REPLY_DISCLOSURE_SHOW',
      display: 'Show that the care team replied',
    },
    REPLY_DISCLOSURE_HIDE: {
      code: 'REPLY_DISCLOSURE_HIDE',
      display: 'Hide that the care team replied',
    },
    ROLE_TEMPLATE_ACTIVE: {
      code: 'ROLE_TEMPLATE_ACTIVE',
      display: 'Role template active',
    },
    ROLE_TEMPLATE_RETIRED: {
      code: 'ROLE_TEMPLATE_RETIRED',
      display: 'Role template retired',
    },
    ASSIGN_ROLE_FRONT_DESK: {
      code: 'ASSIGN_ROLE_FRONT_DESK',
      display: 'Front desk assignment',
    },
    ASSIGN_ROLE_CALL_CENTER: {
      code: 'ASSIGN_ROLE_CALL_CENTER',
      display: 'Call center assignment',
    },
    ASSIGN_ROLE_ORG_MANAGEMENT: {
      code: 'ASSIGN_ROLE_ORG_MANAGEMENT',
      display: 'Organization management assignment',
    },
    DELEGATE_TYPE_FRONT_DESK: {
      code: 'DELEGATE_TYPE_FRONT_DESK',
      display: 'Front desk delegate type',
    },
    DELEGATE_TYPE_CALL_CENTER: {
      code: 'DELEGATE_TYPE_CALL_CENTER',
      display: 'Call center delegate type',
    },
    DELEGATE_TYPE_ORG_MANAGEMENT: {
      code: 'DELEGATE_TYPE_ORG_MANAGEMENT',
      display: 'Organization management delegate type',
    },

    // --- Motivos propios del vínculo de apoyo (solo API) ---
    REASON_ENGAGEMENT_ENDED: {
      code: 'DA_RSN_ENGAGEMENT_ENDED',
      display: 'Engagement ended',
    },

    // =========================================================================
    // Gobierno de accesos (v4.2.72, CONTRATO-GOBIERNO Anexo B): 84 conceptos.
    // Los CHECK del parche usan estos ids como literales: no renombrar claves.
    // =========================================================================
    // --- Reglas de gobierno de la organización (governance_rules.rule_kind_concept_id) ---
    GOV_RULE_DENY_PERMISSION: {
      code: 'GOV_RULE_DENY_PERMISSION',
      display: 'Governance rule: deny a permission to a role',
    },
    GOV_RULE_CEILING: {
      code: 'GOV_RULE_CEILING',
      display: 'Governance rule: delegation ceiling',
    },
    GOV_RULE_REQUIRE_CONDITION: {
      code: 'GOV_RULE_REQUIRE_CONDITION',
      display: 'Governance rule: mandatory condition',
    },
    GOV_RULE_FIELD_FLOOR: {
      code: 'GOV_RULE_FIELD_FLOOR',
      display: 'Governance rule: field visibility floor',
    },
    // --- Acción de una regla de segregación de funciones (sod_rules.action_concept_id) ---
    SOD_ACTION_BLOCK: {
      code: 'SOD_ACTION_BLOCK',
      display: 'SoD action: block',
    },
    SOD_ACTION_REQUIRE_APPROVAL: {
      code: 'SOD_ACTION_REQUIRE_APPROVAL',
      display: 'SoD action: require approval',
    },
    SOD_ACTION_WARN: { code: 'SOD_ACTION_WARN', display: 'SoD action: warn' },
    // --- Alcance de una regla de segregación de funciones (sod_rules.scope_concept_id) ---
    SOD_SCOPE_PERSON: {
      code: 'SOD_SCOPE_PERSON',
      display: 'SoD scope: same person',
    },
    SOD_SCOPE_PERSON_OVERLAP: {
      code: 'SOD_SCOPE_PERSON_OVERLAP',
      display: 'SoD scope: same person, overlapping coverage',
    },
    SOD_SCOPE_TRANSACTION: {
      code: 'SOD_SCOPE_TRANSACTION',
      display: 'SoD scope: same transaction',
    },
    // --- Tipo de solicitud de cuatro ojos (four_eyes_requests.kind_concept_id) ---
    FOUR_EYES_KIND_ACTION: {
      code: 'FOUR_EYES_KIND_ACTION',
      display: 'Four-eyes kind: sensitive action',
    },
    FOUR_EYES_KIND_GRANT_CHANGE: {
      code: 'FOUR_EYES_KIND_GRANT_CHANGE',
      display: 'Four-eyes kind: grant change above the ceiling',
    },
    FOUR_EYES_KIND_SOD_EXCEPTION: {
      code: 'FOUR_EYES_KIND_SOD_EXCEPTION',
      display: 'Four-eyes kind: SoD exception',
    },
    FOUR_EYES_KIND_REACTIVATION: {
      code: 'FOUR_EYES_KIND_REACTIVATION',
      display: 'Four-eyes kind: reactivation',
    },
    FOUR_EYES_KIND_ENGAGEMENT_MOVE: {
      code: 'FOUR_EYES_KIND_ENGAGEMENT_MOVE',
      display: 'Four-eyes kind: engagement move with more privilege',
    },
    // --- Estado de la solicitud de cuatro ojos (four_eyes_requests.status_concept_id) ---
    FOUR_EYES_PENDING: {
      code: 'FOUR_EYES_PENDING',
      display: 'Four-eyes request pending',
    },
    FOUR_EYES_APPROVED: {
      code: 'FOUR_EYES_APPROVED',
      display: 'Four-eyes request approved',
    },
    FOUR_EYES_REJECTED: {
      code: 'FOUR_EYES_REJECTED',
      display: 'Four-eyes request rejected',
    },
    FOUR_EYES_EXPIRED: {
      code: 'FOUR_EYES_EXPIRED',
      display: 'Four-eyes request expired',
    },
    FOUR_EYES_CANCELLED: {
      code: 'FOUR_EYES_CANCELLED',
      display: 'Four-eyes request cancelled',
    },
    FOUR_EYES_EXECUTED: {
      code: 'FOUR_EYES_EXECUTED',
      display: 'Four-eyes request executed',
    },
    // --- Tipo de campaña de certificación (access_review_campaigns.kind_concept_id) ---
    REVIEW_KIND_PERIODIC: {
      code: 'REVIEW_KIND_PERIODIC',
      display: 'Access review kind: periodic',
    },
    REVIEW_KIND_RECERTIFICATION: {
      code: 'REVIEW_KIND_RECERTIFICATION',
      display: 'Access review kind: recertification',
    },
    REVIEW_KIND_MOVER: {
      code: 'REVIEW_KIND_MOVER',
      display: 'Access review kind: after a role/scope change',
    },
    REVIEW_KIND_TARGETED: {
      code: 'REVIEW_KIND_TARGETED',
      display: 'Access review kind: targeted',
    },
    REVIEW_KIND_REMEDIATION: {
      code: 'REVIEW_KIND_REMEDIATION',
      display: 'Access review kind: remediation (above ceiling / SoD)',
    },
    // --- Estado de la campaña de certificación (access_review_campaigns.status_concept_id) ---
    REVIEW_CAMPAIGN_DRAFT: {
      code: 'REVIEW_CAMPAIGN_DRAFT',
      display: 'Access review campaign draft',
    },
    REVIEW_CAMPAIGN_OPEN: {
      code: 'REVIEW_CAMPAIGN_OPEN',
      display: 'Access review campaign open',
    },
    REVIEW_CAMPAIGN_CLOSED: {
      code: 'REVIEW_CAMPAIGN_CLOSED',
      display: 'Access review campaign closed',
    },
    REVIEW_CAMPAIGN_CANCELLED: {
      code: 'REVIEW_CAMPAIGN_CANCELLED',
      display: 'Access review campaign cancelled',
    },
    // --- Decisión de un ítem de certificación (access_review_items.decision_concept_id) ---
    REVIEW_ITEM_PENDING: {
      code: 'REVIEW_ITEM_PENDING',
      display: 'Access review item pending',
    },
    REVIEW_ITEM_CERTIFIED: {
      code: 'REVIEW_ITEM_CERTIFIED',
      display: 'Access review item certified',
    },
    REVIEW_ITEM_REVOKED: {
      code: 'REVIEW_ITEM_REVOKED',
      display: 'Access review item revoked',
    },
    REVIEW_ITEM_ADJUSTED: {
      code: 'REVIEW_ITEM_ADJUSTED',
      display: 'Access review item adjusted',
    },
    REVIEW_ITEM_AUTO_REVOKED: {
      code: 'REVIEW_ITEM_AUTO_REVOKED',
      display: 'Access review item auto-revoked (not certified)',
    },
    REVIEW_ITEM_SKIPPED: {
      code: 'REVIEW_ITEM_SKIPPED',
      display: 'Access review item skipped',
    },
    // --- Tipo de revisor (access_review_items.reviewer_kind_concept_id) ---
    REVIEWER_KIND_DOCTOR_OWNER: {
      code: 'REVIEWER_KIND_DOCTOR_OWNER',
      display: 'Reviewer: the practitioner',
    },
    REVIEWER_KIND_SERVICE_HEAD: {
      code: 'REVIEWER_KIND_SERVICE_HEAD',
      display: 'Reviewer: head of service',
    },
    REVIEWER_KIND_SUPERVISOR: {
      code: 'REVIEWER_KIND_SUPERVISOR',
      display: 'Reviewer: supervisor of the account',
    },
    REVIEWER_KIND_ADMIN: {
      code: 'REVIEWER_KIND_ADMIN',
      display: 'Reviewer: organization administrator',
    },
    // --- Qué pasa con lo no certificado (access_review_campaigns.uncertified_action_concept_id) ---
    UNCERTIFIED_REVOKE: {
      code: 'UNCERTIFIED_REVOKE',
      display: 'Not certified: revoke',
    },
    UNCERTIFIED_ESCALATE: {
      code: 'UNCERTIFIED_ESCALATE',
      display: 'Not certified: escalate only',
    },
    // --- Tipo de caso de ciclo de vida (lifecycle_cases.kind_concept_id) ---
    LIFECYCLE_JOINER: {
      code: 'LIFECYCLE_JOINER',
      display: 'Lifecycle case: joiner',
    },
    LIFECYCLE_MOVER: {
      code: 'LIFECYCLE_MOVER',
      display: 'Lifecycle case: mover',
    },
    LIFECYCLE_LEAVER: {
      code: 'LIFECYCLE_LEAVER',
      display: 'Lifecycle case: leaver',
    },
    LIFECYCLE_SUSPENSION: {
      code: 'LIFECYCLE_SUSPENSION',
      display: 'Lifecycle case: suspension',
    },
    LIFECYCLE_REACTIVATION: {
      code: 'LIFECYCLE_REACTIVATION',
      display: 'Lifecycle case: reactivation',
    },
    // --- Estado del caso de ciclo de vida (lifecycle_cases.status_concept_id) ---
    LIFECYCLE_OPEN: { code: 'LIFECYCLE_OPEN', display: 'Lifecycle case open' },
    LIFECYCLE_COMPLETED: {
      code: 'LIFECYCLE_COMPLETED',
      display: 'Lifecycle case completed',
    },
    LIFECYCLE_CANCELLED: {
      code: 'LIFECYCLE_CANCELLED',
      display: 'Lifecycle case cancelled',
    },
    // --- Tipo de ítem de traspaso (handover_items.item_kind_concept_id) ---
    HANDOVER_CONVERSATION: {
      code: 'HANDOVER_CONVERSATION',
      display: 'Handover item: conversation',
    },
    HANDOVER_WORKFLOW_TASK: {
      code: 'HANDOVER_WORKFLOW_TASK',
      display: 'Handover item: workflow task',
    },
    HANDOVER_SUPERVISED_ENGAGEMENT: {
      code: 'HANDOVER_SUPERVISED_ENGAGEMENT',
      display: 'Handover item: supervised account',
    },
    HANDOVER_PENDING_BOOKING: {
      code: 'HANDOVER_PENDING_BOOKING',
      display: 'Handover item: pending booking (informative)',
    },
    // --- Estado del ítem de traspaso (handover_items.status_concept_id) ---
    HANDOVER_PENDING: { code: 'HANDOVER_PENDING', display: 'Handover pending' },
    HANDOVER_REASSIGNED: {
      code: 'HANDOVER_REASSIGNED',
      display: 'Handover reassigned',
    },
    HANDOVER_RETURNED_TO_POOL: {
      code: 'HANDOVER_RETURNED_TO_POOL',
      display: 'Handover returned to the reception pool',
    },
    HANDOVER_CLOSED: {
      code: 'HANDOVER_CLOSED',
      display: 'Handover closed without action',
    },
    // --- Motivo de suspensión (organization_user_assignments.suspension_reason_concept_id) ---
    SUSPENSION_MANUAL: {
      code: 'SUSPENSION_MANUAL',
      display: 'Suspension reason: manual',
    },
    SUSPENSION_LEAVE: {
      code: 'SUSPENSION_LEAVE',
      display: 'Suspension reason: leave of absence',
    },
    SUSPENSION_INVESTIGATION: {
      code: 'SUSPENSION_INVESTIGATION',
      display: 'Suspension reason: under investigation',
    },
    SUSPENSION_INACTIVITY: {
      code: 'SUSPENSION_INACTIVITY',
      display: 'Suspension reason: inactivity',
    },
    SUSPENSION_RECERTIFICATION_LAPSED: {
      code: 'SUSPENSION_RECERTIFICATION_LAPSED',
      display: 'Suspension reason: recertification lapsed',
    },
    // --- Método de verificación de identidad (organization_user_assignments.identity_method_concept_id) ---
    IDENTITY_METHOD_IN_PERSON: {
      code: 'IDENTITY_METHOD_IN_PERSON',
      display: 'Identity verified in person with a document',
    },
    IDENTITY_METHOD_DOCUMENT_UPLOAD: {
      code: 'IDENTITY_METHOD_DOCUMENT_UPLOAD',
      display: 'Identity verified from an uploaded document',
    },
    IDENTITY_METHOD_PLATFORM: {
      code: 'IDENTITY_METHOD_PLATFORM',
      display: 'Identity already verified by the platform',
    },
    // --- Bandera de restricción de paciente (patient_restriction_flags.flag_concept_id) ---
    PATIENT_FLAG_VIP: {
      code: 'PATIENT_FLAG_VIP',
      display: 'Patient restriction: VIP',
    },
    PATIENT_FLAG_CONFIDENTIAL: {
      code: 'PATIENT_FLAG_CONFIDENTIAL',
      display: 'Patient restriction: confidential',
    },
    PATIENT_FLAG_STAFF_RELATIVE: {
      code: 'PATIENT_FLAG_STAFF_RELATIVE',
      display: 'Patient restriction: relative of staff',
    },
    PATIENT_FLAG_PROTECTED: {
      code: 'PATIENT_FLAG_PROTECTED',
      display: 'Patient restriction: protected (safety)',
    },
    // --- Efecto de una decisión de acceso (access_decision_log.effect_concept_id) ---
    DECISION_EFFECT_PERMIT: {
      code: 'DECISION_EFFECT_PERMIT',
      display: 'Access decision: permit',
    },
    DECISION_EFFECT_DENY: {
      code: 'DECISION_EFFECT_DENY',
      display: 'Access decision: deny',
    },
    DECISION_EFFECT_CHALLENGE: {
      code: 'DECISION_EFFECT_CHALLENGE',
      display: 'Access decision: challenge (reason, step-up or approval)',
    },
    // --- Tipo de anomalía (access_anomalies.kind_concept_id) ---
    ANOMALY_SEARCH_SPIKE: {
      code: 'ANOMALY_SEARCH_SPIKE',
      display: 'Anomaly: spike of patient searches',
    },
    ANOMALY_CANCEL_SPIKE: {
      code: 'ANOMALY_CANCEL_SPIKE',
      display: 'Anomaly: spike of cancellations',
    },
    ANOMALY_OFF_HOURS: {
      code: 'ANOMALY_OFF_HOURS',
      display: 'Anomaly: sensitive activity off hours',
    },
    ANOMALY_DENIED_BURST: {
      code: 'ANOMALY_DENIED_BURST',
      display: 'Anomaly: burst of denied attempts',
    },
    ANOMALY_BROWSE_PATIENTS: {
      code: 'ANOMALY_BROWSE_PATIENTS',
      display: 'Anomaly: many distinct patients viewed',
    },
    ANOMALY_INACTIVE_ACCOUNT: {
      code: 'ANOMALY_INACTIVE_ACCOUNT',
      display: 'Anomaly: inactive account with live access',
    },
    ANOMALY_PRIVILEGE_CREEP: {
      code: 'ANOMALY_PRIVILEGE_CREEP',
      display: 'Anomaly: privilege accumulation',
    },
    // --- Estado de la anomalía (access_anomalies.status_concept_id) ---
    ANOMALY_OPEN: { code: 'ANOMALY_OPEN', display: 'Anomaly open' },
    ANOMALY_ACKNOWLEDGED: {
      code: 'ANOMALY_ACKNOWLEDGED',
      display: 'Anomaly acknowledged',
    },
    ANOMALY_DISMISSED: {
      code: 'ANOMALY_DISMISSED',
      display: 'Anomaly dismissed',
    },
    ANOMALY_ESCALATED: {
      code: 'ANOMALY_ESCALATED',
      display: 'Anomaly escalated',
    },
  });
