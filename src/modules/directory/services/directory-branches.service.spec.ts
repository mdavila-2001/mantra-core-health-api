import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DirectoryBranchesService } from './directory-branches.service';
import { DIR } from '../directory.concepts';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const branchesRepo = { findByTenantAndCode: mockFn(), create: mockFn() };
  const tenantsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DirectoryBranchesService(
    em as any,
    branchesRepo as any,
    tenantsRepo as any,
    logger as any,
  );
  return { service, tx, branchesRepo, tenantsRepo };
}

describe('DirectoryBranchesService', () => {
  describe('create (UC-04-04)', () => {
    it('throws when the tenant does not exist', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.create('t1', { code: 'B', name: 'Main' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the tenant is not active (precondition)', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: DIR.TENANT_PENDING,
      });
      await expect(
        d.service.create('t1', { code: 'B', name: 'Main' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated code within the tenant (conflict)', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
      });
      d.branchesRepo.findByTenantAndCode.mockResolvedValue({ id: 'b0' });
      await expect(
        d.service.create('t1', { code: 'B', name: 'Main' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates an active branch and converts lat/long to strings', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
      });
      d.branchesRepo.findByTenantAndCode.mockResolvedValue(null);
      const branch = {
        id: 'b1',
        tenantId: 't1',
        code: 'B',
        name: 'Main',
        statusConceptId: DIR.BRANCH_ACTIVE,
        createdAt: new Date(),
      };
      d.branchesRepo.create.mockReturnValue(branch);

      const res = await d.service.create(
        't1',
        { code: 'B', name: 'Main', latitude: -12.05, longitude: -77.04 },
        actor,
      );

      expect(res.id).toBe('b1');
      expect(d.branchesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          latitude: '-12.05',
          longitude: '-77.04',
          statusConceptId: DIR.BRANCH_ACTIVE,
        }),
      );
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });
  });
});
