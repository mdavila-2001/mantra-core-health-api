import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityAssertionsService } from './identity-assertions.service';
import { ConflictException } from '../../../common';
import { IDA } from '../identity_assurance.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const assertionsRepo = { findById: mockFn() };
  const casesRepo = { findById: mockFn() };
  const fraudRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IdentityAssertionsService(
    em as any,
    assertionsRepo as any,
    casesRepo as any,
    fraudRepo as any,
    logger as any,
  );
  return { service, tx, assertionsRepo, casesRepo, fraudRepo };
}

describe('IdentityAssertionsService', () => {
  it('revokes a live assertion and marks the case revoked (UC-27-11)', async () => {
    const d = build();
    const assertion: any = {
      id: 'as1',
      identityVerificationCaseId: 'k1',
      revokedAt: undefined,
    };
    const kase: any = {
      id: 'k1',
      statusConceptId: IDA.CASE_ASSERTED,
      updatedAt: new Date(),
    };
    d.assertionsRepo.findById.mockResolvedValue(assertion);
    d.casesRepo.findById.mockResolvedValue(kase);
    const res = await d.service.revoke('as1', {}, actor);
    expect(res.caseStatus).toBe(IDA.CASE_REVOKED);
    expect(assertion.revokedAt).toBeInstanceOf(Date);
    expect(assertion.revocationReasonConceptId).toBe(IDA.REVOCATION_FRAUD);
  });

  it('rejects double revocation (conflict)', async () => {
    const d = build();
    d.assertionsRepo.findById.mockResolvedValue({
      id: 'as1',
      identityVerificationCaseId: 'k1',
      revokedAt: new Date(),
    });
    await expect(
      d.service.revoke('as1', {} as any, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
