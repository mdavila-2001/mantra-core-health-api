import type { SmokeCase } from '../smoke-kit';
import { SEG1_HIGH_FINDINGS } from './support_staff_governance_seg1.smoke';
import { SEG2_FINDINGS } from './support_staff_governance_seg2.smoke';
import { SEG3_FINDINGS } from './support_staff_governance_seg3.smoke';
import {
  MODULE,
  PEOPLE,
  PILOT,
  SCENARIO_NOW,
  as,
  asSystem,
  exec,
  inDays,
  mintSystemToken,
  restepCase,
  rowsOfGovernance,
  loadPilot,
  loginCase,
  must,
  pilotAvailable,
  q,
  advanceClock,
  resetClock,
  setClock,
  step,
  stepUpCases,
  tokenOf,
  userIdOf,
  type Who,
} from './support_staff_governance.kit';

/**
 * Smoke HTTP del gobierno de accesos (CONTRATO-GOBIERNO §11.4, AC-11): los casos de integración
 * sobre el Hospital Piloto, contra la API real, con tokens reales de cada persona y la base
 * PostgreSQL de la corrida. Cada caso es una petición HTTP; las comprobaciones sobre la base
 * (asientos, filas consumidas, conteos) se hacen con SQL de solo lectura en el paso siguiente.
 *
 * Datos: demos 04 y 07 del modelo (carpeta `GOVERNANCE_DEMO_DIR`) más
 * `fixtures/support_staff_governance.fixture.sql`, cargados con `psql` DENTRO de la corrida (el
 * smoke vacía la base al arrancar). Reloj: martes 2026-11-03 10:30 en La Paz, salvo que el caso
 * lo cambie (`setClock`). Va al final del registro: lo que siembra no estorba a los otros módulos.
 */

/**
 * Ajuste previo de los 185 casos del recorrido de apoyo anterior (`support_staff*`): la compuerta de
 * ingreso (D-03, `onboardingRequired = true` sin fecha de corte) deja a todo vínculo NUEVO sin
 * operar hasta completar su lista (identidad, confidencialidad, dueño, paso extra); esos recorridos
 * crean la persona por la API y no completan la lista. La organización de la prueba declara que aún
 * no activa la compuerta (`onboardingRequired = false`, la lista sigue existiendo); la compuerta
 * encendida se prueba con el Hospital Piloto (caso 35).
 */
export const SUPPORT_STAFF_GOVERNANCE_PREAMBLE: SmokeCase[] = [
  {
    module: MODULE,
    endpoint: 'GET /org/governance/settings',
    name: 'setup: la organización de la prueba aún no activa la compuerta de ingreso (D-03)',
    method: 'get',
    path: () => '/org/governance/settings',
    tenantScoped: true,
    setup: async (c) => {
      await exec(
        c,
        `insert into practice.practice_settings (id, practice_id, setting_key, value_json, created_at, updated_at, row_version)
         values (gen_random_uuid(), ?, 'support.governance', '{"onboardingRequired": false}'::jsonb, now(), now(), 1)`,
        [c.vars.pracPracticeId],
      );
    },
    expectedStatus: 200,
    capture: (b) => {
      const settings = (b.settings ?? b) as { onboardingRequired?: boolean };
      must(
        settings.onboardingRequired === false,
        'los ajustes debían leerse con onboardingRequired=false',
      );
    },
  },
];

const WHO_LOGIN: Who[] = [
  'admin',
  'gonzalo',
  'ana',
  'lucia',
  'marcos',
  'rosa',
  'sofia',
  'ricardo',
  'mario',
  'nora',
  'pablo',
  'perez',
  'mendez',
  'suarez',
  'rojas',
];

/** Id de la reserva del escenario por su texto (los motivos del demo son únicos). */
const bookingByReason = async (
  c: Parameters<typeof q>[0],
  patient: string,
  hhmm: string,
  day = '2026-11-03',
): Promise<string> => {
  const rows = await q<{ id: string }>(
    c,
    `select b.id from scheduling.appointment_bookings b
       join scheduling.bookable_slots s on s.id = b.bookable_slot_id
       join profiles.persons p on p.id = b.patient_profile_id
      where b.tenant_id = ? and p.display_name = ?
        and to_char(s.start_at at time zone 'America/La_Paz', 'YYYY-MM-DD HH24:MI') = ?`,
    [PILOT, patient, `${day} ${hhmm}`],
  );
  must(
    rows.length === 1,
    `reserva de ${patient} ${day} ${hhmm}: ${rows.length}`,
  );
  return rows[0].id;
};

const SETUP: SmokeCase[] = [
  step(
    'setup: se siembra el Hospital Piloto (demos 04 y 07 + fixtures) y se pone el reloj en mar 2026-11-03 10:30',
    (c) => {
      loadPilot();
      setClock(SCENARIO_NOW);
      c.vars.gov_pilot = PILOT;
    },
  ),
  ...WHO_LOGIN.map((who) => loginCase(who)),
  step(
    'setup: se resuelven los ids del escenario (vínculos, doctores, reservas)',
    async (c) => {
      for (const who of WHO_LOGIN) {
        const rows = await q<{ id: string }>(
          c,
          `select a.id from delegated_access.organization_user_assignments a
           join directory.tenant_memberships m on m.id = a.tenant_membership_id
          where m.tenant_id = ? and m.user_id = ? order by a.created_at desc limit 1`,
          [PILOT, userIdOf(c, who)],
        );
        if (rows[0]) c.vars[`gov_eng_${who}`] = rows[0].id;
      }
      const roles = await q<{ name: string; id: string; pid: string }>(
        c,
        `select p.display_name as name, ra.id, ra.practitioner_profile_id as pid
         from practice.practitioner_role_assignments ra
         join profiles.persons p on p.id = ra.practitioner_profile_id
         join practice.practices pr on pr.id = ra.practice_id
        where pr.tenant_id = ?`,
        [PILOT],
      );
      const roleOf = (name: string): { id: string; pid: string } => {
        const r = roles.find((x) => x.name === name);
        must(r, `asignación de rol de ${name}`);
        return r as { id: string; pid: string };
      };
      c.vars.gov_role_perez = roleOf('Andrés Pérez').id;
      c.vars.gov_role_mendez = roleOf('Carla Méndez').id;
      c.vars.gov_role_suarez = roleOf('Martín Suárez').id;
      c.vars.gov_role_rojas = roleOf('Valeria Rojas').id;
      c.vars.gov_role_antelo = roleOf('Lucía Antelo').id;
      const pat = async (name: string): Promise<string> => {
        const r = await q<{ id: string }>(
          c,
          `select id from profiles.persons where display_name = ?`,
          [name],
        );
        must(r.length === 1, `paciente ${name}: ${r.length}`);
        return r[0].id;
      };
      c.vars.gov_pat_luis = await pat('Luis Choque');
      c.vars.gov_pat_carmen = await pat('Carmen Ortuño');
      c.vars.gov_pat_mateo = await pat('Mateo Rivera');
      c.vars.gov_bk_a10 = await bookingByReason(c, 'Luis Choque', '16:30');
      c.vars.gov_bk_a6 = await bookingByReason(
        c,
        'Paciente Reservado 02',
        '14:00',
      );
      c.vars.gov_bk_a4 = await bookingByReason(
        c,
        'Mateo Rivera',
        '09:00',
        '2026-11-04',
      );
      c.vars.gov_bk_a1 = await bookingByReason(c, 'Carmen Ortuño', '16:30');
      c.vars.gov_bk_a2 = await bookingByReason(
        c,
        'Carmen Ortuño',
        '07:00',
        '2026-11-04',
      );
      c.vars.gov_bk_a8 = await bookingByReason(c, 'Sandra Vargas', '12:00');
      // Ecografía, la ubicación de Lucía y la concesión de Ecografía de Marcos.
      c.vars.gov_svc_eco = 'da47af6a-fc7a-5d56-93cb-7bbe45b26ce5';
      const [lucia] = await q<{ space: string }>(
        c,
        `select g.care_space_id as space from delegated_access.support_scope_grants g
        where g.organization_user_assignment_id = ? and g.care_space_id is not null limit 1`,
        [c.vars.gov_eng_lucia],
      );
      c.vars.gov_space_lucia = lucia?.space ?? '';
      const [eco] = await q<{ id: string }>(
        c,
        `select g.id from delegated_access.support_scope_grants g
        where g.organization_user_assignment_id = ? and g.healthcare_service_id = ? limit 1`,
        [c.vars.gov_eng_marcos, c.vars.gov_svc_eco],
      );
      c.vars.gov_grant_marcos_eco = eco?.id ?? '';
      const [piso2] = await q<{ id: string }>(
        c,
        `select id from practice.care_spaces where code = 'DEMO_A_P2'`,
      );
      c.vars.gov_space_piso2 = piso2?.id ?? '';
      const [a7] = await q<{ id: string }>(
        c,
        `select b.id from scheduling.appointment_bookings b join scheduling.bookable_slots s on s.id = b.bookable_slot_id
        where b.tenant_id = ? and to_char(s.start_at at time zone 'America/La_Paz', 'YYYY-MM-DD HH24:MI') = '2026-11-05 10:00'`,
        [PILOT],
      );
      c.vars.gov_bk_a7 = a7?.id ?? '';
      await mintSystemToken(c);
      // Servicio, espacio y hora de cada reserva: la aprobación se firma sobre ellos (hash del cuerpo).
      for (const [key, id] of Object.entries({
        a10: c.vars.gov_bk_a10,
        a6: c.vars.gov_bk_a6,
        a4: c.vars.gov_bk_a4,
        a1: c.vars.gov_bk_a1,
      })) {
        const [row] = await q<{
          svc: string;
          space: string;
          at: string;
          pat: string;
        }>(
          c,
          `select b.healthcare_service_id as svc, b.care_space_id as space, b.patient_profile_id as pat,
                to_char(s.start_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
           from scheduling.appointment_bookings b join scheduling.bookable_slots s on s.id = b.bookable_slot_id
          where b.id = ?`,
          [id],
        );
        c.vars[`gov_bk_${key}_svc`] = row.svc;
        c.vars[`gov_bk_${key}_space`] = row.space;
        c.vars[`gov_bk_${key}_at`] = row.at;
        c.vars[`gov_bk_${key}_pat`] = row.pat;
      }
    },
  ),
];

