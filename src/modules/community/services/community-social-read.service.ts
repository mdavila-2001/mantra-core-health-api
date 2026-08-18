import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../common';
import {
  PublicProfilesRepository,
  PostsRepository,
  CommentsRepository,
  ReactionsRepository,
  BookmarksRepository,
  FollowsRepository,
  BlocksRepository,
  CommunityPrestigeRepository,
} from '../repositories';
import {
  COMM,
  REACTION_CODE_BY_CONCEPT,
  SOCIAL_OBJECT_CONCEPT_BY_CODE,
} from '../community.concepts';
import { CommunityVisibilityService } from './community-visibility.service';
import {
  CommunityEngagementService,
  type PostEngagement,
} from './community-engagement.service';
import type {
  PublicProfileDetailDto,
  PostPageDto,
  PostDetailDto,
  PostListItemDto,
  CommentThreadPageDto,
  CommentThreadItemDto,
  ReactionSummaryDto,
  FollowPageDto,
  BookmarkPageDto,
  BlockPageDto,
} from '../dto';
import type { Comments, SocialPosts } from '../entities';

/** Tope de respuestas que se traen por página de hilos. */
const REPLIES_PER_PAGE = 200;

/**
 * Cara de lectura del grafo social (UC-19-01 a UC-19-07).
 *
 * Está separada de `CommunitySocialService` —que escribe— por la misma razón
 * que en `iam` y `directory`: leer y escribir tienen reglas distintas, y
 * mezclarlas hace que cada `GET` nuevo tenga que releerse contra transacciones
 * que no le incumben.
 *
 * Toda lectura pasa por {@link CommunityVisibilityService}: la visibilidad de
 * un post y los bloqueos entre perfiles no son una decisión de cada endpoint.
 */
