import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { SOD_PLATFORM_RULES, canonicalJson, sha256Hex } from '../domain';
import {
  MARCOS,
  NOW,
  PATIENT,
  ROOM,
  at,
  baseFacts,
  usageOf,
} from '../domain/support-access.decide.testing';
import {
  AccessExplainService,
  simulationTokenOf,
  verifySimulationToken,
} from './access-explain.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const ADMIN = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;
const MARCOS_USER = { id: 'u-marcos', roles: ['SUPPORT_STAFF'] } as any;

const ROLE_SUAREZ = 'role-suarez';
const marcosRecord = {
  assignment: { id: 'eng-marcos', roleTemplateId: 'tpl-call' },
  tenantId: TENANT,
  userId: 'u-marcos',
};

/** Las concesiones de Marcos como las lee `SupportPersonGrantsLoader` (mismas que `MARCOS.grants`). */
const MARCOS_PEOPLE = [
  { engagementId: 'eng-marcos', userId: 'u-marcos', grants: MARCOS.grants },
];

function build(
  opts: {
    engagement?: any;
    facts?: any;
    view?: any;
    people?: any[];
    sodFindings?: any[];
    userId?: string;
    /** SEG A-B7/B-B4: ¿el paciente consultado tiene relación con la organización? Por defecto sí. */
    patientLinked?: boolean;
  } = {},
) {
  const tx: any = {
    flush: mockFn(),
    persist: mockFn(),
    execute: mockFn(async (sql: string) =>
      sql.includes('patient_tenant_link') && opts.patientLinked === false
        ? []
        : [{ ok: 1 }],
    ),
  };
  const em: any = {
    fork: () => tx,
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const access = {
    findEngagements: mockFn().mockResolvedValue(
      opts.engagement === null ? [] : [opts.engagement ?? marcosRecord],
    ),
    findRoleAssignments: mockFn(
      async (_e: any, ids: string[]) =>
        new Map(
          ids.map((id) => [
            id,
            {
              id,
              practitionerProfileId:
                id === ROLE_SUAREZ ? 'dr-suarez' : 'dr-perez',
              tenantId: TENANT,
              practiceId: 'p',
            },
          ]),
        ),
    ),
    findCareSpaces: mockFn(
      async (_e: any, ids: string[]) =>
        new Map(
          ids.map((id) => [
            id,
            {
              id,
              practiceSiteId: 'site-norte',
              locationPath: ROOM.n102.path,
              tenantId: TENANT,
            },
          ]),
        ),
    ),
    findServices: mockFn(async () => new Map()),
  };
  const policy = { loadFacts: mockFn().mockResolvedValue([MARCOS]) };
  const pipeline = {
    rulesFor: mockFn().mockResolvedValue([]),
    evaluate: mockFn(),
  };
  const evaluateCalls: any[] = [];
  const loader = {
    conditionsOf: mockFn().mockReturnValue([]),
    demandOf: mockFn().mockReturnValue({
      facets: new Set(),
      hasConditions: true,
      needsAppointment: false,
    }),
    timeZoneOf: mockFn().mockResolvedValue('America/La_Paz'),
    evaluate: mockFn(async (request: any, _zone: any, run: any) => {
      evaluateCalls.push(request);
      return {
        result: run(opts.facts ?? baseFacts({ usage: usageOf(3) })),
        loaded: [],
      };
    }),
  };
  const gate = {
    view: mockFn().mockResolvedValue(opts.view ?? { full: true }),
    manages: mockFn().mockReturnValue(true),
  };
  const people = {
    load: mockFn().mockResolvedValue(opts.people ?? MARCOS_PEOPLE),
  };
  const sod = {
    rulesFor: mockFn().mockResolvedValue([...SOD_PLATFORM_RULES]),
    evaluateGrants: mockFn().mockResolvedValue(opts.sodFindings ?? []),
  };
  const rulesRepo = { findActiveForTenant: mockFn().mockResolvedValue([]) };
  const templates = {
    findById: mockFn().mockResolvedValue({
      id: 'tpl-call',
      code: 'CALL_CENTER',
    }),
  };
  const scope = { resolveTenant: () => TENANT };
  const logger = { setContext: mockFn(), info: mockFn() };
  jest.useFakeTimers({ now: NOW });
  const service = new AccessExplainService(
    em,
    access as any,
    policy as any,
    pipeline as any,
    loader as any,
    gate as any,
    people as any,
    sod as any,
    rulesRepo as any,
    templates as any,
    scope as any,
    logger as any,
  );
  return {
    service,
    tx,
    access,
    policy,
    pipeline,
    loader,
    gate,
    people,
    sod,
    evaluateCalls,
    rulesRepo,
  };
}
afterEach(() => jest.useRealTimers());

const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);
const failure = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as any;
  }
  return undefined;
};

