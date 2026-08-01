import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CompressChunksJob } from './compress-chunks.job';

function build(env: any = {}) {
  const api = { get: mockFn(), post: mockFn(), workerId: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const workerEnv = { tsCompressionOlderThan: '7 days', ...env };
  const job = new CompressChunksJob(api as any, logger as any, workerEnv);
  return { job, api, logger, workerEnv };
}

describe('CompressChunksJob', () => {
  it('comprime cada tabla compresible con el umbral configurado', async () => {
    const d = build();
    d.api.post.mockResolvedValue({
      table: 'device_raw_reading_series',
      chunksCompressed: 2,
      remainingChunks: [],
    });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledWith('/ts/admin/compression/run', {
      table: 'device_raw_reading_series',
      olderThan: '7 days',
      batchId: expect.any(String),
      tenantId: expect.any(String),
    });
    // 12 tablas declaran segmentación de compresión.
    expect(d.api.post).toHaveBeenCalledTimes(12);
  });

  it('pagina dentro de una misma tabla mientras queden chunks candidatos', async () => {
    const d = build();
    d.api.post
      .mockResolvedValueOnce({
        table: 'device_raw_reading_series',
        chunksCompressed: 10,
        remainingChunks: ['chunk-x'],
      })
      .mockResolvedValue({
        table: 'device_raw_reading_series',
        chunksCompressed: 3,
        remainingChunks: [],
      });

    await d.job.tick();

    const calledForTable = d.api.post.mock.calls.filter(
      (call: any) => call[1].table === 'device_raw_reading_series',
    );
    expect(calledForTable.length).toBe(2);
  });

  it('un fallo en una tabla no impide comprimir el resto', async () => {
    const d = build();
    d.api.post.mockRejectedValueOnce(new Error('API caída')).mockResolvedValue({
      table: 'x',
      chunksCompressed: 0,
      remainingChunks: [],
    });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(12);
  });
});
