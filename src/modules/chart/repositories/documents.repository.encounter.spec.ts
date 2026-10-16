import { DocumentsRepository } from './documents.repository';
import { DocumentRecords } from '../entities';

/**
 * `findByEncounter` (C.4): el sello del encuentro necesita un orden
 * determinista para que el mismo contenido produzca siempre el mismo hash,
 * y los archivos de cada documento resueltos en lote (no N+1).
 */
describe('DocumentsRepository.findByEncounter', () => {
  function rememberingEm(files: unknown[] = []) {
    const calls: unknown[] = [];
    return {
      llamadas: calls,
      em: {
        find: (...args: unknown[]) => {
          calls.push(args);
          const [entity] = args;
          if (entity === DocumentRecords) {
            return Promise.resolve([{ id: 'doc-1', createdAt: new Date() }]);
          }
          return Promise.resolve(files);
        },
      } as never,
    };
  }

  it('filtra los documentos por el encuentro y ordena por createdAt, id', async () => {
    const { em, llamadas: calls } = rememberingEm();

    await new DocumentsRepository().findByEncounter(em, 'enc-1');

    expect(calls[0]).toEqual([
      DocumentRecords,
      { encounterId: 'enc-1' },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    ]);
  });

  it('resuelve los archivos del documento en la misma llamada', async () => {
    const file = { fileId: 'f-1', documentRecordId: 'doc-1' };
    const { em } = rememberingEm([file]);

    const [document] = await new DocumentsRepository().findByEncounter(
      em,
      'enc-1',
    );

    expect(document.files).toEqual([file]);
  });
});
