import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IamCredentialsService } from './iam-credentials.service';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] };

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const usersRepo = { findById: mockFn() };
  const credentialsRepo = {
    findFederated: mockFn(),
    createFederated: mockFn(),
    findByIdAndUser: mockFn(),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new IamCredentialsService(
    em as any,
    usersRepo as any,
    credentialsRepo as any,
    eventsRepo as any,
    logger as any,
  );
  return { service, tx, usersRepo, credentialsRepo, eventsRepo };
}

describe('IamCredentialsService', () => {
  describe('linkFederated (UC-01-02)', () => {
    it('links a federated credential and records the event', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
      d.credentialsRepo.findFederated.mockResolvedValue(null);
      d.credentialsRepo.createFederated.mockReturnValue({
        id: 'c1',
        methodConceptId: CONCEPTS.CRED_FEDERATED,
      });

      const res = await d.service.linkFederated(
        'u1',
        { identityProvider: 'google', externalSubject: 'sub-123' },
        actor,
      );

      expect(res).toEqual({
        id: 'c1',
        userId: 'u1',
        method: CONCEPTS.CRED_FEDERATED,
      });
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_CRED_FEDERATED_LINK,
        }),
      );
    });

    it('throws when the user does not exist', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.linkFederated(
          'u1',
          { identityProvider: 'g', externalSubject: 's' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a duplicate federated credential (conflict)', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
      d.credentialsRepo.findFederated.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.linkFederated(
          'u1',
          { identityProvider: 'g', externalSubject: 's' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.credentialsRepo.createFederated).not.toHaveBeenCalled();
    });
  });

  describe('revokeCredential (UC-01-09)', () => {
    it('revokes a credential that belongs to the user', async () => {
      const d = build();
      const cred = {
        id: 'c1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      d.credentialsRepo.findByIdAndUser.mockResolvedValue(cred);

      const res = await d.service.revokeCredential('u1', 'c1', actor);

      expect(res).toEqual({ ok: true });
      expect(cred.stateConceptId).toBe(CONCEPTS.STATE_REVOKED);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_CRED_REVOKE,
        }),
      );
    });

    it('throws when the credential is not found for the user', async () => {
      const d = build();
      d.credentialsRepo.findByIdAndUser.mockResolvedValue(null);
      await expect(
        d.service.revokeCredential('u1', 'c1', actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
