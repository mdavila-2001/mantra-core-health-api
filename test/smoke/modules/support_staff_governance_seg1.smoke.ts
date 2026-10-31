import { ROLE_CONCEPT_BY_CODE } from '../../../src/modules/iam/domain/role-mapping';
import type { SmokeCase, SmokeCtx } from '../smoke-kit';
import {
  MODULE,
  PILOT,
  as,
  exec,
  inDays,
  loginCase,
  must,
  q,
  restepCase,
  step,
  userIdOf,
} from './support_staff_governance.kit';

/**
 * Revisión de seguridad del gobierno de accesos, ronda 1: un caso HTTP por cada uno de los OCHO
 * hallazgos ALTOS corregidos. Cada caso está escrito para FALLAR si se revierte el arreglo (el
 * estado que dejaría el error se afirma contra la respuesta y contra la base), no solo para
 * comprobar que la ruta responde:
 *
 *   B-A1  una jefa de servicio con `team.campaigns.manage` NO ve, cierra ni cancela la campaña de
 *         otro (404 uniforme) y no lanza campañas que vencen enseguida (422);
 *   B-A2  un `FIXED` más ancho que el alcance del delegado no se suelta a `DYNAMIC` (403);
 *   B-A3  el techo del delegado mide lo MISMO que se emite: `APPROVED` + `adjustment` no esconde
 *         átomos fuera del techo (403 ADMIN_CEILING_EXCEEDED);
 *   A-A1  una persona de apoyo en la organización A que es paciente en la B sigue siendo «paciente»
 *         en la B (403 al leer las citas de otro paciente);
 *   A-A2  una condición sobre un ALIAS no se guarda en silencio (422 CONDITION_NOT_APPLICABLE_TO_ATOM);
 *   A-A3  la bandeja aplica las condiciones del permiso al LEER (no solo al responder);
 *   A-M1  `PATCH/POST org/user-assignments` no cruza organizaciones (404 y nada cambia en la base);
 *   B-M3  un átomo CRÍTICA se otorga con dos personas (202 GRANT_CHANGE, no 201).
 *
 * Va tras el caso 38 (Sofía ya tiene su paso extra y su TOTP) y antes de las bajas/suspensiones.
 * Todo lo que siembra por SQL lo retira al final o lo deja inerte para los casos siguientes.
 */

const ECO = 'da47af6a-fc7a-5d56-93cb-7bbe45b26ce5';
/** Ids deterministas de `07-gobierno-hospital-piloto.sql`. */
const CONSULTORIO = 'a52f851c-e5c2-5a32-b99e-a4993ff5a287';
const ROSA_BOND = 'fa601b88-ccf6-5360-aea4-52a889a0d5a7';
const ACTIVE = 'ccfbc54f-4744-53db-ab1f-abe1af31f784';
const ALLOW = '6905e0db-1650-5d49-adca-8b2688ac049c';
const TARGET_ALL_SERVICES = '3df7a566-22b8-512d-85a7-4b89604cb26b';
const EXPANSION_FIXED = '4f47115f-54ad-564f-bcd4-f06a0a0c13cd';

/** Estado de una campaña por nombre del concepto. */
const campaignState = async (
  c: Parameters<typeof q>[0],
  id: string,
): Promise<string> => {
  const [row] = await q<{ st: string }>(
    c,
    `select regexp_replace(k.code, '^.*:', '') as st
       from delegated_access.access_review_campaigns a
       join terminology.catalog_concepts k on k.id = a.status_concept_id where a.id = ?`,
    [id],
  );
  return row?.st ?? '(sin campaña)';
};

