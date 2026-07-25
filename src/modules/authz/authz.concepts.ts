import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo `authz` (06). Cubren toda columna `*_concept_id`
 * NOT NULL que este módulo inserta y que NO está ya cubierta por los conceptos
 * transversales `CONCEPTS.*` (p. ej. `STATE_ACTIVE`, `STATE_REVOKED`,
 * `STATE_EXPIRED`, que se reutilizan para los ciclos de vida de grants/roles).
 *
 * Se declaran con `defineModuleConcepts('authz', {...})` para derivar UUIDs
 * deterministas sin tocar archivos compartidos. Los servicios importan `AUTHZ`
 * y el orquestador de seed consumirá `AUTHZ_CONCEPT_SEEDS`.
 */
export const { seeds: AUTHZ_CONCEPT_SEEDS, ids: AUTHZ } = defineModuleConcepts('authz', {
  // --- Efecto de una regla de autorización (allow/deny) ---
  EFFECT_ALLOW: { code: 'ALLOW', display: 'Allow' },
  EFFECT_DENY: { code: 'DENY', display: 'Deny' },

  // --- Ámbito de aplicación de un permiso/rol/grant ---
  SCOPE_SELF: { code: 'SCOPE_SELF', display: 'Self scope' },
  SCOPE_BRANCH: { code: 'SCOPE_BRANCH', display: 'Branch scope' },
  SCOPE_TENANT: { code: 'SCOPE_TENANT', display: 'Tenant scope' },
  SCOPE_GLOBAL: { code: 'SCOPE_GLOBAL', display: 'Global scope' },

  // --- Acciones de un permiso (permissions.action_concept_id) ---
  ACTION_READ: { code: 'READ', display: 'Read' },
  ACTION_WRITE: { code: 'WRITE', display: 'Write' },
  ACTION_CREATE: { code: 'CREATE', display: 'Create' },
  ACTION_DELETE: { code: 'DELETE', display: 'Delete' },
  ACTION_EXECUTE: { code: 'EXECUTE', display: 'Execute' },
  ACTION_APPROVE: { code: 'APPROVE', display: 'Approve' },

  // --- Propósito de uso (purpose-of-use) de un acceso clínico ---
  PURPOSE_TREATMENT: { code: 'TREATMENT', display: 'Treatment' },
  PURPOSE_PAYMENT: { code: 'PAYMENT', display: 'Payment' },
  PURPOSE_OPERATIONS: { code: 'OPERATIONS', display: 'Operations' },
  PURPOSE_EMERGENCY: { code: 'EMERGENCY', display: 'Emergency (break-the-glass)' },

  // --- Nivel de acceso concedido (clinical_access_grants.access_level_concept_id) ---
  ACCESS_LEVEL_READ: { code: 'ACCESS_READ', display: 'Read-only access' },
  ACCESS_LEVEL_WRITE: { code: 'ACCESS_WRITE', display: 'Read/write access' },
  ACCESS_LEVEL_FULL: { code: 'ACCESS_FULL', display: 'Full access' },
  ACCESS_LEVEL_ELEVATED: { code: 'ACCESS_ELEVATED', display: 'Elevated (emergency) access' },

  // --- Estrategia de enmascaramiento de campos (field_permissions.mask_strategy_concept_id) ---
  MASK_REDACT: { code: 'REDACT', display: 'Redact' },
  MASK_HASH: { code: 'HASH', display: 'Hash' },
  MASK_PARTIAL: { code: 'PARTIAL', display: 'Partial reveal' },
  MASK_NULLIFY: { code: 'NULLIFY', display: 'Nullify' },

  // --- Tipos de sujeto de un grant polimórfico (subject_type_concept_id) ---
  SUBJECT_TYPE_USER: { code: 'SUBJECT_USER', display: 'User subject' },
  SUBJECT_TYPE_ROLE: { code: 'SUBJECT_ROLE', display: 'Role subject' },
  SUBJECT_TYPE_SERVICE: { code: 'SUBJECT_SERVICE', display: 'Service principal subject' },

  // --- Tipos de recurso de un grant polimórfico (resource_type_concept_id) ---
  RESOURCE_TYPE_PATIENT: { code: 'RES_PATIENT', display: 'Patient resource' },
  RESOURCE_TYPE_ENCOUNTER: { code: 'RES_ENCOUNTER', display: 'Encounter resource' },
  RESOURCE_TYPE_DOCUMENT: { code: 'RES_DOCUMENT', display: 'Document resource' },
  RESOURCE_TYPE_RECORD: { code: 'RES_RECORD', display: 'Clinical record resource' },

  // --- Rol base (roles.base_role_concept_id) ---
  BASE_ROLE_CLINICAL: { code: 'BASE_CLINICAL', display: 'Clinical base role' },
  BASE_ROLE_ADMIN: { code: 'BASE_ADMIN', display: 'Administrative base role' },
  BASE_ROLE_STAFF: { code: 'BASE_STAFF', display: 'Staff base role' },

  // --- Resultado de la evaluación del PDP (no persistido, retornado) ---
  DECISION_PERMIT: { code: 'PERMIT', display: 'Permit' },
  DECISION_DENY: { code: 'DECISION_DENY', display: 'Deny' },

  // --- Resultado de revisión de break-the-glass (break_glass_sessions) ---
  BG_REVIEW_JUSTIFIED: { code: 'BG_JUSTIFIED', display: 'Break-the-glass justified' },
  BG_REVIEW_UNJUSTIFIED: { code: 'BG_UNJUSTIFIED', display: 'Break-the-glass unjustified' },
});
