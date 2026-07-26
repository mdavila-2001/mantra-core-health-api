import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Reactions } from '../entities';
import { createdBy } from '../../../common';

export interface UpsertReactionData {
  actorProfileId: string;
  reactableTypeConceptId: string;
  reactableRefId: string;
  reactionTypeConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `community.reactions`. Una reacción por actor/objeto: la
 * clave única `(actor, reactable_type, reactable_ref)` se resuelve en el servicio
 * buscando primero la fila existente y actualizando su tipo.
 */
@Injectable()
export class ReactionsRepository {
  findByActorTarget(
    em: EntityManager,
    actorProfileId: string,
    reactableTypeConceptId: string,
    reactableRefId: string,
  ): Promise<Reactions | null> {
    return em.findOne(Reactions, { actorProfileId, reactableTypeConceptId, reactableRefId });
  }

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
