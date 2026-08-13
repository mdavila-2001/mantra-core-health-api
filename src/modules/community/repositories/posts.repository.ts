import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  SocialPosts,
  PostMedia,
  Hashtags,
  ContentHashtags,
  Mentions,
} from '../entities';
import { CONCEPTS, createdBy } from '../../../common';
import { COMM } from '../community.concepts';

/**
 * Describe el contrato estructural de create post data.
 */
export interface CreatePostData {
  /**
   * Identificador asociado a author public profile.
   */
  authorPublicProfileId: string;
  /**
   * Identificador asociado a post type concept.
   */
  postTypeConceptId: string;
  /**
   * Valor de body text mantenido por la instancia.
   */
  bodyText: string;
  /**
   * Identificador asociado a visibility concept.
   */
  visibilityConceptId?: string;
  /**
   * Valor de comments enabled mantenido por la instancia.
   */
  commentsEnabled?: boolean;
  /**
   * Identificador asociado a health data screening status concept.
   */
  healthDataScreeningStatusConceptId: string;
  /**
   * Identificador asociado a moderation status concept.
   */
  moderationStatusConceptId: string;
  /**
   * Identificador asociado a publication status concept.
   */
  publicationStatusConceptId: string;
  /**
   * Valor de published at mantenido por la instancia.
   */
  publishedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create media data.
 */
export interface CreateMediaData {
  /**
   * Identificador asociado a post.
   */
  postId: string;
  /**
   * Identificador asociado a file.
   */
  fileId: string;
  /**
   * Identificador asociado a media role concept.
   */
  mediaRoleConceptId: string;
  /**
   * Valor de alt text mantenido por la instancia.
   */
  altText?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de publicaciones sociales y su contenido derivado: adjuntos,
 * hashtags (upsert por tag normalizado), vínculos contenido-hashtag y menciones.
 */
@Injectable()
export class PostsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<SocialPosts | null>`.
   */
  findById(em: EntityManager, id: string): Promise<SocialPosts | null> {
    return em.findOne(SocialPosts, { id });
  }

  /**
   * Publicaciones de un autor (UC-19-02, cara de lectura).
   *
   * Sólo lo publicado: los borradores y lo retirado por moderación no son parte
   * del muro de nadie. La visibilidad por seguidor la resuelve
   * `CommunityVisibilityService` sobre la página, no esta consulta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param authorPublicProfileId - Perfil autor.
   * @param publishedStatusConceptId - Estado de publicación visible.
   * @param after - Clave de continuación `(publishedAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página de posts, del más reciente al más antiguo.
   */
  listByAuthorPage(
    em: EntityManager,
    authorPublicProfileId: string,
    publishedStatusConceptId: string,
    after: { publishedAt: string; id: string } | undefined,
    limit: number,
  ): Promise<SocialPosts[]> {
    return em.find(
      SocialPosts,
      {
        authorPublicProfileId,
        publicationStatusConceptId: publishedStatusConceptId,
        ...(after
          ? {
              $or: [
                { publishedAt: { $lt: new Date(after.publishedAt) } },
                {
                  publishedAt: new Date(after.publishedAt),
                  id: { $lt: after.id },
                },
              ],
            }
          : {}),
      },
      { orderBy: { publishedAt: 'DESC', id: 'DESC' }, limit },
    );
  }

  /**
   * Varios posts por id, para hidratar una página de feed.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Posts a traer.
   * @returns Los posts existentes, sin orden garantizado.
   */
  listByIds(em: EntityManager, ids: string[]): Promise<SocialPosts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(SocialPosts, { id: { $in: ids } });
  }

  /**
   * Posts publicados dentro de una ventana, para el fan-out del feed.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param publishedStatusConceptId - Estado de publicación visible.
   * @param since - Momento a partir del cual buscar.
   * @param limit - Tope de filas.
   * @returns Posts recientes, del más antiguo al más nuevo.
   */
  listPublishedSince(
    em: EntityManager,
    publishedStatusConceptId: string,
    since: Date,
    limit: number,
  ): Promise<SocialPosts[]> {
    return em.find(
      SocialPosts,
      {
        publicationStatusConceptId: publishedStatusConceptId,
        publishedAt: { $gte: since },
      },
      { orderBy: { publishedAt: 'ASC', id: 'ASC' }, limit },
    );
  }

