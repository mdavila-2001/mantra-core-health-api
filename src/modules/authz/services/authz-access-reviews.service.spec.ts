import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { SecurityEvents, Users } from '../../iam/entities';
import { AUTHZ_GOVERNANCE } from '../authz-governance.concepts';
import { AuthzGovernanceErrorReason as Reason } from '../authz-governance.error-reasons';
import { UserRoleAssignments } from '../entities';
import { AuthzAccessReviewsService } from './authz-access-reviews.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const ACTOR = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function armar(opts: { user?: boolean; matching?: number } = {}) {
  const tx: any = {
    findOne: mockFn(async (e: unknown) => (e === Users && opts.user !== false ? { id: 'u-1' } : null)),
    count: mockFn(async () => opts.matching ?? 0),
    create: mockFn((_e: unknown, d: any) => ({ id: 'ev-1', ...d })),
    flush: mockFn(async () => undefined),
  };
  const em: any = { ...tx, transactional: mockFn((cb: any) => cb(tx)) };
  return { service: new AuthzAccessReviewsService(em), tx };
}

describe('AuthzAccessReviewsService', () => {
  it('registra quién revisó, qué asignaciones, la decisión y el motivo', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    const { service, tx } = armar({ matching: 1 });
    const r = await service.record(
      'u-1',
      { decision: 'CERTIFIED', reason: 'Sus roles siguen vigentes', assignmentIds: [id, id] },
      ACTOR,
    );
    expect(r).toMatchObject({ decision: 'CERTIFIED', reviewerUserId: 'admin-1', assignmentIds: [id] });
    expect(tx.count).toHaveBeenCalledWith(UserRoleAssignments, {
      id: { $in: [id] },
      userId: 'u-1',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    expect(tx.create).toHaveBeenCalledWith(
      SecurityEvents,
      expect.objectContaining({ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_ACCESS_REVIEWED }),
      { partial: true },
    );
  });

  it('nadie revisa sus propios accesos', async () => {
    const { service, tx } = armar();
    await expect(
      service.record('admin-1', { decision: 'CERTIFIED', reason: 'Yo me apruebo', assignmentIds: [] }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.ACCESS_REVIEW_SELF_REVIEW });
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('una asignación ajena o ya revocada rechaza la revisión entera', async () => {
    const { service, tx } = armar({ matching: 0 });
    await expect(
      service.record(
        'u-1',
        { decision: 'CERTIFIED', reason: 'Citó una asignación ajena', assignmentIds: ['00000000-0000-4000-8000-000000000002'] },
        ACTOR,
      ),
    ).rejects.toMatchObject({ reason: Reason.ACCESS_REVIEW_ASSIGNMENT_MISMATCH });
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('un usuario inexistente es 404', async () => {
    const { service } = armar({ user: false });
    await expect(
      service.record('u-1', { decision: 'CERTIFIED', reason: 'No existe ese usuario', assignmentIds: [] }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.ACCESS_REVIEW_USER_NOT_FOUND });
  });
});
