import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { RefreshRollupsJob } from './refresh-rollups.job';

function build(env: any = {}) {
  const api = { get: mockFn(), post: mockFn(), workerId: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const workerEnv = { tsRollupRefreshWindowHours: 2, ...env };
  const job = new RefreshRollupsJob(api as any, logger as any, workerEnv);
  return { job, api, logger, workerEnv };
}

describe('RefreshRollupsJob', () => {
  it('refresca los 3 rollups declarados con una ventana reciente', async () => {
    const d = build();
    d.api.post.mockResolvedValue({
      rollup: 'continuous_sli_hourly',
      bucketsMaterialized: 5,
    });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(3);
    const [path, body] = d.api.post.mock.calls[0];
    expect(path).toBe('/ts/admin/rollups/continuous_sli_hourly/refresh');
    expect(body).toEqual(
      expect.objectContaining({
        from: expect.any(String),
        to: expect.any(String),
        batchId: expect.any(String),
        tenantId: expect.any(String),
      }),
    );
    expect(new Date(body.to).getTime() - new Date(body.from).getTime()).toBe(
      2 * 3_600_000,
    );
  });

  it('un fallo en un rollup no impide refrescar el resto', async () => {
    const d = build();
    d.api.post
      .mockRejectedValueOnce(new Error('API caída'))
      .mockResolvedValue({ rollup: 'x', bucketsMaterialized: 0 });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(3);
  });
});
