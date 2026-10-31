import { CONCEPTS } from '../../../src/common';
import { ROLE_CONCEPT_BY_CODE } from '../../../src/modules/iam/domain/role-mapping';
import type { SmokeCase } from '../smoke-kit';
import {
  as,
  exec,
  inDays,
  must,
  q,
  restepCase,
  step,
  userIdOf,
} from './support_staff_governance.kit';

/**
 * Revisión de seguridad del gobierno de accesos, ronda 2 (arreglos V-3, N-1, N-2, N-8 y N-9).
 * Cada caso falla si se revierte su arreglo (se afirma la respuesta Y el estado de la base):
 *
 *   V-3  ampliar un átomo CRÍTICA que la persona YA tenía (de un servicio a toda la
 *        organización, o prorrogar su vigencia) NO se escribe con un solo administrador: 202
 *        `GRANT_CHANGE` y la base queda igual hasta que otra persona apruebe;
 *   N-1  quien aprueba ve el permiso COMPLETO (átomos críticos, objetivo, vigencia) en
 *        `GET /approvals/pending`, no un resumen genérico;
 *   N-2  si quien pidió dejó de ser administrador de seguridad mientras tanto, aprobar es 409
 *        `FOUR_EYES_PAYLOAD_INVALID` y no se escribe nada;
 *   N-8  una condición sobre `audit.activity.*` o `reports.*` se rechaza al guardar (422);
 *   N-9  un delegado sin `team.grants.revoke` no obtiene revocación por vencimiento (403 al
 *        pedirla; sin pedirla queda en ESCALATE).
 *
 * Va tras `SEG1_HIGH_FINDINGS` (Sofía ya tiene su paso extra y `team.campaigns.manage`).
 */

const ECO = 'da47af6a-fc7a-5d56-93cb-7bbe45b26ce5';

/** Concesiones vivas de Sofía con el átomo, con su tipo de objetivo y su fin de vigencia. */
const grantsWith = async (
  c: Parameters<typeof q>[0],
  engagement: string,
  atom: string,
): Promise<Array<{ gid: string; kind: string; valid_to: Date | null }>> =>
  q(
    c,
    `select g.id as gid, regexp_replace(k.code, '^.*:', '') as kind, g.valid_to
       from delegated_access.support_grant_actions a
       join authz.permissions p on p.id = a.permission_id
       join delegated_access.support_scope_grants g on g.id = a.support_scope_grant_id
       join terminology.catalog_concepts k on k.id = g.target_kind_concept_id
       join terminology.catalog_concepts ks on ks.id = g.status_concept_id
      where g.organization_user_assignment_id = ? and p.code = ? and a.superseded_at is null
        and ks.code = 'delegated_access:SUPPORT_GRANT_ACTIVE'`,
    [engagement, atom],
  );

const SETUP_CRITICAL: SmokeCase[] = [
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'seg2 V-3: Sofía recibe billing.payment.refund (CRÍTICA) sobre Ecografía → 202 (átomo nuevo, dos personas)',
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
      must(
        JSON.stringify(b.reasons ?? []).includes('NEW_CRITICAL_ATOMS'),
        `motivo: ${JSON.stringify(b.reasons)}`,
      );
      c.vars.gov_seg2_gc0 = String(b.approvalId);
    },
  }),
  restepCase('gonzalo'),
  as('gonzalo', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'seg2 V-3: Gonzalo aprueba → 200 y Sofía queda con el átomo crítico solo sobre Ecografía',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_seg2_gc0}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 200,
  }),
  step(
    'seg2 V-3: la concesión crítica existe, sobre UN servicio',
    async (c) => {
      const rows = await grantsWith(
        c,
        c.vars.gov_eng_sofia,
        'billing.payment.refund',
      );
      must(rows.length === 1, `debía haber 1 concesión: ${rows.length}`);
      must(
        rows[0].kind === 'SUPPORT_TARGET_SERVICE',
        `objetivo: ${rows[0].kind}`,
      );
      c.vars.gov_seg2_grant = rows[0].gid;
      c.vars.gov_seg2_valid_to = new Date(
        rows[0].valid_to as Date,
      ).toISOString();
    },
  ),
];

