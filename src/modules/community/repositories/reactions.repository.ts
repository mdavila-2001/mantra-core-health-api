import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Reactions } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de upsert reaction data.
 */
export interface UpsertReactionData {
  /**
   * Identificador asociado a actor profile.
   */
  actorProfileId: string;
  /**
   * Identificador asociado a reactable type concept.
   */
  reactableTypeConceptId: string;
  /**
   * Identificador asociado a reactable ref.
   */
  reactableRefId: string;
  /**
   * Identificador asociado a reaction type concept.
   */
  reactionTypeConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `community.reactions`. Una reacción por actor/objeto: la
 * clave única `(actor, reactable_type, reactable_ref)` se resuelve en el servicio
 * buscando primero la fila existente y actualizando su tipo.
 */
@Injectable()
export class ReactionsRepository {
  /**
   * Obtiene find by actor target.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param actorProfileId - Identificador de actor profile.
   * @param reactableTypeConceptId - Identificador de reactable type concept.
   * @param reactableRefId - Identificador de reactable ref.
   * @returns Resultado de find by actor target conforme al contrato `Promise<Reactions | null>`.
   */
  findByActorTarget(
    em: EntityManager,
    actorProfileId: string,
    reactableTypeConceptId: string,
    reactableRefId: string,
  ): Promise<Reactions | null> {
    return em.findOne(Reactions, {
      actorProfileId,
      reactableTypeConceptId,
      reactableRefId,
    });
  }

  /**
   * Reacciones de un contenido agrupadas por tipo (UC-19-03, cara de lectura).
   *
   * Devuelve el recuento y no las filas: quien dibuja una publicación necesita
   * «12 me gusta», no doce identificadores de perfil que además serían PHI
   * innecesaria en un muro.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reactableTypeConceptId - Tipo del contenido reaccionado.
   * @param reactableRefId - Id del contenido reaccionado.
   * @returns Pares tipo de reacción → cantidad.
   */
  async summarizeByTarget(
    em: EntityManager,
    reactableTypeConceptId: string,
    reactableRefId: string,
  ): Promise<{ reactionTypeConceptId: string; count: number }[]> {
    const rows = await em
      .getConnection()
      .execute<Array<{ reaction_type_concept_id: string; count: number }>>(
        `select reaction_type_concept_id, count(*)::int as count
           from community.reactions
          where reactable_type_concept_id=? and reactable_ref_id=?
          group by reaction_type_concept_id`,
        [reactableTypeConceptId, reactableRefId],
        'all',
      );

    return rows.map((row) => ({
      reactionTypeConceptId: row.reaction_type_concept_id,
      count: row.count,
    }));
  }

  /**
   * Lo mismo que {@link summarizeByTarget} pero para toda una página.
   *
   * **Por qué existe.** `community.social_posts` no tiene columna de contador
   * —y agregarle una para comodidad de esta lectura sería agregar esquema por
   * comodidad—, así que el recuento se calcula al leer. Calculado publicación
   * por publicación, un muro de cincuenta costaría cincuenta consultas; agrupado
   * por `reactable_ref_id`, cuesta una.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reactableTypeConceptId - Tipo del contenido reaccionado.
   * @param reactableRefIds - Ids de los contenidos de la página.
   * @returns Tripletas contenido → tipo de reacción → cantidad.
   */
  async summarizeByTargets(
    em: EntityManager,
    reactableTypeConceptId: string,
    reactableRefIds: string[],
  ): Promise<
    { reactableRefId: string; reactionTypeConceptId: string; count: number }[]
  > {
    if (reactableRefIds.length === 0) return [];
    const rows = await em.getConnection().execute<
      Array<{
        reactable_ref_id: string;
        reaction_type_concept_id: string;
        count: number;
      }>
    >(
      `select reactable_ref_id, reaction_type_concept_id, count(*)::int as count
           from community.reactions
          where reactable_type_concept_id=? and reactable_ref_id = any(?)
          group by reactable_ref_id, reaction_type_concept_id`,
      [reactableTypeConceptId, reactableRefIds],
      'all',
    );

    return rows.map((row) => ({
      reactableRefId: row.reactable_ref_id,
      reactionTypeConceptId: row.reaction_type_concept_id,
      count: row.count,
    }));
  }

  /**
   * Las reacciones del propio lector sobre los contenidos de una página.
   *
   * Es lo que permite pintar un botón como activo tras recargar: sin esto, el
   * estado propio sólo existía mientras durara el gesto en la pantalla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param actorProfileId - Perfil del lector.
   * @param reactableTypeConceptId - Tipo del contenido reaccionado.
   * @param reactableRefIds - Ids de los contenidos de la página.
   * @returns Las reacciones propias que existan, una por contenido a lo sumo.
   */
  listByActorTargets(
    em: EntityManager,
    actorProfileId: string,
    reactableTypeConceptId: string,
    reactableRefIds: string[],
  ): Promise<Reactions[]> {
    if (reactableRefIds.length === 0) return Promise.resolve([]);
    return em.find(Reactions, {
      actorProfileId,
      reactableTypeConceptId,
      reactableRefId: { $in: reactableRefIds },
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Reactions`.
   */
  create(em: EntityManager, data: UpsertReactionData): Reactions {
    return em.create(
      Reactions,
      {
        actorProfileId: data.actorProfileId,
        reactableTypeConceptId: data.reactableTypeConceptId,
        reactableRefId: data.reactableRefId,
        reactionTypeConceptId: data.reactionTypeConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