/** Los tokens duran 15 minutos del reloj del escenario: tras un salto de reloj hay que volver a entrar. */
const RELOGIN = (who: Who[]): SmokeCase[] => [
  step(
    'setup: se firma de nuevo el token de plataforma con el reloj del escenario',
    (c) => mintSystemToken(c),
  ),
  ...who.map((w) => loginCase(w, true)),
];

/** Caso 6 (C-03): aprobación del doctor para cancelar con menos de 24 h. */
const CASE_06: SmokeCase[] = [
  as('ana', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 6: Ana cancela A10 (Luis con Rojas, faltan 6 h; su permiso exige 24 h) → 403 APPROVAL_REQUIRED',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a10}/cancel`,
    body: () => ({
      cancelledBy: 'PROVIDER',
      reasonText: 'El paciente avisó que no podrá venir hoy',
    }),
    expectedStatus: 403,
    expectedReason: 'APPROVAL_REQUIRED',
  }),
  as('ana', {
    endpoint: 'POST /me/support-approvals',
    name: 'caso 6: Ana pide la aprobación del doctor (cuatro ojos ACTION)',
    method: 'post',
    path: () => '/me/support-approvals',
    body: (c) => ({
      tenantId: PILOT,
      atom: 'agenda.appointment.cancel',
      practitionerRoleAssignmentId: c.vars.gov_role_rojas,
      healthcareServiceId: c.vars.gov_bk_a10_svc,
      careSpaceId: c.vars.gov_bk_a10_space,
      patientProfileId: c.vars.gov_bk_a10_pat,
      appointmentStartAt: c.vars.gov_bk_a10_at,
      reasonText: 'El paciente avisó que no podrá venir hoy',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      const approval = (b.approval ?? b) as { id?: string; status?: string };
      must(approval.id, 'la respuesta debía traer approval.id');
      c.vars.gov_appr_06 = String(approval.id);
    },
  }),
  as('rojas', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 6: la Dra. Rojas aprueba',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_06}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 200,
  }),
  as('ana', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 6: Ana reintenta con X-Approval-Id → 200 (PERMIT)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a10}/cancel`,
    headers: (c) => ({ 'X-Approval-Id': c.vars.gov_appr_06 }),
    body: () => ({
      cancelledBy: 'PROVIDER',
      reasonText: 'El paciente avisó que no podrá venir hoy',
    }),
    expectedStatus: 200,
  }),
  step(
    'caso 6: la aprobación quedó consumida (consumed_at) y el asiento PERMIT lleva su id',
    async (c) => {
      const rows = await q<{ consumed_at: string | null }>(
        c,
        `select consumed_at from delegated_access.four_eyes_requests where id = ?`,
        [c.vars.gov_appr_06],
      );
      must(rows[0]?.consumed_at, 'la aprobación debía quedar consumida');
    },
  ),
  as('ana', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 6: el mismo id otra vez → 403 APPROVAL_REQUIRED (ya consumida)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a10}/cancel`,
    headers: (c) => ({ 'X-Approval-Id': c.vars.gov_appr_06 }),
    body: () => ({
      cancelledBy: 'PROVIDER',
      reasonText: 'El paciente avisó que no podrá venir hoy',
    }),
    expectedStatus: 403,
    expectedReason: 'APPROVAL_REQUIRED',
  }),
];

/** Caso 20 (G-06): el personal de apoyo no tiene break-glass. */
const CASE_20: SmokeCase[] = [
  as('ana', {
    endpoint: 'POST /authz/patients/{patientProfileId}/break-the-glass',
    name: 'caso 20: Ana pide break-glass → 403 ROLE_INSUFFICIENT (el controlador exige CLINICAL_APPROVER o SECURITY_ADMIN antes del servicio)',
    method: 'post',
    path: (c) => `/authz/patients/${c.vars.gov_pat_luis}/break-the-glass`,
    body: () => ({
      tenantId: PILOT,
      justification: 'Necesito ver la historia del paciente ya',
    }),
    expectedStatus: 403,
    expectedReason: 'ROLE_INSUFFICIENT',
  }),
];

