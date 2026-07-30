import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo 29 (Delegated Access). Encadena el ciclo completo de delegación
 * scoped sobre `ctx.vars`:
 *   set de permisos -> asignación de usuario de organización -> delegación de
 *   practitioner -> solicitud de acceso -> decisión (emite grant) -> grant
 *   pre-autorizado -> evaluación del actor efectivo -> barrido -> revocación ->
 *   reasignación de la asignación org.
 *
 * FK NOT NULL: solo se fuerzan las intra-esquema (set/org-assignment/delegación),
 * que se capturan de casos previos. Los FK cross-schema (tenant_membership_id,
 * permission_id, practitioner_role_assignment_id) no están enforced en BD, así que
 * usan `ctx.adminUserId`/uuids fijos. Los `*_concept_id` provienen del seed del
 * módulo. `patientProfileId` usa `ctx.vars.patientProfileId` si un módulo previo lo
 * pobló; si no, se omite (la columna es nullable).
 */
const PERMISSION_A = '00000000-0000-4000-8000-0000000d2901';
const PERMISSION_STEP_UP = '00000000-0000-4000-8000-0000000d2902';
const ROLE_ASSIGNMENT = '00000000-0000-4000-8000-0000000d2903';
const FAR_FUTURE = '2030-01-01T00:00:00.000Z';

