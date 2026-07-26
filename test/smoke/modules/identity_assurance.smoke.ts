import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { CONCEPTS } from '../../../src/common';

/**
 * Concepto real ya sembrado (terminology.catalog_concepts) reutilizado como
 * stand-in para los `*_concept_id` que el cliente aporta (tipo de autoridad,
 * capacidad, tipo de evidencia, tipo de check, tipo/severidad de señal, IAL/AAL,
 * etc.). Las columnas de concepto de este módulo no tienen FK forzada, pero se
 * usa un id existente para mantener la semántica de "concepto válido". Los estados
 * que fija el servicio salen de `identity_assurance.concepts.ts` (sembrados por el
 * agregador de conceptos).
 */
const CID = CONCEPTS.STATE_ACTIVE;

/**
 * Smoke del módulo Identity Assurance (27). Encadena sus propios recursos con
 * `ctx.vars`: autoridad (UC-01) -> endpoint (UC-01) -> política (soporte) ->
 * caso (UC-02) -> evidencia (UC-03) -> plan de checks (UC-04) -> intento (UC-05)
 * -> resultado (UC-06) -> señal de fraude (UC-07) -> revisión manual (UC-08) ->
 * decisión (UC-09) -> aserción (UC-10) -> revocación (UC-11); más el barrido de
 * expiración (UC-12). Usa `ctx.tenantId`, `ctx.adminUserId` como FKs reales.
 *
 * `integration_endpoint_id`, `subject_entity_id` y los `*_concept_id` aportados
 * por el cliente no tienen FK forzada en este esquema; se cubren con `CID` /
 * ids reales del ctx.
 */
