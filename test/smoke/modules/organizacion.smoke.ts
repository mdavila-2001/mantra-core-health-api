import { CONCEPTS } from '../../../src/common';
import type { SmokeCase, SmokeCtx } from '../smoke-kit';

/**
 * Recorrido completo de una organización, **con el token de su owner**.
 *
 * La organización es el único actor que nace junto a su cuenta: `register-organization` crea en
 * una transacción el tenant, el usuario owner, la credencial y la membresía que los une. Sin esa
 * membresía el tenant existiría pero nadie podría entrar en él, así que el recorrido empieza
 * comprobando justamente eso — que el owner puede operar sobre lo suyo desde el primer momento.
 *
 * La idea que ordena el recorrido, espejo de la del médico: **registrarse no es estar
 * verificado.** El tenant nace PENDING/UNVERIFIED y la verificación es un acto de la plataforma,
 * no del cliente; un prestador que se auto-verificara sería un agujero regulatorio. Lo que el
 * owner sí puede hacer es *pedirla* aportando evidencia.
 *
 * Cubre las dos bajas lógicas del módulo, que son distintas y conviene no confundir:
 *
 * - `offboard` da de baja a una persona **dentro** de la organización: la membresía deja de estar
 *   activa pero la fila sobrevive, porque de ella cuelga qué pudo ver esa persona y cuándo.
 * - `suspend` (en el smoke del administrador) da de baja a la organización entera, y sólo lo
 *   puede hacer la plataforma.
 *
 * Los ids se encadenan por `ctx.vars` con el prefijo `org`.
 */

/** Token del owner de la organización, capturado en su login. */
/** Concepto sembrado que sirve de país/jurisdicción: lo que importa es que exista. */
const CID = CONCEPTS.STATE_ACTIVE;

const asOwner = (c: SmokeCtx): string | undefined => c.vars.orgToken;

/** Correo del owner. */
const ownerEmail = (c: SmokeCtx): string => `owner-org-${c.u}@example.test`;

