import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import {
  FeedRepository,
  FollowsRepository,
  PostsRepository,
  ReactionsRepository,
  CommentsRepository,
} from '../repositories';
import { COMM, SOCIAL_OBJECT_CONCEPT_BY_CODE } from '../community.concepts';
import {
  RebuildFeedDto,
  FeedRebuildResponseDto,
  FeedPendingResponseDto,
  FeedRankingPendingResponseDto,
  ApplyFeedRankingDto,
  FeedRankingApplyResponseDto,
} from '../dto';

const ORIGIN_BY_CODE: Record<string, string> = {
  FOLLOWING: COMM.FEED_ORIGIN_FOLLOWING,
  GROUP: COMM.FEED_ORIGIN_GROUP,
  TOPIC: COMM.FEED_ORIGIN_TOPIC,
  SUGGESTED: COMM.FEED_ORIGIN_SUGGESTED,
  PROMOTED: COMM.FEED_ORIGIN_PROMOTED,
};

/**
 * Worker de fan-out del feed (UC-19-15). Proyecta un post publicado al timeline de
 * cada seguidor de forma idempotente (no duplica el item por dueño/fuente).
 * Endpoint interno, no expuesto al usuario final; requiere rol de servicio.
 */
@Injectable()
export class CommunityFeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param feedRepo - Acceso a `community.feed_items`.
   * @param postsRepo - Acceso a `community.social_posts`, para descubrir el lote.
   * @param followsRepo - Acceso a `community.social_follows`, para los destinatarios.
   * @param reactionsRepo - Acceso a `community.reactions`, señal de interacción del ranking.
   * @param commentsRepo - Acceso a `community.comments`, señal de interacción del ranking.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly feedRepo: FeedRepository,
    private readonly postsRepo: PostsRepository,
    private readonly followsRepo: FollowsRepository,
    private readonly reactionsRepo: ReactionsRepository,
    private readonly commentsRepo: CommentsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityFeedService.name);
  }

  /** UC-19-15: fan-out de un post a los feeds de sus seguidores. */
  async rebuild(
    dto: RebuildFeedDto,
    actor: AuthenticatedUser,
  ): Promise<FeedRebuildResponseDto> {
    this.logger.info(
      {
        operation: 'community.feed.rebuild',
        sourceRefId: dto.sourceRefId,
        fanout: dto.followerProfileIds.length,
      },
      'Rebuilding feed fan-out',
    );
    return this.em.transactional(async (tx) => {
      const origin = ORIGIN_BY_CODE[dto.origin ?? 'FOLLOWING'];
      let itemsCreated = 0;
      for (const ownerProfileId of dto.followerProfileIds) {
        const existing = await this.feedRepo.findByOwnerSource(
          tx,
          ownerProfileId,
          dto.sourceRefId,
        );
        if (existing) continue;
        this.feedRepo.create(tx, {
          ownerProfileId,
          itemTypeConceptId: COMM.FEED_ITEM_POST,
          sourceTypeConceptId: COMM.FEED_SOURCE_POST,
          sourceRefId: dto.sourceRefId,
          originConceptId: origin,
          actorUserId: actor.id,
        });
        itemsCreated++;
      }
      await tx.flush();
      return { itemsCreated };
    });
  }

  /**
   * Publicaciones recientes que todavía no se repartieron, con sus seguidores.
   *
   * Existe porque `rebuild` recibe la lista de seguidores ya resuelta: sirve
   * para el fan-out de **un** post concreto, y un worker periódico no tiene de
   * dónde sacar esa lista. Este es el «descubre lote» del patrón que ya usan
   * los demás workers (`GET …/health` → `POST …/reconcile` en read models).
   *
   * Un post sin seguidores igual sale del lote en la primera pasada: se le
   * reparte a nadie, se registra el intento y no vuelve. Que no vuelva es
   * deliberado — reintentarlo en cada tick por si alguien lo sigue después
   * convertiría el barrido en una cola que nunca se vacía.
   *
   * @param options - Ventana, tope de posts y tope de seguidores por post.
   * @returns Posts pendientes con sus destinatarios.
   */
  async pendingFanout(options: {
    /** Antigüedad máxima de los posts a considerar, en horas. */
    withinHours: number;
    /** Tope de posts del lote. */
    limit: number;
    /** Tope de seguidores por post. */
    followersPerPost: number;
  }): Promise<FeedPendingResponseDto> {
    const em = this.em.fork();
    const since = new Date(Date.now() - options.withinHours * 3_600_000);

    const posts = await this.postsRepo.listPublishedSince(
      em,
      COMM.PUBLICATION_PUBLISHED,
      since,
      options.limit,
    );
    if (posts.length === 0) return { items: [] };

    const alreadyFanned = new Set(
      await this.feedRepo.listFannedOutSourceRefs(
        em,
        posts.map((post) => post.id),
      ),
    );
    const pending = posts.filter((post) => !alreadyFanned.has(post.id));

    const items = await Promise.all(
      pending.map(async (post) => ({
        postId: post.id,
        authorProfileId: post.authorPublicProfileId,
        followerProfileIds: await this.followsRepo.listFollowerIdsOf(
          em,
          post.authorPublicProfileId,
          COMM.FOLLOWABLE_PROFILE,
          CONCEPTS.STATE_ACTIVE,
          options.followersPerPost,
        ),
      })),
    );

    return { items };
  }

  /**
   * Lote de items del feed pendientes de recalcular su rank_score (UC-19-16).
   *
   * El `ranking-score` job los puntúa con recencia, interacción y afinidad,
   * y aplica el resultado con `applyRanking`. Este método sólo descubre el lote
   * y junta las señales crudas — la fórmula vive en el worker, no acá, para
   * que los pesos se puedan ajustar sin tocar el módulo community.
   *
   * @param limit - Tope de ítems del lote.
   * @returns Ítems con sus señales crudas de recencia e interacción.
   */
  async pendingRanking(limit: number): Promise<FeedRankingPendingResponseDto> {
    const em = this.em.fork();
    const items = await this.feedRepo.listPageForRanking(em, limit);
    if (items.length === 0) return { items: [] };

    const postIds = [...new Set(items.map((item) => item.sourceRefId))];
    const posts = await this.postsRepo.listByIds(em, postIds);
    const postById = new Map(posts.map((post) => [post.id, post]));

    const [reactionTallies, commentCounts] = await Promise.all([
      this.reactionsRepo.summarizeByTargets(
        em,
        SOCIAL_OBJECT_CONCEPT_BY_CODE.POST,
        postIds,
      ),
      this.commentsRepo.countByTargets(
        em,
        SOCIAL_OBJECT_CONCEPT_BY_CODE.POST,
        postIds,
        CONCEPTS.STATE_ACTIVE,
      ),
    ]);

    const reactionCountByPost = new Map<string, number>();
    for (const tally of reactionTallies) {
      reactionCountByPost.set(
        tally.reactableRefId,
        (reactionCountByPost.get(tally.reactableRefId) ?? 0) + tally.count,
      );
    }
    const commentCountByPost = new Map(
      commentCounts.map((row) => [row.commentableRefId, row.count]),
    );

    return {
      items: items.map((item) => {
        const post = postById.get(item.sourceRefId);
        return {
          feedItemId: item.id,
          postId: item.sourceRefId,
          ownerProfileId: item.ownerProfileId,
          authorProfileId: post?.authorPublicProfileId ?? item.ownerProfileId,
          itemCreatedAt: item.createdAt.toISOString(),
          postPublishedAt: post?.publishedAt?.toISOString() ?? null,
          reactionCount: reactionCountByPost.get(item.sourceRefId) ?? 0,
          commentCount: commentCountByPost.get(item.sourceRefId) ?? 0,
        };
      }),
    };
  }

  /**
   * Aplica los rank_score recalculados por el worker (UC-19-16).
   *
   * @param dto - Puntajes ya calculados, uno por ítem de feed.
   * @returns Cuántos ítems se actualizaron de verdad.
   */
  async applyRanking(
    dto: ApplyFeedRankingDto,
  ): Promise<FeedRankingApplyResponseDto> {
    const em = this.em.fork();
    const updated = await this.feedRepo.applyRankScores(
      em,
      dto.updates.map((update) => ({
        id: update.feedItemId,
        rankScore: update.rankScore,
      })),
    );
    return { updated };
  }
}