/** B-A1: campañas, solo las propias. */
const CAMPAIGNS: SmokeCase[] = [
  step(
    'seg1 B-A1: Sofía recibe team.campaigns.manage en su concesión de Ecografía (fixture SQL; el demo solo le da team.campaigns.review)',
    async (c) => {
      await exec(
        c,
        `insert into delegated_access.support_grant_actions (id, tenant_id, support_scope_grant_id, permission_id, created_at, updated_at)
         select gen_random_uuid(), g.tenant_id, g.id, (select id from authz.permissions where code = 'team.campaigns.manage'), now(), now()
           from delegated_access.support_scope_grants g
          where g.organization_user_assignment_id = ? and g.healthcare_service_id = ? and g.effect_concept_id = ?
          limit 1`,
        [c.vars.gov_eng_sofia, ECO, ALLOW],
      );
      const [row] = await q<{ n: string }>(
        c,
        `select count(*)::int as n from delegated_access.support_grant_actions a
           join authz.permissions p on p.id = a.permission_id
           join delegated_access.support_scope_grants g on g.id = a.support_scope_grant_id
          where g.organization_user_assignment_id = ? and p.code = 'team.campaigns.manage'`,
        [c.vars.gov_eng_sofia],
      );
      must(Number(row.n) === 1, 'Sofía debía quedar con team.campaigns.manage');
    },
  ),
  restepCase('sofia'),
  as('sofia', {
    endpoint: 'GET /org/access-reviews/campaigns',
    name: 'seg1 B-A1: Sofía (delegada) lista campañas → NO ve la campaña de toda la organización del administrador',
    method: 'get',
    path: () => '/org/access-reviews/campaigns',
    expectedStatus: 200,
    capture: (b, c) => {
      const ids = ((b.items ?? []) as Array<{ id: string }>).map((i) => i.id);
      must(
        !ids.includes(c.vars.gov_camp_29),
        'la campaña del administrador no debía salir en la lista de una delegada',
      );
    },
  }),
  as('sofia', {
    endpoint: 'GET /org/access-reviews/campaigns/{id}',
    name: 'seg1 B-A1: Sofía lee la campaña del administrador → 404 REVIEW_CAMPAIGN_NOT_FOUND',
    method: 'get',
    path: (c) => `/org/access-reviews/campaigns/${c.vars.gov_camp_29}`,
    expectedStatus: 404,
    expectedReason: 'REVIEW_CAMPAIGN_NOT_FOUND',
  }),
  as('sofia', {
    endpoint: 'POST /org/access-reviews/campaigns/{id}/close',
    name: 'seg1 B-A1: Sofía cierra la campaña del administrador (auto-revocaría a toda la organización) → 404 REVIEW_CAMPAIGN_NOT_FOUND',
    method: 'post',
    path: (c) => `/org/access-reviews/campaigns/${c.vars.gov_camp_29}/close`,
    expectedStatus: 404,
    expectedReason: 'REVIEW_CAMPAIGN_NOT_FOUND',
  }),
  as('sofia', {
    endpoint: 'POST /org/access-reviews/campaigns/{id}/cancel',
    name: 'seg1 B-A1: Sofía cancela la campaña del administrador → 404 REVIEW_CAMPAIGN_NOT_FOUND',
    method: 'post',
    path: (c) => `/org/access-reviews/campaigns/${c.vars.gov_camp_29}/cancel`,
    body: () => ({ reason: 'Intento de suprimir una campaña ajena' }),
    expectedStatus: 404,
    expectedReason: 'REVIEW_CAMPAIGN_NOT_FOUND',
  }),
  as('sofia', {
    endpoint: 'POST /org/access-reviews/campaigns',
    name: 'seg1 B-A1: Sofía lanza una campaña que vence en 2 días → 422 REVIEW_SCHEDULE_TOO_SHORT (mínimo 7 días)',
    method: 'post',
    path: () => '/org/access-reviews/campaigns',
    body: () => ({
      name: 'Campaña de Sofía (vence enseguida)',
      kind: 'PERIODIC',
      scope: { kind: 'SERVICE', healthcareServiceIds: [ECO] },
      dueAt: inDays(2),
    }),
    expectedStatus: 422,
    expectedReason: 'REVIEW_SCHEDULE_TOO_SHORT',
  }),
  step(
    'seg1 B-A1: la campaña del administrador sigue ABIERTA y ningún ítem se auto-revocó',
    async (c) => {
      must(
        (await campaignState(c, c.vars.gov_camp_29)) === 'REVIEW_CAMPAIGN_OPEN',
        'la campaña ajena debía seguir abierta',
      );
      const [row] = await q<{ n: string }>(
        c,
        `select count(*)::int as n from delegated_access.access_review_items i
           join terminology.catalog_concepts k on k.id = i.decision_concept_id
          where i.access_review_campaign_id = ? and k.code <> 'delegated_access:REVIEW_ITEM_PENDING'`,
        [c.vars.gov_camp_29],
      );
      must(
        Number(row.n) === 0,
        `ningún ítem de la campaña ajena debía decidirse: ${row.n}`,
      );
    },
  ),
];

