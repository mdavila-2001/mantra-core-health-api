import { MedicationRequestsRepository } from './medication-requests.repository';
import { MedicationRequests } from '../entities';

/**
 * `findByEncounter` (C.4): el sello del encuentro necesita un orden
 * determinista para que el mismo contenido produzca siempre el mismo hash.
 */
describe('MedicationRequestsRepository.findByEncounter', () => {
  function emQueRecuerda() {
    const llamadas: unknown[] = [];
    return {
      llamadas,
      em: {
        find: (...args: unknown[]) => {
          llamadas.push(args);
          return Promise.resolve([]);
        },
      } as never,
    };
  }

  it('filtra por el encuentro y ordena por createdAt, id', async () => {
    const { em, llamadas } = emQueRecuerda();

    await new MedicationRequestsRepository().findByEncounter(em, 'enc-1');

    expect(llamadas[0]).toEqual([
      MedicationRequests,
      { encounterId: 'enc-1' },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    ]);
  });
});
