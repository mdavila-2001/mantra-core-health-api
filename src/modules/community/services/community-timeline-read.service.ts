import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../common';
import {
  FeedRepository,
  NotificationsRepository,
  PostsRepository,
} from '../repositories';
import { CommunityVisibilityService } from './community-visibility.service';
import type { FeedPageDto, NotificationPageDto } from '../dto';

/**
 * Cara de lectura del timeline y de la bandeja de notificaciones.
 *
 * Las dos son del titular del perfil y de nadie más, así que las dos empiezan
 * exigiendo propiedad. El feed además vuelve a filtrar por visibilidad: el
 * fan-out repartió las publicaciones en su momento, pero entre aquel momento y
 * esta lectura el autor pudo restringir el post o los dos perfiles pudieron
 * bloquearse, y un timeline materializado no se entera solo.
 */
@Injectable()
export class CommunityTimelineReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param feedRepo - Acceso a `community.feed_items`.
   * @param notificationsRepo - Acceso a `community.social_notifications`.
   * @param postsRepo - Acceso a `community.social_posts`, para hidratar.
   * @param visibility - Reglas transversales de visibilidad y propiedad.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly feedRepo: FeedRepository,
    private readonly notificationsRepo: NotificationsRepository,
    private readonly postsRepo: PostsRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityTimelineReadService.name);
  }

  /**
   * Timeline de un perfil (UC-19-13). Exige ser el titular.
   *
   * @param profileId - Perfil dueño del timeline.
   * @param actor - Quien pide la lectura.
   * @param options - Cursor y tope.
   * @returns Página del feed con las publicaciones hidratadas.
   */
  async getFeed(
    profileId: string,
    actor: AuthenticatedUser,
    options: {
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<FeedPageDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, profileId, actor);

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterKey =
      typeof after?.rankScore === 'string' &&
      typeof after?.createdAt === 'string' &&
      typeof after?.id === 'string'
        ? {
            rankScore: after.rankScore,
            createdAt: after.createdAt,
            id: after.id,
          }
        : undefined;

    const rows = await this.feedRepo.listPageByOwner(
      em,
      profileId,
      afterKey,
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    const posts = await this.postsRepo.listByIds(
      em,
      page.map((item) => item.sourceRefId),
    );
    const visiblePosts = await this.visibility.filterVisiblePosts(
      em,
      posts,
      profileId,
    );
    const byId = new Map(visiblePosts.map((post) => [post.id, post]));

    const last = page.at(-1);
    return {
      items: page.map((item) => {
        const post = byId.get(item.sourceRefId);
        return {
          id: item.id,
          itemTypeConceptId: item.itemTypeConceptId,
          sourceTypeConceptId: item.sourceTypeConceptId,
          sourceRefId: item.sourceRefId,
          originConceptId: item.originConceptId,
          rankScore: item.rankScore ?? null,
          isSeen: item.isSeen ?? null,
          createdAt: item.createdAt,
          post: post
            ? {
                id: post.id,
                authorPublicProfileId: post.authorPublicProfileId,
                postTypeConceptId: post.postTypeConceptId,
                bodyText: post.bodyText,
                visibilityConceptId: post.visibilityConceptId ?? null,
                commentsEnabled: post.commentsEnabled ?? null,
                publishedAt: post.publishedAt ?? null,
                editedAt: post.editedAt ?? null,
              }
            : null,
        };
      }),
      count: page.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              rankScore: last.rankScore ?? '0',
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  /**
   * Bandeja de notificaciones de un perfil. Exige ser el titular.
   *
   * @param profileId - Perfil destinatario.
   * @param actor - Quien pide la lectura.
   * @param options - Cursor y tope.
   * @returns Página de notificaciones con el total sin leer.
   */
  async listNotifications(
    profileId: string,
    actor: AuthenticatedUser,
    options: {
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<NotificationPageDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, profileId, actor);

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterKey =
      typeof after?.createdAt === 'string' && typeof after?.id === 'string'
        ? { createdAt: after.createdAt, id: after.id }
        : undefined;

    const [rows, unreadCount] = await Promise.all([
      this.notificationsRepo.listByRecipientPage(
        em,
        profileId,
        afterKey,
        options.limit + 1,
      ),
      this.notificationsRepo.countUnread(em, profileId),
    ]);
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((notification) => ({
        id: notification.id,
        notificationTypeConceptId: notification.notificationTypeConceptId,
        actorProfileId: notification.actorProfileId ?? null,
        sourceTypeConceptId: notification.sourceTypeConceptId,
        sourceRefId: notification.sourceRefId,
        previewText: notification.previewText ?? null,
        isRead: notification.isRead ?? false,
        readAt: notification.readAt ?? null,
        createdAt: notification.createdAt,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
      unreadCount,
    };
  }
}