/** Caso 16 (G-02): una regla de la organización niega al instante y se retira al instante. */
const registerBody = (c: Parameters<typeof q>[0], n: number) => ({
  tenantId: PILOT,
  name: 'Prueba',
  lastName: `Humo${n}`,
  document: `GOV${c.u}${n}`,
  birthDate: '1990-01-01',
  phone: `+5917000${String(n).padStart(4, '0')}`,
});
const CASE_16: SmokeCase[] = [
  ...stepUpCases('admin'),
  as('lucia', {
    endpoint: 'POST /me/support-patients',
    name: 'caso 16: Lucía Paz registra un paciente → 201 (antes de la regla)',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => registerBody(c, 1),
    expectedStatus: 201,
  }),
  as('admin', {
    endpoint: 'POST /org/governance/rules',
    name: 'caso 16: el administrador crea DENY_PERMISSION FRONT_DESK × patients.profile.register',
    method: 'post',
    path: () => '/org/governance/rules',
    body: () => ({
      kind: 'DENY_PERMISSION',
      roleTemplateCode: 'FRONT_DESK',
      permissionPattern: 'patients.profile.register',
      message: 'Recepción no registra pacientes por ahora',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      must(b.id, 'la regla debía devolver su id');
      c.vars.gov_rule_16 = String(b.id);
    },
  }),
  as('lucia', {
    endpoint: 'POST /me/support-patients',
    name: 'caso 16: Lucía lo repite en la MISMA sesión → 403 de inmediato (la escritura invalidó la caché)',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => registerBody(c, 2),
    expectedStatus: 403,
  }),
  step(
    'caso 16: el asiento de la denegación (ORG_RULE_DENY) está en access_decision_log',
    async (c) => {
      const rows = await q<{ n: string }>(
        c,
        `select count(*)::int as n from delegated_access.access_decision_log
        where tenant_id = ? and user_id = ? and reason_code = 'ORG_RULE_DENY'`,
        [PILOT, userIdOf(c, 'lucia')],
      );
      must(Number(rows[0].n) >= 1, 'faltó el asiento ORG_RULE_DENY de Lucía');
    },
  ),
  as('admin', {
    endpoint: 'POST /org/governance/rules/{id}/retire',
    name: 'caso 16: el administrador retira la regla',
    method: 'post',
    path: (c) => `/org/governance/rules/${c.vars.gov_rule_16}/retire`,
    body: () => ({ reason: 'La recepción vuelve a registrar pacientes' }),
    expectedStatus: 200,
  }),
  as('lucia', {
    endpoint: 'POST /me/support-patients',
    name: 'caso 16: Lucía lo repite tras retirarla → 201 (PERMIT)',
    method: 'post',
    path: () => '/me/support-patients',
    body: (c) => registerBody(c, 3),
    expectedStatus: 201,
  }),
];

/** Casos 17 y 18 (G-03, G-04): techos y barandillas al otorgar, con su motivo en lenguaje simple. */
const addGrant = (
  who: Who,
  name: string,
  engOf: Who,
  body: (c: Parameters<typeof q>[0]) => Record<string, unknown>,
  expected: { status: number; reason?: string },
): SmokeCase =>
  as(who, {
    endpoint: 'POST /org/support-engagements/{id}/grants',
    name,
    method: 'post',
    path: (c) =>
      `/org/support-engagements/${c.vars[`gov_eng_${engOf}`]}/grants`,
    body,
    expectedStatus: expected.status,
    ...(expected.reason ? { expectedReason: expected.reason } : {}),
  });
const CASE_17: SmokeCase[] = [
  addGrant(
    'admin',
    'caso 17: billing.receipt.void a Lucía Paz → 422 GUARDRAIL_CEILING_EXCEEDED (techo de la plantilla)',
    'lucia',
    (c) => ({
      targetKind: 'LOCATION',
      careSpaceId: c.vars.gov_space_lucia,
      actions: ['billing.receipt.void'],
      validTo: inDays(30),
    }),
    { status: 422, reason: 'GUARDRAIL_CEILING_EXCEEDED' },
  ),
  addGrant(
    'admin',
    'caso 17: billing.payment.collect a Ana → 422 GUARDRAIL_CEILING_EXCEEDED (regla «Secretaría no cobra»)',
    'ana',
    () => ({
      targetKind: 'ALL_LOCATIONS',
      actions: ['billing.payment.collect'],
    }),
    { status: 422, reason: 'GUARDRAIL_CEILING_EXCEEDED' },
  ),
  addGrant(
    'admin',
    'caso 17: agenda.hours.edit a Lucía Paz → 422 GUARDRAIL_CEILING_EXCEEDED',
    'lucia',
    (c) => ({
      targetKind: 'LOCATION',
      careSpaceId: c.vars.gov_space_lucia,
      actions: ['agenda.hours.edit'],
    }),
    { status: 422, reason: 'GUARDRAIL_CEILING_EXCEEDED' },
  ),
  addGrant(
    'admin',
    'caso 18: team.sessionpolicy.manage a Ricardo → 422 GUARDRAIL_NOT_DELEGABLE',
    'ricardo',
    () => ({
      targetKind: 'ALL_LOCATIONS',
      actions: ['team.sessionpolicy.manage'],
    }),
    { status: 422, reason: 'GUARDRAIL_NOT_DELEGABLE' },
  ),
];

/** Casos 21 y 22 (S-01, S-02): segregación de funciones al otorgar y excepción con cuatro ojos. */
const justification =
  'Consultorio pequeño: la misma persona atiende mostrador y caja.';
const CASE_21_22: SmokeCase[] = [
  addGrant(
    'admin',
    'caso 21: billing.receipt.void a Mario (que cobra) → 422 SOD_CONFLICT_BLOCKED (SOD-BILL-01)',
    'mario',
    () => ({
      targetKind: 'ALL_LOCATIONS',
      actions: ['billing.receipt.void'],
      validTo: inDays(60),
    }),
    { status: 422, reason: 'SOD_CONFLICT_BLOCKED' },
  ),
  as('admin', {
    endpoint: 'POST /org/governance/sod-exceptions',
    name: 'caso 21: pedir excepción de la regla dura SOD-BILL-01 → 422 SOD_RULE_HARD',
    method: 'post',
    path: () => '/org/governance/sod-exceptions',
    body: (c) => ({
      engagementId: c.vars.gov_eng_mario,
      ruleCode: 'SOD-BILL-01',
      justification,
      validTo: inDays(60),
    }),
    expectedStatus: 422,
    expectedReason: 'SOD_RULE_HARD',
  }),
  ...stepUpCases('gonzalo'),
  addGrant(
    'admin',
    'caso 22: billing.receipt.issue a Lucía Paz (tiene walk_in) → 409 SOD_EXCEPTION_REQUIRED (SOD-BILL-03)',
    'lucia',
    (c) => ({
      targetKind: 'LOCATION',
      careSpaceId: c.vars.gov_space_lucia,
      actions: ['billing.receipt.issue'],
      validTo: inDays(60),
    }),
    { status: 409, reason: 'SOD_EXCEPTION_REQUIRED' },
  ),
  as('admin', {
    endpoint: 'POST /org/governance/sod-exceptions',
    name: 'caso 22: pide la excepción (justificación de 40+ caracteres, +60 días) → 202',
    method: 'post',
    path: () => '/org/governance/sod-exceptions',
    body: (c) => ({
      engagementId: c.vars.gov_eng_lucia,
      ruleCode: 'SOD-BILL-03',
      justification,
      validTo: inDays(60),
    }),
    expectedStatus: 202,
    capture: (b, c) => {
      must(b.approvalId, 'la petición debía devolver approvalId');
      c.vars.gov_appr_22 = String(b.approvalId);
    },
  }),
  as('admin', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 22: el mismo administrador intenta aprobar → 403 FOUR_EYES_SELF_APPROVAL',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_22}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 403,
    expectedReason: 'FOUR_EYES_SELF_APPROVAL',
  }),
  as('gonzalo', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 22: Gonzalo aprueba → 200 y nace la excepción ACTIVE',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_22}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 200,
  }),
  step('caso 22: la excepción quedó ACTIVE con valid_to', async (c) => {
    const rows = await q<{ n: string }>(
      c,
      `select count(*)::int as n from delegated_access.sod_exceptions
        where tenant_id = ? and organization_user_assignment_id = ? and valid_to is not null`,
      [PILOT, c.vars.gov_eng_lucia],
    );
    must(Number(rows[0].n) === 1, 'debía haber una excepción SoD de Lucía');
  }),
  addGrant(
    'admin',
    'caso 22: se reintenta el otorgamiento → 201',
    'lucia',
    (c) => ({
      targetKind: 'LOCATION',
      careSpaceId: c.vars.gov_space_lucia,
      actions: ['billing.receipt.issue'],
      validTo: inDays(60),
    }),
    { status: 201 },
  ),
];

/** Caso 39 (E-01): explicar ≡ decidir; simular sin efectos. */
const explainA4 = (c: Parameters<typeof q>[0], assume?: object) => ({
  engagementId: c.vars.gov_eng_marcos,
  action: 'agenda.appointment.cancel',
  practitionerRoleAssignmentId: c.vars.gov_role_suarez,
  healthcareServiceId: c.vars.gov_bk_a4_svc,
  careSpaceId: c.vars.gov_bk_a4_space,
  patientProfileId: c.vars.gov_bk_a4_pat,
  appointmentStartAt: c.vars.gov_bk_a4_at,
  ...(assume ? { assume } : {}),
});
const CASE_39: SmokeCase[] = [
  as('marcos', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 39: can() real de Marcos sobre A4 (menos de 24 h) → 403 APPROVAL_REQUIRED',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a4}/cancel`,
    body: () => ({
      cancelledBy: 'PROVIDER',
      reasonText: 'El paciente avisó que no podrá venir',
    }),
    expectedStatus: 403,
    expectedReason: 'APPROVAL_REQUIRED',
  }),
  step(
    'caso 39: se cuentan las filas de delegated_access antes de explicar y simular',
    async (c) => {
      c.vars.gov_rows_before = String(await rowsOfGovernance(c));
    },
  ),
  as('admin', {
    endpoint: 'POST /org/access/explain',
    name: 'caso 39: explain de la misma pregunta → mismo efecto (CHALLENGE por aprobación), traza y cupo 20/día',
    method: 'post',
    path: () => '/org/access/explain',
    body: (c) => explainA4(c),
    expectedStatus: 200,
    capture: (b) => {
      const d = b.decision as { effect?: string; reason?: string };
      must(
        d.effect === 'CHALLENGE' && d.reason === 'APPROVAL_REQUIRED',
        `explain: ${d.effect}/${d.reason}`,
      );
      must(
        Array.isArray(b.reasons) && (b.reasons as unknown[]).length >= 7,
        'la traza debía traer los pasos (reasons)',
      );
      const missing = b.missing as Array<{ kind?: string }>;
      must(
        missing.some((m) => m.kind === 'APPROVAL'),
        'debía faltar la aprobación del doctor',
      );
      const usage = b.usage as Array<{ used?: number; max?: number }>;
      must(
        usage.some((u) => u.max === 20 && typeof u.used === 'number'),
        'el cupo debía ser de 20 por día',
      );
    },
  }),
  as('admin', {
    endpoint: 'POST /org/access/simulate',
    name: 'caso 39: simulate con borrador = estado actual → todo SAME',
    method: 'post',
    path: () => '/org/access/simulate',
    body: (c) => ({
      engagementId: c.vars.gov_eng_marcos,
      draft: { mode: 'PATCH', grants: [], removeGrantIds: [] },
      autoScenarios: true,
    }),
    expectedStatus: 200,
    capture: (b) => {
      must(b.valid === true, 'el borrador igual al actual debía ser válido');
      const scenarios = b.scenarios as Array<{ change?: string }>;
      must(scenarios.length > 0, 'debía haber escenarios automáticos');
      must(
        scenarios.every((x) => x.change === 'SAME'),
        'todos los escenarios debían ser SAME',
      );
    },
  }),
  as('admin', {
    endpoint: 'POST /org/access/explain',
    name: 'caso 39: con assume { approvalGranted, reasonProvided } → PERMIT',
    method: 'post',
    path: () => '/org/access/explain',
    body: (c) => explainA4(c, { approvalGranted: true, reasonProvided: true }),
    expectedStatus: 200,
    capture: (b) => {
      must(
        (b.decision as { effect?: string }).effect === 'PERMIT',
        'con lo supuesto la decisión debía ser PERMIT',
      );
    },
  }),
  step(
    'caso 39: cero filas nuevas en delegated_access (explicar y simular no escriben)',
    async (c) => {
      const after = await rowsOfGovernance(c);
      must(
        after === Number(c.vars.gov_rows_before),
        `las filas pasaron de ${c.vars.gov_rows_before} a ${after}`,
      );
    },
  ),
];

