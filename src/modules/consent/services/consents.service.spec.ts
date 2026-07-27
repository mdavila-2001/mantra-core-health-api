import { jest } from '@jest/globals';

// Fábrica de mocks laxa: mantiene el 'jest' de runtime pero evita el tipado estricto Mock<never>.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ConsentsService } from './consents.service';
import { ConflictException, ResourceNotFoundException } from '../../../common';
import { CONS } from '../consent.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const consentsRepo = {
    findActiveByPurpose: mockFn(),
    findById: mockFn(),
    create: mockFn(),
    findExpirable: mockFn().mockResolvedValue([]),
  };
  const provisionsRepo = {
    findOpenByConsent: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ConsentsService(
    em as any,
    consentsRepo,
    provisionsRepo,
    eventsRepo,
    logger as any,
  );
  return { service, tx, consentsRepo, provisionsRepo, eventsRepo };
}

describe('ConsentsService', () => {
  describe('capture (UC-07-01)', () => {
    it('creates consent, flushes parent before children and records the granted event', async () => {
      const d = build();
      d.consentsRepo.findActiveByPurpose.mockResolvedValue(null);
      const created = {
        id: 'c1',
        patientProfileId: 'p1',
        statusConceptId: CONS.CONSENT_ACTIVE,
        processingPurposeId: 'pp1',
        createdAt: new Date('2026-01-01'),
      };
      d.consentsRepo.create.mockReturnValue(created);

      const res = await d.service.capture(
        {
          patientProfileId: 'p1',
          processingPurposeId: 'pp1',
          provisions: [{ action: 'PERMIT' }],
        } as any,
        actor,
      );

      expect(res).toEqual({
        id: 'c1',
        patientProfileId: 'p1',
        status: CONS.CONSENT_ACTIVE,
        processingPurposeId: 'pp1',
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.provisionsRepo.create).toHaveBeenCalledTimes(1);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONS.EVENT_GRANTED }),
      );
    });

    it('rejects when an active consent already exists for the purpose', async () => {
      const d = build();
      d.consentsRepo.findActiveByPurpose.mockResolvedValue({ id: 'existing' });

      await expect(
        d.service.capture(
          { patientProfileId: 'p1', processingPurposeId: 'pp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('withdraw (UC-07-02)', () => {
    it('throws when the consent does not exist', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.withdraw('missing', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects withdrawing a consent that is not active', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({
        id: 'c1',
        statusConceptId: CONS.CONSENT_WITHDRAWN,
      });
      await expect(
        d.service.withdraw('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('withdraws an active consent and records the withdrawn event', async () => {
      const d = build();
      const consent = {
        id: 'c1',
        statusConceptId: CONS.CONSENT_ACTIVE,
        updatedAt: new Date(),
      };
      d.consentsRepo.findById.mockResolvedValue(consent);

      const res = await d.service.withdraw(
        'c1',
        { withdrawalReasonConceptId: 'r1' },
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect(consent.statusConceptId).toBe(CONS.CONSENT_WITHDRAWN);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONS.EVENT_WITHDRAWN }),
      );
    });
  });

  describe('amendProvisions (UC-07-09)', () => {
    it('soft-closes open provisions and inserts the new ones', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({
        id: 'c1',
        statusConceptId: CONS.CONSENT_ACTIVE,
        updatedAt: new Date(),
      });
      const open = { id: 'pr-old', updatedAt: new Date() };
      d.provisionsRepo.findOpenByConsent.mockResolvedValue([open]);

      const res = await d.service.amendProvisions(
        'c1',
        { provisions: [{ action: 'DENY' }, { action: 'PERMIT' }] } as any,
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect((open as any).validTo).toBeInstanceOf(Date);
      expect(d.provisionsRepo.create).toHaveBeenCalledTimes(2);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONS.EVENT_PROVISIONS_AMENDED,
        }),
      );
    });
  });
});
