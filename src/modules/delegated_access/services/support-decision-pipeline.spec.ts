import { jest } from '@jest/globals';
import { SupportDecisionPipeline } from './support-decision-pipeline';
import { SupportAccessContextLoader } from './support-access-context.loader';
import { SupportGovernanceRules } from './support-governance-rules.reader';
import { SupportUsageCounter } from './support-usage-counter';
import { AccessDecisionRecorder } from './access-decision-recorder.service';
import { AccessUsageRecorder } from './access-usage-recorder';
import { SupportApprovalGate } from './support-approval-gate';
import { DELEG } from '../delegated_access.concepts';
import { actionPayload, hashPayload } from '../domain/support-four-eyes';
import type {
  EngagementFacts,
  SupportCondition,
  SupportGrantFacts,
} from '../domain';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

// Martes 2026-11-03 10:30 en La Paz (UTC−4).
const NOW = new Date('2026-11-03T14:30:00Z');
const TENANT = 'tenant-hospital';
const logger = {
  setContext: mockFn(),
  warn: mockFn(),
  info: mockFn(),
  error: mockFn(),
};

const grant = (
  over: Partial<SupportGrantFacts> & { condition?: SupportCondition },
): SupportGrantFacts => ({
  grantId: 'g-ana',
  targetKind: 'PRACTITIONER',
  practitionerProfileId: 'prof-rojas',
  expansionMode: 'DYNAMIC',
  active: true,
  actions: ['schedule.cancel'],
  ...over,
});
const engagement = (grants: SupportGrantFacts[]): EngagementFacts => ({
  engagementId: 'eng-ana',
  userId: 'user-ana',
  templateCode: 'SECRETARY',
  active: true,
  acceptances: [
    { practitionerProfileId: 'prof-rojas', mayReplyOnBehalf: true },
  ],
  grants,
});
// Cancelar como átomo exige motivo (catálogo): el contexto lo trae salvo que se diga otra cosa.
const REASON = 'El paciente avisó que no puede venir';
const cancel = (
  context: Record<string, any> = {},
  action = 'agenda.appointment.cancel' as any,
) => ({
  action,
  practitionerProfileId: 'prof-rojas',
  practitionerRoleAssignmentIds: ['pra-rojas'],
  context: {
    appointmentStartAt: new Date('2026-11-04T14:30:00Z'),
    patientProfileId: 'pac-luis',
    ...context,
    proof: { reasonText: REASON, ...(context.proof ?? {}) },
  },
});

