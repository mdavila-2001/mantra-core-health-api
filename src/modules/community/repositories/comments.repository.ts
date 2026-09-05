import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CommentMedia, Comments } from '../entities';
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

/** Describe el contrato estructural de create comment media data. */
export interface CreateCommentMediaData {
  /** Comentario al que se adjunta. */
  commentId: string;
  /** Archivo ya subido (`common.files`). */
  fileId: string;
  /** Concepto del rol del medio (imagen, sticker, GIF). */
  mediaRoleConceptId: string;
  /** Texto alternativo, si se aportó. */
  altText?: string;
  /** Orden de despliegue dentro del comentario. */
  ordinal?: number;
  /** Quién subió el adjunto. */
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
   * Cuántos comentarios vigentes tiene cada contenido de una página.
   *
   * Cuenta **el hilo completo**, raíces y respuestas: para quien mira el muro,
   * «8 comentarios» es la conversación entera, no sólo las intervenciones de
   * primer nivel.
   *
   * Igual que el recuento de reacciones, se calcula al leer y agrupado:
   * `community.social_posts` no tiene columna de contador y agregarle una para
   * comodidad de esta lectura sería agregar esquema por comodidad.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param commentableTypeConceptId - Tipo del contenido comentado.
   * @param commentableRefIds - Ids de los contenidos de la página.
   * @param activeStatusConceptId - Estado que cuenta como comentario vigente.
   * @returns Pares contenido → cantidad, sólo de los que tienen alguno.
   */
  async countByTargets(
    em: EntityManager,
    commentableTypeConceptId: string,
    commentableRefIds: string[],
    activeStatusConceptId: string,
  ): Promise<{ commentableRefId: string; count: number }[]> {
    if (commentableRefIds.length === 0) return [];
    // Un marcador por id: el driver no traduce un arreglo de JavaScript a un
    // arreglo de Postgres. Ver la nota en `ReactionsRepository`.
    const marcadores = commentableRefIds.map(() => '?').join(', ');
    const rows = await em
      .getConnection()
      .execute<Array<{ commentable_ref_id: string; count: number }>>(
        `select commentable_ref_id, count(*)::int as count
           from community.comments
          where commentable_type_concept_id=?
            and commentable_ref_id in (${marcadores})
            and status_concept_id=?
          group by commentable_ref_id`,
        [commentableTypeConceptId, ...commentableRefIds, activeStatusConceptId],
        'all',
      );

    return rows.map((row) => ({
      commentableRefId: row.commentable_ref_id,
      count: row.count,
    }));
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

  /**
   * Adjuntos de un conjunto de comentarios, en orden de despliegue
   * (REQ-01-011).
   *
   * Se pide por lote y no comentario por comentario: una página del hilo trae
   * raíces y respuestas juntas, y resolver los medios uno por uno sería un N+1
   * por cada comentario con foto.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param commentIds - Comentarios cuyos adjuntos se quieren.
   * @returns Los adjuntos de esos comentarios, del más antiguo al más nuevo.
   */
  listMediaForComments(
    em: EntityManager,
    commentIds: string[],
  ): Promise<CommentMedia[]> {
    if (commentIds.length === 0) return Promise.resolve([]);
    return em.find(
      CommentMedia,
      { commentId: { $in: commentIds } },
      { orderBy: { ordinal: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * El adjunto que apunta a un archivo, si alguno.
   *
   * Punto de entrada de `GET /community/comments/media/:fileId/content`
   * (FND-01): a quien pide los bytes con sesión no le alcanza con el `fileId`
   * solo —no dice de qué post es el comentario, que es lo que decide si el
   * lector puede verlo—, así que primero hay que volver de `fileId` a
   * `commentId`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fileId - Archivo del que se pide el adjunto.
   * @returns El adjunto, o `null` si ese archivo no es un adjunto de comentario.
   */
  findMediaByFileId(
    em: EntityManager,
    fileId: string,
  ): Promise<CommentMedia | null> {
    return em.findOne(CommentMedia, { fileId });
  }

  /**
   * Crea create media.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create media conforme al contrato `CommentMedia`.
   */
  createMedia(em: EntityManager, data: CreateCommentMediaData): CommentMedia {
    return em.create(
      CommentMedia,
      {
        commentId: data.commentId,
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
}