/** B-A2: FIXED → DYNAMIC. */
const FIXED_TO_DYNAMIC: SmokeCase[] = [
  step(
    'seg1 B-A2: fixture SQL: Marcos tiene agenda.appointment.view en TODOS los servicios con la foto FIXED solo de Ecografía (como el PoC)',
    async (c) => {
      const id = `5e91a2b1-0000-4000-8000-0000000000${String(c.u % 90).padStart(2, '0')}`;
      c.vars.gov_seg1_fixed = id;
      await exec(
        c,
        `insert into delegated_access.support_scope_grants
           (id, tenant_id, organization_user_assignment_id, target_kind_concept_id, expansion_mode_concept_id, fixed_snapshot_json,
            status_concept_id, effect_concept_id, valid_to, created_at, updated_at, row_version)
         values (?, ?, ?, ?, ?, ?::jsonb, ?, ?, now() + interval '30 days', now(), now(), 1)`,
        [
          id,
          PILOT,
          c.vars.gov_eng_marcos,
          TARGET_ALL_SERVICES,
          EXPANSION_FIXED,
          JSON.stringify({ rows: [{ healthcareServiceId: ECO }] }),
          ACTIVE,
          ALLOW,
        ],
      );
      await exec(
        c,
        `insert into delegated_access.support_grant_actions (id, tenant_id, support_scope_grant_id, permission_id, created_at, updated_at)
         values (gen_random_uuid(), ?, ?, (select id from authz.permissions where code = 'agenda.appointment.view'), now(), now())`,
        [PILOT, id],
      );
    },
  ),
  restepCase('sofia'),
  as('sofia', {
    endpoint: 'PATCH /org/team/members/{id}/grants',
    name: 'seg1 B-A2: Sofía pasa el FIXED a DYNAMIC (seguiría a TODOS los servicios, presentes y futuros) → 403 ADMIN_SCOPE_EXCEEDED',
    method: 'patch',
    path: (c) => `/org/team/members/${c.vars.gov_eng_marcos}/grants`,
    body: (c) => ({
      grantId: c.vars.gov_seg1_fixed,
      expansionMode: 'DYNAMIC',
    }),
    expectedStatus: 403,
    expectedReason: 'ADMIN_SCOPE_EXCEEDED',
  }),
  step(
    'seg1 B-A2: el permiso sigue FIXED en la base y se retira el fixture',
    async (c) => {
      const [row] = await q<{ mode: string }>(
        c,
        `select regexp_replace(k.code, '^.*:', '') as mode
           from delegated_access.support_scope_grants g
           join terminology.catalog_concepts k on k.id = g.expansion_mode_concept_id where g.id = ?`,
        [c.vars.gov_seg1_fixed],
      );
      must(
        row?.mode === 'SUPPORT_EXPANSION_FIXED',
        `el permiso debía seguir FIXED y quedó ${row?.mode}`,
      );
      await exec(
        c,
        `delete from delegated_access.effective_support_access where grant_id = ?`,
        [c.vars.gov_seg1_fixed],
      );
      await exec(
        c,
        `delete from delegated_access.support_grant_actions where support_scope_grant_id = ?`,
        [c.vars.gov_seg1_fixed],
      );
      await exec(
        c,
        `delete from delegated_access.support_scope_grants where id = ?`,
        [c.vars.gov_seg1_fixed],
      );
    },
  ),
];

