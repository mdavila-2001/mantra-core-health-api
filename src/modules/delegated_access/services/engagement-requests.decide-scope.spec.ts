import { jest } from '@jest/globals';
import { EngagementRequestsService } from './engagement-requests.service';
import { PreconditionFailedException, runWithTenant } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { DelegationScopeService } from './delegation-scope.service';
import { namesRepoDouble } from './support-names.testing';
import { STATUS } from './concept-maps';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const SOFIA = { id: 'sofia', roles: ['SUPPORT_STAFF'] } as any;

const pendingItem = (id: string, actions = ['schedule.view']) => ({
  id,
  engagementRequestId: 'req-1',
  targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
  practitionerRoleAssignmentId: `pra-${id}`,
  proposedActionsJson: actions,
  decisionConceptId: DELEG.ENGAGEMENT_DECISION_PENDING,
  createdAt: new Date(),
});

/** Construye el servicio con repositorios y colaboradores en doble. */
function build(items = [pendingItem('i1'), pendingItem('i2')], stepUp?: any) {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue([]),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn().mockReturnValue(tx),
  };
  const request: any = {
    id: 'req-1',
    tenantId: TENANT,
    requesterUserId: 'user-ana',
    directionConceptId: DELEG.ENGAGEMENT_DIRECTION_REQUEST,
    roleTemplateId: 'tpl-secretary',
    statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
    expiresAt: new Date(Date.now() + 86_400_000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const requests = {
    findById: mockFn().mockResolvedValue(request),
    findItems: mockFn().mockResolvedValue(items),
    create: mockFn().mockReturnValue({
      id: 'req-new',
      statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
      createdAt: new Date('2026-10-30'),
    }),
    createItem: mockFn(),
    findOverduePending: mockFn().mockResolvedValue([]),
    findByTenant: mockFn().mockResolvedValue([]),
    findByRequester: mockFn().mockResolvedValue([]),
  };
  const templates = {
    findEffectiveByCode: mockFn().mockResolvedValue({
      id: 'tpl-secretary',
      code: 'SECRETARY',
      defaultActionsJson: ['schedule.view', 'schedule.create'],
    }),
    findById: mockFn().mockResolvedValue({
      id: 'tpl-secretary',
      code: 'SECRETARY',
    }),
  };
  const engagement = {
    id: 'eng-1',
    tenantMembershipId: 'mem-1',
    statusConceptId: STATUS.ACTIVE,
  };
  const engagements = {
    create: mockFn().mockReturnValue(engagement),
    findByIds: mockFn().mockResolvedValue([engagement]),
    findActiveByMembershipTemplate: mockFn().mockResolvedValue(null),
  };
  const grants = {
    create: mockFn().mockImplementation(() => ({
      id: `grant-${Math.random()}`,
    })),
    addActions: mockFn(),
  };
  const directory = {
    findTenant: mockFn().mockResolvedValue({
      id: TENANT,
      tenantTypeConceptId: 'x',
    }),
    findMembership: mockFn().mockResolvedValue(null),
    ensureActiveStaffMembership: mockFn().mockResolvedValue({ id: 'mem-1' }),
  };
  const targets = {
    assertTarget: mockFn().mockResolvedValue({}),
    buildSnapshot: mockFn().mockResolvedValue({ rows: [] }),
  };
  const effective = { refreshTenant: mockFn().mockResolvedValue({}) };
  const scope = new DelegationScopeService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new EngagementRequestsService(
    em as any,
    requests as any,
    templates as any,
    engagements as any,
    grants as any,
    directory as any,
    targets as any,
    effective as any,
    scope,
    logger as any,
    namesRepoDouble(mockFn) as any,
    undefined,
    undefined,
    stepUp,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    tx,
    request,
    requests,
    templates,
    engagements,
    grants,
    directory,
    targets,
    effective,
    inTenant,
  };
}

/** Alcance de Sofía: solo el ítem `i1` está dentro de su servicio. */
const scopeOf = (inside: string[], ceilingError?: Error): any => ({
  inScope: mockFn(async (item: any) => inside.includes(item.id)),
  assertCeiling: mockFn(async () => {
    if (ceilingError) throw ceilingError;
  }),
});

const approve = (itemId: string) => ({ itemId, decision: 'APPROVED' as const });

describe('EngagementRequestsService.decide · por alcance (solo quien decide por /org/team)', () => {
  it('SECURITY_ADMIN conserva la regla de hoy: tiene que decidir todos los ítems pendientes', async () => {
    const d = build();
    const err: any = await d
      .inTenant(() =>
        d.service.decide('req-1', { items: [approve('i1')] } as any, ADMIN),
      )
      .catch((e) => e);
    expect(err).toBeInstanceOf(PreconditionFailedException);
    expect(err.reason).toBe(Reason.SUPPORT_DECISION_INCOMPLETE);
    expect(d.grants.create).not.toHaveBeenCalled();
  });

  it('SECURITY_ADMIN decide todo y la solicitud queda aprobada, como siempre', async () => {
    const d = build();
    const out = await d.inTenant(() =>
      d.service.decide(
        'req-1',
        { items: [approve('i1'), approve('i2')] } as any,
        ADMIN,
      ),
    );
    expect(out).toMatchObject({ status: 'APPROVED' });
    expect(out.pendingItemIds).toBeUndefined();
    expect(d.request.decidedByUserId).toBe('admin-1');
  });

  it('con alcance decide solo los ítems propios: el resto sigue pendiente y la solicitud sigue abierta', async () => {
    const d = build();
    const out = await d.inTenant(() =>
      d.service.decide('req-1', { items: [approve('i1')] } as any, SOFIA, {
        scope: scopeOf(['i1']),
      }),
    );
    expect(out.status).toBe('PENDING');
    expect(out.pendingItemIds).toEqual(['i2']);
    expect(out.grantIds).toHaveLength(1);
    expect(out.engagementId).toBe('eng-1');
    expect(d.request.statusConceptId).toBe(DELEG.ENGAGEMENT_STATUS_PENDING);
    expect(d.request.decidedAt).toBeUndefined();
    expect(d.request.decidedByUserId).toBeUndefined();
    const items = await d.requests.findItems.mock.results[0].value;
    expect(items.find((i: any) => i.id === 'i1').decisionConceptId).toBe(
      DELEG.ENGAGEMENT_DECISION_APPROVED,
    );
    expect(items.find((i: any) => i.id === 'i2').decisionConceptId).toBe(
      DELEG.ENGAGEMENT_DECISION_PENDING,
    );
    expect(d.effective.refreshTenant).toHaveBeenCalled();
  });

  it('incluir un ítem fuera de su alcance es 403 ADMIN_SCOPE_EXCEEDED y no se escribe nada', async () => {
    const d = build();
    const err: any = await d
      .inTenant(() =>
        d.service.decide(
          'req-1',
          { items: [approve('i1'), approve('i2')] } as any,
          SOFIA,
          {
            scope: scopeOf(['i1']),
          },
        ),
      )
      .catch((e) => e);
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe(Reason.ADMIN_SCOPE_EXCEEDED);
    expect(d.grants.create).not.toHaveBeenCalled();
  });

  it('dentro de su alcance tiene que decidir todos los suyos: falta uno y lo dice', async () => {
    const d = build();
    const err: any = await d
      .inTenant(() =>
        d.service.decide('req-1', { items: [approve('i1')] } as any, SOFIA, {
          scope: scopeOf(['i1', 'i2']),
        }),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.SUPPORT_DECISION_INCOMPLETE);
    expect(err.details.missing).toEqual(['i2']);
  });

  it('aprobar por encima de su techo es 403 ADMIN_CEILING_EXCEEDED (rechazar sí puede)', async () => {
    const ceiling = Object.assign(new Error('techo'), {
      reason: Reason.ADMIN_CEILING_EXCEEDED,
    });
    const d = build();
    await expect(
      d.inTenant(() =>
        d.service.decide('req-1', { items: [approve('i1')] } as any, SOFIA, {
          scope: scopeOf(['i1'], ceiling),
        }),
      ),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_CEILING_EXCEEDED });
    expect(d.grants.create).not.toHaveBeenCalled();
    const reject = build();
    const scope = scopeOf(['i1'], ceiling);
    const out = await reject.inTenant(() =>
      reject.service.decide(
        'req-1',
        {
          items: [
            { itemId: 'i1', decision: 'REJECTED', comment: 'No corresponde' },
          ],
        } as any,
        SOFIA,
        { scope },
      ),
    );
    expect(out.pendingItemIds).toEqual(['i2']);
    expect(scope.assertCeiling).not.toHaveBeenCalled();
  });

  it('se mantienen las reglas de hoy: motivo al rechazar y no decidir lo propio', async () => {
    const d = build();
    await expect(
      d.inTenant(() =>
        d.service.decide(
          'req-1',
          { items: [{ itemId: 'i1', decision: 'REJECTED' }] } as any,
          SOFIA,
          { scope: scopeOf(['i1']) },
        ),
      ),
    ).rejects.toMatchObject({
      reason: Reason.SUPPORT_DECISION_REASON_REQUIRED,
    });
    const own = build();
    await expect(
      own.inTenant(() =>
        own.service.decide(
          'req-1',
          { items: [approve('i1')] } as any,
          { id: 'user-ana' } as any,
          {
            scope: scopeOf(['i1']),
          },
        ),
      ),
    ).rejects.toMatchObject({ reason: Reason.SUPPORT_DECISION_SELF });
  });

  it('cuando quien decide por alcance cierra el último ítem pendiente, la solicitud se completa', async () => {
    const d = build();
    const out = await d.inTenant(() =>
      d.service.decide(
        'req-1',
        { items: [approve('i1'), approve('i2')] } as any,
        SOFIA,
        {
          scope: scopeOf(['i1', 'i2']),
        },
      ),
    );
    expect(out.status).toBe('APPROVED');
    expect(out.pendingItemIds).toBeUndefined();
    expect(d.request.decidedByUserId).toBe('sofia');
  });

  it('lo que Sofía dejó pendiente lo termina SECURITY_ADMIN y entonces la solicitud se completa', async () => {
    const d = build();
    await d.inTenant(() =>
      d.service.decide('req-1', { items: [approve('i1')] } as any, SOFIA, {
        scope: scopeOf(['i1']),
      }),
    );
    const out = await d.inTenant(() =>
      d.service.decide('req-1', { items: [approve('i2')] } as any, ADMIN),
    );
    expect(out.status).toBe('APPROVED');
    expect(d.request.decidedByUserId).toBe('admin-1');
  });
});

