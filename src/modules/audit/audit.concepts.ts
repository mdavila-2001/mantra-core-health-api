import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo `audit` (10 — Audit, Provenance and Version
 * Histories). Se declaran aquí, con el prefijo `audit`, para no tocar archivos
 * compartidos (`src/common/constants/concepts.ts`): así varios módulos se pueden
 * implementar en paralelo sin colisionar en el UUID derivado.
 *
 * Cada clave cubre una columna `*_concept_id` NOT NULL (o usada) de los INSERT del
 * módulo: acciones auditadas, bases legales, propósitos de uso, decisiones,
 * estados de gobernanza/DSAR, tipos y acciones de moderación y operaciones de
 * versionado. El resultado (`outcome_concept_id`) reutiliza los conceptos
 * transversales `CONCEPTS.OUTCOME_SUCCESS/OUTCOME_FAILURE`. El orquestador de
 * seeds reúne `AUDIT_CONCEPT_SEEDS` junto con los del resto de módulos.
 */
export const { seeds: AUDIT_CONCEPT_SEEDS, ids: AUD } = defineModuleConcepts(
  'audit',
  {
    // --- Acciones auditadas (data_access_log, patient_content_access_log, *_access_log) ---
    ACTION_READ: { code: 'AUDIT_ACTION_READ', display: 'Read access' },
    ACTION_CREATE: { code: 'AUDIT_ACTION_CREATE', display: 'Create' },
    ACTION_UPDATE: { code: 'AUDIT_ACTION_UPDATE', display: 'Update' },
    ACTION_DELETE: { code: 'AUDIT_ACTION_DELETE', display: 'Delete' },
    ACTION_EXPORT: { code: 'AUDIT_ACTION_EXPORT', display: 'Export' },

    // --- Bases legales de acceso ---
    LEGAL_BASIS_TREATMENT: {
      code: 'AUDIT_LEGAL_BASIS_TREATMENT',
      display: 'Treatment legal basis',
    },
    LEGAL_BASIS_CONSENT: {
      code: 'AUDIT_LEGAL_BASIS_CONSENT',
      display: 'Consent legal basis',
    },
    LEGAL_BASIS_LEGAL_OBLIGATION: {
      code: 'AUDIT_LEGAL_BASIS_LEGAL_OBLIGATION',
      display: 'Legal obligation basis',
    },

    // --- Tipos de recurso accedido ---
    RESOURCE_TYPE_CLINICAL: {
      code: 'AUDIT_RESOURCE_CLINICAL',
      display: 'Clinical resource',
    },
    RESOURCE_TYPE_FINANCIAL: {
      code: 'AUDIT_RESOURCE_FINANCIAL',
      display: 'Financial resource',
    },
    RESOURCE_TYPE_ADMIN: {
      code: 'AUDIT_RESOURCE_ADMIN',
      display: 'Administrative resource',
    },

    // --- Propósito de uso (purpose_of_use) ---
    PURPOSE_TREATMENT: {
      code: 'AUDIT_PURPOSE_TREATMENT',
      display: 'Treatment',
    },
    PURPOSE_PAYMENT: { code: 'AUDIT_PURPOSE_PAYMENT', display: 'Payment' },
    PURPOSE_OPERATIONS: {
      code: 'AUDIT_PURPOSE_OPERATIONS',
      display: 'Healthcare operations',
    },
    PURPOSE_COVERAGE: {
      code: 'AUDIT_PURPOSE_COVERAGE',
      display: 'Coverage / insurance',
    },
    PURPOSE_VERIFICATION: {
      code: 'AUDIT_PURPOSE_VERIFICATION',
      display: 'Identity verification',
    },
    /**
     * El titular ejerciendo su propio derecho (subtarea 3.3: portabilidad de
     * póliza y siniestralidad). Distinto de `PURPOSE_COVERAGE` —que es cuando
     * OTRO actor consulta la cobertura por razones de negocio—: acá quien pide
     * el dato es la misma persona a la que pertenece.
     */
    PURPOSE_PATIENT_REQUEST: {
      code: 'AUDIT_PURPOSE_PATIENT_REQUEST',
      display: 'Patient requested',
    },

    // --- Decisión de control de acceso ---
    DECISION_PERMIT: { code: 'AUDIT_DECISION_PERMIT', display: 'Permit' },
    DECISION_DENY: { code: 'AUDIT_DECISION_DENY', display: 'Deny' },

    // --- Gobernanza analítica (analytics_governance_log) ---
    GOVERNANCE_EXPORT: {
      code: 'AUDIT_GOV_EXPORT',
      display: 'Governance export',
    },
    GOVERNANCE_DISCLOSURE: {
      code: 'AUDIT_GOV_DISCLOSURE',
      display: 'Governance disclosure',
    },
    GOVERNANCE_QUERY: { code: 'AUDIT_GOV_QUERY', display: 'Governance query' },
    APPROVAL_APPROVED: { code: 'AUDIT_APPROVAL_APPROVED', display: 'Approved' },
    APPROVAL_PENDING: {
      code: 'AUDIT_APPROVAL_PENDING',
      display: 'Pending approval',
    },
    APPROVAL_REJECTED: { code: 'AUDIT_APPROVAL_REJECTED', display: 'Rejected' },

    // --- DSAR: tipos y estados (dsar_requests) ---
    DSAR_TYPE_ACCESS: {
      code: 'AUDIT_DSAR_TYPE_ACCESS',
      display: 'Access request',
    },
    DSAR_TYPE_ERASURE: {
      code: 'AUDIT_DSAR_TYPE_ERASURE',
      display: 'Erasure request',
    },
    DSAR_TYPE_RECTIFICATION: {
      code: 'AUDIT_DSAR_TYPE_RECTIFICATION',
      display: 'Rectification request',
    },
    DSAR_TYPE_PORTABILITY: {
      code: 'AUDIT_DSAR_TYPE_PORTABILITY',
      display: 'Portability request',
    },
    DSAR_TYPE_OBJECTION: {
      code: 'AUDIT_DSAR_TYPE_OBJECTION',
      display: 'Objection request',
    },
    DSAR_RECEIVED: { code: 'AUDIT_DSAR_STATUS_RECEIVED', display: 'Received' },
    DSAR_IN_PROGRESS: {
      code: 'AUDIT_DSAR_STATUS_IN_PROGRESS',
      display: 'In progress',
    },
    DSAR_COMPLETED: {
      code: 'AUDIT_DSAR_STATUS_COMPLETED',
      display: 'Completed',
    },
    DSAR_REJECTED: { code: 'AUDIT_DSAR_STATUS_REJECTED', display: 'Rejected' },

    // --- Jurisdicciones ---
    JURISDICTION_PE: { code: 'AUDIT_JURISDICTION_PE', display: 'Peru' },
    JURISDICTION_EU: {
      code: 'AUDIT_JURISDICTION_EU',
      display: 'European Union',
    },
    JURISDICTION_US: {
      code: 'AUDIT_JURISDICTION_US',
      display: 'United States',
    },

    // --- Moderación (moderation_events): tipos de destino ---
    MOD_TARGET_CONTENT: {
      code: 'AUDIT_MOD_TARGET_CONTENT',
      display: 'Content target',
    },
    MOD_TARGET_USER: { code: 'AUDIT_MOD_TARGET_USER', display: 'User target' },
    MOD_TARGET_COMMENT: {
      code: 'AUDIT_MOD_TARGET_COMMENT',
      display: 'Comment target',
    },
    MOD_TARGET_REVIEW: {
      code: 'AUDIT_MOD_TARGET_REVIEW',
      display: 'Review target',
    },

    // --- Moderación: acciones ---
    MOD_ACTION_REMOVE: { code: 'AUDIT_MOD_ACTION_REMOVE', display: 'Remove' },
    MOD_ACTION_FLAG: { code: 'AUDIT_MOD_ACTION_FLAG', display: 'Flag' },
    MOD_ACTION_APPROVE: {
      code: 'AUDIT_MOD_ACTION_APPROVE',
      display: 'Approve',
    },
    MOD_ACTION_RESTRICT: {
      code: 'AUDIT_MOD_ACTION_RESTRICT',
      display: 'Restrict',
    },
    MOD_ACTION_DISMISS: {
      code: 'AUDIT_MOD_ACTION_DISMISS',
      display: 'Dismiss',
    },

    // --- Moderación: razones ---
    MOD_REASON_POLICY: {
      code: 'AUDIT_MOD_REASON_POLICY',
      display: 'Policy violation',
    },
    MOD_REASON_ABUSE: { code: 'AUDIT_MOD_REASON_ABUSE', display: 'Abuse' },
    MOD_REASON_SPAM: { code: 'AUDIT_MOD_REASON_SPAM', display: 'Spam' },
    MOD_REASON_LEGAL: {
      code: 'AUDIT_MOD_REASON_LEGAL',
      display: 'Legal request',
    },

    // --- Operaciones de versionado (*_history) ---
    OPERATION_INSERT: { code: 'AUDIT_OP_INSERT', display: 'Insert' },
    OPERATION_UPDATE: { code: 'AUDIT_OP_UPDATE', display: 'Update' },
    OPERATION_DELETE: { code: 'AUDIT_OP_DELETE', display: 'Delete' },
  },
);
