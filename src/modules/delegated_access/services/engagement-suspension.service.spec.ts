import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { LifecycleRepository } from '../repositories/lifecycle.repository';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { EngagementSuspensionService } from './engagement-suspension.service';
import { memoryEm } from './lifecycle.testing';
import { DEFAULT_LIFECYCLE_SETTINGS } from './support-lifecycle-settings';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'org-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const NOW = new Date('2026-11-03T14:30:00Z');

function build(assignmentOver: Record<string, unknown> = {}) {
  const assignment: any = {
    id: 'eng-ana',
    statusConceptId: STATUS.ACTIVE,
    supervisorUserId: 'sofia',
    nextRecertificationAt: new Date('2027-03-01'),
    tenantMembershipId: 'mem-ana',
    ...assignmentOver,
  };
  const record = {
    assignment,
    tenantId: TENANT,
    userId: 'ana',
    membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  };
  const { em, tables } = memoryEm(mockFn);
  const access = {
    findEngagements: mockFn(async (_e: any, f: any) =>
      f.ids && !f.ids.includes('eng-ana') ? [] : [record],
    ),
  };
  const delegations: any[] = [
    { id: 'd1', statusConceptId: STATUS.ACTIVE },
    { id: 'd2', statusConceptId: STATUS.SUSPENDED },
    { id: 'd3', statusConceptId: STATUS.REVOKED },
  ];
  const engagements = {
    findDelegations: mockFn().mockResolvedValue(delegations),
    syncSupportMembership: mockFn().mockResolvedValue(true),
  };
  const effective = { refreshTenant: mockFn().mockResolvedValue({}) };
  const settings = {
    forTenant: mockFn().mockResolvedValue(DEFAULT_LIFECYCLE_SETTINGS),
  };
  const fourEyes = {
    request: mockFn().mockResolvedValue({
      approvalId: 'ap-1',
      expiresAt: new Date('2026-11-10T14:30:00Z'),
    }),
  };
  const review = {
    open: mockFn().mockResolvedValue({ campaignId: 'camp-1', itemCount: 1 }),
  };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new EngagementSuspensionService(
    em,
    access as any,
    engagements as any,
    new LifecycleRepository(),
    effective as any,
    settings as any,
    fourEyes as any,
    review as any,
    outbox as any,
    new DelegationScopeService({} as any, {} as any, {} as any, {} as any),
    logger as any,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    em,
    tables,
    assignment,
    access,
    delegations,
    engagements,
    effective,
    fourEyes,
    review,
    outbox,
    inTenant,
  };
}