interface Setup {
  rules?: any[];
  network?: any;
  device?: any;
  stepUpAge?: number | null | undefined;
  stepUpThrows?: boolean;
  appendNow?: any;
  approval?: any;
  patients?: any;
}
function build(setup: Setup = {}) {
  const rulesRepo = {
    findActiveForTenant: mockFn().mockResolvedValue(setup.rules ?? []),
  };
  const rules = new SupportGovernanceRules(rulesRepo as any, logger as any);
  const ports = {
    network: {
      evaluate: mockFn().mockResolvedValue(
        setup.network ?? { satisfiesOrgRules: true, orgHasAllowRules: true },
      ),
    },
    sessions: {
      find: mockFn().mockResolvedValue({
        startedAt: new Date(NOW.getTime() - 3_600_000),
        deviceId: 'dev-1',
      }),
    },
    devices: { isTrusted: mockFn().mockResolvedValue(setup.device ?? true) },
    presence: { isOnline: mockFn().mockResolvedValue(true) },
    stepUp: {
      ageMinutes: mockFn().mockImplementation(async () => {
        if (setup.stepUpThrows) return undefined;
        return setup.stepUpAge === undefined ? null : setup.stepUpAge;
      }),
      isEnrolled: mockFn().mockResolvedValue(true),
    },
    zone: { timeZoneOf: mockFn().mockResolvedValue('America/La_Paz') },
    patients: {
      loadMany: mockFn().mockImplementation(
        async (_em: any, req: any) =>
          new Map(
            req.patientProfileIds.map((id: string) => [
              id,
              setup.patients ?? { flags: [], bookings: [], careTeam: [] },
            ]),
          ),
      ),
    },
  };
  const counter = new SupportUsageCounter(logger as any);
  const loader = new SupportAccessContextLoader(
    counter,
    logger as any,
    ports.patients as any,
    ports.sessions as any,
    ports.network as any,
    ports.devices as any,
    ports.presence as any,
    ports.stepUp as any,
    ports.zone as any,
  );
  const logRepo = {
    appendNow: setup.appendNow ?? mockFn().mockResolvedValue('row'),
  };
  const recorder = new AccessDecisionRecorder(
    {} as any,
    logRepo as any,
    logger as any,
  );
  const usageRepo = { upsertBuckets: mockFn().mockResolvedValue(undefined) };
  const usage = new AccessUsageRecorder(
    { fork: () => ({}) } as any,
    usageRepo as any,
    logger as any,
  );
  const fourEyes = {
    findById: mockFn().mockResolvedValue(setup.approval ?? null),
    consume: mockFn().mockResolvedValue(true),
    expireApproved: mockFn().mockResolvedValue(true),
  };
  const approvals = new SupportApprovalGate(fourEyes as any);
  const pipeline = new SupportDecisionPipeline(
    rules,
    loader,
    counter,
    recorder,
    usage,
    approvals,
    logger as any,
  );
  const tx: any = {
    isInTransaction: () => true,
    transactional: (fn: any) => fn(tx),
  };
  return {
    pipeline,
    ports,
    counter,
    logRepo,
    fourEyes,
    rulesRepo,
    rules,
    tx,
    usageRepo,
    usage,
  };
}
const run = (
  b: ReturnType<typeof build>,
  engagements: EngagementFacts[],
  query: any,
  over: Record<string, unknown> = {},
) =>
  b.pipeline.evaluate({
    em: b.tx,
    tenantId: TENANT,
    userId: 'user-ana',
    engagements,
    query,
    now: NOW,
    ...over,
  });
const rows = (b: ReturnType<typeof build>) =>
  b.logRepo.appendNow.mock.calls.map((c: any[]) => c[1]);

describe('SupportDecisionPipeline: sin condiciones (no regresión, AC-1 y AC-12)', () => {
  it('R-01: un alias sin condiciones permite igual que siempre y no consulta NADA del PIP, ni contadores ni registro', async () => {
    const b = build();
    const r = await run(
      b,
      [engagement([grant({})])],
      cancel({}, 'schedule.cancel'),
    );
    expect(r.decision).toMatchObject({
      allowed: true,
      effect: 'PERMIT',
      reason: 'ALLOWED',
      grantId: 'g-ana',
    });
    for (const port of Object.values(b.ports)) {
      for (const fn of Object.values(port as Record<string, any>))
        expect(fn).not.toHaveBeenCalled();
    }
    expect(b.logRepo.appendNow).not.toHaveBeenCalled();
    expect(b.rulesRepo.findActiveForTenant).toHaveBeenCalledTimes(1); // luego, caché
    await run(b, [engagement([grant({})])], cancel({}, 'schedule.cancel'));
    expect(b.rulesRepo.findActiveForTenant).toHaveBeenCalledTimes(1);
  });

  it('un DENY previo deja asiento y un PERMIT rutinario no', async () => {
    const b = build();
    const r = await run(
      b,
      [engagement([grant({ actions: ['schedule.view'] })])],
      cancel({}, 'schedule.cancel'),
    );
    expect(r.decision).toMatchObject({
      allowed: false,
      effect: 'DENY',
      reason: 'ACTION_NOT_GRANTED',
    });
    expect(rows(b)).toHaveLength(1);
    expect(rows(b)[0]).toMatchObject({
      reasonCode: 'ACTION_NOT_GRANTED',
      userId: 'user-ana',
      tenantId: TENANT,
    });
  });
});