/** B-A3: el techo del delegado mide lo que se emite. */
const REQUEST_CEILING: SmokeCase[] = [
  {
    module: MODULE,
    endpoint: 'POST /iam/users',
    name: 'seg1 B-A3: setup: se crea la cuenta de quien pedirá un vínculo',
    method: 'post',
    token: (c) => c.vars.gov_tok_system,
    path: () => '/iam/users',
    body: (c) => ({
      displayName: 'Persona Solicitante Seg1',
      email: `seg1-${c.u}@example.test`,
      password: 'Str0ng-Passw0rd!',
      timeZone: 'America/La_Paz',
      initialRole: 'USER',
    }),
    expectedStatus: 201,
  },
  {
    module: MODULE,
    endpoint: 'POST /iam/auth/login',
    name: 'seg1 B-A3: setup: la persona inicia sesión',
    method: 'post',
    auth: false,
    path: () => '/iam/auth/login',
    body: (c) => ({
      email: `seg1-${c.u}@example.test`,
      password: 'Str0ng-Passw0rd!',
    }),
    expectedStatus: 200,
    capture: (b, c) => {
      c.vars.gov_seg1_req_tok = String(b.accessToken ?? '');
    },
  },
  {
    module: MODULE,
    endpoint: 'POST /support-engagement-requests',
    name: 'seg1 B-A3: la persona pide, en Ecografía, ver la agenda Y registrar pacientes (este último fuera del techo de Sofía)',
    method: 'post',
    token: (c) => c.vars.gov_seg1_req_tok,
    path: () => '/support-engagement-requests',
    body: () => ({
      tenantId: PILOT,
      roleTemplateCode: 'FRONT_DESK',
      message: 'Quiero apoyar la agenda de Ecografía',
      items: [
        {
          targetKind: 'SERVICE',
          healthcareServiceId: ECO,
          actions: ['agenda.appointment.view', 'patients.profile.register'],
        },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.gov_seg1_req = String(b.id ?? '');
      must(c.vars.gov_seg1_req, 'la solicitud debía devolver su id');
    },
  },
  as('sofia', {
    endpoint: 'GET /org/team/requests',
    name: 'seg1 B-A3: Sofía ve el ítem de su alcance',
    method: 'get',
    path: () => '/org/team/requests',
    expectedStatus: 200,
    capture: (b, c) => {
      const mine = (
        (b.items ?? []) as Array<{ id: string; items: Array<{ id: string }> }>
      ).find((r) => r.id === c.vars.gov_seg1_req);
      must(mine, 'Sofía debía ver la solicitud');
      c.vars.gov_seg1_item = String(mine?.items[0]?.id ?? '');
      must(c.vars.gov_seg1_item, 'la solicitud debía traer su ítem');
    },
  }),
  restepCase('sofia'),
  as('sofia', {
    endpoint: 'POST /org/team/requests/{id}/decision',
    name: 'seg1 B-A3: Sofía APRUEBA con un «adjustment» que solo trae agenda.appointment.view (la emisión concedería TAMBIÉN registrar pacientes) → 403 ADMIN_CEILING_EXCEEDED',
    method: 'post',
    path: (c) => `/org/team/requests/${c.vars.gov_seg1_req}/decision`,
    body: (c) => ({
      items: [
        {
          itemId: c.vars.gov_seg1_item,
          decision: 'APPROVED',
          validTo: inDays(30),
          adjustment: {
            targetKind: 'SERVICE',
            healthcareServiceId: ECO,
            actions: ['agenda.appointment.view'],
          },
        },
      ],
    }),
    expectedStatus: 403,
    expectedReason: 'ADMIN_CEILING_EXCEEDED',
  }),
  step(
    'seg1 B-A3: no se emitió ninguna concesión por esa solicitud (la solicitud sigue pendiente)',
    async (c) => {
      const [row] = await q<{ n: string }>(
        c,
        `select count(*)::int as n from delegated_access.engagement_request_items where engagement_request_id = ? and resulting_grant_id is not null`,
        [c.vars.gov_seg1_req],
      );
      must(Number(row.n) === 0, 'no debía haberse emitido ninguna concesión');
    },
  ),
  as('sofia', {
    endpoint: 'POST /org/team/requests/{id}/decision',
    name: 'seg1 B-A3: control: con la lista de acciones DENTRO del techo (decision.actions) la misma aprobación pasa → 200',
    method: 'post',
    path: (c) => `/org/team/requests/${c.vars.gov_seg1_req}/decision`,
    body: (c) => ({
      items: [
        {
          itemId: c.vars.gov_seg1_item,
          decision: 'APPROVED',
          actions: ['agenda.appointment.view'],
          validTo: inDays(30),
        },
      ],
    }),
    expectedStatus: 200,
  }),
  step(
    'seg1 B-A3: la concesión emitida trae SOLO lo que se midió (agenda.appointment.view), sin registrar pacientes',
    async (c) => {
      const rows = await q<{ code: string }>(
        c,
        `select p.code from delegated_access.engagement_request_items i
           join delegated_access.support_grant_actions a on a.support_scope_grant_id = i.resulting_grant_id
           join authz.permissions p on p.id = a.permission_id
          where i.engagement_request_id = ?`,
        [c.vars.gov_seg1_req],
      );
      const codes = rows.map((r) => r.code);
      must(
        codes.includes('agenda.appointment.view') &&
          !codes.includes('patients.profile.register'),
        `lo emitido debía ser solo agenda.appointment.view: ${JSON.stringify(codes)}`,
      );
    },
  ),
];

/** A-A1: apoyo en la organización A + paciente en la B. */
const DUAL_ACTOR: SmokeCase[] = [
  step(
    'seg1 A-A1: fixture SQL: Rosa (apoyo SOLO en el consultorio) pasa a ser también paciente con membresía en el hospital',
    async (c) => {
      const rosa = userIdOf(c, 'rosa');
      await exec(
        c,
        `insert into iam.user_global_roles (id, user_id, role_concept_id, state_concept_id, created_at, updated_at, row_version)
         values (gen_random_uuid(), ?, ?, (select state_concept_id from iam.user_global_roles where user_id = ? limit 1), now(), now(), 1)`,
        [rosa, ROLE_CONCEPT_BY_CODE.PATIENT, rosa],
      );
      await exec(
        c,
        `insert into directory.tenant_memberships
           (id, user_id, tenant_id, tenant_role_concept_id, status_concept_id, access_scope_concept_id, start_date, created_at, updated_at, row_version)
         select '5e91a2b1-0000-4000-8000-00000000a1a1', m.user_id, ?, m.tenant_role_concept_id, m.status_concept_id, m.access_scope_concept_id, now(), now(), now(), 1
           from directory.tenant_memberships m where m.user_id = ? and m.tenant_id = ?`,
        [PILOT, rosa, CONSULTORIO],
      );
    },
  ),
  loginCase('rosa', true),
  as('rosa', {
    endpoint: 'GET /scheduling/bookings',
    name: 'seg1 A-A1: Rosa (apoyo en el consultorio, paciente en el hospital) lista las citas de OTRO paciente del hospital → 403 (sigue siendo «paciente» allí)',
    method: 'get',
    path: (c) =>
      `/scheduling/bookings?patientProfileId=${c.vars.gov_pat_luis}&from=2026-11-01T00:00:00.000Z&to=2026-11-30T00:00:00.000Z`,
    expectedStatus: 403,
  }),
  step('seg1 A-A1: se retiran el rol y la membresía del fixture', async (c) => {
    await exec(
      c,
      `delete from directory.tenant_memberships where id = '5e91a2b1-0000-4000-8000-00000000a1a1'`,
    );
    await exec(
      c,
      `delete from iam.user_global_roles where user_id = ? and role_concept_id = ?`,
      [userIdOf(c, 'rosa'), ROLE_CONCEPT_BY_CODE.PATIENT],
    );
  }),
  loginCase('rosa', true),
];

/** A-A2: condiciones sobre alias. */
const ALIAS_CONDITION: SmokeCase[] = [
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'seg1 A-A2: un permiso con el ALIAS schedule.cancel y una condición de horario → 422 CONDITION_NOT_APPLICABLE_TO_ATOM (el motor no la aplicaría)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_lucia}/grants`,
    body: (c) => ({
      targetKind: 'LOCATION',
      careSpaceId: c.vars.gov_space_lucia,
      actions: ['schedule.cancel'],
      condition: {
        schemaVersion: 1,
        time: {
          windows: [{ days: [1, 2, 3, 4, 5], from: '08:00', to: '12:00' }],
          timeZone: 'America/La_Paz',
        },
      },
      validTo: inDays(30),
    }),
    expectedStatus: 422,
    expectedReason: 'CONDITION_NOT_APPLICABLE_TO_ATOM',
  }),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'seg1 A-A2: control: el mismo permiso con el ÁTOMO agenda.appointment.cancel y la misma condición → 201',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_lucia}/grants`,
    body: (c) => ({
      targetKind: 'LOCATION',
      careSpaceId: c.vars.gov_space_lucia,
      actions: ['agenda.appointment.cancel'],
      condition: {
        schemaVersion: 1,
        time: {
          windows: [{ days: [1, 2, 3, 4, 5], from: '08:00', to: '12:00' }],
          timeZone: 'America/La_Paz',
        },
      },
      validTo: inDays(30),
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.gov_seg1_alias_ctl = String(b.id ?? '');
    },
  }),
  as('admin', {
    endpoint: 'PATCH /org/support-engagements/{id}/grants',
    name: 'seg1 A-A2: se retira el permiso de control',
    method: 'patch',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_lucia}/grants`,
    body: (c) => ({ grantId: c.vars.gov_seg1_alias_ctl, revoke: true }),
    expectedStatus: 200,
  }),
];