/** La pregunta del §5.2: Marcos cancela la cita de Luis con 6 horas de anticipación. */
const explainDto = (over: Record<string, unknown> = {}): any => ({
  engagementId: 'eng-marcos',
  action: 'agenda.appointment.cancel',
  practitionerRoleAssignmentId: ROLE_SUAREZ,
  careSpaceId: ROOM.n102.id,
  patientProfileId: PATIENT.luis,
  appointmentStartAt: at('2026-11-03T16:30:00').toISOString(),
  at: NOW.toISOString(),
  ...over,
});

describe('AccessExplainService.explain (caso E-01 / 39)', () => {
  it('Marcos cancela con 6 h: CHALLENGE APPROVAL_REQUIRED, decide el paso 7 (LEAD_TIME) y faltan aprobación y motivo', async () => {
    const d = build();
    const out = await run(() => d.service.explain(explainDto(), ADMIN));
    expect(out.decision).toMatchObject({
      effect: 'CHALLENGE',
      allowed: false,
      reason: 'APPROVAL_REQUIRED',
      atom: 'agenda.appointment.cancel',
      grantId: 'g-marcos-suarez-norte',
    });
    expect(out.decidedBy).toMatchObject({
      layer: 'CONDITION',
      step: 7,
      grantId: 'g-marcos-suarez-norte',
      atom: 'agenda.appointment.cancel',
      conditionPath:
        'actionConditions.agenda.appointment.cancel.appointment.leadTime',
    });
    expect(out.reasons).toHaveLength(8);
    expect(out.reasons[6]).toMatchObject({
      order: 7,
      passed: false,
      code: 'LEAD_TIME',
      details: { minHours: 24, hoursLeft: 6 },
    });
    expect(out.missing.map((m) => m.kind)).toEqual(['APPROVAL', 'REASON']);
    expect(out.missing[0]).toMatchObject({
      by: 'DOCTOR',
      fix: { type: 'REQUEST_APPROVAL', approverKind: 'DOCTOR' },
    });
    expect(out.adminFixes).toEqual([
      expect.objectContaining({
        type: 'RELAX_CONDITION',
        grantId: 'g-marcos-suarez-norte',
        conditionPath:
          'actionConditions.agenda.appointment.cancel.appointment.leadTime',
      }),
    ]);
    expect(out.usage).toEqual([
      expect.objectContaining({
        key: 'ACTIONS/DAY/agenda.appointment.cancel',
        used: 3,
        max: 20,
      }),
    ]);
    expect(out.summary).toMatch(/aprobaci[oó]n/i);
    expect(out.evaluatedAt).toBe(NOW.toISOString());
    expect(out.correlationId).toEqual(expect.any(String));
  });

  it('SEG A-B7/B-B4: un paciente sin relación con la organización responde 404 uniforme (sin oráculo de edad, cobertura ni banderas)', async () => {
    const d = build({ patientLinked: false });
    const err = await failure(
      run(() => d.service.explain(explainDto(), ADMIN)),
    );
    expect(err.getStatus()).toBe(404);
    // Ni siquiera se evalúan las condiciones que leerían los datos del paciente.
    expect(d.evaluateCalls).toEqual([]);
    // Misma respuesta que un doctor/espacio ajeno: no distingue «no existe» de «no es suyo».
    const ajeno = await failure(
      run(() =>
        d.service.explain(explainDto({ patientProfileId: 'no-existe' }), ADMIN),
      ),
    );
    expect(ajeno.getResponse()).toEqual(err.getResponse());
  });

  it('SEG A-B7/B-B4: un escenario de simulate con paciente ajeno también es 404', async () => {
    const d = build({ patientLinked: false });
    const err = await failure(
      run(() =>
        d.service.simulate(
          {
            engagementId: 'eng-marcos',
            draft: {
              mode: 'PATCH',
              grants: [],
              removeGrantIds: [],
            } as any,
            scenarios: [
              {
                label: 'x',
                action: 'agenda.appointment.cancel',
                patientProfileId: PATIENT.luis,
              } as any,
            ],
            autoScenarios: false,
          },
          ADMIN,
        ),
      ),
    );
    expect(err.getStatus()).toBe(404);
  });

  it('no tiene efectos: pregunta en modo peek, no usa el pipeline (que consume y registra) y no escribe', async () => {
    const d = build();
    await run(() => d.service.explain(explainDto(), ADMIN));
    expect(d.pipeline.evaluate).not.toHaveBeenCalled();
    expect(d.evaluateCalls.length).toBeGreaterThan(0);
    expect(d.evaluateCalls.every((r) => r.context.peek === true)).toBe(true);
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('con assume {approvalGranted, reasonProvided} la misma pregunta da PERMIT', async () => {
    const d = build();
    const out = await run(() =>
      d.service.explain(
        explainDto({ assume: { approvalGranted: true, reasonProvided: true } }),
        ADMIN,
      ),
    );
    expect(out.decision).toMatchObject({ effect: 'PERMIT', allowed: true });
    expect(out.missing).toEqual([]);
  });

  it('el «¿y si…?» solo vale en este cálculo: no cambia lo guardado', async () => {
    const d = build();
    const first = await run(() =>
      d.service.explain(
        explainDto({ assume: { approvalGranted: true, reasonProvided: true } }),
        ADMIN,
      ),
    );
    const second = await run(() => d.service.explain(explainDto(), ADMIN));
    expect(first.decision.effect).toBe('PERMIT');
    expect(second.decision.effect).toBe('CHALLENGE');
  });

  it('un código antiguo se informa con el átomo que se evaluó', async () => {
    const d = build();
    const out = await run(() =>
      d.service.explain(explainDto({ action: 'schedule.cancel' }), ADMIN),
    );
    expect(out.decision.atom).toBe('agenda.appointment.cancel');
  });

  it('acepta a la persona por userId', async () => {
    const d = build();
    await run(() =>
      d.service.explain(
        explainDto({ engagementId: undefined, userId: 'u-marcos' }),
        ADMIN,
      ),
    );
    expect(d.access.findEngagements).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ tenantId: TENANT, userId: 'u-marcos' }),
    );
  });

  it('sin engagementId ni userId: 422 SIMULATION_NO_TARGET', async () => {
    const d = build();
    const err = await failure(
      run(() =>
        d.service.explain(explainDto({ engagementId: undefined }), ADMIN),
      ),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('SIMULATION_NO_TARGET');
  });

  it('vínculo ajeno o inexistente: 404 uniforme', async () => {
    const d = build({ engagement: null });
    const err = await failure(
      run(() => d.service.explain(explainDto(), ADMIN)),
    );
    expect(err.getStatus()).toBe(404);
    expect(err.reason).toBe('SUPPORT_ENGAGEMENT_NOT_FOUND');
  });

  it('un delegado que no administra a esa persona recibe el mismo 404', async () => {
    const d = build({ view: { full: false, adminTargets: [] } });
    d.gate.manages.mockReturnValue(false);
    const err = await failure(
      run(() =>
        d.service.explain(explainDto(), {
          id: 'sofia',
          roles: ['SUPPORT_STAFF'],
        } as any),
      ),
    );
    expect(err.getStatus()).toBe(404);
    expect(d.gate.view).toHaveBeenCalledWith(
      d.tx,
      expect.anything(),
      'audit.decisions.explain',
    );
  });

  it('un objetivo de otra organización: 404 uniforme', async () => {
    const d = build();
    d.access.findCareSpaces.mockResolvedValue(
      new Map([[ROOM.n102.id, { id: ROOM.n102.id, tenantId: 'otra' }]]),
    );
    const err = await failure(
      run(() => d.service.explain(explainDto(), ADMIN)),
    );
    expect(err.getStatus()).toBe(404);
  });
});

