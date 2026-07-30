import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ApplyRetentionJob } from './apply-retention.job';

function build(env: any = {}) {
  const api = { get: mockFn(), post: mockFn(), workerId: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const workerEnv = { tsRetentionPolicies: {}, ...env };
  const job = new ApplyRetentionJob(api as any, logger as any, workerEnv);
  return { job, api, logger, workerEnv };
}

describe('ApplyRetentionJob', () => {
  it('no llama a la API si no hay políticas configuradas (opt-in, vacío por defecto)', async () => {
    const d = build();

    await d.job.tick();

    expect(d.api.post).not.toHaveBeenCalled();
  });

  it('aplica retención solo a las tablas explícitamente configuradas', async () => {
    const d = build({
      tsRetentionPolicies: { location_ping_series: '30 days' },
    });
    d.api.post.mockResolvedValue({
      table: 'location_ping_series',
      chunksDropped: 2,
      droppedChunks: ['c1', 'c2'],
    });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(1);
    expect(d.api.post).toHaveBeenCalledWith(
      '/ts/admin/retention/policies',
      expect.objectContaining({
        table: 'location_ping_series',
        olderThan: '30 days',
      }),
    );
    expect(d.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ chunksDropped: 2 }),
      expect.any(String),
    );
  });

  it('ignora una tabla configurada que no existe en TIMESERIES_TABLES', async () => {
    const d = build({
      tsRetentionPolicies: { not_a_real_table: '30 days' },
    });

    await d.job.tick();

    expect(d.api.post).not.toHaveBeenCalled();
    expect(d.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ table: 'not_a_real_table' }),
      expect.any(String),
    );
  });

  it('un fallo en una tabla no impide aplicar retención al resto', async () => {
    const d = build({
      tsRetentionPolicies: {
        location_ping_series: '30 days',
        telemetry_event_series: '180 days',
      },
    });
    d.api.post
      .mockRejectedValueOnce(new Error('API caída'))
      .mockResolvedValueOnce({
        table: 'telemetry_event_series',
        chunksDropped: 0,
        droppedChunks: [],
      });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(2);
  });
});
