import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../common';
import { EncounterCloseService } from './encounter-close.service';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Implementación opcional.
 * @returns El mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'user-1', roles: ['PRACTITIONER'] } as any;

/** Sistema bajo prueba con el cierre y el puerto doblados. */
function build() {
  const order: string[] = [];
  const em: any = {};
  em.fork = mockFn(() => em);
  const encounters = {
    close: mockFn(async () => {
      order.push('close');
      return { id: 'enc1', status: 'finished' };
    }),
  };
  const encountersRepo = {
    findById: mockFn(async () => ({ id: 'enc1', appointmentId: 'appt-1' })),
  };
  const port = {
    onEncounterClosed: mockFn(async () => {
      order.push('port');
    }),
  };
  const service = new EncounterCloseService(
    em,
    encounters as any,
    encountersRepo as any,
    port as any,
  );
  return { service, em, encounters, encountersRepo, port, order };
}

describe('EncounterCloseService', () => {
  it('cierra y después avisa a la agenda con la cita clínica del encuentro', async () => {
    const d = build();
    const res = await d.service.close('enc1', {}, actor);
    expect(res).toEqual({ id: 'enc1', status: 'finished' });
    expect(d.port.onEncounterClosed).toHaveBeenCalledWith(
      { encounterId: 'enc1', appointmentId: 'appt-1' },
      actor,
    );
    expect(d.order).toEqual(['close', 'port']);
    // Lee el encuentro sobre la transacción de la petición (RLS).
    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
  });

  it('un cierre rechazado no avisa a la agenda', async () => {
    const d = build();
    d.encounters.close.mockRejectedValue(
      new PreconditionFailedException('no está en curso'),
    );
    await expect(d.service.close('enc1', {}, actor)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(d.port.onEncounterClosed).not.toHaveBeenCalled();
  });
});
