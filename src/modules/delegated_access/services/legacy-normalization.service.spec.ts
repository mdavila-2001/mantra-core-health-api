import { jest } from '@jest/globals';
import { runWithTenant, CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { permissionAtomId, supportPermissionId } from '../domain';
import { LegacyNormalizationService } from './legacy-normalization.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const NOW = new Date('2026-11-03T14:30:00Z');
const ADMIN = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;

const aliasRow = (code: string): any => ({
  id: `row-${code}`,
  tenantId: TENANT,
  supportScopeGrantId: 'g1',
  permissionId: supportPermissionId(code as never),
  supersededAt: null,
});
const withGrant = (
  grantId: string,
  engagementId: string,
  aliases: string[],
  atoms: string[] = [],
  over: Record<string, unknown> = {},
): any => {
  const ids = [
    ...aliases.map((c) => supportPermissionId(c as never)),
    ...atoms.map((a) => permissionAtomId(a)),
  ];
  return {
    grant: {
      id: grantId,
      tenantId: TENANT,
      organizationUserAssignmentId: engagementId,
      statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
      createdAt: NOW,
      ...over,
    },
    permissionIds: ids,
    actions: ids.map((permissionId) => ({
      permissionId,
      conditionJson: null,
      supersededAt: null,
    })),
  };
};
const engagement = (id: string, userId: string, templateId: string): any => ({
  assignment: { id, roleTemplateId: templateId, statusConceptId: 'active' },
  tenantId: TENANT,
  userId,
});

function build(
  opts: {
    engagements?: any[];
    grantRows?: any[];
    templates?: Record<string, string>;
    ceilingRules?: any[];
    superseded?: any[];
    created?: any[];
    alreadyReverted?: boolean;
  } = {},
) {
  const tx: any = { flush: mockFn().mockResolvedValue(undefined) };
  const em: any = {
    fork: () => tx,
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const access = {
    findEngagements: mockFn().mockResolvedValue(opts.engagements ?? []),
    findGrantsWithActions: mockFn().mockResolvedValue(opts.grantRows ?? []),
  };
  const grants = {
    addActionsAt: mockFn(),
    markSuperseded: mockFn(),
    findSupersededAt: mockFn().mockResolvedValue(opts.superseded ?? []),
    findCreatedAt: mockFn().mockResolvedValue(opts.created ?? []),
    wasBatchReverted: mockFn().mockResolvedValue(opts.alreadyReverted ?? false),
    clearSuperseded: mockFn(),
    removeActions: mockFn(),
    findById: mockFn(),
    findLiveActions: mockFn(async (_e: any, grantId: string) =>
      (opts.grantRows ?? [])
        .filter((g: any) => g.grant.id === grantId)
        .flatMap((g: any) =>
          g.permissionIds.map((permissionId: string) => ({
            id: `row-${permissionId}`,
            tenantId: TENANT,
            supportScopeGrantId: grantId,
            permissionId,
            supersededAt: null,
          })),
        ),
    ),
  };
  const templates = {
    findById: mockFn(async (_e: any, id: string) =>
      opts.templates?.[id] ? { id, code: opts.templates[id] } : null,
    ),
  };
  const rulesRepo = {
    findActiveForTenant: mockFn().mockResolvedValue(opts.ceilingRules ?? []),
  };
  const stepUp = { assertFresh: mockFn().mockResolvedValue(undefined) };
  const audit = { record: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const scope = { resolveTenant: () => TENANT };
  const logger = { setContext: mockFn(), info: mockFn() };
  jest.useFakeTimers({ now: NOW });
  const service = new LegacyNormalizationService(
    em,
    access as any,
    grants as any,
    templates as any,
    rulesRepo as any,
    stepUp as any,
    audit as any,
    outbox as any,
    scope as any,
    logger as any,
  );
  return { service, tx, access, grants, stepUp, audit, outbox };
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

/** Caso 3 (R-03): un vínculo sintético con el alias `schedule.edit_hours`. */
const HOURS = {
  engagements: [engagement('eng-1', 'u-1', 'tpl-secretary')],
  grantRows: [withGrant('g1', 'eng-1', ['schedule.edit_hours'])],
  templates: { 'tpl-secretary': 'SECRETARY' },
};

describe('LegacyNormalizationService.normalize — simulacro (caso 3)', () => {
  it('por defecto es dryRun: informa los átomos y las obligaciones que empezarían a regir y no escribe nada', async () => {
    const d = build(HOURS);
    const out = await run(() => d.service.normalize({} as any, ADMIN));
    expect(out.dryRun).toBe(true);
    expect(out.batchId).toBeUndefined();
    expect(out.engagements).toHaveLength(1);
    const plan = out.engagements[0].grants[0];
    expect(plan).toMatchObject({
      grantId: 'g1',
      aliases: ['schedule.edit_hours'],
      atomsBefore: ['agenda.hours.edit'],
    });
    expect(plan.atomsAfter).toEqual([
      'agenda.hours.edit',
      'patients.clinical.request_temporary_access',
    ]);
    expect(plan.newObligations).toEqual([
      expect.objectContaining({
        atom: 'agenda.hours.edit',
        requiresReason: true,
        requiresStepUp: true,
        approval: 'DOCTOR',
        message: expect.stringMatching(/aprobaci[oó]n del doctor/i),
      }),
      expect.objectContaining({
        atom: 'patients.clinical.request_temporary_access',
      }),
    ]);
    expect(d.grants.addActionsAt).not.toHaveBeenCalled();
    expect(d.grants.markSuperseded).not.toHaveBeenCalled();
    expect(d.audit.record).not.toHaveBeenCalled();
    expect(d.stepUp.assertFresh).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('un átomo escrito aparte gana sobre el alias y no se vuelve a insertar', async () => {
    const d = build({
      ...HOURS,
      grantRows: [
        withGrant(
          'g1',
          'eng-1',
          ['schedule.edit_hours'],
          ['agenda.hours.edit'],
        ),
      ],
    });
    const out = await run(() =>
      d.service.normalize({ dryRun: true } as any, ADMIN),
    );
    expect(out.engagements[0].grants[0].atomsAdded).not.toContain(
      'agenda.hours.edit',
    );
  });

  it('un permiso que ya es solo de átomos no se toca', async () => {
    const d = build({
      ...HOURS,
      grantRows: [withGrant('g1', 'eng-1', [], ['agenda.appointment.view'])],
    });
    const out = await run(() =>
      d.service.normalize({ dryRun: true } as any, ADMIN),
    );
    expect(out.engagements).toEqual([]);
    expect(out.totals.grants).toBe(0);
  });

  it('un permiso revocado no se normaliza', async () => {
    const d = build({
      ...HOURS,
      grantRows: [
        withGrant('g1', 'eng-1', ['schedule.view'], [], {
          statusConceptId: DELEG.SUPPORT_GRANT_REVOKED,
        }),
      ],
    });
    const out = await run(() =>
      d.service.normalize({ dryRun: true } as any, ADMIN),
    );
    expect(out.engagements).toEqual([]);
  });

  it('el acceso temporal implícito: si el techo de la plantilla no lo admite, es un estrechamiento que hay que reconocer', async () => {
    const d = build({
      engagements: [engagement('eng-2', 'u-2', 'tpl-front')],
      grantRows: [withGrant('g2', 'eng-2', ['schedule.view'])],
      templates: { 'tpl-front': 'FRONT_DESK' },
    });
    const out = await run(() =>
      d.service.normalize({ dryRun: true } as any, ADMIN),
    );
    expect(out.requiresAcknowledgement).toBe(true);
    expect(out.engagements[0].tightening).toEqual([
      expect.objectContaining({
        engagementId: 'eng-2',
        atom: 'patients.clinical.request_temporary_access',
        message: expect.stringMatching(/dejar[aá] de poder pedir/i),
      }),
    ]);
    expect(out.engagements[0].grants[0].atomsAfter).not.toContain(
      'patients.clinical.request_temporary_access',
    );
  });

  it('una regla CEILING de la organización también lo estrecha', async () => {
    const d = build({
      ...HOURS,
      ceilingRules: [
        {
          id: 'r1',
          ruleKindConceptId: DELEG.GOV_RULE_CEILING,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          roleTemplateCode: 'SECRETARY',
          permissionPattern: 'patients.clinical.*',
        },
      ],
    });
    const out = await run(() =>
      d.service.normalize({ dryRun: true } as any, ADMIN),
    );
    expect(out.engagements[0].tightening).toHaveLength(1);
  });

  it('el filtro engagementIds llega a la consulta', async () => {
    const d = build(HOURS);
    await run(() =>
      d.service.normalize({ engagementIds: ['eng-1'] } as any, ADMIN),
    );
    expect(d.access.findEngagements).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ tenantId: TENANT, ids: ['eng-1'] }),
    );
  });
});

describe('LegacyNormalizationService.normalize — aplicar', () => {
  it('sin reconocer el estrechamiento: 422 NORMALIZE_TIGHTENING_NOT_ACKNOWLEDGED y no escribe nada', async () => {
    const d = build({
      engagements: [engagement('eng-2', 'u-2', 'tpl-front')],
      grantRows: [withGrant('g2', 'eng-2', ['schedule.view'])],
      templates: { 'tpl-front': 'FRONT_DESK' },
    });
    const err = await failure(
      run(() => d.service.normalize({ dryRun: false } as any, ADMIN)),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('NORMALIZE_TIGHTENING_NOT_ACKNOWLEDGED');
    expect(err.details.tightening).toHaveLength(1);
    expect(d.grants.addActionsAt).not.toHaveBeenCalled();
  });

  it('aplica: inserta los átomos, deja los alias como reemplazados (no se borran), asienta y avisa con el mismo instante de lote', async () => {
    const d = build(HOURS);
    const out = await run(() =>
      d.service.normalize({ dryRun: false } as any, ADMIN),
    );
    expect(d.stepUp.assertFresh).toHaveBeenCalledTimes(1);
    expect(out.dryRun).toBe(false);
    expect(out.batchId).toMatch(/^00000000-0000-4000-8000-[0-9a-f]{12}$/);
    expect(d.grants.addActionsAt).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ id: 'g1' }),
      [
        permissionAtomId('agenda.hours.edit'),
        permissionAtomId('patients.clinical.request_temporary_access'),
      ],
      NOW,
    );
    expect(d.grants.markSuperseded).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          permissionId: supportPermissionId('schedule.edit_hours'),
        }),
      ],
      NOW,
      'admin',
    );
    expect(d.audit.record).toHaveBeenCalledWith(
      d.tx,
      ADMIN,
      expect.objectContaining({
        action: 'SUPPORT_GRANT_NORMALIZED',
        tenantId: TENANT,
        entityId: out.batchId,
      }),
    );
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'delegated_access.grant.normalized',
        aggregateId: out.batchId,
      }),
    );
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('con acknowledgeTightening aplica aunque alguien pierda el acceso temporal', async () => {
    const d = build({
      engagements: [engagement('eng-2', 'u-2', 'tpl-front')],
      grantRows: [withGrant('g2', 'eng-2', ['schedule.view'])],
      templates: { 'tpl-front': 'FRONT_DESK' },
    });
    const out = await run(() =>
      d.service.normalize(
        { dryRun: false, acknowledgeTightening: true } as any,
        ADMIN,
      ),
    );
    expect(out.batchId).toBeDefined();
    expect(d.grants.addActionsAt).toHaveBeenCalledWith(
      d.tx,
      expect.anything(),
      [
        permissionAtomId('agenda.appointment.view'),
        permissionAtomId('agenda.appointment.view.patient_name'),
      ],
      NOW,
    );
  });

  it('sin el paso extra no se escribe', async () => {
    const d = build(HOURS);
    d.stepUp.assertFresh.mockRejectedValue(new Error('STEP_UP_REQUIRED'));
    await expect(
      run(() => d.service.normalize({ dryRun: false } as any, ADMIN)),
    ).rejects.toThrow('STEP_UP_REQUIRED');
    expect(d.grants.addActionsAt).not.toHaveBeenCalled();
  });
});

