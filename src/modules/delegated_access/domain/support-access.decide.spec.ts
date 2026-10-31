import {
  ANA,
  DOC,
  MARCOS,
  MARIO,
  NORA,
  NOW,
  PATIENT,
  ROOM,
  RULE_BILLING_NETWORK,
  RULE_DOCUMENT_FLOOR,
  at,
  baseFacts,
  engagement,
  grant,
  hoursFromNow,
  patientFacts,
  query,
  usageOf,
} from './support-access.decide.testing';
import { evaluateSupportAccessV2 } from './support-access.decide';
import { SupportAccessReason } from './support-access.types';
import type {
  EngagementFacts,
  SupportAccessQuery,
} from './support-access.types';
import type {
  GovernanceRuleFacts,
  SupportAccessContext,
  SupportAccessFacts,
} from './support-access-context';
import { validateCondition } from './support-conditions.validate';
import { SUPPORT_TEMPLATE_DEFAULTS } from './support-actions';

const evaluate = (
  engagements: readonly EngagementFacts[],
  q: SupportAccessQuery,
  now: Date = NOW,
  env: {
    facts?: SupportAccessFacts;
    rules?: readonly GovernanceRuleFacts[];
  } = {},
) => evaluateSupportAccessV2(engagements, q, now, env);

const withCtx = (
  q: SupportAccessQuery,
  context: SupportAccessContext,
): SupportAccessQuery => ({ ...q, context });

const unmetKeys = (r: ReturnType<typeof evaluate>): string[] =>
  (r.decision.unmet ?? []).map((u) => u.key);

/** Ana cancela una cita de Rojas: contexto del paciente y de la cita. */
function anaCancel(
  patient: string,
  startsAt: Date,
  extra: Partial<SupportAccessContext> = {},
): SupportAccessQuery {
  return withCtx(query('agenda.appointment.cancel', DOC.rojas, ROOM.b201), {
    patientProfileId: patient,
    appointmentStartAt: startsAt,
    ...extra,
  });
}
const REASON = 'La paciente avisó que no podrá asistir';

describe('R-01 · filas alias: nada cambia para quien ya tiene permisos', () => {
  it('Ana crea una cita con Pérez en el 103: PERMIT sin condiciones ni obligaciones nuevas', () => {
    const r = evaluate([ANA], query('schedule.create', DOC.perez, ROOM.a103));
    expect(r.decision).toMatchObject({
      effect: 'PERMIT',
      allowed: true,
      reason: SupportAccessReason.ALLOWED,
      grantId: 'g-ana-perez',
      atom: 'agenda.appointment.create',
    });
    expect(r.decision.unmet ?? []).toEqual([]);
    expect(r.decision.challenge).toBeUndefined();
    expect(r.obligations).toEqual({});
    expect(r.usage.consume).toEqual([]);
  });

  it('un alias cancelar no pide motivo aunque el átomo sí (regla de no regresión)', () => {
    const r = evaluate([ANA], query('schedule.cancel', DOC.perez));
    expect(r.decision.allowed).toBe(true);
    const atomOnly = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['agenda.appointment.cancel'],
      }),
    ]);
    const asAtom = evaluate(
      [atomOnly],
      query('agenda.appointment.cancel', DOC.perez),
    );
    expect(asAtom.decision).toMatchObject({
      effect: 'CHALLENGE',
      reason: SupportAccessReason.REASON_REQUIRED,
    });
  });

  it('SEG A-A2: una fila alias con condición (llegó por SQL directo) la EVALÚA: fail-closed', () => {
    // Antes: «un alias ignora las condiciones del permiso» → PERMIT a cualquier
    // hora. PoC revision-seg-a/alias.ts: a las 20:00 con ventana 08-12 daba ALLOWED.
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['schedule.cancel'],
        condition: {
          schemaVersion: 1,
          time: {
            timeZone: 'America/La_Paz',
            windows: [{ days: [6], from: '08:00', to: '09:00' }],
          },
        },
      }),
    ]);
    expect(
      evaluate([e], query('schedule.cancel', DOC.perez)).decision,
    ).toMatchObject({
      allowed: false,
      reason: SupportAccessReason.TIME_WINDOW,
    });
  });

  it('SEG A-A2: el alias SIN condición no cambia (sigue PERMIT), y las reglas de la organización lo alcanzan igual', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['schedule.cancel'],
      }),
    ]);
    expect(
      evaluate([e], query('schedule.cancel', DOC.perez)).decision.allowed,
    ).toBe(true);
    const rule: GovernanceRuleFacts = {
      id: 'r1',
      kind: 'REQUIRE_CONDITION',
      permissionPattern: 'agenda.*',
      condition: {
        schemaVersion: 1,
        time: {
          timeZone: 'America/La_Paz',
          windows: [{ days: [6], from: '08:00', to: '09:00' }],
        },
      },
    };
    const withRule = evaluate([e], query('schedule.cancel', DOC.perez), NOW, {
      rules: [rule],
    });
    expect(withRule.decision).toMatchObject({
      allowed: false,
      reason: SupportAccessReason.TIME_WINDOW,
    });
  });

  it('si el mismo permiso trae el alias y el átomo, gana el átomo (lo explícito)', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['schedule.cancel', 'agenda.appointment.cancel'],
      }),
    ]);
    expect(
      evaluate([e], query('schedule.cancel', DOC.perez)).decision.reason,
    ).toBe(SupportAccessReason.REASON_REQUIRED);
  });

  it('los 8 motivos actuales conservan su valor', () => {
    expect(SupportAccessReason.ALLOWED).toBe('ALLOWED');
    expect(SupportAccessReason.NO_ENGAGEMENT).toBe('NO_ENGAGEMENT');
    expect(SupportAccessReason.ENGAGEMENT_INACTIVE).toBe('ENGAGEMENT_INACTIVE');
    expect(SupportAccessReason.DOCTOR_NOT_ACCEPTED).toBe('DOCTOR_NOT_ACCEPTED');
    expect(SupportAccessReason.REPLY_NOT_ALLOWED_BY_DOCTOR).toBe(
      'REPLY_NOT_ALLOWED_BY_DOCTOR',
    );
    expect(SupportAccessReason.NO_COVERING_GRANT).toBe('NO_COVERING_GRANT');
    expect(SupportAccessReason.ACTION_NOT_GRANTED).toBe('ACTION_NOT_GRANTED');
    expect(SupportAccessReason.TARGET_OUTSIDE_TENANT).toBe(
      'TARGET_OUTSIDE_TENANT',
    );
  });
});