/** Caso 40 (M-01): matriz, anomalías sembradas y exportación con motivo, paso extra y sello. */
const CASE_40: SmokeCase[] = [
  as('admin', {
    endpoint: 'GET /org/governance/access-matrix',
    name: 'caso 40: matriz «quién puede actuar sobre Pérez» (por doctor)',
    method: 'get',
    path: (c) =>
      `/org/governance/access-matrix?by=doctor&id=${c.vars.gov_role_perez}`,
    expectedStatus: 200,
  }),
  as('admin', {
    endpoint: 'GET /org/governance/anomalies',
    name: 'caso 40: anomalías abiertas sembradas (picos de búsqueda de Marcos y cuenta inactiva de Pablo)',
    method: 'get',
    path: () => '/org/governance/anomalies',
    expectedStatus: 200,
    capture: (b) => {
      const kinds = JSON.stringify(b);
      must(
        kinds.includes('ANOMALY_SEARCH_SPIKE'),
        'faltó ANOMALY_SEARCH_SPIKE',
      );
      must(
        kinds.includes('ANOMALY_INACTIVE_ACCOUNT'),
        'faltó ANOMALY_INACTIVE_ACCOUNT',
      );
    },
  }),
  as('admin', {
    endpoint: 'POST /org/governance/reports/{kind}/export',
    name: 'caso 40: exportar sin motivo → 422 EXPORT_REASON_REQUIRED',
    method: 'post',
    path: () => '/org/governance/reports/privilege-creep/export',
    body: () => ({ format: 'json', reason: 'corto' }),
    expectedStatus: 422,
    expectedReason: 'EXPORT_REASON_REQUIRED',
  }),
  step(
    'caso 40: pasan 20 minutos y el administrador vuelve a entrar (sesión nueva: sin paso extra)',
    () => {
      advanceClock(20 * 60_000);
    },
  ),
  ...RELOGIN(WHO_LOGIN),
  as('admin', {
    endpoint: 'POST /org/governance/reports/{kind}/export',
    name: 'caso 40: con motivo pero sin paso extra vigente → 403 STEP_UP_REQUIRED',
    method: 'post',
    path: () => '/org/governance/reports/privilege-creep/export',
    body: () => ({
      format: 'json',
      reason: 'Revisión trimestral de accesos del hospital',
    }),
    expectedStatus: 403,
    expectedReason: 'STEP_UP_REQUIRED',
  }),
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/governance/reports/{kind}/export',
    name: 'caso 40: exportación completa → 200 con sha256 y sin guardar el texto del motivo',
    method: 'post',
    path: () => '/org/governance/reports/privilege-creep/export',
    body: () => ({
      format: 'json',
      reason: 'Revisión trimestral con datos de Juan Pérez CI 1234567',
      reasonCode: 'AUDIT_REVIEW',
    }),
    expectedStatus: 200,
    capture: (b) => {
      must(
        /^[0-9a-f]{64}$/.test(String(b.sha256)),
        'el archivo debía traer su sha256',
      );
    },
  }),
  step(
    'caso 40: el asiento GOVERNANCE_REPORT_EXPORTED existe y NO contiene el texto libre del motivo (pendiente 18)',
    async (c) => {
      const rows = await q<{ detail_json: Record<string, unknown> }>(
        c,
        `select detail_json from delegated_access.access_decision_log
        where tenant_id = ? and reason_code = 'GOVERNANCE_REPORT_EXPORTED' order by recorded_at desc limit 1`,
        [PILOT],
      );
      must(rows.length === 1, 'faltó el asiento de la exportación');
      const text = JSON.stringify(rows[0].detail_json);
      must(
        !text.includes('Juan') && !text.includes('1234567'),
        'el asiento guardó texto libre del motivo',
      );
      must(
        rows[0].detail_json.reasonCode === 'AUDIT_REVIEW',
        'faltó reasonCode',
      );
      must(
        typeof rows[0].detail_json.reasonLength === 'number',
        'faltó reasonLength',
      );
      must(
        /^[0-9a-f]{64}$/.test(String(rows[0].detail_json.reasonSha256)),
        'faltó reasonSha256',
      );
    },
  ),
];

/** Caso 38 (D-02): administración delegada con techo y alcance (Sofía, jefa de Ecografía). */
const CASE_38: SmokeCase[] = [
  ...stepUpCases('sofia'),
  as('sofia', {
    endpoint: 'POST /org/team/members/{id}/suspend',
    name: 'caso 38: Sofía suspende a Marcos (tiene un permiso fuera de su alcance) → 403 ADMIN_SCOPE_EXCEEDED',
    method: 'post',
    path: (c) => `/org/team/members/${c.vars.gov_eng_marcos}/suspend`,
    body: () => ({ reasonCode: 'MANUAL', note: 'Prueba de alcance' }),
    expectedStatus: 403,
    expectedReason: 'ADMIN_SCOPE_EXCEEDED',
  }),
  as('sofia', {
    endpoint: 'PATCH /org/team/members/{id}/grants',
    name: 'caso 38: Sofía quita solo la concesión de Ecografía de Marcos → 200',
    method: 'patch',
    path: (c) => `/org/team/members/${c.vars.gov_eng_marcos}/grants`,
    body: (c) => ({ grantId: c.vars.gov_grant_marcos_eco, revoke: true }),
    expectedStatus: 200,
  }),
  as('sofia', {
    endpoint: 'GET /org/team/members',
    name: 'caso 38: Sofía lista a su equipo: a Marcos y a la gente de Ecografía, no a Ana ni a Lucía',
    method: 'get',
    path: () => '/org/team/members',
    expectedStatus: 200,
    capture: (b, c) => {
      const text = JSON.stringify(b);
      must(!text.includes(userIdOf(c, 'ana')), 'Sofía no debía ver a Ana');
      must(!text.includes(userIdOf(c, 'lucia')), 'Sofía no debía ver a Lucía');
    },
  }),
  as('sofia', {
    endpoint: 'POST /org/team/members/{id}/grants',
    name: 'caso 38: Sofía se otorga algo a sí misma → 403 GUARDRAIL_SELF_ADMIN',
    method: 'post',
    path: (c) => `/org/team/members/${c.vars.gov_eng_sofia}/grants`,
    body: () => ({
      targetKind: 'SERVICE',
      healthcareServiceId: 'da47af6a-fc7a-5d56-93cb-7bbe45b26ce5',
      actions: ['agenda.appointment.view'],
    }),
    expectedStatus: 403,
    expectedReason: 'GUARDRAIL_SELF_ADMIN',
  }),
  as('sofia', {
    endpoint: 'POST /org/team/members/{id}/grants',
    name: 'caso 38: Sofía le otorga algo a Ricardo (otro administrador, fuera de su alcance) → 404 uniforme (el contrato esperaba 403 GUARDRAIL_PEER_ADMIN)',
    method: 'post',
    path: (c) => `/org/team/members/${c.vars.gov_eng_ricardo}/grants`,
    body: () => ({
      targetKind: 'SERVICE',
      healthcareServiceId: 'da47af6a-fc7a-5d56-93cb-7bbe45b26ce5',
      actions: ['agenda.appointment.view'],
    }),
    expectedStatus: 404,
    expectedReason: 'SUPPORT_ENGAGEMENT_NOT_FOUND',
  }),
  {
    module: MODULE,
    endpoint: 'GET /org/team/members',
    name: 'caso 38: con X-Tenant-Id de OTRA organización Sofía no administra → 403',
    method: 'get',
    token: tokenOf('sofia'),
    headers: (c) => ({ 'X-Tenant-Id': c.tenantId }),
    path: () => '/org/team/members',
    expectedStatus: 403,
  },
];

/** Casos 25, 26 y 29 (K-01, K-02, K-05): campañas de certificación. */
const ecografia = (c: Parameters<typeof q>[0]) => ({
  name: 'Certificación Ecografía (humo)',
  kind: 'PERIODIC',
  scope: { kind: 'SERVICE', healthcareServiceIds: [c.vars.gov_svc_eco] },
  dueAt: inDays(14),
});
const itemOf = (b: unknown, userId: string): { id: string } | undefined =>
  (b as { items: Array<{ id: string; subjectUserId: string }> }).items.find(
    (i) => i.subjectUserId === userId,
  );
