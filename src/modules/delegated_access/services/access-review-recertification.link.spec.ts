import { jest } from '@jest/globals';
import { RecertificationReviewLink } from './access-review-recertification.link';
import { SupportEngagementsService } from './support-engagements.service';
import { DelegationScopeService } from './delegation-scope.service';
import { namesRepoDouble } from './support-names.testing';
import { STATUS } from './concept-maps';
import { DELEG } from '../delegated_access.concepts';
import { DIR } from '../../directory/directory.concepts';
import { runWithTenant } from '../../../common';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-03T14:30:00Z');
const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('RecertificationReviewLink (K-04)', () => {
  const pendingItem = () => ({
    id: 'it-1',
    organizationUserAssignmentId: 'eng-1',
    decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
  });

  it('fija last_certified_at y cierra como CERTIFIED el ítem de vínculo abierto', async () => {
    const item = pendingItem();
    const tx: any = { find: mockFn().mockResolvedValue([item]) };
    const assignment: any = { id: 'eng-1' };
    const closed = await new RecertificationReviewLink().onRecertified(
      tx,
      assignment,
      'admin-1',
      NOW,
    );
    expect(closed).toBe(1);
    expect(assignment.lastCertifiedAt).toEqual(NOW);
    expect(item).toMatchObject({
      decisionConceptId: DELEG.REVIEW_ITEM_CERTIFIED,
      decidedAt: NOW,
      decidedByUserId: 'admin-1',
    });
    // Solo ítems de VÍNCULO (sin concesión) y pendientes de ese vínculo.
    expect(tx.find).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organizationUserAssignmentId: 'eng-1',
        supportScopeGrantId: null,
        decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
      }),
    );
  });

  it('sin ítem abierto solo fija la fecha (la recertificación de siempre no cambia)', async () => {
    const tx: any = { find: mockFn().mockResolvedValue([]) };
    const assignment: any = { id: 'eng-1' };
    expect(
      await new RecertificationReviewLink().onRecertified(
        tx,
        assignment,
        undefined,
        NOW,
      ),
    ).toBe(0);
    expect(assignment.lastCertifiedAt).toEqual(NOW);
  });
});

describe('SupportEngagementsService.recertify con el enlace de campañas', () => {
  function build(link?: any) {
    const assignment: any = {
      id: 'eng-1',
      statusConceptId: STATUS.ACTIVE,
      recertifyEveryMonths: 12,
      nextRecertificationAt: new Date('2026-11-23T14:30:00Z'),
      roleTemplateId: 'tpl',
      tenantMembershipId: 'mem-1',
    };
    const record = {
      assignment,
      tenantId: TENANT,
      userId: 'user-ana',
      membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
    };
    const tx = { flush: mockFn().mockResolvedValue(undefined) };
    const em = {
      transactional: mockFn((cb: any) => cb(tx)),
      fork: mockFn().mockReturnValue(tx),
    };
    const effective = { refreshTenant: mockFn().mockResolvedValue({}) };
    const service = new SupportEngagementsService(
      em as any,
      { findEngagements: mockFn().mockResolvedValue([record]) } as any,
      {
        findDelegations: mockFn().mockResolvedValue([]),
        syncSupportMembership: mockFn(),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      effective as any,
      new DelegationScopeService({} as any, {} as any, {} as any, {} as any),
      { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
      namesRepoDouble(mockFn) as any,
      link,
    );
    return { service, assignment, tx };
  }

  it('la ruta antigua llama al enlace dentro de la misma transacción, después de renovar', async () => {
    const link = { onRecertified: mockFn().mockResolvedValue(1) };
    const d = build(link);
    await runWithTenant(TENANT, () =>
      d.service.recertify('eng-1', { recertifyEveryMonths: 6 }, ADMIN),
    );
    expect(d.assignment.recertifyEveryMonths).toBe(6);
    expect(link.onRecertified).toHaveBeenCalledWith(
      d.tx,
      d.assignment,
      'admin-1',
      expect.any(Date),
    );
  });

  it('sin enlace (como antes de las campañas) recertify funciona igual', async () => {
    const d = build(undefined);
    await expect(
      runWithTenant(TENANT, () => d.service.recertify('eng-1', {}, ADMIN)),
    ).resolves.toEqual({ ok: true });
    expect(d.assignment.nextRecertificationAt.getTime()).toBeGreaterThan(
      Date.now(),
    );
  });
});