describe('C-01 · horario del permiso (lun-vie 07:30-18:30)', () => {
  const facts = baseFacts({
    patient: patientFacts(PATIENT.luis),
    usage: usageOf(5),
  });
  const startsInTwoDays = at('2026-11-05T10:00:00');

  it('el lunes a las 19:10: DENY TIME_WINDOW y solo el horario incumple', () => {
    const monday = at('2026-11-02T19:10:00');
    const r = evaluate(
      [ANA],
      anaCancel(PATIENT.luis, startsInTwoDays),
      monday,
      { facts },
    );
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      allowed: false,
      reason: SupportAccessReason.TIME_WINDOW,
    });
    expect(unmetKeys(r)).toEqual(['time']);
  });

  it('el mismo lunes a las 10:00, con más de 24 h y con motivo: PERMIT', () => {
    const monday = at('2026-11-02T10:00:00');
    const q = anaCancel(PATIENT.luis, startsInTwoDays, {
      proof: { reasonText: REASON },
    });
    const r = evaluate([ANA], q, monday, { facts });
    expect(r.decision).toMatchObject({
      effect: 'PERMIT',
      allowed: true,
      grantId: 'g-ana-rojas',
    });
    expect(r.usage.consume.map((c) => c.key.metric)).toEqual(['ACTIONS']);
  });

  it('el mismo lunes a las 10:00 sin motivo: CHALLENGE REASON_REQUIRED (el átomo cancelar lo exige)', () => {
    const monday = at('2026-11-02T10:00:00');
    const r = evaluate(
      [ANA],
      anaCancel(PATIENT.luis, startsInTwoDays),
      monday,
      { facts },
    );
    expect(r.decision).toMatchObject({
      effect: 'CHALLENGE',
      allowed: false,
      reason: SupportAccessReason.REASON_REQUIRED,
      challenge: { kind: 'REASON' },
    });
  });
});

describe('C-02 · ventana que cruza la medianoche, a nivel de decisión', () => {
  const night = engagement('e', { [DOC.perez]: false }, [
    grant('g', {
      targetKind: 'PRACTITIONER',
      practitionerProfileId: DOC.perez,
      actions: ['agenda.appointment.view'],
      condition: {
        schemaVersion: 1,
        time: {
          timeZone: 'America/La_Paz',
          windows: [{ days: [5], from: '22:00', to: '06:00' }],
        },
      },
    }),
  ]);
  it.each([
    ['vie 2026-11-06 23:30', '2026-11-06T23:30:00', true],
    ['sáb 2026-11-07 05:59', '2026-11-07T05:59:00', true],
    ['sáb 2026-11-07 06:00', '2026-11-07T06:00:00', false],
    ['vie 2026-11-06 21:59', '2026-11-06T21:59:00', false],
  ])('%s', (_label, iso, allowed) => {
    const r = evaluate(
      [night],
      query('agenda.appointment.view', DOC.perez),
      at(iso),
    );
    expect(r.decision.allowed).toBe(allowed);
    if (!allowed)
      expect(r.decision.reason).toBe(SupportAccessReason.TIME_WINDOW);
  });

  it('una ventana con from == to no se puede guardar (422 CONDITION_TIME_EMPTY_WINDOW) y si llegara rota cierra', () => {
    const empty = {
      schemaVersion: 1,
      time: { windows: [{ days: [5], from: '08:00', to: '08:00' }] },
    };
    expect(
      validateCondition(empty, {
        atom: 'agenda.appointment.view',
        effect: 'ALLOW',
      }).map((e) => e.code),
    ).toEqual(['CONDITION_TIME_EMPTY_WINDOW']);
    const broken = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['agenda.appointment.view'],
        condition: {
          schemaVersion: 1,
          time: {
            timeZone: 'America/La_Paz',
            windows: [{ days: [2], from: '08:00', to: '08:00' }],
          },
        },
      }),
    ]);
    const r = evaluate(
      [broken],
      query('agenda.appointment.view', DOC.perez),
      NOW,
    );
    expect(r.decision.allowed).toBe(false);
    expect(r.decision.unmet?.[0]).toMatchObject({ key: 'time', status: 'I' });
  });
});

describe('C-04 · tope diario: 20 de 20, explicar sin consumir y renovación', () => {
  const byDay = (key: { period: string }): number =>
    key.period === '2026-11-03' ? 20 : 0;
  const facts = baseFacts({
    patient: patientFacts(PATIENT.luis),
    usage: usageOf(byDay),
  });
  const q = anaCancel(PATIENT.luis, at('2026-11-06T10:00:00'), {
    proof: { reasonText: REASON },
  });

  it('la 21.ª cancelación: DENY LIMIT_EXCEEDED con la hora en que se renueva', () => {
    const r = evaluate([ANA], q, NOW, { facts });
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.LIMIT_EXCEEDED,
    });
    expect(r.decision.unmet?.[0].details).toMatchObject({
      metric: 'ACTIONS',
      per: 'DAY',
      max: 20,
      used: 20,
      resetsAt: '2026-11-04T04:00:00.000Z',
    });
    expect(r.usage.consume).toEqual([]);
  });

  it('explicar (peek) muestra el uso 20/20 y no consume nada', () => {
    const r = evaluate([ANA], withCtx(q, { ...q.context, peek: true }), NOW, {
      facts,
    });
    expect(r.decision.reason).toBe(SupportAccessReason.LIMIT_EXCEEDED);
    expect(r.usage.readings).toEqual([
      expect.objectContaining({
        used: 20,
        max: 20,
        resetsAt: '2026-11-04T04:00:00.000Z',
      }),
    ]);
    expect(r.usage.consume).toEqual([]);
  });

  it('al día siguiente a las 10:30 el límite diario se renovó: PERMIT y pide consumir 1', () => {
    const tomorrow = at('2026-11-04T10:30:00');
    const r = evaluate([ANA], q, tomorrow, { facts });
    expect(r.decision).toMatchObject({ effect: 'PERMIT', allowed: true });
    expect(r.usage.consume).toHaveLength(1);
    expect(r.usage.consume[0]).toMatchObject({
      amount: 1,
      key: {
        metric: 'ACTIONS',
        per: 'DAY',
        period: '2026-11-04',
        subject: 'g-ana-rojas',
      },
    });
    const peeked = evaluate(
      [ANA],
      withCtx(q, { ...q.context, peek: true }),
      tomorrow,
      { facts },
    );
    expect(peeked.decision.allowed).toBe(true);
    expect(peeked.usage.consume).toEqual([]);
  });
});

