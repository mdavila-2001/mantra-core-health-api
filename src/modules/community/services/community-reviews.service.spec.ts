import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityReviewsService } from './community-reviews.service';
import { ConflictException, PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'u1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const profilesRepo = { findById: mockFn() };
  const reviewsRepo = { findByReviewerEncounter: mockFn(), create: mockFn(), createDimensionScore: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityReviewsService(em as any, profilesRepo as any, reviewsRepo as any, logger as any);
  return { service, tx, profilesRepo, reviewsRepo };
}

describe('CommunityReviewsService (UC-19-11)', () => {
  it('throws when the target profile does not exist', async () => {
    const d = build();
    d.profilesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.publishReview('missing', { reviewerPatientProfileId: 'pp1', overallRating: 5 } as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects when the profile does not accept reviews', async () => {
    const d = build();
    d.profilesRepo.findById.mockResolvedValue({ id: 'p1', acceptsReviews: false });
    await expect(
      d.service.publishReview('p1', { reviewerPatientProfileId: 'pp1', overallRating: 5 } as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rejects a duplicate verified review for the same encounter', async () => {
    const d = build();
    d.profilesRepo.findById.mockResolvedValue({ id: 'p1', acceptsReviews: true });
    d.reviewsRepo.findByReviewerEncounter.mockResolvedValue({ id: 'rev0' });
    await expect(
      d.service.publishReview('p1', { reviewerPatientProfileId: 'pp1', overallRating: 5, verifiedEncounterId: 'enc1' } as any, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('publishes a verified review with dimension scores', async () => {
    const d = build();
    d.profilesRepo.findById.mockResolvedValue({ id: 'p1', acceptsReviews: true });
    d.reviewsRepo.findByReviewerEncounter.mockResolvedValue(null);
    d.reviewsRepo.create.mockReturnValue({ id: 'rev1', overallRating: 4 });
    const res = await d.service.publishReview(
      'p1',
      {
        reviewerPatientProfileId: 'pp1',
        overallRating: 4,
        verifiedEncounterId: 'enc1',
        dimensions: [{ dimension: 'COMMUNICATION', score: 5 }],
      } as any,
      actor,
    );
    expect(res).toEqual({ id: 'rev1', overallRating: 4, verified: true, dimensionCount: 1 });
    expect(d.reviewsRepo.createDimensionScore).toHaveBeenCalledTimes(1);
  });
});