const CASE_25_26_29: SmokeCase[] = [
  as('admin', {
    endpoint: 'POST /org/access-reviews/campaigns/preview',
    name: 'caso 25: vista previa de Ecografía con sensibilidad ALTA → 1 ítem (el de Sofía, revisor ADMIN)',
    method: 'post',
    path: () => '/org/access-reviews/campaigns/preview',
    body: (c) => ({ ...ecografia(c), filters: { minSensitivity: 'ALTA' } }),
    expectedStatus: 200,
    capture: (b, c) => {
      const preview = b as {
        total: number;
        items: Array<{ subjectUserId: string; reviewerKind: string }>;
      };
      must(preview.total === 1, `ALTA debía dar 1 ítem y dio ${preview.total}`);
      must(
        preview.items[0].subjectUserId === userIdOf(c, 'sofia'),
        'el ítem ALTA debía ser el de Sofía',
      );
      must(
        preview.items[0].reviewerKind === 'ADMIN',
        'su revisor debía ser el administrador',
      );
    },
  }),
  as('admin', {
    endpoint: 'POST /org/access-reviews/campaigns/preview',
    name: 'caso 25: vista previa con sensibilidad MEDIA → 2 ítems (Sofía → ADMIN; Marcos → Sofía, SERVICE_HEAD)',
    method: 'post',
    path: () => '/org/access-reviews/campaigns/preview',
    body: (c) => ({ ...ecografia(c), filters: { minSensitivity: 'MEDIA' } }),
    expectedStatus: 200,
    capture: (b, c) => {
      const preview = b as {
        total: number;
        items: Array<{
          subjectUserId: string;
          reviewerKind: string;
          reviewerUserIds: string[];
        }>;
      };
      must(
        preview.total === 2,
        `MEDIA debía dar 2 ítems y dio ${preview.total}`,
      );
      const marcos = preview.items.find(
        (i) => i.subjectUserId === userIdOf(c, 'marcos'),
      );
      must(
        marcos?.reviewerKind === 'SERVICE_HEAD',
        'el ítem de Marcos debía ir al jefe de servicio',
      );
      must(
        marcos?.reviewerUserIds.includes(userIdOf(c, 'sofia')),
        'su revisora debía ser Sofía',
      );
    },
  }),
  as('admin', {
    endpoint: 'POST /org/access-reviews/campaigns',
    name: 'caso 25: se crea la campaña MEDIA',
    method: 'post',
    path: () => '/org/access-reviews/campaigns',
    body: (c) => ({ ...ecografia(c), filters: { minSensitivity: 'MEDIA' } }),
    expectedStatus: 201,
    capture: (b, c) => {
      must(b.id, 'la campaña debía devolver su id');
      c.vars.gov_camp_25 = String(b.id);
    },
  }),
  as('admin', {
    endpoint: 'POST /org/access-reviews/campaigns/{id}/launch',
    name: 'caso 25: se lanza → 200 con 2 ítems',
    method: 'post',
    path: (c) => `/org/access-reviews/campaigns/${c.vars.gov_camp_25}/launch`,
    expectedStatus: 200,
    capture: (b) => {
      must(Number(b.items) === 2, `se lanzaron ${String(b.items)} ítems`);
    },
  }),
  step(
    'caso 25: cada ítem trae su evidencia de 90 días y un evidence_hash de 64 hex',
    async (c) => {
      const rows = await q<{ h: string | null; u: unknown }>(
        c,
        `select evidence_hash as h, evidence_json -> 'usage90d' as u from delegated_access.access_review_items
        where access_review_campaign_id = ?`,
        [c.vars.gov_camp_25],
      );
      must(rows.length === 2, `ítems: ${rows.length}`);
      for (const r of rows) {
        must(/^[0-9a-f]{64}$/.test(String(r.h)), 'evidence_hash de 64 hex');
        must(r.u !== null && r.u !== undefined, 'evidence_json.usage90d');
      }
    },
  ),
  as('admin', {
    endpoint: 'GET /org/access-reviews/campaigns/{id}/items',
    name: 'caso 26: se leen los ítems de la campaña',
    method: 'get',
    path: (c) => `/org/access-reviews/campaigns/${c.vars.gov_camp_25}/items`,
    expectedStatus: 200,
    capture: (b, c) => {
      const marcos = itemOf(b, userIdOf(c, 'marcos'));
      const sofia = itemOf(b, userIdOf(c, 'sofia'));
      must(marcos && sofia, 'faltaron los ítems de Marcos o Sofía');
      c.vars.gov_item_marcos = String(marcos?.id);
      c.vars.gov_item_sofia = String(sofia?.id);
    },
  }),
  as('sofia', {
    endpoint: 'POST /me/access-reviews/items/{id}/decision',
    name: 'caso 26: un ajuste que AGREGA un átomo → 422 REVIEW_ADJUST_CANNOT_BROADEN',
    method: 'post',
    path: (c) => `/me/access-reviews/items/${c.vars.gov_item_marcos}/decision`,
    body: () => ({
      decision: 'ADJUST',
      comment: 'Agrego caja por pedido de la gerencia',
      adjustment: {
        atoms: ['agenda.appointment.view', 'billing.payment.collect'],
      },
    }),
    expectedStatus: 422,
    expectedReason: 'REVIEW_ADJUST_CANNOT_BROADEN',
  }),
  as('sofia', {
    endpoint: 'POST /me/access-reviews/items/{id}/decision',
    name: 'caso 26: un ajuste que QUITA agenda.appointment.cancel → 200',
    method: 'post',
    path: (c) => `/me/access-reviews/items/${c.vars.gov_item_marcos}/decision`,
    body: () => ({
      decision: 'ADJUST',
      comment: 'Marcos ya no cancela citas de Ecografía',
      adjustment: {
        atoms: ['agenda.appointment.view', 'agenda.appointment.create'],
      },
    }),
    expectedStatus: 200,
  }),
  as('gonzalo', {
    endpoint: 'POST /me/access-reviews/items/{id}/decision',
    name: 'caso 26: Gonzalo (el administrador que no otorgó la concesión, SOD-GOV-02) certifica el ítem ALTA de Sofía sin comentario → 422 REVIEW_COMMENT_REQUIRED',
    method: 'post',
    path: (c) => `/me/access-reviews/items/${c.vars.gov_item_sofia}/decision`,
    body: () => ({ decision: 'CERTIFY' }),
    expectedStatus: 422,
    expectedReason: 'REVIEW_COMMENT_REQUIRED',
  }),
  as('gonzalo', {
    endpoint: 'POST /me/access-reviews/items/{id}/decision',
    name: 'caso 26: con comentario → 200',
    method: 'post',
    path: (c) => `/me/access-reviews/items/${c.vars.gov_item_sofia}/decision`,
    body: () => ({
      decision: 'CERTIFY',
      comment:
        'Jefatura de Ecografía vigente; uso confirmado en los últimos 90 días',
    }),
    expectedStatus: 200,
  }),
  as('admin', {
    endpoint: 'POST /org/access-reviews/campaigns',
    name: 'caso 29: campaña de toda la organización para la decisión masiva',
    method: 'post',
    path: () => '/org/access-reviews/campaigns',
    body: () => ({
      name: 'Certificación general (humo)',
      kind: 'PERIODIC',
      scope: { kind: 'ORGANIZATION' },
      dueAt: inDays(14),
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.gov_camp_29 = String(b.id);
    },
  }),
  as('admin', {
    endpoint: 'POST /org/access-reviews/campaigns/{id}/launch',
    name: 'caso 29: se lanza',
    method: 'post',
    path: (c) => `/org/access-reviews/campaigns/${c.vars.gov_camp_29}/launch`,
    expectedStatus: 200,
  }),
  as('gonzalo', {
    endpoint: 'GET /me/access-reviews/items',
    name: 'caso 29: Gonzalo lee sus ítems pendientes',
    method: 'get',
    path: () => '/me/access-reviews/items?status=PENDING',
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (
        b as {
          items: Array<{
            id: string;
            campaignId: string;
            maxSensitivity?: string;
          }>;
        }
      ).items.filter((i) => i.campaignId === c.vars.gov_camp_29);
      must(items.length >= 2, `ítems del administrador: ${items.length}`);
      must(
        items.some(
          (i) => i.maxSensitivity === 'HIGH' || i.maxSensitivity === 'CRITICAL',
        ),
        'debía haber al menos un ítem ALTA entre los del administrador',
      );
      c.vars.gov_bulk_items = JSON.stringify(items.map((i) => i.id));
    },
  }),
  as('gonzalo', {
    endpoint: 'POST /me/access-reviews/items/bulk-decision',
    name: 'caso 29: CERTIFY masivo con un ítem ALTA → 422 REVIEW_BULK_NOT_ALLOWED (todo o nada)',
    method: 'post',
    path: () => '/me/access-reviews/items/bulk-decision',
    body: (c) => ({
      itemIds: JSON.parse(c.vars.gov_bulk_items) as string[],
      decision: 'CERTIFY',
      comment: 'Revisión masiva de bajo riesgo',
    }),
    expectedStatus: 422,
    expectedReason: 'REVIEW_BULK_NOT_ALLOWED',
  }),
  step('caso 29: no se aplicó ninguno de la lista (todo o nada)', async (c) => {
    const ids = JSON.parse(c.vars.gov_bulk_items) as string[];
    const rows = await q<{ n: string }>(
      c,
      `select count(*)::int as n from delegated_access.access_review_items
        where id in (${ids.map(() => '?').join(',')}) and decided_at is not null`,
      ids,
    );
    must(
      Number(rows[0].n) === 0,
      `se decidieron ${rows[0].n} ítems pese al 422`,
    );
  }),
];

