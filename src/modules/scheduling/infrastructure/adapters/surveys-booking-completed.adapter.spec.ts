import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { SurveysBookingCompletedAdapter } from './surveys-booking-completed.adapter';

const actor = { id: 'usr-doc', roles: ['PRACTITIONER'] } as any;

/** Arma el adaptador sobre un doble del servicio de emisión de encuestas. */
function build() {
  const surveys = {
    issueForBooking: mockFn().mockResolvedValue({
      ids: ['inv-1'],
      alreadyIssued: 0,
    }),
  };
  const logger = { setContext: mockFn(), warn: mockFn() };
  const adapter = new SurveysBookingCompletedAdapter(
    surveys as any,
    logger as any,
  );
  return { adapter, surveys, logger };
}

describe('SurveysBookingCompletedAdapter', () => {
  it('pide emitir la invitación de la reserva completada con el actor que la cerró', async () => {
    const d = build();

    await d.adapter.onBookingCompleted('bkg-1', actor);

    expect(d.surveys.issueForBooking).toHaveBeenCalledWith(
      { appointmentBookingId: 'bkg-1' },
      actor,
    );
  });

  it('no lanza si la emisión falla: lo registra con el id de la reserva y sigue', async () => {
    const d = build();
    d.surveys.issueForBooking.mockRejectedValue(new Error('base caída'));

    await expect(
      d.adapter.onBookingCompleted('bkg-1', actor),
    ).resolves.toBeUndefined();

    expect(d.logger.warn).toHaveBeenCalledTimes(1);
    const [fields] = d.logger.warn.mock.calls[0];
    expect(fields).toMatchObject({ bookingId: 'bkg-1' });
  });

  it('tampoco lanza ante un error que no es una Error', async () => {
    const d = build();
    d.surveys.issueForBooking.mockRejectedValue('texto suelto');

    await expect(
      d.adapter.onBookingCompleted('bkg-1', actor),
    ).resolves.toBeUndefined();
  });
});
