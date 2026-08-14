import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Comments } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create comment data.
 */
export interface CreateCommentData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a author profile.
   */
  authorProfileId: string;
  /**
   * Identificador asociado a commentable type concept.
   */
  commentableTypeConceptId: string;
  /**
   * Identificador asociado a commentable ref.
   */
  commentableRefId: string;
  /**
   * Identificador asociado a parent comment.
   */
  parentCommentId?: string;
  /**
   * Identificador asociado a root comment.
   */
  rootCommentId?: string;
  /**
   * Valor de thread depth mantenido por la instancia.
   */
  threadDepth: number;
  /**
   * Valor de body text mantenido por la instancia.
   */
  bodyText: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `community.comments` (hilos anidados con contadores). */
@Injectable()
export class CommentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Comments | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Comments | null> {
    return em.findOne(Comments, { id });
  }

  /**
   * Comentarios raíz de un contenido (UC-19-04, cara de lectura).
   *
   * Pagina sólo las raíces: si la página contara también las respuestas, un
   * hilo con muchas respuestas se comería el tope y las demás conversaciones
   * del post no aparecerían nunca.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param commentableTypeConceptId - Tipo del contenido comentado.
   * @param commentableRefId - Id del contenido comentado.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @param limit - Tope de raíces.
   * @returns Página de comentarios raíz, del más antiguo al más nuevo.
   */
  listRootsPage(
    em: EntityManager,
    commentableTypeConceptId: string,
    commentableRefId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<Comments[]> {
    return em.find(
      Comments,
      {
        commentableTypeConceptId,
        commentableRefId,
        parentCommentId: null,
        ...(after
          ? {
              $or: [
                { createdAt: { $gt: new Date(after.createdAt) } },
                { createdAt: new Date(after.createdAt), id: { $gt: after.id } },
              ],
            }
          : {}),
      },
      { orderBy: { createdAt: 'ASC', id: 'ASC' }, limit },
    );
  }

  /**
   * Respuestas de un conjunto de hilos, para anidarlas en memoria.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param rootCommentIds - Raíces cuyos descendientes se quieren.
   * @param limit - Tope de respuestas del lote.
   * @returns Respuestas ordenadas cronológicamente.
   */
  listRepliesOf(
    em: EntityManager,
    rootCommentIds: string[],
    limit: number,
  ): Promise<Comments[]> {
    if (rootCommentIds.length === 0) return Promise.resolve([]);
    return em.find(
      Comments,
      {
        rootCommentId: { $in: rootCommentIds },
        parentCommentId: { $ne: null },
      },
      { orderBy: { createdAt: 'ASC', id: 'ASC' }, limit },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Comments`.
   */
  create(em: EntityManager, data: CreateCommentData): Comments {
    return em.create(
      Comments,
      {
        tenantId: data.tenantId,
        authorProfileId: data.authorProfileId,
        commentableTypeConceptId: data.commentableTypeConceptId,
        commentableRefId: data.commentableRefId,
        parentCommentId: data.parentCommentId,
        rootCommentId: data.rootCommentId,
        threadDepth: data.threadDepth,
        bodyText: data.bodyText,
        replyCount: 0,
        reactionCount: 0,
        isEdited: false,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