describe('SupportDecisionPipeline: condiciones y hechos perezosos', () => {
  const windowCond: SupportCondition = {
    schemaVersion: 1,
    time: {
      timeZone: 'America/La_Paz',
      windows: [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }],
    },
    network: { require: 'ORG_RULES' },
  };
  const atomGrant = (condition: SupportCondition) =>
    grant({ actions: ['agenda.appointment.cancel'], condition });

  it('C-01: fuera de horario niega con TIME_WINDOW y NO consulta la red (lo barato primero)', async () => {
    const b = build();
    const monday1910 = new Date('2026-11-02T23:10:00Z');
    const r = await run(b, [engagement([atomGrant(windowCond)])], cancel(), {
      now: monday1910,
    });
    expect(r.decision).toMatchObject({ allowed: false, reason: 'TIME_WINDOW' });
    expect(r.decision.unmet?.map((u) => u.key)).toEqual(['time']);
    expect(b.ports.network.evaluate).not.toHaveBeenCalled();
    expect(rows(b)[0]).toMatchObject({ reasonCode: 'TIME_WINDOW' });
  });

  it('a las 10:00 del martes pasa las baratas y SÍ consulta la red, una sola vez', async () => {
    const b = build();
    const r = await run(b, [engagement([atomGrant(windowCond)])], cancel());
    expect(r.decision.allowed).toBe(true);
    expect(b.ports.network.evaluate).toHaveBeenCalledTimes(1);
    expect(b.ports.patients.loadMany).not.toHaveBeenCalled();
  });

  it('un puerto que falla deja el hecho indeterminado: NO abre (NETWORK_RULES_NOT_CONFIGURED/NETWORK_NOT_ALLOWED no, pero tampoco PERMIT)', async () => {
    const b = build();
    b.ports.network.evaluate.mockRejectedValue(new Error('db caída'));
    const r = await run(b, [engagement([atomGrant(windowCond)])], cancel());
    expect(r.decision.allowed).toBe(false);
    expect(r.decision.unmet?.[0]).toMatchObject({
      key: 'network',
      status: 'I',
    });
  });

  it('C-05: paciente CONFIDENTIAL excluido: PATIENT_EXCLUDED; el PIP trae las banderas del paciente de la acción', async () => {
    const b = build({
      patients: { flags: ['CONFIDENTIAL'], bookings: [], careTeam: [] },
    });
    const cond: SupportCondition = {
      schemaVersion: 1,
      patients: { exclude: { flags: ['VIP', 'CONFIDENTIAL'] } },
    };
    const r = await run(
      b,
      [engagement([atomGrant(cond)])],
      cancel({ patientProfileId: 'pac-reservado' }),
    );
    expect(r.decision).toMatchObject({
      allowed: false,
      reason: 'PATIENT_EXCLUDED',
    });
    expect(b.ports.patients.loadMany).toHaveBeenCalledTimes(1);
    expect(
      b.ports.patients.loadMany.mock.calls[0][1].patientProfileIds,
    ).toEqual(['pac-reservado']);
  });

  it('C-06: paciente con cita hoy con el doctor cubierto → PERMIT; sin cita → PATIENT_SCOPE', async () => {
    const cond: SupportCondition = {
      schemaVersion: 1,
      patients: {
        scope: 'WITH_APPOINTMENT_WINDOW',
        appointmentWindow: {
          daysBefore: 0,
          daysAfter: 0,
          withCoveredDoctor: true,
        },
      },
    };
    const withBooking = build({
      patients: {
        flags: [],
        careTeam: [],
        bookings: [
          {
            startAt: new Date('2026-11-03T16:00:00Z'),
            practitionerProfileId: 'prof-rojas',
          },
        ],
      },
    });
    expect(
      (await run(withBooking, [engagement([atomGrant(cond)])], cancel()))
        .decision.allowed,
    ).toBe(true);
    expect(
      withBooking.ports.patients.loadMany.mock.calls[0][1].bookingRange,
    ).toEqual({ daysBefore: 0, daysAfter: 0 });
    const without = build({
      patients: {
        flags: [],
        careTeam: [],
        bookings: [
          {
            startAt: new Date('2026-11-04T19:00:00Z'),
            practitionerProfileId: 'prof-rojas',
          },
        ],
      },
    });
    expect(
      (await run(without, [engagement([atomGrant(cond)])], cancel())).decision,
    ).toMatchObject({ allowed: false, reason: 'PATIENT_SCOPE' });
  });

  it('C-09: la regla L1 REQUIRE_CONDITION de red se cruza aunque el permiso no la traiga; (c) en equipo de confianza permite', async () => {
    const rule = {
      id: 'r-net',
      ruleKindConceptId: DELEG.GOV_RULE_REQUIRE_CONDITION,
      permissionPattern: 'agenda.*',
      ruleJson: {
        condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
      },
    };
    const outside = build({
      rules: [rule],
      network: { satisfiesOrgRules: false, orgHasAllowRules: true },
    });
    const denied = await run(
      outside,
      [engagement([grant({ actions: ['agenda.appointment.cancel'] })])],
      cancel(),
    );
    expect(denied.decision).toMatchObject({
      allowed: false,
      reason: 'NETWORK_NOT_ALLOWED',
    });
    const inside = build({ rules: [rule] });
    expect(
      (
        await run(
          inside,
          [engagement([grant({ actions: ['agenda.appointment.cancel'] })])],
          cancel(),
        )
      ).decision.allowed,
    ).toBe(true);
  });

  it('C-09: dispositivo que no es de confianza → DEVICE_NOT_TRUSTED', async () => {
    const b = build({ device: false });
    const cond: SupportCondition = {
      schemaVersion: 1,
      device: { knownOnly: true },
    };
    const r = await run(b, [engagement([atomGrant(cond)])], cancel(), {});
    expect(r.decision).toMatchObject({
      allowed: false,
      reason: 'DEVICE_NOT_TRUSTED',
    });
  });
});