describe('LegacyNormalizationService.revert', () => {
  const BATCH = `00000000-0000-4000-8000-${NOW.getTime().toString(16).padStart(12, '0')}`;
  const superseded = [
    { ...aliasRow('schedule.edit_hours'), supersededAt: NOW },
  ];
  const created = [
    {
      id: 'a1',
      supportScopeGrantId: 'g1',
      permissionId: permissionAtomId('agenda.hours.edit'),
      createdAt: NOW,
    },
  ];

  it('quita los átomos que insertó ese lote y limpia lo reemplazado', async () => {
    const d = build({ superseded, created });
    const out = await run(() =>
      d.service.revert({ batchId: BATCH } as any, ADMIN),
    );
    expect(d.stepUp.assertFresh).toHaveBeenCalled();
    expect(d.grants.findSupersededAt).toHaveBeenCalledWith(d.tx, TENANT, NOW);
    expect(d.grants.findCreatedAt).toHaveBeenCalledWith(
      d.tx,
      TENANT,
      ['g1'],
      NOW,
    );
    expect(d.grants.clearSuperseded).toHaveBeenCalledWith(
      superseded,
      NOW,
      'admin',
    );
    expect(d.grants.removeActions).toHaveBeenCalledWith(d.tx, created);
    expect(out).toEqual({
      batchId: BATCH,
      restoredAliasRows: 1,
      removedAtomRows: 1,
    });
    expect(d.audit.record).toHaveBeenCalledWith(
      d.tx,
      ADMIN,
      expect.objectContaining({
        action: 'SUPPORT_GRANT_NORMALIZE_REVERTED',
        entityId: BATCH,
      }),
    );
  });

  it('un lote desconocido: 404 NORMALIZE_BATCH_NOT_FOUND', async () => {
    const d = build({ superseded: [] });
    const err = await failure(
      run(() => d.service.revert({ batchId: BATCH } as any, ADMIN)),
    );
    expect(err.getStatus()).toBe(404);
    expect(err.reason).toBe('NORMALIZE_BATCH_NOT_FOUND');
  });

  it('un lote que ya se revirtió: 409 NORMALIZE_BATCH_ALREADY_REVERTED, no 404 (pendiente 28)', async () => {
    const d = build({ superseded: [], alreadyReverted: true });
    const err = await failure(
      run(() => d.service.revert({ batchId: BATCH } as any, ADMIN)),
    );
    expect(err.getStatus()).toBe(409);
    expect(err.reason).toBe('NORMALIZE_BATCH_ALREADY_REVERTED');
    expect(d.grants.wasBatchReverted).toHaveBeenCalledWith(d.tx, TENANT, BATCH);
    expect(d.grants.clearSuperseded).not.toHaveBeenCalled();
  });

  it('un lote que nunca existió sigue siendo 404 aunque se pregunte por el historial', async () => {
    const d = build({ superseded: [], alreadyReverted: false });
    const err = await failure(
      run(() => d.service.revert({ batchId: BATCH } as any, ADMIN)),
    );
    expect(err.reason).toBe('NORMALIZE_BATCH_NOT_FOUND');
  });

  it('un id que no es de lote: 404', async () => {
    const d = build();
    const err = await failure(
      run(() =>
        d.service.revert(
          { batchId: '11111111-1111-4111-8111-111111111111' } as any,
          ADMIN,
        ),
      ),
    );
    expect(err.getStatus()).toBe(404);
  });
});
