import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids '@jest/globals' strict typings.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { RankingScoreJob } from './ranking-score.job';

function build() {
  const api = { get: mockFn(), post: mockFn(), workerId: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new RankingScoreJob(api as any, logger as any);
  return { job, api, logger };
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

describe('RankingScoreJob', () => {
  it('no aplica nada si el lote pendiente viene vacío', async () => {
    const d = build();
    d.api.get.mockResolvedValue({ items: [] });

    await d.job.tick();

    expect(d.api.get).toHaveBeenCalledWith(
      '/internal/community/feed/ranking/pending',
    );
    expect(d.api.post).not.toHaveBeenCalled();
  });

  it('puntúa cada ítem descubierto y aplica el lote entero de una vez', async () => {
    const d = build();
    d.api.get.mockResolvedValue({
      items: [
        {
          feedItemId: 'item-1',
          postId: 'post-1',
          ownerProfileId: 'owner-1',
          authorProfileId: 'autor-1',
          itemCreatedAt: hoursAgo(1),
          postPublishedAt: hoursAgo(1),
          reactionCount: 0,
          commentCount: 0,
        },
      ],
    });
    d.api.post.mockResolvedValue({ updated: 1 });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(1);
    const [url, body] = d.api.post.mock.calls[0];
    expect(url).toBe('/internal/community/feed/ranking/apply');
    expect(body.updates).toHaveLength(1);
    expect(body.updates[0].feedItemId).toBe('item-1');
    expect(typeof body.updates[0].rankScore).toBe('string');
    expect(Number(body.updates[0].rankScore)).toBeGreaterThan(0);
  });

  it('un post viejo con mucha interacción puntúa más que el mismo post sin interacción', async () => {
    const d = build();
    const viejoSinInteraccion = {
      feedItemId: 'item-viejo-sin',
      postId: 'post-viejo',
      ownerProfileId: 'owner-1',
      authorProfileId: 'autor-1',
      itemCreatedAt: hoursAgo(240),
      postPublishedAt: hoursAgo(240),
      reactionCount: 0,
      commentCount: 0,
    };
    const viejoConInteraccion = {
      ...viejoSinInteraccion,
      feedItemId: 'item-viejo-con',
      reactionCount: 80,
      commentCount: 40,
    };
    d.api.get.mockResolvedValue({
      items: [viejoSinInteraccion, viejoConInteraccion],
    });
    d.api.post.mockResolvedValue({ updated: 2 });

    await d.job.tick();

    const [, body] = d.api.post.mock.calls[0];
    const puntajePorId = new Map<string, number>(
      (body.updates as any[]).map((u): [string, number] => [
        u.feedItemId,
        Number(u.rankScore),
      ]),
    );
    expect(puntajePorId.get('item-viejo-con')).toBeGreaterThan(
      puntajePorId.get('item-viejo-sin')!,
    );
  });

  it('un post reciente sin interacción puntúa más que uno mucho más viejo, también sin interacción', async () => {
    const d = build();
    const reciente = {
      feedItemId: 'item-reciente',
      postId: 'post-reciente',
      ownerProfileId: 'owner-1',
      authorProfileId: 'autor-1',
      itemCreatedAt: hoursAgo(1),
      postPublishedAt: hoursAgo(1),
      reactionCount: 0,
      commentCount: 0,
    };
    const antiguo = {
      ...reciente,
      feedItemId: 'item-antiguo',
      itemCreatedAt: hoursAgo(720),
      postPublishedAt: hoursAgo(720),
    };
    d.api.get.mockResolvedValue({ items: [reciente, antiguo] });
    d.api.post.mockResolvedValue({ updated: 2 });

    await d.job.tick();

    const [, body] = d.api.post.mock.calls[0];
    const puntajePorId = new Map<string, number>(
      (body.updates as any[]).map((u): [string, number] => [
        u.feedItemId,
        Number(u.rankScore),
      ]),
    );
    expect(puntajePorId.get('item-reciente')).toBeGreaterThan(
      puntajePorId.get('item-antiguo')!,
    );
  });

  it('un post sin postPublishedAt no rompe el cálculo (recencia en 0)', async () => {
    const d = build();
    d.api.get.mockResolvedValue({
      items: [
        {
          feedItemId: 'item-huerfano',
          postId: 'post-borrado',
          ownerProfileId: 'owner-1',
          authorProfileId: 'owner-1',
          itemCreatedAt: hoursAgo(1),
          postPublishedAt: null,
          reactionCount: 5,
          commentCount: 1,
        },
      ],
    });
    d.api.post.mockResolvedValue({ updated: 1 });

    await expect(d.job.tick()).resolves.toBeUndefined();
    const [, body] = d.api.post.mock.calls[0];
    expect(Number.isNaN(Number(body.updates[0].rankScore))).toBe(false);
  });

  it('un fallo al descubrir el lote no lanza (runTick lo absorbe)', async () => {
    const d = build();
    d.api.get.mockRejectedValue(new Error('API caída'));

    await expect(d.job.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalledTimes(1);
    expect(d.api.post).not.toHaveBeenCalled();
  });
});