describe('autoservicio y doctor', () => {
  it('explainMine: la propia persona, con askAdmin en vez de adminFixes y sin datos de terceros', async () => {
    const d = build();
    const out = await d.service.explainMine(
      { ...explainDto({ engagementId: undefined }), tenantId: TENANT },
      MARCOS_USER,
    );
    expect(out.askAdmin).toEqual(expect.stringMatching(/administrador/i));
    expect(out).not.toHaveProperty('adminFixes');
    expect(d.access.findEngagements).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: 'u-marcos', tenantId: TENANT }),
    );
    // Es la propia persona: su sesión y su red sí cuentan.
    expect(d.evaluateCalls[0].userId).toBe('u-marcos');
  });

  it('explainMine sin vínculo en esa organización: 404 uniforme', async () => {
    const d = build({ engagement: null });
    const err = await failure(
      d.service.explainMine(
        { ...explainDto({ engagementId: undefined }), tenantId: TENANT },
        MARCOS_USER,
      ),
    );
    expect(err.getStatus()).toBe(404);
  });

  it('explainTeam: el doctor solo pregunta por SU agenda; otra agenda es 404 uniforme', async () => {
    const d = build();
    const doctor = {
      id: 'dr-suarez-user',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'dr-suarez',
    } as any;
    const ok = await run(() => d.service.explainTeam(explainDto(), doctor));
    expect(ok.decision.atom).toBe('agenda.appointment.cancel');
    const other = { ...doctor, practitionerProfileId: 'dr-otro' };
    const err = await failure(
      run(() => d.service.explainTeam(explainDto(), other)),
    );
    expect(err.getStatus()).toBe(404);
    const noTarget = await failure(
      run(() =>
        d.service.explainTeam(
          explainDto({ practitionerRoleAssignmentId: undefined }),
          doctor,
        ),
      ),
    );
    expect(noTarget.getStatus()).toBe(404);
  });
});

