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
  POST_VISIBILITY_CONCEPT_BY_CODE,
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
  UpsertOwnPublicProfileDto,
  OwnPublicProfileDto,
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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profilesRepo - Valor de profiles repo requerido por la operación.
   * @param postsRepo - Valor de posts repo requerido por la operación.
   * @param commentsRepo - Valor de comments repo requerido por la operación.
   * @param reactionsRepo - Valor de reactions repo requerido por la operación.
   * @param bookmarksRepo - Valor de bookmarks repo requerido por la operación.
   * @param followsRepo - Valor de follows repo requerido por la operación.
   * @param blocksRepo - Valor de blocks repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
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
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunitySocialService.name);
  }

  /**
   * El sujeto que una sesión representa en el grafo social.
   *
   * Un profesional es su **perfil profesional** —así su vitrina sobrevive a un
   * cambio de cuenta y apunta a quien ejerce, no a quien inicia sesión—; el
   * resto de las cuentas se representan a sí mismas.
   *
   * Está acá y no en `profiles` porque no hace falta preguntar nada: el claim
   * `hpid` ya viaja en el token y el guard lo pone en el actor. Ir a `profiles` a
   * resolver lo que el token ya dice ataría los dos módulos por una lectura que
   * no aporta nada.
   */
  private sujetoDe(actor: AuthenticatedUser): {
    targetId: string;
    targetType: 'USER' | 'PRACTITIONER';
  } {
    return actor.practitionerProfileId
      ? { targetId: actor.practitionerProfileId, targetType: 'PRACTITIONER' }
      : { targetId: actor.id, targetType: 'USER' };
  }

  /**
   * La vitrina pública propia, o `null` si todavía no creó ninguna.
   *
   * `null` y no un 404: **no tener vitrina es un estado normal**, no un fallo.
   * Es de hecho el estado de todo el mundo hasta que decide publicar algo, y una
   * pantalla que tiene que distinguir «no tenés» de «falló» leyendo un código de
   * error termina tratando los dos casos igual.
   *
   * @param actor - La sesión, que es también el sujeto.
   * @returns El identificador y los campos editables, o `null`.
   */
  async getOwnProfile(
    actor: AuthenticatedUser,
  ): Promise<OwnPublicProfileDto | null> {
    const em = this.em.fork();
    const { targetId } = this.sujetoDe(actor);
    const profile = await this.profilesRepo.findByTarget(em, targetId);
    if (!profile) {
      return null;
    }
    return {
      id: profile.id,
      tenantId: profile.tenantId,
      targetId: profile.targetId,
      slug: profile.slug,
      displayName: profile.displayName,
      headline: profile.headline ?? null,
      biography: profile.biography ?? null,
      acceptsReviews: profile.acceptsReviews ?? null,
      verificationStatusConceptId: profile.verificationStatusConceptId ?? null,
      statusConceptId: profile.statusConceptId,
    };
  }

  /**
   * Crea o actualiza la vitrina propia. **Idempotente.**
   *
   * ## Por qué un `PUT` y no un `POST` más un `PATCH`
   *
   * Porque la pantalla que la edita no sabe —ni tiene por qué averiguar— si la
   * persona ya tenía vitrina. Con dos endpoints, esa pantalla tendría que leer
   * primero, decidir, y manejar la carrera entre las dos peticiones. Con un
   * `PUT` manda lo que el formulario dice y el servidor resuelve cuál de las dos
   * cosas es.
   *
   * ## Lo que no se puede declarar
   *
   * El estado de verificación, los sellos y el prestigio. Los otorga la
   * plataforma: si alguien pudiera declararse verificado, un sello verificado no
   * significaría nada. Y la organización no se cambia al editar — cambiar de
   * organización una vitrina con publicaciones detrás las movería a un tenant
   * que no las custodiaba.
   *
   * @param dto - Los campos de la vitrina.
   * @param actor - La sesión, que es también el sujeto.
   * @returns La vitrina, creada o actualizada.
   */
  async upsertOwnProfile(
    dto: UpsertOwnPublicProfileDto,
    actor: AuthenticatedUser,
  ): Promise<OwnPublicProfileDto> {
    this.logger.info(
      { operation: 'community.profile.upsertOwn', actorId: actor.id },
      'Upserting own public profile',
    );

    const { targetId, targetType } = this.sujetoDe(actor);

    await this.em.transactional(async (tx) => {
      // El slug es la dirección pública: dos vitrinas con el mismo texto son dos
      // enlaces que llevan a personas distintas según cuál resuelva primero.
      const ocupado = await this.profilesRepo.findBySlug(tx, dto.slug);
      if (ocupado && ocupado.targetId !== targetId) {
        throw new ConflictException('Ese enlace ya está en uso', {
          slug: dto.slug,
        });
      }

      const existente = await this.profilesRepo.findByTarget(tx, targetId);
      if (existente) {
        existente.slug = dto.slug;
        existente.displayName = dto.displayName;
        existente.headline = dto.headline;
        existente.biography = dto.biography;
        if (dto.acceptsReviews !== undefined) {
          existente.acceptsReviews = dto.acceptsReviews;
        }
        touch(existente, actor.id);
      } else {
        this.profilesRepo.create(tx, {
          tenantId: dto.tenantId,
          targetTypeConceptId: PROFILE_TARGET_BY_CODE[targetType],
          targetId,
          slug: dto.slug,
          displayName: dto.displayName,
          headline: dto.headline,
          biography: dto.biography,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          acceptsReviews: dto.acceptsReviews,
          actorUserId: actor.id,
        });
      }
      await tx.flush();
    });

    // Se relee en vez de devolver lo que se acaba de escribir: así quien edita
    // ve lo mismo que va a ver al recargar, incluido el estado de verificación
    // que esta operación no toca.
    const guardado = await this.getOwnProfile(actor);
    if (!guardado) {
      throw new PreconditionFailedException(
        'No se pudo recuperar el perfil público recién guardado',
      );
    }
    return guardado;
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
        visibilityConceptId:
          POST_VISIBILITY_CONCEPT_BY_CODE[dto.visibility ?? 'PUBLIC'],
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
