import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingBookingsService } from './scheduling-bookings.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SCHEDULING_AGENT'] };
const SLOT_ID = '11111111-1111-1111-1111-111111111111';
const PATIENT = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const bookingsRepo = {
    findSlotForUpdate: mockFn(),
    findSlotById: mockFn(),
    createHold: mockFn(),
    findHoldByTokenForUpdate: mockFn(),
    findExpiredHolds: mockFn(),
    createBooking: mockFn(),
    findBookingByIdForUpdate: mockFn(),
    countActiveBookingsForPatient: mockFn(),
    recordReschedule: mockFn(),
    createCancellation: mockFn(),
    createReminder: mockFn(),
  };
  const catalogRepo = {
    findTemplateById: mockFn(),
    findPolicyById: mockFn(),
    findResourceById: mockFn(),
  };
  // C-10: la historia de transición se versiona vía el HistoryRepository de audit.
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SchedulingBookingsService(
    em as any,
    bookingsRepo as any,
    catalogRepo as any,
    historyRepo as any,
    logger as any,
  );
  return { service, tx, bookingsRepo, catalogRepo, historyRepo };
}

/**
 * Ejecuta la operación open slot.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de open slot.
 */
function openSlot(overrides: Record<string, unknown> = {}) {
  return {
    id: SLOT_ID,
    resourceId: 'res-1',
    capacity: 2,
    remainingCapacity: 2,
    statusConceptId: CONCEPTS.SLOT_OPEN,
    startAt: new Date('2026-06-01T10:00:00Z'),
    scheduleTemplateId: undefined,
    ...overrides,
  };
}

