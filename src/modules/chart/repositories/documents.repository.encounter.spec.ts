import { DocumentsRepository } from './documents.repository';
import { DocumentRecords } from '../entities';

/**
 * `findByEncounter` (C.4): el sello del encuentro necesita un orden
 * determinista para que el mismo contenido produzca siempre el mismo hash,
 * y los archivos de cada documento resueltos en lote (no N+1).
 */
describe('DocumentsRepository.findByEncounter', () => {
  function emQueRecuerda(files: unknown[] = []) {
    const llamadas: unknown[] = [];
    return {
      llamadas,
      em: {
        find: (...args: unknown[]) => {
          llamadas.push(args);
          const [entidad] = args;
          if (entidad === DocumentRecords) {
            return Promise.resolve([{ id: 'doc-1', createdAt: new Date() }]);
          }
          return Promise.resolve(files);
        },
      } as never,
    };
  }

  it('filtra los documentos por el encuentro y ordena por createdAt, id', async () => {
    const { em, llamadas } = emQueRecuerda();

    await new DocumentsRepository().findByEncounter(em, 'enc-1');

    expect(llamadas[0]).toEqual([
      DocumentRecords,
      { encounterId: 'enc-1' },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    ]);
  });

  it('resuelve los archivos del documento en la misma llamada', async () => {
    const archivo = { fileId: 'f-1', documentRecordId: 'doc-1' };
    const { em } = emQueRecuerda([archivo]);

    const [documento] = await new DocumentsRepository().findByEncounter(
      em,
      'enc-1',
    );

    expect(documento.files).toEqual([archivo]);
  });
});