/** Caso 28 (K-04): el barrido abre el ítem de recertificación y la ruta antigua lo cierra. */
const CASE_28: SmokeCase[] = [
  asSystem({
    endpoint: 'POST /delegated-access/support/governance-sweep',
    name: 'caso 28: el barrido diario del 2026-11-03 abre el ítem de recertificación de Ana (vence 2026-11-23)',
    method: 'post',
    path: () => '/delegated-access/support/governance-sweep',
    body: () => ({}),
    expectedStatus: 200,
  }),
  step(
    'caso 28: hay un ítem de vínculo (sin concesión) de Ana en una campaña «Recertificación 2026-11»',
    async (c) => {
      const rows = await q<{ name: string }>(
        c,
        `select cmp.name from delegated_access.access_review_items i
         join delegated_access.access_review_campaigns cmp on cmp.id = i.access_review_campaign_id
        where i.organization_user_assignment_id = ? and i.support_scope_grant_id is null and cmp.name like 'Recertificaci%'`,
        [c.vars.gov_eng_ana],
      );
      must(
        rows.length >= 1,
        'el barrido no abrió el ítem de recertificación de Ana',
      );
      c.vars.gov_recert_name = rows[0].name;
    },
  ),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/recertify',
    name: 'caso 28: la ruta antigua de recertificación cierra el ítem y fija last_certified_at',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_ana}/recertify`,
    body: () => ({}),
    expectedStatus: 200,
  }),
  step(
    'caso 28: el ítem quedó CERTIFIED y el vínculo tiene last_certified_at',
    async (c) => {
      const rows = await q<{ code: string }>(
        c,
        `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = i.decision_concept_id) as code
         from delegated_access.access_review_items i
        where i.organization_user_assignment_id = ? and i.support_scope_grant_id is null`,
        [c.vars.gov_eng_ana],
      );
      must(
        rows.some((r) => r.code === 'REVIEW_ITEM_CERTIFIED'),
        `estados: ${JSON.stringify(rows)}`,
      );
      const [a] = await q<{ t: string | null }>(
        c,
        `select last_certified_at as t from delegated_access.organization_user_assignments where id = ?`,
        [c.vars.gov_eng_ana],
      );
      must(a?.t, 'faltó last_certified_at');
    },
  ),
];

/** Caso 30 (L-01): baja de Pablo con traspaso a Ana. */
const CASE_30: SmokeCase[] = [
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/offboard',
    name: 'caso 30: baja de Pablo con traspaso a Ana (3 conversaciones, 2 tareas, 1 cita pendiente)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_pablo}/offboard`,
    body: (c) => ({
      reason: 'Fin de contrato de la central telefónica',
      handover: { defaultToUserId: userIdOf(c, 'ana') },
    }),
    expectedStatus: 200,
  }),
  step(
    'caso 30: vínculo y concesiones REVOKED; 6 filas de traspaso (5 REASSIGNED, 1 RETURNED_TO_POOL); caso LEAVER COMPLETED',
    async (c) => {
      const [a] = await q<{ st: string }>(
        c,
        `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = a.status_concept_id) as st
         from delegated_access.organization_user_assignments a where a.id = ?`,
        [c.vars.gov_eng_pablo],
      );
      must(
        a?.st === 'STATE_REVOKED' || String(a?.st).includes('REVOKED'),
        `vínculo de Pablo: ${a?.st}`,
      );
      const live = await q<{ n: string }>(
        c,
        `select count(*)::int as n from delegated_access.support_scope_grants g
        where g.organization_user_assignment_id = ? and g.status_concept_id = (select id from terminology.catalog_concepts where code = 'delegated_access:SUPPORT_GRANT_ACTIVE' limit 1)`,
        [c.vars.gov_eng_pablo],
      );
      must(
        Number(live[0].n) === 0,
        'Pablo debía quedar sin concesiones activas',
      );
      const items = await q<{ st: string; n: string }>(
        c,
        `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = h.status_concept_id) as st, count(*)::int as n
         from delegated_access.handover_items h
        where h.tenant_id = ? and h.from_user_id = ? group by 1`,
        [PILOT, userIdOf(c, 'pablo')],
      );
      const by = Object.fromEntries(items.map((i) => [i.st, Number(i.n)]));
      must(
        (by.HANDOVER_REASSIGNED ?? 0) === 5 &&
          (by.HANDOVER_RETURNED_TO_POOL ?? 0) === 1,
        `traspasos: ${JSON.stringify(by)}`,
      );
      const kase = await q<{ st: string }>(
        c,
        `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = l.status_concept_id) as st
         from delegated_access.lifecycle_cases l
        where l.organization_user_assignment_id = ? and l.kind_concept_id = (select id from terminology.catalog_concepts where code = 'delegated_access:LIFECYCLE_LEAVER' limit 1)`,
        [c.vars.gov_eng_pablo],
      );
      must(
        kase[0]?.st === 'LIFECYCLE_COMPLETED',
        `caso LEAVER: ${kase[0]?.st}`,
      );
    },
  ),
  as('pablo', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 30: Pablo ya no actúa → 403 (ENGAGEMENT_INACTIVE)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a1}/cancel`,
    body: () => ({
      cancelledBy: 'PROVIDER',
      reasonText: 'Intento tras la baja',
    }),
    expectedStatus: 403,
  }),
];

/** Caso 31 (L-02): baja de Ricardo, dueño de Lucía. */
const CASE_31: SmokeCase[] = [
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/offboard',
    name: 'caso 31: baja de Ricardo sin supervisedTo → 422 HANDOVER_SUPERVISOR_REQUIRED y nada cambia',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_ricardo}/offboard`,
    body: (c) => ({
      reason: 'Traslado del jefe de piso',
      handover: { defaultToUserId: userIdOf(c, 'ana') },
    }),
    expectedStatus: 422,
    expectedReason: 'HANDOVER_SUPERVISOR_REQUIRED',
  }),
  step('caso 31: Ricardo sigue ACTIVO tras el 422', async (c) => {
    const [a] = await q<{ st: string }>(
      c,
      `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = a.status_concept_id) as st
         from delegated_access.organization_user_assignments a where a.id = ?`,
      [c.vars.gov_eng_ricardo],
    );
    must(a?.st === 'ACTIVE', `Ricardo: ${a?.st}`);
  }),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/offboard',
    name: 'caso 31: con handover: null → 200 (baja inmediata, caso OPEN)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_ricardo}/offboard`,
    body: () => ({ reason: 'Traslado del jefe de piso', handover: null }),
    expectedStatus: 200,
  }),
  as('admin', {
    endpoint: 'GET /org/governance/ownerless',
    name: 'caso 31: Lucía aparece en «cuentas sin dueño» (su dueño ya no es elegible)',
    method: 'get',
    path: () => '/org/governance/ownerless',
    expectedStatus: 200,
    capture: (b, c) => {
      const items = (b as { items: Array<{ userId: string }> }).items;
      must(
        items.some((i) => i.userId === userIdOf(c, 'lucia')),
        'Lucía debía figurar en ownerless',
      );
    },
  }),
  as('admin', {
    endpoint: 'PUT /org/support-engagements/{id}/owner',
    name: 'caso 31: se asigna dueño a Lucía → 200',
    method: 'put',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_lucia}/owner`,
    body: (c) => ({ supervisorUserId: userIdOf(c, 'sofia') }),
    expectedStatus: 200,
  }),
  step('caso 31: el caso LEAVER de Ricardo pasó a COMPLETED', async (c) => {
    const [k] = await q<{ st: string }>(
      c,
      `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = l.status_concept_id) as st
         from delegated_access.lifecycle_cases l
        where l.organization_user_assignment_id = ? and l.kind_concept_id = (select id from terminology.catalog_concepts where code = 'delegated_access:LIFECYCLE_LEAVER' limit 1)`,
      [c.vars.gov_eng_ricardo],
    );
    must(k?.st === 'LIFECYCLE_COMPLETED', `caso LEAVER de Ricardo: ${k?.st}`);
  }),
];

/** Caso 34 (L-05): suspensión inmediata y reactivación con cuatro ojos. */
const CASE_34: SmokeCase[] = [
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/suspend',
    name: 'caso 34: suspender a Ana (INVESTIGATION) → 200',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_ana}/suspend`,
    body: () => ({
      reasonCode: 'INVESTIGATION',
      note: 'Revisión de seguridad',
    }),
    expectedStatus: 200,
  }),
  as('ana', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 34: Ana actúa suspendida → 403 al instante (sin esperar un barrido)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a2}/cancel`,
    body: () => ({
      cancelledBy: 'PROVIDER',
      reasonText: 'Intento mientras está suspendida',
    }),
    expectedStatus: 403,
  }),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/reactivate',
    name: 'caso 34: reactivar → 202 (cuatro ojos)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_ana}/reactivate`,
    body: () => ({ reason: 'La revisión de seguridad concluyó sin hallazgos' }),
    expectedStatus: 202,
    capture: (b, c) => {
      must(b.approvalId, 'la reactivación debía devolver approvalId');
      c.vars.gov_appr_34 = String(b.approvalId);
    },
  }),
  as('sofia', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 34: Sofía intenta aprobar → 403 FOUR_EYES_NOT_ELIGIBLE (investigación: solo SECURITY_ADMIN)',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_34}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 403,
    expectedReason: 'FOUR_EYES_NOT_ELIGIBLE',
  }),
  restepCase('gonzalo'),
  as('gonzalo', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 34: Gonzalo aprueba → 200',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_34}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 200,
  }),
  as('ana', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 34: Ana vuelve a PERMIT con sus concesiones intactas → 200',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a2}/cancel`,
    body: () => ({
      cancelledBy: 'PROVIDER',
      reasonText: 'El paciente pidió otra fecha',
    }),
    expectedStatus: 200,
  }),
];

