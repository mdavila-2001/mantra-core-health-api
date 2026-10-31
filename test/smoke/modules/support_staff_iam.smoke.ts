import type { SmokeCase, SmokeCtx } from '../smoke-kit';
import { DIR } from '../../../src/modules/directory/directory.concepts';
import { ADMIN_STEP_UP, PASSWORD, admin, must } from './support_staff.kit';
import { asDoctor } from './support_staff_flows.smoke';

/**
 * Tramos de cuenta, sesión y afiliación que acompañan al recorrido del personal
 * de apoyo: la membresía nace PENDIENTE y la lista la propia persona, el
 * segundo factor (token de alcance limitado y reautenticación), la IP que ve el
 * servidor, el bloqueo al quinto intento fallido, que cerrar un vínculo de apoyo
 * no cierra la membresía de un empleado normal y el QR de doctor multiuso.
 *
 * Cada persona nueva se crea por HTTP con su correo único por corrida; lo único
 * que no pasa por HTTP es lo que `support_staff_flows.smoke.ts` ya declara.
 */

/** Correo de una persona del tramo (`tag` la distingue). */
const mail = (tag: string, c: SmokeCtx): string => `${tag}-${c.u}@example.test`;

/** Token guardado en `vars[key]`. */
const tokenOf =
  (key: string) =>
  (c: SmokeCtx): string | undefined =>
    c.vars[key];

