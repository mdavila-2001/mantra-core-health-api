import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { CommentsRepository, ReactionsRepository } from '../repositories';
import { SOCIAL_OBJECT_CONCEPT_BY_CODE } from '../community.concepts';
import type { ReactionSummaryDto } from '../dto';

/** Reacciones y comentarios de una publicación, tal como los pinta una tarjeta. */
export interface PostEngagement {
  /** Recuento por tipo, total y —si el lector tiene perfil— su propia reacción. */
  readonly reactions: ReactionSummaryDto;
  /** Comentarios vigentes del hilo completo, raíces y respuestas. */
  readonly commentCount: number;
}

/** Compromiso vacío, para una publicación sin reacciones ni comentarios. */
const SIN_COMPROMISO: PostEngagement = {
  reactions: { tallies: [], total: 0 },
  commentCount: 0,
};

/**
 * Cuántas reacciones y comentarios tiene cada publicación de una página.
 *
 * ## Por qué es un servicio y no un método de cada lectura
 *
 * Lo necesitan las dos superficies que pintan tarjetas —el muro de un perfil y
 * el timeline— y las dos tienen que contar igual. Un recuento que se escribe dos
 * veces se desincroniza en la segunda.
 *
 * ## Por qué se calcula al leer
 *
 * `community.social_posts` no tiene columnas de contador. Agregárselas para
 * comodidad de esta lectura sería agregar esquema por comodidad, así que se
 * cuenta al leer — pero **agrupado por publicación**, en dos consultas por
 * página. Calculado tarjeta por tarjeta, un muro de cincuenta publicaciones
 * costaría cien viajes a la base.
 *
 * ## Qué arregla
 *
 * Sin esto, la única forma que tenía la interfaz de saber cuántas reacciones
 * había era `GET /posts/{id}/reactions`, una vez por tarjeta. En la práctica no
 * se pedía: el contador de la pantalla era el del gesto que el usuario acababa
 * de hacer, y **al recargar volvía a cero** aunque la reacción estuviera
 * guardada. El estado propio tampoco sobrevivía a la recarga.
 */
@Injectable()
export class CommunityEngagementService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reactionsRepo - Acceso a `community.reactions`.
   * @param commentsRepo - Acceso a `community.comments`.
   */
  constructor(
    private readonly reactionsRepo: ReactionsRepository,
    private readonly commentsRepo: CommentsRepository,
  ) {}

  /** El compromiso de una publicación sin reacciones ni comentarios. */
  static vacio(): PostEngagement {
    return SIN_COMPROMISO;
  }

  /**
   * Resuelve el compromiso de una página de publicaciones.
   *
   * Se llama con las publicaciones **visibles**, no con las leídas: contar las
   * reacciones de una que este lector no puede ver revelaría que existe.
   *
   * @param em - Contexto de persistencia.
   * @param postIds - Publicaciones visibles de la página.
   * @param actorProfileId - Perfil del lector, si tiene uno.
   * @returns Mapa publicación → compromiso. Las que no tienen nada también
   *   aparecen, con ceros: una tarjeta necesita un número, no un `undefined`.
   */
  async ofPosts(
    em: EntityManager,
    postIds: string[],
    actorProfileId?: string,
  ): Promise<Map<string, PostEngagement>> {
    if (postIds.length === 0) return new Map();

    const [tallies, comentarios, propias] = await Promise.all([
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
      actorProfileId
        ? this.reactionsRepo.listByActorTargets(
            em,
            actorProfileId,
            SOCIAL_OBJECT_CONCEPT_BY_CODE.POST,
            postIds,
          )
        : Promise.resolve([]),
    ]);

    const propiaPor = new Map(
      propias.map((reaction) => [
        reaction.reactableRefId,
        reaction.reactionTypeConceptId,
      ]),
    );
    const comentariosPor = new Map(
      comentarios.map((row) => [row.commentableRefId, row.count]),
    );

    return new Map(
      postIds.map((postId) => {
        const recuento = tallies
          .filter((tally) => tally.reactableRefId === postId)
          .map((tally) => ({
            reactionTypeConceptId: tally.reactionTypeConceptId,
            count: tally.count,
          }));
        return [
          postId,
          {
            reactions: {
              tallies: recuento,
              total: recuento.reduce((sum, tally) => sum + tally.count, 0),
              // `undefined` es «no se preguntó» —lector sin perfil—; `null` es
              // «no reaccionó». La interfaz necesita distinguirlos para saber si
              // puede pintar el botón como activo o si no tiene el dato.
              ...(actorProfileId
                ? { actorReactionTypeConceptId: propiaPor.get(postId) ?? null }
                : {}),
            },
            commentCount: comentariosPor.get(postId) ?? 0,
          },
        ];
      }),
    );
  }
}
