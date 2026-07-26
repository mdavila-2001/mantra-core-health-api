import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Identifiers } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos mínimos para dar de alta un identificador oficial. */
export interface CreateIdentifierData {
  ownerTypeConceptId: string;
  ownerId: string;
  typeConceptId: string;
  system?: string;
  value: string;
  useConceptId?: string;
  stateConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `common.identifiers`.
 *
 * Repositorio sin estado: cada método recibe el `EntityManager` activo para que
 * el servicio controle la transacción y varias operaciones compartan el mismo
 * `flush`. No contiene reglas de negocio, solo consultas y materialización.
 */
@Injectable()
export class IdentifiersRepository {
  /**
   * Busca un identificador ACTIVO que colisione en (tipo, sistema, valor). Se usa
   * para imponer la unicidad lógica antes de crear uno nuevo.
   */
  findActiveDuplicate(
    em: EntityManager,
    params: { typeConceptId: string; system?: string; value: string },
  ): Promise<Identifiers | null> {
    return em.findOne(Identifiers, {
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      typeConceptId: params.typeConceptId,
      system: params.system ?? null,
      value: params.value,
    });
  }

  /** Construye la entidad en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateIdentifierData): Identifiers {
    return em.create(Identifiers, {
      ownerTypeConceptId: data.ownerTypeConceptId,
      ownerId: data.ownerId,
      typeConceptId: data.typeConceptId,
      system: data.system,
      value: data.value,
      useConceptId: data.useConceptId,
      stateConceptId: data.stateConceptId,
      ...createdBy(data.actorUserId),
      // `partial: true` relaja el tipado estricto de `em.create`: la columna
      // `row_version` (version: true) tiene DEFAULT en BD y MikroORM la gestiona,
      // pero su tipo la marcaría como requerida. No altera el comportamiento.
    }, { partial: true });
  }
}
