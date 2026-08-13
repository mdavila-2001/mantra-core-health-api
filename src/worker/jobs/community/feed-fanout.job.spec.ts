import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { FeedFanoutJob } from './feed-fanout.job';

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
  const job = new FeedFanoutJob(api as any, logger as any);
  return { job, api, logger };
}

const pendingPost = {
  postId: 'post-1',
  authorProfileId: 'autor-1',
  followerProfileIds: ['seg-1', 'seg-2'],
};

describe('FeedFanoutJob', () => {
  it('no reparte nada si el lote pendiente viene vacío', async () => {
    const d = build();
    d.api.get.mockResolvedValue({ items: [] });

    await d.job.tick();

    expect(d.api.get).toHaveBeenCalledWith('/internal/community/feed/pending');
    expect(d.api.post).not.toHaveBeenCalled();
  });

  it('reparte cada post descubierto con sus seguidores', async () => {
    const d = build();
    d.api.get.mockResolvedValue({ items: [pendingPost] });
    d.api.post.mockResolvedValue({ itemsCreated: 2 });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(1);
    expect(d.api.post).toHaveBeenCalledWith(
      '/internal/community/feed/rebuild',
      {
        sourceRefId: 'post-1',
        followerProfileIds: ['seg-1', 'seg-2'],
        origin: 'FOLLOWING',
      },
    );
  });

  it('un fallo repartiendo un post no impide intentar el resto', async () => {
    const d = build();
    const otro = { ...pendingPost, postId: 'post-2' };
    d.api.get.mockResolvedValue({ items: [pendingPost, otro] });
    d.api.post
      .mockRejectedValueOnce(new Error('500 en el reparto'))
      .mockResolvedValueOnce({ itemsCreated: 2 });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(2);
    expect(d.logger.error).toHaveBeenCalledTimes(1);
  });

  it('un fallo al descubrir el lote no lanza (runTick lo absorbe)', async () => {
    const d = build();
    d.api.get.mockRejectedValue(new Error('API caída'));

    await expect(d.job.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalledTimes(1);
    expect(d.api.post).not.toHaveBeenCalled();
  });
});