export const ORGANIZACION_SMOKE: SmokeCase[] = [
  // --- 1. Alta pública: tenant y cuenta owner en una transacción -----------
  {
    module: 'Organización',
    endpoint: 'POST /iam/auth/register-organization',
    name: 'happy: se registra sola, con su cuenta owner',
    method: 'post',
    auth: false, // público: una organización puede darse de alta por iniciativa propia
    path: () => '/iam/auth/register-organization',
    body: (c) => ({
      organization: {
        code: `ORG-SMOKE-${c.u}`,
        legalName: `Organización Smoke ${c.u}`,
        tenantType: 'HOSPITAL',
        countryConceptId: CID,
        jurisdictionConceptId: CID,
      },
      owner: {
        email: ownerEmail(c),
        password: 'S3cret-passw0rd',
        displayName: 'Owner Smoke',
      },
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgTenantId = String(b.tenantId ?? '');
      c.vars.orgOwnerUserId = String(b.ownerUserId ?? '');
      c.vars.orgMembershipId = String(b.membershipId ?? '');
    },
  },
  {
    module: 'Organización',
    endpoint: 'POST /iam/auth/register-organization',
    name: 'límite: PROVIDER sin país ni jurisdicción no se registra',
    method: 'post',
    auth: false,
    // Los tipos territoriales deben decir dónde operan: es lo que determina bajo qué
    // regulador lo hacen. Sin eso el tenant quedaría sin regulador conocido.
    path: () => '/iam/auth/register-organization',
    body: (c) => ({
      organization: {
        code: `ORG-BAD-${c.u}`,
        legalName: 'Sin jurisdicción',
        tenantType: 'PROVIDER',
      },
      owner: {
        email: `bad-${c.u}@example.test`,
        password: 'S3cret-passw0rd',
        displayName: 'Owner',
      },
    }),
    expectedStatus: 422,
    expectedCode: 'PRECONDITION_FAILED',
  },
  {
    module: 'Organización',
    endpoint: 'POST /iam/auth/register-organization',
    name: 'límite: PAYER con bloque broker es un tipo que no se sostiene',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/register-organization',
    body: (c) => ({
      organization: {
        code: `ORG-MIX-${c.u}`,
        legalName: 'Tipo contradictorio',
        tenantType: 'PAYER',
        broker: { brokerCode: `BRO-${c.u}`, licenseNumber: `LIC-${c.u}` },
      },
      owner: {
        email: `mix-${c.u}@example.test`,
        password: 'S3cret-passw0rd',
        displayName: 'Owner',
      },
    }),
    expectedStatus: 422,
    expectedCode: 'PRECONDITION_FAILED',
  },

  // --- 2. El owner entra, aporta evidencia y pide su verificación ---------
  {
    module: 'Organización',
    endpoint: 'POST /iam/auth/login',
    name: 'happy: el owner inicia sesión de inmediato',
    method: 'post',
    auth: false,
    // No espera a que la plataforma verifique la organización: puede entrar y prepararla
    // mientras tanto. Lo que no puede es operar como si estuviera verificada.
    path: () => '/iam/auth/login',
    body: (c) => ({ email: ownerEmail(c), password: 'S3cret-passw0rd' }),
    expectedStatus: 200,
    capture: (b, c) => {
      c.vars.orgToken = String(b.accessToken ?? '');
      c.vars.orgRefreshToken = String(b.refreshToken ?? '');
    },
  },

  // --- 3. Estructura: sedes y personal ------------------------------------
  {
    module: 'Organización',
    endpoint: 'POST /common/files',
    name: 'setup: sube su documentación legal',
    method: 'post',
    token: asOwner,
    path: () => '/common/files',
    body: (c) => ({
      originalName: `personeria-${c.u}.pdf`,
      category: 'DOCUMENT',
      sensitivity: 'NORMAL',
      mimeType: 'application/pdf',
      sizeBytes: 16384,
      contentHash: `org-doc-${c.u}`,
      storageUri: `s3://bucket/personeria-${c.u}.pdf`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgFileId = String(b.id ?? '');
    },
  },
  {
    module: 'Organización',
    endpoint: 'POST /identity/me/tenants/{tenantId}/verification',
    name: 'happy: pide que la plataforma la verifique, aportando evidencia',
    method: 'post',
    token: asOwner,
    // Pedirla es lo máximo que puede hacer: quien contrasta licencia y personería es la
    // plataforma. Auto-verificarse sería el agujero regulatorio que esto evita.
    path: (c) => `/identity/me/tenants/${c.vars.orgTenantId}/verification`,
    body: (c) => ({ evidenceFileId: c.vars.orgFileId }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgCaseId = String(b.id ?? b.caseId ?? '');
    },
  },
  {
    module: 'Organización',
    endpoint: 'POST /admin/tenants/{tenantId}/verification',
    name: 'límite: el owner no puede verificar su propia organización',
    method: 'post',
    token: asOwner,
    // El endpoint administrativo existe, pero es de la plataforma. Que el owner lo alcance
    // sería auto-verificación con otro nombre.
    path: (c) => `/admin/tenants/${c.vars.orgTenantId}/verification`,
    body: () => ({}),
    expectedStatus: 403,
  },
  {
    module: 'Organización',
    endpoint: 'POST /tenants/{tenantId}/branches',
    name: 'límite: mientras está pendiente no puede abrir sedes',
    method: 'post',
    token: asOwner,
    // El ciclo real: la organización nace PENDING y puede prepararse —entrar, subir su
    // documentación, pedir la verificación— pero no operar. Abrir una sede es operar.
    path: (c) => `/tenants/${c.vars.orgTenantId}/branches`,
    body: (c) => ({ code: `SEDE-PEND-${c.u}`, name: 'Sede prematura' }),
    expectedStatus: 422,
    expectedCode: 'PRECONDITION_FAILED',
  },
  {
    module: 'Organización',
    endpoint: 'POST /admin/tenants/{tenantId}/verification',
    name: 'setup: la plataforma la verifica y queda activa',
    method: 'post',
    // Con el token de administrador, no con el del owner: es el acto que el smoke de
    // organización comprueba que el owner NO puede hacer por su cuenta.
    path: (c) => `/admin/tenants/${c.vars.orgTenantId}/verification`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Organización',
    endpoint: 'POST /tenants/{tenantId}/branches',
    name: 'happy: abre su primera sede',
    method: 'post',
    token: asOwner,
    path: (c) => `/tenants/${c.vars.orgTenantId}/branches`,
    body: (c) => ({
      code: `SEDE-${c.u}`,
      name: 'Sede Central',
      branchType: 'CLINIC',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgBranchId = String(b.id ?? '');
    },
  },
  {
    module: 'Organización',
    endpoint: 'POST /iam/users',
    name: 'setup: la cuenta de un empleado',
    method: 'post',
    path: (c) => '/iam/users',
    body: (c) => ({
      displayName: 'Empleado Smoke',
      email: `empleado-${c.u}@example.test`,
      password: 'S3cret-passw0rd',
      initialRole: 'USER',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgStaffUserId = String(b.id ?? '');
    },
  },
  {
    module: 'Organización',
    endpoint: 'POST /tenants/{tenantId}/memberships',
    name: 'happy: incorpora al empleado a la organización',
    method: 'post',
    token: asOwner,
    path: (c) => `/tenants/${c.vars.orgTenantId}/memberships`,
    body: (c) => ({
      userId: c.vars.orgStaffUserId,
      role: 'STAFF',
      accessScope: 'ALL_TENANT',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgStaffMembershipId = String(b.id ?? '');
    },
  },
  {
    module: 'Organización',
    endpoint: 'PATCH /tenants/{tenantId}/memberships/{membershipId}/role',
    name: 'happy: lo asciende a ADMIN de la organización',
    method: 'patch',
    token: asOwner,
    path: (c) =>
      `/tenants/${c.vars.orgTenantId}/memberships/${c.vars.orgStaffMembershipId}/role`,
    body: () => ({ role: 'ADMIN' }),
    expectedStatus: 200,
  },
  {
    module: 'Organización',
    endpoint: 'PATCH /tenants/{tenantId}/memberships/{membershipId}/role',
    name: 'límite: un cambio de rol vacío no es un cambio',
    method: 'patch',
    token: asOwner,
    path: (c) =>
      `/tenants/${c.vars.orgTenantId}/memberships/${c.vars.orgStaffMembershipId}/role`,
    body: () => ({}),
    expectedStatus: 422,
  },
  {
    module: 'Organización',
    endpoint: 'POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments',
    name: 'happy: lo asigna a la sede',
    method: 'post',
    token: asOwner,
    path: (c) =>
      `/tenants/${c.vars.orgTenantId}/memberships/${c.vars.orgStaffMembershipId}/branch-assignments`,
    body: (c) => ({ branchId: c.vars.orgBranchId }),
    expectedStatus: 201,
  },


  // --- 5. Baja lógica de una persona: offboard, no borrado ----------------
  {
    module: 'Organización',
    endpoint: 'POST /tenants/{tenantId}/memberships/{membershipId}/offboard',
    name: 'happy: da de baja al empleado (la membresía sobrevive)',
    method: 'post',
    token: asOwner,
    // La fila no se borra: de ella cuelga qué pudo ver esa persona y cuándo, que es lo que
    // se audita cuando alguien pregunta quién accedió a un historial.
    path: (c) =>
      `/tenants/${c.vars.orgTenantId}/memberships/${c.vars.orgStaffMembershipId}/offboard`,
    expectedStatus: 200,
  },
  {
    module: 'Organización',
    endpoint: 'POST /tenants/{tenantId}/memberships/{membershipId}/offboard',
    name: 'límite: dar de baja dos veces no vuelve a pasar',
    method: 'post',
    token: asOwner,
    path: (c) =>
      `/tenants/${c.vars.orgTenantId}/memberships/${c.vars.orgStaffMembershipId}/offboard`,
    expectedStatus: 422,
  },

  // --- 6. Aislamiento: lo ajeno no se toca --------------------------------
  {
    module: 'Organización',
    endpoint: 'POST /tenants/{tenantId}/branches',
    name: 'límite: no puede abrir una sede en el tenant de otro',
    method: 'post',
    token: asOwner,
    // El aislamiento entre organizaciones es la garantía central del multi-tenant: si esto
    // devolviera 201, una organización estaría escribiendo en la de al lado.
    path: (c) => `/tenants/${c.tenantId}/branches`,
    body: (c) => ({ code: `INTRUSA-${c.u}`, name: 'Sede intrusa' }),
    expectedStatus: 403,
  },

  // --- 7. Cierre de sesión ------------------------------------------------
  {
    module: 'Organización',
    endpoint: 'POST /iam/auth/logout',
    name: 'happy: el owner cierra su sesión',
    method: 'post',
    token: asOwner,
    path: () => '/iam/auth/logout',
    body: (c) => ({ refreshToken: c.vars.orgRefreshToken }),
    expectedStatus: 200,
  },
];
