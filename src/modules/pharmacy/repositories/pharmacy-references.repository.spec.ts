import { jest } from '@jest/globals';
import { PracticeSites, Practices } from '../../practice/entities';
import { InsuranceCarriers } from '../../insurance/entities';
import { PharmacySites } from '../entities';
import { PharmacyReferencesRepository } from './pharmacy-references.repository';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('PharmacyReferencesRepository', () => {
  const repo = new PharmacyReferencesRepository();

  describe('practiceSiteBelongsToTenant', () => {
    it('es verdadero cuando la práctica de la sede es del tenant', async () => {
      const em = {
        findOne: mockFn((entity: unknown) =>
          Promise.resolve(
            entity === PracticeSites
              ? { id: 'ps1', practiceId: 'pr1' }
              : { id: 'pr1', tenantId: 't1' },
          ),
        ),
      };

      await expect(
        repo.practiceSiteBelongsToTenant(em as any, 'ps1', 't1'),
      ).resolves.toBe(true);
      expect(em.findOne).toHaveBeenCalledWith(Practices, {
        id: 'pr1',
        tenantId: 't1',
      });
    });

    it('es falso cuando la sede no existe', async () => {
      const em = { findOne: mockFn().mockResolvedValue(null) };

      await expect(
        repo.practiceSiteBelongsToTenant(em as any, 'ps1', 't1'),
      ).resolves.toBe(false);
      expect(em.findOne).toHaveBeenCalledTimes(1);
    });

    it('es falso cuando la práctica de la sede es de otro tenant', async () => {
      const em = {
        findOne: mockFn((entity: unknown) =>
          Promise.resolve(
            entity === PracticeSites ? { id: 'ps1', practiceId: 'pr1' } : null,
          ),
        ),
      };

      await expect(
        repo.practiceSiteBelongsToTenant(em as any, 'ps1', 't1'),
      ).resolves.toBe(false);
    });
  });

  describe('findPharmacySiteInPharmacy', () => {
    it('acota la búsqueda a la farmacia', async () => {
      const em = { findOne: mockFn().mockResolvedValue(null) };

      await repo.findPharmacySiteInPharmacy(em as any, 'site1', 'ph1');

      expect(em.findOne).toHaveBeenCalledWith(PharmacySites, {
        id: 'site1',
        pharmacyId: 'ph1',
      });
    });
  });

  describe('isRegisteredInsurer', () => {
    it('es verdadero sólo si hay una aseguradora registrada con ese tenant', async () => {
      const em = {
        count: mockFn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
      };

      await expect(repo.isRegisteredInsurer(em as any, 'ins1')).resolves.toBe(
        true,
      );
      await expect(repo.isRegisteredInsurer(em as any, 'ins2')).resolves.toBe(
        false,
      );
      expect(em.count).toHaveBeenCalledWith(InsuranceCarriers, {
        tenantId: 'ins1',
      });
    });
  });
});
