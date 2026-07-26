import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo system_ops (prefijo `system_ops:`).
 *
 * Solo se declaran los estados / tipos / técnicas / resultados que los endpoints
 * de gobierno de datos y operaciones necesitan y que NO existen ya en el catálogo
 * transversal (`CONCEPTS.*`). Para el estado genérico "ACTIVE" de las políticas se
 * reutiliza `CONCEPTS.STATE_ACTIVE` en los servicios; aquí solo vive lo específico.
 *
 * `SYSTEM_OPS_CONCEPT_SEEDS` lo consume el agregador central del seed
 * (`src/common/seed/module-concepts.ts`, cableado por el orquestador); `SYSOPS` es
 * el mapa `nombre -> UUID` determinista que consumen servicios y repositorios.
 */
export const { seeds: SYSTEM_OPS_CONCEPT_SEEDS, ids: SYSOPS } = defineModuleConcepts('system_ops', {
  // --- Acciones del registro de cambios de gobierno (governance_change_log.action_concept_id) ---
  ACTION_CREATE: { code: 'SO_ACTION_CREATE', display: 'Governance create' },
  ACTION_UPDATE: { code: 'SO_ACTION_UPDATE', display: 'Governance update' },
  ACTION_RELEASE: { code: 'SO_ACTION_RELEASE', display: 'Governance release' },

  // --- Estrategia de enmascaramiento de campo (field_registry.masking_strategy_concept_id) ---
  MASK_NONE: { code: 'SO_MASK_NONE', display: 'No masking' },
  MASK_PARTIAL: { code: 'SO_MASK_PARTIAL', display: 'Partial masking' },
  MASK_FULL: { code: 'SO_MASK_FULL', display: 'Full masking' },

  // --- Modos de escritura (write_policies.insert/update/delete_mode_concept_id) ---
  WRITE_MODE_ALLOWED: { code: 'SO_WRITE_ALLOWED', display: 'Write allowed' },
  WRITE_MODE_APPEND_ONLY: { code: 'SO_WRITE_APPEND_ONLY', display: 'Append only' },
  WRITE_MODE_SOFT_DELETE: { code: 'SO_WRITE_SOFT_DELETE', display: 'Soft delete only' },
  WRITE_MODE_BLOCKED: { code: 'SO_WRITE_BLOCKED', display: 'Write blocked' },

  // --- Bases legales / disposición / jurisdicción de retención ---
  LEGAL_BASIS_CONSENT: { code: 'SO_LB_CONSENT', display: 'Consent' },
  LEGAL_BASIS_LEGAL_OBLIGATION: { code: 'SO_LB_LEGAL_OBLIGATION', display: 'Legal obligation' },
  DISPOSITION_DELETE: { code: 'SO_DISP_DELETE', display: 'Delete on expiry' },
  DISPOSITION_ANONYMIZE: { code: 'SO_DISP_ANONYMIZE', display: 'Anonymize on expiry' },
  DISPOSITION_ARCHIVE: { code: 'SO_DISP_ARCHIVE', display: 'Archive on expiry' },
  JURISDICTION_PE: { code: 'SO_JUR_PE', display: 'Peru jurisdiction' },
  JURISDICTION_EU: { code: 'SO_JUR_EU', display: 'EU jurisdiction' },

  // --- Técnicas de anonimización (anonymization_rules.technique_concept_id) ---
  TECHNIQUE_MASK: { code: 'SO_TECH_MASK', display: 'Mask' },
  TECHNIQUE_HASH: { code: 'SO_TECH_HASH', display: 'Hash' },
  TECHNIQUE_GENERALIZE: { code: 'SO_TECH_GENERALIZE', display: 'Generalize' },
  TECHNIQUE_PSEUDONYMIZE: { code: 'SO_TECH_PSEUDONYMIZE', display: 'Pseudonymize' },

  // --- Estados de ejecución de retención (retention_executions.status_concept_id) ---
  EXEC_RUNNING: { code: 'SO_EXEC_RUNNING', display: 'Retention run running' },
  EXEC_SUCCEEDED: { code: 'SO_EXEC_SUCCEEDED', display: 'Retention run succeeded' },
  EXEC_FAILED: { code: 'SO_EXEC_FAILED', display: 'Retention run failed' },

  // --- Operaciones de revisión de registro (record_revisions.operation_concept_id) ---
  OP_INSERT: { code: 'SO_OP_INSERT', display: 'Insert' },
  OP_UPDATE: { code: 'SO_OP_UPDATE', display: 'Update' },
  OP_DELETE: { code: 'SO_OP_DELETE', display: 'Delete' },
  OP_ANONYMIZE: { code: 'SO_OP_ANONYMIZE', display: 'Anonymize' },

  // --- Regiones (residencia / transferencias) ---
  REGION_SA_EAST: { code: 'SO_REGION_SA_EAST', display: 'South America East' },
  REGION_US_EAST: { code: 'SO_REGION_US_EAST', display: 'US East' },
  REGION_EU_WEST: { code: 'SO_REGION_EU_WEST', display: 'EU West' },

  // --- Categorías de datos y base de transferencia transfronteriza ---
  DATA_CATEGORY_PHI: { code: 'SO_DATA_CAT_PHI', display: 'Protected health information' },
  DATA_CATEGORY_PII: { code: 'SO_DATA_CAT_PII', display: 'Personal data' },
  TRANSFER_BASIS_SCC: { code: 'SO_TRANSFER_SCC', display: 'Standard contractual clauses' },
  TRANSFER_BASIS_ADEQUACY: { code: 'SO_TRANSFER_ADEQUACY', display: 'Adequacy decision' },

  // --- Legal hold (legal_holds.target_type / reason) ---
  HOLD_TARGET_TABLE: { code: 'SO_HOLD_TARGET_TABLE', display: 'Table target' },
  HOLD_TARGET_RECORD: { code: 'SO_HOLD_TARGET_RECORD', display: 'Record target' },
  HOLD_REASON_LITIGATION: { code: 'SO_HOLD_REASON_LITIGATION', display: 'Litigation hold' },
  HOLD_REASON_INVESTIGATION: { code: 'SO_HOLD_REASON_INVESTIGATION', display: 'Investigation hold' },

  // --- Backup (backup_policies.resource_scope / backup_type) ---
  BACKUP_SCOPE_DATABASE: { code: 'SO_BACKUP_SCOPE_DB', display: 'Database scope' },
  BACKUP_SCOPE_OBJECT_STORE: { code: 'SO_BACKUP_SCOPE_OBJ', display: 'Object storage scope' },
  BACKUP_TYPE_FULL: { code: 'SO_BACKUP_TYPE_FULL', display: 'Full backup' },
  BACKUP_TYPE_INCREMENTAL: { code: 'SO_BACKUP_TYPE_INCR', display: 'Incremental backup' },

  // --- Prueba de restauración (restore_test_runs.outcome_concept_id) ---
  RESTORE_OUTCOME_PASS: { code: 'SO_RESTORE_PASS', display: 'Restore test passed' },
  RESTORE_OUTCOME_FAIL: { code: 'SO_RESTORE_FAIL', display: 'Restore test failed' },

  // --- Framework operativo (operational_frameworks.provider / controls.pillar) ---
  FRAMEWORK_PROVIDER_INTERNAL: { code: 'SO_FW_PROVIDER_INTERNAL', display: 'Internal framework provider' },
  FRAMEWORK_PROVIDER_AWS: { code: 'SO_FW_PROVIDER_AWS', display: 'AWS framework provider' },
  PILLAR_SECURITY: { code: 'SO_PILLAR_SECURITY', display: 'Security pillar' },
  PILLAR_RELIABILITY: { code: 'SO_PILLAR_RELIABILITY', display: 'Reliability pillar' },

  // --- Evaluación de workload (workload_assessments.assessment_type / status) ---
  ASSESS_TYPE_SELF: { code: 'SO_ASSESS_TYPE_SELF', display: 'Self assessment' },
  ASSESS_TYPE_AUDIT: { code: 'SO_ASSESS_TYPE_AUDIT', display: 'Audit assessment' },
  ASSESS_IN_PROGRESS: { code: 'SO_ASSESS_IN_PROGRESS', display: 'Assessment in progress' },
  ASSESS_COMPLETED: { code: 'SO_ASSESS_COMPLETED', display: 'Assessment completed' },

  // --- Resultados y madurez de control (assessment_control_results) ---
  RESULT_PASS: { code: 'SO_RESULT_PASS', display: 'Control passed' },
  RESULT_FAIL: { code: 'SO_RESULT_FAIL', display: 'Control failed' },
  RESULT_PARTIAL: { code: 'SO_RESULT_PARTIAL', display: 'Control partially met' },
  MATURITY_INITIAL: { code: 'SO_MATURITY_INITIAL', display: 'Maturity: initial' },
  MATURITY_MANAGED: { code: 'SO_MATURITY_MANAGED', display: 'Maturity: managed' },
  MATURITY_OPTIMIZED: { code: 'SO_MATURITY_OPTIMIZED', display: 'Maturity: optimized' },

  // --- Severidad y estados de hallazgo (assessment_findings) ---
  SEVERITY_LOW: { code: 'SO_SEV_LOW', display: 'Severity low' },
  SEVERITY_MEDIUM: { code: 'SO_SEV_MEDIUM', display: 'Severity medium' },
  SEVERITY_HIGH: { code: 'SO_SEV_HIGH', display: 'Severity high' },
  SEVERITY_CRITICAL: { code: 'SO_SEV_CRITICAL', display: 'Severity critical' },
  FINDING_OPEN: { code: 'SO_FINDING_OPEN', display: 'Finding open' },
  FINDING_CLOSED: { code: 'SO_FINDING_CLOSED', display: 'Finding closed' },

  // --- Estados de plan y acción de remediación ---
  PLAN_OPEN: { code: 'SO_PLAN_OPEN', display: 'Remediation plan open' },
  PLAN_COMPLETED: { code: 'SO_PLAN_COMPLETED', display: 'Remediation plan completed' },
  ACTION_OPEN: { code: 'SO_RA_OPEN', display: 'Remediation action open' },
  ACTION_IN_PROGRESS: { code: 'SO_RA_IN_PROGRESS', display: 'Remediation action in progress' },
  ACTION_DONE: { code: 'SO_RA_DONE', display: 'Remediation action done' },
  ACTION_VERIFIED: { code: 'SO_RA_VERIFIED', display: 'Remediation action verified' },

  // --- Estados de draft genérico (draft_records.status_concept_id) ---
  DRAFT: { code: 'SO_DRAFT', display: 'Draft' },
  PUBLISHED: { code: 'SO_PUBLISHED', display: 'Published' },
});
