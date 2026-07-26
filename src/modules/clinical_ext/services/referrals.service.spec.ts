import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ReferralsService } from './referrals.service';
import { ConflictException, PreconditionFailedException, ResourceNotFoundException } from '../../../common';
import { CEXT } from '../clinical_ext.concepts';

const actor = { id: 'md-1', roles: ['USER'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const referralsRepo = { findById: mockFn(), findDuplicate: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ReferralsService(em as any, referralsRepo as any, logger as any);
  return { service, referralsRepo };
}

describe('ReferralsService', () => {
  describe('create (UC-18-07)', () => {
    it('emits a requested referral', async () => {
      const d = build();
      d.referralsRepo.findDuplicate.mockResolvedValue(null);
      d.referralsRepo.create.mockReturnValue({ id: 'ref1', patientProfileId: 'p1', statusConceptId: CEXT.REFERRAL_REQUESTED, createdAt: new Date() });
      const res = await d.service.create({ patientProfileId: 'p1' } as any, actor);
      expect(res.statusConceptId).toBe(CEXT.REFERRAL_REQUESTED);
    });

    it('rejects a duplicated referral (conflict)', async () => {
      const d = build();
      d.referralsRepo.findDuplicate.mockResolvedValue({ id: 'ref0' });
      await expect(
        d.service.create({ patientProfileId: 'p1', sourceEncounterId: 'e1', targetProfileId: 't1', specialtyConceptId: 's1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('respond (UC-18-08)', () => {
    it('accepts a requested referral', async () => {
      const d = build();
      const referral = { id: 'ref1', statusConceptId: CEXT.REFERRAL_REQUESTED, updatedAt: new Date() };
      d.referralsRepo.findById.mockResolvedValue(referral);
      const res = await d.service.respond('ref1', { decision: 'ACCEPT' } as any, actor);
      expect(res).toEqual({ ok: true });
      expect(referral.statusConceptId).toBe(CEXT.REFERRAL_ACCEPTED);
    });

    it('throws when the referral is missing', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue(null);
      await expect(d.service.respond('ref1', { decision: 'REJECT' } as any, actor)).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects responding to a non-requested referral (precondition)', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({ id: 'ref1', statusConceptId: CEXT.REFERRAL_ACCEPTED });
      await expect(d.service.respond('ref1', { decision: 'ACCEPT' } as any, actor)).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