describe('C-05 / G-01 · pacientes reservados y denegación explícita', () => {
  const facts = (patient: string) =>
    baseFacts({ patient: patientFacts(patient), usage: usageOf(5) });

  it('A6 (Reservado 02, CONFIDENTIAL): cancelar da DENY PATIENT_EXCLUDED aunque haya una vía de aprobación por la anticipación', () => {
    const a6 = at('2026-11-03T14:00:00');
    const r = evaluate(
      [ANA],
      anaCancel(PATIENT.reservado02, a6, { proof: { reasonText: REASON } }),
      NOW,
      { facts: facts(PATIENT.reservado02) },
    );
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.PATIENT_EXCLUDED,
    });
    expect(unmetKeys(r)).toEqual(['patients.exclude', 'appointment.leadTime']);
  });

  it('A10 (Luis, hoy 16:30, faltan 6 h): CHALLENGE APPROVAL_REQUIRED del doctor; con aprobación y motivo: PERMIT', () => {
    const a10 = at('2026-11-03T16:30:00');
    const challenged = evaluate(
      [ANA],
      anaCancel(PATIENT.luis, a10, { proof: { reasonText: REASON } }),
      NOW,
      { facts: facts(PATIENT.luis) },
    );
    expect(challenged.decision).toMatchObject({
      effect: 'CHALLENGE',
      allowed: false,
      reason: SupportAccessReason.APPROVAL_REQUIRED,
      grantId: 'g-ana-rojas',
      challenge: {
        kind: 'APPROVAL',
        details: { approverKind: 'DOCTOR', atom: 'agenda.appointment.cancel' },
      },
    });
    const approved = evaluate(
      [ANA],
      anaCancel(PATIENT.luis, a10, {
        proof: { reasonText: REASON, approvalId: 'ap-1' },
      }),
      NOW,
      { facts: facts(PATIENT.luis) },
    );
    expect(approved.decision).toMatchObject({
      effect: 'PERMIT',
      allowed: true,
    });
  });

  it('G-01: A6, ver el motivo → DENY EXPLICIT_DENY aunque su fila ALLOW lo incluye', () => {
    const q = withCtx(
      query('agenda.appointment.view.reason', DOC.rojas, ROOM.b201),
      {
        patientProfileId: PATIENT.reservado02,
        appointmentStartAt: at('2026-11-03T14:00:00'),
      },
    );
    const r = evaluate([ANA], q, NOW, { facts: facts(PATIENT.reservado02) });
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.EXPLICIT_DENY,
      grantId: 'g-ana-rojas-deny',
    });
  });

  it('G-01: A10, ver el motivo → PERMIT con máscara PARTIAL', () => {
    const q = withCtx(
      query('agenda.appointment.view.reason', DOC.rojas, ROOM.b201),
      {
        patientProfileId: PATIENT.luis,
        appointmentStartAt: at('2026-11-03T16:30:00'),
      },
    );
    const r = evaluate([ANA], q, NOW, { facts: facts(PATIENT.luis) });
    expect(r.decision).toMatchObject({
      effect: 'PERMIT',
      allowed: true,
      grantId: 'g-ana-rojas',
    });
    expect(r.decision.visibleFields?.['agenda.appointment.view.reason']).toBe(
      'PARTIAL',
    );
  });

  it('una cita de Reservado 02 oculta el motivo aunque lo que se pida sea ver la agenda', () => {
    const q = withCtx(query('agenda.appointment.view', DOC.rojas, ROOM.b201), {
      patientProfileId: PATIENT.reservado02,
      appointmentStartAt: at('2026-11-03T14:00:00'),
    });
    const r = evaluate([ANA], q, NOW, { facts: facts(PATIENT.reservado02) });
    expect(r.decision.allowed).toBe(true);
    expect(r.decision.visibleFields).not.toHaveProperty([
      'agenda.appointment.view.reason',
    ]);
    expect(
      r.decision.visibleFields?.['agenda.appointment.view.patient_name'],
    ).toBe('FULL');
  });

  it('la denegación explícita con un dato que falta cuenta como T: ante la duda, niega', () => {
    const q = withCtx(
      query('agenda.appointment.view.reason', DOC.rojas, ROOM.b201),
      {
        appointmentStartAt: at('2026-11-03T16:30:00'),
      },
    );
    const r = evaluate([ANA], q, NOW, { facts: baseFacts() });
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.EXPLICIT_DENY,
    });
  });
});

