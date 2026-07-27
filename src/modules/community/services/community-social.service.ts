import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
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
} from '../repositories';
import {
  COMM,
  REACTION_CONCEPT_BY_CODE,
  SOCIAL_OBJECT_CONCEPT_BY_CODE,
  FOLLOWABLE_CONCEPT_BY_CODE,
} from '../community.concepts';
import {
  CreatePublicProfileDto,
  CreatePostDto,
  CreateCommentDto,
  ReactionDto,
  CreateBookmarkDto,
  CreateFollowDto,
  CreateBlockDto,
  PublicProfileResponseDto,
  PostResponseDto,
  CommentResponseDto,
  ReactionResponseDto,
  IdResponseDto,
} from '../dto';

const PROFILE_TARGET_BY_CODE: Record<string, string> = {
  USER: COMM.PROFILE_TARGET_USER,
  PRACTITIONER: COMM.PROFILE_TARGET_PRACTITIONER,
  ORGANIZATION: COMM.PROFILE_TARGET_ORGANIZATION,
};

const MEDIA_ROLE_BY_CODE: Record<string, string> = {
  IMAGE: COMM.MEDIA_ROLE_IMAGE,
  VIDEO: COMM.MEDIA_ROLE_VIDEO,
  DOCUMENT: COMM.MEDIA_ROLE_DOCUMENT,
};

const NOTIFICATION_LEVEL_BY_CODE: Record<string, string> = {
  ALL: COMM.NOTIFICATION_LEVEL_ALL,
  HIGHLIGHTS: COMM.NOTIFICATION_LEVEL_HIGHLIGHTS,
  NONE: COMM.NOTIFICATION_LEVEL_NONE,
};

const BLOCK_REASON_BY_CODE: Record<string, string> = {
  HARASSMENT: COMM.BLOCK_REASON_HARASSMENT,
  SPAM: COMM.BLOCK_REASON_SPAM,
  OTHER: COMM.BLOCK_REASON_OTHER,
};

/**
 * Núcleo social del módulo Community: perfiles públicos (bootstrap), publicación
 * de posts (UC-19-01), comentarios anidados (UC-19-02), reacciones (UC-19-03),
 * bookmarks (UC-19-04), follows (UC-19-05) y bloqueos (UC-19-14).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos, porque las FK son columnas uuid planas y MikroORM
 * no ordena inserts entre entidades no relacionadas.
 */
