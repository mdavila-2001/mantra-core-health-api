import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Addresses } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta una dirección postal. */
export interface CreateAddressData {
  /**
   * Identificador asociado a owner type concept.
   */
  ownerTypeConceptId: string;
  /**
   * Identificador asociado a owner.
   */
  ownerId: string;
  /** Líneas de la dirección ya serializadas a una sola cadena (la columna es varchar). */
  lines?: string;
  /**
   * Valor de city mantenido por la instancia.
   */
  city?: string;
  /**
   * Valor de postal code mantenido por la instancia.
   */
  postalCode?: string;
  /**
   * Identificador asociado a country concept.
   */
  countryConceptId: string;
  /**
   * Municipio boliviano (miembro de `VS_BO_MUNICIPALITY`).
   */
  municipalityConceptId?: string;
  /**
   * Identificador asociado a administrative area concept (departamento,
   * miembro de `VS_BO_DEPARTMENT`).
   */
  administrativeAreaConceptId?: string;
  /**
   * Identificador asociado a use concept.
   */
  useConceptId?: string;
  /**
   * Identificador asociado a type concept.
   */
  typeConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
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
    return em.create(
      Addresses,
      {
        ownerTypeConceptId: data.ownerTypeConceptId,
        ownerId: data.ownerId,
        lines: data.lines,
        city: data.city,
        postalCode: data.postalCode,
        countryConceptId: data.countryConceptId,
        municipalityConceptId: data.municipalityConceptId,
        administrativeAreaConceptId: data.administrativeAreaConceptId,
        useConceptId: data.useConceptId,
        typeConceptId: data.typeConceptId,
        ...createdBy(data.actorUserId),
        // `partial: true`: la columna `row_version` (version: true) tiene DEFAULT en
        // BD y la gestiona MikroORM; el tipo la exigiría sin este relajo.
      },
      { partial: true },
    );
  }
}
