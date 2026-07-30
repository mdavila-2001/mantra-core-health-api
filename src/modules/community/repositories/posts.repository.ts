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