/** Caso 35 (L-06): la compuerta de ingreso de Nora. */
const CASE_35: SmokeCase[] = [
  as('nora', {
    endpoint: 'POST /scheduling/bookings/{id}/check-in',
    name: 'caso 35: Nora (ingreso abierto, sin dueño) registra una llegada → 403 ONBOARDING_INCOMPLETE',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a8}/check-in`,
    body: () => ({}),
    expectedStatus: 403,
    expectedReason: 'ONBOARDING_INCOMPLETE',
  }),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/identity-verification',
    name: 'caso 35: el administrador registra la verificación de identidad en persona → 200 (el demo no la deja asentada)',
    method: 'post',
    path: (c) =>
      `/org/support-engagements/${c.vars.gov_eng_nora}/identity-verification`,
    body: () => ({
      method: 'IN_PERSON',
      note: 'Documento verificado en mostrador',
    }),
    expectedStatus: 200,
  }),
  as('nora', {
    endpoint: 'POST /me/support-engagements/{id}/confidentiality-ack',
    name: 'caso 35: Nora acepta su compromiso de confidencialidad → 200',
    method: 'post',
    path: (c) =>
      `/me/support-engagements/${c.vars.gov_eng_nora}/confidentiality-ack`,
    body: () => ({}),
    expectedStatus: 200,
  }),
  as('admin', {
    endpoint: 'PUT /org/support-engagements/{id}/owner',
    name: 'caso 35: el administrador asigna dueño a Nora (Dr. Méndez) → 200',
    method: 'put',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_nora}/owner`,
    body: (c) => ({ supervisorUserId: userIdOf(c, 'mendez') }),
    expectedStatus: 200,
  }),
  step(
    'caso 35: onboarding_completed_at fijado y el caso JOINER COMPLETED',
    async (c) => {
      const [a] = await q<{ t: string | null }>(
        c,
        `select onboarding_completed_at as t from delegated_access.organization_user_assignments where id = ?`,
        [c.vars.gov_eng_nora],
      );
      must(a?.t, 'Nora debía tener onboarding_completed_at');
    },
  ),
  as('nora', {
    endpoint: 'POST /scheduling/bookings/{id}/check-in',
    name: 'caso 35: ahora Nora registra la llegada → 200',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a8}/check-in`,
    body: () => ({}),
    expectedStatus: 200,
  }),
];

/** Caso 36 (F-01): cuatro ojos sobre una acción (aprobación que caduca y que solo vale para su cuerpo). */
const approvalOfA4 = (c: Parameters<typeof q>[0]) => ({
  tenantId: PILOT,
  atom: 'agenda.appointment.cancel',
  practitionerRoleAssignmentId: c.vars.gov_role_suarez,
  healthcareServiceId: c.vars.gov_bk_a4_svc,
  careSpaceId: c.vars.gov_bk_a4_space,
  patientProfileId: c.vars.gov_bk_a4_pat,
  appointmentStartAt: c.vars.gov_bk_a4_at,
  reasonText: 'El paciente avisó que no podrá venir mañana',
});
const cancelBody = () => ({
  cancelledBy: 'PROVIDER',
  reasonText: 'El paciente avisó que no podrá venir mañana',
});
const CASE_36: SmokeCase[] = [
  as('marcos', {
    endpoint: 'POST /me/support-approvals',
    name: 'caso 36: Marcos pide aprobación para cancelar A4 (22,5 h)',
    method: 'post',
    path: () => '/me/support-approvals',
    body: approvalOfA4,
    expectedStatus: 201,
    capture: (b, c) => {
      const approval = (b.approval ?? b) as { id?: string };
      must(approval.id, 'debía devolver approval.id');
      c.vars.gov_appr_36a = String(approval.id);
    },
  }),
  as('perez', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 36: el Dr. Pérez (no es el titular) intenta decidir → 403 FOUR_EYES_NOT_ELIGIBLE',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_36a}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 403,
    expectedReason: 'FOUR_EYES_NOT_ELIGIBLE',
  }),
  as('suarez', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 36: el Dr. Suárez aprueba → 200',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_36a}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 200,
  }),
  step(
    'caso 36: pasan 61 minutos y se vuelve a entrar (los tokens duran 15 minutos)',
    () => {
      advanceClock(61 * 60_000);
    },
  ),
  ...RELOGIN(['marcos', 'suarez', 'admin', 'gonzalo']),
  as('marcos', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 36: a los 61 minutos el id ya no sirve → 403 APPROVAL_REQUIRED',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a4}/cancel`,
    headers: (c) => ({ 'X-Approval-Id': c.vars.gov_appr_36a }),
    body: cancelBody,
    expectedStatus: 403,
    expectedReason: 'APPROVAL_REQUIRED',
  }),
  step('caso 36: la solicitud pasó a EXPIRED', async (c) => {
    const [r] = await q<{ st: string }>(
      c,
      `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = f.status_concept_id) as st
         from delegated_access.four_eyes_requests f where f.id = ?`,
      [c.vars.gov_appr_36a],
    );
    must(
      r?.st === 'FOUR_EYES_EXPIRED' || String(r?.st).includes('EXPIRED'),
      `estado: ${r?.st}`,
    );
  }),
  as('marcos', {
    endpoint: 'POST /me/support-approvals',
    name: 'caso 36: nueva aprobación sobre A4',
    method: 'post',
    path: () => '/me/support-approvals',
    body: approvalOfA4,
    expectedStatus: 201,
    capture: (b, c) => {
      const approval = (b.approval ?? b) as { id?: string };
      c.vars.gov_appr_36b = String(approval.id);
    },
  }),
  as('suarez', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 36: Suárez la aprueba → 200',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_36b}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 200,
  }),
  as('marcos', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 36: Marcos usa el id sobre A1 (otra cita, que su permiso no cubre) → 403 sin cobertura (el contrato esperaba 409 FOUR_EYES_PAYLOAD_CHANGED)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a1}/cancel`,
    headers: (c) => ({ 'X-Approval-Id': c.vars.gov_appr_36b }),
    body: cancelBody,
    expectedStatus: 403,
  }),
  as('marcos', {
    endpoint: 'POST /scheduling/bookings/{id}/cancel',
    name: 'caso 36: con la nueva sobre A4 → 200 (PERMIT)',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a4}/cancel`,
    headers: (c) => ({ 'X-Approval-Id': c.vars.gov_appr_36b }),
    body: cancelBody,
    expectedStatus: 200,
  }),
];

