import { describe, expect, it, jest } from '@jest/globals';
import { PracticeDefaultServicesSeedService } from './practice-default-services-seed.service';
import { CONCEPTS } from '../constants/concepts';

/** Doble del `EntityManager` con lo poco que el paso usa. */
function build(practices: { id: string }[], alreadySeeded: string[]) {
  const created: Record<string, unknown>[] = [];
  const em = {
    find: jest
      .fn<(...args: unknown[]) => Promise<unknown[]>>()
      // La primera lectura son las prácticas; la segunda, las filas que ya
      // tienen el servicio.
      .mockResolvedValueOnce(practices)
      .mockResolvedValueOnce(alreadySeeded.map((id) => ({ practiceId: id }))),
    create: jest.fn((entity: unknown, data: Record<string, unknown>) => {
      created.push(data);
      return data;
    }),
    flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
  const orm = { em: { fork: () => em } };
  const logger = { setContext: jest.fn(), info: jest.fn() };
  const service = new PracticeDefaultServicesSeedService(
    orm as never,
    logger as never,
  );
  return { service, em, creadas: created };
}

describe('PracticeDefaultServicesSeedService', () => {
  it('siembra el servicio en la práctica que no lo tiene', async () => {
    const d = build([{ id: 'p1' }], []);

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
    const d = build([{ id: 'p1' }, { id: 'p2' }], ['p1']);

    const res = await d.service.run();

    expect(res).toEqual({ inserted: 1 });
    expect(d.creadas.map((row) => row.practiceId)).toEqual(['p2']);
  });

  it('sin prácticas no consulta el catálogo ni escribe', async () => {
    const d = build([], []);

    const res = await d.service.run();

    expect(res).toEqual({ inserted: 0 });
    expect(d.em.find).toHaveBeenCalledTimes(1);
    expect(d.em.flush).not.toHaveBeenCalled();
  });
});