describe('C-06 / C-07 · alcance de pacientes y datos que faltan (Nora)', () => {
  const reasonQ = (patient: string, starts: Date) =>
    withCtx(query('agenda.appointment.view.reason', DOC.mendez, ROOM.a103), {
      patientProfileId: patient,
      appointmentStartAt: starts,
    });

  it('A8 (Sandra, hoy 12:00): PERMIT con motivo PARTIAL', () => {
    const r = evaluate(
      [NORA],
      reasonQ(PATIENT.sandra, at('2026-11-03T12:00:00')),
      NOW,
      {
        facts: baseFacts({
          patient: patientFacts(PATIENT.sandra, { bookingsInWindow: true }),
        }),
      },
    );
    expect(r.decision).toMatchObject({ effect: 'PERMIT', allowed: true });
    expect(r.decision.visibleFields?.['agenda.appointment.view.reason']).toBe(
      'PARTIAL',
    );
  });

  it('A12 (Carmen, mañana, sin otra cita hoy con Méndez): el motivo no sale (PATIENT_SCOPE)', () => {
    const r = evaluate(
      [NORA],
      reasonQ(PATIENT.carmen, at('2026-11-04T15:00:00')),
      NOW,
      {
        facts: baseFacts({
          patient: patientFacts(PATIENT.carmen, { bookingsInWindow: false }),
        }),
      },
    );
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.PATIENT_SCOPE,
    });
  });

  it('C-07: con age.min = 18 y Sandra sin fecha de nacimiento: DENY PATIENT_AGE_UNKNOWN y la regla es válida', () => {
    const draft = {
      schemaVersion: 1,
      patients: {
        scope: 'WITH_APPOINTMENT_WINDOW',
        appointmentWindow: {
          daysBefore: 0,
          daysAfter: 0,
          withCoveredDoctor: true,
        },
        age: { min: 18 },
      },
      fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } },
    };
    expect(
      validateCondition(draft, {
        atom: 'agenda.appointment.view.reason',
        effect: 'ALLOW',
        grantAtoms: ['agenda.appointment.view.reason'],
      }),
    ).toEqual([]);
    const nora = engagement('e', { [DOC.mendez]: false }, [
      grant('g-draft', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.mendez,
        actions: ['agenda.appointment.view'],
        atomGrants: [
          {
            atom: 'agenda.appointment.view.reason',
            origin: 'ATOM',
            condition: draft as never,
          },
        ],
      }),
    ]);
    const r = evaluate(
      [nora],
      reasonQ(PATIENT.sandra, at('2026-11-03T12:00:00')),
      NOW,
      {
        facts: baseFacts({ patient: patientFacts(PATIENT.sandra) }),
      },
    );
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      allowed: false,
      reason: SupportAccessReason.PATIENT_AGE_UNKNOWN,
    });
    expect(r.decision.unmet?.[0].status).toBe('I');
  });
});

describe('C-08 · cobro con tope de monto (Mario)', () => {
  const collect = (amount?: { minorUnits: number }) =>
    withCtx(query('billing.payment.collect', DOC.perez, ROOM.a103), {
      ...(amount ? { amount: { currency: 'BOB' as const, ...amount } } : {}),
    });
  const env = {
    facts: baseFacts({ usage: usageOf(0, 1_000_000) }),
    rules: [RULE_BILLING_NETWORK],
  };

  it('Bs 1 500: PERMIT; Bs 2 500: CHALLENGE a un segundo aprobador; sin monto: DENY AMOUNT_UNKNOWN', () => {
    const ok = evaluate([MARIO], collect({ minorUnits: 150_000 }), NOW, env);
    expect(ok.decision).toMatchObject({ effect: 'PERMIT', allowed: true });
    expect(ok.usage.consume.map((c) => [c.key.metric, c.amount])).toEqual([
      ['AMOUNT', 150_000],
    ]);

    const over = evaluate([MARIO], collect({ minorUnits: 250_000 }), NOW, env);
    expect(over.decision).toMatchObject({
      effect: 'CHALLENGE',
      reason: SupportAccessReason.APPROVAL_REQUIRED,
      challenge: {
        kind: 'APPROVAL',
        details: { approverKind: 'SECOND_APPROVER' },
      },
    });

    const unknown = evaluate([MARIO], collect(), NOW, env);
    expect(unknown.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.AMOUNT_UNKNOWN,
    });
  });

  it('C-09: la regla L1 exige la red de la organización aunque la condición del permiso no la traiga', () => {
    const outside = evaluate([MARIO], collect({ minorUnits: 150_000 }), NOW, {
      ...env,
      facts: baseFacts({
        network: { satisfiesOrgRules: false, orgHasAllowRules: true },
        usage: usageOf(0),
      }),
    });
    expect(outside.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.NETWORK_NOT_ALLOWED,
    });
    expect(outside.decision.unmet?.[0].source).toBe('ORG_RULE');
    expect(outside.decision.unmet?.[0].ruleId).toBe('rule-billing-network');

    const untrusted = evaluate([MARIO], collect({ minorUnits: 150_000 }), NOW, {
      ...env,
      facts: baseFacts({ device: { trusted: false }, usage: usageOf(0) }),
    });
    expect(untrusted.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.DEVICE_NOT_TRUSTED,
    });
  });
});

describe('C-11 · presencia del doctor y duración de la sesión', () => {
  const reply = engagement('e', { [DOC.perez]: true }, [
    grant('g-reply', {
      targetKind: 'PRACTITIONER',
      practitionerProfileId: DOC.perez,
      actions: ['messages.conversation.reply_on_behalf'],
      condition: {
        schemaVersion: 1,
        presence: { doctor: 'ONLINE' },
        session: { maxSessionMinutes: 240 },
      },
    }),
  ]);
  const replyQ = withCtx(query('messages.reply_on_behalf', DOC.perez), {
    channels: ['CHAT'],
  });

  it('doctor fuera de línea: DENY DOCTOR_OFFLINE; en línea: PERMIT', () => {
    const offline = evaluate([reply], replyQ, NOW, {
      facts: baseFacts({ doctorOnline: false }),
    });
    expect(offline.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.DOCTOR_OFFLINE,
    });
    const online = evaluate([reply], replyQ, NOW, {
      facts: baseFacts({ doctorOnline: true }),
    });
    expect(online.decision).toMatchObject({ effect: 'PERMIT', allowed: true });
  });

  it('sesión de 5 h con tope de 4 h: DENY SESSION_TOO_LONG', () => {
    const r = evaluate([reply], replyQ, NOW, {
      facts: baseFacts({ session: { startedAt: hoursFromNow(-5) } }),
    });
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.SESSION_TOO_LONG,
    });
  });

  it('responder en nombre del doctor sigue exigiendo que él lo haya permitido', () => {
    const blocked = engagement(
      'e',
      { [DOC.perez]: false },
      reply.grants as never,
    );
    const r = evaluate([blocked], replyQ, NOW, { facts: baseFacts() });
    expect(r.decision.reason).toBe(
      SupportAccessReason.REPLY_NOT_ALLOWED_BY_DOCTOR,
    );
  });
});

