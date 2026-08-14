import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityTimelineReadService } from './community-timeline-read.service';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => ({})) };
  const feedRepo = { listPageByOwner: mockFn().mockResolvedValue([]) };
  const notificationsRepo = {
    listByRecipientPage: mockFn().mockResolvedValue([]),
    countUnread: mockFn().mockResolvedValue(0),
  };
  const postsRepo = { listByIds: mockFn().mockResolvedValue([]) };
  const visibility = {
    assertOwnProfile: mockFn().mockResolvedValue(undefined),
    filterVisiblePosts: mockFn((_em: any, posts: any[]) =>
      Promise.resolve(posts),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new CommunityTimelineReadService(
    em as any,
    feedRepo as any,
    notificationsRepo as any,
    postsRepo as any,
    visibility as any,
    logger as any,
  );
  return { service, feedRepo, notificationsRepo, postsRepo, visibility };
}

const feedItem = {
  id: 'f-1',
  itemTypeConceptId: 'it',
  sourceTypeConceptId: 'st',
  sourceRefId: 'post-1',
  originConceptId: 'oc',
  rankScore: '10.5',
  createdAt: new Date('2026-08-01T12:00:00Z'),
};

const post = {
  id: 'post-1',
  authorPublicProfileId: 'p-9',
  postTypeConceptId: 'tipo',
  bodyText: 'contenido',
};

describe('CommunityTimelineReadService', () => {
  describe('getFeed', () => {
    it('exige ser el titular del perfil antes de leer nada', async () => {
      const d = build();
      d.visibility.assertOwnProfile.mockRejectedValue(new Error('prohibido'));

      await expect(
        d.service.getFeed('p-ajeno', actor, { limit: 10 }),
      ).rejects.toThrow('prohibido');
      expect(d.feedRepo.listPageByOwner).not.toHaveBeenCalled();
    });

    it('hidrata cada entrada con su publicación', async () => {
      const d = build();
      d.feedRepo.listPageByOwner.mockResolvedValue([feedItem]);
      d.postsRepo.listByIds.mockResolvedValue([post]);

      const res = await d.service.getFeed('p-1', actor, { limit: 10 });

      expect(res.items[0].post?.bodyText).toBe('contenido');
      expect(res.count).toBe(1);
    });

    it('una entrada cuya publicación dejó de ser visible viaja con post nulo', async () => {
      const d = build();
      d.feedRepo.listPageByOwner.mockResolvedValue([feedItem]);
      d.postsRepo.listByIds.mockResolvedValue([post]);
      d.visibility.filterVisiblePosts.mockResolvedValue([]);

      const res = await d.service.getFeed('p-1', actor, { limit: 10 });

      // La fila no se saltea: si se salteara, el conteo de la página no
      // cuadraría con lo que el cursor avanzó.
      expect(res.items).toHaveLength(1);
      expect(res.items[0].post).toBeNull();
    });

    it('el cursor lleva rankScore como texto, sin convertirlo a número', async () => {
      const d = build();
      d.feedRepo.listPageByOwner.mockResolvedValue([
        feedItem,
        { ...feedItem, id: 'f-2' },
      ]);

      const res = await d.service.getFeed('p-1', actor, { limit: 1 });

      expect(res.nextCursor).not.toBeNull();
      const decoded = JSON.parse(
        Buffer.from(res.nextCursor as string, 'base64url').toString('utf8'),
      );
      expect(decoded.rankScore).toBe('10.5');
    });
  });

  describe('listNotifications', () => {
    it('exige ser el titular del perfil', async () => {
      const d = build();
      d.visibility.assertOwnProfile.mockRejectedValue(new Error('prohibido'));

      await expect(
        d.service.listNotifications('p-ajeno', actor, { limit: 10 }),
      ).rejects.toThrow('prohibido');
      expect(d.notificationsRepo.listByRecipientPage).not.toHaveBeenCalled();
    });

    it('el total sin leer se cuenta sobre la bandeja, no sobre la página', async () => {
      const d = build();
      d.notificationsRepo.listByRecipientPage.mockResolvedValue([
        {
          id: 'n-1',
          notificationTypeConceptId: 'nt',
          sourceTypeConceptId: 'st',
          sourceRefId: 'post-1',
          createdAt: new Date(),
        },
      ]);
      d.notificationsRepo.countUnread.mockResolvedValue(42);

      const res = await d.service.listNotifications('p-1', actor, { limit: 1 });

      expect(res.count).toBe(1);
      expect(res.unreadCount).toBe(42);
      expect(res.items[0].isRead).toBe(false);
    });
  });
});
