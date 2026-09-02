import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Identifiers } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos mínimos para dar de alta un identificador oficial. */
export interface CreateIdentifierData {
  /**
   * Identificador asociado a owner type concept.
   */
  ownerTypeConceptId: string;
  /**
   * Identificador asociado a owner.
   */
  ownerId: string;
  /**
   * Identificador asociado a type concept.
   */
  typeConceptId: string;
  /**
   * Valor de system mantenido por la instancia.
   */
  system?: string;
  /**
   * Valor de value mantenido por la instancia.
   */
  value: string;
  /**
   * Razón social del titular. `em.create` sólo escribe lo que este objeto
   * nombra, así que omitirlo acá dejaría la columna en `NULL` sin fallar.
   */
  holderName?: string;
  /**
   * Identificador asociado a use concept.
   */
  useConceptId?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Departamento emisor (miembro de `VS_BO_DEPARTMENT`). Sólo aplica a
   * documentos bolivianos; el resto de tipos de identificador lo dejan vacío.
   */
  issuerAdministrativeAreaConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
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
    params: {
      /**
       * Identificador asociado a type concept.
       */
      typeConceptId: string; /**
       * Valor de system mantenido por la instancia.
       */
      system?: string; /**
       * Valor de value mantenido por la instancia.
       */
      value: string;
    },
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
    return em.create(
      Identifiers,
      {
        ownerTypeConceptId: data.ownerTypeConceptId,
        ownerId: data.ownerId,
        typeConceptId: data.typeConceptId,
        system: data.system,
        value: data.value,
        holderName: data.holderName,
        useConceptId: data.useConceptId,
        stateConceptId: data.stateConceptId,
        issuerAdministrativeAreaConceptId:
          data.issuerAdministrativeAreaConceptId,
        ...createdBy(data.actorUserId),
        // `partial: true` relaja el tipado estricto de `em.create`: la columna
        // `row_version` (version: true) tiene DEFAULT en BD y MikroORM la gestiona,
        // pero su tipo la marcaría como requerida. No altera el comportamiento.
      },
      { partial: true },
    );
  }
}