describe('G-05 · piso de visibilidad de la organización (FIELD_FLOOR)', () => {
  it('el documento completo se muestra solo PARTIAL por el piso L1', () => {
    const ana = engagement('e', { [DOC.rojas]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.rojas,
        actions: [
          'agenda.appointment.view',
          'agenda.appointment.view.patient_document',
        ],
      }),
    ]);
    const q = query('agenda.appointment.view', DOC.rojas, ROOM.b201);
    const withFloor = evaluate([ana], q, NOW, { rules: [RULE_DOCUMENT_FLOOR] });
    expect(
      withFloor.decision.visibleFields?.[
        'agenda.appointment.view.patient_document'
      ],
    ).toBe('PARTIAL');
    const noFloor = evaluate([ana], q, NOW);
    expect(
      noFloor.decision.visibleFields?.[
        'agenda.appointment.view.patient_document'
      ],
    ).toBe('FULL');
  });

  it('el piso nunca revela más de lo que la concesión muestra: gana el más enmascarado', () => {
    const e = engagement('e', { [DOC.rojas]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.rojas,
        actions: ['agenda.appointment.view'],
        atomGrants: [
          {
            atom: 'agenda.appointment.view.patient_document',
            origin: 'ATOM',
            condition: {
              schemaVersion: 1,
              fields: {
                'agenda.appointment.view.patient_document': { mask: 'REDACT' },
              },
            },
          },
        ],
      }),
    ]);
    const r = evaluate([e], query('agenda.appointment.view', DOC.rojas), NOW, {
      rules: [RULE_DOCUMENT_FLOOR],
    });
    expect(
      r.decision.visibleFields?.['agenda.appointment.view.patient_document'],
    ).toBe('REDACT');
  });

  it('entre permisos aplicables se muestra el campo MENOS enmascarado', () => {
    const mk = (id: string, mask: 'PARTIAL' | 'REDACT') =>
      grant(id, {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.rojas,
        actions: ['agenda.appointment.view'],
        atomGrants: [
          {
            atom: 'agenda.appointment.view.patient_phone',
            origin: 'ATOM',
            condition: {
              schemaVersion: 1,
              fields: { 'agenda.appointment.view.patient_phone': { mask } },
            },
          },
        ],
      });
    const e = engagement('e', { [DOC.rojas]: false }, [
      mk('a', 'REDACT'),
      mk('b', 'PARTIAL'),
    ]);
    const r = evaluate([e], query('agenda.appointment.view', DOC.rojas), NOW);
    expect(
      r.decision.visibleFields?.['agenda.appointment.view.patient_phone'],
    ).toBe('PARTIAL');
  });
});

describe('capas de la decisión: barandilla L0, regla L1 y denegación explícita', () => {
  const lucia = (actions: readonly string[]) =>
    engagement(
      'e-lucia',
      { [DOC.mendez]: false },
      [
        grant('g-lucia', {
          targetKind: 'LOCATION',
          careSpaceId: 'a-p1',
          actions: actions as never,
        }),
      ],
      { templateCode: 'FRONT_DESK' },
    );
  const registerQ = query('patients.profile.register', DOC.mendez, ROOM.a103);

  it('L0: un átomo no asignable da DENY NOT_DELEGABLE aunque una fila lo incluya', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'ALL',
        actions: ['team.guardrails.manage'] as never,
      }),
    ]);
    const r = evaluate([e], query('team.guardrails.manage', DOC.perez));
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.NOT_DELEGABLE,
    });
  });

  it('G-02: una regla DENY_PERMISSION de la organización corta de inmediato y al retirarla vuelve a permitir', () => {
    const rule: GovernanceRuleFacts = {
      id: 'r-front',
      kind: 'DENY_PERMISSION',
      roleTemplateCode: 'FRONT_DESK',
      permissionPattern: 'patients.profile.register',
      message: 'Recepción no registra pacientes',
    };
    const e = lucia(['patient.register']);
    const denied = evaluate([e], registerQ, NOW, { rules: [rule] });
    expect(denied.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.ORG_RULE_DENY,
    });
    expect(
      denied.trace.steps.find((s) => s.layer === 'ORG_RULE' && !s.passed),
    ).toMatchObject({ ruleId: 'r-front' });
    expect(evaluate([e], registerQ, NOW, { rules: [] }).decision.allowed).toBe(
      true,
    );
    const other: GovernanceRuleFacts = {
      ...rule,
      roleTemplateCode: 'SECRETARY',
    };
    expect(
      evaluate([e], registerQ, NOW, { rules: [other] }).decision.allowed,
    ).toBe(true);
  });

  it('DENY_PERMISSION alcanza también a quien pregunta con el código antiguo', () => {
    const rule: GovernanceRuleFacts = {
      id: 'r',
      kind: 'DENY_PERMISSION',
      permissionPattern: 'billing.*',
    };
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('g', { targetKind: 'ALL', actions: ['billing.collect'] }),
    ]);
    expect(
      evaluate([e], query('billing.collect', DOC.perez), NOW, { rules: [rule] })
        .decision.reason,
    ).toBe(SupportAccessReason.ORG_RULE_DENY);
  });

  it('una concesión DENY gana sobre cualquier ALLOW, aun con otras vías', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('allow-1', {
        targetKind: 'ALL',
        actions: ['agenda.appointment.view'],
      }),
      grant('allow-2', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['agenda.appointment.view'],
      }),
      grant('deny', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        effect: 'DENY',
        actions: ['agenda.appointment.view'],
      }),
    ]);
    const r = evaluate([e], query('agenda.appointment.view', DOC.perez));
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.EXPLICIT_DENY,
      grantId: 'deny',
    });
  });

  it('una DENY solo aplica si cubre: otro doctor no queda cerrado', () => {
    const e = engagement('e', { [DOC.perez]: false, [DOC.rojas]: false }, [
      grant('allow', {
        targetKind: 'ALL',
        actions: ['agenda.appointment.view'],
      }),
      grant('deny', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        effect: 'DENY',
        actions: ['agenda.appointment.view'],
      }),
    ]);
    expect(
      evaluate([e], query('agenda.appointment.view', DOC.rojas)).decision
        .allowed,
    ).toBe(true);
  });

  it('el ingreso incompleto cierra con ONBOARDING_INCOMPLETE y no afecta a vínculos anteriores a la compuerta', () => {
    const nora = {
      ...NORA,
      onboardingIncomplete: true,
      onboardingPending: ['SUPERVISOR_ASSIGNED'],
    };
    const q = query('agenda.appointment.check_in', DOC.mendez, ROOM.a103);
    expect(evaluate([nora], q).decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.ONBOARDING_INCOMPLETE,
    });
    expect(
      evaluate([{ ...NORA, onboardingIncomplete: false }], q).decision.allowed,
    ).toBe(true);
  });

  it('el orden de hoy no cambia: NO_ENGAGEMENT, INACTIVE, DOCTOR_NOT_ACCEPTED, cobertura, acción', () => {
    const q = query('agenda.appointment.view', DOC.perez);
    expect(evaluate([], q).decision.reason).toBe(
      SupportAccessReason.NO_ENGAGEMENT,
    );
    expect(evaluate([{ ...ANA, active: false }], q).decision.reason).toBe(
      SupportAccessReason.ENGAGEMENT_INACTIVE,
    );
    expect(evaluate([{ ...ANA, acceptances: [] }], q).decision.reason).toBe(
      SupportAccessReason.DOCTOR_NOT_ACCEPTED,
    );
    expect(
      evaluate([ANA], query('agenda.appointment.view', DOC.suarez)).decision
        .reason,
    ).toBe(SupportAccessReason.DOCTOR_NOT_ACCEPTED);
    const lucia2 = lucia(['schedule.check_in']);
    expect(
      evaluate(
        [lucia2],
        query('agenda.appointment.view', DOC.mendez, {
          id: 'a-401',
          path: '/site-central/bld-a/a-p4/a-401/',
        }),
      ).decision.reason,
    ).toBe(SupportAccessReason.NO_COVERING_GRANT);
    expect(
      evaluate(
        [lucia2],
        query('agenda.appointment.create', DOC.mendez, ROOM.a103),
      ).decision.reason,
    ).toBe(SupportAccessReason.ACTION_NOT_GRANTED);
  });
});

