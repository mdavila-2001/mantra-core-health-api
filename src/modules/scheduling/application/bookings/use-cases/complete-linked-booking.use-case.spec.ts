import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CompleteLinkedBookingUseCase } from './complete-linked-booking.use-case';
import { SCHED } from '../../../domain/scheduling.concepts';
import { CONCEPTS } from '../../../../../common';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Implementación opcional.
 * @returns El mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = {
  id: 'usr-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

/** Sistema bajo prueba con una reserva en el estado indicado (o ninguna). */
function build(statusConceptId: string | null) {
  const em: any = {
    findOne: mockFn(async () =>
      statusConceptId === null ? null : { id: 'bkg-1', statusConceptId },
    ),
  };
  em.fork = mockFn(() => em);
  const calls: string[] = [];
  const start = {
    execute: mockFn(async () => {
      calls.push('start');
    }),
  };
  const complete = {
    execute: mockFn(async () => {
      calls.push('complete');
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const useCase = new CompleteLinkedBookingUseCase(
    em,
    start as any,
    complete as any,
    logger as any,
  );
  return { useCase, em, start, complete, calls };
}

describe('CompleteLinkedBookingUseCase (cierre clínico → turno completado)', () => {
  it('una reserva en curso se completa por el caso de uso de la agenda (dispara la encuesta)', async () => {
    const d = build(SCHED.BOOKING_IN_PROGRESS);
    await expect(d.useCase.execute('appt-1', actor)).resolves.toBe('COMPLETED');
    expect(d.em.findOne).toHaveBeenCalledWith(expect.anything(), {
      appointmentId: 'appt-1',
    });
    expect(d.complete.execute).toHaveBeenCalledWith('bkg-1', actor);
    expect(d.start.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['confirmada', CONCEPTS.BOOKING_CONFIRMED],
    ['con llegada registrada', CONCEPTS.BOOKING_CHECKED_IN],
  ])(
    'una reserva %s se inicia y después se completa, como en la agenda',
    async (_label, state) => {
      const d = build(state);
      await expect(d.useCase.execute('appt-1', actor)).resolves.toBe(
        'COMPLETED',
      );
      expect(d.calls).toEqual(['start', 'complete']);
    },
  );

  it('busca la reserva sobre la transacción de la petición (RLS)', async () => {
    const d = build(SCHED.BOOKING_IN_PROGRESS);
    await d.useCase.execute('appt-1', actor);
    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
  });

  it('una reserva ya completada no se toca (idempotente)', async () => {
    const d = build(SCHED.BOOKING_COMPLETED);
    await expect(d.useCase.execute('appt-1', actor)).resolves.toBe(
      'ALREADY_COMPLETED',
    );
    expect(d.calls).toEqual([]);
  });

  it.each([
    ['cancelada', CONCEPTS.BOOKING_CANCELLED],
    ['sin presentarse', SCHED.BOOKING_NO_SHOW],
    ['solicitada', SCHED.BOOKING_REQUESTED],
    ['pendiente de confirmación', SCHED.BOOKING_PENDING_CONFIRMATION],
  ])('una reserva %s nunca se completa', async (_label, state) => {
    const d = build(state);
    await expect(d.useCase.execute('appt-1', actor)).resolves.toBe(
      'NOT_COMPLETABLE',
    );
    expect(d.calls).toEqual([]);
  });

  it('una cita clínica sin reserva de agenda no hace nada', async () => {
    const d = build(null);
    await expect(d.useCase.execute('appt-1', actor)).resolves.toBe(
      'NO_BOOKING',
    );
    expect(d.calls).toEqual([]);
  });

  it('la autorización es la de la agenda: si quien cerró no opera ese turno, sube el 403', async () => {
    const d = build(SCHED.BOOKING_IN_PROGRESS);
    d.complete.execute.mockRejectedValue(new ForbiddenException('otra agenda'));
    await expect(d.useCase.execute('appt-1', actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