describe('B-M2 / A-M2: aprobar una solicitud crea permisos, así que pide el paso extra', () => {
  const stale = () => ({
    assertFresh: mockFn().mockRejectedValue(
      Object.assign(new Error('x'), { reason: 'STEP_UP_REQUIRED' }),
    ),
  });

  it('aprobar sin sello vigente: 403 STEP_UP_REQUIRED y no se emite nada (SECURITY_ADMIN y delegado)', async () => {
    const admin = build(undefined, stale());
    await expect(
      admin.inTenant(() =>
        admin.service.decide(
          'req-1',
          { items: [approve('i1'), approve('i2')] } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'STEP_UP_REQUIRED' });
    expect(admin.grants.create).not.toHaveBeenCalled();
    const delegate = build(undefined, stale());
    await expect(
      delegate.inTenant(() =>
        delegate.service.decide(
          'req-1',
          { items: [approve('i1')] } as any,
          SOFIA,
          {
            scope: scopeOf(['i1']),
          },
        ),
      ),
    ).rejects.toMatchObject({ reason: 'STEP_UP_REQUIRED' });
    expect(delegate.grants.create).not.toHaveBeenCalled();
  });

  it('rechazar todo no crea permisos: no pide el paso extra', async () => {
    const d = build(undefined, stale());
    const out = await d.inTenant(() =>
      d.service.decide(
        'req-1',
        {
          items: [
            { itemId: 'i1', decision: 'REJECTED', comment: 'No procede' },
            { itemId: 'i2', decision: 'REJECTED', comment: 'No procede' },
          ],
        } as any,
        ADMIN,
      ),
    );
    expect(out.status).toBe('REJECTED');
  });
});

describe('B-M3: aprobar una solicitud no otorga átomos CRÍTICA con una sola persona', () => {
  it('un ítem que pide un átomo crítico no se aprueba por esta ruta: 422 FOUR_EYES_REQUEST_INVALID y no se escribe nada', async () => {
    const d = build([
      pendingItem('i1', ['billing.receipt.void']),
      pendingItem('i2'),
    ]);
    const err: any = await d
      .inTenant(() =>
        d.service.decide(
          'req-1',
          { items: [approve('i1'), approve('i2')] } as any,
          ADMIN,
        ),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.FOUR_EYES_REQUEST_INVALID);
    expect(err.details.criticalAtoms).toEqual(['billing.receipt.void']);
    expect(d.grants.create).not.toHaveBeenCalled();
  });

  it('con un ajuste que lo quita sí se aprueba; rechazarlo también', async () => {
    const d = build([pendingItem('i1', ['billing.receipt.void'])]);
    const out = await d.inTenant(() =>
      d.service.decide(
        'req-1',
        {
          items: [
            {
              itemId: 'i1',
              decision: 'ADJUSTED',
              comment: 'Sin anular comprobantes',
              actions: ['agenda.appointment.view'],
            },
          ],
        } as any,
        ADMIN,
      ),
    );
    expect(out.status).toBe('APPROVED');
  });
});
