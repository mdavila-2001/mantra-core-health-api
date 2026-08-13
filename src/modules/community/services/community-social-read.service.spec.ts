import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunitySocialReadService } from './community-social-read.service';
import { ResourceNotFoundException } from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => ({})) };
  const profilesRepo = {
    findById: mockFn(),
    listBadgesBySubject: mockFn().mockResolvedValue([]),
  };
  const postsRepo = {
    findById: mockFn(),
    listByAuthorPage: mockFn().mockResolvedValue([]),
    listMedia: mockFn().mockResolvedValue([]),
    listHashtags: mockFn().mockResolvedValue([]),
    listMentions: mockFn().mockResolvedValue([]),
  };
  const commentsRepo = {
    listRootsPage: mockFn().mockResolvedValue([]),
    listRepliesOf: mockFn().mockResolvedValue([]),
  };
  const reactionsRepo = {
    summarizeByTarget: mockFn().mockResolvedValue([]),
    findByActorTarget: mockFn().mockResolvedValue(null),
  };
  const bookmarksRepo = { listByProfilePage: mockFn().mockResolvedValue([]) };
  const followsRepo = { listByFollowerPage: mockFn().mockResolvedValue([]) };
  const blocksRepo = { listByBlocker: mockFn().mockResolvedValue([]) };
  const prestigeRepo = { findScoreByProfile: mockFn().mockResolvedValue(null) };
  const visibility = {
    canViewPost: mockFn().mockResolvedValue(true),
    filterVisiblePosts: mockFn((_em: any, posts: any[]) =>
      Promise.resolve(posts),
    ),
    assertOwnProfile: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new CommunitySocialReadService(
    em as any,
    profilesRepo as any,
    postsRepo as any,
    commentsRepo as any,
    reactionsRepo as any,
    bookmarksRepo as any,
    followsRepo as any,
    blocksRepo as any,
    prestigeRepo as any,
    visibility as any,
    logger as any,
  );
  return {
    service,
    profilesRepo,
    postsRepo,
    commentsRepo,
    reactionsRepo,
    bookmarksRepo,
    followsRepo,
    blocksRepo,
    prestigeRepo,
    visibility,
  };
}

const perfil = {
  id: 'p-1',
  tenantId: 't-1',
  targetTypeConceptId: 'tt',
  slug: 'dra-quispe',
  displayName: 'Dra. Quispe',
  statusConceptId: 'st',
};

const post = {
  id: 'post-1',
  authorPublicProfileId: 'p-1',
  postTypeConceptId: 'tipo',
  bodyText: 'hola',
  publishedAt: new Date('2026-08-01T10:00:00Z'),
  createdAt: new Date('2026-08-01T10:00:00Z'),
};

