import { jest } from '@jest/globals';
import { ReviewsRepository } from './reviews.repository';
import { ServiceReviews } from '../entities';
import { COMM } from '../community.concepts';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('ReviewsRepository.averageByTargets', () => {
  it('pide sólo reseñas publicadas y excluye las removidas por moderación', async () => {
    const em = { find: mockFn().mockResolvedValue([]) };

    await new ReviewsRepository().averageByTargets(
      em as any,
      ['p-1', 'p-2'],
      COMM.PUBLICATION_PUBLISHED,
    );

    expect(em.find).toHaveBeenCalledWith(
      ServiceReviews,
      {
        targetPublicProfileId: { $in: ['p-1', 'p-2'] },
        publicationStatusConceptId: COMM.PUBLICATION_PUBLISHED,
        moderationStatusConceptId: { $ne: COMM.MODERATION_REMOVED },
      },
      expect.anything(),
    );
  });

  it('promedia por perfil y omite los perfiles sin reseñas', async () => {
    const em = {
      find: mockFn().mockResolvedValue([
        { targetPublicProfileId: 'p-1', overallRating: 5 },
        { targetPublicProfileId: 'p-1', overallRating: 4 },
        { targetPublicProfileId: 'p-2', overallRating: 2 },
      ]),
    };

    const result = await new ReviewsRepository().averageByTargets(
      em as any,
      ['p-1', 'p-2', 'p-3'],
      COMM.PUBLICATION_PUBLISHED,
    );

    expect(result.get('p-1')).toEqual({ average: 4.5, count: 2 });
    expect(result.get('p-2')).toEqual({ average: 2, count: 1 });
    expect(result.has('p-3')).toBe(false);
  });

  it('sin perfiles no consulta', async () => {
    const em = { find: mockFn() };
    const result = await new ReviewsRepository().averageByTargets(
      em as any,
      [],
      COMM.PUBLICATION_PUBLISHED,
    );
    expect(result.size).toBe(0);
    expect(em.find).not.toHaveBeenCalled();
  });
});
