import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AccessRequestsService } from './access-requests.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { STATUS } from './concept-maps';

const actor = { id: 'approver-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const requestsRepo = {
    findById: mockFn(),
    findOpenDuplicate: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const delegatesRepo = { findById: mockFn() };
  const grantsRepo = { create: mockFn() };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AccessRequestsService(
    em as any,
    requestsRepo as any,
    delegatesRepo as any,
    grantsRepo as any,
    eventsRepo,
    logger as any,
  );
  return { service, tx, requestsRepo, delegatesRepo, grantsRepo, eventsRepo };
}

describe('AccessRequestsService', () => {
  describe('requestAccess (UC-29-04)', () => {
    it('opens a request and records ACCESS_REQUESTED', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.requestsRepo.create.mockReturnValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        createdAt: new Date(),
      });
      const res = await d.service.requestAccess(
        'del1',
        { requestedPermissionId: 'p1' },
        actor,
      );
      expect(res.id).toBe('r1');
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_ACCESS_REQUESTED,
        }),
      );
    });

    it('rejects when the delegation is not active (precondition)', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        statusConceptId: STATUS.REVOKED,
      });
      await expect(
        d.service.requestAccess(
          'del1',
          { requestedPermissionId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate pending request (conflict)', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.requestsRepo.findOpenDuplicate.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.requestAccess(
          'del1',
          { requestedPermissionId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('decide (UC-29-05)', () => {
    it('throws when the request does not exist', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.decide('r1', { decision: 'APPROVED' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects deciding a request that is not open (precondition)', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_CLOSED,
      });
      await expect(
        d.service.decide('r1', { decision: 'APPROVED' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('approves and emits a scoped grant', async () => {
      const d = build();
      const request: any = {
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
        patientProfileId: 'pat1',
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      d.grantsRepo.create.mockReturnValue({ id: 'g1' });
      const res = await d.service.decide(
        'r1',
        { decision: 'APPROVED' } as any,
        actor,
      );
      expect(request.statusConceptId).toBe(DELEG.REQUEST_CLOSED);
      expect(request.decisionConceptId).toBe(DELEG.DECISION_APPROVED);
      expect(res).toEqual({
        requestId: 'r1',
        decision: 'APPROVED',
        grantId: 'g1',
      });
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_ACCESS_APPROVED,
        }),
      );
    });

    it('denies without emitting a grant', async () => {
      const d = build();
      const request = {
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.decide(
        'r1',
        { decision: 'DENIED' } as any,
        actor,
      );
      expect(res).toEqual({
        requestId: 'r1',
        decision: 'DENIED',
        grantId: undefined,
      });
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_ACCESS_DENIED,
        }),
      );
    });
  });
});