  /** Adjuntos de un post, en orden de despliegue. */
  listMedia(em: EntityManager, postId: string): Promise<PostMedia[]> {
    return em.find(
      PostMedia,
      { postId },
      { orderBy: { ordinal: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * Hashtags de un post, ya resueltos a su etiqueta.
   *
   * `content_hashtags` guarda sólo el id: devolver eso obligaría a la interfaz
   * a una segunda vuelta por cada etiqueta para poder escribirla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param postId - Post a leer.
   * @returns Etiquetas del post, con su id.
   */
  async listHashtags(
    em: EntityManager,
    postId: string,
  ): Promise<{ id: string; tag: string }[]> {
    const links = await em.find(ContentHashtags, {
      contentTypeConceptId: COMM.CONTENT_TYPE_POST,
      contentRefId: postId,
    });
    if (links.length === 0) return [];
    const tags = await em.find(Hashtags, {
      id: { $in: links.map((link) => link.hashtagId) },
    });
    return tags.map((tag) => ({ id: tag.id, tag: tag.tag }));
  }

  /** Menciones declaradas en el cuerpo de un post. */
  listMentions(em: EntityManager, postId: string): Promise<Mentions[]> {
    return em.find(
      Mentions,
      {
        sourceTypeConceptId: COMM.CONTENT_TYPE_POST,
        sourceRefId: postId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      },
      { orderBy: { offsetStart: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `SocialPosts`.
   */
  create(em: EntityManager, data: CreatePostData): SocialPosts {
    return em.create(
      SocialPosts,
      {
        authorPublicProfileId: data.authorPublicProfileId,
        postTypeConceptId: data.postTypeConceptId,
        bodyText: data.bodyText,
        visibilityConceptId: data.visibilityConceptId,
        commentsEnabled: data.commentsEnabled ?? true,
        healthDataScreeningStatusConceptId:
          data.healthDataScreeningStatusConceptId,
        moderationStatusConceptId: data.moderationStatusConceptId,
        publicationStatusConceptId: data.publicationStatusConceptId,
        publishedAt: data.publishedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create media.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create media conforme al contrato `PostMedia`.
   */
  createMedia(em: EntityManager, data: CreateMediaData): PostMedia {
    return em.create(
      PostMedia,
      {
        postId: data.postId,
        fileId: data.fileId,
        mediaRoleConceptId: data.mediaRoleConceptId,
        altText: data.altText,
        ordinal: data.ordinal,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  /** UPSERT de hashtag por tag normalizado; incrementa `usage_count`. */
  async upsertHashtag(
    em: EntityManager,
    tag: string,
    actorUserId?: string,
  ): Promise<Hashtags> {
    const normalized = tag.trim().toLowerCase().replace(/^#/, '');
    let hashtag = await em.findOne(Hashtags, { normalizedTag: normalized });
    if (hashtag) {
      const current = hashtag.usageCount ? BigInt(hashtag.usageCount) : 0n;
      hashtag.usageCount = String(current + 1n);
      return hashtag;
    }
    hashtag = em.create(
      Hashtags,
      {
        tag,
        normalizedTag: normalized,
        usageCount: '1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
    return hashtag;
  }

  /**
   * Actualiza link hashtag.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param hashtagId - Identificador de hashtag.
   * @param contentRefId - Identificador de content ref.
   * @param contentTypeConceptId - Identificador de content type concept.
   * @param actorUserId - Identificador de actor user.
   * @returns Resultado de link hashtag conforme al contrato `ContentHashtags`.
   */
  linkHashtag(
    em: EntityManager,
    hashtagId: string,
    contentRefId: string,
    contentTypeConceptId: string,
    actorUserId?: string,
  ): ContentHashtags {
    return em.create(
      ContentHashtags,
      {
        hashtagId,
        contentTypeConceptId,
        contentRefId,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create mention.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create mention conforme al contrato `Mentions`.
   */
  createMention(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a source type concept.
       */
      sourceTypeConceptId: string;
      /**
       * Identificador asociado a source ref.
       */
      sourceRefId: string;
      /**
       * Identificador asociado a mentioned profile.
       */
      mentionedProfileId: string;
      /**
       * Valor de offset start mantenido por la instancia.
       */
      offsetStart?: number;
      /**
       * Valor de offset end mantenido por la instancia.
       */
      offsetEnd?: number;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): Mentions {
    return em.create(
      Mentions,
      {
        sourceTypeConceptId: data.sourceTypeConceptId,
        sourceRefId: data.sourceRefId,
        mentionedProfileId: data.mentionedProfileId,
        offsetStart: data.offsetStart,
        offsetEnd: data.offsetEnd,
        statusConceptId: COMM.MENTION_STATUS_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
