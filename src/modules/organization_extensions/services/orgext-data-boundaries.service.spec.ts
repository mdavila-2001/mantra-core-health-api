import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextDataBoundariesService } from './orgext-data-boundaries.service';
import { ORGEXT } from '../organization_extensions.concepts';
import { ConflictException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const boundariesRepo = { findActiveByTenantAndType: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OrgextDataBoundariesService(em as any, boundariesRepo as any, logger as any);
  return { service, tx, boundariesRepo };
}

const baseDto = { tenantId: 't1', dataControllerTenantId: 't1' };

describe('OrgextDataBoundariesService', () => {
  describe('define (UC-22-08)', () => {
    it('creates an active data boundary', async () => {
      const d = build();
      d.boundariesRepo.findActiveByTenantAndType.mockResolvedValue(null);
      const boundary = {
        id: 'b1',
        tenantId: 't1',
        statusConceptId: ORGEXT.BOUNDARY_ACTIVE,
        effectiveFrom: new Date(),
        createdAt: new Date(),
      };
      d.boundariesRepo.create.mockReturnValue(boundary);

      const res = await d.service.define(baseDto as any, actor);

      expect(res.status).toBe(ORGEXT.BOUNDARY_ACTIVE);
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects when an active boundary of the same type already exists (conflict)', async () => {
      const d = build();
      d.boundariesRepo.findActiveByTenantAndType.mockResolvedValue({ id: 'b0' });
      await expect(d.service.define(baseDto as any, actor)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(d.boundariesRepo.create).not.toHaveBeenCalled();
    });
  });
});
