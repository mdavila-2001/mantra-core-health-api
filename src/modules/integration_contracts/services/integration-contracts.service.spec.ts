import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationContractsService } from './integration-contracts.service';
import { ICON } from '../integration_contracts.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const contractsRepo = {
    findById: mockFn(),
    findByCodeAndProvider: mockFn(),
    create: mockFn(),
  };
  const versionsRepo = {
    findById: mockFn(),
    maxVersionNumber: mockFn().mockResolvedValue(0),
    findActiveByContract: mockFn().mockResolvedValue(null),
    findActiveVersions: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationContractsService(
    em as any,
    contractsRepo,
    versionsRepo,
    logger as any,
  );
  return { service, tx, em, contractsRepo, versionsRepo };
}

describe('IntegrationContractsService', () => {
  describe('createContract (UC-31-01)', () => {
    it('creates a DRAFT contract and flushes the parent', async () => {
      const d = build();
      d.contractsRepo.findByCodeAndProvider.mockResolvedValue(null);
      const created = {
        id: 'c1',
        contractCode: 'C1',
        externalProviderId: 'p1',
        statusConceptId: ICON.CONTRACT_DRAFT,
        createdAt: new Date('2026-01-01'),
      };
      d.contractsRepo.create.mockReturnValue(created);

      const res = await d.service.createContract(
        { externalProviderId: 'p1', contractCode: 'C1' },
        actor,
      );

      expect(res).toEqual({
        id: 'c1',
        contractCode: 'C1',
        externalProviderId: 'p1',
        status: ICON.CONTRACT_DRAFT,
        createdAt: created.createdAt,
      });
      expect(d.contractsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: ICON.CONTRACT_DRAFT,
          capabilityConceptId: ICON.CAPABILITY_GENERIC,
          actorUserId: 'admin-1',
        }),
      );
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects a duplicate code for the provider (409)', async () => {
      const d = build();
      d.contractsRepo.findByCodeAndProvider.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        d.service.createContract(
          { externalProviderId: 'p1', contractCode: 'C1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.contractsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('publishVersion (UC-31-02)', () => {
    it('publishes version max+1 in DRAFT and touches the contract', async () => {
      const d = build();
      const contract = {
        id: 'c1',
        statusConceptId: ICON.CONTRACT_ACTIVE,
        updatedAt: new Date(),
      };
      d.contractsRepo.findById.mockResolvedValue(contract);
      d.versionsRepo.maxVersionNumber.mockResolvedValue(2);
      const version = {
        id: 'v3',
        integrationContractId: 'c1',
        versionNumber: 3,
        statusConceptId: ICON.VERSION_DRAFT,
      };
      d.versionsRepo.create.mockReturnValue(version);

      const res = await d.service.publishVersion('c1', {}, actor);

      expect(res).toMatchObject({
        id: 'v3',
        versionNumber: 3,
        status: ICON.VERSION_DRAFT,
      });
      expect(d.versionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          versionNumber: 3,
          statusConceptId: ICON.VERSION_DRAFT,
        }),
      );
    });

    it('throws not found when the contract is absent (404)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishVersion('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects publishing when the contract is RETIRED (422)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({
        id: 'c1',
        statusConceptId: ICON.CONTRACT_RETIRED,
      });
      await expect(
        d.service.publishVersion('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('activateVersion (UC-31-10)', () => {
    it('activates a DRAFT version, supersedes the prior active and promotes the contract', async () => {
      const d = build();
      const contract = {
        id: 'c1',
        statusConceptId: ICON.CONTRACT_DRAFT,
        updatedAt: new Date(),
      };
      const version = {
        id: 'v2',
        integrationContractId: 'c1',
        statusConceptId: ICON.VERSION_DRAFT,
      };
      const prior = { id: 'v1', statusConceptId: ICON.VERSION_ACTIVE };
      d.contractsRepo.findById.mockResolvedValue(contract);
      d.versionsRepo.findById.mockResolvedValue(version);
      d.versionsRepo.findActiveByContract.mockResolvedValue(prior);

      const res = await d.service.activateVersion('c1', 'v2', {}, actor);

      expect(res).toEqual({ ok: true });
      expect(version.statusConceptId).toBe(ICON.VERSION_ACTIVE);
      expect(prior.statusConceptId).toBe(ICON.VERSION_SUPERSEDED);
      expect(contract.statusConceptId).toBe(ICON.CONTRACT_ACTIVE);
    });

    it('rejects activating a non-DRAFT version (422)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({
        id: 'c1',
        statusConceptId: ICON.CONTRACT_ACTIVE,
      });
      d.versionsRepo.findById.mockResolvedValue({
        id: 'v2',
        integrationContractId: 'c1',
        statusConceptId: ICON.VERSION_ACTIVE,
      });
      await expect(
        d.service.activateVersion('c1', 'v2', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('retireContract (UC-31-11)', () => {
    it('retires the contract and supersedes its active versions', async () => {
      const d = build();
      const contract = {
        id: 'c1',
        statusConceptId: ICON.CONTRACT_ACTIVE,
        updatedAt: new Date(),
      };
      const av = { id: 'v1', statusConceptId: ICON.VERSION_ACTIVE };
      d.contractsRepo.findById.mockResolvedValue(contract);
      d.versionsRepo.findActiveVersions.mockResolvedValue([av]);

      const res = await d.service.retireContract('c1', {}, actor);

      expect(res).toEqual({ ok: true });
      expect(contract.statusConceptId).toBe(ICON.CONTRACT_RETIRED);
      expect(av.statusConceptId).toBe(ICON.VERSION_SUPERSEDED);
    });

    it('rejects retiring an already retired contract (422)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({
        id: 'c1',
        statusConceptId: ICON.CONTRACT_RETIRED,
      });
      await expect(
        d.service.retireContract('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