/** La administración crea la cuenta de la persona `tag`. */
const createAccount = (tag: string, name: string): SmokeCase =>
  admin({
    endpoint: 'POST /iam/users',
    name: `setup: cuenta de ${name}`,
    method: 'post',
    path: () => '/iam/users',
    body: (c) => ({
      displayName: name,
      email: mail(tag, c),
      password: PASSWORD,
      timeZone: 'America/La_Paz',
      initialRole: 'USER',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars[`${tag}UserId`] = String(b.id ?? '');
    },
  });

/** Inicio de sesión de la persona `tag`; guarda su token en `${tag}Token`. */
const login = (
  tag: string,
  name: string,
  extra: Partial<SmokeCase> = {},
): SmokeCase => ({
  module: 'PersonalDeApoyo',
  endpoint: 'POST /iam/auth/login',
  name,
  method: 'post',
  auth: false,
  path: () => '/iam/auth/login',
  body: (c) => ({ email: mail(tag, c), password: PASSWORD }),
  expectedStatus: 200,
  capture: (b, c) => {
    c.vars[`${tag}Token`] = String(b.accessToken ?? '');
  },
  ...extra,
});

/** La organización incorpora a la persona `tag` como empleado (nace pendiente). */
const invite = (tag: string, name: string): SmokeCase =>
  admin({
    endpoint: 'POST /tenants/{tenantId}/memberships',
    name: `setup: la organización incorpora a ${name} (nace pendiente)`,
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/memberships`,
    body: (c) => ({ userId: c.vars[`${tag}UserId`], role: 'STAFF' }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars[`${tag}MembershipId`] = String(b.id ?? '');
    },
  });

/** La persona `tag` acepta su membresía pendiente. */
const accept = (tag: string, name: string): SmokeCase => ({
  module: 'PersonalDeApoyo',
  endpoint: 'POST /tenants/me/membership-invitations/{membershipId}/accept',
  name: `setup: ${name} acepta su membresía`,
  method: 'post',
  token: tokenOf(`${tag}Token`),
  path: (c) =>
    `/tenants/me/membership-invitations/${c.vars[`${tag}MembershipId`]}/accept`,
  expectedStatus: 200,
});

/** Política del personal con el segundo factor encendido o apagado. */
const mfaPolicy = (name: string, requireMfa: boolean): SmokeCase =>
  admin({
    endpoint: 'PUT /org/session-policies',
    name,
    method: 'put',
    path: () => '/org/session-policies',
    body: () => ({
      policies: [
        {
          // ALL_ACCOUNTS: Marta solo tiene rol de empleada de la organización, que
          // ORG_STAFF no cuenta como personal (quien tiene algún rol más allá de USER).
          scope: 'ALL_ACCOUNTS',
          idleTimeoutMinutes: 30,
          newDeviceAlert: false,
          enforceIpRules: false,
          requireMfa,
        },
      ],
    }),
    expectedStatus: 200,
  });

/** Quién ve el servidor, el segundo factor con reautenticación y el bloqueo por intentos. */
export const SUPPORT_ACCOUNT_SECURITY: SmokeCase[] = [
  {
    module: 'PersonalDeApoyo',
    endpoint: 'GET /iam/me/network',
    name: 'red: la persona ve la IP con la que la ve el servidor (para no escribir reglas con otra red)',
    method: 'get',
    token: asDoctor,
    path: () => '/iam/me/network',
    expectedStatus: 200,
    capture: (b) => {
      must(
        typeof b.ip === 'string' && b.ip.length > 0,
        'debía devolver la IP que ve el servidor',
      );
      must(
        b.family === 'ipv4' || b.family === 'ipv6',
        'debía decir la familia de la IP',
      );
    },
  },
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /iam/me/mfa/totp',
    name: 'segundo factor: dar de alta un factor sin reautenticarse → 422 MFA_REAUTH_REQUIRED',
    method: 'post',
    token: asDoctor,
    path: () => '/iam/me/mfa/totp',
    body: () => ({ label: 'Teléfono personal' }),
    expectedStatus: 422,
    expectedReason: 'MFA_REAUTH_REQUIRED',
  },
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /iam/me/mfa/totp',
    name: 'segundo factor: con su contraseña actual empieza el alta del factor → 201',
    method: 'post',
    token: asDoctor,
    path: () => '/iam/me/mfa/totp',
    body: () => ({ label: 'Teléfono personal', currentPassword: PASSWORD }),
    expectedStatus: 201,
  },

  // --- El quinto intento fallido bloquea la cuenta, sin 500 ------------------
  createAccount('supLock', 'Lucas Bloqueo'),
  ...[1, 2, 3, 4, 5].map((n): SmokeCase => ({
    module: 'PersonalDeApoyo',
    endpoint: 'POST /iam/auth/login',
    name: `bloqueo: contraseña incorrecta ${n} de 5 → 401${n === 5 ? ' (la cuenta se bloquea, sin 500)' : ''}`,
    method: 'post',
    auth: false,
    path: () => '/iam/auth/login',
    body: (c) => ({ email: mail('supLock', c), password: 'Incorrecta-1!' }),
    expectedStatus: 401,
  })),
  login(
    'supLock',
    'bloqueo: bloqueada, ni con la contraseña buena entra → 401',
    {
      expectedStatus: 401,
      capture: undefined,
    },
  ),

  // --- La membresía creada por la organización nace pendiente ----------------
  createAccount('supMarta', 'Marta Plantilla'),
  invite('supMarta', 'Marta'),
  login('supMarta', 'setup: Marta inicia sesión'),
  {
    module: 'PersonalDeApoyo',
    endpoint: 'GET /tenants/me/membership-invitations',
    name: 'membresía pendiente: la persona la ve en su lista de invitaciones',
    method: 'get',
    token: tokenOf('supMartaToken'),
    path: () => '/tenants/me/membership-invitations',
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b.items as { id: string }[]) ?? [];
      must(
        items.some((i) => i.id === c.vars.supMartaMembershipId),
        'la invitación pendiente debía figurar en la lista de la persona',
      );
    },
  },
  admin({
    endpoint: 'GET /tenants/{tenantId}/memberships',
    name: 'membresía pendiente: mientras no la acepta no figura entre los miembros activos',
    method: 'get',
    path: (c) =>
      `/tenants/${c.tenantId}/memberships?status=${DIR.MEMBERSHIP_ACTIVE}&limit=100`,
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b.items as { userId: string }[]) ?? [];
      must(
        !items.some((m) => m.userId === c.vars.supMartaUserId),
        'una membresía pendiente no debía contar como activa',
      );
    },
  }),
  accept('supMarta', 'Marta'),

  // --- Segundo factor exigido: token de alcance limitado ---------------------
  mfaPolicy('segundo factor: la política del personal lo exige', true),
  login(
    'supMarta',
    'segundo factor: sin factor dado de alta entra con alcance limitado y se le avisa',
    {
      capture: (b, c) => {
        c.vars.supMartaLimitedToken = String(b.accessToken ?? '');
        const denied = (b.deniedTenants as { reason: string }[]) ?? [];
        must(
          b.mfaEnrollmentRequired === true,
          'el login debía avisar mfaEnrollmentRequired',
        );
        must(
          denied.some((d) => d.reason === 'MFA_ENROLLMENT_REQUIRED'),
          'la organización debía figurar en deniedTenants con MFA_ENROLLMENT_REQUIRED',
        );
      },
    },
  ),
  {
    module: 'PersonalDeApoyo',
    endpoint: 'GET /tenants/me',
    name: 'segundo factor: con el token limitado, fuera de /iam/me/mfa* → 403 MFA_ENROLLMENT_REQUIRED',
    method: 'get',
    token: tokenOf('supMartaLimitedToken'),
    path: () => '/tenants/me',
    expectedStatus: 403,
    expectedReason: 'MFA_ENROLLMENT_REQUIRED',
  },
  {
    module: 'PersonalDeApoyo',
    endpoint: 'GET /iam/me/mfa',
    name: 'segundo factor: con el token limitado sí ve sus factores (/iam/me/mfa*) → 200',
    method: 'get',
    token: tokenOf('supMartaLimitedToken'),
    path: () => '/iam/me/mfa',
    expectedStatus: 200,
  },
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /iam/me/mfa/totp',
    name: 'segundo factor: con el token limitado, sin reautenticarse → 422 MFA_REAUTH_REQUIRED',
    method: 'post',
    token: tokenOf('supMartaLimitedToken'),
    path: () => '/iam/me/mfa/totp',
    body: () => ({}),
    expectedStatus: 422,
    expectedReason: 'MFA_REAUTH_REQUIRED',
  },
  mfaPolicy('segundo factor: se deja la política sin exigirlo', false),
];

/** Cerrar un vínculo de apoyo no cierra la membresía de quien además es empleado. */
export const SUPPORT_ENGAGEMENT_KEEPS_STAFF_MEMBERSHIP: SmokeCase[] = [
  createAccount('supEva', 'Eva Empleada'),
  invite('supEva', 'Eva'),
  login('supEva', 'setup: Eva inicia sesión'),
  accept('supEva', 'Eva'),
  login('supEva', 'setup: Eva vuelve a iniciar sesión con la organización'),
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /support-engagement-requests',
    name: 'vínculo de apoyo de una empleada: pide ser secretaria de toda la organización → 201',
    method: 'post',
    token: tokenOf('supEvaToken'),
    path: () => '/support-engagement-requests',
    body: (c) => ({
      tenantId: c.tenantId,
      roleTemplateCode: 'SECRETARY',
      items: [{ targetKind: 'ALL' }],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supEvaRequestId = String(b.id ?? '');
    },
  },
  admin({
    endpoint: 'GET /org/support-engagement-requests',
    name: 'vínculo de apoyo de una empleada: la administración ve su solicitud',
    method: 'get',
    path: () => '/org/support-engagement-requests?status=PENDING',
    expectedStatus: 200,
    capture: (b, c) => {
      const items =
        (b.items as { id: string; items: { id: string }[] }[]) ?? [];
      const mine = items.find((r) => r.id === c.vars.supEvaRequestId);
      c.vars.supEvaItemId = mine?.items[0]?.id ?? '';
      must(!!c.vars.supEvaItemId, 'la solicitud debía traer su ítem');
    },
  }),
  ADMIN_STEP_UP,
  admin({
    endpoint: 'POST /org/support-engagement-requests/{id}/decision',
    name: 'vínculo de apoyo de una empleada: la administración lo aprueba',
    method: 'post',
    path: (c) =>
      `/org/support-engagement-requests/${c.vars.supEvaRequestId}/decision`,
    body: (c) => ({
      items: [{ itemId: c.vars.supEvaItemId, decision: 'APPROVED' }],
    }),
    expectedStatus: 200,
    capture: (b, c) => {
      c.vars.supEvaEngagementId = String(b.engagementId ?? '');
    },
  }),
  admin({
    endpoint: 'POST /org/support-engagements/{id}/end',
    name: 'vínculo de apoyo de una empleada: se termina el vínculo',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.supEvaEngagementId}/end`,
    body: () => ({ reason: 'Fin del apoyo' }),
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'GET /tenants/{tenantId}/memberships',
    name: 'vínculo de apoyo de una empleada: cerrar el vínculo NO cierra su membresía de empleada',
    method: 'get',
    path: (c) =>
      `/tenants/${c.tenantId}/memberships?status=${DIR.MEMBERSHIP_ACTIVE}&limit=100`,
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b.items as { userId: string }[]) ?? [];
      must(
        items.some((m) => m.userId === c.vars.supEvaUserId),
        'la membresía de empleada debía seguir activa tras terminar el vínculo de apoyo',
      );
    },
  }),
];

