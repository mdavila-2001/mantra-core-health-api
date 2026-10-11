import { ClinicalNotesRepository } from './clinical-notes.repository';
import { ClinicalNoteHeaders } from '../entities';

/**
 * `findHeadersByEncounter` (C.4): el sello del encuentro necesita un orden
 * determinista para que el mismo contenido produzca siempre el mismo hash.
 */
describe('ClinicalNotesRepository.findHeadersByEncounter', () => {
  function rememberingEm() {
    const calls: unknown[] = [];
    return {
      llamadas: calls,
      em: {
        find: (...args: unknown[]) => {
          calls.push(args);
          return Promise.resolve([]);
        },
      } as never,
    };
  }

  it('filtra por el encuentro y ordena por createdAt, id', async () => {
    const { em, llamadas: calls } = rememberingEm();

    await new ClinicalNotesRepository().findHeadersByEncounter(em, 'enc-1');

    expect(calls[0]).toEqual([
      ClinicalNoteHeaders,
      { encounterId: 'enc-1' },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    ]);
  });
});
