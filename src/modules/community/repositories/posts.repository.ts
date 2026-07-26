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

export interface CreatePostData {
  authorPublicProfileId: string;
  postTypeConceptId: string;
  bodyText: string;
  visibilityConceptId?: string;
  commentsEnabled?: boolean;
  healthDataScreeningStatusConceptId: string;
  moderationStatusConceptId: string;
  publicationStatusConceptId: string;
  publishedAt?: Date;
  actorUserId?: string;
}

export interface CreateMediaData {
  postId: string;
  fileId: string;
  mediaRoleConceptId: string;
  altText?: string;
  ordinal?: number;
  actorUserId?: string;
}

/**
 * Acceso a datos de publicaciones sociales y su contenido derivado: adjuntos,
 * hashtags (upsert por tag normalizado), vínculos contenido-hashtag y menciones.
 */
@Injectable()
export class PostsRepository {
  findById(em: EntityManager, id: string): Promise<SocialPosts | null> {
    return em.findOne(SocialPosts, { id });
  }

  create(em: EntityManager, data: CreatePostData): SocialPosts {
    return em.create(
      SocialPosts,
      {
        authorPublicProfileId: data.authorPublicProfileId,
        postTypeConceptId: data.postTypeConceptId,
        bodyText: data.bodyText,
        visibilityConceptId: data.visibilityConceptId,
        commentsEnabled: data.commentsEnabled ?? true,
        healthDataScreeningStatusConceptId: data.healthDataScreeningStatusConceptId,
        moderationStatusConceptId: data.moderationStatusConceptId,
        publicationStatusConceptId: data.publicationStatusConceptId,
        publishedAt: data.publishedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

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
  async upsertHashtag(em: EntityManager, tag: string, actorUserId?: string): Promise<Hashtags> {
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

  createMention(
    em: EntityManager,
    data: {
      sourceTypeConceptId: string;
      sourceRefId: string;
      mentionedProfileId: string;
      offsetStart?: number;
      offsetEnd?: number;
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
