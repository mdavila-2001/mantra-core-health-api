import { describe, expect, it, jest } from '@jest/globals';
import { PracticeDefaultServicesSeedService } from './practice-default-services-seed.service';
import { CONCEPTS } from '../constants/concepts';

/** Doble del `EntityManager` con lo poco que el paso usa. */
function armar(practicas: { id: string }[], yaSembradas: string[]) {
  const creadas: Record<string, unknown>[] = [];
  const em = {
    find: jest
      .fn<(...args: unknown[]) => Promise<unknown[]>>()
      // La primera lectura son las prácticas; la segunda, las filas que ya
      // tienen el servicio.
      .mockResolvedValueOnce(practicas)
      .mockResolvedValueOnce(yaSembradas.map((id) => ({ practiceId: id }))),
    create: jest.fn((_entidad: unknown, datos: Record<string, unknown>) => {
      creadas.push(datos);
      return datos;
    }),
    flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
  const orm = { em: { fork: () => em } };
  const logger = { setContext: jest.fn(), info: jest.fn() };
  const service = new PracticeDefaultServicesSeedService(
    orm as never,
    logger as never,
  );
  return { service, em, creadas };
}

describe('PracticeDefaultServicesSeedService', () => {
  it('siembra el servicio en la práctica que no lo tiene', async () => {
    const d = armar([{ id: 'p1' }], []);

    const res = await d.service.run();

    expect(res).toEqual({ inserted: 1 });
    expect(d.creadas).toHaveLength(1);
    expect(d.creadas[0]).toEqual(
      expect.objectContaining({
        practiceId: 'p1',
        code: 'CITA_MEDICA',
        name: 'Cita médica',
        defaultPrice: '0.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        isActive: true,
      }),
    );
  });

  /**
   * Lo que hace seguro dejarlo en cada arranque: la segunda corrida no escribe.
   */
  it('no duplica el servicio en la práctica que ya lo tiene', async () => {
    const d = armar([{ id: 'p1' }, { id: 'p2' }], ['p1']);

    const res = await d.service.run();

    expect(res).toEqual({ inserted: 1 });
    expect(d.creadas.map((fila) => fila.practiceId)).toEqual(['p2']);
  });

  it('sin prácticas no consulta el catálogo ni escribe', async () => {
    const d = armar([], []);

    const res = await d.service.run();

    expect(res).toEqual({ inserted: 0 });
    expect(d.em.find).toHaveBeenCalledTimes(1);
    expect(d.em.flush).not.toHaveBeenCalled();
  });
});
