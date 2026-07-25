import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Addresses } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta una dirección postal. */
export interface CreateAddressData {
  ownerTypeConceptId: string;
  ownerId: string;
  /** Líneas de la dirección ya serializadas a una sola cadena (la columna es varchar). */
  lines?: string;
  city?: string;
  postalCode?: string;
  countryConceptId: string;
  useConceptId?: string;
  typeConceptId?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `common.addresses`.
 *
 * Repositorio sin estado: recibe el `EntityManager` activo por parámetro. Solo
 * construcción de consultas y materialización.
 */
@Injectable()
export class AddressesRepository {
  /** Construye la entidad en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateAddressData): Addresses {
    return em.create(Addresses, {
      ownerTypeConceptId: data.ownerTypeConceptId,
      ownerId: data.ownerId,
      lines: data.lines,
      city: data.city,
      postalCode: data.postalCode,
      countryConceptId: data.countryConceptId,
      useConceptId: data.useConceptId,
      typeConceptId: data.typeConceptId,
      ...createdBy(data.actorUserId),
      // `partial: true`: la columna `row_version` (version: true) tiene DEFAULT en
      // BD y la gestiona MikroORM; el tipo la exigiría sin este relajo.
    }, { partial: true });
  }
}