/** A-A3: la bandeja aplica las condiciones al LEER. */
const daily = (from: string, to: string) => ({
  schemaVersion: 1,
  time: {
    windows: [{ days: [0, 1, 2, 3, 4, 5, 6], from, to }],
    timeZone: 'America/La_Paz',
  },
});
const REPLY_ON_BEHALF = (value: boolean) => async (c: SmokeCtx) => {
  await exec(
    c,
    `update delegated_access.practitioner_delegate_assignments
        set may_reply_on_behalf = ?
      where delegate_user_assignment_id = ? and practitioner_role_assignment_id = ?`,
    [value, c.vars.gov_eng_lucia, c.vars.gov_role_perez],
  );
};
const INBOX_CONDITIONS: SmokeCase[] = [
  step(
    'seg1 A-A3: fixture SQL: el Dr. Pérez permite a Lucía responder en su nombre (el demo solo le da la agenda)',
    REPLY_ON_BEHALF(true),
  ),
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'seg1 A-A3: se le da a Lucía atender mensajes de Pérez de 06:00 a 23:00 (ahora son las ~10:30)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_lucia}/grants`,
    body: (c) => ({
      targetKind: 'PRACTITIONER',
      practitionerRoleAssignmentId: c.vars.gov_role_perez,
      actions: ['messages.inbox.view', 'messages.conversation.reply_on_behalf'],
      condition: daily('06:00', '23:00'),
      validTo: inDays(30),
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.gov_seg1_inbox_grant = String(b.id ?? '');
    },
  }),
  as('lucia', {
    endpoint: 'GET /me/support-inbox',
    name: 'seg1 A-A3: control: dentro del horario de su permiso Lucía ve las conversaciones de Pérez → count ≥ 1',
    method: 'get',
    path: () => `/me/support-inbox?tenantId=${PILOT}`,
    expectedStatus: 200,
    capture: (b) => {
      must(
        Number(b.count) >= 1,
        `Lucía debía ver conversaciones: ${String(b.count)}`,
      );
    },
  }),
  as('admin', {
    endpoint: 'PATCH /org/support-engagements/{id}/grants',
    name: 'seg1 A-A3: el horario del permiso de Lucía pasa a 03:00-04:00 (fuera de horario)',
    method: 'patch',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_lucia}/grants`,
    body: (c) => ({
      grantId: c.vars.gov_seg1_inbox_grant,
      condition: daily('03:00', '04:00'),
    }),
    expectedStatus: 200,
  }),
  as('lucia', {
    endpoint: 'GET /me/support-inbox',
    name: 'seg1 A-A3: fuera del horario de su permiso Lucía NO ve ninguna conversación (antes la condición solo cerraba el envío y la lista seguía abierta)',
    method: 'get',
    path: () => `/me/support-inbox?tenantId=${PILOT}`,
    expectedStatus: 200,
    capture: (b) => {
      must(
        Number(b.count) === 0 && ((b.items ?? []) as unknown[]).length === 0,
        `fuera de horario no debía listar nada: ${String(b.count)}`,
      );
    },
  }),
  as('lucia', {
    endpoint: 'GET /me/support-inbox',
    name: 'seg1 A-A3: sin indicar organización la bandeja de Lucía tampoco trae conversaciones de Pérez fuera de horario',
    method: 'get',
    path: () => '/me/support-inbox',
    expectedStatus: 200,
    capture: (b) => {
      must(
        Number(b.count) === 0 && ((b.items ?? []) as unknown[]).length === 0,
        `fuera de horario no debía listar nada: ${String(b.count)}`,
      );
    },
  }),
  as('admin', {
    endpoint: 'PATCH /org/support-engagements/{id}/grants',
    name: 'seg1 A-A3: se retira el permiso de Lucía',
    method: 'patch',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_lucia}/grants`,
    body: (c) => ({ grantId: c.vars.gov_seg1_inbox_grant, revoke: true }),
    expectedStatus: 200,
  }),
  step(
    'seg1 A-A3: se deja la delegación de Lucía como estaba (sin responder en nombre del doctor)',
    REPLY_ON_BEHALF(false),
  ),
];

