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
    const service = { publishReview: mockFn() };
    const controller = new CommunityReviewsController(service as any, {
      listProfileReviews: mockFn(),
    } as any);
    const dto = { reviewerPatientProfileId: 'pp1', overallRating: 5 };
    await controller.publishReview('p1', dto, actor);
    expect(service.publishReview).toHaveBeenCalledWith('p1', dto, actor);
  });
});
