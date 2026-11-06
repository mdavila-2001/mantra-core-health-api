import { jest } from '@jest/globals';
import { CatalogFitTickJob } from './fit-tick.job';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del job, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(respuesta: unknown | (() => Promise<unknown>)) {
  const api = {
    post: mockFn(async () =>
      typeof respuesta === 'function'
        ? (respuesta as () => Promise<unknown>)()
        : respuesta,
    ),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
    debug: mockFn(),
  };
  return { job: new CatalogFitTickJob(api as any, logger as any), api, logger };
}

describe('CatalogFitTickJob', () => {
  it('pide la corrida a la API interna y deja constancia del veredicto', async () => {
    const d = build({
      runId: 'r1',
      status: 'COMPLETADA',
      created: true,
      verdict: 'AJUSTADA',
      failedChecks: 0,
      blindSpots: 1,
    });
    await d.job.tick();
    expect(d.api.post).toHaveBeenCalledWith('/internal/catalog/fit/run', {});
    expect(d.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'worker.data_catalog.fit-tick',
        verdict: 'AJUSTADA',
        blindSpots: 1,
      }),
      'Sonda de ajuste del catálogo corrida',
    );
    expect(d.logger.error).not.toHaveBeenCalled();
  });

  it('un catálogo desajustado NO es un tick fallido: se registra con warn, sin error', async () => {
    const d = build({
      runId: 'r1',
      status: 'COMPLETADA',
      created: true,
      verdict: 'DESAJUSTADA',
      failedChecks: 4,
      blindSpots: 0,
    });
    await d.job.tick();
    expect(d.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ verdict: 'DESAJUSTADA', failedChecks: 4 }),
      'El catálogo está desajustado de la realidad',
    );
    expect(d.logger.error).not.toHaveBeenCalled();
  });

  it('una corrida FALLIDA sí falla el tick (queda en el registro de salud del worker)', async () => {
    const d = build({
      runId: 'r1',
      status: 'FALLIDA',
      created: true,
      errorCode: 'RangeError',
    });
    await d.job.tick();
    // runTick absorbe el error para no tumbar el scheduler, pero lo registra como tick fallido
    expect(d.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'worker.data_catalog.fit-tick',
        err: expect.objectContaining({
          message: expect.stringContaining('RangeError'),
        }),
      }),
      'Worker tick failed',
    );
  });

  it('si la API no responde el tick falla y el worker sigue vivo', async () => {
    const d = build(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(d.job.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });
});
