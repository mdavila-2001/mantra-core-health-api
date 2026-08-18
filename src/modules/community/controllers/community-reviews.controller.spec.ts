import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityReviewsController } from './community-reviews.controller';

const actor = { id: 'u1', roles: [] } as any;

describe('CommunityReviewsController', () => {
  it('delegates publishReview (UC-19-11)', async () => {
    const service = { publishReview: mockFn(), respondToReview: mockFn() };
    const controller = new CommunityReviewsController(
      service as any,
      {
        listProfileReviews: mockFn(),
      } as any,
    );
    const dto = { overallRating: 5, verifiedEncounterId: 'enc-1' };
    await controller.publishReview('p1', dto, actor);
    expect(service.publishReview).toHaveBeenCalledWith('p1', dto, actor);
  });

  it('delegates respondToReview', async () => {
    const service = { publishReview: mockFn(), respondToReview: mockFn() };
    const controller = new CommunityReviewsController(
      service as any,
      { listProfileReviews: mockFn() } as any,
    );
    const dto = { responseText: 'Gracias.' };
    await controller.respondToReview('p1', 'rev1', dto as any, actor);
    expect(service.respondToReview).toHaveBeenCalledWith(
      'p1',
      'rev1',
      dto,
      actor,
    );
  });
});