describe('SEG A-M5: device.knownOnly sin cookie de dispositivo no cuenta como equipo conocido', () => {
  const cond: SupportCondition = {
    schemaVersion: 1,
    device: { knownOnly: true },
  };
  const atomGrant = (condition: SupportCondition) =>
    grant({ actions: ['agenda.appointment.cancel'], condition });
  /** Sesión y dispositivo los pone el servidor; aquí llegan en el contexto de la pregunta. */
  const session = { sessionId: 'sess-1', deviceId: 'dev-1' };
  const original = process.env.AUTH_DEVICE_COOKIE_ENABLED;
  afterEach(() => {
    if (original === undefined) delete process.env.AUTH_DEVICE_COOKIE_ENABLED;
    else process.env.AUTH_DEVICE_COOKIE_ENABLED = original;
  });

  it('con la cookie apagada, un equipo «de confianza» solo por huella de User-Agent NO pasa (F, falla cerrado)', async () => {
    delete process.env.AUTH_DEVICE_COOKIE_ENABLED;
    const b = build({ device: true });
    const r = await run(b, [engagement([atomGrant(cond)])], cancel(session));
    expect(r.decision).toMatchObject({
      allowed: false,
      reason: 'DEVICE_NOT_TRUSTED',
    });
    expect(r.decision.unmet?.[0]).toMatchObject({ status: 'F' });
    // Ni siquiera se consulta la tabla de dispositivos: sin cookie no hay nada que creer.
    expect(b.ports.devices.isTrusted).not.toHaveBeenCalled();
  });

  it('con la cookie encendida, el equipo de confianza pasa', async () => {
    process.env.AUTH_DEVICE_COOKIE_ENABLED = 'true';
    const b = build({ device: true });
    const r = await run(b, [engagement([atomGrant(cond)])], cancel(session));
    expect(r.decision.allowed).toBe(true);
  });

  it('con la cookie encendida, el equipo que no es de confianza sigue sin pasar', async () => {
    process.env.AUTH_DEVICE_COOKIE_ENABLED = 'true';
    const b = build({ device: false });
    const r = await run(b, [engagement([atomGrant(cond)])], cancel(session));
    expect(r.decision).toMatchObject({
      allowed: false,
      reason: 'DEVICE_NOT_TRUSTED',
    });
  });
});

