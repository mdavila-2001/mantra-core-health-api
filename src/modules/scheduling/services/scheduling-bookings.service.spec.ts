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
  // `create` devuelve el objeto tal cual: el servicio lo usa como la fila que
  // acaba de nacer, así que la prueba puede mirar exactamente lo que se guardó.
  const tx = {
    flush: mockFn(),
    create: mockFn((_clase: any, datos: any) => datos),
    persist: mockFn(),
  };
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
    // TAREA-13 punto 5: el estado de pago. Por omisión la cita no tiene
    // ninguno, que es el caso de toda cita que nadie marcó todavía.
    findPaymentStateForUpdate: mockFn().mockResolvedValue(null),
    findPaymentState: mockFn().mockResolvedValue(null),
    findPaymentStatesForBookings: mockFn().mockResolvedValue(new Map()),
    // Las dos lecturas (UC-41-15): el detalle y el listado.
    findBookingById: mockFn(),
    // TJ-2: la lectura del origen de una reprogramación. Sin filas, ninguna

    // cita se declara reprogramada — que es el caso por defecto de estas pruebas.

    latestRescheduleOrigins: mockFn().mockResolvedValue(new Map()),
    findPatientNames: mockFn().mockResolvedValue(new Map()),
    // Por omisión el paciente no tiene nada que choque: el camino feliz de
    // reservar no puede depender de configurar esta lectura en cada prueba.
    findPatientBookingsOverlapping: mockFn().mockResolvedValue([]),
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
    findOpenSlotsOfProfessionalInWindow: mockFn().mockResolvedValue([]),
    createSlot: mockFn().mockReturnValue({ id: 'slot-directo' }),
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
    // Por omisión ninguna cita declara tipología: las pruebas que la comprueban
    // devuelven el mapa a propósito.
    findTypesByIds: mockFn().mockResolvedValue(new Map()),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  // P8: las lecturas que redactan un aviso y el emisor. Por omisión la cita no
  // se describe —`null`—, así que ninguna prueba de este archivo emite nada:
  // las que sí lo comprueban devuelven un snapshot a propósito.
  const noticeRepo = {
    describeBooking: mockFn().mockResolvedValue(null),
    describeSlot: mockFn().mockResolvedValue(null),
    findResourceAccount: mockFn().mockResolvedValue(null),
    findAccountForProfile: mockFn().mockResolvedValue(null),
    findDisplayNameForProfile: mockFn().mockResolvedValue(null),
  };
  const notices = {
    emit: mockFn().mockResolvedValue({ delivered: true }),
    emitMany: mockFn().mockResolvedValue([]),
  };

  // La regla de pertenencia vive en su propio servicio y tiene specs propios;
  // por defecto no hay vínculos que mirar, que es el caso del consultorio
  // propio y el de la gran mayoría de las reservas de estas pruebas.
  const vinculos = { evaluar: mockFn(async () => 'sin-vinculos') };
  // La regla madre tiene specs propios; acá interesa QUÉ hace cada flujo con su
  // veredicto. Por defecto el rango está libre.
  const tiempoProfesional = {
    assertRangoLibre: mockFn(async () => undefined),
    compromisos: mockFn(async () => []),
  };
  const service = new SchedulingBookingsService(
    em as any,
    bookingsRepo as any,
    catalogRepo as any,
    historyRepo as any,
    appointmentsRepo as any,
    noticeRepo as any,
    notices as any,
    logger as any,
    vinculos as any,
    tiempoProfesional as any,
  );
  return {
    service,
    tx,
    vinculos,
    tiempoProfesional,
    bookingsRepo,
    catalogRepo,
    historyRepo,
    appointmentsRepo,
    noticeRepo,
    notices,
    logger,
  };
}

/**
 * Ejecuta la operación open slot.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de open slot.
 */
/**
 * Un cupo del futuro cercano.
 *
 * Es relativo a `Date.now()` y no una fecha del calendario a propósito: desde
 * que reservar el pasado es 422 (A-02), una fecha fija se pudre sola —el día
 * que el reloj la pasa, catorce pruebas ajenas al cambio se ponen rojas sin que
 * nadie haya tocado nada—. {@link cupoVencido} es su gemelo del otro lado.
 */
const EN_UNA_HORA = 60 * 60 * 1000;

function openSlot(overrides: Record<string, unknown> = {}) {
  return {
    id: SLOT_ID,
    resourceId: 'res-1',
    capacity: 2,
    remainingCapacity: 2,
    statusConceptId: CONCEPTS.SLOT_OPEN,
    startAt: new Date(Date.now() + EN_UNA_HORA),
    scheduleTemplateId: undefined,
    ...overrides,
  };
}

/** El mismo cupo, pero con el horario ya pasado. */
function cupoVencido(overrides: Record<string, unknown> = {}) {
  return openSlot({
    startAt: new Date(Date.now() - EN_UNA_HORA),
    ...overrides,
  });
}

