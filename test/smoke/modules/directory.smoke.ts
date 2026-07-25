import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo Directory (04). Encadena dos flujos sobre `ctx.vars`:
 *  - un tenant recién aprovisionado (pending) que se verifica, obtiene un
 *    sub-tenant y finalmente se suspende;
 *  - sobre el tenant sembrado por defecto (`ctx.tenantId`, activo): branches,
 *    membresía, asignación a branch, transferencia, cambio de rol y offboarding.
 *
 * `ctx.adminUserId` es un usuario real (FK válida para owner/created_by).
 */
export const DIRECTORY_SMOKE: SmokeCase[] = [
  // --- UC-04-01: aprovisionar tenant ---
  {
    module: 'Directory',
    endpoint: 'POST /admin/tenants',
    name: 'happy: aprovisiona tenant raíz',
    method: 'post',
    path: () => '/admin/tenants',
    body: (c) => ({ code: `DIR-T-${c.u}`, legalName: 'Acme Health SA', ownerUserId: c.adminUserId }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.dirTenantId = String(b.id);
    },
  },
  {
    module: 'Directory',
    endpoint: 'POST /admin/tenants',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/admin/tenants',
    auth: false,
    body: (c) => ({ code: `DIR-X-${c.u}`, legalName: 'X', ownerUserId: c.adminUserId }),
    expectedStatus: 401,
  },
  {
    module: 'Directory',
    endpoint: 'POST /admin/tenants',
    name: 'límite: falta legalName -> 400',
    method: 'post',
    path: () => '/admin/tenants',
    body: (c) => ({ code: `DIR-Y-${c.u}`, ownerUserId: c.adminUserId }),
    expectedStatus: 400,
  },

  // --- UC-04-02: verificar / activar tenant ---
  {
    module: 'Directory',
    endpoint: 'POST /admin/tenants/{tenantId}/verification',
    name: 'happy: verifica y activa',
    method: 'post',
    path: (c) => `/admin/tenants/${c.vars.dirTenantId}/verification`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Directory',
    endpoint: 'POST /admin/tenants/{tenantId}/verification',
    name: 'límite: tenant inexistente -> 404',
    method: 'post',
    path: () => `/admin/tenants/${UUID_ABSENT}/verification`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // --- UC-04-03: crear sub-tenant ---
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/child-tenants',
    name: 'happy: crea sub-tenant',
    method: 'post',
    path: (c) => `/tenants/${c.vars.dirTenantId}/child-tenants`,
    body: (c) => ({ code: `DIR-C-${c.u}`, legalName: 'Acme Child', adminUserId: c.adminUserId }),
    expectedStatus: 201,
  },
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/child-tenants',
    name: 'límite: padre inexistente -> 404',
    method: 'post',
    path: () => `/tenants/${UUID_ABSENT}/child-tenants`,
    body: (c) => ({ code: `DIR-C2-${c.u}`, legalName: 'X', adminUserId: c.adminUserId }),
    expectedStatus: 404,
  },

  // --- UC-04-04: crear branches (sobre el tenant sembrado, activo) ---
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/branches',
    name: 'happy: crea branch origen',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/branches`,
    body: (c) => ({ code: `DIR-B1-${c.u}`, name: 'Sede Centro', latitude: -12.0464, longitude: -77.0428 }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.dirBranch1 = String(b.id);
    },
  },
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/branches',
    name: 'happy: crea branch destino',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/branches`,
    body: (c) => ({ code: `DIR-B2-${c.u}`, name: 'Sede Norte' }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.dirBranch2 = String(b.id);
    },
  },
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/branches',
    name: 'límite: tenant inexistente -> 404',
    method: 'post',
    path: () => `/tenants/${UUID_ABSENT}/branches`,
    body: (c) => ({ code: `DIR-B3-${c.u}`, name: 'Ghost' }),
    expectedStatus: 404,
  },

  // --- UC-04-05: incorporar usuario (membership) ---
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/memberships',
    name: 'happy: incorpora usuario',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/memberships`,
    body: (c) => ({ userId: c.adminUserId, role: 'STAFF' }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.dirMembershipId = String(b.id);
    },
  },
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/memberships',
    name: 'límite: membresía activa duplicada -> 409',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/memberships`,
    body: (c) => ({ userId: c.adminUserId, role: 'STAFF' }),
    expectedStatus: 409,
  },

  // --- UC-04-06: asignar a branch ---
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments',
    name: 'happy: asigna a branch',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/memberships/${c.vars.dirMembershipId}/branch-assignments`,
    body: (c) => ({ branchId: c.vars.dirBranch1 }),
    expectedStatus: 201,
  },
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments',
    name: 'límite: asignación duplicada -> 409',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/memberships/${c.vars.dirMembershipId}/branch-assignments`,
    body: (c) => ({ branchId: c.vars.dirBranch1 }),
    expectedStatus: 409,
  },

  // --- UC-04-07: transferir entre branches ---
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/memberships/{membershipId}/transfer',
    name: 'happy: transfiere de origen a destino',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/memberships/${c.vars.dirMembershipId}/transfer`,
    body: (c) => ({ fromBranchId: c.vars.dirBranch1, toBranchId: c.vars.dirBranch2 }),
    expectedStatus: 200,
  },

  // --- UC-04-08: cambiar rol / scope ---
  {
    module: 'Directory',
    endpoint: 'PATCH /tenants/{tenantId}/memberships/{membershipId}/role',
    name: 'happy: cambia rol y scope',
    method: 'patch',
    path: (c) => `/tenants/${c.tenantId}/memberships/${c.vars.dirMembershipId}/role`,
    body: () => ({ role: 'ADMIN', accessScope: 'BRANCH' }),
    expectedStatus: 200,
  },
  {
    module: 'Directory',
    endpoint: 'PATCH /tenants/{tenantId}/memberships/{membershipId}/role',
    name: 'límite: sin rol ni scope -> 422',
    method: 'patch',
    path: (c) => `/tenants/${c.tenantId}/memberships/${c.vars.dirMembershipId}/role`,
    body: () => ({}),
    expectedStatus: 422,
  },

  // --- UC-04-09: offboarding ---
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/memberships/{membershipId}/offboard',
    name: 'happy: da de baja al miembro',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/memberships/${c.vars.dirMembershipId}/offboard`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Directory',
    endpoint: 'POST /tenants/{tenantId}/memberships/{membershipId}/offboard',
    name: 'límite: membresía ya cerrada -> 422',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/memberships/${c.vars.dirMembershipId}/offboard`,
    body: () => ({}),
    expectedStatus: 422,
  },

  // --- UC-04-10: suspender tenant (cascada) ---
  {
    module: 'Directory',
    endpoint: 'POST /admin/tenants/{tenantId}/suspend',
    name: 'happy: suspende tenant con cascada',
    method: 'post',
    path: (c) => `/admin/tenants/${c.vars.dirTenantId}/suspend`,
    body: () => ({ reason: 'Cierre de operaciones' }),
    expectedStatus: 200,
  },
  {
    module: 'Directory',
    endpoint: 'POST /admin/tenants/{tenantId}/suspend',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: (c) => `/admin/tenants/${c.vars.dirTenantId}/suspend`,
    auth: false,
    body: () => ({ reason: 'x' }),
    expectedStatus: 401,
  },
];