describe('CommunitySocialReadService', () => {
  describe('getProfile', () => {
    it('devuelve la ficha con sellos y prestigio', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(perfil);
      d.profilesRepo.listBadgesBySubject.mockResolvedValue([
        {
          id: 'b-1',
          badgeTypeConceptId: 'bt',
          verificationMethodConceptId: 'vm',
        },
      ]);
      d.prestigeRepo.findScoreByProfile.mockResolvedValue({
        totalPoints: '120',
      });

      const res = await d.service.getProfile('p-1');

      expect(res.slug).toBe('dra-quispe');
      expect(res.badges).toHaveLength(1);
      expect(res.prestige?.totalPoints).toBe('120');
    });

    it('404 si el perfil no existe', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);
      await expect(d.service.getProfile('p-x')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('listProfilePosts', () => {
    it('pide una fila de más y devuelve cursor cuando hay siguiente', async () => {
      const d = build();
      d.postsRepo.listByAuthorPage.mockResolvedValue([post, { ...post, id: 'post-2' }]);

      const res = await d.service.listProfilePosts('p-1', { limit: 1 });

      expect(d.postsRepo.listByAuthorPage).toHaveBeenCalledWith(
        expect.anything(),
        'p-1',
        COMM.PUBLICATION_PUBLISHED,
        undefined,
        2,
      );
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).not.toBeNull();
    });

    it('sin página siguiente el cursor es null', async () => {
      const d = build();
      d.postsRepo.listByAuthorPage.mockResolvedValue([post]);

      const res = await d.service.listProfilePosts('p-1', { limit: 10 });

      expect(res.nextCursor).toBeNull();
      expect(res.count).toBe(1);
    });

    it('el filtro de visibilidad quita los posts que el lector no puede ver', async () => {
      const d = build();
      d.postsRepo.listByAuthorPage.mockResolvedValue([post]);
      d.visibility.filterVisiblePosts.mockResolvedValue([]);

      const res = await d.service.listProfilePosts('p-1', {
        actorProfileId: 'p-2',
        limit: 10,
      });

      expect(res.items).toEqual([]);
      expect(res.count).toBe(0);
    });
  });

  describe('getPost', () => {
    it('devuelve el detalle con media, hashtags y menciones', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);
      d.postsRepo.listHashtags.mockResolvedValue([{ id: 'h-1', tag: 'salud' }]);

      const res = await d.service.getPost('post-1', 'p-1');

      expect(res.id).toBe('post-1');
      expect(res.hashtags).toEqual([{ id: 'h-1', tag: 'salud' }]);
    });

    it('404 —y no 403— cuando el post existe pero no es visible', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);
      d.visibility.canViewPost.mockResolvedValue(false);

      await expect(d.service.getPost('post-1', 'p-9')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('listPostComments', () => {
    it('anida las respuestas bajo su comentario raíz', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);
      d.commentsRepo.listRootsPage.mockResolvedValue([
        {
          id: 'c-1',
          authorProfileId: 'p-2',
          bodyText: 'raíz',
          createdAt: new Date(),
        },
      ]);
      d.commentsRepo.listRepliesOf.mockResolvedValue([
        {
          id: 'c-2',
          authorProfileId: 'p-3',
          bodyText: 'respuesta',
          parentCommentId: 'c-1',
          createdAt: new Date(),
        },
      ]);

      const res = await d.service.listPostComments('post-1', { limit: 10 });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].replies).toHaveLength(1);
      expect(res.items[0].replies[0].id).toBe('c-2');
    });
  });

  describe('getPostReactions', () => {
    it('suma el total y marca la reacción del actor', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);
      d.reactionsRepo.summarizeByTarget.mockResolvedValue([
        { reactionTypeConceptId: 'like', count: 3 },
        { reactionTypeConceptId: 'love', count: 2 },
      ]);
      d.reactionsRepo.findByActorTarget.mockResolvedValue({
        reactionTypeConceptId: 'like',
      });

      const res = await d.service.getPostReactions('post-1', 'p-2');

      expect(res.total).toBe(5);
      expect(res.actorReactionTypeConceptId).toBe('like');
    });

    it('sin actor no informa reacción propia', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);

      const res = await d.service.getPostReactions('post-1');

      expect(res.actorReactionTypeConceptId).toBeUndefined();
      expect(d.reactionsRepo.findByActorTarget).not.toHaveBeenCalled();
    });
  });

  describe('lecturas privadas', () => {
    it('los marcadores exigen ser el titular del perfil', async () => {
      const d = build();
      await d.service.listBookmarks('p-1', actor, { limit: 10 });
      expect(d.visibility.assertOwnProfile).toHaveBeenCalledWith(
        expect.anything(),
        'p-1',
        actor,
      );
    });

    it('los bloqueos exigen ser el titular del perfil', async () => {
      const d = build();
      await d.service.listBlocks('p-1', actor, { limit: 10 });
      expect(d.visibility.assertOwnProfile).toHaveBeenCalledWith(
        expect.anything(),
        'p-1',
        actor,
      );
    });

    it('si no es el titular, la excepción del guardia sube tal cual', async () => {
      const d = build();
      d.visibility.assertOwnProfile.mockRejectedValue(new Error('prohibido'));
      await expect(
        d.service.listBookmarks('p-ajeno', actor, { limit: 10 }),
      ).rejects.toThrow('prohibido');
      expect(d.bookmarksRepo.listByProfilePage).not.toHaveBeenCalled();
    });
  });
});