describe('SchedulingBookingsService', () => {
  describe('placeHold (UC-41-05) — anti-double-booking', () => {
    it('decrements remaining capacity and returns a single-use token', async () => {
      const d = build();
      const slot = openSlot();
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(slot);
      d.bookingsRepo.createHold.mockReturnValue({
        id: 'hold-1',
        expiresAt: new Date(Date.now() + EN_UNA_HORA),
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

    it('A-02 · rechaza retener un cupo que ya empezó', async () => {
      // La auditoría TJ-4 lo encontró devolviendo 201 con holdToken sobre un
      // hueco de ayer: se podía reservar un turno del pasado.
      const d = build();
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(cupoVencido());

      // La frase importa: la lee un paciente, y decirle «anticipación mínima»
      // sobre un turno de la semana pasada lo manda a buscar un problema que
      // no tiene.
      await expect(
        d.service.placeHold(SLOT_ID, {}, actor as any),
      ).rejects.toThrow('Ese horario ya pasó.');
    });

    it('A-02 · el cupo del futuro se sigue pudiendo retener', async () => {
      // El contrapeso del caso anterior: el corte no puede llevarse puesto el
      // camino bueno.
      const d = build();
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(openSlot());
      d.bookingsRepo.createHold.mockReturnValue({
        id: 'hold-1',
        expiresAt: new Date(Date.now() + EN_UNA_HORA),
      });

      await expect(
        d.service.placeHold(SLOT_ID, {}, actor as any),
      ).resolves.toHaveProperty('holdToken');
    });

    it('respeta la antelación mínima de la política, no sólo el reloj', async () => {
      // `min_notice_minutes` ya existía en booking_policies y nadie lo miraba:
      // un cupo que empieza en diez minutos es futuro, pero si la política pide
      // treinta de aviso tampoco se puede pedir.
      const d = build();
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({
          startAt: new Date(Date.now() + 10 * 60 * 1000),
          scheduleTemplateId: 'tpl-1',
        }),
      );
      d.catalogRepo.findTemplateById.mockResolvedValue({
        bookingPolicyId: 'pol-1',
      });
      d.catalogRepo.findPolicyById.mockResolvedValue({
        minNoticeMinutes: 30,
        holdTtlSeconds: 300,
      });

      await expect(
        d.service.placeHold(SLOT_ID, {}, actor as any),
      ).rejects.toThrow('al menos 30 minutos de anticipación');
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

    /* -- Las reglas de choque de turnos ------------------------------------ */

    it('REGLA 1 · no deja reservar encima de un turno YA CONFIRMADO', async () => {
      // Pedirle a varios médicos la misma hora es legítimo mientras ninguno
      // haya dicho que sí. Una vez que hay uno confirmado, el paciente ya tiene
      // dónde estar: reservar otro encima es comprometerse a estar en dos
      // lugares, y el que se queda esperando es el médico.
      const d = build();
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(activeHold());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ remainingCapacity: 1 }),
      );
      d.bookingsRepo.findPatientBookingsOverlapping.mockResolvedValue([
        {
          id: 'otra-1',
          startAt: new Date(Date.now() + EN_UNA_HORA),
          endAt: new Date(Date.now() + 2 * EN_UNA_HORA),
          statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
          resourceName: 'Consultorio del Dr. Paz',
        },
      ]);

      // La frase nombra dónde tiene el otro turno: sin eso, «ya tenés un turno»
      // manda a la persona a buscarlo a mano.
      await expect(
        d.service.confirmBooking('token', dto, actor),
      ).rejects.toThrow(/Consultorio del Dr. Paz/);
    });

    it('REGLA 1 · sólo mira las confirmadas, no las que están esperando', async () => {
      const d = build();
      d.bookingsRepo.findHoldByTokenForUpdate.mockResolvedValue(activeHold());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(
        openSlot({ remainingCapacity: 1 }),
      );
      d.bookingsRepo.createBooking.mockReturnValue({ id: 'booking-1' });

      await d.service.confirmBooking('token', dto, actor);

      const estados =
        d.bookingsRepo.findPatientBookingsOverlapping.mock.calls[0][4];
      expect(estados).toContain(CONCEPTS.BOOKING_CONFIRMED);
      expect(estados).not.toContain(SCHED.BOOKING_REQUESTED);
      expect(estados).not.toContain(SCHED.BOOKING_PENDING_CONFIRMATION);
    });

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

    /* ----------------------------------------------------------------------
       AC-15-1 y AC-15-2 · la solicitud se avisa a las DOS partes
       ---------------------------------------------------------------------- */

    /** La cita como la describe el repositorio de avisos. */
    const solicitada = {
      bookingId: 'booking-1',
      tenantId: '33333333-3333-3333-3333-333333333333',
      patientProfileId: PATIENT,
      resourceId: 'res-1',
      slotId: SLOT_ID,
      startAt: new Date('2026-08-20T14:00:00.000Z'),
      resourceLabel: 'Dra. Rivas',
    };

    it('avisa al profesional que hay una solicitud que responder', async () => {
      const d = build();
      conHoldVivo(d);
      d.noticeRepo.describeBooking.mockResolvedValue(solicitada);
      d.noticeRepo.findResourceAccount.mockResolvedValue('user-medico');
      d.noticeRepo.findDisplayNameForProfile.mockResolvedValue('Ana Flores');

      await d.service.requestBooking('hold-token', solicitud, actor);

      const [avisos] = d.notices.emitMany.mock.calls[0];
      const alPro = avisos.find(
        (a: any) => a.recipient.userId === 'user-medico',
      );
      expect(alPro).toBeDefined();
      expect(alPro.payload.change).toBe('REQUESTED');
      expect(alPro.bodyText).toContain('Ana Flores');
      // La acción va en el cuerpo: avisar sin decir qué se espera es ruido.
      expect(alPro.bodyText).toMatch(/acept/i);
    });

    it('acusa recibo al paciente, y dice que todavía falta la respuesta', async () => {
      const d = build();
      conHoldVivo(d);
      d.noticeRepo.describeBooking.mockResolvedValue(solicitada);
      d.noticeRepo.findResourceAccount.mockResolvedValue('user-medico');

      await d.service.requestBooking('hold-token', solicitud, actor);

      const [avisos] = d.notices.emitMany.mock.calls[0];
      const alPaciente = avisos.find(
        (a: any) => a.recipient.patientProfileId === PATIENT,
      );
      expect(alPaciente).toBeDefined();
      expect(alPaciente.bodyText).toContain('Dra. Rivas');
      // Un acuse que se lee como confirmación manda a alguien al consultorio
      // con un turno que nadie tomó.
      expect(alPaciente.bodyText).toMatch(/falta que lo confirmen/i);
      expect(avisos).toHaveLength(2);
    });

    it('sin nombre de paciente el aviso del profesional sigue saliendo', async () => {
      const d = build();
      conHoldVivo(d);
      d.noticeRepo.describeBooking.mockResolvedValue(solicitada);
      d.noticeRepo.findResourceAccount.mockResolvedValue('user-medico');
      d.noticeRepo.findDisplayNameForProfile.mockResolvedValue(null);

      await d.service.requestBooking('hold-token', solicitud, actor);

      const [avisos] = d.notices.emitMany.mock.calls[0];
      const alPro = avisos.find(
        (a: any) => a.recipient.userId === 'user-medico',
      );
      expect(alPro.bodyText).toMatch(/^Un paciente pidió turno/);
    });

    it('una sala no tiene a quién avisarle, pero el paciente igual recibe su acuse', async () => {
      const d = build();
      conHoldVivo(d);
      d.noticeRepo.describeBooking.mockResolvedValue(solicitada);
      d.noticeRepo.findResourceAccount.mockResolvedValue(null);

      await d.service.requestBooking('hold-token', solicitud, actor);

      const [avisos] = d.notices.emitMany.mock.calls[0];
      expect(avisos).toHaveLength(1);
      expect(avisos[0].recipient).toEqual({ patientProfileId: PATIENT });
    });

    it('los dos avisos rebotan por separado: uno por destinatario', async () => {
      const d = build();
      conHoldVivo(d);
      d.noticeRepo.describeBooking.mockResolvedValue(solicitada);
      d.noticeRepo.findResourceAccount.mockResolvedValue('user-medico');

      await d.service.requestBooking('hold-token', solicitud, actor);

      const [avisos] = d.notices.emitMany.mock.calls[0];
      const claves = avisos.map((a: any) => a.debounceKey);
      expect(new Set(claves).size).toBe(2);
      expect(claves.every((k: string) => k.includes('booking-1'))).toBe(true);
    });

    it('que la cita no se describa no rompe la solicitud', async () => {
      const d = build();
      conHoldVivo(d);
      d.noticeRepo.describeBooking.mockResolvedValue(null);

      const res = await d.service.requestBooking(
        'hold-token',
        solicitud,
        actor,
      );

      expect(res.id).toBe('booking-1');
      expect(d.notices.emitMany).not.toHaveBeenCalled();
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

    /** Una solicitud del mismo paciente, con otro médico, a la misma hora. */
    function solicitudQueChoca(id = 'booking-2') {
      return {
        id,
        startAt: new Date(Date.now() + EN_UNA_HORA),
        endAt: new Date(Date.now() + 2 * EN_UNA_HORA),
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        resourceName: 'Consultorio del Dr. Paz',
      };
    }

    describe('la cita puntual — AG-2', () => {
      const medico = {
        id: 'user-med',
        roles: ['PRACTITIONER'],
        practitionerProfileId: 'hp-1',
      } as never;

      const dto = {
        patientProfileId: 'pp-ana',
        resourceId: 'res-1',
        startAt: '2026-09-10T14:00:00Z',
        durationMinutes: 180,
        reasonText: 'Cirugía de implante',
      };

      /** Deja la agenda del médico lista para asignar. */
      function listoParaAsignar(d: ReturnType<typeof build>) {
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: 'res-1',
          tenantId: 'ten-1',
          resourceRefId: 'hp-1',
          resourceRefType: 'health_practitioner_profiles',
          timeZone: 'America/La_Paz',
        });
        d.bookingsRepo.findPatientNames.mockResolvedValue(
          new Map([['pp-ana', 'Ana Quispe']]),
        );
        d.bookingsRepo.findPatientBookingsOverlapping.mockResolvedValue([]);
        d.bookingsRepo.createBooking.mockReturnValue({ id: 'bk-directa' });
        return d;
      }

      it('crea cupo único + reserva CONFIRMADA en una transacción', async () => {
        const d = listoParaAsignar(build());

        const res = await d.service.createDirectAppointment(
          dto as never,
          medico,
        );

        expect(res.bookingId).toBe('bk-directa');
        expect(res.statusConceptId).toBe(CONCEPTS.BOOKING_CONFIRMED);
        // el cupo nace ya tomado y sin plantilla: nunca estuvo ofrecido.
        const slotArgs = d.catalogRepo.createSlot.mock.calls[0][1];
        expect(slotArgs.capacity).toBe(1);
        expect(slotArgs.remainingCapacity).toBe(0);
        expect(slotArgs.scheduleTemplateId).toBeUndefined();
      });

      /**
       * La modalidad de la atención — teleconsulta.
       *
       * `clinical.appointments.channel_concept_id` existía desde el modelo y
       * estaba sin conjunto y sin usar; por eso la teleconsulta no se podía
       * declarar aunque el modelo ya la admitiera. Estas pruebas fijan las dos
       * mitades: que el valor elegido llega a la cita CLÍNICA (no a la
       * reserva, que es otro eje), y que omitirlo no inventa nada.
       */
      describe('el canal de la atención', () => {
        it('escribe la teleconsulta en la cita clínica, no en la reserva', async () => {
          const d = listoParaAsignar(build());

          await d.service.createDirectAppointment(
            { ...dto, channel: 'TELECONSULTA' } as never,
            medico,
          );

          const cita = d.appointmentsRepo.create.mock.calls[0][1];
          expect(cita.channelConceptId).toBe(
            CLIN.APPOINTMENT_CHANNEL_TELEHEALTH,
          );

          // El canal de la RESERVA es otro eje y no se contagia: la asignó
          // alguien desde el mostrador, y eso sigue siendo cierto.
          const reserva = d.bookingsRepo.createBooking.mock.calls[0][1];
          expect(reserva.bookingChannelConceptId).toBe(CONCEPTS.CHANNEL_DESK);
        });

        it('sin canal no escribe ninguno: ausente ≠ presencial explícito', async () => {
          // «Nadie lo dijo» y «dijeron que es presencial» son cosas distintas.
          // Sólo la primera puede cambiar de significado si mañana el valor por
          // defecto cambia, y por eso la columna queda en NULL.
          const d = listoParaAsignar(build());

          await d.service.createDirectAppointment(dto as never, medico);

          const cita = d.appointmentsRepo.create.mock.calls[0][1];
          expect(cita.channelConceptId).toBeUndefined();
        });

        it('la visita a domicilio también es un canal, no un tipo de cita', async () => {
          const d = listoParaAsignar(build());

          await d.service.createDirectAppointment(
            { ...dto, channel: 'DOMICILIO' } as never,
            medico,
          );

          const cita = d.appointmentsRepo.create.mock.calls[0][1];
          expect(cita.channelConceptId).toBe(
            CLIN.APPOINTMENT_CHANNEL_HOME_VISIT,
          );
          // `type_concept_id` responde otra pregunta —qué clase de atención
          // es— y no lo toca nadie acá.
          expect(cita.typeConceptId).toBeUndefined();
        });
      });

      it('la duración es libre: la cirugía de 3 horas es el caso entero', async () => {
        const d = listoParaAsignar(build());

        await d.service.createDirectAppointment(dto as never, medico);

        const slotArgs = d.catalogRepo.createSlot.mock.calls[0][1];
        const durMs = slotArgs.endAt.getTime() - slotArgs.startAt.getTime();
        expect(durMs).toBe(180 * 60_000);
      });

      it('la regla madre corre ANTES de crear nada', async () => {
        const d = listoParaAsignar(build());
        d.tiempoProfesional.assertRangoLibre.mockRejectedValue(
          new PreconditionFailedException('El profesional ya tiene a Beto…'),
        );

        await expect(
          d.service.createDirectAppointment(dto as never, medico),
        ).rejects.toThrow(/ya tiene a Beto/);
        expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
        expect(d.bookingsRepo.createBooking).not.toHaveBeenCalled();
      });

      it('el tiempo del PACIENTE también se protege', async () => {
        // La regla 1 vale igual cuando quien agenda es el doctor: el paciente
        // tampoco puede estar en dos lugares.
        const d = listoParaAsignar(build());
        d.bookingsRepo.findPatientBookingsOverlapping.mockResolvedValue([
          {
            id: 'bk-otra',
            resourceName: 'Otro consultorio',
            startAt: new Date(),
          },
        ]);

        await expect(
          d.service.createDirectAppointment(dto as never, medico),
        ).rejects.toThrow(/paciente ya tiene un turno/);
      });

      it('retira los cupos libres que pisa y lo INFORMA', async () => {
        // Decisión 8: informar, no pedir permiso.
        const d = listoParaAsignar(build());
        const libre1 = {
          statusConceptId: CONCEPTS.SLOT_OPEN,
          capacity: 1,
          remainingCapacity: 1,
        };
        const libre2 = {
          statusConceptId: CONCEPTS.SLOT_OPEN,
          capacity: 1,
          remainingCapacity: 1,
        };
        d.catalogRepo.findOpenSlotsOfProfessionalInWindow.mockResolvedValue([
          libre1,
          libre2,
        ]);

        const res = await d.service.createDirectAppointment(
          dto as never,
          medico,
        );

        expect(res.retractedSlots).toBe(2);
        expect(libre1.statusConceptId).toBe(CONCEPTS.SLOT_BLOCKED);
        expect(libre2.statusConceptId).toBe(CONCEPTS.SLOT_BLOCKED);
      });

      it('un profesional NO asigna en la agenda de otro', async () => {
        const d = listoParaAsignar(build());
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: 'res-1',
          tenantId: 'ten-1',
          resourceRefId: 'hp-OTRO',
          resourceRefType: 'health_practitioner_profiles',
        });

        await expect(
          d.service.createDirectAppointment(dto as never, medico),
        ).rejects.toThrow(/su propia agenda/);
      });

      it('un paciente que no existe rebota con 404, no crea nada', async () => {
        const d = listoParaAsignar(build());
        d.bookingsRepo.findPatientNames.mockResolvedValue(new Map());

        await expect(
          d.service.createDirectAppointment(dto as never, medico),
        ).rejects.toThrow(/Paciente no encontrado/);
        expect(d.catalogRepo.createSlot).not.toHaveBeenCalled();
      });

      it('hereda el gating del vínculo: revocado no asigna', async () => {
        const d = listoParaAsignar(build());
        d.vinculos.evaluar.mockResolvedValue('no-vigente' as never);

        await expect(
          d.service.createDirectAppointment(dto as never, medico),
        ).rejects.toThrow(/no está vigente/);
      });
    });

    describe('la regla madre — AG-1', () => {
      it('aceptar consulta el tiempo del profesional EXCLUYENDO la propia cita', async () => {
        const d = build();
        d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
          id: 'booking-1',
          bookableSlotId: SLOT_ID,
          resourceId: 'res-1',
          appointmentId: 'appt-1',
          statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        });
        d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
        d.bookingsRepo.findSlotById.mockResolvedValue(openSlot());
        d.bookingsRepo.findPatientBookingsOverlapping.mockResolvedValue([]);
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: 'res-1',
          resourceRefId: 'hp-1',
          resourceRefType: 'health_practitioner_profiles',
        });

        await d.service.accept('booking-1', {}, actor);

        const llamada = d.tiempoProfesional.assertRangoLibre.mock.calls[0];
        expect(llamada[1]).toBe('hp-1');
        // el último argumento es la propia reserva: aceptarse no es chocar
        // consigo misma.
        expect(llamada[4]).toBe('booking-1');
      });

      it('si el profesional ya está comprometido en OTRA sede, aceptar rebota', async () => {
        const d = build();
        d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
          id: 'booking-1',
          bookableSlotId: SLOT_ID,
          resourceId: 'res-1',
          statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        });
        d.bookingsRepo.findSlotById.mockResolvedValue(openSlot());
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: 'res-1',
          resourceRefId: 'hp-1',
          resourceRefType: 'health_practitioner_profiles',
        });
        d.tiempoProfesional.assertRangoLibre.mockRejectedValue(
          new PreconditionFailedException('El profesional ya tiene a Ana…'),
        );

        await expect(d.service.accept('booking-1', {}, actor)).rejects.toThrow(
          /ya tiene a Ana/,
        );
      });

      it('una sala o un equipo no pasan por la regla del profesional', async () => {
        // La regla protege a la persona; una sala puede tener dos agendas sin
        // ser un problema humano.
        const d = build();
        d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
          id: 'booking-1',
          bookableSlotId: SLOT_ID,
          resourceId: 'res-sala',
          appointmentId: 'appt-1',
          statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        });
        d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
        d.bookingsRepo.findSlotById.mockResolvedValue(openSlot());
        d.bookingsRepo.findPatientBookingsOverlapping.mockResolvedValue([]);
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: 'res-sala',
          resourceRefId: 'sala-1',
          resourceRefType: 'rooms',
        });

        await d.service.accept('booking-1', {}, actor);

        expect(d.tiempoProfesional.assertRangoLibre).not.toHaveBeenCalled();
      });
    });

    describe('vinculo vigente con la organizacion — MAC-VINCULO', () => {
      // El `actor` de este archivo es un SCHEDULING_AGENT, que opera agendas
      // ajenas por su rol y por eso saltea la regla. Acá hace falta el médico:
      // es a él a quien la organización le revoca el vínculo.
      const medico = {
        id: 'user-med',
        roles: ['PRACTITIONER'],
        practitionerProfileId: 'hp-1',
      } as never;

      /** Deja la reserva lista para aceptar y fija el veredicto del vínculo. */
      function conVeredicto(d: ReturnType<typeof build>, veredicto: string) {
        d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
          solicitudPendiente(),
        );
        d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
        d.bookingsRepo.findSlotById.mockResolvedValue(openSlot());
        d.bookingsRepo.findPatientBookingsOverlapping.mockResolvedValue([]);
        // `cargarParaOperar` exige que la agenda sea suya antes de mirar nada
        // más: el recurso apunta a su propio perfil profesional.
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: 'res-1',
          resourceRefId: 'hp-1',
          resourceRefType: 'health_practitioner_profiles',
        });
        d.vinculos.evaluar.mockResolvedValue(veredicto as never);
        return d;
      }

      it('con el vinculo revocado no acepta, y el error lo explica', async () => {
        // Publicar y aceptar ocurren en momentos distintos: el médico publicó
        // con el vínculo aprobado y la organización se lo revocó después. La
        // agenda sigue publicada y los pedidos siguen entrando.
        const d = conVeredicto(build(), 'ausente');

        await expect(d.service.accept('booking-1', {}, medico)).rejects.toThrow(
          /ya no está vigente/,
        );
      });

      it('el aviso aclara que las citas ya confirmadas siguen en pie', async () => {
        // Es la regla de borde: revocar un vínculo no cancela en bloque turnos
        // que ya se le prometieron a un paciente.
        const d = conVeredicto(build(), 'ausente');

        await expect(d.service.accept('booking-1', {}, medico)).rejects.toThrow(
          /ya confirmaste siguen/,
        );
      });

      it('el error de vinculo al aceptar es 422, no 403', async () => {
        const d = conVeredicto(build(), 'ausente');

        await expect(
          d.service.accept('booking-1', {}, medico),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
      });

      it('con el vinculo aprobado acepta con normalidad', async () => {
        const d = conVeredicto(build(), 'aprobado');

        await d.service.accept('booking-1', {}, medico);

        expect(d.bookingsRepo.findBookingByIdForUpdate).toHaveBeenCalled();
      });

      it('sin vinculos que mirar acepta: es el consultorio propio', async () => {
        const d = conVeredicto(build(), 'sin-vinculos');

        await d.service.accept('booking-1', {}, medico);

        expect(d.bookingsRepo.findBookingByIdForUpdate).toHaveBeenCalled();
      });

      it('un administrador de agenda no necesita vinculo propio', async () => {
        // Opera agendas ajenas por su rol; exigirle vínculo le quitaría lo que
        // ese rol ya le concede.
        const d = conVeredicto(build(), 'ausente');

        await d.service.accept('booking-1', {}, {
          id: 'user-root',
          roles: ['SCHEDULING_ADMIN', 'SECURITY_ADMIN'],
        } as never);

        expect(d.vinculos.evaluar).not.toHaveBeenCalled();
      });
    });

    it('REGLA 2 · aceptar una cancela las pendientes que chocan', async () => {
      // El caso que motiva la regla: el paciente pidió a tres médicos la misma
      // hora, uno le dijo que sí, y las otras dos dejaron de ser posibles. Si
      // nadie las cierra quedan esperando una respuesta que ya no importa, y
      // reteniendo cupos que otra persona podría usar.
      const d = build();
      const aceptada = solicitudPendiente();
      const otra = {
        ...solicitudQueChoca(),
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
      };
      d.bookingsRepo.findBookingByIdForUpdate
        .mockResolvedValueOnce(aceptada)
        .mockResolvedValueOnce({
          id: 'booking-2',
          bookableSlotId: 'slot-2',
          statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        });
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
      d.bookingsRepo.findSlotById.mockResolvedValue(openSlot());
      d.bookingsRepo.findPatientBookingsOverlapping.mockResolvedValue([otra]);
      const slotLiberado = openSlot({
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_HELD,
      });
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue(slotLiberado);

      const res = await d.service.accept('booking-1', {}, actor);

      expect(res.desplazadas).toEqual(['booking-2']);
      // Y el cupo que retenía vuelve a estar disponible: castigar al siguiente
      // paciente por una cita que ya no existe no tiene sentido.
      expect(slotLiberado.remainingCapacity).toBe(1);
      expect(slotLiberado.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
    });

    it('REGLA 2 · nunca toca una cita que otro médico ya confirmó', async () => {
      // Cancelar automáticamente algo ya comprometido sería decidir por el otro
      // profesional. Ese caso se resuelve hablando, no con una regla.
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
      d.bookingsRepo.findSlotById.mockResolvedValue(openSlot());

      await d.service.accept('booking-1', {}, actor);

      const estados =
        d.bookingsRepo.findPatientBookingsOverlapping.mock.calls[0][4];
      expect(estados).toContain(SCHED.BOOKING_PENDING_CONFIRMATION);
      expect(estados).toContain(SCHED.BOOKING_REQUESTED);
      expect(estados).not.toContain(CONCEPTS.BOOKING_CONFIRMED);
      expect(estados).not.toContain(CONCEPTS.BOOKING_CHECKED_IN);
    });

    it('REGLA 2 · no se compara consigo misma', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
      d.bookingsRepo.findSlotById.mockResolvedValue(openSlot());

      await d.service.accept('booking-1', {}, actor);

      const excepto =
        d.bookingsRepo.findPatientBookingsOverlapping.mock.calls[0][5];
      expect(excepto).toBe('booking-1');
    });

    it('REGLA 2 · sin choques, aceptar no cancela nada', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        solicitudPendiente(),
      );
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
      d.bookingsRepo.findSlotById.mockResolvedValue(openSlot());

      const res = await d.service.accept('booking-1', {}, actor);

      expect(res.desplazadas).toEqual([]);
    });

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

  /* ==========================================================================
     P8 · los cambios de cita se avisan, y con el motivo
     ========================================================================== */

  describe('avisos de cambio de cita (P8)', () => {
    /** La cita como la describe el repositorio de avisos. */
    const descrita = {
      bookingId: 'booking-1',
      tenantId: 'tenant-1',
      patientProfileId: PATIENT,
      resourceId: 'res-1',
      slotId: SLOT_ID,
      startAt: new Date('2026-08-20T14:00:00.000Z'),
      resourceLabel: 'Dra. Rivas',
    };

    /** Una cita vigente lista para cancelarse. */
    function vigente() {
      return {
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        resourceId: 'res-1',
        patientProfileId: PATIENT,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      };
    }

    it('cancelar avisa al paciente, con el motivo en el cuerpo', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(vigente());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue({
        id: SLOT_ID,
        startAt: new Date('2026-08-20T14:00:00.000Z'),
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_BOOKED,
      });
      d.noticeRepo.describeBooking.mockResolvedValue(descrita);

      await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PROVIDER', reasonText: MOTIVO },
        actor,
      );

      const aviso = d.notices.emit.mock.calls[0][0];
      expect(aviso.kind).toBe('BOOKING_STATE_CHANGED');
      expect(aviso.payload.change).toBe('CANCELLED');
      expect(aviso.recipient).toEqual({ patientProfileId: PATIENT });
      expect(aviso.bodyText).toContain(MOTIVO);
    });

    it('rechazar avisa como rechazo, no como cancelación', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
        ...vigente(),
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
      });
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue({
        id: SLOT_ID,
        startAt: new Date('2026-08-20T14:00:00.000Z'),
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_BOOKED,
      });
      d.noticeRepo.describeBooking.mockResolvedValue(descrita);

      await d.service.reject('booking-1', { reasonText: MOTIVO }, actor);

      expect(d.notices.emit.mock.calls[0][0].payload.change).toBe('REJECTED');
    });

    it('cuando cancela el paciente, el que se entera es el profesional', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(vigente());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue({
        id: SLOT_ID,
        startAt: new Date('2026-08-20T14:00:00.000Z'),
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_BOOKED,
      });
      d.noticeRepo.describeBooking.mockResolvedValue(descrita);
      d.noticeRepo.findResourceAccount.mockResolvedValue('user-medico');

      await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PATIENT', reasonText: MOTIVO },
        actor,
      );

      expect(d.notices.emit.mock.calls[0][0].recipient).toEqual({
        userId: 'user-medico',
      });
    });

    it('una sala no tiene a quién avisarle: no se emite y no se rompe', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(vigente());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue({
        id: SLOT_ID,
        startAt: new Date('2026-08-20T14:00:00.000Z'),
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_BOOKED,
      });
      d.noticeRepo.describeBooking.mockResolvedValue(descrita);
      d.noticeRepo.findResourceAccount.mockResolvedValue(null);

      await expect(
        d.service.cancel(
          'booking-1',
          { cancelledBy: 'PATIENT', reasonText: MOTIVO },
          actor,
        ),
      ).resolves.toBeDefined();
      expect(d.notices.emit).not.toHaveBeenCalled();
    });

    it('aceptar avisa la confirmación al paciente', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        resourceId: 'res-1',
        appointmentId: 'appt-1',
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
      });
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
      d.bookingsRepo.findSlotById.mockResolvedValue({
        id: SLOT_ID,
        startAt: new Date('2026-08-20T14:00:00.000Z'),
      });
      d.noticeRepo.describeBooking.mockResolvedValue(descrita);

      await d.service.accept('booking-1', {}, actor);

      expect(d.notices.emit.mock.calls[0][0].payload.change).toBe('ACCEPTED');
    });

    it('aceptar programa por omisión los recordatorios de 24 h y 2 h', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        resourceId: 'res-1',
        appointmentId: 'appt-1',
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
      });
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });
      d.bookingsRepo.findSlotById.mockResolvedValue({
        id: SLOT_ID,
        startAt: new Date('2026-08-20T14:00:00.000Z'),
      });

      await d.service.accept('booking-1', {}, actor);

      const antelaciones = d.bookingsRepo.createReminder.mock.calls.map(
        (llamada: any[]) => llamada[1].offsetMinutes,
      );
      expect(antelaciones).toEqual([1440, 120]);
    });

    it('un `[]` explícito sigue significando «ningún recordatorio»', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue({
        id: 'booking-1',
        bookableSlotId: SLOT_ID,
        resourceId: 'res-1',
        appointmentId: 'appt-1',
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
      });
      d.appointmentsRepo.findById.mockResolvedValue({ id: 'appt-1' });

      await d.service.accept(
        'booking-1',
        { reminderOffsetsMinutes: [] },
        actor,
      );

      expect(d.bookingsRepo.createReminder).not.toHaveBeenCalled();
    });

    it('si el aviso no se puede redactar, la cancelación sigue en pie', async () => {
      const d = build();
      d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(vigente());
      d.bookingsRepo.findSlotForUpdate.mockResolvedValue({
        id: SLOT_ID,
        startAt: new Date('2026-08-20T14:00:00.000Z'),
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_BOOKED,
      });
      // La cita ya no se puede describir (borrada por otra vía, por ejemplo).
      d.noticeRepo.describeBooking.mockResolvedValue(null);

      const res = await d.service.cancel(
        'booking-1',
        { cancelledBy: 'PROVIDER', reasonText: MOTIVO },
        actor,
      );

      expect(res.capacityReleased).toBe(true);
      expect(d.notices.emit).not.toHaveBeenCalled();
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

    /** Un actor profesional, dueño o no de la agenda que se consulta. */
    function medico(perfil: string) {
      return {
        id: `u-${perfil}`,
        roles: ['PRACTITIONER'],
        practitionerProfileId: perfil,
      };
    }

    /** Una página de una cita colgada del recurso `res-1`. */
    function pagina(ids: readonly string[] = ['booking-1']) {
      return {
        rows: ids.map((id) => ({
          booking: { ...guardada, id, resourceId: 'res-1' },
          slot: null,
        })),
        fetchCapReached: false,
      };
    }

    it('MAC-6 · el profesional de la agenda ve el nombre del paciente', async () => {
      // Sin esto, la vista del día es una lista de identificadores. Es el
      // pedido explícito del registro del cliente: «nombre completo del
      // paciente» en el calendario del médico.
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue(pagina());
      d.catalogRepo.findResourceById.mockResolvedValue({
        id: 'res-1',
        resourceRefId: 'perfil-medico',
      });
      d.bookingsRepo.findPatientNames.mockResolvedValue(
        new Map([[PATIENT, 'Marisol Quispe']]),
      );

      const res = await d.service.searchBookings(
        { resourceId: 'res-1', includeCancelled: false },
        50,
        medico('perfil-medico') as any,
      );

      expect(res.items[0].patientName).toBe('Marisol Quispe');
    });

    it('el estado de pago viaja en la página, en UNA sola consulta', async () => {
      // El punto entero de la lectura en lote. Si esto se resolviera cita por
      // cita, la columna de pago no sería una ineficiencia: sería una columna
      // que no se puede construir. Es el mismo defecto que Itzan levantó como
      // B-1 en la TAREA-22.
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue(pagina(['b1', 'b2']));
      d.catalogRepo.findResourceById.mockResolvedValue({
        id: 'res-1',
        resourceRefId: 'perfil-medico',
      });
      d.bookingsRepo.findPaymentStatesForBookings.mockResolvedValue(
        new Map([
          [
            'b1',
            {
              appointmentBookingId: 'b1',
              statusConceptId: SCHED.PAYMENT_PAID,
              insuranceUsed: true,
              markedByUserId: 'u-9',
              markedAt: new Date('2026-09-01T10:00:00Z'),
            },
          ],
        ]),
      );

      const res = await d.service.searchBookings(
        { resourceId: 'res-1', includeCancelled: false },
        50,
        medico('perfil-medico') as any,
      );

      // Una llamada para las dos citas, no una por cita.
      expect(d.bookingsRepo.findPaymentStatesForBookings).toHaveBeenCalledTimes(
        1,
      );
      expect(res.items[0].paymentState?.state).toBe('PAID');
      expect(res.items[0].paymentState?.insuranceUsed).toBe(true);
      // Y la que nadie marcó se OMITE: `undefined` y no «pendiente». La
      // diferencia tiene que sobrevivir hasta la pantalla.
      expect(res.items[1].paymentState).toBeUndefined();
    });

    it('MAC-6 · un profesional ajeno NO ve el nombre', async () => {
      // Misma regla que el motivo de consulta: se omite, no se vacía.
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue(pagina());
      d.catalogRepo.findResourceById.mockResolvedValue({
        id: 'res-1',
        resourceRefId: 'perfil-DE-OTRO',
      });
      d.bookingsRepo.findPatientNames.mockResolvedValue(
        new Map([[PATIENT, 'Marisol Quispe']]),
      );

      const res = await d.service.searchBookings(
        { resourceId: 'res-1', includeCancelled: false },
        50,
        medico('perfil-propio') as any,
      );

      expect(res.items[0].patientName).toBeUndefined();
      expect(JSON.stringify(res)).not.toContain('Marisol');
    });

    it('MAC-6 · los nombres se piden UNA vez para toda la página', async () => {
      // De a uno, una agenda de veinte turnos haría veinte consultas para
      // pintar una pantalla.
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue(pagina(['b1', 'b2']));
      d.catalogRepo.findResourceById.mockResolvedValue({
        id: 'res-1',
        resourceRefId: 'perfil-medico',
      });

      await d.service.searchBookings(
        { resourceId: 'res-1', includeCancelled: false },
        50,
        medico('perfil-medico') as any,
      );

      expect(d.bookingsRepo.findPatientNames).toHaveBeenCalledTimes(1);
    });

    /* ------------------------------------------------------------------
       TAREA-12 §3.2 · la tipología viaja para que la agenda pueda pintarla
       ------------------------------------------------------------------ */

    it('la tipología de la cita llega en el listado', async () => {
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue({
        rows: [
          {
            booking: {
              ...guardada,
              id: 'b1',
              resourceId: 'res-1',
              appointmentId: 'appt-1',
            },
            slot: null,
          },
        ],
        fetchCapReached: false,
      });
      d.appointmentsRepo.findTypesByIds.mockResolvedValue(
        new Map([['appt-1', 'tipo-operacion']]),
      );

      const res = await d.service.searchBookings(
        { resourceId: 'res-1', includeCancelled: false },
        50,
      );

      expect(res.items[0].typeConceptId).toBe('tipo-operacion');
    });

    it('se pide UNA vez para toda la página, no una por cita', async () => {
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue({
        rows: ['b1', 'b2', 'b3'].map((id, i) => ({
          booking: {
            ...guardada,
            id,
            resourceId: 'res-1',
            appointmentId: `appt-${i}`,
          },
          slot: null,
        })),
        fetchCapReached: false,
      });

      await d.service.searchBookings(
        { resourceId: 'res-1', includeCancelled: false },
        50,
      );

      expect(d.appointmentsRepo.findTypesByIds).toHaveBeenCalledTimes(1);
      const [, ids] = d.appointmentsRepo.findTypesByIds.mock.calls[0];
      expect(ids).toHaveLength(3);
    });

    it('una reserva sin cita clínica no pide tipología ni la inventa', async () => {
      // Una reserva que nunca se confirmó no crea `clinical.appointments`: su
      // id no entra en la consulta y el campo se omite.
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue({
        rows: [
          {
            booking: {
              ...guardada,
              id: 'b1',
              resourceId: 'res-1',
              appointmentId: null,
            },
            slot: null,
          },
        ],
        fetchCapReached: false,
      });

      const res = await d.service.searchBookings(
        { resourceId: 'res-1', includeCancelled: false },
        50,
      );

      expect(res.items[0].typeConceptId).toBeUndefined();
      const [, ids] = d.appointmentsRepo.findTypesByIds.mock.calls[0];
      expect(ids).toHaveLength(0);
    });

    it('una cita clínica sin tipo declarado omite el campo, no lo vacía', async () => {
      const d = build();
      d.bookingsRepo.findBookings.mockResolvedValue({
        rows: [
          {
            booking: {
              ...guardada,
              id: 'b1',
              resourceId: 'res-1',
              appointmentId: 'appt-1',
            },
            slot: null,
          },
        ],
        fetchCapReached: false,
      });
      // El repositorio no la incluye: «no declaró tipo» no es «tipo nulo».
      d.appointmentsRepo.findTypesByIds.mockResolvedValue(new Map());

      const res = await d.service.searchBookings(
        { resourceId: 'res-1', includeCancelled: false },
        50,
      );

      expect('typeConceptId' in res.items[0]).toBe(false);
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

    it('el detalle trae la demora informada, aunque el aviso no haya llegado (P8)', async () => {
      const d = build();
      d.bookingsRepo.findBookingById.mockResolvedValue({
        ...guardada,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      });
      // Primera consulta: el motivo (no hay). Segunda: la demora.
      d.historyRepo.latestBySource
        .mockResolvedValueOnce(new Map())
        .mockResolvedValueOnce(
          new Map([
            [
              'booking-1',
              {
                operationConceptId: SCHED.HISTORY_OP_DELAY,
                recordedAt: new Date('2026-08-20T13:40:00Z'),
                dataSnapshot: {
                  bookingId: 'booking-1',
                  delayMinutes: 20,
                  reasonText: 'Estoy en una urgencia',
                  actorKind: 'PROVIDER',
                },
              },
            ],
          ]),
        );

      const cita = await d.service.getBookingById('booking-1');

      expect(cita.delayNotice).toEqual({
        delayMinutes: 20,
        message: 'Estoy en una urgencia',
        announcedAt: new Date('2026-08-20T13:40:00Z'),
      });
    });

    it('una cita sin demora no inventa una', async () => {
      const d = build();
      d.bookingsRepo.findBookingById.mockResolvedValue(guardada);

      const cita = await d.service.getBookingById('booking-1');

      expect(cita.delayNotice).toBeUndefined();
    });

    // El invariante es que el coste **no crece con la página**, no que sea una
    // sola consulta: P8 añadió la lectura de la demora, que es otro predicado
    // sobre el mismo historial y `latestBySource` devuelve una revisión por
    // agregado. Son dos consultas fijas para 2 citas y las mismas dos para 100;
    // lo que esta prueba impide es volver a pedir el historial cita por cita.
    it('los motivos y las demoras de la página se leen en consultas fijas, no una por cita', async () => {
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

      expect(d.historyRepo.latestBySource).toHaveBeenCalledTimes(2);
      for (const llamada of d.historyRepo.latestBySource.mock.calls) {
        expect(llamada[2]).toEqual(['booking-1', 'booking-2']);
      }
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

/**
 * EL ESTADO DE PAGO DE UNA CITA — TAREA-13, punto 5.
 *
 * Lo que fijan estas pruebas es la regla que dio el propietario y que es fácil
 * de romper sin darse cuenta, porque no es una máquina de estados sino **dos
 * ejes que corren en paralelo**: «el estado del pago no es excluyente con
 * pendiente, aceptada y realizada; pero sí lo es con rechazada y cancelada».
 *
 * Y una segunda cosa que no se ve leyendo: marcar un pago **sobrescribe** la
 * fila, así que sin la revisión en el historial, volver a «pendiente» borraría
 * que la cita alguna vez estuvo pagada.
 */
describe('SchedulingBookingsService · el estado de pago', () => {
  const BOOKING = '33333333-3333-3333-3333-333333333333';
  const TENANT = '44444444-4444-4444-4444-444444444444';

  /** Una cita en el estado que se le pida, lista para operar. */
  function citaEn(statusConceptId: string) {
    return {
      id: BOOKING,
      tenantId: TENANT,
      statusConceptId,
      resourceId: null,
    };
  }

  it('marca una cita confirmada y la firma con quién y cuándo', async () => {
    const { service, bookingsRepo, tx } = build();
    bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      citaEn(CONCEPTS.BOOKING_CONFIRMED),
    );

    const antes = Date.now();
    const res = await service.setPaymentState(
      BOOKING,
      { state: 'PAID' },
      actor as any,
    );

    expect(res.state).toBe('PAID');
    expect(res.label).toBe('Pagada');
    expect(res.conceptId).toBe(SCHED.PAYMENT_PAID);
    // AC-13-10: la firma. Sin esto, marcar una cita como pagada sería una
    // afirmación sobre el dinero de alguien que nadie hizo.
    expect(res.markedByUserId).toBe(actor.id);
    expect(new Date(res.markedAt).getTime()).toBeGreaterThanOrEqual(antes);
    expect(tx.persist).toHaveBeenCalled();
  });

  it('los tres estados existen y ninguno es un booleano', async () => {
    // El pedido original decía «pagada o pendiente de pago». El propietario
    // agregó el intermedio, y es exactamente el que un booleano no puede
    // expresar.
    for (const [state, label, concepto] of [
      ['PENDING', 'Pendiente de pago', SCHED.PAYMENT_PENDING],
      ['PARTIALLY_PAID', 'Parcialmente pagada', SCHED.PAYMENT_PARTIALLY_PAID],
      ['PAID', 'Pagada', SCHED.PAYMENT_PAID],
    ] as const) {
      const { service, bookingsRepo } = build();
      bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
        citaEn(CONCEPTS.BOOKING_CONFIRMED),
      );
      const res = await service.setPaymentState(
        BOOKING,
        { state },
        actor as any,
      );
      expect(res.label).toBe(label);
      expect(res.conceptId).toBe(concepto);
    }
  });

  it('el seguro es una marca SEPARADA, no un cuarto estado', async () => {
    // Es la decisión del propietario: una cita puede estar parcialmente pagada
    // con seguro o sin él. Si el seguro viviera dentro del estado, este caso
    // necesitaría un valor propio y serían seis.
    const { service, bookingsRepo } = build();
    bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      citaEn(CONCEPTS.BOOKING_CONFIRMED),
    );

    const res = await service.setPaymentState(
      BOOKING,
      { state: 'PARTIALLY_PAID', insuranceUsed: true },
      actor as any,
    );

    expect(res.state).toBe('PARTIALLY_PAID');
    expect(res.insuranceUsed).toBe(true);
  });

  it('sin decir nada del seguro, queda en false y no en indefinido', async () => {
    const { service, bookingsRepo } = build();
    bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      citaEn(CONCEPTS.BOOKING_CONFIRMED),
    );

    const res = await service.setPaymentState(
      BOOKING,
      { state: 'PENDING' },
      actor as any,
    );

    expect(res.insuranceUsed).toBe(false);
  });

  it('una cita cancelada o rechazada NO admite estado de pago (422)', async () => {
    // La mitad excluyente de la regla. Rechazar cancela con motivo
    // `CANCEL_REJECTED`, así que las dos palabras del propietario caen en el
    // mismo concepto.
    const { service, bookingsRepo } = build();
    bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      citaEn(CONCEPTS.BOOKING_CANCELLED),
    );

    await expect(
      service.setPaymentState(BOOKING, { state: 'PAID' }, actor as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('la exclusión es del servidor: no se guarda NADA cuando rechaza', async () => {
    // Esconder el botón en la pantalla no es una regla. Lo que importa es que
    // el 422 ocurra ANTES de tocar la base.
    const { service, bookingsRepo, tx, historyRepo } = build();
    bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      citaEn(CONCEPTS.BOOKING_CANCELLED),
    );

    await expect(
      service.setPaymentState(BOOKING, { state: 'PAID' }, actor as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);

    expect(tx.persist).not.toHaveBeenCalled();
    expect(historyRepo.append).not.toHaveBeenCalled();
  });

  it('los estados que el propietario SÍ permite, pasan los tres', async () => {
    // «pendiente, aceptada y realizada» — la mitad permisiva, falsable.
    for (const estado of [
      SCHED.BOOKING_REQUESTED,
      CONCEPTS.BOOKING_CONFIRMED,
      SCHED.BOOKING_COMPLETED,
    ]) {
      const { service, bookingsRepo } = build();
      bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(citaEn(estado));
      await expect(
        service.setPaymentState(BOOKING, { state: 'PAID' }, actor as any),
      ).resolves.toMatchObject({ state: 'PAID' });
    }
  });

  it('volver a marcar ACTUALIZA la fila, no crea una segunda', async () => {
    // Hay una fila por cita, y el único de la base lo garantiza. Si el servicio
    // insertara otra, moriría con un 500 contra ese índice.
    const filaVieja = {
      id: 'pago-1',
      statusConceptId: SCHED.PAYMENT_PENDING,
      insuranceUsed: false,
      markedByUserId: 'otro-usuario',
      markedAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
    const { service, bookingsRepo, tx } = build();
    bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      citaEn(CONCEPTS.BOOKING_CONFIRMED),
    );
    bookingsRepo.findPaymentStateForUpdate.mockResolvedValue(filaVieja);

    const res = await service.setPaymentState(
      BOOKING,
      { state: 'PAID' },
      actor as any,
    );

    expect(tx.persist).not.toHaveBeenCalled();
    expect(filaVieja.statusConceptId).toBe(SCHED.PAYMENT_PAID);
    // La firma se renueva: quien marcó AHORA es quien responde por el dato.
    expect(res.markedByUserId).toBe(actor.id);
  });

  it('cada marca deja huella en el historial, con de dónde a dónde', async () => {
    // Es lo que hace falsable el «nada se pisa en silencio» de AC-13-10: la
    // fila se sobrescribe, la revisión no.
    const { service, bookingsRepo, historyRepo } = build();
    bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      citaEn(CONCEPTS.BOOKING_CONFIRMED),
    );
    bookingsRepo.findPaymentStateForUpdate.mockResolvedValue({
      id: 'pago-1',
      statusConceptId: SCHED.PAYMENT_PAID,
      insuranceUsed: false,
      markedByUserId: 'otro',
      markedAt: new Date(),
      updatedAt: new Date(),
    });

    await service.setPaymentState(BOOKING, { state: 'PENDING' }, actor as any);

    expect(historyRepo.append).toHaveBeenCalledWith(
      expect.anything(),
      'appointment_bookings',
      BOOKING,
      expect.objectContaining({
        operationConceptId: SCHED.HISTORY_OP_PAYMENT_MARKED,
        changedByUserId: actor.id,
        dataSnapshot: expect.objectContaining({
          // El paso completo: sin el «de», la huella no dice qué se perdió.
          fromPaymentConceptId: SCHED.PAYMENT_PAID,
          toPaymentConceptId: SCHED.PAYMENT_PENDING,
        }),
      }),
    );
  });

  it('sin marca previa, la lectura devuelve null y no «pendiente»', async () => {
    // No son lo mismo: «pendiente de pago» es una afirmación que alguien firmó;
    // la ausencia de fila es que del pago todavía no se dijo nada.
    const { service, bookingsRepo } = build();
    bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      citaEn(CONCEPTS.BOOKING_CONFIRMED),
    );

    await expect(
      service.getPaymentState(BOOKING, actor as any),
    ).resolves.toBeNull();
  });
});
