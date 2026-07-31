import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingWaitlistService } from './scheduling-waitlist.service';
import { CONCEPTS } from '../../../common';

const SLOT_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = {};
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const bookingsRepo = {
    findSlotById: mockFn(),
    findWaitlistCandidates: mockFn(),
    findDueReminders: mockFn(),
    createWaitlistEntry: mockFn(),
    createReminder: mockFn(),
    findSlotsWithWaitlistCandidates: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SchedulingWaitlistService(
    em as any,
    bookingsRepo as any,
    logger as any,
  );
  return { service, em, tx, bookingsRepo, logger };
}

describe('SchedulingWaitlistService', () => {
  describe('findSlotsWithCandidates (UC-41-12, descubrimiento)', () => {
    it('delegates to the repository with the active waitlist status and default batch', async () => {
      const d = build();
      d.bookingsRepo.findSlotsWithWaitlistCandidates.mockResolvedValue([
        SLOT_ID,
      ]);

      const res = await d.service.findSlotsWithCandidates();

      expect(
        d.bookingsRepo.findSlotsWithWaitlistCandidates,
      ).toHaveBeenCalledWith(
        d.em,
        CONCEPTS.WAITLIST_ACTIVE,
        100,
        expect.any(Date),
      );
      expect(res).toEqual({ slotIds: [SLOT_ID] });
    });

    it('forwards a custom limit and returns an empty list when there are no candidates', async () => {
      const d = build();
      d.bookingsRepo.findSlotsWithWaitlistCandidates.mockResolvedValue([]);

      const res = await d.service.findSlotsWithCandidates(5);

      expect(
        d.bookingsRepo.findSlotsWithWaitlistCandidates,
      ).toHaveBeenCalledWith(
        d.em,
        CONCEPTS.WAITLIST_ACTIVE,
        5,
        expect.any(Date),
      );
      expect(res).toEqual({ slotIds: [] });
    });
  });
});
