import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ResidencyService } from './residency.service';
import { ConflictException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findPolicyByCode: mockFn(),
    createPolicy: mockFn(),
    createBinding: mockFn(),
    findTransferByReference: mockFn(),
    createTransfer: mockFn(),
  };
  const governanceRepo = { recordChange: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ResidencyService(
    em as any,
    repo as any,
    governanceRepo as any,
    logger as any,
  );
  return { service, repo };
}

describe('ResidencyService', () => {
  describe('createResidencyPolicy (UC-11-06)', () => {
    it('rejects a duplicate code', async () => {
      const d = build();
      d.repo.findPolicyByCode.mockResolvedValue({ id: 'r1' });
      await expect(
        d.service.createResidencyPolicy({ code: 'R' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the policy', async () => {
      const d = build();
      d.repo.findPolicyByCode.mockResolvedValue(null);
      d.repo.createPolicy.mockReturnValue({ id: 'r2' });
      const res = await d.service.createResidencyPolicy(
        { code: 'R' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'r2' });
    });
  });

  describe('createBinding (UC-11-06)', () => {
    it('creates the tenant binding', async () => {
      const d = build();
      d.repo.createBinding.mockReturnValue({ id: 'b1' });
      const res = await d.service.createBinding(
        {
          tenantId: 't',
          residencyPolicyId: 'r',
          primaryRegionConceptId: 'reg',
        },
        actor,
      );
      expect(res).toEqual({ id: 'b1' });
    });
  });

  describe('recordTransfer (UC-11-07)', () => {
    it('rejects a duplicate transfer reference (idempotency)', async () => {
      const d = build();
      d.repo.findTransferByReference.mockResolvedValue({ id: 'e1' });
      await expect(
        d.service.recordTransfer({ transferReference: 'REF' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('records the append-only transfer', async () => {
      const d = build();
      d.repo.findTransferByReference.mockResolvedValue(null);
      d.repo.createTransfer.mockReturnValue({ id: 'e2' });
      const res = await d.service.recordTransfer(
        { transferReference: 'REF' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'e2' });
    });
  });
});
