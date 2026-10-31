import { jest } from '@jest/globals';
import { runWithTenant, CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { SOD_PLATFORM_RULES } from '../domain';
import { FourEyesExecutors } from './four-eyes.service';
import { SodService } from './sod.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const NOW = new Date('2026-11-03T14:30:00Z');
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

const SCOPE = {
  PERSON: DELEG.SOD_SCOPE_PERSON,
  PERSON_OVERLAP: DELEG.SOD_SCOPE_PERSON_OVERLAP,
  TRANSACTION: DELEG.SOD_SCOPE_TRANSACTION,
} as const;
const ACTION = {
  BLOCK: DELEG.SOD_ACTION_BLOCK,
  REQUIRE_APPROVAL: DELEG.SOD_ACTION_REQUIRE_APPROVAL,
  WARN: DELEG.SOD_ACTION_WARN,
} as const;

/** Las 11 reglas de plataforma como filas de `sod_rules`. */
const platformRows = (): any[] =>
  SOD_PLATFORM_RULES.map((r, i) => ({
    id: `plat-${r.code}`,
    tenantId: undefined,
    code: r.code,
    name: r.name,
    atomsAJson: [...r.atomsA],
    atomsBJson: [...r.atomsB],
    scopeConceptId: SCOPE[r.scope],
    actionConceptId: ACTION[r.action],
    isHard: r.isHard,
    maxExceptionDays: r.maxExceptionDays ?? undefined,
    rationaleText: r.rationale,
    statusConceptId: CONCEPTS.STATE_ACTIVE,
    versionNumber: 1,
    rowVersion: i + 1,
  }));

const grant = (
  id: string,
  actions: string[],
  over: Record<string, unknown> = {},
): any => ({
  grantId: id,
  targetKind: 'ALL',
  expansionMode: 'DYNAMIC',
  active: true,
  actions,
  effect: 'ALLOW',
  ...over,
});

function build(
  opts: {
    people?: any[];
    exceptions?: any[];
    orgRules?: any[];
    engagement?: any;
    view?: any;
    delegate?: boolean;
    outOfScope?: boolean;
    lacksAtom?: boolean;
  } = {},
) {
  const tx: any = { flush: mockFn().mockResolvedValue(undefined) };
  const em: any = {
    fork: () => tx,
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const ruleRows = [...platformRows(), ...(opts.orgRules ?? [])];
  const repo = {
    findRulesVisible: mockFn().mockResolvedValue(ruleRows),
    findRuleById: mockFn(
      async (_e: any, id: string) => ruleRows.find((r) => r.id === id) ?? null,
    ),
    createRule: mockFn((_e: any, data: any) => ({
      id: 'sod-new',
      rowVersion: 1,
      createdAt: NOW,
      updatedAt: NOW,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      versionNumber: 1,
      atomsAJson: data.atomsA,
      atomsBJson: data.atomsB,
      scopeConceptId: data.scopeConceptId,
      actionConceptId: data.actionConceptId,
      ...data,
    })),
    findActiveExceptions: mockFn().mockResolvedValue(opts.exceptions ?? []),
    findExceptionById: mockFn(
      async (_e: any, _t: string, id: string) =>
        (opts.exceptions ?? []).find((x) => x.id === id) ?? null,
    ),
    createException: mockFn((_e: any, data: any) => ({
      id: 'exc-new',
      ...data,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    })),
    revokeException: mockFn(
      (row: any, actor: any, reason: string, now: Date) => {
        row.statusConceptId = CONCEPTS.STATE_REVOKED;
        row.revokedAt = now;
        row.revokeReasonText = reason;
      },
    ),
  };
  const loader = {
    load: mockFn(async (_e: any, _t: string, filter: any = {}) => {
      const all = opts.people ?? [];
      return all.filter(
        (p) =>
          (!filter.userId || p.userId === filter.userId) &&
          (!filter.engagementIds ||
            filter.engagementIds.includes(p.engagementId)),
      );
    }),
  };
  const fourEyes = {
    requestAdministrative: mockFn().mockResolvedValue({
      id: 'fe-1',
      expiresAt: new Date(NOW.getTime() + 7 * 86_400_000),
    }),
  };
  const executors = new FourEyesExecutors();
  const settings = {
    read: mockFn().mockResolvedValue({ settings: { maxSodExceptionDays: 90 } }),
  };
  const stepUp = { assertFresh: mockFn().mockResolvedValue(undefined) };
  const audit = { record: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const scope = { resolveTenant: () => TENANT };
  const access = {
    view: mockFn().mockResolvedValue(opts.view ?? { full: true }),
    manages: mockFn(
      (view: any, grants: any[]) =>
        view.full || grants.some((g: any) => g.healthcareServiceId === 'eco'),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const team = {
    actorOf: mockFn(async (_e: any, actor: any, _t: string, atom: string) => {
      if ((actor.roles ?? []).includes('SECURITY_ADMIN'))
        return { full: true, userId: actor.id };
      if (!opts.delegate)
        throw Object.assign(new Error('no administra'), {
          reason: 'ADMIN_SCOPE_EXCEEDED',
          getStatus: () => 403,
        });
      if (opts.lacksAtom)
        throw Object.assign(new Error('sin átomo'), {
          reason: 'ADMIN_CEILING_EXCEEDED',
          getStatus: () => 403,
          atom,
        });
      return { full: false, userId: actor.id, ctx: {} };
    }),
    memberOf: mockFn(async () => {
      if (opts.outOfScope)
        throw Object.assign(new Error('fuera de alcance'), {
          reason: 'SUPPORT_ENGAGEMENT_NOT_FOUND',
          getStatus: () => 404,
        });
      return {};
    }),
  };
  const service = new SodService(
    em,
    repo as any,
    loader as any,
    fourEyes as any,
    executors,
    settings as any,
    stepUp as any,
    audit as any,
    outbox as any,
    scope as any,
    access as any,
    logger as any,
    team as any,
  );
  jest.useFakeTimers({ now: NOW });
  return {
    service,
    repo,
    loader,
    fourEyes,
    executors,
    settings,
    stepUp,
    audit,
    outbox,
    tx,
    access,
    team,
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

const MARIO = {
  engagementId: 'eng-mario',
  userId: 'mario',
  grants: [grant('g-mario', ['billing.payment.collect'])],
};
const LUCIA = {
  engagementId: 'eng-lucia',
  userId: 'lucia',
  grants: [grant('g-lucia', ['agenda.appointment.walk_in'])],
};

describe('SodService.evaluate / assertGrantAllowed (otorgar)', () => {
  it('S-01: agregar anular a quien cobra BLOQUEA (SOD-BILL-01) con los hallazgos', async () => {
    const d = build({ people: [MARIO] });
    const err = await failure(
      d.service.assertGrantAllowed(d.tx, TENANT, {
        userId: 'mario',
        proposed: [{ targetKind: 'ALL', actions: ['billing.receipt.void'] }],
      }),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('SOD_CONFLICT_BLOCKED');
    expect(err.details.findings[0]).toMatchObject({
      ruleCode: 'SOD-BILL-01',
      outcome: 'BLOCKED',
    });
  });

  it('S-02: crear citas + emitir comprobantes EXIGE APROBACIÓN: 409 SOD_EXCEPTION_REQUIRED', async () => {
    const d = build({ people: [LUCIA] });
    const err = await failure(
      d.service.assertGrantAllowed(d.tx, TENANT, {
        userId: 'lucia',
        proposed: [{ targetKind: 'ALL', actions: ['billing.receipt.issue'] }],
      }),
    );
    expect(err.getStatus()).toBe(409);
    expect(err.reason).toBe('SOD_EXCEPTION_REQUIRED');
    expect(err.details.findings[0]).toMatchObject({
      ruleCode: 'SOD-BILL-03',
      admitsException: true,
    });
  });

  it('con una excepción vigente de esa persona el conflicto pasa (EXCEPTED)', async () => {
    const d = build({
      people: [LUCIA],
      exceptions: [
        {
          id: 'exc-1',
          sodRuleId: 'plat-SOD-BILL-03',
          organizationUserAssignmentId: 'eng-lucia',
          validFrom: new Date(NOW.getTime() - 86_400_000),
          validTo: new Date(NOW.getTime() + 30 * 86_400_000),
          statusConceptId: CONCEPTS.STATE_ACTIVE,
        },
      ],
    });
    const out = await d.service.assertGrantAllowed(d.tx, TENANT, {
      userId: 'lucia',
      proposed: [{ targetKind: 'ALL', actions: ['billing.receipt.issue'] }],
    });
    expect(out.excepted.map((f) => f.ruleCode)).toEqual(['SOD-BILL-03']);
    expect(d.repo.findActiveExceptions).toHaveBeenCalledWith(
      d.tx,
      TENANT,
      NOW,
      ['eng-lucia'],
    );
  });

  it('ADVERTIR pasa y devuelve la advertencia (SOD-BILL-04)', async () => {
    const d = build({ people: [MARIO] });
    const out = await d.service.assertGrantAllowed(d.tx, TENANT, {
      userId: 'mario',
      proposed: [{ targetKind: 'ALL', actions: ['billing.discount.apply'] }],
    });
    expect(out.warnings.map((f) => f.ruleCode)).toEqual(['SOD-BILL-04']);
  });

  it('un conflicto que ya existía y no tiene que ver con lo que se otorga NO bloquea', async () => {
    const heredado = {
      engagementId: 'eng-x',
      userId: 'x',
      grants: [
        grant('g-1', ['billing.payment.collect']),
        grant('g-2', ['billing.receipt.void']),
      ],
    };
    const d = build({ people: [heredado] });
    const out = await d.service.assertGrantAllowed(d.tx, TENANT, {
      userId: 'x',
      proposed: [{ targetKind: 'ALL', actions: ['agenda.appointment.view'] }],
    });
    expect(out.blocked).toEqual([]);
  });

  it('reemplazar una concesión (replacesGrantIds) quita lo viejo antes de evaluar', async () => {
    const d = build({
      people: [
        {
          ...MARIO,
          grants: [
            grant('g-mario', [
              'billing.payment.collect',
              'billing.receipt.void',
            ]),
          ],
        },
      ],
    });
    const out = await d.service.assertGrantAllowed(d.tx, TENANT, {
      userId: 'mario',
      replacesGrantIds: ['g-mario'],
      proposed: [{ targetKind: 'ALL', actions: ['billing.payment.collect'] }],
    });
    expect(out.blocked).toEqual([]);
  });

  it('un alias heredado cuenta por los átomos de su paquete (billing.collect = payment.collect)', async () => {
    const d = build({
      people: [{ ...MARIO, grants: [grant('g-mario', ['billing.collect'])] }],
    });
    const err = await failure(
      d.service.assertGrantAllowed(d.tx, TENANT, {
        userId: 'mario',
        proposed: [{ targetKind: 'ALL', actions: ['billing.receipt.void'] }],
      }),
    );
    expect(err.reason).toBe('SOD_CONFLICT_BLOCKED');
  });

  it('las once reglas de plataforma: una prueba de conflicto y una sin conflicto por cada una de las que se evalúan al otorgar', async () => {
    const d = build({ people: [] });
    const rules = await d.service.rulesFor(d.tx, TENANT);
    expect(rules).toHaveLength(11);
    const person = rules.filter((r) => r.scope !== 'TRANSACTION');
    expect(person.length).toBeGreaterThanOrEqual(8);
    for (const rule of person) {
      const a = rule.atomsA[0];
      const b = rule.atomsB[0];
      const conflict = build({
        people: [
          { engagementId: 'e', userId: 'u', grants: [grant('ga', [a])] },
        ],
      });
      const summary = await conflict.service
        .assertGrantAllowed(conflict.tx, TENANT, {
          userId: 'u',
          proposed: [{ targetKind: 'ALL', actions: [b] }],
        })
        .then(
          (ok) => ({ ok }),
          (err) => ({ err }),
        );
      const found =
        'err' in summary
          ? summary.err.details.findings
          : [...summary.ok.warnings, ...summary.ok.excepted];
      expect(found.map((f: any) => f.ruleCode)).toContain(rule.code);
      // Sin conflicto: solo el lado A.
      const clean = build({
        people: [{ engagementId: 'e', userId: 'u', grants: [] }],
      });
      const ok = await clean.service.assertGrantAllowed(clean.tx, TENANT, {
        userId: 'u',
        proposed: [{ targetKind: 'ALL', actions: [a] }],
      });
      expect(
        [...ok.blocked, ...ok.exceptionRequired, ...ok.warnings].filter(
          (f) => f.ruleCode === rule.code,
        ),
      ).toEqual([]);
    }
  });
});

describe('SodService.assertTransaction (SoD de transacción)', () => {
  it('SOD-GOV-02: quien otorgó no certifica la misma concesión', async () => {
    const d = build();
    const err = await failure(
      d.service.assertTransaction(d.tx, TENANT, {
        ruleCode: 'SOD-GOV-02',
        actorsA: ['sofia', null],
        actorB: 'sofia',
      }),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('SOD_CONFLICT_BLOCKED');
    await expect(
      d.service.assertTransaction(d.tx, TENANT, {
        ruleCode: 'SOD-GOV-02',
        actorsA: ['sofia'],
        actorB: 'admin-1',
      }),
    ).resolves.toBeUndefined();
  });
});

describe('SodService reglas', () => {
  it('rulesFor y listRules: las 11 de plataforma, solo lectura', async () => {
    const d = build();
    const out = await run(() => d.service.listRules());
    expect(out.count).toBe(11);
    expect(out.items.every((r) => r.platform)).toBe(true);
    expect(out.items.find((r) => r.code === 'SOD-BILL-01')).toMatchObject({
      isHard: true,
      action: 'BLOCK',
      scope: 'PERSON',
    });
  });

  it('crear una regla propia: exige paso extra y solo crea o endurece', async () => {
    const d = build();
    const out = await run(() =>
      d.service.createRule(
        {
          code: 'ORG-CAJA-01',
          name: 'Caja y agenda',
          atomsA: ['billing.cashbox.close'],
          atomsB: ['agenda.appointment.cancel'],
          scope: 'PERSON',
          action: 'REQUIRE_APPROVAL',
        } as any,
        ADMIN,
      ),
    );
    expect(d.stepUp.assertFresh).toHaveBeenCalled();
    expect(d.repo.createRule).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        code: 'ORG-CAJA-01',
        scopeConceptId: DELEG.SOD_SCOPE_PERSON,
        actionConceptId: DELEG.SOD_ACTION_REQUIRE_APPROVAL,
      }),
    );
    expect(out).toMatchObject({ code: 'ORG-CAJA-01', platform: false });
  });

  it('aflojar una regla de plataforma: 422 SOD_RULE_LOOSENS_BASE', async () => {
    const d = build();
    const err = await failure(
      run(() =>
        d.service.createRule(
          {
            code: 'SOD-BILL-01',
            name: 'Cobrar y anular',
            baseRuleCode: 'SOD-BILL-01',
            atomsA: ['billing.payment.collect'],
            atomsB: ['billing.receipt.void'],
            scope: 'PERSON',
            action: 'WARN',
          } as any,
          ADMIN,
        ),
      ),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('SOD_RULE_LOOSENS_BASE');
    expect(d.repo.createRule).not.toHaveBeenCalled();
  });

  it('endurecer una de plataforma (ADVERTIR → BLOQUEAR) crea la fila con su base', async () => {
    const d = build();
    await run(() =>
      d.service.createRule(
        {
          code: 'SOD-BILL-04',
          name: 'Descontar y cobrar',
          baseRuleCode: 'SOD-BILL-04',
          atomsA: ['billing.discount.apply'],
          atomsB: ['billing.payment.collect'],
          scope: 'PERSON',
          action: 'BLOCK',
        } as any,
        ADMIN,
      ),
    );
    expect(d.repo.createRule).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        baseRuleId: 'plat-SOD-BILL-04',
        actionConceptId: DELEG.SOD_ACTION_BLOCK,
      }),
    );
  });

  it('un código de plataforma sin declarar su base: 409 duplicado', async () => {
    const d = build();
    const err = await failure(
      run(() =>
        d.service.createRule(
          {
            code: 'SOD-BILL-01',
            name: 'Otra',
            atomsA: ['billing.payment.collect'],
            atomsB: ['billing.receipt.void'],
            scope: 'PERSON',
            action: 'BLOCK',
          } as any,
          ADMIN,
        ),
      ),
    );
    expect(err.getStatus()).toBe(409);
  });

  it('átomos desconocidos: 422 GOVERNANCE_RULE_INVALID', async () => {
    const d = build();
    const err = await failure(
      run(() =>
        d.service.createRule(
          {
            code: 'ORG-X-01',
            name: 'X',
            atomsA: ['nada.existe.aqui'],
            atomsB: ['billing.payment.collect'],
            scope: 'PERSON',
            action: 'BLOCK',
          } as any,
          ADMIN,
        ),
      ),
    );
    expect(err.reason).toBe('GOVERNANCE_RULE_INVALID');
  });

  it('editar una regla de plataforma: 422 SOD_RULE_PLATFORM_READ_ONLY', async () => {
    const d = build();
    const err = await failure(
      run(() =>
        d.service.updateRule(
          'plat-SOD-BILL-01',
          { expectedRowVersion: 1, name: 'x' } as any,
          ADMIN,
        ),
      ),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('SOD_RULE_PLATFORM_READ_ONLY');
  });

  it('editar una regla inexistente: 404', async () => {
    const d = build();
    const err = await failure(
      run(() =>
        d.service.updateRule('nadie', { expectedRowVersion: 1 } as any, ADMIN),
      ),
    );
    expect(err.getStatus()).toBe(404);
  });
});

describe('SodService excepciones', () => {
  const engagement = { engagementId: 'eng-lucia', userId: 'lucia', grants: [] };
  const request = (over: Record<string, unknown> = {}) => ({
    engagementId: 'eng-lucia',
    ruleCode: 'SOD-BILL-03',
    justification:
      'La consulta es pequeña y la misma persona atiende ambas funciones.',
    validTo: new Date(NOW.getTime() + 60 * 86_400_000).toISOString(),
    ...over,
  });

  it('S-01: una regla dura no admite excepción: 422 SOD_RULE_HARD', async () => {
    const d = build({ people: [engagement] });
    const err = await failure(
      run(() =>
        d.service.requestException(
          request({ ruleCode: 'SOD-BILL-01' }) as any,
          ADMIN,
        ),
      ),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('SOD_RULE_HARD');
    expect(d.fourEyes.requestAdministrative).not.toHaveBeenCalled();
  });

  it('S-02: crea un cuatro ojos SOD_EXCEPTION y responde 202 con su id', async () => {
    const d = build({ people: [engagement] });
    const out = await run(() =>
      d.service.requestException(request() as any, ADMIN),
    );
    expect(d.fourEyes.requestAdministrative).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        kind: 'SOD_EXCEPTION',
        actor: ADMIN,
        subjectUserId: 'lucia',
        organizationUserAssignmentId: 'eng-lucia',
        approverKind: 'SECOND_APPROVER',
        payload: expect.objectContaining({
          engagementId: 'eng-lucia',
          ruleCode: 'SOD-BILL-03',
        }),
      }),
    );
    expect(out).toMatchObject({
      approvalId: 'fe-1',
      status: 'PENDING',
      approverKind: 'SECOND_APPROVER',
    });
  });

  it.each([
    [{ justification: 'corta' }, 'JUSTIFICATION_TOO_SHORT'],
    [
      { validTo: new Date(NOW.getTime() - 1000).toISOString() },
      'VALID_TO_NOT_IN_FUTURE',
    ],
    [
      { validTo: new Date(NOW.getTime() + 120 * 86_400_000).toISOString() },
      'VALID_TO_EXCEEDS_LIMIT',
    ],
  ])('petición inválida %j → 422 %s', async (patch, reason) => {
    const d = build({ people: [engagement] });
    const err = await failure(
      run(() => d.service.requestException(request(patch) as any, ADMIN)),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe(reason);
  });

  it('una regla que solo advierte no necesita excepción: 422 SOD_EXCEPTION_NOT_NEEDED', async () => {
    const d = build({ people: [engagement] });
    const err = await failure(
      run(() =>
        d.service.requestException(
          request({ ruleCode: 'SOD-BILL-04' }) as any,
          ADMIN,
        ),
      ),
    );
    expect(err.reason).toBe('SOD_EXCEPTION_NOT_NEEDED');
  });

  it('el vínculo ajeno o inexistente: 404 uniforme', async () => {
    const d = build({ people: [] });
    const err = await failure(
      run(() => d.service.requestException(request() as any, ADMIN)),
    );
    expect(err.getStatus()).toBe(404);
  });

  it('quien no es administrador de seguridad no pide excepciones por esta vía', async () => {
    const d = build({ people: [engagement] });
    const err = await failure(
      run(() =>
        d.service.requestException(
          request() as any,
          { id: 'sofia', roles: ['SUPPORT_STAFF'] } as any,
        ),
      ),
    );
    expect(err.getStatus()).toBe(403);
  });

  describe('pendiente 29: delegados piden excepciones por TeamAdminPolicy', () => {
    const SOFIA = { id: 'sofia', roles: ['SUPPORT_STAFF'] } as any;

    it('un delegado con team.sod.exception.request y la persona en su alcance: 202 y el cuatro ojos lo firma él', async () => {
      const d = build({ people: [engagement], delegate: true });
      const out = await run(() =>
        d.service.requestException(request() as any, SOFIA),
      );
      expect(d.team.actorOf).toHaveBeenCalledWith(
        expect.anything(),
        SOFIA,
        TENANT,
        'team.sod.exception.request',
        expect.any(Date),
      );
      expect(d.team.memberOf).toHaveBeenCalled();
      expect(d.fourEyes.requestAdministrative).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ actor: SOFIA, subjectUserId: 'lucia' }),
      );
      expect(out).toMatchObject({ approvalId: 'fe-1', status: 'PENDING' });
    });

    it('un delegado SIN el átomo: 403 ADMIN_CEILING_EXCEEDED y no se crea nada', async () => {
      const d = build({
        people: [engagement],
        delegate: true,
        lacksAtom: true,
      });
      const err = await failure(
        run(() => d.service.requestException(request() as any, SOFIA)),
      );
      expect(err.getStatus()).toBe(403);
      expect(err.reason).toBe('ADMIN_CEILING_EXCEEDED');
      expect(d.fourEyes.requestAdministrative).not.toHaveBeenCalled();
    });

    it('un delegado con la persona fuera de su alcance: 404 uniforme', async () => {
      const d = build({
        people: [engagement],
        delegate: true,
        outOfScope: true,
      });
      const err = await failure(
        run(() => d.service.requestException(request() as any, SOFIA)),
      );
      expect(err.getStatus()).toBe(404);
      expect(d.fourEyes.requestAdministrative).not.toHaveBeenCalled();
    });

    it('un delegado que pide para sí mismo: GUARDRAIL_SELF_ADMIN', async () => {
      const d = build({ people: [engagement], delegate: true });
      const err = await failure(
        run(() =>
          d.service.requestException(
            request() as any,
            {
              id: 'lucia',
              roles: ['SUPPORT_STAFF'],
            } as any,
          ),
        ),
      );
      expect(err.reason).toBe('GUARDRAIL_SELF_ADMIN');
    });

    it('SECURITY_ADMIN conserva su camino (alcance total, sin consultar el alcance de la persona)', async () => {
      const d = build({ people: [engagement] });
      await run(() => d.service.requestException(request() as any, ADMIN));
      expect(d.team.memberOf).not.toHaveBeenCalled();
    });
  });

  it('el ejecutor, al aprobarse, crea la excepción ACTIVE con valid_to y avisa', async () => {
    const d = build({ people: [engagement] });
    const executor = d.executors.get('SOD_EXCEPTION')!;
    const payload = request();
    const row: any = {
      id: 'fe-1',
      tenantId: TENANT,
      organizationUserAssignmentId: 'eng-lucia',
      payloadJson: payload,
      reasonText: payload.justification,
    };
    const out = await executor.execute(d.tx, row, {
      approverUserId: 'gonzalo',
      tenantId: TENANT,
      now: NOW,
      actor: { id: 'gonzalo', roles: ['SECURITY_ADMIN'] } as any,
    });
    expect(d.repo.createException).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        sodRuleId: 'plat-SOD-BILL-03',
        organizationUserAssignmentId: 'eng-lucia',
        fourEyesRequestId: 'fe-1',
        validFrom: NOW,
        validTo: new Date(payload.validTo),
      }),
    );
    expect(out).toEqual({ exceptionId: 'exc-new' });
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'delegated_access.sod.exception_granted',
      }),
    );
    expect(d.audit.record).toHaveBeenCalledWith(
      d.tx,
      expect.anything(),
      expect.objectContaining({ action: 'SOD_EXCEPTION_GRANTED' }),
    );
  });

  it('el ejecutor re-valida: si la excepción ya no vale, 409 FOUR_EYES_PAYLOAD_INVALID', async () => {
    const d = build({ people: [] });
    const executor = d.executors.get('SOD_EXCEPTION')!;
    const row: any = {
      id: 'fe-1',
      tenantId: TENANT,
      payloadJson: request(),
      organizationUserAssignmentId: 'eng-lucia',
    };
    const err = await failure(
      executor.execute(d.tx, row, {
        approverUserId: 'gonzalo',
        tenantId: TENANT,
        now: NOW,
        actor: { id: 'gonzalo', roles: [] } as any,
      }),
    );
    expect(err.getStatus()).toBe(409);
    expect(err.reason).toBe('FOUR_EYES_PAYLOAD_INVALID');
    expect(d.repo.createException).not.toHaveBeenCalled();
  });

  it('revocar: marca REVOKED con motivo, asienta y avisa', async () => {
    const exc = {
      id: 'exc-1',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      tenantId: TENANT,
      sodRuleId: 'plat-SOD-BILL-03',
      organizationUserAssignmentId: 'eng-lucia',
      justificationText: 'x'.repeat(40),
      validFrom: NOW,
      validTo: NOW,
    };
    const d = build({ exceptions: [exc] });
    const out = await run(() =>
      d.service.revokeException(
        'exc-1',
        { reason: 'Ya no hace falta' } as any,
        ADMIN,
      ),
    );
    expect(out.status).toBe('REVOKED');
    expect(d.audit.record).toHaveBeenCalledWith(
      d.tx,
      ADMIN,
      expect.objectContaining({ action: 'SOD_EXCEPTION_REVOKED' }),
    );
  });

  it('revocar una inexistente: 404 SOD_EXCEPTION_NOT_FOUND; ya revocada: 409', async () => {
    const d = build({
      exceptions: [
        {
          id: 'exc-2',
          statusConceptId: CONCEPTS.STATE_REVOKED,
          tenantId: TENANT,
          sodRuleId: 'p',
          organizationUserAssignmentId: 'e',
          justificationText: 'x',
          validFrom: NOW,
          validTo: NOW,
        },
      ],
    });
    const missing = await failure(
      run(() =>
        d.service.revokeException('nadie', { reason: 'xxxxx' } as any, ADMIN),
      ),
    );
    expect(missing.getStatus()).toBe(404);
    expect(missing.reason).toBe('SOD_EXCEPTION_NOT_FOUND');
    const again = await failure(
      run(() =>
        d.service.revokeException('exc-2', { reason: 'xxxxx' } as any, ADMIN),
      ),
    );
    expect(again.getStatus()).toBe(409);
  });
});