/** Un borrador que repite lo vigente de Marcos (misma concesión, mismos átomos y condiciones). */
const sameDraft = (): any => {
  const g = MARCOS.grants[0];
  return {
    mode: 'REPLACE',
    grants: [
      {
        id: g.grantId,
        effect: 'ALLOW',
        actions: [...g.actions],
        actionConditions: {
          'agenda.appointment.cancel': g.atomGrants![0].condition,
        },
        targetKind: 'PRACTITIONER_LOCATION',
        practitionerRoleAssignmentId: ROLE_SUAREZ,
        practiceSiteId: 'site-norte',
      },
    ],
    removeGrantIds: [],
  };
};
const scenario = (label: string, over: Record<string, unknown> = {}): any => ({
  label,
  action: 'agenda.appointment.cancel',
  practitionerRoleAssignmentId: ROLE_SUAREZ,
  careSpaceId: ROOM.n102.id,
  patientProfileId: PATIENT.luis,
  appointmentStartAt: at('2026-11-04T09:00:00').toISOString(),
  at: NOW.toISOString(),
  ...over,
});

describe('AccessExplainService.simulate', () => {
  it('un borrador igual al estado actual da todo SAME y es válido (AC-5)', async () => {
    const d = build();
    const out = await run(() =>
      d.service.simulate(
        {
          engagementId: 'eng-marcos',
          draft: sameDraft(),
          scenarios: [
            scenario('Cancelar mañana 09:00'),
            scenario('Ver agenda', { action: 'agenda.appointment.view' }),
          ],
          autoScenarios: false,
        },
        ADMIN,
      ),
    );
    expect(out.valid).toBe(true);
    expect(out.scenarios.map((s) => s.change)).toEqual(['SAME', 'SAME']);
    expect(out.impact).toMatchObject({
      newlyAllowed: 0,
      newlyDenied: 0,
      challengesNew: 0,
      unchanged: 2,
    });
    expect(out.impact.effectiveAtoms).toEqual({ added: [], removed: [] });
    expect(out.simulationToken).toMatch(/^sim_/);
    expect(out.limits).toEqual({ scenarioCount: 2, truncated: false });
  });

  it('quitar «cancelar»: el escenario queda NEWLY_DENIED y el resumen lo dice', async () => {
    const d = build();
    const draft = sameDraft();
    draft.grants[0].actions = draft.grants[0].actions.filter(
      (a: string) => a !== 'agenda.appointment.cancel',
    );
    delete draft.grants[0].actionConditions;
    const out = await run(() =>
      d.service.simulate(
        {
          engagementId: 'eng-marcos',
          draft,
          scenarios: [
            scenario('Cancelar mañana 09:00', {
              appointmentStartAt: at('2026-11-05T09:00:00').toISOString(),
            }),
          ],
          autoScenarios: false,
        },
        ADMIN,
      ),
    );
    expect(out.scenarios[0]).toMatchObject({
      label: 'Cancelar mañana 09:00',
      change: 'NEWLY_DENIED',
      after: { effect: 'DENY' },
    });
    expect(out.impact.newlyDenied).toBe(1);
    expect(out.impact.effectiveAtoms.removed).toContain(
      'agenda.appointment.cancel',
    );
    expect(out.summary.changes.join(' ')).toMatch(/dejar[aá] de poder/i);
  });

  it('G-03: cobrar no cabe en el techo de CALL_CENTER: error GUARDRAIL_CEILING_EXCEEDED con su ruta; no hay token', async () => {
    const d = build();
    const draft = sameDraft();
    draft.grants[0].actions = [
      ...draft.grants[0].actions,
      'billing.payment.collect',
    ];
    const out = await run(() =>
      d.service.simulate(
        {
          engagementId: 'eng-marcos',
          draft,
          scenarios: [scenario('x')],
          autoScenarios: false,
        },
        ADMIN,
      ),
    );
    expect(out.valid).toBe(false);
    expect(out.validation.errors).toEqual([
      expect.objectContaining({
        code: 'GUARDRAIL_CEILING_EXCEEDED',
        path: `grants[0].actions[${draft.grants[0].actions.length - 1}]`,
      }),
    ]);
    expect(out.simulationToken).toBeUndefined();
  });

  it('una condición mal formada: error CONDITION_* con su ruta y valid=false', async () => {
    const d = build();
    const draft = sameDraft();
    draft.grants[0].condition = { schemaVersion: 1, inventada: {} };
    const out = await run(() =>
      d.service.simulate(
        {
          engagementId: 'eng-marcos',
          draft,
          scenarios: [scenario('x')],
          autoScenarios: false,
        },
        ADMIN,
      ),
    );
    expect(out.valid).toBe(false);
    expect(out.validation.errors[0]).toMatchObject({
      code: 'CONDITION_UNKNOWN_KEY',
      path: 'grants[0].condition.inventada',
    });
  });

  it('SoD: un conflicto bloqueante es error y una advertencia es warning', async () => {
    const blocked = {
      ruleCode: 'SOD-BILL-01',
      ruleName: 'Cobrar y anular',
      scope: 'PERSON',
      action: 'BLOCK',
      isHard: true,
      outcome: 'BLOCKED',
      atomsA: ['billing.payment.collect'],
      atomsB: ['billing.receipt.void'],
      grantIdsA: ['g-marcos-suarez-norte'],
      grantIdsB: ['g-marcos-suarez-norte'],
      admitsException: false,
    };
    const warn = {
      ...blocked,
      ruleCode: 'SOD-BILL-04',
      ruleName: 'Descontar y cobrar',
      action: 'WARN',
      isHard: false,
      outcome: 'WARNING',
    };
    const d = build({ sodFindings: [blocked, warn] });
    const out = await run(() =>
      d.service.simulate(
        {
          engagementId: 'eng-marcos',
          draft: sameDraft(),
          scenarios: [scenario('x')],
          autoScenarios: false,
        },
        ADMIN,
      ),
    );
    expect(out.valid).toBe(false);
    expect(out.validation.errors.map((e) => e.code)).toContain(
      'SOD_CONFLICT_BLOCKED',
    );
    expect(out.validation.warnings.map((e) => e.code)).toContain('SOD_WARN');
    expect(out.governance.sodFindings.map((f) => f.ruleCode)).toEqual([
      'SOD-BILL-01',
      'SOD-BILL-04',
    ]);
  });

  it('el puntaje de privilegios se informa antes, después y la diferencia', async () => {
    const d = build();
    const draft = sameDraft();
    draft.grants[0].actions = [
      ...draft.grants[0].actions,
      'agenda.appointment.view.reason',
    ];
    const out = await run(() =>
      d.service.simulate(
        {
          engagementId: 'eng-marcos',
          draft,
          scenarios: [scenario('x')],
          autoScenarios: false,
        },
        ADMIN,
      ),
    );
    expect(out.governance.privilegeScore.delta).toBe(
      out.governance.privilegeScore.after -
        out.governance.privilegeScore.before,
    );
    expect(out.governance.privilegeScore.delta).toBeGreaterThan(0);
  });

  it('más de 400 escenarios: 422 SIMULATION_TOO_LARGE', async () => {
    const d = build();
    const many = Array.from({ length: 401 }, (_, i) => scenario(`e${i}`));
    const err = await failure(
      run(() =>
        d.service.simulate(
          {
            engagementId: 'eng-marcos',
            draft: sameDraft(),
            scenarios: many,
            autoScenarios: false,
          },
          ADMIN,
        ),
      ),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('SIMULATION_TOO_LARGE');
  });

  it('los escenarios automáticos se agregan hasta 200 y se informa si se cortó', async () => {
    const d = build();
    const out = await run(() =>
      d.service.simulate(
        { engagementId: 'eng-marcos', draft: sameDraft(), scenarios: [] },
        ADMIN,
      ),
    );
    expect(out.limits.scenarioCount).toBeGreaterThan(0);
    expect(out.limits.scenarioCount).toBeLessThanOrEqual(200);
    expect(out.scenarios.every((s) => s.change === 'SAME')).toBe(true);
  });

  it('simular no escribe nada ni consume: solo lecturas en modo peek', async () => {
    const d = build();
    await run(() =>
      d.service.simulate(
        {
          engagementId: 'eng-marcos',
          draft: sameDraft(),
          scenarios: [scenario('x')],
          autoScenarios: false,
        },
        ADMIN,
      ),
    );
    expect(d.tx.flush).not.toHaveBeenCalled();
    expect(d.pipeline.evaluate).not.toHaveBeenCalled();
    expect(d.evaluateCalls.every((r) => r.context.peek === true)).toBe(true);
  });

  it('el token acompaña a lo simulado y solo vale para eso, durante 10 minutos', async () => {
    const d = build();
    const draft = sameDraft();
    const out = await run(() =>
      d.service.simulate(
        {
          engagementId: 'eng-marcos',
          draft,
          scenarios: [scenario('x')],
          autoScenarios: false,
        },
        ADMIN,
      ),
    );
    const token = out.simulationToken!;
    expect(verifySimulationToken(token, 'eng-marcos', draft, NOW)).toBe('OK');
    expect(verifySimulationToken(token, 'eng-otro', draft, NOW)).toBe(
      'MISMATCH',
    );
    const changed = {
      ...draft,
      grants: [{ ...draft.grants[0], actions: ['agenda.appointment.view'] }],
    };
    expect(verifySimulationToken(token, 'eng-marcos', changed, NOW)).toBe(
      'MISMATCH',
    );
    expect(
      verifySimulationToken(
        token,
        'eng-marcos',
        draft,
        new Date(NOW.getTime() + 11 * 60_000),
      ),
    ).toBe('EXPIRED');
    expect(verifySimulationToken('sim_basura', 'eng-marcos', draft, NOW)).toBe(
      'MISMATCH',
    );
  });

  describe('SEG B-B5: el token de simulación va firmado con HMAC (secreto de la app)', () => {
    const draft = {
      mode: 'PATCH',
      grants: [],
      removeGrantIds: [],
    } as any;
    const OLD_SECRET = process.env.JWT_SECRET;
    afterEach(() => {
      if (OLD_SECRET === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = OLD_SECRET;
    });

    it('un token forjado SIN el secreto (el SHA-256 público de antes) no se acepta', () => {
      // PoC poc1.ts: quien conoce el borrador y el vínculo calculaba el token sin simular.
      const forged = `sim_${NOW.getTime().toString(36)}_${sha256Hex(
        canonicalJson({
          engagementId: 'eng-1',
          draft: {
            mode: 'PATCH',
            templateCode: null,
            grants: [],
            removeGrantIds: [],
          },
        }),
      ).slice(0, 32)}`;
      expect(verifySimulationToken(forged, 'eng-1', draft, NOW)).toBe(
        'MISMATCH',
      );
    });

    it('el token emitido verifica, y cambiar el instante lo invalida (el instante va firmado)', () => {
      const token = simulationTokenOf('eng-1', draft, NOW);
      expect(verifySimulationToken(token, 'eng-1', draft, NOW)).toBe('OK');
      const [, , mac] = token.split('_');
      const later = `sim_${(NOW.getTime() + 9 * 60_000).toString(36)}_${mac}`;
      expect(
        verifySimulationToken(
          later,
          'eng-1',
          draft,
          new Date(NOW.getTime() + 15 * 60_000),
        ),
      ).toBe('MISMATCH');
    });

    it('con otro secreto de la app el mismo token deja de valer', () => {
      process.env.JWT_SECRET = 'secreto-uno-secreto-uno-secreto-uno-1234';
      const token = simulationTokenOf('eng-1', draft, NOW);
      expect(verifySimulationToken(token, 'eng-1', draft, NOW)).toBe('OK');
      process.env.JWT_SECRET = 'secreto-dos-secreto-dos-secreto-dos-5678';
      expect(verifySimulationToken(token, 'eng-1', draft, NOW)).toBe(
        'MISMATCH',
      );
    });
  });

  it('un delegado fuera del alcance de la persona: 404 uniforme', async () => {
    const d = build({ view: { full: false, adminTargets: [] } });
    d.gate.manages.mockReturnValue(false);
    const err = await failure(
      run(() =>
        d.service.simulate(
          {
            engagementId: 'eng-marcos',
            draft: sameDraft(),
            scenarios: [scenario('x')],
            autoScenarios: false,
          },
          { id: 'sofia', roles: ['SUPPORT_STAFF'] } as any,
        ),
      ),
    );
    expect(err.getStatus()).toBe(404);
  });
});