describe('C-03 / R-03 · obligaciones en orden: motivo → paso extra → aprobación', () => {
  const asAtom = engagement('e', { [DOC.perez]: false }, [
    grant('g', {
      targetKind: 'PRACTITIONER',
      practitionerProfileId: DOC.perez,
      actions: ['billing.receipt.void', 'agenda.hours.edit'],
    }),
  ]);
  const voidQ = (proof: SupportAccessContext['proof']) =>
    withCtx(query('billing.receipt.void', DOC.perez), { proof });

  it('anular: sin motivo → motivo; con motivo → paso extra; con paso extra → aprobación; aprobada → PERMIT', () => {
    const noReason = evaluate([asAtom], voidQ(undefined), NOW, {
      facts: baseFacts(),
    });
    expect(noReason.decision).toMatchObject({
      effect: 'CHALLENGE',
      reason: SupportAccessReason.REASON_REQUIRED,
    });
    const noStepUp = evaluate([asAtom], voidQ({ reasonText: REASON }), NOW, {
      facts: baseFacts(),
    });
    expect(noStepUp.decision).toMatchObject({
      effect: 'CHALLENGE',
      reason: SupportAccessReason.STEP_UP_REQUIRED,
      challenge: {
        kind: 'STEP_UP',
        details: { maxAgeMinutes: 10, enrolled: true },
      },
    });
    const noApproval = evaluate([asAtom], voidQ({ reasonText: REASON }), NOW, {
      facts: baseFacts({ stepUpAgeMinutes: 3 }),
    });
    expect(noApproval.decision).toMatchObject({
      effect: 'CHALLENGE',
      reason: SupportAccessReason.APPROVAL_REQUIRED,
      challenge: {
        kind: 'APPROVAL',
        details: { approverKind: 'SECOND_APPROVER' },
      },
    });
    const ok = evaluate(
      [asAtom],
      voidQ({ reasonText: REASON, approvalId: 'ap' }),
      NOW,
      { facts: baseFacts({ stepUpAgeMinutes: 3 }) },
    );
    expect(ok.decision).toMatchObject({ effect: 'PERMIT', allowed: true });
  });

  it('un segundo paso viejo (más de 10 min) vuelve a pedir el desafío; sin factor inscrito guía a inscribirlo', () => {
    const stale = evaluate([asAtom], voidQ({ reasonText: REASON }), NOW, {
      facts: baseFacts({ stepUpAgeMinutes: 11 }),
    });
    expect(stale.decision.reason).toBe(SupportAccessReason.STEP_UP_REQUIRED);
    const unenrolled = evaluate([asAtom], voidQ({ reasonText: REASON }), NOW, {
      facts: baseFacts({ stepUpEnrolled: false }),
    });
    expect(unenrolled.decision.challenge).toMatchObject({
      kind: 'STEP_UP_ENROLL',
    });
  });

  it('si no se pudo comprobar el segundo paso falla cerrado (STEP_UP_UNAVAILABLE)', () => {
    const r = evaluate([asAtom], voidQ({ reasonText: REASON }), NOW, {
      facts: baseFacts({ stepUpAgeMinutes: undefined }),
    });
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.STEP_UP_UNAVAILABLE,
    });
  });

  it('R-03: el alias schedule.edit_hours no pide nada; el átomo exige motivo, paso extra y aprobación del doctor', () => {
    const legacy = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['schedule.edit_hours'],
      }),
    ]);
    expect(
      evaluate([legacy], query('schedule.edit_hours', DOC.perez), NOW, {
        facts: baseFacts(),
      }).decision.allowed,
    ).toBe(true);
    const atom = (proof?: SupportAccessContext['proof'], facts = baseFacts()) =>
      evaluate(
        [asAtom],
        withCtx(query('agenda.hours.edit', DOC.perez), { proof }),
        NOW,
        { facts },
      ).decision;
    expect(atom().reason).toBe(SupportAccessReason.REASON_REQUIRED);
    expect(atom({ reasonText: REASON }).reason).toBe(
      SupportAccessReason.STEP_UP_REQUIRED,
    );
    const approval = atom(
      { reasonText: REASON },
      baseFacts({ stepUpAgeMinutes: 1 }),
    );
    expect(approval).toMatchObject({
      reason: SupportAccessReason.APPROVAL_REQUIRED,
      challenge: { details: { approverKind: 'DOCTOR' } },
    });
  });

  it('el motivo exige la longitud del catálogo (5) o la de la condición, la mayor', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['agenda.appointment.cancel'],
        atomGrants: [
          {
            atom: 'agenda.appointment.cancel',
            origin: 'ATOM',
            condition: {
              schemaVersion: 1,
              obligations: { requireReason: { minLength: 20 } },
            },
          },
        ],
      }),
    ]);
    const decide = (text: string) =>
      evaluate(
        [e],
        withCtx(query('agenda.appointment.cancel', DOC.perez), {
          proof: { reasonText: text },
        }),
      ).decision;
    expect(decide('corto').reason).toBe(SupportAccessReason.REASON_REQUIRED);
    expect(decide('   '.padEnd(30)).reason).toBe(
      SupportAccessReason.REASON_REQUIRED,
    );
    expect(decide('un motivo con suficiente largo').allowed).toBe(true);
  });

  it('CHALLENGE nunca es allowed: los llamadores viejos fallan cerrado', () => {
    const r = evaluate([asAtom], voidQ(undefined), NOW, { facts: baseFacts() });
    expect(r.decision.effect).toBe('CHALLENGE');
    expect(r.decision.allowed).toBe(false);
  });
});