describe('EngagementSuspensionService.suspend (L-05, inmediata y sin aprobación)', () => {
  it('suspende al instante: estado, motivo, delegaciones, membresía y acceso derivado', async () => {
    const t = build();
    const out = await t.inTenant(() =>
      t.service.suspend(
        'eng-ana',
        { reasonCode: 'INVESTIGATION', note: 'Revisión por reclamo' },
        ADMIN,
        NOW,
      ),
    );
    expect(out.ok).toBe(true);
    expect(t.assignment.statusConceptId).toBe(STATUS.SUSPENDED);
    expect(t.assignment.suspendedAt).toEqual(NOW);
    expect(t.assignment.suspensionReasonConceptId).toBe(
      DELEG.SUSPENSION_INVESTIGATION,
    );
    expect(t.assignment.suspensionNoteText).toBe('Revisión por reclamo');
    // Solo se suspenden las delegaciones activas.
    expect(t.delegations.map((d) => d.statusConceptId)).toEqual([
      STATUS.SUSPENDED,
      STATUS.SUSPENDED,
      STATUS.REVOKED,
    ]);
    expect(t.engagements.syncSupportMembership).toHaveBeenCalledWith(
      t.em,
      'mem-ana',
      'SUSPENDED',
      NOW,
      'admin-1',
    );
    expect(t.effective.refreshTenant).toHaveBeenCalledWith(
      TENANT,
      expect.objectContaining({ userId: 'ana' }),
    );
    const kase = t.tables.LifecycleCases[0];
    expect(kase.kindConceptId).toBe(DELEG.LIFECYCLE_SUSPENSION);
    expect(kase.statusConceptId).toBe(DELEG.LIFECYCLE_COMPLETED);
    const types = t.outbox.publishDomainEvent.mock.calls.map(
      (c: any[]) => c[1].eventType,
    );
    expect(types).toContain('delegated_access.lifecycle.suspended');
  });

  it('ya suspendido: 409 ENGAGEMENT_ALREADY_SUSPENDED; terminado: 422 SUPPORT_ENGAGEMENT_NOT_ACTIVE', async () => {
    const t = build({ statusConceptId: STATUS.SUSPENDED });
    await expect(
      t.inTenant(() =>
        t.service.suspend('eng-ana', { reasonCode: 'MANUAL' }, ADMIN, NOW),
      ),
    ).rejects.toMatchObject({ reason: Reason.ENGAGEMENT_ALREADY_SUSPENDED });
    const u = build({ statusConceptId: STATUS.REVOKED });
    await expect(
      u.inTenant(() =>
        u.service.suspend('eng-ana', { reasonCode: 'MANUAL' }, ADMIN, NOW),
      ),
    ).rejects.toMatchObject({ reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE });
  });

  it('la guarda del llamador (alcance del administrador delegado) corre antes de escribir', async () => {
    const t = build();
    const guard = mockFn().mockRejectedValue(
      Object.assign(new Error('fuera de alcance'), {
        reason: Reason.ADMIN_SCOPE_EXCEEDED,
      }),
    );
    await expect(
      t.inTenant(() =>
        t.service.suspend(
          'eng-ana',
          { reasonCode: 'MANUAL' },
          ADMIN,
          NOW,
          guard,
        ),
      ),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_SCOPE_EXCEEDED });
    expect(t.assignment.statusConceptId).toBe(STATUS.ACTIVE);
    expect(t.effective.refreshTenant).not.toHaveBeenCalled();
  });

  it('la suspensión por inactividad (D-04) la hace el sistema: sin autor y con el motivo INACTIVITY', async () => {
    const t = build();
    const out = await t.service.suspendSystem(
      t.em,
      TENANT,
      'eng-ana',
      'INACTIVITY',
      NOW,
    );
    expect(out.ok).toBe(true);
    expect(t.assignment.suspensionReasonConceptId).toBe(
      DELEG.SUSPENSION_INACTIVITY,
    );
    expect(t.engagements.syncSupportMembership).toHaveBeenCalledWith(
      t.em,
      'mem-ana',
      'SUSPENDED',
      NOW,
      undefined,
    );
  });
});

