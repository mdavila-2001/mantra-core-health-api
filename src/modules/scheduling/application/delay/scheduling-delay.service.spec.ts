import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingDelayService } from './scheduling-delay.service';
import { SCHED } from '../../domain/scheduling.concepts';
import { CONCEPTS } from '../../../../common';

const BOOKING = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const RESOURCE = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const PRACTITIONER_PROFILE = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

const ADMIN = { id: 'user-admin', roles: ['SCHEDULING_ADMIN'] } as any;
const PRACTITIONER_ACTOR = {
  id: 'user-medico',
  roles: ['PRACTITIONER'],
  practitionerProfileId: PRACTITIONER_PROFILE,
} as any;
const OTHER_PRACTITIONER = {
  id: 'user-otro',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'otro-perfil',
} as any;

const booking = {
  bookingId: BOOKING,
  tenantId: 'tenant-1',
  patientProfileId: 'paciente-1',
  resourceId: RESOURCE,
  slotId: 'cupo-1',
  startAt: new Date('2026-08-20T14:00:00.000Z'),
  resourceLabel: 'Dra. Rivas',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);

  const catalogRepo = {
    findResourceById: mockFn().mockResolvedValue({
      id: RESOURCE,
      resourceRefType: 'health_practitioner_profiles',
      resourceRefId: PRACTITIONER_PROFILE,
      name: 'Consultorio 1',
    }),
  };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const noticeRepo = {
    describeBooking: mockFn().mockResolvedValue(booking),
    findAffectedBookings: mockFn().mockResolvedValue([booking]),
  };
  const notices = {
    emit: mockFn().mockResolvedValue({ delivered: true }),
    emitMany: mockFn(async (noticeList: any[]) =>
      noticeList.map(() => ({ delivered: true })),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SchedulingDelayService(
    em as any,
    catalogRepo as any,
    historyRepo as any,
    noticeRepo as any,
    notices as any,
    logger as any,
  );
  return { service, em, tx, catalogRepo, historyRepo, noticeRepo, notices };
}

describe('SchedulingDelayService (P8 · «el médico se demora»)', () => {
  describe('sobre una cita concreta', () => {
    it('anota la demora en el historial y avisa al paciente', async () => {
      const d = build();

      const result = await d.service.delayBooking(
        BOOKING,
        { delayMinutes: 20, message: 'Estoy en una urgencia' },
        PRACTITIONER_ACTOR,
      );

      expect(d.historyRepo.append).toHaveBeenCalledTimes(1);
      const [, entity, id, data] = d.historyRepo.append.mock.calls[0];
      expect(entity).toBe('appointment_bookings');
      expect(id).toBe(BOOKING);
      expect(data.operationConceptId).toBe(SCHED.HISTORY_OP_DELAY);
      expect(data.dataSnapshot.delayMinutes).toBe(20);
      expect(data.dataSnapshot.reasonText).toBe('Estoy en una urgencia');

      expect(d.notices.emitMany).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        notified: 1,
        affected: 1,
        bookingIds: [BOOKING],
      });
    });

    it('no cambia el estado de la cita: una demora no la mueve', async () => {
      const d = build();
      await d.service.delayBooking(BOOKING, { delayMinutes: 10 }, PRACTITIONER_ACTOR);
      // El servicio no tiene repositorio de reservas: no puede tocar el motor
      // de agenda ni por descuido. La prueba lo deja escrito.
      expect((d.service as any).bookingsRepo).toBeUndefined();
    });

    it('una cita que no existe es 404, no un aviso al vacío', async () => {
      const d = build();
      d.noticeRepo.describeBooking.mockResolvedValue(null);

      await expect(
        d.service.delayBooking(BOOKING, { delayMinutes: 10 }, ADMIN),
      ).rejects.toThrow(/no encontrada/i);
      expect(d.notices.emitMany).not.toHaveBeenCalled();
    });

    it('el profesional de otra agenda no puede avisar demoras ajenas', async () => {
      const d = build();

      await expect(
        d.service.delayBooking(BOOKING, { delayMinutes: 10 }, OTHER_PRACTITIONER),
      ).rejects.toThrow(/otro profesional/i);
      expect(d.historyRepo.append).not.toHaveBeenCalled();
    });

    it('quien administra agendas sí puede, sin ser el que atiende', async () => {
      const d = build();
      await expect(
        d.service.delayBooking(BOOKING, { delayMinutes: 10 }, ADMIN),
      ).resolves.toMatchObject({ affected: 1 });
    });

    it('más de cuatro horas no es una demora: se rechaza', async () => {
      const d = build();
      await expect(
        d.service.delayBooking(BOOKING, { delayMinutes: 300 }, ADMIN),
      ).rejects.toThrow(/reprogramando/i);
      expect(d.historyRepo.append).not.toHaveBeenCalled();
    });
  });

  describe('sobre la agenda entera', () => {
    it('alcanza a las citas vigentes de la ventana y avisa a cada paciente', async () => {
      const d = build();
      const other = { ...booking, bookingId: 'booking-2' };
      d.noticeRepo.findAffectedBookings.mockResolvedValue([booking, other]);

      const result = await d.service.delayResource(
        RESOURCE,
        { delayMinutes: 20 },
        PRACTITIONER_ACTOR,
      );

      const [, , from, to, states] =
        d.noticeRepo.findAffectedBookings.mock.calls[0];
      expect(from).toBeInstanceOf(Date);
      expect(to.getTime()).toBeGreaterThan(from.getTime());
      // Sólo las que siguen en pie: avisar de una demora a quien ya canceló
      // sería avisar de un turno que no existe.
      expect(states).toEqual([
        CONCEPTS.BOOKING_CONFIRMED,
        CONCEPTS.BOOKING_CHECKED_IN,
      ]);

      expect(d.historyRepo.append).toHaveBeenCalledTimes(2);
      expect(result.affected).toBe(2);
      expect(result.notified).toBe(2);
      expect(result.bookingIds).toEqual([BOOKING, 'booking-2']);
    });

    it('una agenda sin citas en la ventana lo dice en vez de fingir un aviso', async () => {
      const d = build();
      d.noticeRepo.findAffectedBookings.mockResolvedValue([]);

      const result = await d.service.delayResource(
        RESOURCE,
        { delayMinutes: 20 },
        ADMIN,
      );

      expect(result).toMatchObject({ affected: 0, notified: 0 });
      expect(result.detail).toMatch(/no se avisó a nadie/i);
      expect(d.notices.emitMany).not.toHaveBeenCalled();
    });

    it('una ventana invertida se rechaza antes de tocar nada', async () => {
      const d = build();
      await expect(
        d.service.delayResource(
          RESOURCE,
          {
            delayMinutes: 20,
            from: '2026-08-20T18:00:00.000Z',
            to: '2026-08-20T09:00:00.000Z',
          },
          ADMIN,
        ),
      ).rejects.toThrow(/termina antes de empezar/i);
    });

    it('un recurso inexistente es 404', async () => {
      const d = build();
      d.catalogRepo.findResourceById.mockResolvedValue(null);
      await expect(
        d.service.delayResource(RESOURCE, { delayMinutes: 20 }, ADMIN),
      ).rejects.toThrow(/no encontrado/i);
    });

    it('cuenta cuántos avisos llegaron de verdad, no cuántos se intentaron', async () => {
      const d = build();
      const other = { ...booking, bookingId: 'booking-2' };
      d.noticeRepo.findAffectedBookings.mockResolvedValue([booking, other]);
      d.notices.emitMany.mockResolvedValue([
        { delivered: true },
        { delivered: false, skippedReason: 'sin cuenta' },
      ]);

      const result = await d.service.delayResource(
        RESOURCE,
        { delayMinutes: 20 },
        ADMIN,
      );

      expect(result).toMatchObject({ affected: 2, notified: 1 });
      expect(result.detail).toMatch(/1 pacientes recibieron el aviso/);
    });
  });
});
