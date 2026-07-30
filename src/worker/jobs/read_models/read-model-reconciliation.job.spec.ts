import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ReadModelReconciliationJob } from './read-model-reconciliation.job';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 */
function build() {
  const api = { get: mockFn(), post: mockFn(), workerId: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new ReadModelReconciliationJob(api as any, logger as any);
  return { job, api, logger };
}

const staleItem = {
  definitionId: 'def-1',
  schemaName: 'read_models',
  objectName: 'crm_view',
  lastRefreshedAt: null,
  stalenessSeconds: 999,
  stale: true,
};

const freshItem = {
  definitionId: 'def-2',
  schemaName: 'read_models',
  objectName: 'ok_view',
  lastRefreshedAt: new Date().toISOString(),
  stalenessSeconds: 1,
  stale: false,
};

describe('ReadModelReconciliationJob', () => {
  it('no llama a reconcile si no hay definiciones stale', async () => {
    const d = build();
    d.api.get.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      items: [freshItem],
    });

    await d.job.tick();

    expect(d.api.get).toHaveBeenCalledWith('/read-models/health');
    expect(d.api.post).not.toHaveBeenCalled();
  });

  it('reconcilia cada definición stale descubierta por /read-models/health', async () => {
    const d = build();
    d.api.get.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      items: [staleItem, freshItem],
    });
    d.api.post.mockResolvedValue({
      id: 'run-1',
      readModelDefinitionId: staleItem.definitionId,
      result: 'RM_RESULT_REPAIRED',
    });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(1);
    expect(d.api.post).toHaveBeenCalledWith(
      `/read-models/${staleItem.definitionId}/reconcile`,
    );
  });

  it('un fallo de reconcile en un ítem no impide intentar el resto', async () => {
    const d = build();
    const secondStale = { ...staleItem, definitionId: 'def-3' };
    d.api.get.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      items: [staleItem, secondStale],
    });
    d.api.post
      .mockRejectedValueOnce(new Error('422 not a materialized view'))
      .mockResolvedValueOnce({
        id: 'run-2',
        readModelDefinitionId: secondStale.definitionId,
        result: 'RM_RESULT_REPAIRED',
      });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(2);
    expect(d.logger.error).toHaveBeenCalledTimes(1);
  });

  it('un fallo al listar la salud no lanza (runTick lo absorbe)', async () => {
    const d = build();
    d.api.get.mockRejectedValue(new Error('API caída'));

    await expect(d.job.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalledTimes(1);
    expect(d.api.post).not.toHaveBeenCalled();
  });
});
