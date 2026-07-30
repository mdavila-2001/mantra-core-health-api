import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ReleaseExpiryJob } from './release-expiry.job';

function build() {
  const api = { get: mockFn(), post: mockFn(), workerId: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new ReleaseExpiryJob(api as any, logger as any);
  return { job, api, logger };
}

const expired = { requestId: 'req-1', expiresAt: '2026-01-01T00:00:00.000Z' };

describe('ReleaseExpiryJob', () => {
  it('no llama a revoke si no hay releases vencidos', async () => {
    const d = build();
    d.api.get.mockResolvedValue({ releases: [] });

    await d.job.tick();

    expect(d.api.get).toHaveBeenCalledWith(
      '/research/dataset-releases/expired',
      { limit: 50 },
    );
    expect(d.api.post).not.toHaveBeenCalled();
  });

  it('revoca cada release vencido descubierto', async () => {
    const d = build();
    d.api.get.mockResolvedValue({ releases: [expired] });
    d.api.post.mockResolvedValue({
      id: expired.requestId,
      status: 'expired',
      alreadyClosed: false,
    });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledWith(
      `/research/dataset-releases/${expired.requestId}/revoke`,
      { expired: true },
    );
    expect(d.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'worker.lakehouse.release-expiry',
        requestId: expired.requestId,
      }),
      expect.any(String),
    );
  });

  it('no registra info si el release ya estaba cerrado (idempotente, sin ruido)', async () => {
    const d = build();
    d.api.get.mockResolvedValue({ releases: [expired] });
    d.api.post.mockResolvedValue({
      id: expired.requestId,
      status: 'expired',
      alreadyClosed: true,
    });

    await d.job.tick();

    expect(d.logger.info).not.toHaveBeenCalled();
  });

  it('un fallo al revocar uno no impide intentar el resto', async () => {
    const d = build();
    const second = { requestId: 'req-2', expiresAt: expired.expiresAt };
    d.api.get.mockResolvedValue({ releases: [expired, second] });
    d.api.post
      .mockRejectedValueOnce(new Error('API caída'))
      .mockResolvedValueOnce({
        id: second.requestId,
        status: 'expired',
        alreadyClosed: false,
      });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(2);
  });

  it('un fallo al listar no lanza (runTick lo absorbe)', async () => {
    const d = build();
    d.api.get.mockRejectedValue(new Error('API caída'));

    await expect(d.job.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });
});
