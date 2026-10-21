import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityFeedService } from './community-feed.service';

const actor = { id: 'svc-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const feedRepo = {
    findByOwnerSource: mockFn(),
    create: mockFn(),
    listFannedOutSourceRefs: mockFn().mockResolvedValue([]),
    listPageForRanking: mockFn().mockResolvedValue([]),
    applyRankScores: mockFn().mockResolvedValue(0),
  };
  const postsRepo = {
    listPublishedSince: mockFn().mockResolvedValue([]),
    listByIds: mockFn().mockResolvedValue([]),
  };
  const followsRepo = {
    listFollowerIdsOf: mockFn().mockResolvedValue([]),
  };
  const reactionsRepo = {
    summarizeByTargets: mockFn().mockResolvedValue([]),
  };
  const commentsRepo = {
    countByTargets: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityFeedService(
    em as any,
    feedRepo as any,
    postsRepo as any,
    followsRepo as any,
    reactionsRepo as any,
    commentsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    feedRepo,
    postsRepo,
    followsRepo,
    reactionsRepo,
    commentsRepo,
  };
}

describe('CommunityFeedService (UC-19-15)', () => {
  it('fans out to followers that do not yet have the item', async () => {
    const d = build();
    d.feedRepo.findByOwnerSource.mockResolvedValue(null);
    const res = await d.service.rebuild(
      { sourceRefId: 'post1', followerProfileIds: ['a', 'b', 'c'] },
      actor,
    );
    expect(res).toEqual({ itemsCreated: 3 });
    expect(d.feedRepo.create).toHaveBeenCalledTimes(3);
  });

  it('is idempotent: skips followers that already have the item', async () => {
    const d = build();
    d.feedRepo.findByOwnerSource
      .mockResolvedValueOnce({ id: 'existing' })
      .mockResolvedValueOnce(null);
    const res = await d.service.rebuild(
      { sourceRefId: 'post1', followerProfileIds: ['a', 'b'] },
      actor,
    );
    expect(res).toEqual({ itemsCreated: 1 });
    expect(d.feedRepo.create).toHaveBeenCalledTimes(1);
  });

  describe('pendingFanout (descubrimiento del lote)', () => {
    const options = {
      withinHours: 24,
      limit: 50,
      followersPerPost: 5000,
    };

    it('devuelve cada post pendiente con sus seguidores', async () => {
      const d = build();
      d.postsRepo.listPublishedSince.mockResolvedValue([
        { id: 'post1', authorPublicProfileId: 'autor1' },
      ]);
      d.followsRepo.listFollowerIdsOf.mockResolvedValue(['seg1', 'seg2']);

      const res = await d.service.pendingFanout(options);

      expect(res.items).toEqual([
        {
          postId: 'post1',
          authorProfileId: 'autor1',
          followerProfileIds: ['seg1', 'seg2'],
        },
      ]);
    });

    it('descarta los posts que ya se repartieron', async () => {
      const d = build();
      d.postsRepo.listPublishedSince.mockResolvedValue([
        { id: 'post1', authorPublicProfileId: 'autor1' },
        { id: 'post2', authorPublicProfileId: 'autor2' },
      ]);
      d.feedRepo.listFannedOutSourceRefs.mockResolvedValue(['post1']);
      d.followsRepo.listFollowerIdsOf.mockResolvedValue(['seg1']);

      const res = await d.service.pendingFanout(options);

      expect(res.items).toHaveLength(1);
      expect(res.items[0].postId).toBe('post2');
    });

    it('un post sin seguidores igual sale del lote, con lista vacía', async () => {
      const d = build();
      d.postsRepo.listPublishedSince.mockResolvedValue([
        { id: 'post1', authorPublicProfileId: 'autor1' },
      ]);
      d.followsRepo.listFollowerIdsOf.mockResolvedValue([]);

      const res = await d.service.pendingFanout(options);

      expect(res.items[0].followerProfileIds).toEqual([]);
    });

    it('sin posts recientes no consulta seguidores ni el feed', async () => {
      const d = build();
      const res = await d.service.pendingFanout(options);

      expect(res).toEqual({ items: [] });
      expect(d.feedRepo.listFannedOutSourceRefs).not.toHaveBeenCalled();
      expect(d.followsRepo.listFollowerIdsOf).not.toHaveBeenCalled();
    });
  });

  describe('ranking del feed (UC-19-16)', () => {
    it('pendingRanking junta recencia, reacciones y comentarios por post', async () => {
      const d = build();
      const creado = new Date('2026-10-20T10:00:00.000Z');
      const publicado = new Date('2026-10-20T09:00:00.000Z');
      d.feedRepo.listPageForRanking.mockResolvedValue([
        {
          id: 'fi-1',
          sourceRefId: 'post-1',
          ownerProfileId: 'own-1',
          createdAt: creado,
        },
        {
          id: 'fi-2',
          sourceRefId: 'post-2',
          ownerProfileId: 'own-2',
          createdAt: creado,
        },
      ]);
      d.postsRepo.listByIds.mockResolvedValue([
        {
          id: 'post-1',
          authorPublicProfileId: 'autor-1',
          publishedAt: publicado,
        },
      ]);
      d.reactionsRepo.summarizeByTargets.mockResolvedValue([
        { reactableRefId: 'post-1', count: 2 },
        { reactableRefId: 'post-1', count: 3 },
      ]);
      d.commentsRepo.countByTargets.mockResolvedValue([
        { commentableRefId: 'post-1', count: 4 },
      ]);

      const res = await d.service.pendingRanking(10);

      expect(d.feedRepo.listPageForRanking).toHaveBeenCalledWith(
        expect.anything(),
        10,
      );
      expect(res.items).toEqual([
        {
          feedItemId: 'fi-1',
          postId: 'post-1',
          ownerProfileId: 'own-1',
          authorProfileId: 'autor-1',
          itemCreatedAt: creado.toISOString(),
          postPublishedAt: publicado.toISOString(),
          reactionCount: 5,
          commentCount: 4,
        },
        {
          feedItemId: 'fi-2',
          postId: 'post-2',
          ownerProfileId: 'own-2',
          authorProfileId: 'own-2',
          itemCreatedAt: creado.toISOString(),
          postPublishedAt: null,
          reactionCount: 0,
          commentCount: 0,
        },
      ]);
    });

    it('pendingRanking con lote vacío no consulta posts ni interacciones', async () => {
      const d = build();
      const res = await d.service.pendingRanking(10);
      expect(res).toEqual({ items: [] });
      expect(d.postsRepo.listByIds).not.toHaveBeenCalled();
      expect(d.reactionsRepo.summarizeByTargets).not.toHaveBeenCalled();
    });

    it('applyRanking persiste cada puntaje con el id del ítem', async () => {
      const d = build();
      d.feedRepo.applyRankScores.mockResolvedValue(2);
      const res = await d.service.applyRanking({
        updates: [
          { feedItemId: 'fi-1', rankScore: '0.91' },
          { feedItemId: 'fi-2', rankScore: '0.12' },
        ],
      });
      expect(res).toEqual({ updated: 2 });
      expect(d.feedRepo.applyRankScores).toHaveBeenCalledWith(
        expect.anything(),
        [
          { id: 'fi-1', rankScore: '0.91' },
          { id: 'fi-2', rankScore: '0.12' },
        ],
      );
    });
  });
});