/** A-M1: IDOR entre organizaciones en org-user-assignments. */
const ORG_USER_ASSIGNMENTS: SmokeCase[] = [
  step(
    'seg1 A-M1: se resuelve el vínculo y la membresía de Rosa en el CONSULTORIO (otra organización)',
    async (c) => {
      const [row] = await q<{ membership: string; st: string }>(
        c,
        `select a.tenant_membership_id as membership, a.status_concept_id::text as st
           from delegated_access.organization_user_assignments a where a.id = ?`,
        [ROSA_BOND],
      );
      must(row, 'faltó el vínculo de Rosa en el consultorio');
      c.vars.gov_seg1_rosa_membership = row.membership;
      c.vars.gov_seg1_rosa_status = row.st;
    },
  ),
  as('admin', {
    endpoint: 'PATCH /org/user-assignments/{id}',
    name: 'seg1 A-M1: el administrador del HOSPITAL suspende el vínculo de Rosa en el CONSULTORIO → 404 (no es de su organización)',
    method: 'patch',
    path: () => `/org/user-assignments/${ROSA_BOND}`,
    body: () => ({ suspend: true }),
    expectedStatus: 404,
  }),
  as('admin', {
    endpoint: 'POST /org/{tenantMembershipId}/user-assignments',
    name: 'seg1 A-M1: el administrador del HOSPITAL crea un vínculo sobre la membresía de Rosa en el CONSULTORIO → 404',
    method: 'post',
    path: (c) => `/org/${c.vars.gov_seg1_rosa_membership}/user-assignments`,
    body: () => ({ role: 'STAFF', accessScope: 'TENANT' }),
    expectedStatus: 404,
  }),
  step(
    'seg1 A-M1: el vínculo de Rosa en el consultorio quedó como estaba y no se creó ninguno nuevo sobre su membresía',
    async (c) => {
      const [row] = await q<{ st: string; n: string }>(
        c,
        `select a.status_concept_id::text as st,
                (select count(*)::int from delegated_access.organization_user_assignments x where x.tenant_membership_id = a.tenant_membership_id) as n
           from delegated_access.organization_user_assignments a where a.id = ?`,
        [ROSA_BOND],
      );
      must(
        row.st === c.vars.gov_seg1_rosa_status,
        'el vínculo ajeno no debía cambiar de estado',
      );
      must(Number(row.n) === 1, `no debía haber vínculos nuevos: ${row.n}`);
    },
  ),
];