describe('SupportDecisionPipeline: límites (C-04, AC-6)', () => {
  const cond: SupportCondition = {
    schemaVersion: 1,
    limits: [
      {
        metric: 'ACTIONS',
        per: 'DAY',
        max: 2,
        scope: 'GRANT',
        onExceed: 'DENY',
      },
    ],
  };
  const g = () =>
    grant({ actions: ['agenda.appointment.cancel'], condition: cond });

  it('consume en cada PERMIT y niega al llegar al tope con details.resetsAt; peek NO consume', async () => {
    const b = build();
    expect((await run(b, [engagement([g()])], cancel())).decision.allowed).toBe(
      true,
    );
    expect(
      (await run(b, [engagement([g()])], cancel({ peek: true }))).decision
        .allowed,
    ).toBe(true);
    expect((await run(b, [engagement([g()])], cancel())).decision.allowed).toBe(
      true,
    );
    const over = await run(b, [engagement([g()])], cancel());
    expect(over.decision).toMatchObject({
      allowed: false,
      reason: 'LIMIT_EXCEEDED',
    });
    expect(over.decision.unmet?.[0].details).toMatchObject({ used: 2, max: 2 });
    expect(over.decision.unmet?.[0].details?.resetsAt).toBe(
      '2026-11-04T04:00:00.000Z',
    );
    expect(rows(b).at(-1)).toMatchObject({ reasonCode: 'LIMIT_EXCEEDED' });
  });

  it('explicar (sideEffects:false) no consume ni registra ni cuenta', async () => {
    const b = build();
    for (let i = 0; i < 3; i += 1)
      await run(b, [engagement([g()])], cancel(), { sideEffects: false });
    expect(rows(b)).toHaveLength(0);
    expect((await run(b, [engagement([g()])], cancel())).decision.allowed).toBe(
      true,
    );
    expect((await run(b, [engagement([g()])], cancel())).decision.allowed).toBe(
      true,
    );
    expect((await run(b, [engagement([g()])], cancel())).decision.allowed).toBe(
      false,
    );
  });

  it('carrera: dos decisiones simultáneas al último cupo, una sola entra', async () => {
    const b = build();
    await run(b, [engagement([g()])], cancel());
    const [x, y] = await Promise.all([
      run(b, [engagement([g()])], cancel()),
      run(b, [engagement([g()])], cancel()),
    ]);
    expect(
      [x.decision.allowed, y.decision.allowed].filter(Boolean),
    ).toHaveLength(1);
  });
});

describe('SupportDecisionPipeline: aprobaciones (C-03, F-01)', () => {
  const leadTime: SupportCondition = {
    schemaVersion: 1,
    appointment: {
      leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
    },
  };
  const g = () =>
    grant({ actions: ['agenda.appointment.cancel'], condition: leadTime });
  const payload = actionPayload({
    atom: 'agenda.appointment.cancel',
    practitionerRoleAssignmentId: 'pra-rojas',
    patientProfileId: 'pac-luis',
    appointmentStartAt: new Date('2026-11-03T20:30:00Z'),
  });
  const approved = (over: Record<string, unknown> = {}) => ({
    id: 'ap-1',
    tenantId: TENANT,
    requesterUserId: 'user-ana',
    kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
    permissionCode: 'agenda.appointment.cancel',
    statusConceptId: DELEG.FOUR_EYES_APPROVED,
    payloadJson: payload,
    payloadHash: hashPayload(payload),
    approvedUntil: new Date(NOW.getTime() + 600_000),
    consumedAt: null,
    ...over,
  });
  const sixHours = { appointmentStartAt: new Date('2026-11-03T20:30:00Z') };

  it('con 6 h de anticipación: CHALLENGE APPROVAL (aprobador DOCTOR), sin approvalId', async () => {
    const b = build();
    const r = await run(b, [engagement([g()])], cancel(sixHours));
    expect(r.decision).toMatchObject({
      allowed: false,
      effect: 'CHALLENGE',
      reason: 'APPROVAL_REQUIRED',
    });
    expect(r.decision.challenge).toMatchObject({
      kind: 'APPROVAL',
      details: { approverKind: 'DOCTOR' },
    });
    expect(rows(b)[0]).toMatchObject({ reasonCode: 'APPROVAL_REQUIRED' });
  });

  it('con la aprobación del doctor → PERMIT y la aprobación se CONSUME una vez; la misma otra vez → desafío', async () => {
    const b = build({ approval: approved() });
    const ok = await run(
      b,
      [engagement([g()])],
      cancel({ ...sixHours, proof: { approvalId: 'ap-1' } }),
    );
    expect(ok.decision).toMatchObject({ allowed: true, effect: 'PERMIT' });
    expect(b.fourEyes.consume).toHaveBeenCalledTimes(1);
    expect(b.fourEyes.consume.mock.calls[0][1]).toBe('ap-1');
    expect(rows(b).at(-1)).toMatchObject({ approvalId: 'ap-1' });
    b.fourEyes.findById.mockResolvedValue(approved({ consumedAt: NOW }));
    const again = await run(
      b,
      [engagement([g()])],
      cancel({ ...sixHours, proof: { approvalId: 'ap-1' } }),
    );
    expect(again.decision).toMatchObject({
      allowed: false,
      reason: 'APPROVAL_REQUIRED',
    });
    expect(again.decision.challenge?.details.approvalProblem).toBe(
      'FOUR_EYES_ALREADY_CONSUMED',
    );
  });

  it('AC-10: diez usos simultáneos de la misma aprobación, uno solo gana', async () => {
    const b = build({ approval: approved() });
    let consumed = false;
    b.fourEyes.consume.mockImplementation(async () =>
      consumed ? false : (consumed = true),
    );
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        run(
          b,
          [engagement([g()])],
          cancel({ ...sixHours, proof: { approvalId: 'ap-1' } }),
        ),
      ),
    );
    expect(results.filter((r) => r.decision.allowed)).toHaveLength(1);
    expect(
      results
        .filter((r) => !r.decision.allowed)
        .every((r) => String(r.decision.reason) === 'APPROVAL_REQUIRED'),
    ).toBe(true);
  });

  it('F-01: la aprobación usada sobre OTRA cita → desafío con FOUR_EYES_PAYLOAD_CHANGED y no se consume', async () => {
    const b = build({ approval: approved() });
    const other = {
      ...sixHours,
      appointmentStartAt: new Date('2026-11-03T21:30:00Z'),
      proof: { approvalId: 'ap-1' },
    };
    const r = await run(b, [engagement([g()])], cancel(other));
    expect(r.decision.allowed).toBe(false);
    expect(r.decision.challenge?.details.approvalProblem).toBe(
      'FOUR_EYES_PAYLOAD_CHANGED',
    );
    expect(b.fourEyes.consume).not.toHaveBeenCalled();
  });
});