const WIDEN_SCOPE: SmokeCase[] = [
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'seg2 V-3: el MISMO átomo crítico pero sobre TODA la organización → 202 SCOPE_WIDENED (antes se escribía directo, con un solo administrador)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_sofia}/grants`,
    body: () => ({
      targetKind: 'ALL',
      actions: ['billing.payment.refund'],
      validTo: inDays(30),
    }),
    expectedStatus: 202,
    capture: (b, c) => {
      must(b.status === 'PENDING_APPROVAL', `estado: ${String(b.status)}`);
      must(
        JSON.stringify(b.reasons ?? []).includes('SCOPE_WIDENED'),
        `motivo: ${JSON.stringify(b.reasons)}`,
      );
      c.vars.gov_seg2_gc_all = String(b.approvalId);
    },
  }),
  step(
    'seg2 V-3: mientras nadie aprueba NO existe la concesión sobre toda la organización',
    async (c) => {
      const rows = await grantsWith(
        c,
        c.vars.gov_eng_sofia,
        'billing.payment.refund',
      );
      must(
        rows.every((r) => r.kind === 'SUPPORT_TARGET_SERVICE'),
        `solo debía haber concesiones de servicio: ${JSON.stringify(rows.map((r) => r.kind))}`,
      );
    },
  ),
  as('admin', {
    endpoint: 'PATCH /org/support-engagements/{id}/grants',
    name: 'seg2 V-3: prorrogar la vigencia de la concesión crítica a 85 días → 202 VALIDITY_EXTENDED (antes se escribía directo)',
    method: 'patch',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_sofia}/grants`,
    body: (c) => ({ grantId: c.vars.gov_seg2_grant, validTo: inDays(85) }),
    expectedStatus: 202,
    capture: (b, c) => {
      must(
        JSON.stringify(b.reasons ?? []).includes('VALIDITY_EXTENDED'),
        `motivo: ${JSON.stringify(b.reasons)}`,
      );
      c.vars.gov_seg2_gc_validity = String(b.approvalId);
    },
  }),
  step(
    'seg2 V-3: la vigencia de la concesión crítica NO cambió en la base',
    async (c) => {
      const [row] = await grantsWith(
        c,
        c.vars.gov_eng_sofia,
        'billing.payment.refund',
      );
      must(
        new Date(row.valid_to as Date).toISOString() ===
          c.vars.gov_seg2_valid_to,
        'la vigencia no debía cambiar antes de la aprobación',
      );
    },
  ),
];

const APPROVER_VIEW: SmokeCase[] = [
  as('gonzalo', {
    endpoint: 'GET /approvals/pending',
    name: 'seg2 N-1: Gonzalo ve el permiso COMPLETO (átomos críticos por nombre, objetivo, vigencia) y un resumen que nombra el átomo',
    method: 'get',
    path: () => '/approvals/pending',
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b.items ?? []) as Array<Record<string, any>>;
      const item = items.find((i) => i.id === c.vars.gov_seg2_gc_all);
      must(item, 'la solicitud de ampliación debía figurar para el aprobador');
      must(
        String(item!.summary).includes('Devolver pagos'),
        `el resumen debía nombrar el átomo: ${String(item!.summary)}`,
      );
      const d = item!.details;
      must(d, 'faltó details (el aprobador iría a ciegas)');
      must(d.op === 'ADD', `op: ${String(d.op)}`);
      must(d.target?.kind === 'ALL', `objetivo: ${JSON.stringify(d.target)}`);
      must(
        (d.criticalAtoms ?? []).some(
          (a: { code: string; critical: boolean }) =>
            a.code === 'billing.payment.refund' && a.critical === true,
        ),
        `átomos críticos: ${JSON.stringify(d.criticalAtoms)}`,
      );
      must(!!d.validTo, 'faltó la vigencia');
      must(
        JSON.stringify(d.reasons ?? []).includes('SCOPE_WIDENED'),
        'faltó el motivo',
      );
      const upd = items.find((i) => i.id === c.vars.gov_seg2_gc_validity);
      must(
        upd?.details?.op === 'UPDATE' &&
          JSON.stringify(upd.details.changes) === '["validTo"]',
        `la edición debía decir qué cambia: ${JSON.stringify(upd?.details)}`,
      );
    },
  }),
];

/** SQL: el rol de administrador de seguridad de `admin` deja de estar activo (y vuelve). */
const ADMIN_ROLE = ROLE_CONCEPT_BY_CODE.SECURITY_ADMIN;
const REQUESTER_GONE: SmokeCase[] = [
  step(
    'seg2 N-2: fixture SQL: quien pidió (el administrador) deja de ser administrador de seguridad',
    async (c) => {
      const [row] = await q<{ st: string }>(
        c,
        `select state_concept_id as st from iam.user_global_roles where user_id = ? and role_concept_id = ?`,
        [userIdOf(c, 'admin'), ADMIN_ROLE],
      );
      must(row, 'el administrador debía tener su rol global');
      c.vars.gov_seg2_admin_role_state = row.st;
      await exec(
        c,
        `update iam.user_global_roles set state_concept_id = ? where user_id = ? and role_concept_id = ?`,
        [CONCEPTS.STATE_REVOKED, userIdOf(c, 'admin'), ADMIN_ROLE],
      );
    },
  ),
  restepCase('gonzalo'),
  as('gonzalo', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'seg2 N-2: Gonzalo aprueba lo que pidió alguien que YA NO es administrador → 409 FOUR_EYES_PAYLOAD_INVALID (antes escribía una concesión sobre toda la organización)',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_seg2_gc_all}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 409,
    expectedReason: 'FOUR_EYES_PAYLOAD_INVALID',
  }),
  step(
    'seg2 N-2: el rol del administrador vuelve a como estaba y no se escribió nada',
    async (c) => {
      // Primero se restaura (si la comprobación falla, el resto del escenario sigue con su administrador).
      await exec(
        c,
        `update iam.user_global_roles set state_concept_id = ? where user_id = ? and role_concept_id = ?`,
        [c.vars.gov_seg2_admin_role_state, userIdOf(c, 'admin'), ADMIN_ROLE],
      );
      const rows = await grantsWith(
        c,
        c.vars.gov_eng_sofia,
        'billing.payment.refund',
      );
      must(
        rows.every((r) => r.kind === 'SUPPORT_TARGET_SERVICE'),
        `no debía existir una concesión sobre toda la organización: ${JSON.stringify(rows.map((r) => r.kind))}`,
      );
    },
  ),
  restepCase('gonzalo'),
  as('gonzalo', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'seg2 N-2: se rechaza la ampliación pendiente (limpieza)',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_seg2_gc_all}/decision`,
    body: () => ({
      decision: 'REJECT',
      comment: 'Prueba de seguridad: no se amplía.',
    }),
    expectedStatus: 200,
  }),
  as('gonzalo', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'seg2 V-3: se rechaza la prórroga pendiente (limpieza)',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_seg2_gc_validity}/decision`,
    body: () => ({
      decision: 'REJECT',
      comment: 'Prueba de seguridad: no se prorroga.',
    }),
    expectedStatus: 200,
  }),
  restepCase('admin'),
  as('admin', {
    endpoint: 'PATCH /org/support-engagements/{id}/grants',
    name: 'seg2: se retira la concesión crítica para no alterar los casos siguientes',
    method: 'patch',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_sofia}/grants`,
    body: (c) => ({ grantId: c.vars.gov_seg2_grant, revoke: true }),
    expectedStatus: 200,
  }),
];