/** Un doctor nuevo: cuenta, rol PRACTITIONER, perfil profesional y su vínculo con la cuenta. */
const newDoctor = (tag: string, name: string): SmokeCase[] => [
  createAccount(tag, name),
  admin({
    endpoint: 'POST /iam/users/{id}/global-roles',
    name: `setup: ${name} recibe el rol PRACTITIONER`,
    method: 'post',
    path: (c) => `/iam/users/${c.vars[`${tag}UserId`]}/global-roles`,
    body: () => ({ role: 'PRACTITIONER', action: 'GRANT' }),
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'POST /profiles/practitioners',
    name: `setup: perfil profesional de ${name}`,
    method: 'post',
    path: () => '/profiles/practitioners',
    body: (c) => ({
      practitionerCode: `HP-${tag}-${c.u}`,
      displayName: name,
      licenseNumber: `LIC-${tag}-${c.u}`,
      credentialNumber: `CR-${tag}-${c.u}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars[`${tag}ProfileId`] = String(b.profileId ?? '');
    },
  }),
  admin({
    endpoint: 'POST /profiles/persons/{personId}/account-links',
    name: `setup: la cuenta de ${name} se vincula con su perfil profesional`,
    method: 'post',
    path: (c) => `/profiles/persons/${c.vars[`${tag}ProfileId`]}/account-links`,
    body: (c) => ({ userId: c.vars[`${tag}UserId`] }),
    expectedStatus: 201,
  }),
  login(tag, `setup: ${name} inicia sesión`),
];

/** Canjea el código de doctor multiuso y deja la solicitud pendiente de la práctica. */
const redeem = (tag: string, name: string): SmokeCase => ({
  module: 'PersonalDeApoyo',
  endpoint: 'POST /affiliation-invitations/redeem',
  name: `QR de doctor: ${name} canjea el código multiuso y queda una solicitud pendiente (no afilia sola)`,
  method: 'post',
  token: tokenOf(`${tag}Token`),
  path: () => '/affiliation-invitations/redeem',
  body: (c) => ({ code: c.vars.supDocQrCode }),
  expectedStatus: 200,
  capture: (b, c) => {
    must(
      b.pendingApproval === true && typeof b.roleAssignmentId === 'string',
      'el canje debía dejar una solicitud pendiente de aprobación',
    );
    must(
      b.membershipId === undefined,
      'un código multiuso no debía afiliar solo',
    );
    c.vars[`${tag}RoleId`] = String(b.roleAssignmentId);
  },
});

/** La organización ve la solicitud pendiente de la práctica. */
const listPending = (tag: string, name: string): SmokeCase =>
  admin({
    endpoint: 'GET /practices/{practiceId}/role-assignments',
    name: `QR de doctor: la organización ve la solicitud de ${name} en la lista de la práctica`,
    method: 'get',
    // La solicitud cae en la práctica activa de la organización: aquí la única del recorrido.
    path: (c) => `/practices/${c.vars.pracPracticeId}/role-assignments`,
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b.items as { id: string }[]) ?? [];
      must(
        items.some((i) => i.id === c.vars[`${tag}RoleId`]),
        'la solicitud debía figurar en GET /practices/:id/role-assignments',
      );
    },
  });

/** ¿La membresía del doctor está en el estado dado? */
const membershipIs = (
  tag: string,
  name: string,
  statusConceptId: string,
  expected: boolean,
): SmokeCase =>
  admin({
    endpoint: 'GET /tenants/{tenantId}/memberships',
    name: `QR de doctor: la membresía de ${name} ${expected ? 'queda' : 'no queda'} en ese estado`,
    method: 'get',
    path: (c) =>
      `/tenants/${c.tenantId}/memberships?status=${statusConceptId}&limit=100`,
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b.items as { userId: string }[]) ?? [];
      must(
        items.some((m) => m.userId === c.vars[`${tag}UserId`]) === expected,
        `la membresía de ${name} ${expected ? 'debía estar' : 'no debía estar'} en ese estado`,
      );
    },
  });

/** QR de doctor multiuso sin destino: la organización aprueba (activa la membresía) o rechaza (la termina). */
export const SUPPORT_DOCTOR_QR: SmokeCase[] = [
  ...newDoctor('supDocB', 'Dr. Beto Aprobado'),
  ...newDoctor('supDocC', 'Dra. Carla Rechazada'),
  admin({
    endpoint: 'POST /org/affiliation-invitations',
    name: 'QR de doctor: crea un código multiuso sin persona destino',
    method: 'post',
    path: () => '/org/affiliation-invitations',
    body: () => ({ kind: 'PRACTITIONER', maxUses: 3 }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supDocQrCode = String(b.code ?? '');
    },
  }),
  redeem('supDocB', 'Beto'),
  listPending('supDocB', 'Beto'),
  membershipIs(
    'supDocB',
    'Beto (antes de aprobar)',
    DIR.MEMBERSHIP_ACTIVE,
    false,
  ),
  admin({
    endpoint: 'POST /role-assignments/{roleId}/approve',
    name: 'QR de doctor: la organización aprueba la solicitud',
    method: 'post',
    path: (c) => `/role-assignments/${c.vars.supDocBRoleId}/approve`,
    body: () => ({}),
    expectedStatus: 200,
  }),
  membershipIs('supDocB', 'Beto (aprobado)', DIR.MEMBERSHIP_ACTIVE, true),
  redeem('supDocC', 'Carla'),
  admin({
    endpoint: 'POST /role-assignments/{roleId}/reject',
    name: 'QR de doctor: la organización rechaza la solicitud',
    method: 'post',
    path: (c) => `/role-assignments/${c.vars.supDocCRoleId}/reject`,
    body: () => ({ reason: 'No es parte del equipo' }),
    expectedStatus: 200,
  }),
  membershipIs('supDocC', 'Carla (rechazada)', DIR.MEMBERSHIP_ACTIVE, false),
  membershipIs('supDocC', 'Carla (rechazada)', DIR.MEMBERSHIP_ENDED, true),
];