describe('SupportDecisionPipeline: obligaciones y evidencia obligatoria (C-10)', () => {
  const void_ = () =>
    grant({ grantId: 'g-caja', actions: ['billing.receipt.void'] });
  const ask = (context: Record<string, unknown> = {}) => ({
    action: 'billing.receipt.void',
    practitionerProfileId: 'prof-rojas',
    practitionerRoleAssignmentIds: ['pra-rojas'],
    context: { sessionId: 'sess-1', ...context },
  });

  it('motivo → paso extra → aprobación, en ese orden, y cada desafío deja su asiento', async () => {
    const b = build({ stepUpAge: null });
    const c1 = await run(b, [engagement([void_()])], ask());
    expect(c1.decision).toMatchObject({
      effect: 'CHALLENGE',
      reason: 'REASON_REQUIRED',
    });
    const c2 = await run(
      b,
      [engagement([void_()])],
      ask({ proof: { reasonText: 'Cobro duplicado del comprobante' } }),
    );
    expect(c2.decision).toMatchObject({
      effect: 'CHALLENGE',
      reason: 'STEP_UP_REQUIRED',
    });
    expect(c2.decision.challenge?.details).toMatchObject({ enrolled: true });
    expect(rows(b).map((r: any) => r.reasonCode)).toEqual([
      'REASON_REQUIRED',
      'STEP_UP_REQUIRED',
    ]);
  });

  it('Redis del paso extra caído: DENY STEP_UP_UNAVAILABLE (falla cerrado)', async () => {
    const b = build({ stepUpThrows: true });
    const r = await run(
      b,
      [engagement([void_()])],
      ask({ proof: { reasonText: 'Cobro duplicado del comprobante' } }),
    );
    expect(r.decision).toMatchObject({
      allowed: false,
      effect: 'DENY',
      reason: 'STEP_UP_UNAVAILABLE',
    });
  });

  it('sin estampa de paso extra no consulta la inscripción más de una vez y la sesión se resuelve una vez', async () => {
    const b = build({ stepUpAge: null });
    await run(
      b,
      [engagement([void_()])],
      ask({ proof: { reasonText: 'Cobro duplicado del comprobante' } }),
    );
    expect(b.ports.stepUp.ageMinutes).toHaveBeenCalledTimes(1);
  });

  it('un PERMIT ≥ ALTA se escribe en la bitácora; si no se puede escribir: DENY DECISION_LOG_UNAVAILABLE', async () => {
    const ok = build({ stepUpAge: 2 });
    const permitted = await run(
      ok,
      [engagement([void_()])],
      ask({ proof: { reasonText: 'Cobro duplicado del comprobante' } }),
    );
    // billing.receipt.void exige aprobación (segundo aprobador): con motivo y paso extra fresco pide la aprobación.
    expect(permitted.decision.reason).toBe('APPROVAL_REQUIRED');
    expect(permitted.decision.challenge?.details).toMatchObject({
      approverKind: 'SECOND_APPROVER',
    });
    const collect = build();
    const paid = await run(
      collect,
      [engagement([grant({ actions: ['billing.collect'] })])],
      {
        action: 'billing.collect',
        practitionerProfileId: 'prof-rojas',
        practitionerRoleAssignmentIds: ['pra-rojas'],
      },
    );
    expect(paid.decision).toMatchObject({ allowed: true });
    expect(rows(collect)).toHaveLength(1);
    expect(rows(collect)[0]).toMatchObject({
      permissionCode: 'billing.payment.collect',
      reasonCode: 'ALLOWED',
      grantId: 'g-ana',
    });

    const broken = build({
      appendNow: mockFn().mockRejectedValue(new Error('db caída')),
    });
    const failed = await run(
      broken,
      [engagement([grant({ actions: ['billing.collect'] })])],
      {
        action: 'billing.collect',
        practitionerProfileId: 'prof-rojas',
        practitionerRoleAssignmentIds: ['pra-rojas'],
      },
    );
    expect(failed.decision).toMatchObject({
      allowed: false,
      effect: 'DENY',
      reason: 'DECISION_LOG_UNAVAILABLE',
    });
  });

  it('un PERMIT de sensibilidad baja NO falla aunque la bitácora esté caída (mejor esfuerzo)', async () => {
    const broken = build({
      appendNow: mockFn().mockRejectedValue(new Error('db caída')),
    });
    const r = await run(
      broken,
      [engagement([grant({ actions: ['schedule.cancel'] })])],
      cancel({}, 'schedule.cancel'),
    );
    expect(r.decision.allowed).toBe(true);
  });
});

