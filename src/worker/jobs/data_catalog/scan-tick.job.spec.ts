import { jest } from '@jest/globals';
import { CatalogScanTickJob } from './scan-tick.job';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del job, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const IMPORTACION = {
  inventory: { hash: 'abc123' },
  operations: { added: 1, changed: 0, notObserved: 0 },
  impacts: { written: 2, skippedNotCataloged: 0, skippedUnresolved: 0 },
};

function build(runNext: Record<string, unknown>) {
  const api = {
    post: mockFn(async (ruta: string) =>
      ruta === '/internal/catalog/scans/run-next' ? runNext : IMPORTACION,
    ),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new CatalogScanTickJob(api as any, logger as any);
  return { job, api, logger };
}

const rutas = (api: { post: { mock: { calls: unknown[][] } } }): unknown[] =>
  api.post.mock.calls.map(([ruta]) => ruta);

describe('CatalogScanTickJob', () => {
  it('tras un escaneo que terminó bien importa el inventario', async () => {
    const d = build({ claimed: 1, scanId: 's1', status: 'SUCCEEDED' });
    await d.job.tick();
    expect(rutas(d.api)).toEqual([
      '/internal/catalog/scans/run-next',
      '/internal/catalog/inventory/import',
    ]);
  });

  it('sin escaneo que reclamar no importa', async () => {
    const d = build({ claimed: 0 });
    await d.job.tick();
    expect(rutas(d.api)).toEqual(['/internal/catalog/scans/run-next']);
  });

  it('si el escaneo falló no importa: los objetos no están al día', async () => {
    const d = build({ claimed: 1, scanId: 's1', status: 'FAILED' });
    await d.job.tick();
    expect(rutas(d.api)).toEqual(['/internal/catalog/scans/run-next']);
  });

  it('si el escaneo perdió su lease no importa', async () => {
    const d = build({
      claimed: 1,
      scanId: 's1',
      status: 'SUCCEEDED',
      fenced: true,
    });
    await d.job.tick();
    expect(rutas(d.api)).toEqual(['/internal/catalog/scans/run-next']);
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('deja constancia de la importación con la huella y los contadores', async () => {
    const d = build({ claimed: 1, scanId: 's1', status: 'SUCCEEDED' });
    await d.job.tick();
    expect(d.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'worker.data_catalog.inventory-import',
        inventoryHash: 'abc123',
        impacts: IMPORTACION.impacts,
      }),
      'Catalog inventory imported',
    );
  });

  it('una importación que falla (p. ej. 503 sin inventario) no tumba el worker', async () => {
    const d = build({ claimed: 1, scanId: 's1', status: 'SUCCEEDED' });
    d.api.post.mockImplementation(async (ruta: string) => {
      if (ruta === '/internal/catalog/inventory/import') throw new Error('503');
      return { claimed: 1, scanId: 's1', status: 'SUCCEEDED' };
    });
    await expect(d.job.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });
});
