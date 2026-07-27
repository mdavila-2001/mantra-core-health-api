import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzClinicalService } from './authz-clinical.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'clin-1', roles: ['CLINICAL'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const grantsRepo = {
    findActive: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const btgRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthzClinicalService(
    em as any,
    grantsRepo as any,
    btgRepo,
    logger as any,
  );
  return { service, tx, grantsRepo, btgRepo };
}

const future = new Date(Date.now() + 3_600_000);

describe('AuthzClinicalService', () => {
  describe('grantClinicalAccess (UC-06-06)', () => {
    it('grants clinical access for direct treatment without consent', async () => {
      const d = build();
      d.grantsRepo.findActive.mockResolvedValue(null);
      d.grantsRepo.create.mockReturnValue({
        id: 'cag-1',
        createdAt: new Date(),
      });
      const res = await d.service.grantClinicalAccess(
        'pat-1',
        {
          grantedUserId: 'u2',
          tenantId: 't1',
          purposeOfUse: 'TREATMENT',
          accessLevel: 'READ',
          validTo: future,
        } as any,
        actor,
      );
      expect(res.id).toBe('cag-1');
    });

    it('requires consent for non-treatment purposes', async () => {
      const d = build();
      await expect(
        d.service.grantClinicalAccess(
          'pat-1',
          {
            grantedUserId: 'u2',
            tenantId: 't1',
            purposeOfUse: 'PAYMENT',
            accessLevel: 'READ',
            validTo: future,
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an already active grant for the same user', async () => {
      const d = build();
      d.grantsRepo.findActive.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.grantClinicalAccess(
          'pat-1',
          {
            grantedUserId: 'u2',
            tenantId: 't1',
            purposeOfUse: 'TREATMENT',
            accessLevel: 'READ',
            validTo: future,
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a non-positive validity window', async () => {
      const d = build();
      await expect(
        d.service.grantClinicalAccess(
          'pat-1',
          {
            grantedUserId: 'u2',
            tenantId: 't1',
            purposeOfUse: 'TREATMENT',
            accessLevel: 'READ',
            validTo: new Date(Date.now() - 1000),
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('breakTheGlass (UC-06-07)', () => {
    it('creates an emergency grant and a break-glass session', async () => {
      const d = build();
      d.grantsRepo.create.mockReturnValue({
        id: 'cag-e',
        createdAt: new Date(),
      });
      const res = await d.service.breakTheGlass(
        'pat-1',
        { tenantId: 't1', justification: 'unconscious patient in ER' },
        actor,
      );
      expect(res.id).toBe('cag-e');
      expect(d.btgRepo.create).toHaveBeenCalled();
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });
  });

  describe('revokeClinicalAccess (UC-06-10)', () => {
    it('revokes an active grant', async () => {
      const d = build();
      const grant = {
        id: 'cag-1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: future,
        updatedAt: new Date(),
      };
      d.grantsRepo.findById.mockResolvedValue(grant);
      const res = await d.service.revokeClinicalAccess('cag-1', actor);
      expect(res).toEqual({ ok: true, affected: 1 });
      expect(grant.stateConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });

    it('marks it expired when validTo already passed', async () => {
      const d = build();
      const grant = {
        id: 'cag-2',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: new Date(Date.now() - 1000),
        updatedAt: new Date(),
      };
      d.grantsRepo.findById.mockResolvedValue(grant);
      await d.service.revokeClinicalAccess('cag-2', actor);
      expect(grant.stateConceptId).toBe(CONCEPTS.STATE_EXPIRED);
    });

    it('throws when the grant does not exist', async () => {
      const d = build();
      d.grantsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.revokeClinicalAccess('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects revoking a non-active grant', async () => {
      const d = build();
      d.grantsRepo.findById.mockResolvedValue({
        id: 'cag-3',
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });
      await expect(
        d.service.revokeClinicalAccess('cag-3', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