export const DELEGATED_ACCESS_SMOKE: SmokeCase[] = [
  // --- UC-29-02: publicar set de permisos delegados ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /delegated-permission-sets',
    name: 'happy: publica set (v1)',
    method: 'post',
    path: () => '/delegated-permission-sets',
    body: (c) => ({
      tenantId: c.tenantId,
      code: `DA-SET-${c.u}`,
      name: 'Secretary permission set',
      delegateType: 'SECRETARY',
      items: [
        {
          permissionId: c.vars.authzPermissionId,
          requiresStepUpAuthentication: true,
        },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.daSetId = String(b.id);
    },
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /delegated-permission-sets',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/delegated-permission-sets',
    auth: false,
    body: (c) => ({
      tenantId: c.tenantId,
      code: `DA-X-${c.u}`,
      name: 'X',
      items: [{ permissionId: c.vars.authzPermissionId }],
    }),
    expectedStatus: 401,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /delegated-permission-sets',
    name: 'límite: sin items -> 400',
    method: 'post',
    path: () => '/delegated-permission-sets',
    body: (c) => ({
      tenantId: c.tenantId,
      code: `DA-Y-${c.u}`,
      name: 'Y',
      items: [],
    }),
    expectedStatus: 400,
  },

  // --- UC-29-02: versionar set ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /delegated-permission-sets/{id}/versions',
    name: 'happy: publica v2',
    method: 'post',
    path: (c) => `/delegated-permission-sets/${c.vars.daSetId}/versions`,
    body: (c) => ({ items: [{ permissionId: c.vars.authzPermissionId }] }),
    expectedStatus: 201,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /delegated-permission-sets/{id}/versions',
    name: 'límite: set inexistente -> 404',
    method: 'post',
    path: () => `/delegated-permission-sets/${UUID_ABSENT}/versions`,
    body: (c) => ({ items: [{ permissionId: c.vars.authzPermissionId }] }),
    expectedStatus: 404,
  },

  // --- UC-29-01: asignar usuario de organización ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /org/{tenant_membership_id}/user-assignments',
    name: 'happy: asigna usuario org (scoped)',
    method: 'post',
    path: (c) => `/org/${c.vars.dirMembershipId}/user-assignments`,
    body: (c) => ({
      role: 'SECRETARY',
      accessScope: 'TENANT',
      supervisorUserId: c.adminUserId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.daOrgAssignmentId = String(b.id);
    },
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /org/{tenant_membership_id}/user-assignments',
    name: 'límite: solapamiento rol+scope activo -> 409',
    method: 'post',
    path: (c) => `/org/${c.vars.dirMembershipId}/user-assignments`,
    body: () => ({ role: 'SECRETARY', accessScope: 'TENANT' }),
    expectedStatus: 409,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /org/{tenant_membership_id}/user-assignments',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: (c) => `/org/${c.vars.dirMembershipId}/user-assignments`,
    auth: false,
    body: () => ({ role: 'NURSE' }),
    expectedStatus: 401,
  },

  // --- UC-29-03: crear delegación de practitioner ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates',
    name: 'happy: crea delegación',
    method: 'post',
    path: () => '/practitioner-delegates',
    body: (c) => ({
      practitionerRoleAssignmentId: ROLE_ASSIGNMENT,
      delegateUserAssignmentId: c.vars.daOrgAssignmentId,
      delegatedPermissionSetId: c.vars.daSetId,
      delegateRole: 'ASSISTANT',
      patientScope: 'ASSIGNED',
      mayViewClinicalContent: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.daDelegateId = String(b.id);
    },
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates',
    name: 'límite: org assignment inexistente -> 404',
    method: 'post',
    path: () => '/practitioner-delegates',
    body: (c) => ({
      practitionerRoleAssignmentId: ROLE_ASSIGNMENT,
      delegateUserAssignmentId: UUID_ABSENT,
      delegatedPermissionSetId: c.vars.daSetId,
    }),
    expectedStatus: 404,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates',
    name: 'límite: falta set -> 400',
    method: 'post',
    path: () => '/practitioner-delegates',
    body: (c) => ({
      practitionerRoleAssignmentId: ROLE_ASSIGNMENT,
      delegateUserAssignmentId: c.vars.daOrgAssignmentId,
    }),
    expectedStatus: 400,
  },

  // --- UC-29-04: solicitar acceso delegado ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates/{id}/access-requests',
    name: 'happy: abre solicitud',
    method: 'post',
    path: (c) =>
      `/practitioner-delegates/${c.vars.daDelegateId}/access-requests`,
    body: (c) => ({
      requestedPermissionId: PERMISSION_A,
      patientProfileId: c.vars.patientProfileId,
      reasonText: 'Cobertura de agenda',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.daRequestId = String(b.id);
    },
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates/{id}/access-requests',
    name: 'límite: solicitud pendiente duplicada -> 409',
    method: 'post',
    path: (c) =>
      `/practitioner-delegates/${c.vars.daDelegateId}/access-requests`,
    body: (c) => ({
      requestedPermissionId: PERMISSION_A,
      patientProfileId: c.vars.patientProfileId,
    }),
    expectedStatus: 409,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates/{id}/access-requests',
    name: 'límite: delegación inexistente -> 404',
    method: 'post',
    path: () => `/practitioner-delegates/${UUID_ABSENT}/access-requests`,
    body: () => ({ requestedPermissionId: PERMISSION_A }),
    expectedStatus: 404,
  },

  // --- UC-29-05: decidir solicitud (emite grant) ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /access-requests/{id}/decision',
    name: 'happy: aprueba y emite grant',
    method: 'post',
    path: (c) => `/access-requests/${c.vars.daRequestId}/decision`,
    body: () => ({
      decision: 'APPROVED',
      purpose: 'TREATMENT',
      resourceType: 'CLINICAL_NOTE',
      validTo: FAR_FUTURE,
    }),
    expectedStatus: 200,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /access-requests/{id}/decision',
    name: 'límite: re-decidir solicitud cerrada -> 422',
    method: 'post',
    path: (c) => `/access-requests/${c.vars.daRequestId}/decision`,
    body: () => ({ decision: 'DENIED' }),
    expectedStatus: 422,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /access-requests/{id}/decision',
    name: 'límite: solicitud inexistente -> 404',
    method: 'post',
    path: () => `/access-requests/${UUID_ABSENT}/decision`,
    body: () => ({ decision: 'APPROVED' }),
    expectedStatus: 404,
  },

  // --- UC-29-06: emitir grant pre-autorizado ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates/{id}/grants',
    name: 'happy: emite grant temporal',
    method: 'post',
    path: (c) => `/practitioner-delegates/${c.vars.daDelegateId}/grants`,
    body: (c) => ({
      purpose: 'TREATMENT',
      validTo: FAR_FUTURE,
      patientProfileId: c.vars.patientProfileId,
      resourceType: 'APPOINTMENT',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.daGrantId = String(b.id);
    },
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates/{id}/grants',
    name: 'límite: falta valid_to -> 400',
    method: 'post',
    path: (c) => `/practitioner-delegates/${c.vars.daDelegateId}/grants`,
    body: () => ({ purpose: 'TREATMENT' }),
    expectedStatus: 400,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates/{id}/grants',
    name: 'límite: delegación inexistente -> 404',
    method: 'post',
    path: () => `/practitioner-delegates/${UUID_ABSENT}/grants`,
    body: () => ({ purpose: 'TREATMENT', validTo: FAR_FUTURE }),
    expectedStatus: 404,
  },

  // --- UC-29-09: evaluar actor efectivo ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /authz/effective-actor/evaluate',
    name: 'happy: evalúa (allowed)',
    method: 'post',
    path: () => '/authz/effective-actor/evaluate',
    body: (c) => ({
      practitionerDelegateAssignmentId: c.vars.daDelegateId,
      purpose: 'TREATMENT',
      patientProfileId: c.vars.patientProfileId,
    }),
    expectedStatus: 200,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /authz/effective-actor/evaluate',
    name: 'límite: delegación inexistente -> 404',
    method: 'post',
    path: () => '/authz/effective-actor/evaluate',
    body: () => ({
      practitionerDelegateAssignmentId: UUID_ABSENT,
      purpose: 'TREATMENT',
    }),
    expectedStatus: 404,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /authz/effective-actor/evaluate',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/authz/effective-actor/evaluate',
    auth: false,
    body: (c) => ({
      practitionerDelegateAssignmentId: c.vars.daDelegateId,
      purpose: 'TREATMENT',
    }),
    expectedStatus: 401,
  },

  // --- UC-29-08: barrido de expiración ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /delegated-access/expiry-sweep',
    name: 'happy: ejecuta barrido',
    method: 'post',
    path: () => '/delegated-access/expiry-sweep',
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /delegated-access/expiry-sweep',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/delegated-access/expiry-sweep',
    auth: false,
    body: () => ({}),
    expectedStatus: 401,
  },

  // --- UC-29-07: revocar delegación (cascada) ---
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates/{id}/revoke',
    name: 'happy: revoca delegación',
    method: 'post',
    path: (c) => `/practitioner-delegates/${c.vars.daDelegateId}/revoke`,
    body: () => ({ reason: 'Fin de cobertura' }),
    expectedStatus: 200,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'POST /practitioner-delegates/{id}/revoke',
    name: 'límite: delegación inexistente -> 404',
    method: 'post',
    path: () => `/practitioner-delegates/${UUID_ABSENT}/revoke`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // --- UC-29-10: reasignar supervisor / suspender ---
  {
    module: 'DelegatedAccess',
    endpoint: 'PATCH /org/user-assignments/{id}',
    name: 'happy: reasigna supervisor',
    method: 'patch',
    path: (c) => `/org/user-assignments/${c.vars.daOrgAssignmentId}`,
    body: (c) => ({ supervisorUserId: c.adminUserId, accessScope: 'PRACTICE' }),
    expectedStatus: 200,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'PATCH /org/user-assignments/{id}',
    name: 'límite: sin cambios -> 422',
    method: 'patch',
    path: (c) => `/org/user-assignments/${c.vars.daOrgAssignmentId}`,
    body: () => ({}),
    expectedStatus: 422,
  },
  {
    module: 'DelegatedAccess',
    endpoint: 'PATCH /org/user-assignments/{id}',
    name: 'límite: asignación inexistente -> 404',
    method: 'patch',
    path: () => `/org/user-assignments/${UUID_ABSENT}`,
    body: () => ({ suspend: true }),
    expectedStatus: 404,
  },
];