describe('SupportDecisionPipeline: reglas de la organización (G-02)', () => {
  it('DENY_PERMISSION niega de inmediato (incluso alias) y retirarla —invalidar la caché— lo vuelve a permitir', async () => {
    const rule = {
      id: 'r1',
      ruleKindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
      roleTemplateCode: 'SECRETARY',
      permissionPattern: 'agenda.appointment.cancel',
      messageText: 'La secretaría no cancela',
    };
    const b = build({ rules: [rule] });
    const denied = await run(
      b,
      [engagement([grant({})])],
      cancel({}, 'schedule.cancel'),
    );
    expect(denied.decision).toMatchObject({
      allowed: false,
      reason: 'ORG_RULE_DENY',
    });
    expect(rows(b)[0]).toMatchObject({
      ruleId: 'r1',
      reasonCode: 'ORG_RULE_DENY',
    });
    b.rulesRepo.findActiveForTenant.mockResolvedValue([]);
    b.rules.invalidate(TENANT);
    expect(
      (await run(b, [engagement([grant({})])], cancel({}, 'schedule.cancel')))
        .decision.allowed,
    ).toBe(true);
  });
});

describe('SupportDecisionPipeline.prepareListing (agenda combinada)', () => {
  it('con condiciones de paciente decide 200 filas con UNA carga de pacientes y sin tocar contadores', async () => {
    const cond: SupportCondition = {
      schemaVersion: 1,
      patients: { exclude: { flags: ['CONFIDENTIAL'] } },
    };
    const b = build({ patients: { flags: [], bookings: [], careTeam: [] } });
    const ids = Array.from({ length: 200 }, (_, i) => `pac-${i}`);
    const decide = await b.pipeline.prepareListing({
      em: b.tx,
      tenantId: TENANT,
      userId: 'user-ana',
      engagements: [
        engagement([
          grant({ actions: ['agenda.appointment.view'], condition: cond }),
        ]),
      ],
      patientProfileIds: ids,
      practitionerProfileIds: ['prof-rojas'],
      now: NOW,
    });
    const verdicts = ids.map((id) =>
      decide({
        action: 'agenda.appointment.view',
        practitionerProfileId: 'prof-rojas',
        practitionerRoleAssignmentIds: ['pra-rojas'],
        context: { patientProfileId: id },
      }),
    );
    expect(verdicts.every((v) => v.allowed)).toBe(true);
    expect(b.ports.patients.loadMany).toHaveBeenCalledTimes(1);
    expect(rows(b)).toHaveLength(0);
  });
});

