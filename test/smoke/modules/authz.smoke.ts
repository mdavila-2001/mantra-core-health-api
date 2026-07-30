import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo 06 (authz). Encadena recursos vía `ctx.vars`:
 * categoría → permiso → rol → (permisos de rol, field-permissions, asignación,
 * excepción, grant de recurso, política) y ejercita el PDP (invalidar/evaluar).
 *
 * Los accesos clínicos (06-06/07) requieren un `patient_profile_id` real (FK a
 * profiles.patient_profiles) que este módulo no puede sembrar, así que solo se
 * incluyen sus casos límite (401). La revocación (06-10) se prueba con 404.
 */
export const AUTHZ_SMOKE: SmokeCase[] = [
  // --- UC-06-01: catálogo ---
  {
    module: 'Authz',
    endpoint: 'POST /authz/permission-categories',
    name: 'happy: crea categoría',
    method: 'post',
    path: () => '/authz/permission-categories',
    body: (c) => ({ code: `CAT-${c.u}`, name: 'Clinical', ordinal: 1 }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.authzCategoryId = String(b.id);
    },
  },
  {
    module: 'Authz',
    endpoint: 'POST /authz/permission-categories',
    name: 'límite: sin auth → 401',
    method: 'post',
    path: () => '/authz/permission-categories',
    auth: false,
    body: (c) => ({ code: `CAT-${c.u}-x`, name: 'x' }),
    expectedStatus: 401,
  },
  {
    module: 'Authz',
    endpoint: 'POST /authz/permissions',
    name: 'happy: crea permiso',
    method: 'post',
    path: () => '/authz/permissions',
    body: (c) => ({
      code: `patient.read-${c.u}`,
      name: 'Read patient',
      resource: 'patient',
      action: 'READ',
      categoryId: c.vars.authzCategoryId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.authzPermissionId = String(b.id);
    },
  },
  {
    module: 'Authz',
    endpoint: 'POST /authz/permissions',
    name: 'límite: validación (falta resource) → 400',
    method: 'post',
    path: () => '/authz/permissions',
    body: (c) => ({ code: `bad-${c.u}`, name: 'x', action: 'READ' }),
    expectedStatus: 400,
  },

  // --- UC-06-03: roles ---
  {
    module: 'Authz',
    endpoint: 'POST /authz/roles',
    name: 'happy: compone rol',
    method: 'post',
    path: () => '/authz/roles',
    body: (c) => ({
      code: `NURSE-${c.u}`,
      name: 'Nurse',
      tenantId: c.tenantId,
      scope: 'TENANT',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.authzRoleId = String(b.id);
    },
  },
  {
    module: 'Authz',
    endpoint: 'PUT /authz/roles/{roleId}/permissions',
    name: 'happy: asigna permisos al rol',
    method: 'put',
    path: (c) => `/authz/roles/${c.vars.authzRoleId}/permissions`,
    body: (c) => ({
      permissions: [
        {
          permissionId: c.vars.authzPermissionId,
          effect: 'ALLOW',
          scope: 'TENANT',
        },
      ],
    }),
    expectedStatus: 200,
  },
  {
    module: 'Authz',
    endpoint: 'PUT /authz/roles/{roleId}/field-permissions',
    name: 'happy: enmascara campos',
    method: 'put',
    path: (c) => `/authz/roles/${c.vars.authzRoleId}/field-permissions`,
    body: () => ({
      fields: [
        {
          entity: 'patient',
          columnName: 'ssn',
          canRead: true,
          canWrite: false,
          maskStrategy: 'REDACT',
        },
      ],
    }),
    expectedStatus: 200,
  },
  {
    module: 'Authz',
    endpoint: 'PUT /authz/roles/{roleId}/field-permissions',
    name: 'límite: canWrite sin canRead → 422',
    method: 'put',
    path: (c) => `/authz/roles/${c.vars.authzRoleId}/field-permissions`,
    body: () => ({
      fields: [
        {
          entity: 'patient',
          columnName: 'dob',
          canRead: false,
          canWrite: true,
        },
      ],
    }),
    expectedStatus: 422,
  },

  // --- UC-06-02: política ABAC ---
  {
    module: 'Authz',
    endpoint: 'POST /authz/tenants/{tenantId}/access-policies',
    name: 'happy: publica política',
    method: 'post',
    path: (c) => `/authz/tenants/${c.tenantId}/access-policies`,
    body: (c) => ({
      name: `no-export-${c.u}`,
      effect: 'DENY',
      targetResource: `patient.record.${c.u}`,
      priority: 10,
    }),
    expectedStatus: 201,
  },

  // --- UC-06-04 / 06-05: asignación y excepción ---
  {
    module: 'Authz',
    endpoint: 'POST /authz/users/{userId}/role-assignments',
    name: 'happy: asigna rol a usuario',
    method: 'post',
    path: (c) => `/authz/users/${c.adminUserId}/role-assignments`,
    body: (c) => ({ roleId: c.vars.authzRoleId, tenantId: c.tenantId }),
    expectedStatus: 201,
  },
  {
    module: 'Authz',
    endpoint: 'POST /authz/users/{userId}/permission-grants',
    name: 'happy: excepción de permiso',
    method: 'post',
    path: (c) => `/authz/users/${c.adminUserId}/permission-grants`,
    body: (c) => ({
      permissionId: c.vars.authzPermissionId,
      effect: 'ALLOW',
      reason: 'cobertura temporal',
      tenantId: c.tenantId,
    }),
    expectedStatus: 201,
  },

  // --- UC-06-09: grant polimórfico ---
  {
    module: 'Authz',
    endpoint: 'POST /authz/resource-scope-grants',
    name: 'happy: grant de recurso',
    method: 'post',
    path: () => '/authz/resource-scope-grants',
    body: (c) => ({
      subjectType: 'USER',
      subjectId: c.adminUserId,
      permissionId: c.vars.authzPermissionId,
      resourceType: 'PATIENT',
      resourceId: UUID_ABSENT,
      effect: 'ALLOW',
      tenantId: c.tenantId,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Authz',
    endpoint: 'POST /authz/resource-scope-grants',
    name: 'límite: validación (falta subjectType) → 400',
    method: 'post',
    path: () => '/authz/resource-scope-grants',
    body: (c) => ({
      subjectId: c.adminUserId,
      permissionId: c.vars.authzPermissionId,
      resourceType: 'PATIENT',
      resourceId: UUID_ABSENT,
      effect: 'ALLOW',
    }),
    expectedStatus: 400,
  },

  // --- UC-06-06 / 06-07: accesos clínicos (solo límite; sin patient real) ---
  {
    module: 'Authz',
    endpoint: 'POST /authz/patients/{id}/clinical-access-grants',
    name: 'límite: sin auth → 401 (happy exige patient real)',
    method: 'post',
    path: () => `/authz/patients/${UUID_ABSENT}/clinical-access-grants`,
    auth: false,
    body: (c) => ({
      grantedUserId: c.adminUserId,
      tenantId: c.tenantId,
      purposeOfUse: 'TREATMENT',
      accessLevel: 'READ',
      validTo: '2999-01-01T00:00:00.000Z',
    }),
    expectedStatus: 401,
  },
  {
    module: 'Authz',
    endpoint: 'POST /authz/patients/{id}/break-the-glass',
    name: 'límite: sin auth → 401 (happy exige patient real)',
    method: 'post',
    path: () => `/authz/patients/${UUID_ABSENT}/break-the-glass`,
    auth: false,
    body: (c) => ({
      tenantId: c.tenantId,
      justification: 'paciente inconsciente en urgencias',
    }),
    expectedStatus: 401,
  },

  // --- UC-06-10: revocar ---
  {
    module: 'Authz',
    endpoint: 'DELETE /authz/clinical-access-grants/{grantId}',
    name: 'límite: inexistente → 404',
    method: 'delete',
    path: () => `/authz/clinical-access-grants/${UUID_ABSENT}`,
    expectedStatus: 404,
  },

  // --- UC-06-11 / 06-12: PDP ---
  {
    module: 'Authz',
    endpoint: 'POST /authz/pdp/cache/invalidate',
    name: 'happy: invalida cache',
    method: 'post',
    path: () => '/authz/pdp/cache/invalidate',
    body: (c) => ({ tenantId: c.tenantId, userId: c.adminUserId }),
    expectedStatus: 200,
  },
  {
    module: 'Authz',
    endpoint: 'POST /authz/decisions/evaluate',
    name: 'happy: evalúa decisión',
    method: 'post',
    path: () => '/authz/decisions/evaluate',
    body: (c) => ({
      userId: c.adminUserId,
      tenantId: c.tenantId,
      resource: 'patient',
      action: 'READ',
      purposeOfUse: 'TREATMENT',
    }),
    expectedStatus: 200,
  },
  {
    module: 'Authz',
    endpoint: 'POST /authz/decisions/evaluate',
    name: 'límite: sin auth → 401',
    method: 'post',
    path: () => '/authz/decisions/evaluate',
    auth: false,
    body: (c) => ({
      userId: c.adminUserId,
      tenantId: c.tenantId,
      resource: 'patient',
      action: 'READ',
    }),
    expectedStatus: 401,
  },
];