@Injectable()
export class CommunitySocialReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param profilesRepo - Acceso a `community.public_profiles`.
   * @param postsRepo - Acceso a `community.social_posts` y sus hijos.
   * @param commentsRepo - Acceso a `community.comments`.
   * @param reactionsRepo - Acceso a `community.reactions`.
   * @param bookmarksRepo - Acceso a `community.bookmarks`.
   * @param followsRepo - Acceso a `community.social_follows`.
   * @param blocksRepo - Acceso a `community.user_blocks`.
   * @param prestigeRepo - Acceso a `community.prestige_scores`.
   * @param visibility - Reglas transversales de visibilidad y propiedad.
   * @param engagement - Recuento de reacciones y comentarios de la página.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly postsRepo: PostsRepository,
    private readonly commentsRepo: CommentsRepository,
    private readonly reactionsRepo: ReactionsRepository,
    private readonly bookmarksRepo: BookmarksRepository,
    private readonly followsRepo: FollowsRepository,
    private readonly blocksRepo: BlocksRepository,
    private readonly prestigeRepo: CommunityPrestigeRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly engagement: CommunityEngagementService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunitySocialReadService.name);
  }

  /**
   * Ficha de un perfil público, con sellos y prestigio.
   *
   * @param profileId - Perfil a leer.
   * @returns Ficha del perfil.
   * @throws ResourceNotFoundException si el perfil no existe.
   */
  async getProfile(
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<PublicProfileDetailDto> {
    const em = this.em.fork();
    const profile = await this.profilesRepo.findById(em, profileId);
    if (!profile)
      throw new ResourceNotFoundException('Perfil público no encontrado', {
        profileId,
      });

    // Un bloqueo responde 404 y no 403, por lo mismo que en las publicaciones:
    // «existe pero no podés verlo» ya confirma que ese perfil existe, y quien
    // bloqueó no quiere que el bloqueado sepa siquiera eso.
    const actorProfileId = await this.visibility.resolveActorProfileId(
      em,
      actor,
    );
    if (
      actorProfileId &&
      (await this.visibility.isBlockedBetween(em, actorProfileId, profile.id))
    )
      throw new ResourceNotFoundException('Perfil público no encontrado', {
        profileId,
      });

    const [badges, prestige] = await Promise.all([
      this.profilesRepo.listBadgesBySubject(
        em,
        profile.id,
        CONCEPTS.STATE_ACTIVE,
        new Date(),
      ),
      this.prestigeRepo.findScoreByProfile(em, profile.tenantId, profile.id),
    ]);

    return {
      id: profile.id,
      tenantId: profile.tenantId,
      targetTypeConceptId: profile.targetTypeConceptId,
      slug: profile.slug,
      displayName: profile.displayName,
      headline: profile.headline ?? null,
      biography: profile.biography ?? null,
      avatarFileId: profile.avatarFileId ?? null,
      coverFileId: profile.coverFileId ?? null,
      verificationStatusConceptId: profile.verificationStatusConceptId ?? null,
      acceptsReviews: profile.acceptsReviews ?? null,
      statusConceptId: profile.statusConceptId,
      badges: badges.map((badge) => ({
        id: badge.id,
        badgeTypeConceptId: badge.badgeTypeConceptId,
        verificationMethodConceptId: badge.verificationMethodConceptId,
        validFrom: badge.validFrom ?? null,
        validTo: badge.validTo ?? null,
      })),
      prestige: prestige
        ? {
            totalPoints: prestige.totalPoints,
            levelConceptId: prestige.levelConceptId ?? null,
            rankPosition: prestige.rankPosition ?? null,
            calculatedAt: prestige.calculatedAt ?? null,
          }
        : null,
    };
  }

  /**
   * Muro de un perfil, filtrado por lo que el lector puede ver.
   *
   * @param profileId - Perfil autor.
   * @param options - Perfil del lector, cursor y tope.
   * @returns Página de publicaciones.
   */
  async listProfilePosts(
    profileId: string,
    actor: AuthenticatedUser,
    options: {
      /** Perfil del lector **propuesto**; se verifica que sea suyo. */
      actorProfileId?: string;
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<PostPageDto> {
    const em = this.em.fork();
    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterKey =
      typeof after?.publishedAt === 'string' && typeof after?.id === 'string'
        ? { publishedAt: after.publishedAt, id: after.id }
        : undefined;

    // Una fila de más para saber si hay página siguiente sin contar la tabla.
    const rows = await this.postsRepo.listByAuthorPage(
      em,
      profileId,
      COMM.PUBLICATION_PUBLISHED,
      afterKey,
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    const actorProfileId = await this.visibility.resolveActorProfileId(
      em,
      actor,
      options.actorProfileId,
    );
    const visible = await this.visibility.filterVisiblePosts(
      em,
      page,
      actorProfileId,
    );

    // El compromiso se resuelve sobre lo **visible**: contar reacciones de una
    // publicación que este lector no puede ver revelaría que existe.
    const engagement = await this.engagement.ofPosts(
      em,
      visible.map((post) => post.id),
      actorProfileId,
    );

    // El cursor sale de la última fila **leída**, no de la última visible: si
    // saliera de la visible, las filas ocultas del final se volverían a leer en
    // cada página y el listado no avanzaría.
    const last = page.at(-1);
    return {
      items: visible.map((post) =>
        this.toPostListItem(post, engagement.get(post.id)),
      ),
      count: visible.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              publishedAt: (last.publishedAt ?? last.createdAt).toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  /**
   * Publicación con sus adjuntos, etiquetas y menciones.
   *
   * Un post que el lector no puede ver responde 404 y no 403: decir «existe
   * pero no podés verlo» ya confirma que ese perfil publicó algo.
   *
   * @param postId - Publicación a leer.
   * @param actorProfileId - Perfil del lector.
   * @returns Detalle de la publicación.
   * @throws ResourceNotFoundException si no existe o no es visible.
   */
  async getPost(
    postId: string,
    actor: AuthenticatedUser,
    requestedProfileId?: string,
  ): Promise<PostDetailDto> {
    const em = this.em.fork();
    const post = await this.postsRepo.findById(em, postId);
    if (!post)
      throw new ResourceNotFoundException('Publicación no encontrada', {
        postId,
      });

    const actorProfileId = await this.visibility.resolveActorProfileId(
      em,
      actor,
      requestedProfileId,
    );
    const canView = await this.visibility.canViewPost(em, post, actorProfileId);
    if (!canView)
      throw new ResourceNotFoundException('Publicación no encontrada', {
        postId,
      });

    const [media, hashtags, mentions, engagement] = await Promise.all([
      this.postsRepo.listMedia(em, post.id),
      this.postsRepo.listHashtags(em, post.id),
      this.postsRepo.listMentions(em, post.id),
      this.engagement.ofPosts(em, [post.id], actorProfileId),
    ]);

    return {
      ...this.toPostListItem(post, engagement.get(post.id)),
      media: media.map((item) => ({
        id: item.id,
        fileId: item.fileId,
        mediaRoleConceptId: item.mediaRoleConceptId,
        altText: item.altText ?? null,
        ordinal: item.ordinal ?? null,
      })),
      hashtags,
      mentions: mentions.map((mention) => ({
        id: mention.id,
        mentionedProfileId: mention.mentionedProfileId,
        offsetStart: mention.offsetStart ?? null,
        offsetEnd: mention.offsetEnd ?? null,
      })),
    };
  }

  /**
   * Hilo de comentarios de una publicación.
   *
   * @param postId - Publicación comentada.
   * @param options - Perfil del lector, cursor y tope de raíces.
   * @returns Página de comentarios raíz con sus respuestas anidadas.
   */
  async listPostComments(
    postId: string,
    actor: AuthenticatedUser,
    options: {
      /** Perfil del lector **propuesto**; se verifica que sea suyo. */
      actorProfileId?: string;
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de comentarios raíz. */
      limit: number;
    },
  ): Promise<CommentThreadPageDto> {
    const em = this.em.fork();
    const actorProfileId = await this.visibility.resolveActorProfileId(
      em,
      actor,
      options.actorProfileId,
    );
    await this.assertPostVisible(em, postId, actorProfileId);

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterKey =
      typeof after?.createdAt === 'string' && typeof after?.id === 'string'
        ? { createdAt: after.createdAt, id: after.id }
        : undefined;

    const rows = await this.commentsRepo.listRootsPage(
      em,
      SOCIAL_OBJECT_CONCEPT_BY_CODE.POST,
      postId,
      afterKey,
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const roots = hasMore ? rows.slice(0, options.limit) : rows;

    const replies = await this.commentsRepo.listRepliesOf(
      em,
      roots.map((root) => root.id),
      REPLIES_PER_PAGE,
    );

    const last = roots.at(-1);
    return {
      items: roots.map((root) => this.toCommentThread(root, replies)),
      count: roots.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  /**
   * Resumen de reacciones de una publicación.
   *
   * @param postId - Publicación reaccionada.
   * @param actorProfileId - Perfil del lector, para saber si ya reaccionó.
   * @returns Recuento por tipo y la reacción del actor.
   */
  async getPostReactions(
    postId: string,
    actor: AuthenticatedUser,
    requestedProfileId?: string,
  ): Promise<ReactionSummaryDto> {
    const em = this.em.fork();
    const actorProfileId = await this.visibility.resolveActorProfileId(
      em,
      actor,
      requestedProfileId,
    );
    await this.assertPostVisible(em, postId, actorProfileId);

    const tallies = await this.reactionsRepo.summarizeByTarget(
      em,
      SOCIAL_OBJECT_CONCEPT_BY_CODE.POST,
      postId,
    );
    const own = actorProfileId
      ? await this.reactionsRepo.findByActorTarget(
          em,
          actorProfileId,
          SOCIAL_OBJECT_CONCEPT_BY_CODE.POST,
          postId,
        )
      : undefined;

    return {
      // El código viaja junto al uuid, igual que en la fila del muro: quien
      // dibuja la barra de reacciones no puede resolver terminología por render.
      tallies: tallies.map((tally) => ({
        ...tally,
        reactionType:
          REACTION_CODE_BY_CONCEPT[tally.reactionTypeConceptId] ?? null,
      })),
      total: tallies.reduce((sum, tally) => sum + tally.count, 0),
      ...(actorProfileId
        ? {
            actorReactionTypeConceptId: own?.reactionTypeConceptId ?? null,
            actorReactionType: own
              ? (REACTION_CODE_BY_CONCEPT[own.reactionTypeConceptId] ?? null)
              : null,
          }
        : {}),
    };
  }

  /**
   * Seguimientos emitidos por un perfil. Exige ser el titular.
   *
   * A quién sigue alguien es una lectura privada: dice con qué especialistas se
   * trata, y en una red social médica eso deja ver la condición de la persona.
   * Se leía con sólo poner el uuid ajeno en la consulta.
   *
   * @param followerProfileId - Perfil que sigue.
   * @param actor - Quien pide la lectura; tiene que ser el titular.
   * @param options - Cursor y tope.
   * @returns Página de seguimientos activos.
   * @throws ForbiddenException si el perfil no es suyo.
   */
  async listFollows(
    followerProfileId: string,
    actor: AuthenticatedUser,
    options: {
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<FollowPageDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, followerProfileId, actor);
    const afterKey = this.decodeCreatedAtCursor(options.cursor);

    const rows = await this.followsRepo.listByFollowerPage(
      em,
      followerProfileId,
      CONCEPTS.STATE_ACTIVE,
      afterKey,
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((follow) => ({
        id: follow.id,
        followerProfileId: follow.followerProfileId,
        followableTypeConceptId: follow.followableTypeConceptId,
        followableRefId: follow.followableRefId,
        notificationLevelConceptId: follow.notificationLevelConceptId ?? null,
        createdAt: follow.createdAt,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor: this.encodeCreatedAtCursor(hasMore, last),
    };
  }

  /**
   * Marcadores de un perfil. Exige ser el titular.
   *
   * @param profileId - Perfil dueño.
   * @param actor - Quien pide la lectura.
   * @param options - Colección, cursor y tope.
   * @returns Página de marcadores.
   */
  async listBookmarks(
    profileId: string,
    actor: AuthenticatedUser,
    options: {
      /** Colección a la que acotar. */
      collectionName?: string;
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<BookmarkPageDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, profileId, actor);
    const afterKey = this.decodeCreatedAtCursor(options.cursor);

    const rows = await this.bookmarksRepo.listByProfilePage(
      em,
      profileId,
      options.collectionName,
      afterKey,
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((bookmark) => ({
        id: bookmark.id,
        bookmarkableTypeConceptId: bookmark.bookmarkableTypeConceptId,
        bookmarkableRefId: bookmark.bookmarkableRefId,
        collectionName: bookmark.collectionName ?? null,
        createdAt: bookmark.createdAt,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor: this.encodeCreatedAtCursor(hasMore, last),
    };
  }

  /**
   * Bloqueos emitidos por un perfil. Exige ser el titular.
   *
   * @param profileId - Perfil que bloqueó.
   * @param actor - Quien pide la lectura.
   * @param options - Cursor y tope.
   * @returns Página de bloqueos.
   */
  async listBlocks(
    profileId: string,
    actor: AuthenticatedUser,
    options: {
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<BlockPageDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, profileId, actor);
    const afterKey = this.decodeCreatedAtCursor(options.cursor);

    const rows = await this.blocksRepo.listByBlocker(
      em,
      profileId,
      afterKey,
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((block) => ({
        id: block.id,
        blockedProfileId: block.blockedProfileId,
        reasonConceptId: block.reasonConceptId ?? null,
        createdAt: block.createdAt,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor: this.encodeCreatedAtCursor(hasMore, last),
    };
  }

  /** Exige que la publicación exista y sea visible para el lector. */
  private async assertPostVisible(
    em: EntityManager,
    postId: string,
    actorProfileId?: string,
  ): Promise<void> {
    const post = await this.postsRepo.findById(em, postId);
    if (!post || !(await this.visibility.canViewPost(em, post, actorProfileId)))
      throw new ResourceNotFoundException('Publicación no encontrada', {
        postId,
      });
  }

  /** Clave de continuación `(createdAt, id)` de un cursor, si es válida. */
  private decodeCreatedAtCursor(
    cursor?: string,
  ): { createdAt: string; id: string } | undefined {
    if (!cursor) return undefined;
    const after = decodeKeysetCursor(cursor);
    return typeof after.createdAt === 'string' && typeof after.id === 'string'
      ? { createdAt: after.createdAt, id: after.id }
      : undefined;
  }

  /** Cursor `(createdAt, id)` de la última fila, si hay página siguiente. */
  private encodeCreatedAtCursor(
    hasMore: boolean,
    last: { createdAt: Date; id: string } | undefined,
  ): string | null {
    return hasMore && last
      ? encodeKeysetCursor({
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        })
      : null;
  }

  /** Proyecta la entidad de publicación a la fila del muro. */
  private toPostListItem(
    post: SocialPosts,
    engagement?: PostEngagement,
  ): PostListItemDto {
    return {
      id: post.id,
      authorPublicProfileId: post.authorPublicProfileId,
      postTypeConceptId: post.postTypeConceptId,
      bodyText: post.bodyText,
      visibilityConceptId: post.visibilityConceptId ?? null,
      commentsEnabled: post.commentsEnabled ?? null,
      publishedAt: post.publishedAt ?? null,
      editedAt: post.editedAt ?? null,
      reactions: (engagement ?? CommunityEngagementService.vacio()).reactions,
      commentCount: (engagement ?? CommunityEngagementService.vacio())
        .commentCount,
    };
  }

  /** Arma un comentario raíz con sus respuestas directas anidadas. */
  private toCommentThread(
    root: Comments,
    replies: Comments[],
  ): CommentThreadItemDto {
    const own = replies.filter((reply) => reply.parentCommentId === root.id);
    return {
      id: root.id,
      authorProfileId: root.authorProfileId,
      bodyText: root.bodyText,
      parentCommentId: root.parentCommentId ?? null,
      threadDepth: root.threadDepth ?? null,
      replyCount: root.replyCount ?? null,
      createdAt: root.createdAt,
      replies: own.map((reply) => this.toCommentThread(reply, replies)),
    };
  }
}