const CONDITIONS_N8: SmokeCase[] = [
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name: 'seg2 N-8: una condición de horario sobre audit.activity.view_team → 422 CONDITION_NOT_APPLICABLE_TO_ATOM (ninguna ruta la evalúa)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_sofia}/grants`,
    body: () => ({
      targetKind: 'SERVICE',
      healthcareServiceId: ECO,
      actions: ['audit.activity.view_team'],
      condition: {
        schemaVersion: 1,
        time: { windows: [{ days: [1], from: '08:00', to: '12:00' }] },
      },
    }),
    expectedStatus: 422,
    expectedReason: 'CONDITION_NOT_APPLICABLE_TO_ATOM',
  }),
];

const REVOKE_ATOM_ROW = `
  from delegated_access.support_grant_actions a
  join authz.permissions p on p.id = a.permission_id
  join delegated_access.support_scope_grants g on g.id = a.support_scope_grant_id
 where g.organization_user_assignment_id = ? and p.code = 'team.grants.revoke'`;

const CAMPAIGN_N9: SmokeCase[] = [
  step(
    'seg2 N-9: fixture SQL: Sofía pierde team.grants.revoke (conserva team.campaigns.manage)',
    async (c) => {
      await exec(
        c,
        `update delegated_access.support_grant_actions set superseded_at = now()
          where id in (select a.id ${REVOKE_ATOM_ROW})`,
        [c.vars.gov_eng_sofia],
      );
    },
  ),
  as('sofia', {
    endpoint: 'POST /org/access-reviews/campaigns',
    name: 'seg2 N-9: Sofía (sin team.grants.revoke) pide una campaña que revoca por vencimiento → 403 ADMIN_CEILING_EXCEEDED',
    method: 'post',
    path: () => '/org/access-reviews/campaigns',
    body: () => ({
      name: 'Campaña de Sofía que revocaría',
      kind: 'PERIODIC',
      scope: { kind: 'SERVICE', healthcareServiceIds: [ECO] },
      dueAt: inDays(30),
      uncertifiedAction: 'UNCERTIFIED_REVOKE',
    }),
    expectedStatus: 403,
    expectedReason: 'ADMIN_CEILING_EXCEEDED',
  }),
  as('sofia', {
    endpoint: 'POST /org/access-reviews/campaigns',
    name: 'seg2 N-9: sin indicar la acción la campaña de Sofía queda en ESCALATE (no revoca a su nombre)',
    method: 'post',
    path: () => '/org/access-reviews/campaigns',
    body: () => ({
      name: 'Campaña de Sofía que solo escala',
      kind: 'PERIODIC',
      scope: { kind: 'SERVICE', healthcareServiceIds: [ECO] },
      dueAt: inDays(30),
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.gov_seg2_campaign = String(b.id);
    },
  }),
  step(
    'seg2 N-9: la campaña quedó en UNCERTIFIED_ESCALATE; se retira y Sofía recupera team.grants.revoke',
    async (c) => {
      const [row] = await q<{ act: string }>(
        c,
        `select regexp_replace(k.code, '^.*:', '') as act
           from delegated_access.access_review_campaigns a
           join terminology.catalog_concepts k on k.id = a.uncertified_action_concept_id where a.id = ?`,
        [c.vars.gov_seg2_campaign],
      );
      must(row?.act === 'UNCERTIFIED_ESCALATE', `acción: ${String(row?.act)}`);
      await exec(
        c,
        `delete from delegated_access.access_review_campaigns where id = ?`,
        [c.vars.gov_seg2_campaign],
      );
      await exec(
        c,
        `update delegated_access.support_grant_actions set superseded_at = null
          where id in (select a.id ${REVOKE_ATOM_ROW})`,
        [c.vars.gov_eng_sofia],
      );
    },
  ),
];

/** Los hallazgos de la ronda 2 con un caso HTTP (V-3, N-1, N-2, N-8, N-9). */
export const SEG2_FINDINGS: SmokeCase[] = [
  ...SETUP_CRITICAL,
  ...WIDEN_SCOPE,
  ...APPROVER_VIEW,
  ...REQUESTER_GONE,
  ...CONDITIONS_N8,
  ...CAMPAIGN_N9,
];
