import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeAccreditationsService } from './practice-accreditations.service';
import { PRAC } from '../practice.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = { findById: mockFn() };
  const sitesRepo = { findById: mockFn() };
  const accreditationsRepo = { findById: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PracticeAccreditationsService(
    em as any,
    practicesRepo as any,
    sitesRepo as any,
    accreditationsRepo,
    logger as any,
  );
  return { service, tx, practicesRepo, sitesRepo, accreditationsRepo };
}

describe('PracticeAccreditationsService', () => {
  describe('create (UC-14-02)', () => {
    it('throws when the practice is missing', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.create('p1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a site that does not belong to the practice', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({ id: 'p1' });
      d.sitesRepo.findById.mockResolvedValue({ id: 's1', practiceId: 'other' });
      await expect(
        d.service.create('p1', { practiceSiteId: 's1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates a PENDING accreditation', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({ id: 'p1' });
      const created = {
        id: 'a1',
        practiceId: 'p1',
        verificationStatusConceptId: PRAC.ACCRED_PENDING,
        createdAt: new Date(),
      };
      d.accreditationsRepo.create.mockReturnValue(created);
      const res = await d.service.create('p1', {}, actor);
      expect(res.verificationStatus).toBe(PRAC.ACCRED_PENDING);
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('verify (UC-14-03)', () => {
    it('throws when the accreditation is missing', async () => {
      const d = build();
      d.accreditationsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.verify('a1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects verifying an accreditation that is not pending', async () => {
      const d = build();
      d.accreditationsRepo.findById.mockResolvedValue({
        id: 'a1',
        verificationStatusConceptId: PRAC.ACCRED_VERIFIED,
        updatedAt: new Date(),
      });
      await expect(
        d.service.verify('a1', { decision: 'VERIFIED' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('transitions PENDING -> VERIFIED', async () => {
      const d = build();
      const acc = {
        id: 'a1',
        practiceId: 'p1',
        verificationStatusConceptId: PRAC.ACCRED_PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      d.accreditationsRepo.findById.mockResolvedValue(acc);
      const res = await d.service.verify(
        'a1',
        { decision: 'VERIFIED' } as any,
        actor,
      );
      expect(res.verificationStatus).toBe(PRAC.ACCRED_VERIFIED);
      expect(acc.verificationStatusConceptId).toBe(PRAC.ACCRED_VERIFIED);
    });

    it('expires an accreditation on EXPIRED decision', async () => {
      const d = build();
      const acc = {
        id: 'a1',
        practiceId: 'p1',
        verificationStatusConceptId: PRAC.ACCRED_VERIFIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      d.accreditationsRepo.findById.mockResolvedValue(acc);
      const res = await d.service.verify(
        'a1',
        { decision: 'EXPIRED' } as any,
        actor,
      );
      expect(res.verificationStatus).toBe(PRAC.ACCRED_EXPIRED);
    });
  });
});