describe('AC-4 · combinación: suma, empates y condiciones ilegibles', () => {
  const view = query('agenda.appointment.view', DOC.perez);

  it('basta una candidata aplicable: una fila fuera de horario no limita a la fila que sí aplica', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('con-horario', {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['agenda.appointment.view'],
        condition: {
          schemaVersion: 1,
          time: {
            timeZone: 'America/La_Paz',
            windows: [{ days: [6], from: '08:00', to: '09:00' }],
          },
        },
      }),
      grant('sin-horario', {
        targetKind: 'ALL',
        actions: ['agenda.appointment.view'],
      }),
    ]);
    expect(evaluate([e], view).decision).toMatchObject({
      allowed: true,
      grantId: 'sin-horario',
    });
  });

  it('entre aplicables gana la de menos obligaciones; empate: objetivo más estrecho; empate: grantId', () => {
    const mk = (id: string, over: Partial<Parameters<typeof grant>[1]> = {}) =>
      grant(id, {
        targetKind: 'PRACTITIONER',
        practitionerProfileId: DOC.perez,
        actions: ['agenda.appointment.cancel'],
        ...over,
      });
    const noReasonRow = (
      id: string,
      kind: 'PRACTITIONER' | 'ALL' = 'PRACTITIONER',
    ) =>
      grant(id, {
        targetKind: kind,
        practitionerProfileId: kind === 'ALL' ? undefined : DOC.perez,
        actions: ['agenda.appointment.view'],
      });
    // «cancelar» como átomo pide motivo; como alias no pide nada: gana el alias (menos obligaciones).
    const e1 = engagement('e', { [DOC.perez]: false }, [
      mk('b-atom'),
      mk('a-legacy', { actions: ['schedule.cancel'] }),
    ]);
    expect(
      evaluate([e1], query('agenda.appointment.cancel', DOC.perez), NOW, {
        facts: baseFacts(),
      }).decision.grantId,
    ).toBe('a-legacy');
    // mismo conjunto de obligaciones: gana el objetivo más estrecho (único < todos).
    const e2 = engagement('e', { [DOC.perez]: false }, [
      noReasonRow('a-todos', 'ALL'),
      noReasonRow('z-unico'),
    ]);
    expect(evaluate([e2], view).decision.grantId).toBe('z-unico');
    // y el cruce < único.
    const cruce = grant('zz-cruce', {
      targetKind: 'PRACTITIONER_LOCATION',
      practitionerProfileId: DOC.perez,
      practiceSiteId: 'site-central',
      actions: ['agenda.appointment.view'],
    });
    const e3 = engagement('e', { [DOC.perez]: false }, [
      noReasonRow('a-unico'),
      cruce,
    ]);
    expect(
      evaluate([e3], query('agenda.appointment.view', DOC.perez, ROOM.a103))
        .decision.grantId,
    ).toBe('zz-cruce');
    // empate total: grantId ascendente.
    const e4 = engagement('e', { [DOC.perez]: false }, [
      noReasonRow('m'),
      noReasonRow('b'),
      noReasonRow('x'),
    ]);
    expect(evaluate([e4], view).decision.grantId).toBe('b');
  });

  it('una condición con schemaVersion mayor no se aplica: la fila no es candidata', () => {
    const future = grant('futura', {
      targetKind: 'ALL',
      actions: ['agenda.appointment.view'],
      condition: { schemaVersion: 2 } as never,
    });
    const plain = grant('plana', {
      targetKind: 'PRACTITIONER',
      practitionerProfileId: DOC.perez,
      actions: ['agenda.appointment.view'],
    });
    expect(
      evaluate([engagement('e', { [DOC.perez]: false }, [future, plain])], view)
        .decision.grantId,
    ).toBe('plana');
    const only = evaluate(
      [engagement('e', { [DOC.perez]: false }, [future])],
      view,
    );
    expect(only.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.CONDITION_UNREADABLE,
    });
    const flagged = grant('marcada', {
      targetKind: 'ALL',
      actions: ['agenda.appointment.view'],
      unreadable: true,
    });
    expect(
      evaluate([engagement('e', { [DOC.perez]: false }, [flagged])], view)
        .decision.reason,
    ).toBe(SupportAccessReason.CONDITION_UNREADABLE);
  });

  it('una fila DENY ilegible aplica como indeterminada (ante la duda, niega)', () => {
    const deny = grant('deny-futura', {
      targetKind: 'ALL',
      effect: 'DENY',
      actions: ['agenda.appointment.view'],
      condition: { schemaVersion: 7 } as never,
    });
    const allow = grant('allow', {
      targetKind: 'ALL',
      actions: ['agenda.appointment.view'],
    });
    const r = evaluate(
      [engagement('e', { [DOC.perez]: false }, [allow, deny])],
      view,
    );
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.EXPLICIT_DENY,
      grantId: 'deny-futura',
    });
  });

  it('un átomo con condiciones sin el dato que necesita queda indeterminado y nunca PERMIT', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'ALL',
        actions: ['agenda.appointment.view'],
        condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
      }),
    ]);
    const r = evaluate([e], view);
    expect(r.decision).toMatchObject({ effect: 'DENY', allowed: false });
    expect(r.decision.unmet?.[0]).toMatchObject({
      key: 'network',
      status: 'I',
    });
  });

  it('si algún incumplimiento no es aprobable el resultado es DENY con el primero por orden, aunque otro sí admita aprobación', () => {
    const e = engagement('e', { [DOC.perez]: false }, [
      grant('g', {
        targetKind: 'ALL',
        actions: ['schedule.view', 'agenda.appointment.cancel'],
        atomGrants: [
          {
            atom: 'agenda.appointment.cancel',
            origin: 'ATOM',
            condition: {
              schemaVersion: 1,
              time: {
                timeZone: 'America/La_Paz',
                windows: [{ days: [6], from: '08:00', to: '09:00' }],
              },
              appointment: {
                leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
              },
            },
          },
        ],
      }),
    ]);
    const q = withCtx(query('agenda.appointment.cancel', DOC.perez), {
      appointmentStartAt: hoursFromNow(2),
    });
    const r = evaluate([e], q, NOW, { facts: baseFacts() });
    expect(r.decision).toMatchObject({
      effect: 'DENY',
      reason: SupportAccessReason.TIME_WINDOW,
    });
    expect(unmetKeys(r)).toEqual(['time', 'appointment.leadTime']);
  });
});

