import { jest } from '@jest/globals';
import { PharmacyProducts } from '../../../pharmacy/entities';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import { PrescriptionShareReadRepository } from './prescription-share-read.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('PrescriptionShareReadRepository', () => {
  it('matches by medication concept, only in the given pharmacies and only published products', async () => {
    const em = {
      find: mockFn(async () => [
        {
          id: 'prod-1',
          pharmacyId: 'ph-1',
          medicationConceptId: 'med-a',
          productCode: 'P-1',
          brandName: 'Marca',
          requiresPrescription: true,
          outOfStockDeclared: true,
        },
        // Sin fármaco no puede cruzar con la receta: no sale.
        { id: 'prod-2', pharmacyId: 'ph-1', productCode: 'P-2' },
      ]),
    };
    const rows =
      await new PrescriptionShareReadRepository().findActiveProductsByMedicationConcepts(
        em as any,
        ['ph-1'],
        ['med-a'],
      );

    expect(em.find).toHaveBeenCalledWith(
      PharmacyProducts,
      {
        pharmacyId: { $in: ['ph-1'] },
        medicationConceptId: { $in: ['med-a'] },
        statusConceptId: PHARM.PRODUCT_ACTIVE,
      },
      expect.anything(),
    );
    expect(rows).toEqual([
      {
        id: 'prod-1',
        pharmacyId: 'ph-1',
        medicationConceptId: 'med-a',
        productCode: 'P-1',
        brandName: 'Marca',
        genericName: null,
        strengthText: null,
        requiresPrescription: true,
        outOfStockDeclared: true,
      },
    ]);
  });

  it('does not query without pharmacies or without concepts', async () => {
    const em = { find: mockFn(async () => []) };
    const repo = new PrescriptionShareReadRepository();
    await expect(
      repo.findActiveProductsByMedicationConcepts(em as any, [], ['med-a']),
    ).resolves.toEqual([]);
    await expect(
      repo.findActiveProductsByMedicationConcepts(em as any, ['ph-1'], []),
    ).resolves.toEqual([]);
    expect(em.find).not.toHaveBeenCalled();
  });
});
