import { randomUUID } from 'node:crypto';
import type { SmokeCase, SmokeCtx } from '../smoke-kit';
import { CONCEPTS } from '../../../src/common';
import { COMM } from '../../../src/modules/community/community.concepts';
import {
  PASSWORD,
  admin,
  agendaRange,
  email,
  futureAt,
  must,
  person,
  scoped,
} from './support_staff.kit';

/**
 * Tramos del recorrido del personal de apoyo que `support_staff.smoke.ts`
 * intercala en su orden: aceptación del doctor antes de que un permiso rija,
 * bandeja de mensajes, red y dispositivo nuevo en el login, recertificación,
 * citas intactas tras el fin de vínculo y canje de un código de varios usos.
 *
 * Suposiciones del fixture, dichas aquí para que nadie las lea como HTTP probado:
 *
 * - El doctor del recorrido (`practitionerProfileId`) lo creó `profiles.smoke` sin
 *   cuenta: `SUPPORT_DOCTOR_SESSION` le da una por HTTP (cuenta, rol global
 *   PRACTITIONER, vínculo con su perfil y membresía aceptada) para que acepte con SU
 *   token (`POST /practitioner-delegates/{id}/accept`, `SUPPORT_DOCTOR_ACCEPTANCE`).
 * - La conversación «tomada por otra persona» se deja en `setup` con una fila de
 *   `community.conversation_assignments` a nombre del administrador: crear una
 *   segunda persona de apoyo completa (solicitud, aprobación, aceptación) no
 *   agrega nada a lo que este caso prueba.
 * - Los pacientes de la bandeja son perfiles públicos de usuario a nombre del
 *   administrador (el único actor que puede escribir por ellos en el smoke).
 */