describe('trazabilidad: lo que explica es lo que decide (§5.1)', () => {
  it('E-01: Marcos cancela con 6 h de anticipación: 8 pasos y decide el 7 (LEAD_TIME)', () => {
    const q = withCtx(
      query('agenda.appointment.cancel', DOC.suarez, ROOM.n102),
      {
        patientProfileId: PATIENT.luis,
        appointmentStartAt: at('2026-11-03T16:30:00'),
        proof: { reasonText: REASON },
      },
    );
    const r = evaluate([MARCOS], q, NOW, {
      facts: baseFacts({ usage: usageOf(3) }),
    });
    expect(r.decision).toMatchObject({
      effect: 'CHALLENGE',
      allowed: false,
      reason: SupportAccessReason.APPROVAL_REQUIRED,
      atom: 'agenda.appointment.cancel',
      grantId: 'g-marcos-suarez-norte',
    });
    expect(
      r.trace.steps.map((s) => [s.order, s.layer, s.passed, s.code]),
    ).toEqual([
      [1, 'ENGAGEMENT', true, 'ENGAGEMENT_ACTIVE'],
      [2, 'ENGAGEMENT', true, 'DOCTOR_ACCEPTED'],
      [3, 'GUARDRAIL', true, 'DELEGABLE'],
      [4, 'ORG_RULE', true, 'NO_ORG_RULE_DENY'],
      [5, 'EXPLICIT_DENY', true, 'NO_EXPLICIT_DENY'],
      [6, 'GRANT_COVERAGE', true, 'COVERED'],
      [7, 'CONDITION', false, 'LEAD_TIME'],
      [8, 'CONDITION', true, 'LIMIT_OK'],
    ]);
    expect(r.trace.steps[6]).toMatchObject({
      grantId: 'g-marcos-suarez-norte',
      atom: 'agenda.appointment.cancel',
      conditionPath:
        'actionConditions.agenda.appointment.cancel.appointment.leadTime',
      details: { minHours: 24, hoursLeft: 6, onViolation: 'REQUIRE_APPROVAL' },
    });
    expect(r.trace.steps[7].details).toMatchObject({
      used: 3,
      max: 20,
      per: 'DAY',
      resetsAt: '2026-11-04T04:00:00.000Z',
    });
    expect(r.trace.decidedByStep).toBe(7);
    expect(r.trace.candidates).toEqual([
      {
        grantId: 'g-marcos-suarez-norte',
        applicable: false,
        unmet: ['appointment.leadTime'],
      },
    ]);
    expect(r.usage.readings).toHaveLength(1);
    expect(r.usage.readings[0]).toMatchObject({ used: 3, max: 20 });
  });

  it('con aprobación y motivo la misma pregunta da PERMIT y el último paso es ALLOWED', () => {
    const q = withCtx(
      query('agenda.appointment.cancel', DOC.suarez, ROOM.n102),
      {
        patientProfileId: PATIENT.luis,
        appointmentStartAt: at('2026-11-03T16:30:00'),
        proof: { reasonText: REASON, approvalId: 'ap-1' },
      },
    );
    const r = evaluate([MARCOS], q, NOW, {
      facts: baseFacts({ usage: usageOf(3) }),
    });
    expect(r.decision.effect).toBe('PERMIT');
    const last = r.trace.steps[r.trace.steps.length - 1];
    expect(last).toMatchObject({ passed: true, code: 'ALLOWED' });
    expect(r.trace.decidedByStep).toBe(last.order);
  });

  it('cuando decide una denegación de las capas 1-3 la traza se corta ahí', () => {
    const rule: GovernanceRuleFacts = {
      id: 'r',
      kind: 'DENY_PERMISSION',
      permissionPattern: 'agenda.*',
      message: 'No',
    };
    const r = evaluate(
      [ANA],
      query('agenda.appointment.view', DOC.perez),
      NOW,
      { rules: [rule] },
    );
    expect(r.trace.steps.map((s) => s.code)).toEqual([
      'ENGAGEMENT_ACTIVE',
      'DOCTOR_ACCEPTED',
      'DELEGABLE',
      'ORG_RULE_DENY',
    ]);
    expect(r.trace.decidedByStep).toBe(4);
    expect(r.trace.candidates).toEqual([]);
  });

  it('los mensajes de la traza están en español, de usted, y sin PHI', () => {
    const q = withCtx(
      query('agenda.appointment.cancel', DOC.suarez, ROOM.n102),
      {
        patientProfileId: PATIENT.luis,
        appointmentStartAt: at('2026-11-03T16:30:00'),
      },
    );
    const r = evaluate([MARCOS], q, NOW, {
      facts: baseFacts({ usage: usageOf(3) }),
    });
    for (const step of r.trace.steps) {
      expect(step.message.length).toBeGreaterThan(10);
      expect(step.message).not.toContain(PATIENT.luis);
    }
    expect(r.trace.steps[6].message).toContain('6 horas');
  });
});

describe('compatibilidad de firma', () => {
  it('SUPPORT_TEMPLATE_DEFAULTS (v1) sigue siendo la fuente de las plantillas heredadas', () => {
    expect(SUPPORT_TEMPLATE_DEFAULTS.SECRETARY).toContain('schedule.view');
  });
});