describe('SchedulingBookingsService', () => {
  describe('placeHold (UC-41-05) — anti-double-booking', () => {
    it('decrements remaining capacity and returns a single-use token', async () => {
      const d = build();
      const slot = openSlot();
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(slot);
      d.bookingsRepo.createHold.mockReturnValue({
        id: 'hold-1',
        expiresAt: new Date('2026-06-01T09:05:00Z'),
      });

      const res = await d.service.placeHold(
        SLOT_ID,
        { patientProfileId: PATIENT },
        actor,
      );

      expect(res.remainingCapacity).toBe(1);
      expect(res.holdToken).toEqual(expect.any(String));
      expect(slot.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
      // El slot se toma con bloqueo: es lo que serializa a los peticionarios.
      expect(d.bookingsRepo.findSlotForUpdate).toHaveBeenCalledWith(
        d.tx,
        SLOT_ID,
      );
    });

    it('marks the slot as held when the last seat is taken', async () => {
      const d = build();
      const slot = openSlot({ capacity: 1, remainingCapacity: 1 });
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(slot);
      d.bookingsRepo.createHold.mockReturnValue({
        id: 'hold-1',
        expiresAt: new Date(),
      });

      const res = await d.service.placeHold(SLOT_ID, {}, actor);

      expect(res.remainingCapacity).toBe(0);
      expect(slot.statusConceptId).toBe(CONCEPTS.SLOT_HELD);
    });

    it('rejects a hold when the slot has no seats left', async () => {
      const d = build();
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ remainingCapacity: 0 }),
      );

      await expect(
        d.service.placeHold(SLOT_ID, {}, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a hold on a blocked slot', async () => {
      const d = build();
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ statusConceptId: CONCEPTS.SLOT_BLOCKED }),
      );

      await expect(
        d.service.placeHold(SLOT_ID, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('enforces the per-patient active bookings limit from the policy', async () => {
      const d = build();
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ scheduleTemplateId: 'tpl-1' }),
      );
      d.catalogRepo.findTemplateById.mockResolvedValue({
        bookingPolicyId: 'pol-1',
      });
      d.catalogRepo.findPolicyById.mockResolvedValue({
        maxActivePerPatient: 2,
        holdTtlSeconds: 300,
      });
      d.bookingsRepo.countActiveBookingsForPatient.mockResolvedValue(2);

      await expect(
        d.service.placeHold(
          SLOT_ID,
          { patientProfileId: PATIENT },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when the slot does not exist', async () => {
      const d = build();
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(null);

      await expect(
        d.service.placeHold(SLOT_ID, {}, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('confirmBooking (UC-41-06)', () => {
    const dto = {
      tenantId: '33333333-3333-3333-3333-333333333333',
      patientProfileId: PATIENT,
      channel: 'PORTAL' as const,
    };

    /**
     * Ejecuta la operación active hold.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de active hold.
     */
    function activeHold(overrides: Record<string, unknown> = {}) {
      return {
        id: 'hold-1',
        bookableSlotId: SLOT_ID,
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
        expiresAt: new Date(Date.now() + 60_000),
        ...overrides,
      };
    }

    it('confirms the booking and consumes the hold', async () => {
      const d = build();
      const hold = activeHold();
      const slot = openSlot({ remainingCapacity: 1 });
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(hold);
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(slot);
      d.bookingsRepo.createBooking.mockReturnValue({ id: 'booking-1' });

      const res = await d.service.confirmBooking('token', dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.BOOKING_CONFIRMED);
      expect(hold.statusConceptId).toBe(CONCEPTS.HOLD_CONSUMED);
      expect(res.remindersScheduled).toBe(0);
    });

    it('schedules the requested reminders relative to the slot start', async () => {
      const d = build();
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(activeHold());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(openSlot());
      d.bookingsRepo.createBooking.mockReturnValue({ id: 'booking-1' });

      const res = await d.service.confirmBooking(
        'token',
        { ...dto, reminderOffsetsMinutes: [1440, 120] },
        actor,
      );

      expect(res.remindersScheduled).toBe(2);
      expect(d.bookingsRepo.createReminder).toHaveBeenCalledTimes(2);
    });

    it('freezes the cancellation policy snapshot on the booking (CAN-APT-001)', async () => {
      const d = build();
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(activeHold());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ scheduleTemplateId: 'tpl-1', resourceId: 'res-1' }),
      );
      d.catalogRepo.findTemplateById.mockResolvedValue({
        bookingPolicyId: 'pol-1',
      });
      d.catalogRepo.findPolicyById.mockResolvedValue({
        id: 'pol-1',
        rowVersion: 3,
        cancellationWindowMinutes: 120,
        noShowFeeAmount: '50.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
      });
      d.catalogRepo.findResourceById.mockResolvedValue({
        timeZone: 'America/La_Paz',
      });
      d.bookingsRepo.createBooking.mockReturnValue({ id: 'booking-1' });

      await d.service.confirmBooking('token', dto, actor);

      const arg = d.bookingsRepo.createBooking.mock.calls[0][1];
      expect(arg.bookingPolicyId).toBe('pol-1');
      expect(arg.cancellationPolicySnapshot).toMatchObject({
        policyId: 'pol-1',
        policyRowVersion: 3,
        cancellationWindowMinutes: 120,
        noShowFeeAmount: '50.00',
        timeZone: 'America/La_Paz',
      });
      expect(arg.cancellationPolicySnapshot.capturedAt).toEqual(
        expect.any(String),
      );
    });

    it('snapshots the default 24h window when there is no policy', async () => {
      const d = build();
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(activeHold());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(openSlot());
      d.bookingsRepo.createBooking.mockReturnValue({ id: 'booking-1' });

      await d.service.confirmBooking('token', dto, actor);

      const arg = d.bookingsRepo.createBooking.mock.calls[0][1];
      expect(arg.bookingPolicyId).toBeUndefined();
      expect(arg.cancellationPolicySnapshot.cancellationWindowMinutes).toBe(
        24 * 60,
      );
    });

    it('refuses an expired hold even before the worker recycles it', async () => {
      const d = build();
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(
        activeHold({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(
        d.service.confirmBooking('token', dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a hold that was already consumed', async () => {
      const d = build();
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(
        activeHold({ statusConceptId: CONCEPTS.HOLD_CONSUMED }),
      );

      await expect(
        d.service.confirmBooking('token', dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('expireHolds (UC-41-07)', () => {
    it('releases expired holds and gives the seat back to the slot', async () => {
      const d = build();
      const hold = {
        bookableSlotId: SLOT_ID,
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
      };
      const slot = openSlot({
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_HELD,
      });
      d.bookingsRepo.findExpiredHolds.mockResolvedValue([hold]);
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(slot);

      const res = await d.service.expireHolds(10);

      expect(res.processed).toBe(1);
      expect(hold.statusConceptId).toBe(CONCEPTS.HOLD_EXPIRED);
      expect(slot.remainingCapacity).toBe(1);
      expect(slot.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
    });

    it('is a no-op when there is nothing expired', async () => {
      const d = build();
      d.bookingsRepo.findExpiredHolds.mockResolvedValue([]);

      const res = await d.service.expireHolds();

      expect(res.processed).toBe(0);
    });
  });

  describe('reschedule (UC-41-08)', () => {
    it('moves the booking, releasing the origin seat and taking the target one', async () => {
      const d = build();
      const booking = {
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      };
      const target = openSlot({ id: 'slot-2', remainingCapacity: 1 });
      const origin = openSlot({
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_BOOKED,
      });
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(booking);
      d.bookingsRepo.findSlotForUpdate
        .mockResolvedValueOnce(target)
        .mockResolvedValueOnce(origin);

      const res = await d.service.reschedule(
        'booking-1',
        { toSlotId: '44444444-4444-4444-4444-444444444444' },
        actor,
      );

      expect(res.fromSlotId).toBe(SLOT_ID);
      expect(origin.remainingCapacity).toBe(1);
      expect(target.remainingCapacity).toBe(0);
      expect(d.bookingsRepo.recordReschedule).toHaveBeenCalled();
    });

    it('rejects moving to a slot with no seats', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      });
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ remainingCapacity: 0 }),
      );

      await expect(
        d.service.reschedule(
          'booking-1',
          { toSlotId: '44444444-4444-4444-4444-444444444444' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('cancel (UC-41-09) — snapshot-based window (CAN-APT-001)', () => {
    const MIN = 60_000;

    /**
     * Ejecuta la operación booking with snapshot.
     *
     * @param snapshot - Valor de snapshot requerido por la operación.
     * @returns Resultado de booking with snapshot.
     */
    function bookingWithSnapshot(
      snapshot: Record<string, unknown> | undefined,
    ) {
      return {
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        bookingPolicyId: 'pol-1',
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
        cancellationPolicySnapshot: snapshot,
      };
    }

    it('charges the frozen fee for a late cancellation, using the snapshot window', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        bookingWithSnapshot({
          cancellationWindowMinutes: 120,
          noShowFeeAmount: '50.00',
          currencyConceptId: CONCEPTS.CURRENCY_BOB,
        }),
      );
      // Inicio dentro de la ventana de 120 min → cancelación tardía.
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({
          remainingCapacity: 0,
          startAt: new Date(Date.now() + 60 * MIN),
        }),
      );

      const res = await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PATIENT' },
        actor,
      );

      expect(res.feeAmount).toBe('50.00');
      expect(res.capacityReleased).toBe(true);
      // Nunca se consulta la política actual: se usa el snapshot congelado.
      expect(d.catalogRepo.findPolicyById).not.toHaveBeenCalled();
    });

    it('does not charge for a timely cancellation outside the snapshot window', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        bookingWithSnapshot({
          cancellationWindowMinutes: 120,
          noShowFeeAmount: '50.00',
        }),
      );
      // Inicio a 5h → fuera de la ventana de 120 min → a tiempo.
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ startAt: new Date(Date.now() + 300 * MIN) }),
      );

      const res = await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PATIENT' },
        actor,
      );

      expect(res.feeAmount).toBeUndefined();
      expect(d.catalogRepo.findPolicyById).not.toHaveBeenCalled();
    });

    it('ignores a widened current policy: only the snapshot window counts', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        bookingWithSnapshot({
          cancellationWindowMinutes: 120,
          noShowFeeAmount: '50.00',
        }),
      );
      // La política actual se amplió a 48h, pero no debe usarse.
      d.catalogRepo.findPolicyById.mockResolvedValue({
        cancellationWindowMinutes: 48 * 60,
        noShowFeeAmount: '999.00',
      });
      // Inicio a 5h: dentro de 48h (política nueva) pero fuera de 120 min (snapshot).
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ startAt: new Date(Date.now() + 300 * MIN) }),
      );

      const res = await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PATIENT' },
        actor,
      );

      expect(res.feeAmount).toBeUndefined();
      expect(d.catalogRepo.findPolicyById).not.toHaveBeenCalled();
    });

    it('falls back to the default 24h window when the booking has no snapshot', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        bookingWithSnapshot(undefined),
      );
      d.catalogRepo.findPolicyById.mockResolvedValue({
        noShowFeeAmount: '50.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
      });
      // Inicio a 1h → dentro de las 24h por defecto → tardía.
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ startAt: new Date(Date.now() + 60 * MIN) }),
      );

      const res = await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PATIENT' },
        actor,
      );

      expect(res.feeAmount).toBe('50.00');
      // Sin snapshot sí se consulta la política actual (compatibilidad).
      expect(d.catalogRepo.findPolicyById).toHaveBeenCalled();
    });

    it('does not charge a no-snapshot cancellation outside the default 24h window', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        bookingWithSnapshot(undefined),
      );
      d.catalogRepo.findPolicyById.mockResolvedValue({
        noShowFeeAmount: '50.00',
      });
      // Inicio a 2 días → fuera de las 24h por defecto.
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ startAt: new Date(Date.now() + 2 * 24 * 60 * MIN) }),
      );

      const res = await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PATIENT' },
        actor,
      );

      expect(res.feeAmount).toBeUndefined();
    });

    it('charges a no-show regardless of the window', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        bookingWithSnapshot({
          cancellationWindowMinutes: 120,
          noShowFeeAmount: '50.00',
        }),
      );
      // Inicio lejano: no sería tardía, pero el no-show siempre cobra.
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ startAt: new Date(Date.now() + 300 * MIN) }),
      );

      const res = await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PATIENT', isNoShow: true },
        actor,
      );

      expect(res.feeAmount).toBe('50.00');
    });

    it('rejects cancelling an already cancelled booking', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
        id: 'booking-1',
        statusConceptId: CONCEPTS.BOOKING_CANCELLED,
      });

      await expect(
        d.service.cancel('booking-1', { cancelledBy: 'PATIENT' }, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('checkIn (UC-41-10)', () => {
    it('marks the patient as checked in', async () => {
      const d = build();
      const booking = {
        id: 'booking-1',
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      };
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(booking);

      const res = await d.service.checkIn('booking-1', actor);

      expect(booking.statusConceptId).toBe(CONCEPTS.BOOKING_CHECKED_IN);
      expect(res.checkedInAt).toEqual(expect.any(String));
    });

    it('rejects check-in for a booking that is not confirmed', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
        id: 'booking-1',
        statusConceptId: CONCEPTS.BOOKING_CANCELLED,
      });

      await expect(
        d.service.checkIn('booking-1', actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
