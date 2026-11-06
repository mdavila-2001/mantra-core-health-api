import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { SchedulingEncounterClosedAdapter } from './scheduling-encounter-closed.adapter';
import { CompleteLinkedBookingUseCase } from '../../scheduling/application/bookings/use-cases/complete-linked-booking.use-case';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Implementación opcional.
 * @returns El mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'usr-doc', roles: ['PRACTITIONER'] } as any;
const closed = { encounterId: 'enc-1', appointmentId: 'appt-1' };

/** Adaptador con el caso de uso de agenda doblado. */
function build() {
  const useCase = { execute: mockFn().mockResolvedValue('COMPLETED') };
  const moduleRef = { get: mockFn(() => useCase) };
  const em: any = { transactional: mockFn((cb: any) => cb(em)) };
  em.fork = mockFn(() => em);
  const logger = { setContext: mockFn(), error: mockFn(), warn: mockFn() };
  const adapter = new SchedulingEncounterClosedAdapter(
    moduleRef as any,
    em,
    logger as any,
  );
  return { adapter, useCase, moduleRef, em, logger };
}

describe('SchedulingEncounterClosedAdapter', () => {
  it('pide a la agenda completar el turno, dentro de un savepoint de la transacción en curso', async () => {
    const d = build();
    await d.adapter.onEncounterClosed(closed, actor);
    expect(d.moduleRef.get).toHaveBeenCalledWith(CompleteLinkedBookingUseCase, {
      strict: false,
    });
    expect(d.useCase.execute).toHaveBeenCalledWith('appt-1', actor);
    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
  });

  it('un encuentro sin cita clínica no toca la agenda', async () => {
    const d = build();
    await d.adapter.onEncounterClosed({ encounterId: 'enc-1' }, actor);
    expect(d.moduleRef.get).not.toHaveBeenCalled();
  });

  it('lo esperable (quien cerró no opera esa agenda) va a warn, sin lanzar', async () => {
    const d = build();
    d.useCase.execute.mockRejectedValue(new ForbiddenException('otra agenda'));
    await expect(
      d.adapter.onEncounterClosed(closed, actor),
    ).resolves.toBeUndefined();
    expect(d.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        encounterId: 'enc-1',
        appointmentId: 'appt-1',
        reason: 'otra agenda',
      }),
      expect.any(String),
    );
    expect(d.logger.error).not.toHaveBeenCalled();
  });

  it('lo inesperado va a error, sin lanzar (también si la agenda no está cargada)', async () => {
    const d = build();
    d.moduleRef.get.mockImplementation(() => {
      throw new Error('Nest could not find CompleteLinkedBookingUseCase');
    });
    await expect(
      d.adapter.onEncounterClosed(closed, actor),
    ).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
    expect(d.logger.warn).not.toHaveBeenCalled();
  });
});
