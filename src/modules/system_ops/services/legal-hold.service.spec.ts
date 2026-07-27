import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { LegalHoldService } from './legal-hold.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = { findActive: mockFn(), create: mockFn(), findById: mockFn() };
  const governanceRepo = { recordChange: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new LegalHoldService(
    em as any,
    repo,
    governanceRepo as any,
    logger as any,
  );
  return { service, repo };
}

describe('LegalHoldService (UC-11-08)', () => {
  describe('place', () => {
    it('rejects a duplicate active hold', async () => {
      const d = build();
      d.repo.findActive.mockResolvedValue({ id: 'h1' });
      await expect(
        d.service.place(
          {
            tenantId: 't',
            targetTypeConceptId: 'tt',
            targetId: 'x',
            reasonConceptId: 'r',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('places the hold', async () => {
      const d = build();
      d.repo.findActive.mockResolvedValue(null);
      d.repo.create.mockReturnValue({ id: 'h2' });
      const res = await d.service.place(
        {
          tenantId: 't',
          targetTypeConceptId: 'tt',
          targetId: 'x',
          reasonConceptId: 'r',
        },
        actor,
      );
      expect(res).toEqual({ id: 'h2' });
    });
  });

  describe('release', () => {
    it('throws when the hold is missing', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(null);
      await expect(
        d.service.release('h1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects releasing a non-active hold', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue({
        id: 'h1',
        statusConceptId: CONCEPTS.STATE_REVOKED,
      });
      await expect(
        d.service.release('h1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('releases an active hold', async () => {
      const d = build();
      const hold: any = {
        id: 'h1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      d.repo.findById.mockResolvedValue(hold);
      const res = await d.service.release('h1', { reason: 'x' }, actor);
      expect(res).toEqual({ ok: true });
      expect(hold.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });
  });
});