describe('SodService.findings (tablero y barrido)', () => {
  it('lista los conflictos de hoy por persona, con o sin excepción', async () => {
    const heredado = {
      engagementId: 'eng-x',
      userId: 'x',
      grants: [
        grant('g-1', ['billing.payment.collect']),
        grant('g-2', ['billing.receipt.void']),
      ],
    };
    const d = build({ people: [heredado, LUCIA] });
    const out = await run(() => d.service.findings());
    expect(out.count).toBe(1);
    expect(out.items[0]).toMatchObject({
      engagementId: 'eng-x',
      userId: 'x',
      ruleCode: 'SOD-BILL-01',
      outcome: 'BLOCKED',
    });
  });

  it('un delegado solo ve las personas de su alcance', async () => {
    const eco = {
      engagementId: 'eng-eco',
      userId: 'eco-user',
      grants: [
        grant('g-1', ['billing.payment.collect'], {
          healthcareServiceId: 'eco',
        }),
        grant('g-2', ['billing.receipt.void'], { healthcareServiceId: 'eco' }),
      ],
    };
    const cardio = {
      engagementId: 'eng-car',
      userId: 'car-user',
      grants: [
        grant('g-3', ['billing.payment.collect'], {
          healthcareServiceId: 'cardio',
        }),
        grant('g-4', ['billing.receipt.void'], {
          healthcareServiceId: 'cardio',
        }),
      ],
    };
    const d = build({
      people: [eco, cardio],
      view: { full: false, adminTargets: [] },
    });
    const out = await run(() =>
      d.service.findings({ id: 'sofia', roles: ['SUPPORT_STAFF'] } as any),
    );
    expect(out.items.map((i) => i.userId)).toEqual(['eco-user']);
    expect(d.access.view).toHaveBeenCalledWith(
      d.tx,
      expect.anything(),
      'audit.reports.governance.view',
    );
  });
});
