import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SearchIndexerJob } from './search-indexer.job';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param health - Estado que devuelve `/internal/community/search/health`.
 * @returns Resultado de build.
 */
function build(health: Record<string, unknown>) {
  const api = {
    get: mockFn().mockResolvedValue(health),
    post: mockFn().mockResolvedValue({
      indexed: 8,
      total: 8,
      confirmed: 8,
      errors: false,
      summary: 'indexados 8 de 8',
    }),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new SearchIndexerJob(api as any, logger as any);
  return { job, api, logger };
}

describe('SearchIndexerJob', () => {
  it('no hace nada cuando el índice ya coincide con la base', async () => {
    const d = build({
      available: true,
      profiles: 8,
      documents: 8,
      serving: true,
    });

    await d.job.tick();

    // Reindexar cada minuto sería tirar el índice sesenta veces por hora y
    // dejar el buscador a oscuras entre el borrado y el primer lote.
    expect(d.api.post).not.toHaveBeenCalled();
  });

  it('rellena con upsert cuando faltan documentos', async () => {
    const d = build({
      available: true,
      profiles: 8,
      documents: 3,
      serving: true,
    });

    await d.job.tick();

    const [[ruta, cuerpo]] = d.api.post.mock.calls;
    expect(ruta).toBe('/internal/community/search/reindex');
    // Faltan documentos: un upsert los agrega sin dejar el índice vacío.
    expect(cuerpo).toEqual({ recreate: false });
  });

  it('recrea cuando el índice tiene documentos de más', async () => {
    const d = build({
      available: true,
      profiles: 3,
      documents: 8,
      serving: true,
    });

    await d.job.tick();

    const [[, cuerpo]] = d.api.post.mock.calls;
    // Sobra algo —un perfil despublicado que sigue apareciendo a anónimos— y
    // eso sólo se arregla recreando.
    expect(cuerpo).toEqual({ recreate: true });
  });

  it('con el índice caído avisa y no reindexa: la búsqueda ya degrada a SQL', async () => {
    const d = build({
      available: false,
      profiles: 8,
      documents: null,
      serving: false,
    });

    await d.job.tick();

    expect(d.api.post).not.toHaveBeenCalled();
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('un índice vacío en un directorio vacío no dispara nada', async () => {
    const d = build({
      available: true,
      profiles: 0,
      documents: 0,
      serving: false,
    });

    await d.job.tick();

    expect(d.api.post).not.toHaveBeenCalled();
  });
});
