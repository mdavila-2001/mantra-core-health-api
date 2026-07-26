import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationAuthProfilesService } from './integration-auth-profiles.service';
import { ICON } from '../integration_contracts.concepts';
import { ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const contractsRepo = { findById: mockFn() };
  const authProfilesRepo = { findById: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationAuthProfilesService(
    em as any,
    contractsRepo as any,
    authProfilesRepo as any,
    logger as any,
  );
  return { service, tx, contractsRepo, authProfilesRepo };
}

describe('IntegrationAuthProfilesService', () => {
  describe('configure (UC-31-03)', () => {
    it('creates an ACTIVE auth profile without leaking secrets', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.authProfilesRepo.create.mockReturnValue({ id: 'ap1', statusConceptId: ICON.AUTH_PROFILE_ACTIVE });

      const res = await d.service.configure(
        'c1',
        { credentialSecretReference: 'secret://ref', clientIdentifier: 'cid' } as any,
        actor,
      );

      expect(res).toEqual({ id: 'ap1', integrationContractId: 'c1', status: ICON.AUTH_PROFILE_ACTIVE });
      expect(d.authProfilesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
          authProfileConceptId: ICON.AUTH_OAUTH2_CONFIDENTIAL,
        }),
      );
    });

    it('throws not found when the contract is absent (404)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.configure('c1', { credentialSecretReference: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('rotate (UC-31-11)', () => {
    it('rotates the secret reference and marks the profile ROTATED', async () => {
      const d = build();
      const profile = {
        id: 'ap1',
        integrationContractId: 'c1',
        credentialSecretReference: 'old',
        statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
        updatedAt: new Date(),
      };
      d.authProfilesRepo.findById.mockResolvedValue(profile);

      const res = await d.service.rotate('c1', 'ap1', { credentialSecretReference: 'new' } as any, actor);

      expect(res).toEqual({ ok: true });
      expect(profile.credentialSecretReference).toBe('new');
      expect(profile.statusConceptId).toBe(ICON.AUTH_PROFILE_ROTATED);
    });

    it('supports REVOKED as the target status', async () => {
      const d = build();
      const profile = {
        id: 'ap1',
        integrationContractId: 'c1',
        statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
        updatedAt: new Date(),
      };
      d.authProfilesRepo.findById.mockResolvedValue(profile);
      await d.service.rotate('c1', 'ap1', { credentialSecretReference: 'n', targetStatus: 'REVOKED' } as any, actor);
      expect(profile.statusConceptId).toBe(ICON.AUTH_PROFILE_REVOKED);
    });

    it('throws not found when the profile does not belong to the contract (404)', async () => {
      const d = build();
      d.authProfilesRepo.findById.mockResolvedValue({ id: 'ap1', integrationContractId: 'other' });
      await expect(
        d.service.rotate('c1', 'ap1', { credentialSecretReference: 'n' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