@Injectable()
export class CommunitySocialService {
  constructor(
    private readonly em: EntityManager,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly postsRepo: PostsRepository,
    private readonly commentsRepo: CommentsRepository,
    private readonly reactionsRepo: ReactionsRepository,
    private readonly bookmarksRepo: BookmarksRepository,
    private readonly followsRepo: FollowsRepository,
    private readonly blocksRepo: BlocksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunitySocialService.name);
  }

  /** Bootstrap: proyecta un sujeto de otro módulo como perfil público. */
  async createProfile(
    dto: CreatePublicProfileDto,
    actor: AuthenticatedUser,
  ): Promise<PublicProfileResponseDto> {
    this.logger.info(
      { operation: 'community.profile.create', actorId: actor.id },
      'Creating public profile',
    );
    return this.em.transactional(async (tx) => {
      const profile = this.profilesRepo.create(tx, {
        tenantId: dto.tenantId,
        targetTypeConceptId: PROFILE_TARGET_BY_CODE[dto.targetType ?? 'USER'],
        targetId: dto.targetId,
        slug: dto.slug,
        displayName: dto.displayName,
        headline: dto.headline,
        biography: dto.biography,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        acceptsReviews: dto.acceptsReviews,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: profile.id,
        slug: profile.slug,
        displayName: profile.displayName,
        status: profile.statusConceptId,
      };
    });
  }

  /** UC-19-01: publica un post con hashtags, media y menciones. */
  async publishPost(
    profileId: string,
    dto: CreatePostDto,
    actor: AuthenticatedUser,
  ): Promise<PostResponseDto> {
    this.logger.info(
      { operation: 'community.post.publish', profileId },
      'Publishing post',
    );
    return this.em.transactional(async (tx) => {
      const author = await this.profilesRepo.findById(tx, profileId);
      if (!author)
        throw new ResourceNotFoundException('Perfil autor no encontrado', {
          profileId,
        });

      const now = new Date();
      const post = this.postsRepo.create(tx, {
        authorPublicProfileId: profileId,
        postTypeConceptId:
          dto.postType === 'POLL' ? COMM.POST_TYPE_POLL : COMM.POST_TYPE_TEXT,
        bodyText: dto.bodyText,
        commentsEnabled:
          dto.commentsEnabled ?? author.commentsDefaultEnabled ?? true,
        healthDataScreeningStatusConceptId: COMM.SCREENING_PASSED,
        moderationStatusConceptId: COMM.MODERATION_PENDING,
        publicationStatusConceptId: COMM.PUBLICATION_PUBLISHED,
        publishedAt: now,
        actorUserId: actor.id,
      });
      // FK planas: persistir el post antes de sus hijos.
      await tx.flush();

      for (const [i, m] of (dto.media ?? []).entries()) {
        this.postsRepo.createMedia(tx, {
          postId: post.id,
          fileId: m.fileId,
          mediaRoleConceptId: MEDIA_ROLE_BY_CODE[m.mediaRole ?? 'IMAGE'],
          altText: m.altText,
          ordinal: m.ordinal ?? i,
          actorUserId: actor.id,
        });
      }

      let hashtagCount = 0;
      for (const raw of dto.hashtags ?? []) {
        const hashtag = await this.postsRepo.upsertHashtag(tx, raw, actor.id);
        await tx.flush(); // el vínculo necesita el id del hashtag persistido
        this.postsRepo.linkHashtag(
          tx,
          hashtag.id,
          post.id,
          COMM.CONTENT_TYPE_POST,
          actor.id,
        );
        hashtagCount++;
      }

      for (const mention of dto.mentions ?? []) {
        this.postsRepo.createMention(tx, {
          sourceTypeConceptId: COMM.CONTENT_TYPE_POST,
          sourceRefId: post.id,
          mentionedProfileId: mention.mentionedProfileId,
          offsetStart: mention.offsetStart,
          offsetEnd: mention.offsetEnd,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        { operation: 'community.post.publish', postId: post.id },
        'Post published',
      );
      return {
        id: post.id,
        authorPublicProfileId: post.authorPublicProfileId,
        publicationStatus: post.publicationStatusConceptId,
        mediaCount: dto.media?.length ?? 0,
        hashtagCount,
        publishedAt: post.publishedAt ?? null,
      };
    });
  }

  /** UC-19-02: comenta (hilo anidado) e incrementa el contador del padre. */
  async createComment(
    dto: CreateCommentDto,
    actor: AuthenticatedUser,
  ): Promise<CommentResponseDto> {
    this.logger.info(
      {
        operation: 'community.comment.create',
        authorProfileId: dto.authorProfileId,
      },
      'Creating comment',
    );
    return this.em.transactional(async (tx) => {
      const author = await this.profilesRepo.findById(tx, dto.authorProfileId);
      if (!author)
        throw new ResourceNotFoundException('Perfil autor no encontrado', {
          profileId: dto.authorProfileId,
        });

      let parentCommentId: string | undefined;
      let rootCommentId: string | undefined;
      let threadDepth = 0;
      if (dto.parentCommentId) {
        const parent = await this.commentsRepo.findById(
          tx,
          dto.parentCommentId,
        );
        if (!parent)
          throw new ResourceNotFoundException(
            'Comentario padre no encontrado',
            { parentCommentId: dto.parentCommentId },
          );
        parentCommentId = parent.id;
        rootCommentId = parent.rootCommentId ?? parent.id;
        threadDepth = (parent.threadDepth ?? 0) + 1;
        parent.replyCount = (parent.replyCount ?? 0) + 1;
        touch(parent, actor.id);
      }

      const comment = this.commentsRepo.create(tx, {
        authorProfileId: dto.authorProfileId,
        commentableTypeConceptId:
          SOCIAL_OBJECT_CONCEPT_BY_CODE[dto.commentableType],
        commentableRefId: dto.commentableRefId,
        parentCommentId,
        rootCommentId,
        threadDepth,
        bodyText: dto.bodyText,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      // El comentario raíz apunta a sí mismo si no tenía padre.
      if (!rootCommentId) {
        comment.rootCommentId = comment.id;
        rootCommentId = comment.id;
      }

      for (const mention of dto.mentions ?? []) {
        this.postsRepo.createMention(tx, {
          sourceTypeConceptId: COMM.CONTENT_TYPE_COMMENT,
          sourceRefId: comment.id,
          mentionedProfileId: mention.mentionedProfileId,
          offsetStart: mention.offsetStart,
          offsetEnd: mention.offsetEnd,
          actorUserId: actor.id,
        });
      }

      return {
        id: comment.id,
        rootCommentId: rootCommentId ?? comment.id,
        threadDepth,
      };
    });
  }

  /** UC-19-03: reacciona a un contenido (upsert una reacción por actor/objeto). */
  async react(
    dto: ReactionDto,
    actor: AuthenticatedUser,
  ): Promise<ReactionResponseDto> {
    return this.em.transactional(async (tx) => {
      const reactableType = SOCIAL_OBJECT_CONCEPT_BY_CODE[dto.reactableType];
      const reactionType = REACTION_CONCEPT_BY_CODE[dto.reactionType];
      const existing = await this.reactionsRepo.findByActorTarget(
        tx,
        dto.actorProfileId,
        reactableType,
        dto.reactableRefId,
      );
      if (existing) {
        existing.reactionTypeConceptId = reactionType;
        touch(existing, actor.id);
        return {
          id: existing.id,
          created: false,
          reactionType: dto.reactionType,
        };
      }
      const reaction = this.reactionsRepo.create(tx, {
        actorProfileId: dto.actorProfileId,
        reactableTypeConceptId: reactableType,
        reactableRefId: dto.reactableRefId,
        reactionTypeConceptId: reactionType,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: reaction.id, created: true, reactionType: dto.reactionType };
    });
  }

  /** UC-19-04: guarda un bookmark en una colección. */
  async bookmark(
    dto: CreateBookmarkDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.em.transactional(async (tx) => {
      const type = SOCIAL_OBJECT_CONCEPT_BY_CODE[dto.bookmarkableType];
      const dup = await this.bookmarksRepo.findByProfileTarget(
        tx,
        dto.profileId,
        type,
        dto.bookmarkableRefId,
      );
      if (dup)
        throw new ConflictException('El contenido ya está guardado', {
          bookmarkableRefId: dto.bookmarkableRefId,
        });
      const bookmark = this.bookmarksRepo.create(tx, {
        profileId: dto.profileId,
        bookmarkableTypeConceptId: type,
        bookmarkableRefId: dto.bookmarkableRefId,
        collectionName: dto.collectionName,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: bookmark.id };
    });
  }

  /** UC-19-05: sigue un objeto social (perfil, tópico, hashtag o grupo). */
  async follow(
    dto: CreateFollowDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.em.transactional(async (tx) => {
      if (
        dto.followableType === 'PROFILE' &&
        dto.followableRefId === dto.followerProfileId
      ) {
        throw new PreconditionFailedException(
          'No se puede seguir a uno mismo',
          {
            followerProfileId: dto.followerProfileId,
          },
        );
      }
      const type = FOLLOWABLE_CONCEPT_BY_CODE[dto.followableType];
      const dup = await this.followsRepo.findByFollowerTarget(
        tx,
        dto.followerProfileId,
        type,
        dto.followableRefId,
      );
      if (dup && dup.statusConceptId === CONCEPTS.STATE_ACTIVE) {
        throw new ConflictException('Ya sigue este objeto', {
          followableRefId: dto.followableRefId,
        });
      }
      if (dup) {
        dup.statusConceptId = CONCEPTS.STATE_ACTIVE;
        touch(dup, actor.id);
        return { id: dup.id };
      }
      const follow = this.followsRepo.create(tx, {
        followerProfileId: dto.followerProfileId,
        followableTypeConceptId: type,
        followableRefId: dto.followableRefId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        notificationLevelConceptId:
          NOTIFICATION_LEVEL_BY_CODE[dto.notificationLevel ?? 'ALL'],
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: follow.id };
    });
  }

  /** UC-19-14: bloquea a un usuario y poda follows mutuos. */
  async block(
    dto: CreateBlockDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.em.transactional(async (tx) => {
      if (dto.blockerProfileId === dto.blockedProfileId) {
        throw new PreconditionFailedException(
          'No se puede bloquear a uno mismo',
          {
            blockerProfileId: dto.blockerProfileId,
          },
        );
      }
      const dup = await this.blocksRepo.findByPair(
        tx,
        dto.blockerProfileId,
        dto.blockedProfileId,
      );
      if (dup)
        throw new ConflictException('El usuario ya está bloqueado', {
          blockedProfileId: dto.blockedProfileId,
        });

      const block = this.blocksRepo.create(tx, {
        blockerProfileId: dto.blockerProfileId,
        blockedProfileId: dto.blockedProfileId,
        reasonConceptId: dto.reason
          ? BLOCK_REASON_BY_CODE[dto.reason]
          : undefined,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      // Poda: soft-delete de follows mutuos entre ambas partes.
      const mutual = await this.followsRepo.findMutualBetween(
        tx,
        dto.blockerProfileId,
        dto.blockedProfileId,
        COMM.FOLLOWABLE_PROFILE,
      );
      for (const f of mutual) {
        f.statusConceptId = COMM.FOLLOW_REMOVED;
        touch(f, actor.id);
      }

      await tx.flush();
      return { id: block.id };
    });
  }
}
