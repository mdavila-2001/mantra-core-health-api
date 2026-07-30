import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmaciesService } from './pharmacies.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { PHARM } from '../pharmacy.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const pharmaciesRepo = {
    findByTenantAndCode: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const licensesRepo = {
    create: mockFn(),
    findById: mockFn(),
    countUnverified: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PharmaciesService(
    em as any,
    pharmaciesRepo,
    licensesRepo,
    logger as any,
  );
  return { service, tx, em, pharmaciesRepo, licensesRepo };
}

describe('PharmaciesService', () => {
  describe('createPharmacy (UC-24-01)', () => {
    it('creates pharmacy, flushes parent before license, returns license id', async () => {
      const d = build();
      d.pharmaciesRepo.findByTenantAndCode.mockResolvedValue(null);
      d.pharmaciesRepo.create.mockReturnValue({
        id: 'ph1',
        code: 'PH-1',
        legalName: 'Acme Pharma',
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        createdAt: new Date('2026-01-01'),
      });
      d.licensesRepo.create.mockReturnValue({ id: 'lic1' });

      const res = await d.service.createPharmacy(
        {
          tenantId: 't1',
          code: 'PH-1',
          legalName: 'Acme Pharma',
          license: { licenseNumber: 'L-1' },
        },
        actor,
      );

      expect(res).toMatchObject({
        id: 'ph1',
        licenseId: 'lic1',
        status: PHARM.PHARMACY_DRAFT,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
      expect(d.licensesRepo.create).toHaveBeenCalled();
    });

    it('rejects a duplicated (tenant, code)', async () => {
      const d = build();
      d.pharmaciesRepo.findByTenantAndCode.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        d.service.createPharmacy(
          {
            tenantId: 't1',
            code: 'PH-1',
            legalName: 'x',
            license: { licenseNumber: 'L-1' },
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.pharmaciesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyLicense (UC-24-03)', () => {
    it('throws when the pharmacy does not exist', async () => {
      const d = build();
      d.pharmaciesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.verifyLicense('ph1', 'lic1', {}, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects verifying a license that is not pending', async () => {
      const d = build();
      d.pharmaciesRepo.findById.mockResolvedValue({ id: 'ph1' });
      d.licensesRepo.findById.mockResolvedValue({
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_VERIFIED,
      });
      await expect(
        d.service.verifyLicense('ph1', 'lic1', {}, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('verifies the license and activates the pharmacy when none remain unverified', async () => {
      const d = build();
      const pharmacy = {
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      };
      const license = {
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      };
      d.pharmaciesRepo.findById.mockResolvedValue(pharmacy);
      d.licensesRepo.findById.mockResolvedValue(license);
      d.licensesRepo.countUnverified.mockResolvedValue(0);

      const res = await d.service.verifyLicense(
        'ph1',
        'lic1',
        { approve: true },
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect(license.verificationStatusConceptId).toBe(
        PHARM.VERIFICATION_VERIFIED,
      );
      expect(pharmacy.statusConceptId).toBe(PHARM.PHARMACY_ACTIVE);
      expect(pharmacy.verificationStatusConceptId).toBe(
        PHARM.VERIFICATION_VERIFIED,
      );
    });

    it('rejects (not verified) leaves the pharmacy untouched', async () => {
      const d = build();
      const pharmacy = {
        id: 'ph1',
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
      };
      const license = {
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      };
      d.pharmaciesRepo.findById.mockResolvedValue(pharmacy);
      d.licensesRepo.findById.mockResolvedValue(license);

      const res = await d.service.verifyLicense(
        'ph1',
        'lic1',
        { approve: false },
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect(license.verificationStatusConceptId).toBe(
        PHARM.VERIFICATION_REJECTED,
      );
      expect(pharmacy.statusConceptId).toBe(PHARM.PHARMACY_DRAFT);
      expect(d.licensesRepo.countUnverified).not.toHaveBeenCalled();
    });
  });
});