/** B-M3: átomo CRÍTICA con dos personas. */
const GRANT_CHANGE: SmokeCase[] = [
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'seg1 B-M3: otorgar billing.payment.refund (CRÍTICA) a Sofía → 202 GRANT_CHANGE pendiente (no 201: una sola persona no basta)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_sofia}/grants`,
    body: () => ({
      targetKind: 'SERVICE',
      healthcareServiceId: ECO,
      actions: ['billing.payment.refund'],
      validTo: inDays(30),
    }),
    expectedStatus: 202,
    capture: (b, c) => {
      must(b.status === 'PENDING_APPROVAL', `estado: ${String(b.status)}`);
      must(b.approvalId, 'debía devolver approvalId');
      must(
        JSON.stringify(b.criticalAtoms ?? []).includes(
          'billing.payment.refund',
        ),
        'debía listar el átomo crítico',
      );
      c.vars.gov_seg1_gc = String(b.approvalId);
    },
  }),
  step(
    'seg1 B-M3: mientras nadie aprueba, Sofía NO tiene el átomo crítico',
    async (c) => {
      const [row] = await q<{ n: string }>(
        c,
        `select count(*)::int as n from delegated_access.support_grant_actions a
           join authz.permissions p on p.id = a.permission_id
           join delegated_access.support_scope_grants g on g.id = a.support_scope_grant_id
          where g.organization_user_assignment_id = ? and p.code = 'billing.payment.refund' and a.superseded_at is null`,
        [c.vars.gov_eng_sofia],
      );
      must(
        Number(row.n) === 0,
        'el átomo crítico no debía existir antes de la aprobación',
      );
    },
  ),
  as('admin', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'seg1 B-M3: el administrador no aprueba lo que pidió → 403 FOUR_EYES_SELF_APPROVAL',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_seg1_gc}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 403,
    expectedReason: 'FOUR_EYES_SELF_APPROVAL',
  }),
  restepCase('gonzalo'),
  as('gonzalo', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'seg1 B-M3: Gonzalo aprueba → 200 y la concesión nace',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_seg1_gc}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 200,
  }),
  step(
    'seg1 B-M3: tras la aprobación Sofía tiene el átomo crítico (vigente)',
    async (c) => {
      const rows = await q<{ gid: string }>(
        c,
        `select g.id as gid from delegated_access.support_grant_actions a
           join authz.permissions p on p.id = a.permission_id
           join delegated_access.support_scope_grants g on g.id = a.support_scope_grant_id
          where g.organization_user_assignment_id = ? and p.code = 'billing.payment.refund' and a.superseded_at is null`,
        [c.vars.gov_eng_sofia],
      );
      must(
        rows.length === 1,
        `Sofía debía tener el átomo crítico: ${rows.length}`,
      );
      c.vars.gov_seg1_gc_grant = rows[0].gid;
    },
  ),
  restepCase('admin'),
  as('admin', {
    endpoint: 'PATCH /org/support-engagements/{id}/grants',
    name: 'seg1 B-M3: se retira el permiso crítico para no alterar los casos siguientes',
    method: 'patch',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_sofia}/grants`,
    body: (c) => ({ grantId: c.vars.gov_seg1_gc_grant, revoke: true }),
    expectedStatus: 200,
  }),
];

/** Los ocho hallazgos altos de la ronda 1 de revisión de seguridad. */
export const SEG1_HIGH_FINDINGS: SmokeCase[] = [
  ...CAMPAIGNS,
  ...FIXED_TO_DYNAMIC,
  ...REQUEST_CEILING,
  ...DUAL_ACTOR,
  ...ALIAS_CONDITION,
  ...INBOX_CONDITIONS,
  ...ORG_USER_ASSIGNMENTS,
  ...GRANT_CHANGE,
];
