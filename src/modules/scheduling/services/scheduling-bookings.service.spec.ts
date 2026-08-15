import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ForbiddenException } from '@nestjs/common';

import { SchedulingBookingsService } from './scheduling-bookings.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { SCHED } from '../scheduling.concepts';
import { CLIN } from '../../clinical/clinical.concepts';

const actor = { id: 'user-1', roles: ['SCHEDULING_AGENT'] };
const SLOT_ID = '11111111-1111-1111-1111-111111111111';
const PATIENT = '22222222-2222-2222-2222-222222222222';

/**
 * Un motivo válido cualquiera (corrección #14).
 *
 * Cancelar y reprogramar lo exigen, así que todas las llamadas de estas pruebas
 * lo llevan: sin él el caso que se quiere probar ni siquiera llega al código que
 * se está probando.
 */
const MOTIVO = 'El paciente viaja esa semana';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  // Las lecturas trabajan sobre un fork del EntityManager; el doble se devuelve
  // a sí mismo para que la prueba pueda seguir mirando las mismas llamadas.
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);
  const bookingsRepo = {
    findSlotForUpdate: mockFn(),
    findSlotById: mockFn(),
    createHold: mockFn(),
    findHoldByTokenForUpdate: mockFn(),
    findExpiredHolds: mockFn(),
    createBooking: mockFn(),
    findBookingByIdForUpdate: mockFn(),
    // Las dos lecturas (UC-41-15): el detalle y el listado.
    findBookingById: mockFn(),
    findBookings: mockFn(),
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
  // `latestBySource` es la lectura del motivo (corrección #14): por defecto no
  // hay ninguno, que es lo que pasa con una cita que nadie cambió.
  const historyRepo = {
    append: mockFn().mockResolvedValue(undefined),
    latestBySource: mockFn().mockResolvedValue(new Map()),
  };
  // La confirmación crea la cita clínica que respalda la reserva: sin este doble
  // no hay nada que enlazar en `appointment_id`.
  const appointmentsRepo = {
    create: mockFn(() => ({ id: 'appt-1' })),
    findById: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SchedulingBookingsService(
    em as any,
    bookingsRepo as any,
    catalogRepo as any,
    historyRepo as any,
    appointmentsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    bookingsRepo,
    catalogRepo,
    historyRepo,
    appointmentsRepo,
  };
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

    /**
     * P13: `clinical.appointments` era una tabla que nadie escribía, así que
     * `appointment_id` de la reserva estaba siempre vacío y el encuentro que se
     * abriera al atender nunca podía decir de qué turno venía.
     */
    it('crea la cita clínica y la enlaza a la reserva', async () => {
      const d = build();
      const slot = openSlot({ remainingCapacity: 1 });
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(activeHold());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(slot);
      d.bookingsRepo.createBooking.mockReturnValue({ id: 'booking-1' });

      await d.service.confirmBooking('token', dto, actor);

      expect(d.appointmentsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          patientProfileId: dto.patientProfileId,
          tenantId: dto.tenantId,
          startAt: slot.startAt,
        }),
      );
      expect(d.bookingsRepo.createBooking).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ appointmentId: 'appt-1' }),
      );
    });

    /**
     * El profesional de la cita sale del recurso, pero **sólo si el recurso es
     * de un profesional**: copiar el id de una sala sería una clave foránea rota
     * y un dato falso.
     */
    it('copia el profesional cuando el recurso es de uno', async () => {
      const d = build();
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(activeHold());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(openSlot());
      d.bookingsRepo.createBooking.mockReturnValue({ id: 'booking-1' });
      d.catalogRepo.findResourceById.mockResolvedValue({
        resourceRefType: 'practitioner_profiles',
        resourceRefId: 'hp-1',
      });

      await d.service.confirmBooking('token', dto, actor);

      expect(d.appointmentsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ practitionerProfileId: 'hp-1' }),
      );
    });

    it('una sala no deja profesional en la cita', async () => {
      const d = build();
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(activeHold());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(openSlot());
      d.bookingsRepo.createBooking.mockReturnValue({ id: 'booking-1' });
      d.catalogRepo.findResourceById.mockResolvedValue({
        resourceRefType: 'care_spaces',
        resourceRefId: 'sala-1',
      });

      await d.service.confirmBooking('token', dto, actor);

      expect(d.appointmentsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.not.objectContaining({ practitionerProfileId: 'sala-1' }),
      );
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
        {
          toSlotId: '44444444-4444-4444-4444-444444444444',
          reasonText: MOTIVO,
        },
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
          {
            toSlotId: '44444444-4444-4444-4444-444444444444',
            reasonText: MOTIVO,
          },
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
        { cancelledBy: 'PATIENT', reasonText: MOTIVO },
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
        { cancelledBy: 'PATIENT', reasonText: MOTIVO },
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
        { cancelledBy: 'PATIENT', reasonText: MOTIVO },
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
        { cancelledBy: 'PATIENT', reasonText: MOTIVO },
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
        { cancelledBy: 'PATIENT', reasonText: MOTIVO },
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
        { cancelledBy: 'PATIENT', isNoShow: true, reasonText: MOTIVO },
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
        d.service.cancel(
          'booking-1',
          { cancelledBy: 'PATIENT', reasonText: MOTIVO },
          actor as any,
        ),
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

  /* ==========================================================================
     Carril 06 — el paciente solicita, y todo cambio de turno se explica.
     ========================================================================== */

  describe('requestBooking — la solicitud del paciente (corrección #11)', () => {
    /** Deja el hold vivo y el slot disponible: el camino feliz de la solicitud. */
    function conHoldVivo(d: ReturnType<typeof build>) {
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue({
        id: 'hold-1',
        bookableSlotId: SLOT_ID,
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
        expiresAt: new Date(Date.now() + 60_000),
      });
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(openSlot());
      d.bookingsRepo.createBooking.mockReturnValue({ id: 'booking-1' });
    }

    const solicitud = {
      tenantId: '33333333-3333-3333-3333-333333333333',
      patientProfileId: PATIENT,
      channel: 'PORTAL' as const,
      reasonText: 'Dolor de garganta hace tres días',
    };

    it('la cita nace pendiente de aceptación, no confirmada', async () => {
      const d = build();
      conHoldVivo(d);

      const res = await d.service.requestBooking(
        'hold-token',
        solicitud,
        actor,
      );

      expect(res.statusConceptId).toBe(SCHED.BOOKING_PENDING_CONFIRMATION);
      const creada = d.bookingsRepo.createBooking.mock.calls[0][1];
      expect(creada.statusConceptId).toBe(SCHED.BOOKING_PENDING_CONFIRMATION);
      // Sin `confirmed_at`: nadie se comprometió todavía.
      expect(creada.confirmedAt).toBeUndefined();
    });

    it('la cita clínica que la respalda también nace pendiente', async () => {
      const d = build();
      conHoldVivo(d);

      await d.service.requestBooking('hold-token', solicitud, actor);

      expect(d.appointmentsRepo.create.mock.calls[0][1].statusConceptId).toBe(
        CLIN.APPOINTMENT_PENDING,
      );
    });

    it('no programa recordatorios de un turno que todavía puede rechazarse', async () => {
      const d = build();
      conHoldVivo(d);

      const res = await d.service.requestBooking(
        'hold-token',
        solicitud,
        actor,
      );

      expect(res.remindersScheduled).toBe(0);
      expect(d.bookingsRepo.createReminder).not.toHaveBeenCalled();
    });

    it('toma el cupo igual que una confirmación: el hold se consume', async () => {
      const d = build();
      conHoldVivo(d);

      await d.service.requestBooking('hold-token', solicitud, actor);

      expect(d.bookingsRepo.createBooking).toHaveBeenCalled();
    });
  });

  describe('motivo obligatorio y visible (corrección #14)', () => {
    /** Una cita vigente sobre la que se puede cancelar o reprogramar. */
    function citaVigente() {
      return {
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      };
    }

    it('cancelar sin motivo se rechaza en el servidor, no solo en el formulario', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(citaVigente());

      await expect(
        d.service.cancel('booking-1', { cancelledBy: 'PATIENT' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      // Se corta antes de tocar nada: la cita sigue viva.
      expect(d.bookingsRepo.createCancellation).not.toHaveBeenCalled();
    });

    it('un motivo de relleno tampoco pasa', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(citaVigente());

      await expect(
        d.service.cancel(
          'booking-1',
          { cancelledBy: 'PATIENT', reasonText: 'nada' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('el motivo de la cancelación queda en el historial, con quién la hizo', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(citaVigente());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(openSlot());

      await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PROVIDER', reasonText: MOTIVO },
        actor,
      );

      const [, entidad, id, datos] = d.historyRepo.append.mock.calls[0];
      expect(entidad).toBe('appointment_bookings');
      expect(id).toBe('booking-1');
      expect(datos.dataSnapshot).toMatchObject({
        reasonText: MOTIVO,
        actorKind: 'PROVIDER',
        toStateConceptId: CONCEPTS.BOOKING_CANCELLED,
      });
    });

    it('reprogramar sin motivo se rechaza antes de mover el cupo', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(citaVigente());

      await expect(
        d.service.reschedule(
          'booking-1',
          { toSlotId: '44444444-4444-4444-4444-444444444444' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.bookingsRepo.recordReschedule).not.toHaveBeenCalled();
    });

    it('el motivo de la reprogramación se registra como reprogramación, no como cambio de estado', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(citaVigente());
      d.bookingsRepo.findSlotForUpdate
        .mockResolvedValueOnce(openSlot({ id: 'slot-2', remainingCapacity: 1 }))
        .mockResolvedValueOnce(openSlot());

      await d.service.reschedule(
        'booking-1',
        {
          toSlotId: '44444444-4444-4444-4444-444444444444',
          reasonText: MOTIVO,
        },
        actor,
      );

      const datos = d.historyRepo.append.mock.calls[0][3];
      expect(datos.operationConceptId).toBe(SCHED.HISTORY_OP_RESCHEDULE);
      expect(datos.dataSnapshot).toMatchObject({ reasonText: MOTIVO });
    });
  });

  /* ==========================================================================
     Carril 07 — el profesional decide: acepta, rechaza, empieza y cierra.
     ========================================================================== */

  describe('accept / reject — la decisión del profesional (corrección #11)', () => {
    /** Una solicitud pendiente sobre la agenda del recurso `res-1`. */
    function solicitudPendiente() {
      return {
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        resourceId: 'res-1',
        appointmentId: 'appt-1',
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
      };
    }

    it('aceptar confirma la cita y sella el compromiso', async () => {
      const d = build();
      const booking = solicitudPendiente();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(booking);
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });

      const res = await d.service.accept('booking-1', {}, actor);

      expect(booking.statusConceptId).toBe(CONCEPTS.BOOKING_CONFIRMED);
      expect(res.statusConceptId).toBe(CONCEPTS.BOOKING_CONFIRMED);
      // `confirmed_at` recién existe cuando alguien se comprometió.
      expect((booking as Record<string, unknown>).confirmedAt).toBeInstanceOf(
        Date,
      );
    });

    it('al aceptar, la cita clínica deja de estar pendiente', async () => {
      const d = build();
      const cita = { id: 'appt-1', statusConceptId: CLIN.APPOINTMENT_PENDING };
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );
      d.appointmentsRepo.findById.mockResolvedValue(cita);

      await d.service.accept('booking-1', {}, actor);

      expect(cita.statusConceptId).toBe(CLIN.APPOINTMENT_BOOKED);
    });

    it('los recordatorios se programan al aceptar, no al solicitar', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
      d.bookingsRepo.findSlotById.mockResolvedValue(openSlot());

      await d.service.accept(
        'booking-1',
        { reminderOffsetsMinutes: [1440, 120] },
        actor,
      );

      expect(d.bookingsRepo.createReminder).toHaveBeenCalledTimes(2);
    });

    it('rechazar exige motivo y libera el cupo', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ remainingCapacity: 0 }),
      );

      const res = await d.service.reject(
        'booking-1',
        { reasonText: 'Esa franja quedó tomada por una cirugía' },
        actor,
      );

      expect(res.capacityReleased).toBe(true);
      const datos = d.historyRepo.append.mock.calls[0][3];
      expect(datos.dataSnapshot).toMatchObject({
        reasonText: 'Esa franja quedó tomada por una cirugía',
        actorKind: 'PROVIDER',
      });
    });

    it('rechazar sin motivo no toca la cita', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );

      await expect(
        d.service.reject('booking-1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.bookingsRepo.createCancellation).not.toHaveBeenCalled();
    });
  });

  describe('start / complete — sin esperar la fecha (corrección #15)', () => {
    /** Una cita confirmada para dentro de un año: el reloj no debe importar. */
    function citaConfirmadaLejana() {
      return {
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        resourceId: 'res-1',
        appointmentId: 'appt-1',
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      };
    }

    it('se inicia una confirmada aunque falte un año para el turno', async () => {
      const d = build();
      const booking = citaConfirmadaLejana();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(booking);
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });

      const res = await d.service.start('booking-1', actor);

      expect(booking.statusConceptId).toBe(SCHED.BOOKING_IN_PROGRESS);
      expect(res.statusConceptId).toBe(SCHED.BOOKING_IN_PROGRESS);
      // Nunca se mira el slot: si se mirara, sería para comparar contra el reloj.
      expect(d.bookingsRepo.findSlotForUpdate).not.toHaveBeenCalled();
    });

    it('no hace falta pasar por el mostrador: CONFIRMED → EN_CURSO es directa', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        citaConfirmadaLejana(),
      );
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });

      await expect(d.service.start('booking-1', actor)).resolves.toBeDefined();
    });

    it('completar cierra la que está en curso y la cita clínica queda cumplida', async () => {
      const d = build();
      const booking = {
        ...citaConfirmadaLejana(),
        statusConceptId: SCHED.BOOKING_IN_PROGRESS,
      };
      const cita = { id: 'appt-1', statusConceptId: CLIN.APPOINTMENT_BOOKED };
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(booking);
      d.appointmentsRepo.findById.mockResolvedValue(cita);

      const res = await d.service.complete('booking-1', actor);

      expect(booking.statusConceptId).toBe(SCHED.BOOKING_COMPLETED);
      expect(res.statusConceptId).toBe(SCHED.BOOKING_COMPLETED);
      expect(cita.statusConceptId).toBe(CLIN.APPOINTMENT_FULFILLED);
    });

    it('no se completa una que nunca empezó', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        citaConfirmadaLejana(),
      );

      await expect(
        d.service.complete('booking-1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('quién puede operar una cita', () => {
    const medico = {
      id: 'user-2',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'hp-1',
    };

    /** Una cita de la agenda del profesional `hp-1`. */
    function citaDeOtro() {
      return {
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        resourceId: 'res-9',
        appointmentId: 'appt-1',
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      };
    }

    it('un profesional no opera la cita de un colega', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(citaDeOtro());
      d.catalogRepo.findResourceById.mockResolvedValue({
        id: 'res-9',
        resourceRefType: 'practitioner_profiles',
        resourceRefId: 'hp-OTRO',
      });

      await expect(d.service.start('booking-1', medico)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('sí opera la suya', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(citaDeOtro());
      d.catalogRepo.findResourceById.mockResolvedValue({
        id: 'res-9',
        resourceRefType: 'practitioner_profiles',
        resourceRefId: 'hp-1',
      });
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });

      await expect(d.service.start('booking-1', medico)).resolves.toBeDefined();
    });

    it('quien administra la agenda opera cualquiera, sin resolver el recurso', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(citaDeOtro());
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });

      await expect(d.service.start('booking-1', actor)).resolves.toBeDefined();
      expect(d.catalogRepo.findResourceById).not.toHaveBeenCalled();
    });
  });

  describe('lectura de citas — el motivo le llega a la otra parte', () => {
    /** La cita tal como la devuelve el repositorio de lectura. */
    const guardada = {
      id: 'booking-1',
      patientProfileId: PATIENT,
      statusConceptId: CONCEPTS.BOOKING_CANCELLED,
      createdAt: new Date('2026-08-01T10:00:00Z'),
    };

    it('el detalle trae el motivo del último cambio que lo explicó', async () => {
      const d = build();
      d.bookingsRepo.findBookingById.mockResolvedValue(guardada);
      d.historyRepo.latestBySource.mockResolvedValue(
        new Map([
          [
            'booking-1',
            {
              operationConceptId: SCHED.HISTORY_OP_STATE_TRANSITION,
              recordedAt: new Date('2026-08-02T09:00:00Z'),
              dataSnapshot: {
                bookingId: 'booking-1',
                reasonText: MOTIVO,
                actorKind: 'PROVIDER',
                toStateConceptId: CONCEPTS.BOOKING_CANCELLED,
              },
            },
          ],
        ]),
      );

      const res = await d.service.getBookingById('booking-1');

      expect(res.statusReason).toEqual({
        reasonText: MOTIVO,
        actorKind: 'PROVIDER',
        toStateConceptId: CONCEPTS.BOOKING_CANCELLED,
        changedAt: new Date('2026-08-02T09:00:00Z'),
      });
    });

    it('una cita que nadie explicó no inventa motivo', async () => {
      const d = build();
      d.bookingsRepo.findBookingById.mockResolvedValue(guardada);

      const res = await d.service.getBookingById('booking-1');

      expect(res.statusReason).toBeUndefined();
    });

    it('el listado por omisión incluye las pendientes y las completadas', async () => {
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue({
        rows: [],
        fetchCapReached: false,
      });

      await d.service.searchBookings(
        { patientProfileId: PATIENT, includeCancelled: false },
        50,
      );

      const estados = d.bookingsRepo.findBookings.mock.calls[0][1]
        .statusConceptIds as string[];
      // Sin esto, una solicitud recién hecha no la ve nadie y una cita cerrada
      // desaparece del listado del paciente justo cuando tiene que verla.
      expect(estados).toContain(SCHED.BOOKING_PENDING_CONFIRMATION);
      expect(estados).toContain(SCHED.BOOKING_COMPLETED);
      expect(estados).not.toContain(CONCEPTS.BOOKING_CANCELLED);
    });

    it('el motivo de la página se lee en una sola consulta', async () => {
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue({
        rows: [
          { booking: guardada, slot: null },
          { booking: { ...guardada, id: 'booking-2' }, slot: null },
        ],
        fetchCapReached: false,
      });

      await d.service.searchBookings(
        { patientProfileId: PATIENT, includeCancelled: true },
        50,
      );

      expect(d.historyRepo.latestBySource).toHaveBeenCalledTimes(1);
      expect(d.historyRepo.latestBySource.mock.calls[0][2]).toEqual([
        'booking-1',
        'booking-2',
      ]);
    });
  });

  describe('request-info / propose-schedule — lo que el centro pide antes de aceptar (C11)', () => {
    /** Una solicitud pendiente sobre la agenda del recurso `res-1`. */
    function solicitudPendiente(overrides: Record<string, unknown> = {}) {
      return {
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        resourceId: 'res-1',
        appointmentId: 'appt-1',
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        ...overrides,
      };
    }

    it('pedir la orden médica deja el mensaje y NO libera el cupo', async () => {
      const d = build();
      const booking = solicitudPendiente();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(booking);

      const res = await d.service.requestInfo(
        'booking-1',
        {
          infoRequested: 'MEDICAL_ORDER',
          reasonText: 'Traé la orden de tu médico y vení en ayunas',
        },
        actor,
      );

      expect(res.statusConceptId).toBe(SCHED.BOOKING_PENDING_CONFIRMATION);
      // El cupo no se toca: pedir un papel no le quita el horario a nadie.
      expect(d.bookingsRepo.findSlotForUpdate).not.toHaveBeenCalled();
      // Qué se pidió y por qué viajan al historial, que es de donde el portal
      // lo lee para decirle a la persona qué le falta.
      expect(d.historyRepo.append).toHaveBeenCalledWith(
        d.tx,
        'appointment_bookings',
        'booking-1',
        expect.objectContaining({
          dataSnapshot: expect.objectContaining({
            infoRequested: 'MEDICAL_ORDER',
            reasonText: 'Traé la orden de tu médico y vení en ayunas',
            actorKind: 'PROVIDER',
          }),
        }),
      );
    });

    it('pedir algo exige decir qué, con motivo escrito (corrección #14)', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );

      await expect(
        d.service.requestInfo(
          'booking-1',
          { infoRequested: 'DOCUMENTATION', reasonText: 'ok' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('no se pide nada sobre una cita ya aceptada', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente({ statusConceptId: CONCEPTS.BOOKING_CONFIRMED }),
      );

      await expect(
        d.service.requestInfo(
          'booking-1',
          {
            infoRequested: 'DOCUMENTATION',
            reasonText: 'faltaría el carnet del seguro',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('proponer otro horario mueve el cupo y la solicitud sigue pendiente', async () => {
      const d = build();
      const booking = solicitudPendiente();
      const origen = openSlot({
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_BOOKED,
      });
      const destino = openSlot({ id: 'slot-2', remainingCapacity: 3 });
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(booking);
      d.bookingsRepo.findSlotForUpdate.mockImplementation(
        (_tx: any, id: string) =>
          Promise.resolve(id === SLOT_ID ? origen : destino),
      );

      const res = await d.service.proposeSchedule(
        'booking-1',
        {
          proposedSlotId: 'slot-2',
          reasonText: 'Ese día no tenemos el equipo disponible',
        },
        actor,
      );

      // Proponer no es acordar: sigue pendiente de que la persona lo mire.
      expect(res.statusConceptId).toBe(SCHED.BOOKING_PENDING_CONFIRMATION);
      expect(res.toSlotId).toBe('slot-2');
      expect(booking.bookableSlotId).toBe('slot-2');
      expect(origen.remainingCapacity).toBe(1);
      expect(destino.remainingCapacity).toBe(2);
      expect(d.bookingsRepo.recordReschedule).toHaveBeenCalled();
    });

    it('no se propone un cupo sin lugar', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );
      d.bookingsRepo.findSlotForUpdate.mockImplementation(
        (_tx: any, id: string) =>
          Promise.resolve(
            id === SLOT_ID
              ? openSlot()
              : openSlot({ id: 'slot-2', remainingCapacity: 0 }),
          ),
      );

      await expect(
        d.service.proposeSchedule(
          'booking-1',
          { proposedSlotId: 'slot-2', reasonText: 'buscamos otro hueco' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('no se propone el mismo horario que ya tenía', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );

      await expect(
        d.service.proposeSchedule(
          'booking-1',
          { proposedSlotId: SLOT_ID, reasonText: 'no cambia nada realmente' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
