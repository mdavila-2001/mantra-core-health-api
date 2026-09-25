import { jest } from '@jest/globals';
import { PharmacyReadRepository } from './pharmacy-read.repository';
import { PharmacyProducts } from '../entities';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * H5 (carril Marcelo, 2026-09-25): `findActiveProducts` con `pharmacyId`.
 *
 * El punto que hay que fijar con un test, no sólo con lectura: `pharmacyId`
 * **intersecta** con las farmacias ya visibles del tenant, nunca las
 * reemplaza. Un `pharmacyId` de otro tenant o no publicado no puede colarse
 * por venir en la query — tiene que devolver vacío sin tocar la base.
 */
describe('PharmacyReadRepository.findActiveProducts', () => {
  function build() {
    const em = { find: mockFn().mockResolvedValue([]) };
    const repo = new PharmacyReadRepository();
    return { repo, em };
  }

  it('scopes the query to the single pharmacy when it is one of the visible ones', async () => {
    const d = build();
    await d.repo.findActiveProducts(
      d.em as any,
      ['ph-1', 'ph-2'],
      { pharmacyId: 'ph-1' },
      50,
    );

    expect(d.em.find).toHaveBeenCalledTimes(1);
    const [entity, where] = d.em.find.mock.calls[0] as [unknown, any];
    expect(entity).toBe(PharmacyProducts);
    expect(where.pharmacyId).toEqual({ $in: ['ph-1'] });
  });

  it('returns empty without querying when pharmacyId is not one of the visible pharmacies', async () => {
    const d = build();
    const result = await d.repo.findActiveProducts(
      d.em as any,
      ['ph-1', 'ph-2'],
      { pharmacyId: 'otro-tenant' },
      50,
    );

    expect(result).toEqual([]);
    expect(d.em.find).not.toHaveBeenCalled();
  });

  it('without pharmacyId, keeps searching across every visible pharmacy', async () => {
    const d = build();
    await d.repo.findActiveProducts(d.em as any, ['ph-1', 'ph-2'], {}, 50);

    const [, where] = d.em.find.mock.calls[0] as [unknown, any];
    expect(where.pharmacyId).toEqual({ $in: ['ph-1', 'ph-2'] });
  });
});