export const IDENTITY_ASSURANCE_SMOKE: SmokeCase[] = [
  // ---- UC-27-01: registrar autoridad ---------------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/authorities', name: 'happy: registrar autoridad',
    method: 'post', path: () => '/identity/authorities',
    body: (c) => ({ tenantId: c.tenantId, authorityCode: `IDA-A-${c.u}`, name: 'Registro Nacional', authorityTypeConceptId: CID }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.idaAuthorityId = String(b.id); },
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/authorities', name: 'límite: sin auth',
    method: 'post', path: () => '/identity/authorities', auth: false,
    body: (c) => ({ tenantId: c.tenantId, authorityCode: `IDA-A-x-${c.u}`, name: 'X', authorityTypeConceptId: CID }),
    expectedStatus: 401,
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/authorities', name: 'límite: validación (falta authorityTypeConceptId)',
    method: 'post', path: () => '/identity/authorities',
    body: (c) => ({ tenantId: c.tenantId, authorityCode: `IDA-A-y-${c.u}`, name: 'X' }),
    expectedStatus: 400,
  },

  // ---- UC-27-01: publicar endpoint de la autoridad -------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/authorities/{id}/endpoints', name: 'happy: publicar endpoint',
    method: 'post', path: (c) => `/identity/authorities/${c.vars.idaAuthorityId}/endpoints`,
    body: (c) => ({ integrationEndpointId: c.vars.integEndpointId, capabilityConceptId: CID }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.idaEndpointId = String(b.id); },
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/authorities/{id}/endpoints', name: 'límite: autoridad inexistente',
    method: 'post', path: () => `/identity/authorities/${UUID_ABSENT}/endpoints`,
    body: (c) => ({ integrationEndpointId: c.vars.integEndpointId, capabilityConceptId: CID }),
    expectedStatus: 404,
  },

  // ---- Soporte UC-27-02: crear política vigente ----------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-policies', name: 'happy: crear política',
    method: 'post', path: () => '/identity/verification-policies',
    body: (c) => ({ policyCode: `IDA-P-${c.u}`, subjectTypeConceptId: CID, transactionRiskConceptId: CID, requiredIdentityAssuranceLevelConceptId: CID }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.idaPolicyId = String(b.id); },
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-policies', name: 'límite: sin auth',
    method: 'post', path: () => '/identity/verification-policies', auth: false,
    body: (c) => ({ policyCode: `IDA-P-x-${c.u}`, subjectTypeConceptId: CID, transactionRiskConceptId: CID, requiredIdentityAssuranceLevelConceptId: CID }),
    expectedStatus: 401,
  },

  // ---- UC-27-02: abrir caso de verificación --------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases', name: 'happy: abrir caso',
    method: 'post', path: () => '/identity/verification-cases',
    body: (c) => ({ identityVerificationPolicyId: c.vars.idaPolicyId, subjectTypeConceptId: CID, subjectEntityId: c.adminUserId }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.idaCaseId = String(b.id); },
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases', name: 'límite: política inexistente',
    method: 'post', path: () => '/identity/verification-cases',
    body: (c) => ({ identityVerificationPolicyId: UUID_ABSENT, subjectTypeConceptId: CID, subjectEntityId: c.adminUserId }),
    expectedStatus: 404,
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases', name: 'límite: validación (falta política)',
    method: 'post', path: () => '/identity/verification-cases',
    body: (c) => ({ subjectTypeConceptId: CID, subjectEntityId: c.adminUserId }),
    expectedStatus: 400,
  },

  // ---- UC-27-03: aportar evidencia -----------------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/evidence', name: 'happy: aportar evidencia',
    method: 'post', path: (c) => `/identity/verification-cases/${c.vars.idaCaseId}/evidence`,
    body: () => ({ evidenceTypeConceptId: CID, evidenceIdentifierHash: 'sha256:deadbeef' }),
    expectedStatus: 201,
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/evidence', name: 'límite: caso inexistente',
    method: 'post', path: () => `/identity/verification-cases/${UUID_ABSENT}/evidence`,
    body: () => ({ evidenceTypeConceptId: CID }),
    expectedStatus: 404,
  },

  // ---- UC-27-04: planificar checks -----------------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/checks:plan', name: 'happy: planificar checks',
    method: 'post', path: (c) => `/identity/verification-cases/${c.vars.idaCaseId}/checks:plan`,
    body: () => ({ checks: [{ checkTypeConceptId: CID, required: true }] }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.idaCheckId = String((b.checkIds as string[])[0]); },
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/checks:plan', name: 'límite: sin auth',
    method: 'post', path: (c) => `/identity/verification-cases/${c.vars.idaCaseId}/checks:plan`, auth: false,
    body: () => ({ checks: [{ checkTypeConceptId: CID }] }),
    expectedStatus: 401,
  },

  // ---- UC-27-05: registrar intento -----------------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/checks/{id}/attempts', name: 'happy: registrar intento',
    method: 'post', path: (c) => `/identity/checks/${c.vars.idaCheckId}/attempts`,
    body: (c) => ({ identityAuthorityEndpointId: c.vars.idaEndpointId, outcome: 'SUCCESS' }),
    expectedStatus: 201,
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/checks/{id}/attempts', name: 'límite: check inexistente',
    method: 'post', path: (c) => `/identity/checks/${UUID_ABSENT}/attempts`,
    body: (c) => ({ identityAuthorityEndpointId: c.vars.idaEndpointId }),
    expectedStatus: 404,
  },

  // ---- UC-27-06: registrar resultado ---------------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/checks/{id}/results', name: 'happy: registrar resultado',
    method: 'post', path: (c) => `/identity/checks/${c.vars.idaCheckId}/results`,
    body: () => ({ result: 'MATCH', matchScore: '0.99' }),
    expectedStatus: 201,
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/checks/{id}/results', name: 'límite: validación (result inválido)',
    method: 'post', path: (c) => `/identity/checks/${c.vars.idaCheckId}/results`,
    body: () => ({ result: 'MAYBE' }),
    expectedStatus: 400,
  },

  // ---- UC-27-07: señal de fraude -------------------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/fraud-signals', name: 'happy: registrar señal de fraude',
    method: 'post', path: (c) => `/identity/verification-cases/${c.vars.idaCaseId}/fraud-signals`,
    body: () => ({ signalTypeConceptId: CID, severityConceptId: CID, confidenceScore: '0.8' }),
    expectedStatus: 201,
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/fraud-signals', name: 'límite: caso inexistente',
    method: 'post', path: () => `/identity/verification-cases/${UUID_ABSENT}/fraud-signals`,
    body: () => ({ signalTypeConceptId: CID, severityConceptId: CID }),
    expectedStatus: 404,
  },

  // ---- UC-27-08: escalar a revisión manual ---------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/manual-review', name: 'happy: escalar a revisión manual',
    method: 'post', path: (c) => `/identity/verification-cases/${c.vars.idaCaseId}/manual-review`,
    body: (c) => ({ reviewReasonConceptId: CID, assignedToUserId: c.adminUserId }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.idaReviewId = String(b.id); },
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/manual-review', name: 'límite: sin auth',
    method: 'post', path: (c) => `/identity/verification-cases/${c.vars.idaCaseId}/manual-review`, auth: false,
    body: () => ({ reviewReasonConceptId: CID }),
    expectedStatus: 401,
  },

  // ---- UC-27-09: resolver revisión manual ----------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/manual-review/{id}/decision', name: 'happy: aprobar revisión',
    method: 'post', path: (c) => `/identity/manual-review/${c.vars.idaReviewId}/decision`,
    body: () => ({ decision: 'APPROVED', decisionReason: 'Evidencia verificada' }),
    expectedStatus: 200,
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/manual-review/{id}/decision', name: 'límite: revisión inexistente',
    method: 'post', path: () => `/identity/manual-review/${UUID_ABSENT}/decision`,
    body: () => ({ decision: 'APPROVED' }),
    expectedStatus: 404,
  },

  // ---- UC-27-10: emitir aserción -------------------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/assertions', name: 'happy: emitir aserción',
    method: 'post', path: (c) => `/identity/verification-cases/${c.vars.idaCaseId}/assertions`,
    body: (c) => ({ issuerIdentityAuthorityId: c.vars.idaAuthorityId, assuranceLevelConceptId: CID }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.idaAssertionId = String(b.id); },
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases/{id}/assertions', name: 'límite: sin auth',
    method: 'post', path: (c) => `/identity/verification-cases/${c.vars.idaCaseId}/assertions`, auth: false,
    body: (c) => ({ issuerIdentityAuthorityId: c.vars.idaAuthorityId }),
    expectedStatus: 401,
  },

  // ---- UC-27-11: revocar aserción ------------------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/assertions/{id}/revoke', name: 'happy: revocar aserción',
    method: 'post', path: (c) => `/identity/assertions/${c.vars.idaAssertionId}/revoke`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/assertions/{id}/revoke', name: 'límite: doble revocación (conflicto)',
    method: 'post', path: (c) => `/identity/assertions/${c.vars.idaAssertionId}/revoke`,
    body: () => ({}),
    expectedStatus: 409,
  },

  // ---- UC-27-12: barrido de expiración -------------------------------------
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases:expire-sweep', name: 'happy: barrido de expiración',
    method: 'post', path: () => '/identity/verification-cases:expire-sweep',
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'IdentityAssurance', endpoint: 'POST /identity/verification-cases:expire-sweep', name: 'límite: sin auth',
    method: 'post', path: () => '/identity/verification-cases:expire-sweep', auth: false,
    body: () => ({}),
    expectedStatus: 401,
  },
];