describe('SupportDecisionPipeline.filterPatients (búsqueda exacta: átomo sin doctor)', () => {
  const searchGrant = (over: Parameters<typeof grant>[0] = {}) =>
    grant({ actions: ['patients.search.exact'], ...over });
  const filter = (
    b: ReturnType<typeof build>,
    engagements: EngagementFacts[],
    ids: string[],
  ) =>
    b.pipeline.filterPatients({
      em: b.tx,
      tenantId: TENANT,
      userId: 'user-ana',
      engagements,
      atom: 'patients.search.exact',
      patientProfileIds: ids,
      now: NOW,
    });

  it('sin condiciones ni DENY devuelve la lista tal cual y no consulta nada (no regresión)', async () => {
    const b = build();
    expect([
      ...(await filter(
        b,
        [engagement([grant({ actions: ['schedule.create'] })])],
        ['p1', 'p2'],
      )),
    ]).toEqual(['p1', 'p2']);
    expect(b.ports.patients.loadMany).not.toHaveBeenCalled();
  });

  it('las banderas excluidas quitan al paciente del resultado (indistinguible de inexistente)', async () => {
    const cond: SupportCondition = {
      schemaVersion: 1,
      patients: { exclude: { flags: ['VIP'] } },
    };
    const b = build();
    b.ports.patients.loadMany.mockImplementation(
      async (_e: any, req: any) =>
        new Map(
          req.patientProfileIds.map((id: string) => [
            id,
            {
              flags: id === 'p-vip' ? ['VIP'] : [],
              bookings: [],
              careTeam: [],
            },
          ]),
        ),
    );
    const out = await filter(
      b,
      [engagement([searchGrant({ condition: cond })])],
      ['p-ok', 'p-vip'],
    );
    expect([...out]).toEqual(['p-ok']);
  });

  it('una concesión DENY que alcanza al paciente lo oculta aunque haya un ALLOW', async () => {
    const b = build();
    b.ports.patients.loadMany.mockImplementation(
      async (_e: any, req: any) =>
        new Map(
          req.patientProfileIds.map((id: string) => [
            id,
            {
              flags: id === 'p-conf' ? ['CONFIDENTIAL'] : [],
              bookings: [],
              careTeam: [],
            },
          ]),
        ),
    );
    const deny = searchGrant({
      grantId: 'g-deny',
      effect: 'DENY',
      condition: {
        schemaVersion: 1,
        patients: { flags: { anyOf: ['CONFIDENTIAL'] } },
      },
    });
    const out = await filter(
      b,
      [engagement([searchGrant(), deny])],
      ['p-ok', 'p-conf'],
    );
    expect([...out]).toEqual(['p-ok']);
  });

  it('DISTINCT_PATIENTS se consume SOLO por los pacientes que quedan: al pasar el cupo el siguiente sale oculto', async () => {
    const cond: SupportCondition = {
      schemaVersion: 1,
      limits: [
        {
          metric: 'DISTINCT_PATIENTS',
          per: 'DAY',
          max: 1,
          scope: 'GRANT',
          onExceed: 'DENY',
        },
      ],
    };
    const b = build();
    const first = await filter(
      b,
      [engagement([searchGrant({ condition: cond })])],
      ['p1', 'p2'],
    );
    expect([...first]).toEqual(['p1']);
    // el mismo paciente otra vez no gasta cupo
    const again = await filter(
      b,
      [engagement([searchGrant({ condition: cond })])],
      ['p1'],
    );
    expect([...again]).toEqual(['p1']);
  });
});
