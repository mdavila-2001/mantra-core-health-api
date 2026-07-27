import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PractitionerDelegatesService } from './practitioner-delegates.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { STATUS } from './concept-maps';

const actor = { id: 'doc-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const delegatesRepo = { findById: mockFn(), create: mockFn() };
  const orgAssignmentsRepo = { findById: mockFn() };
  const setsRepo = { findById: mockFn() };
  const grantsRepo = {
    create: mockFn(),
    revokeActiveByAssignment: mockFn().mockResolvedValue(0),
  };
  const requestsRepo = {
    cancelOpenByAssignment: mockFn().mockResolvedValue(0),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PractitionerDelegatesService(
    em as any,
    delegatesRepo as any,
    orgAssignmentsRepo as any,
    setsRepo as any,
    grantsRepo as any,
    requestsRepo as any,
    eventsRepo,
    logger as any,
  );
  return {
    service,
    tx,
    delegatesRepo,
    orgAssignmentsRepo,
    setsRepo,
    grantsRepo,
    requestsRepo,
    eventsRepo,
  };
}

const createDto = {
  practitionerRoleAssignmentId: 'pra1',
  delegateUserAssignmentId: 'org1',
  delegatedPermissionSetId: 'set1',
};

describe('PractitionerDelegatesService', () => {
  describe('createDelegate (UC-29-03)', () => {
    it('creates the delegation and records DELEGATION_CREATED', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue({
        id: 'org1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.delegatesRepo.create.mockReturnValue({
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.createDelegate(createDto, actor);
      expect(res.id).toBe('del1');
      expect(d.tx.flush).toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_DELEGATION_CREATED,
        }),
      );
    });

    it('throws when the org user assignment is missing', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createDelegate(createDto as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the permission set is not active (precondition)', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue({
        id: 'org1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        statusConceptId: STATUS.REVOKED,
      });
      await expect(
        d.service.createDelegate(createDto as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('never delegates signing clinical content', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue({
        id: 'org1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.delegatesRepo.create.mockReturnValue({
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date(),
      });
      await d.service.createDelegate(createDto, actor);
      const arg = d.delegatesRepo.create.mock.calls[0][1];
      expect(arg.maySignClinicalContent).toBe(false);
    });
  });

  describe('issueGrant (UC-29-06)', () => {
    it('rejects when the delegation is not active', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        statusConceptId: STATUS.REVOKED,
      });
      await expect(
        d.service.issueGrant(
          'del1',
          { purpose: 'TREATMENT', validTo: '2027-01-01T00:00:00Z' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('issues a grant and records GRANT_ISSUED', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.grantsRepo.create.mockReturnValue({
        id: 'g1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.issueGrant(
        'del1',
        { purpose: 'TREATMENT', validTo: '2027-01-01T00:00:00Z' } as any,
        actor,
      );
      expect(res.id).toBe('g1');
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_GRANT_ISSUED,
        }),
      );
    });
  });

  describe('revoke (UC-29-07)', () => {
    it('throws when the delegation does not exist', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.revoke('del1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('is idempotent when already revoked', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        statusConceptId: STATUS.REVOKED,
      });
      const res = await d.service.revoke('del1', {}, actor);
      expect(res).toEqual({ ok: true });
      expect(d.grantsRepo.revokeActiveByAssignment).not.toHaveBeenCalled();
    });

    it('revokes the delegation, cascades grants and cancels open requests', async () => {
      const d = build();
      const delegate = {
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
        updatedAt: new Date(),
      };
      d.delegatesRepo.findById.mockResolvedValue(delegate);
      const res = await d.service.revoke('del1', { reason: 'abuse' }, actor);
      expect(res).toEqual({ ok: true });
      expect(delegate.statusConceptId).toBe(STATUS.REVOKED);
      expect(d.grantsRepo.revokeActiveByAssignment).toHaveBeenCalled();
      expect(d.requestsRepo.cancelOpenByAssignment).toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_DELEGATION_REVOKED,
        }),
      );
    });
  });
});
