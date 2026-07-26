import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextFacilityLicensesService } from './orgext-facility-licenses.service';
import { ORGEXT } from '../organization_extensions.concepts';
import { ConflictException, PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const licensesRepo = { findById: mockFn(), findByNumber: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OrgextFacilityLicensesService(em as any, licensesRepo as any, logger as any);
  return { service, tx, licensesRepo };
}

describe('OrgextFacilityLicensesService', () => {
  describe('register (UC-22-05)', () => {
    it('creates a pending license', async () => {
      const d = build();
      d.licensesRepo.findByNumber.mockResolvedValue(null);
      const license = {
        id: 'lic1',
        tenantId: 't1',
        licenseNumber: 'L-1',
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        createdAt: new Date(),
      };
      d.licensesRepo.create.mockReturnValue(license);

      const res = await d.service.register(
        { tenantId: 't1', licenseNumber: 'L-1' } as any,
        actor,
      );

      expect(res).toEqual({
        id: 'lic1',
        tenantId: 't1',
        licenseNumber: 'L-1',
        verificationStatus: ORGEXT.LICENSE_PENDING,
        createdAt: license.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects a duplicate license number (conflict)', async () => {
      const d = build();
      d.licensesRepo.findByNumber.mockResolvedValue({ id: 'lic0' });
      await expect(
        d.service.register({ tenantId: 't1', licenseNumber: 'L-1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.licensesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verify (UC-22-06)', () => {
    it('throws when the license does not exist', async () => {
      const d = build();
      d.licensesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.verify('missing', { decision: 'VERIFY' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the license is not pending', async () => {
      const d = build();
      d.licensesRepo.findById.mockResolvedValue({
        id: 'lic1',
        verificationStatusConceptId: ORGEXT.LICENSE_VERIFIED,
      });
      await expect(
        d.service.verify('lic1', { decision: 'VERIFY' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('verifies a pending license', async () => {
      const d = build();
      const license = {
        id: 'lic1',
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        updatedAt: new Date(),
      };
      d.licensesRepo.findById.mockResolvedValue(license);

      const res = await d.service.verify('lic1', { decision: 'VERIFY' } as any, actor);

      expect(res).toEqual({ ok: true, status: ORGEXT.LICENSE_VERIFIED });
      expect(license.verificationStatusConceptId).toBe(ORGEXT.LICENSE_VERIFIED);
    });

    it('rejects a pending license when the decision is REJECT', async () => {
      const d = build();
      const license = {
        id: 'lic1',
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        updatedAt: new Date(),
      };
      d.licensesRepo.findById.mockResolvedValue(license);

      const res = await d.service.verify('lic1', { decision: 'REJECT' } as any, actor);

      expect(res.status).toBe(ORGEXT.LICENSE_REJECTED);
    });
  });
});
