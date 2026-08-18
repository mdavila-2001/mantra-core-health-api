import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { CommentsRepository, PublicProfilesRepository } from '../repositories';
import { COMM } from '../community.concepts';
import type {
  CreateGroupPostDto,
  GroupWallItemDto,
  GroupWallPageDto,
} from '../dto';
import type { Comments } from '../entities';
import { CommunityGroupAccessService } from './community-group-access.service';

/** Tope de respuestas que se traen por página de muro. */
const REPLIES_PER_PAGE = 200;

/**
 * El muro de un grupo: publicar y leer (P7).
 *
 * ## Por qué el muro son `comments` y no `social_posts`
 *
 * Porque `community.social_posts` **no tiene `group_id` ni `topic_id`** en el
 * modelo: no hay forma de decir «este post es de este grupo» sin agregar una
 * columna, y este carril no crea esquema. Queda anotado como bloqueador para
 * Marcelo (FK `social_posts.group_id`).
 *
 * Mientras tanto el muro se apoya en `community.comments`, que **sí** es
 * polimórfica: `commentable_type_concept_id` + `commentable_ref_id` apuntan a
 * cualquier cosa, y acá apuntan al grupo. Una publicación del muro es un
 * comentario raíz del grupo; una respuesta es un hijo suyo. No es un rodeo: es
 * la relación que el modelo ya declara, y trae gratis los hilos anidados, los
 * contadores de respuestas y la cola de reportes que P6 ya montó sobre
 * `comments`.
 *
 * **Lo que se pierde** hasta que exista la FK: una publicación de grupo no
 * lleva media adjunta, ni encuesta, ni entra al ranking del feed general. Se
 * documenta en el reporte del carril; no se emula acá.
 */
@Injectable()
export class CommunityGroupWallService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param commentsRepo - Acceso a `community.comments`.
   * @param profilesRepo - Acceso a `community.public_profiles`.
   * @param access - Reglas de quién lee y quién escribe dentro del grupo.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly commentsRepo: CommentsRepository,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly access: CommunityGroupAccessService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityGroupWallService.name);
  }

  /**
   * Publica en el muro del grupo, o responde a una publicación.
   *
   * @param groupId - Grupo donde se publica.
   * @param dto - Autor, cuerpo y publicación padre si es respuesta.
   * @param actor - Quien publica.
   * @returns La publicación creada, ya con su hilo resuelto.
   * @throws ResourceNotFoundException si el grupo, el autor o el padre no
   *   existen; ForbiddenException si el actor no es integrante activo.
   */
  async createPost(
    groupId: string,
    dto: CreateGroupPostDto,
    actor: AuthenticatedUser,
  ): Promise<GroupWallItemDto> {
    this.logger.info(
      { operation: 'community.group.post.create', groupId },
      'Publishing on a group wall',
    );

    return this.em.transactional(async (tx) => {
      const access = await this.access.resolve(
        tx,
        groupId,
        actor,
        dto.authorProfileId,
      );
      this.access.assertCanPost(access);

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
        // El padre tiene que ser del *mismo* grupo: sin esta comprobación, un
        // integrante podía colgar su respuesta de un hilo de otro grupo —uno
        // privado, incluso— y el hilo aparecía en un muro que no lo contiene.
        if (
          !parent ||
          parent.commentableTypeConceptId !== COMM.CONTENT_TYPE_GROUP ||
          parent.commentableRefId !== groupId
        )
          throw new ResourceNotFoundException(
            'La publicación a la que responde no es de este grupo',
            { groupId, parentCommentId: dto.parentCommentId },
          );

        parentCommentId = parent.id;
        rootCommentId = parent.rootCommentId ?? parent.id;
        threadDepth = (parent.threadDepth ?? 0) + 1;
        parent.replyCount = (parent.replyCount ?? 0) + 1;
        touch(parent, actor.id);
      }

      const post = this.commentsRepo.create(tx, {
        tenantId: access.group.tenantId,
        authorProfileId: dto.authorProfileId,
        commentableTypeConceptId: COMM.CONTENT_TYPE_GROUP,
        commentableRefId: groupId,
        parentCommentId,
        rootCommentId,
        threadDepth,
        bodyText: dto.bodyText,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      if (!rootCommentId) post.rootCommentId = post.id;

      // El contador del grupo cuenta publicaciones, no respuestas: es lo que se
      // muestra en la tarjeta del directorio, y ahí «12 publicaciones» tiene que
      // significar doce hilos y no doce mensajes sueltos de una sola discusión.
      if (!parentCommentId) {
        access.group.postCount = (access.group.postCount ?? 0) + 1;
        touch(access.group, actor.id);
      }
      await tx.flush();

      return this.toWallItem(post, []);
    });
  }

  /**
   * Muro del grupo: publicaciones con sus respuestas anidadas.
   *
   * @param groupId - Grupo a leer.
   * @param actor - Quien lee.
   * @param options - Perfil del lector, cursor y tope.
   * @returns Página del muro, de la publicación más antigua a la más nueva.
   * @throws ResourceNotFoundException si el grupo no existe o es secreto y
   *   ajeno; ForbiddenException si es privado y el lector no entró.
   */
  async listWall(
    groupId: string,
    actor: AuthenticatedUser,
    options: {
      /** Perfil del lector propuesto por el cliente; se verifica. */
      actorProfileId?: string;
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de publicaciones raíz. */
      limit: number;
    },
  ): Promise<GroupWallPageDto> {
    const em = this.em.fork();
    const access = await this.access.resolve(
      em,
      groupId,
      actor,
      options.actorProfileId,
    );
    this.access.assertCanRead(access);

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterKey =
      typeof after?.createdAt === 'string' && typeof after?.id === 'string'
        ? { createdAt: after.createdAt, id: after.id }
        : undefined;

    const rows = await this.commentsRepo.listRootsPage(
      em,
      COMM.CONTENT_TYPE_GROUP,
      groupId,
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
      items: roots.map((root) => this.toWallItem(root, replies)),
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

  /** Arma una publicación con las respuestas que le corresponden del lote. */
  private toWallItem(root: Comments, replies: Comments[]): GroupWallItemDto {
    return {
      id: root.id,
      authorProfileId: root.authorProfileId,
      bodyText: root.bodyText,
      parentCommentId: root.parentCommentId ?? null,
      threadDepth: root.threadDepth ?? null,
      replyCount: root.replyCount ?? null,
      createdAt: root.createdAt,
      replies: replies
        .filter((reply) => reply.parentCommentId === root.id)
        .map((reply) => this.toWallItem(reply, replies)),
    };
  }
}