/** Caso 32 (L-03): cambio de rol de Marcos con simulación verificada (pendiente 11). */
const pisoDosMove = (c: Parameters<typeof q>[0]) => ({
  targetKind: 'LOCATION',
  careSpaceId: c.vars.gov_space_piso2,
  actions: ['agenda.appointment.view', 'agenda.appointment.check_in'],
});
const CASE_32: SmokeCase[] = [
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/access/simulate',
    name: 'caso 32: simulate del conjunto completo nuevo de Marcos (REPLACE, FRONT_DESK, Edificio A · Piso 2) → simulationToken',
    method: 'post',
    path: () => '/org/access/simulate',
    body: (c) => ({
      engagementId: c.vars.gov_eng_marcos,
      draft: {
        mode: 'REPLACE',
        templateCode: 'FRONT_DESK',
        grants: [{ effect: 'ALLOW', ...pisoDosMove(c) }],
        removeGrantIds: [],
      },
      autoScenarios: false,
    }),
    expectedStatus: 200,
    capture: (b, c) => {
      must(
        b.simulationToken,
        'el borrador válido debía devolver simulationToken',
      );
      c.vars.gov_simtoken = String(b.simulationToken);
    },
  }),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/move',
    name: 'caso 32: mover con un token de OTRO borrador → 409 SIMULATION_STALE (pendiente 11)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_marcos}/move`,
    body: (c) => ({
      reason: 'Pasa a recepción del Piso 2',
      newTemplateCode: 'FRONT_DESK',
      grants: [{ ...pisoDosMove(c), actions: ['agenda.appointment.view'] }],
      simulationToken: c.vars.gov_simtoken,
    }),
    expectedStatus: 409,
    expectedReason: 'SIMULATION_STALE',
  }),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/move',
    name: 'caso 32: mover lo simulado → 200 (lo anterior vence ahora, rige lo nuevo)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_marcos}/move`,
    body: (c) => ({
      reason: 'Pasa a recepción del Piso 2',
      newTemplateCode: 'FRONT_DESK',
      grants: [pisoDosMove(c)],
      simulationToken: c.vars.gov_simtoken,
    }),
    expectedStatus: 200,
    capture: (b) => {
      must(b.status === 'EXECUTED', `estado del cambio: ${String(b.status)}`);
    },
  }),
  step(
    'caso 32: las concesiones anteriores quedaron REVOKED y se abrió la campaña MOVER para su dueño (Sofía)',
    async (c) => {
      const live = await q<{ n: string }>(
        c,
        `select count(*)::int as n from delegated_access.support_scope_grants g
        where g.organization_user_assignment_id = ? and g.status_concept_id = (select id from terminology.catalog_concepts where code = 'delegated_access:SUPPORT_GRANT_ACTIVE' limit 1)`,
        [c.vars.gov_eng_marcos],
      );
      must(
        Number(live[0].n) === 1,
        `concesiones vivas de Marcos: ${live[0].n}`,
      );
      const items = await q<{ rk: string; rev: string | null }>(
        c,
        `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = i.reviewer_kind_concept_id) as rk, i.reviewer_user_id as rev
         from delegated_access.access_review_items i
         join delegated_access.access_review_campaigns k on k.id = i.access_review_campaign_id
        where i.organization_user_assignment_id = ? and k.kind_concept_id = (select id from terminology.catalog_concepts where code = 'delegated_access:REVIEW_KIND_MOVER' limit 1)`,
        [c.vars.gov_eng_marcos],
      );
      must(
        items.length === 1 && items[0].rev === userIdOf(c, 'sofia'),
        `ítems MOVER: ${JSON.stringify(items)}`,
      );
    },
  ),
  as('marcos', {
    endpoint: 'POST /scheduling/bookings/{id}/check-in',
    name: 'caso 32: Marcos registra la llegada en la sala 201 (Antelo lo aceptó) → 200',
    method: 'post',
    path: (c) => `/scheduling/bookings/${c.vars.gov_bk_a7}/check-in`,
    body: () => ({}),
    expectedStatus: 200,
  }),
];

/** Caso 27 (K-03): el barrido del 2026-11-06 revoca lo no certificado de la campaña vencida. */
const CASE_27: SmokeCase[] = [
  step(
    'caso 27: se pone el reloj en vie 2026-11-06 19:00 (la campaña vence 2026-10-30 18:00 + 7 días de gracia; a las 10:30 aún no cierra) y se vuelve a entrar',
    () => {
      setClock('2026-11-06T19:00:00-04:00');
    },
  ),
  ...RELOGIN(['admin']),
  asSystem({
    endpoint: 'POST /delegated-access/support/governance-sweep',
    name: 'caso 27: barrido del 2026-11-06 → UNCERTIFIED_REVOKE',
    method: 'post',
    path: () => '/delegated-access/support/governance-sweep',
    body: () => ({}),
    expectedStatus: 200,
  }),
  step(
    'caso 27: ítems vencidos AUTO_REVOKED, sus concesiones REVOKED con ended_reason, los vínculos intactos y campaña CLOSED',
    async (c) => {
      const items = await q<{ dec: string; g: string | null }>(
        c,
        `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = i.decision_concept_id) as dec,
              (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = g.status_concept_id) as g
         from delegated_access.access_review_items i
         join delegated_access.access_review_campaigns k on k.id = i.access_review_campaign_id
         left join delegated_access.support_scope_grants g on g.id = i.support_scope_grant_id
        where k.name = 'Certificación Q4-2026'`,
      );
      const auto = items.filter((i) => i.dec === 'REVIEW_ITEM_AUTO_REVOKED');
      // Los 3 ítems vencidos (Ana × Rojas, Marcos × Ecografía y Nora) se resuelven: el que sigue vivo
      // se auto-revoca; los que los casos 38 (Sofía quitó Ecografía a Marcos) y 33 (el cambio de rol de
      // Nora) ya habían revocado antes quedan SKIPPED (nada que revocar). Con el piloto recién
      // sembrado serían 3 AUTO_REVOKED, como dice el contrato.
      const skipped = items.filter((i) => i.dec === 'REVIEW_ITEM_SKIPPED');
      must(
        auto.length >= 1 && auto.length + skipped.length === 3,
        `AUTO_REVOKED: ${JSON.stringify(items)}`,
      );
      must(
        auto.every((i) => i.g === 'SUPPORT_GRANT_REVOKED'),
        'las concesiones no certificadas debían quedar REVOKED',
      );
      const [k] = await q<{ st: string }>(
        c,
        `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = status_concept_id) as st
         from delegated_access.access_review_campaigns where name = 'Certificación Q4-2026'`,
      );
      must(k?.st === 'REVIEW_CAMPAIGN_CLOSED', `campaña: ${k?.st}`);
      c.vars.gov_auto_revoked = String(auto.length);
      const [ana] = await q<{ st: string }>(
        c,
        `select (select regexp_replace(code, '^.*:', '') from terminology.catalog_concepts where id = a.status_concept_id) as st
           from delegated_access.organization_user_assignments a where a.id = ?`,
        [c.vars.gov_eng_ana],
      );
      must(
        ana?.st === 'ACTIVE',
        `el vínculo de Ana debía quedar intacto: ${ana?.st}`,
      );
    },
  ),
];

/** Caso 33 (L-04): un cambio de rol que sube privilegios pasa por cuatro ojos. */
const CASE_33: SmokeCase[] = [
  restepCase('admin'),
  as('admin', {
    endpoint: 'POST /org/support-engagements/{id}/move',
    name: 'caso 33: mover a Nora agregando la solicitud de acceso clínico temporal (ALTA, dentro del techo de enfermería) → 202 (ENGAGEMENT_MOVE)',
    method: 'post',
    path: (c) => `/org/support-engagements/${c.vars.gov_eng_nora}/move`,
    body: (c) => ({
      reason: 'Enfermería de Internación asume el registro de documentos',
      grants: [
        {
          targetKind: 'PRACTITIONER',
          practitionerRoleAssignmentId: c.vars.gov_role_mendez,
          actions: [
            'agenda.appointment.view',
            'patients.clinical.request_temporary_access',
          ],
        },
      ],
    }),
    expectedStatus: 202,
    capture: (b, c) => {
      must(b.status === 'PENDING_APPROVAL', `estado: ${String(b.status)}`);
      must(b.approvalId, 'debía devolver approvalId');
      c.vars.gov_appr_33 = String(b.approvalId);
    },
  }),
  as('admin', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 33: el administrador no puede aprobar lo que pidió → 403 FOUR_EYES_SELF_APPROVAL',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_33}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 403,
    expectedReason: 'FOUR_EYES_SELF_APPROVAL',
  }),
  restepCase('gonzalo'),
  as('gonzalo', {
    endpoint: 'POST /approvals/{id}/decision',
    name: 'caso 33: Gonzalo aprueba → se ejecuta el cambio',
    method: 'post',
    path: (c) => `/approvals/${c.vars.gov_appr_33}/decision`,
    body: () => ({ decision: 'APPROVE' }),
    expectedStatus: 200,
  }),
];

const END: SmokeCase[] = [
  step('cierre: el reloj vuelve al real', () => {
    resetClock();
  }),
];

/** Casos del Hospital Piloto (van al final del registro, tras los recorridos por actor). */
export const SUPPORT_STAFF_GOVERNANCE_SMOKE: SmokeCase[] = pilotAvailable()
  ? [
      ...SETUP,
      ...CASE_06,
      ...CASE_20,
      ...CASE_16,
      ...CASE_17,
      ...CASE_21_22,
      ...CASE_39,
      ...CASE_40,
      ...CASE_25_26_29,
      ...CASE_28,
      ...CASE_38,
      ...SEG1_HIGH_FINDINGS,
      ...SEG2_FINDINGS,
      ...SEG3_FINDINGS,
      ...CASE_30,
      ...CASE_31,
      ...CASE_34,
      ...CASE_35,
      ...CASE_36,
      ...CASE_33,
      ...CASE_32,
      ...CASE_27,
      ...END,
    ]
  : [];

// Reexportes de uso común en pruebas y mensajes.
export { MODULE, PEOPLE, tokenOf };
