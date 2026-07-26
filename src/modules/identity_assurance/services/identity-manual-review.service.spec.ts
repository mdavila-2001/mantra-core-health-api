import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityManualReviewService } from './identity-manual-review.service';
import { PreconditionFailedException } from '../../../common';
import { IDA } from '../identity_assurance.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const reviewRepo = { findById: mockFn() };
  const casesRepo = { findById: mockFn() };
  const fraudRepo = { resolveOpenForCase: mockFn().mockResolvedValue(0) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IdentityManualReviewService(
    em as any,
    reviewRepo as any,
    casesRepo as any,
    fraudRepo as any,
    logger as any,
  );
  return { service, tx, reviewRepo, casesRepo, fraudRepo };
}

describe('IdentityManualReviewService', () => {
  it('approves the review, verifies the case and closes fraud signals (UC-27-09)', async () => {
    const d = build();
    const review: any = { id: 'rv1', identityVerificationCaseId: 'k1', statusConceptId: IDA.REVIEW_OPEN, assignedToUserId: 'admin-1', updatedAt: new Date() };
    const kase: any = { id: 'k1', statusConceptId: IDA.CASE_MANUAL_REVIEW, updatedAt: new Date() };
    d.reviewRepo.findById.mockResolvedValue(review);
    d.casesRepo.findById.mockResolvedValue(kase);
    const res = await d.service.decide('rv1', { decision: 'APPROVED' } as any, actor);
    expect(res.caseStatus).toBe(IDA.CASE_VERIFIED);
    expect(review.statusConceptId).toBe(IDA.REVIEW_DECIDED);
    expect(d.fraudRepo.resolveOpenForCase).toHaveBeenCalledWith(d.tx, 'k1', IDA.FRAUD_OPEN, IDA.FRAUD_RESOLVED);
  });

  it('rejects deciding a review assigned to another reviewer', async () => {
    const d = build();
    d.reviewRepo.findById.mockResolvedValue({ id: 'rv1', identityVerificationCaseId: 'k1', statusConceptId: IDA.REVIEW_OPEN, assignedToUserId: 'someone-else' });
    await expect(
      d.service.decide('rv1', { decision: 'APPROVED' } as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