describe('EngagementSuspensionService.reactivate (D-19: siempre cuatro ojos)', () => {
  const suspended = {
    statusConceptId: STATUS.SUSPENDED,
    suspendedAt: new Date('2026-11-03T14:00:00Z'),
    suspensionReasonConceptId: DELEG.SUSPENSION_INVESTIGATION,
  };

  it('pide la aprobación de una segunda persona y no reactiva nada todavía', async () => {
    const t = build(suspended);
    const out = await t.inTenant(() =>
      t.service.reactivate(
        'eng-ana',
        { reason: 'Se aclaró el reclamo' },
        ADMIN,
        NOW,
      ),
    );
    expect(out).toMatchObject({
      status: 'PENDING_APPROVAL',
      approvalId: 'ap-1',
    });
    const req = t.fourEyes.request.mock.calls[0][1];
    expect(req).toMatchObject({
      kind: 'REACTIVATION',
      actor: ADMIN,
      subjectUserId: 'ana',
      engagementId: 'eng-ana',
    });
    expect(req.payload.suspensionReason).toBe('INVESTIGATION');
    expect(t.assignment.statusConceptId).toBe(STATUS.SUSPENDED);
    expect(t.effective.refreshTenant).not.toHaveBeenCalled();
  });

  it('un vínculo activo: 409 ENGAGEMENT_NOT_SUSPENDED; el suspendido por recertificación se reactiva recertificando', async () => {
    const a = build();
    await expect(
      a.inTenant(() =>
        a.service.reactivate('eng-ana', { reason: 'x' }, ADMIN, NOW),
      ),
    ).rejects.toMatchObject({ reason: Reason.ENGAGEMENT_NOT_SUSPENDED });
    const b = build({
      statusConceptId: STATUS.SUSPENDED,
      endedReasonText: 'RECERTIFICATION_LAPSED',
    });
    await expect(
      b.inTenant(() =>
        b.service.reactivate('eng-ana', { reason: 'x' }, ADMIN, NOW),
      ),
    ).rejects.toMatchObject({ reason: Reason.ENGAGEMENT_NOT_SUSPENDED });
  });

  it('aprobada: vuelve a activo con sus delegaciones y su membresía, y la recertificación sigue intacta', async () => {
    const t = build(suspended);
    const before = t.assignment.nextRecertificationAt;
    const res = await t.service.executeReactivation(
      t.em,
      TENANT,
      { engagementId: 'eng-ana', suspensionReason: 'INVESTIGATION' },
      'admin-1',
      'gonzalo',
      new Date('2026-11-04T10:00:00Z'),
    );
    expect(res).toMatchObject({ reactivated: true, reviewOpened: false });
    expect(t.assignment.statusConceptId).toBe(STATUS.ACTIVE);
    expect(t.assignment.suspendedAt).toBeUndefined();
    expect(t.assignment.suspensionReasonConceptId).toBeUndefined();
    expect(t.assignment.nextRecertificationAt).toBe(before);
    expect(t.delegations.map((d) => d.statusConceptId)).toEqual([
      STATUS.ACTIVE,
      STATUS.ACTIVE,
      STATUS.REVOKED,
    ]);
    expect(t.engagements.syncSupportMembership).toHaveBeenCalledWith(
      t.em,
      'mem-ana',
      'ACTIVE',
      expect.any(Date),
      'gonzalo',
    );
    expect(t.effective.refreshTenant).toHaveBeenCalled();
    expect(t.review.open).not.toHaveBeenCalled();
    const kase = t.tables.LifecycleCases[0];
    expect(kase.kindConceptId).toBe(DELEG.LIFECYCLE_REACTIVATION);
    expect(kase.openedByUserId).toBe('admin-1');
  });

  it('tras más de 60 días suspendida abre además una revisión dirigida para su dueño (7 días)', async () => {
    const t = build({
      ...suspended,
      suspendedAt: new Date('2026-08-01T00:00:00Z'),
    });
    const res = await t.service.executeReactivation(
      t.em,
      TENANT,
      { engagementId: 'eng-ana', suspensionReason: 'MANUAL' },
      'admin-1',
      'gonzalo',
      new Date('2026-11-04T10:00:00Z'),
    );
    expect(res.reviewOpened).toBe(true);
    const input = t.review.open.mock.calls[0][1];
    expect(input).toMatchObject({
      kind: 'TARGETED',
      dueDays: 7,
      reviewerUserId: 'sofia',
      engagementId: 'eng-ana',
    });
  });

  it('si el vínculo ya no está suspendido al aprobar: 409 FOUR_EYES_PAYLOAD_INVALID', async () => {
    const t = build();
    await expect(
      t.service.executeReactivation(
        t.em,
        TENANT,
        { engagementId: 'eng-ana', suspensionReason: 'MANUAL' },
        'admin-1',
        'gonzalo',
        NOW,
      ),
    ).rejects.toMatchObject({ reason: Reason.FOUR_EYES_PAYLOAD_INVALID });
  });
});
