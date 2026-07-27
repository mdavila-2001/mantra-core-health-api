import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BackupService } from './backup.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    createPolicy: mockFn(),
    findPolicyById: mockFn(),
    createTestRun: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new BackupService(em as any, repo as any, logger as any);
  return { service, repo };
}

describe('BackupService', () => {
  describe('createPolicy (UC-11-09)', () => {
    it('rejects when rpo > rto', async () => {
      const d = build();
      await expect(
        d.service.createPolicy(
          { rpoSeconds: 100, rtoSeconds: 10 } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates the policy', async () => {
      const d = build();
      d.repo.createPolicy.mockReturnValue({ id: 'bp1' });
      const res = await d.service.createPolicy(
        { rpoSeconds: 10, rtoSeconds: 100 } as any,
        actor,
      );
      expect(res).toEqual({ id: 'bp1' });
    });
  });

  describe('recordRestoreTest (UC-11-10)', () => {
    it('throws when the policy is missing', async () => {
      const d = build();
      d.repo.findPolicyById.mockResolvedValue(null);
      await expect(
        d.service.recordRestoreTest(
          { backupPolicyId: 'bp1', outcomeConceptId: 'o' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('flags an objective breach when measured RPO exceeds target', async () => {
      const d = build();
      d.repo.findPolicyById.mockResolvedValue({
        id: 'bp1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        rpoSeconds: 60,
        rtoSeconds: 600,
      });
      d.repo.createTestRun.mockReturnValue({
        id: 'rt1',
        outcomeConceptId: 'o',
      });
      const res = await d.service.recordRestoreTest(
        {
          backupPolicyId: 'bp1',
          outcomeConceptId: 'o',
          measuredRpoSeconds: 120,
        },
        actor,
      );
      expect(res.objectiveBreached).toBe(true);
    });
  });
});