/** Perfil público del paciente `n` de la bandeja. */
const patientProfile = (n: number): SmokeCase =>
  admin({
    endpoint: 'POST /community/public-profiles',
    name: `setup: perfil público del paciente ${n} de la bandeja`,
    method: 'post',
    path: () => '/community/public-profiles',
    body: (c) => ({
      tenantId: c.tenantId,
      targetId: c.adminUserId,
      slug: `sup-pac${n}-${c.u}`,
      displayName: `Paciente apoyo ${n}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars[`supPatProfile${n}`] = String(b.id ?? '');
    },
  });

/** Conversación directa entre el paciente `n` y el doctor. */
const conversation = (n: number): SmokeCase =>
  admin({
    endpoint: 'POST /community/conversations',
    name: `setup: conversación ${n} del paciente con el doctor`,
    method: 'post',
    path: () => '/community/conversations',
    body: (c) => ({
      participantProfileIds: [
        c.vars[`supPatProfile${n}`],
        c.vars.supDocProfileId,
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars[`supConv${n}`] = String(b.id ?? '');
    },
  });

/** Mensaje del paciente `n` en su conversación. */
const patientMessage = (n: number, bodyText: string): SmokeCase =>
  admin({
    endpoint: 'POST /community/conversations/{conversationId}/messages',
    name: `setup: el paciente ${n} escribe`,
    method: 'post',
    path: (c) => `/community/conversations/${c.vars[`supConv${n}`]}/messages`,
    body: (c) => ({
      senderProfileId: c.vars[`supPatProfile${n}`],
      bodyText,
    }),
    expectedStatus: 201,
  });

/** Responder en nombre del doctor, con su perfil público como remitente. */
const replyForDoctor = (
  n: number,
  name: string,
  expectedStatus: number,
  expectedReason?: string,
): SmokeCase =>
  scoped({
    endpoint: 'POST /community/conversations/{conversationId}/messages',
    name,
    method: 'post',
    path: (c) => `/community/conversations/${c.vars[`supConv${n}`]}/messages`,
    body: (c) => ({
      senderProfileId: c.vars.supDocProfileId,
      onBehalfOfProfileId: c.vars.supDocProfileId,
      bodyText: 'Con gusto le ayudamos, indíquenos el día que prefiere.',
    }),
    expectedStatus,
    ...(expectedReason ? { expectedReason } : {}),
  });

/** Tomar la conversación `n` desde la bandeja. */
const take = (
  n: number,
  name: string,
  expectedStatus: number,
  extra: Partial<SmokeCase> = {},
): SmokeCase =>
  person({
    endpoint: 'POST /community/conversations/{conversationId}/assignment',
    name,
    method: 'post',
    path: (c) => `/community/conversations/${c.vars[`supConv${n}`]}/assignment`,
    body: () => ({ action: 'TAKE' }),
    expectedStatus,
    ...extra,
  });

/** Conversaciones del doctor con sus pacientes: lo que la bandeja muestra. */
export const SUPPORT_INBOX_FIXTURE: SmokeCase[] = [
  admin({
    endpoint: 'POST /community/public-profiles',
    name: 'setup: perfil público del doctor (el remitente de las respuestas del equipo)',
    method: 'post',
    path: () => '/community/public-profiles',
    body: (c) => ({
      tenantId: c.tenantId,
      targetId: c.vars.practitionerProfileId,
      targetType: 'PRACTITIONER',
      slug: `sup-doc-${c.u}`,
      displayName: 'Dr. Smoke de apoyo',
      visibility: 'PUBLIC',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supDocProfileId = String(b.id ?? '');
    },
  }),
  patientProfile(1),
  conversation(1),
  patientMessage(1, 'Buenos días, quisiera cambiar el horario de mi cita.'),
  patientProfile(2),
  conversation(2),
  patientMessage(2, 'Tengo fiebre y dolor de cabeza desde ayer, ¿qué tomo?'),
  patientProfile(3),
  conversation(3),
  patientMessage(3, 'Buenas tardes, ¿atienden los sábados?'),
];

/** Token del doctor del recorrido, capturado en su login. */
export const asDoctor = (c: SmokeCtx): string | undefined => c.vars.supDocToken;

/** Correo de la cuenta del doctor del recorrido. */
const doctorEmail = (c: SmokeCtx): string => `doctor-apoyo-${c.u}@example.test`;

/** Caso del propio doctor, con su token y la organización activa (X-Tenant-Id). */
export const doctor = (
  caso: Omit<SmokeCase, 'module' | 'token' | 'tenantScoped'>,
): SmokeCase => ({
  module: 'PersonalDeApoyo',
  token: asDoctor,
  tenantScoped: true,
  ...caso,
});

/** Inicio de sesión del doctor; deja su token en `supDocToken`. */
export const doctorLogin = (name: string): SmokeCase => ({
  module: 'PersonalDeApoyo',
  endpoint: 'POST /iam/auth/login',
  name,
  method: 'post',
  auth: false,
  path: () => '/iam/auth/login',
  body: (c) => ({ email: doctorEmail(c), password: PASSWORD }),
  expectedStatus: 200,
  capture: (b, c) => {
    c.vars.supDocToken = String(b.accessToken ?? '');
  },
});

/**
 * Una sesión para el doctor del recorrido, solo por HTTP: la cuenta, el rol global
 * PRACTITIONER, el vínculo cuenta ↔ su perfil profesional y la membresía de la
 * organización, que él mismo acepta (nace pendiente). Se inicia sesión DESPUÉS de
 * aceptarla para que el token traiga la organización.
 */
export const SUPPORT_DOCTOR_SESSION: SmokeCase[] = [
  admin({
    endpoint: 'POST /iam/users',
    name: 'setup: la administración crea la cuenta del doctor del recorrido',
    method: 'post',
    path: () => '/iam/users',
    body: (c) => ({
      displayName: 'Dr. Smoke de apoyo',
      email: doctorEmail(c),
      password: PASSWORD,
      timeZone: 'America/La_Paz',
      initialRole: 'USER',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supDocUserId = String(b.id ?? '');
    },
  }),
  admin({
    endpoint: 'POST /iam/users/{id}/global-roles',
    name: 'setup: la cuenta del doctor recibe el rol PRACTITIONER',
    method: 'post',
    path: (c) => `/iam/users/${c.vars.supDocUserId}/global-roles`,
    body: () => ({ role: 'PRACTITIONER', action: 'GRANT' }),
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'POST /profiles/persons/{personId}/account-links',
    name: 'setup: la cuenta del doctor se vincula con su perfil profesional',
    method: 'post',
    path: (c) =>
      `/profiles/persons/${c.vars.practitionerProfileId}/account-links`,
    body: (c) => ({ userId: c.vars.supDocUserId }),
    expectedStatus: 201,
  }),
  admin({
    endpoint: 'POST /tenants/{tenantId}/memberships',
    name: 'setup: la organización incorpora al doctor (nace pendiente de su aceptación)',
    method: 'post',
    path: (c) => `/tenants/${c.tenantId}/memberships`,
    body: (c) => ({ userId: c.vars.supDocUserId, role: 'STAFF' }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supDocMembershipId = String(b.id ?? '');
    },
  }),
  doctorLogin('setup: el doctor inicia sesión (todavía sin la organización)'),
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /tenants/me/membership-invitations/{membershipId}/accept',
    name: 'setup: el doctor acepta su membresía',
    method: 'post',
    token: asDoctor,
    path: (c) =>
      `/tenants/me/membership-invitations/${c.vars.supDocMembershipId}/accept`,
    expectedStatus: 200,
  },
  doctorLogin(
    'setup: el doctor vuelve a iniciar sesión (el token ya trae la organización)',
  ),
];

/**
 * La aceptación del doctor por HTTP, con su propia sesión: ve la delegación
 * PENDIENTE en su equipo, quien no es el doctor no la acepta, la acepta con
 * `POST /practitioner-delegates/{id}/accept` y su equipo la muestra ACTIVA y con
 * permiso para responder en su nombre.
 */
export const SUPPORT_DOCTOR_ACCEPTANCE: SmokeCase[] = [
  doctor({
    endpoint: 'GET /me/practitioner/support-team',
    name: 'aceptación: el doctor ve a la persona de apoyo pendiente de su aceptación',
    method: 'get',
    path: () => '/me/practitioner/support-team',
    expectedStatus: 200,
    capture: (b, c) => {
      const items =
        (b.items as {
          delegateId: string;
          engagementId: string;
          status: string;
          accepted: boolean;
        }[]) ?? [];
      const mine = items.find((i) => i.engagementId === c.vars.supEngagementId);
      must(!!mine, 'el equipo del doctor debía incluir a la persona de apoyo');
      must(
        mine!.status === 'PENDING_ACCEPTANCE' && mine!.accepted === false,
        'antes de aceptar, la delegación debía estar pendiente de aceptación',
      );
      c.vars.supDelegateId = mine!.delegateId;
    },
  }),
  scoped({
    endpoint: 'POST /practitioner-delegates/{id}/accept',
    name: 'aceptación: la persona de apoyo no se acepta a sí misma (no es el doctor) → 403',
    method: 'post',
    path: (c) => `/practitioner-delegates/${c.vars.supDelegateId}/accept`,
    body: () => ({ acceptsSupportClause: true, mayReplyOnBehalf: true }),
    expectedStatus: 403,
  }),
  doctor({
    endpoint: 'POST /practitioner-delegates/{id}/accept',
    name: 'aceptación: el doctor acepta a la persona con su propio token y le permite responder en su nombre',
    method: 'post',
    path: (c) => `/practitioner-delegates/${c.vars.supDelegateId}/accept`,
    body: () => ({
      acceptsSupportClause: true,
      mayReplyOnBehalf: true,
      replyDisclosure: 'SHOW',
    }),
    expectedStatus: 200,
    capture: (b) => {
      must(b.ok === true, 'aceptar debía responder { ok: true }');
    },
  }),
  doctor({
    endpoint: 'GET /me/practitioner/support-team',
    name: 'aceptación: el equipo del doctor la muestra ACTIVA, aceptada y con permiso para responder en su nombre',
    method: 'get',
    path: () => '/me/practitioner/support-team',
    expectedStatus: 200,
    capture: (b, c) => {
      const items =
        (b.items as {
          engagementId: string;
          status: string;
          accepted: boolean;
          mayReplyOnBehalf: boolean;
        }[]) ?? [];
      const mine = items.find((i) => i.engagementId === c.vars.supEngagementId);
      must(
        !!mine &&
          mine.status === 'ACTIVE' &&
          mine.accepted === true &&
          mine.mayReplyOnBehalf === true,
        'tras aceptar, la delegación debía estar ACTIVA, aceptada y con permiso de responder',
      );
    },
  }),
  doctor({
    endpoint: 'POST /practitioner-delegates/{id}/accept',
    name: 'aceptación: aceptar otra vez es idempotente → 200',
    method: 'post',
    path: (c) => `/practitioner-delegates/${c.vars.supDelegateId}/accept`,
    body: () => ({ acceptsSupportClause: true }),
    expectedStatus: 200,
  }),
];

/** Antes de que el doctor acepte, el permiso aprobado todavía no rige. */
export const SUPPORT_ACCEPTANCE_GATE: SmokeCase[] = [
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /iam/auth/login',
    name: 'happy: vuelve a iniciar sesión con el vínculo ya aprobado (el token trae el rol de apoyo y la organización)',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/login',
    body: (c) => ({ email: email(c), password: PASSWORD }),
    expectedStatus: 200,
    capture: (b, c) => {
      c.vars.supToken = String(b.accessToken ?? '');
    },
  },
  scoped({
    endpoint: 'POST /scheduling/appointments/direct',
    name: 'aceptación: con el permiso aprobado pero sin la aceptación del doctor, no crea citas → 403',
    method: 'post',
    path: () => '/scheduling/appointments/direct',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      resourceId: c.vars.schedResourceId,
      startAt: futureAt(c, 5),
      durationMinutes: 30,
    }),
    expectedStatus: 403,
  }),
  replyForDoctor(
    1,
    'aceptación: sin la aceptación del doctor no responde en su nombre → 403',
    403,
  ),
];

/** Bandeja: tomar, responder en nombre del doctor y derivar lo clínico. */
export const SUPPORT_INBOX_FLOW: SmokeCase[] = [
  person({
    endpoint: 'GET /me/support-inbox',
    name: 'bandeja: ve las conversaciones del doctor que la aceptó',
    method: 'get',
    path: (c) => `/me/support-inbox?tenantId=${c.tenantId}`,
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b.items as { conversationId: string }[]) ?? [];
      must(
        [1, 2, 3].every((n) =>
          items.some((i) => i.conversationId === c.vars[`supConv${n}`]),
        ),
        'la bandeja debía mostrar las tres conversaciones del doctor',
      );
    },
  }),
  take(
    1,
    'bandeja: toma una conversación administrativa → queda a su nombre',
    200,
    {
      capture: (b, c) => {
        must(
          b.status === 'TAKEN' && b.referredToDoctor === false,
          'tomar una conversación administrativa debía dejarla TAKEN sin derivar',
        );
        must(
          typeof b.assignedUserId === 'string' &&
            b.assignedUserId === c.vars.supUserId,
          'la conversación debía quedar a nombre de quien la tomó',
        );
      },
    },
  ),
  replyForDoctor(
    1,
    'bandeja: responde en nombre del doctor una vez aceptada → 201',
    201,
  ),
  replyForDoctor(
    2,
    'bandeja: un mensaje clínico sin derivar no lo responde el equipo → 422 CLINICAL_REQUIRES_DERIVATION',
    422,
    'CLINICAL_REQUIRES_DERIVATION',
  ),
  take(2, 'bandeja: tomar un mensaje clínico lo deriva al doctor', 200, {
    capture: (b) => {
      must(
        b.referredToDoctor === true && b.status === 'WAITING_DOCTOR',
        'tomar un mensaje clínico debía derivarlo al doctor (WAITING_DOCTOR)',
      );
    },
  }),
  person({
    endpoint: 'GET /me/support-inbox/{conversationId}',
    name: 'bandeja: sin acceso clínico temporal aprobado el detalle oculta el texto clínico del paciente',
    method: 'get',
    path: (c) => `/me/support-inbox/${c.vars.supConv2}`,
    expectedStatus: 200,
    capture: (b) => {
      const messages =
        (b.messages as { bodyText?: string; contentHidden?: boolean }[]) ?? [];
      must(messages.length > 0, 'el detalle debía traer los mensajes');
      must(
        messages.every((m) => !/fiebre/i.test(m.bodyText ?? '')) &&
          messages.some((m) => m.contentHidden === true),
        'el texto clínico no debía salir sin acceso temporal aprobado',
      );
    },
  }),
  take(
    3,
    'bandeja: una conversación que tiene otra persona no se toma → 409',
    409,
    {
      expectedReason: 'CONVERSATION_ALREADY_TAKEN',
      setup: async (c) => {
        await c.orm.em.getConnection().execute(
          `insert into community.conversation_assignments
             (id, tenant_id, conversation_id, practitioner_profile_id,
              assigned_user_id, status_concept_id, created_at, updated_at,
              row_version)
           values (?, ?, ?, ?, ?, ?, now(), now(), 1)`,
          [
            randomUUID(),
            c.tenantId,
            c.vars.supConv3,
            c.vars.practitionerProfileId,
            c.adminUserId,
            COMM.CONVERSATION_ASSIGNMENT_TAKEN,
          ],
        );
      },
    },
  ),
  replyForDoctor(
    3,
    'bandeja: tampoco responde la conversación de otra persona → 409 CONVERSATION_HELD_BY_OTHER',
    409,
    'CONVERSATION_HELD_BY_OTHER',
  ),
];

/** Reglas de red, política de sesión y aviso de dispositivo nuevo en el login. */
const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const SAFARI_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

/** Política del personal de la organización con la red y el aviso que pida cada caso. */
const staffPolicy = (enforceIpRules: boolean) => ({
  policies: [
    {
      scope: 'ORG_STAFF',
      idleTimeoutMinutes: 30,
      newDeviceAlert: true,
      enforceIpRules,
      requireMfa: false,
    },
  ],
});

/** Login de la persona de apoyo con un navegador dado (no reemplaza su token). */
const supportLogin = (
  name: string,
  headers: Record<string, string>,
  expectedStatus: number,
  capture?: SmokeCase['capture'],
): SmokeCase => ({
  module: 'PersonalDeApoyo',
  endpoint: 'POST /iam/auth/login',
  name,
  method: 'post',
  auth: false,
  path: () => '/iam/auth/login',
  headers: () => headers,
  body: (c) => ({ email: email(c), password: PASSWORD }),
  expectedStatus,
  ...(capture ? { capture } : {}),
});

/** Reglas de la oficina más la red desde la que corre el smoke (la del administrador). */
const OFFICE_AND_SMOKE_RULES = {
  rules: [
    { type: 'ALLOW', cidr: '203.0.113.0/24', description: 'Oficina' },
    { type: 'ALLOW', cidr: '127.0.0.0/8', description: 'Smoke (IPv4)' },
    { type: 'ALLOW', cidr: '::1/128', description: 'Smoke (IPv6)' },
  ],
};

export const SUPPORT_NETWORK_AND_DEVICE: SmokeCase[] = [
  // El doctor pertenece a DOS organizaciones: la del recorrido y una propia que
  // aprovisiona la plataforma con él de OWNER. Lo que una niega no le cierra la otra.
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /admin/tenants',
    name: 'dos organizaciones: la plataforma aprovisiona una segunda organización con el doctor de dueño',
    method: 'post',
    path: () => '/admin/tenants',
    body: (c) => ({
      code: `SUP-T2-${c.u}`,
      legalName: `Consultorio del doctor ${c.u}`,
      tenantType: 'MEDICAL_OFFICE',
      countryConceptId: CONCEPTS.STATE_ACTIVE,
      jurisdictionConceptId: CONCEPTS.STATE_ACTIVE,
      ownerUserId: c.vars.supDocUserId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.supTenant2Id = String(b.id ?? b.tenantId ?? '');
    },
  },
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /admin/tenants/{tenantId}/verification',
    name: 'dos organizaciones: la plataforma la verifica y queda activa',
    method: 'post',
    path: (c) => `/admin/tenants/${c.vars.supTenant2Id}/verification`,
    body: () => ({}),
    expectedStatus: 200,
  },
  admin({
    endpoint: 'PUT /org/ip-access-rules',
    name: 'red: no se guarda un conjunto de reglas que deja fuera a quien lo define → 422 IP_RULES_WOULD_LOCK_OUT_ACTOR',
    method: 'put',
    path: () => '/org/ip-access-rules',
    body: () => ({
      rules: [
        { type: 'ALLOW', cidr: '203.0.113.0/24', description: 'Oficina' },
      ],
    }),
    expectedStatus: 422,
    expectedReason: 'IP_RULES_WOULD_LOCK_OUT_ACTOR',
  }),
  admin({
    endpoint: 'PUT /org/ip-access-rules',
    name: 'red: con la red del administrador también permitida el conjunto se guarda → 200',
    method: 'put',
    path: () => '/org/ip-access-rules',
    body: () => OFFICE_AND_SMOKE_RULES,
    expectedStatus: 200,
  }),
  admin({
    endpoint: 'PUT /org/session-policies',
    name: 'red: la política del personal exige las reglas de red',
    method: 'put',
    path: () => '/org/session-policies',
    body: () => staffPolicy(true),
    expectedStatus: 200,
  }),
  {
    ...supportLogin(
      'red: desde fuera del rango se rechaza aunque X-Forwarded-For no confiable diga que viene de la oficina → 401 OUTSIDE_ALLOWED_NETWORK',
      { 'User-Agent': CHROME_WINDOWS, 'X-Forwarded-For': '203.0.113.9' },
      401,
      (b) => {
        const details = (b.details ?? {}) as { reason?: string };
        must(
          details.reason === 'OUTSIDE_ALLOWED_NETWORK',
          'el rechazo debía decir OUTSIDE_ALLOWED_NETWORK',
        );
      },
    ),
    // La guarda anti-encierro impide dejar por HTTP «solo la oficina» mientras
    // el administrador entra desde la misma máquina que la persona: la regla se
    // deja así por SQL, y la siguiente restituye las dos redes por HTTP.
    setup: async (c) => {
      await c.orm.em.getConnection().execute(
        `update authz.ip_access_rules
            set status_concept_id = ?
          where tenant_id = ? and status_concept_id = ?
            and cidr in ('127.0.0.0/8', '::1/128')`,
        [CONCEPTS.STATE_REVOKED, c.tenantId, CONCEPTS.STATE_ACTIVE],
      );
    },
  },
  {
    ...doctorLogin(
      'dos organizaciones: una niega por red y el doctor entra igual a la otra (deniedTenants)',
    ),
    headers: () => ({ 'User-Agent': CHROME_WINDOWS }),
    capture: (b, c) => {
      const denied =
        (b.deniedTenants as { tenantId: string; reason: string }[]) ?? [];
      if (
        !denied.some(
          (d) =>
            d.tenantId === c.tenantId && d.reason === 'OUTSIDE_ALLOWED_NETWORK',
        )
      ) {
        throw new Error(
          'la organización del recorrido debía figurar en deniedTenants por red',
        );
      }
      if (denied.some((d) => d.tenantId === c.vars.supTenant2Id)) {
        throw new Error('la otra organización no debía negar');
      }
    },
  },
  admin({
    endpoint: 'PUT /org/ip-access-rules',
    name: 'red: se restituye la red del administrador',
    method: 'put',
    path: () => '/org/ip-access-rules',
    body: () => OFFICE_AND_SMOKE_RULES,
    expectedStatus: 200,
  }),
  supportLogin(
    'red: desde una red permitida entra → 200',
    { 'User-Agent': CHROME_WINDOWS },
    200,
  ),
  supportLogin(
    'dispositivo: un equipo que la persona no usó antes avisa en el login (Safari en macOS)',
    { 'User-Agent': SAFARI_MAC },
    200,
    (b) => {
      const notice = (b.newDevice ?? {}) as { label?: string };
      must(
        notice.label === 'Safari en macOS',
        'el equipo nuevo debía avisar con su nombre',
      );
    },
  ),
  admin({
    endpoint: 'PUT /org/session-policies',
    name: 'red: se deja la política sin exigir reglas de red',
    method: 'put',
    path: () => '/org/session-policies',
    body: () => staffPolicy(false),
    expectedStatus: 200,
  }),
];

/** Recertificación: la declaración de la persona no renueva; la organización sí. */
export const SUPPORT_RECERTIFICATION: SmokeCase[] = [
  {
    module: 'PersonalDeApoyo',
    endpoint: 'GET /org/support-engagements',
    name: 'recertificación: setup, la fecha de recertificar pasó hace 20 días',
    method: 'get',
    tenantScoped: true,
    path: () => '/org/support-engagements',
    expectedStatus: 200,
    setup: async (c) => {
      await c.orm.em.getConnection().execute(
        `update delegated_access.organization_user_assignments
            set next_recertification_at = now() - interval '20 days'
          where id = ?`,
        [c.vars.supEngagementId],
      );
    },
  },
  scoped({
    endpoint: 'GET /me/support-agenda',
    name: 'recertificación: vencida la gracia de 15 días la agenda se niega aunque nadie la haya suspendido → 403',
    method: 'get',
    path: (c) => `/me/support-agenda?org=${c.tenantId}&${agendaRange(c)}`,
    expectedStatus: 403,
  }),
  {
    module: 'PersonalDeApoyo',
    endpoint: 'POST /delegated-access/support/recertification-sweep',
    name: 'recertificación: el barrido suspende el vínculo sin recertificar',
    method: 'post',
    tenantScoped: true,
    path: () => '/delegated-access/support/recertification-sweep',
    expectedStatus: 200,
    capture: (b) => {
      must(
        Number(b.suspendedEngagements) >= 1,
        'el barrido debía suspender el vínculo vencido',
      );
    },
  },
  person({
    endpoint: 'POST /me/support-engagements/{id}/confirm',
    name: 'recertificación: la persona declara que sigue → 200 (solo declara)',
    method: 'post',
    path: (c) => `/me/support-engagements/${c.vars.supEngagementId}/confirm`,
    expectedStatus: 200,
  }),
  scoped({
    endpoint: 'GET /me/support-agenda',
    name: 'recertificación: la declaración de la persona no renueva ni reactiva → 403',
    method: 'get',
    path: (c) => `/me/support-agenda?org=${c.tenantId}&${agendaRange(c)}`,
    expectedStatus: 403,
  }),
  admin({
    endpoint: 'POST /org/support-engagements/{id}/recertify',
    name: 'recertificación: la organización renueva y el vínculo suspendido vuelve a regir',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.supEngagementId}/recertify`,
    body: () => ({ recertifyEveryMonths: 6 }),
    expectedStatus: 200,
  }),
  scoped({
    endpoint: 'GET /me/support-agenda',
    name: 'recertificación: renovada por la organización la agenda vuelve a abrirse → 200',
    method: 'get',
    path: (c) => `/me/support-agenda?org=${c.tenantId}&${agendaRange(c)}`,
    expectedStatus: 200,
  }),
];

/** Tras el fin de vínculo las citas que dejó la persona siguen donde estaban. */
export const SUPPORT_BOOKINGS_AFTER_END: SmokeCase[] = [
  admin({
    endpoint: 'GET /scheduling/bookings/{id}',
    name: 'caso 12: tras el fin de vínculo la cita que dejó Ana sigue intacta y la administración la abre → 200',
    method: 'get',
    path: (c) => `/scheduling/bookings/${c.vars.supBookingId}`,
    expectedStatus: 200,
    capture: (b, c) => {
      must(
        b.id === c.vars.supBookingId,
        'la administración debía abrir la cita que dejó la persona',
      );
      must(
        typeof b.checkedInAt === 'string' && !b.cancelledAt,
        'la cita debía seguir con su llegada y sin cancelar',
      );
    },
  }),
];

/** El código de varios usos no afilia solo: deja una solicitud pendiente. */
export const SUPPORT_REDEEMED_REQUEST: SmokeCase[] = [
  admin({
    endpoint: 'GET /org/support-engagement-requests',
    name: 'canje: el código dejó una solicitud PENDIENTE de la persona (no un vínculo)',
    method: 'get',
    path: () => '/org/support-engagement-requests?status=PENDING',
    expectedStatus: 200,
    capture: (b, c) => {
      const items =
        (b.items as {
          requesterUserId: string;
          roleTemplateCode?: string;
          status: string;
        }[]) ?? [];
      must(
        items.some(
          (r) =>
            r.requesterUserId === c.vars.supUserId &&
            r.roleTemplateCode === 'FRONT_DESK' &&
            r.status === 'PENDING',
        ),
        'el canje debía dejar una solicitud FRONT_DESK pendiente de la persona',
      );
    },
  }),
  admin({
    endpoint: 'GET /org/support-engagements',
    name: 'canje: nadie queda afiliado por canjear (ningún vínculo activo de la persona)',
    method: 'get',
    path: () => '/org/support-engagements',
    expectedStatus: 200,
    capture: (b, c) => {
      const items =
        (b.items as { userId?: string; status?: string }[] | undefined) ?? [];
      const mine = items.filter((e) => e.userId === c.vars.supUserId);
      must(
        mine.every((e) => e.status !== 'ACTIVE'),
        'canjear un código no debía dejar un vínculo activo',
      );
    },
  }),
];
