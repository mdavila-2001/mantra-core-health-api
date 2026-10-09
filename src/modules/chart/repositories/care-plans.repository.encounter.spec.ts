import { CarePlansRepository } from './care-plans.repository';
import { CarePlans } from '../entities';

/**
 * `findByEncounter` (C.4): el sello del encuentro necesita un orden
 * determinista para que el mismo contenido produzca siempre el mismo hash,
 * y las actividades de cada plan resueltas en lote (no N+1).
 */
describe('CarePlansRepository.findByEncounter', () => {
  function rememberingEm(activities: unknown[] = []) {
    const calls: unknown[] = [];
    return {
      llamadas: calls,
      em: {
        find: (...args: unknown[]) => {
          calls.push(args);
          const [entidad] = args;
          if (entidad === CarePlans) {
            return Promise.resolve([{ id: 'cp-1', createdAt: new Date() }]);
          }
          return Promise.resolve(activities);
        },
      } as never,
    };
  }

  it('filtra los planes por el encuentro y ordena por createdAt, id', async () => {
    const { em, llamadas } = rememberingEm();

    await new CarePlansRepository().findByEncounter(em, 'enc-1');

    expect(llamadas[0]).toEqual([
      CarePlans,
      { encounterId: 'enc-1' },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    ]);
  });

  it('resuelve las actividades del plan en la misma llamada', async () => {
    const activity = { id: 'a-1', carePlanId: 'cp-1' };
    const { em } = rememberingEm([activity]);

    const [plan] = await new CarePlansRepository().findByEncounter(em, 'enc-1');

    expect(plan.activities).toEqual([activity]);
  });
});
