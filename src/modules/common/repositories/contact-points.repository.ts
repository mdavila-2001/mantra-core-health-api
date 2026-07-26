import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ContactPoints } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta un punto de contacto. */
export interface CreateContactPointData {
  ownerTypeConceptId: string;
  ownerId: string;
  systemConceptId: string;
  value: string;
  useConceptId?: string;
  rank?: number;
  actorUserId?: string;
}

/**
 * Acceso a datos de `common.contact_points`.
 *
 * Repositorio sin estado: recibe el `EntityManager` activo por parámetro para que
 * el servicio gobierne la transacción. Solo consultas y materialización.
 */
@Injectable()
export class ContactPointsRepository {
  /** Busca un punto de contacto por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<ContactPoints | null> {
    return em.findOne(ContactPoints, { id });
  }

  /** Construye la entidad en la unidad de trabajo (sin flush). Nace no verificado. */
  create(em: EntityManager, data: CreateContactPointData): ContactPoints {
    return em.create(ContactPoints, {
      ownerTypeConceptId: data.ownerTypeConceptId,
      ownerId: data.ownerId,
      systemConceptId: data.systemConceptId,
      value: data.value,
      useConceptId: data.useConceptId,
      rank: data.rank,
      verified: false,
      ...createdBy(data.actorUserId),
      // `partial: true`: la columna `row_version` (version: true) tiene DEFAULT en
      // BD y la gestiona MikroORM; el tipo la exigiría sin este relajo.
    }, { partial: true });
  }
}
