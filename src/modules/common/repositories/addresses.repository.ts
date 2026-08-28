import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Addresses } from '../entities';
import { createdBy, touch } from '../../../common';

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
  /** Latitud del punto, si se conoce. */
  latitude?: string;
  /** Longitud del punto, si se conoce. */
  longitude?: string;
}

/**
 * Acceso a datos de `common.addresses`.
 *
 * Repositorio sin estado: recibe el `EntityManager` activo por parámetro. Solo
 * construcción de consultas y materialización.
 */
@Injectable()
export class AddressesRepository {
  /**
   * La dirección vigente de un dueño para un uso (domicilio, trabajo).
   *
   * Vigente = sin `validTo`, o con uno todavía por venir. Una dirección dada de
   * baja sigue en la tabla —es donde esa persona vivía— pero no es donde vive
   * hoy, y devolverla mezclada haría que la ficha mostrara un domicilio del que
   * ya se mudó.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ownerId - El dueño (para un paciente, su `personId`).
   * @param useConceptId - Uso de la dirección (`CONCEPTS.ADDR_USE_HOME`…).
   * @returns La dirección vigente, o `null` si no tiene ninguna.
   */
  async findVigenteByOwnerAndUse(
    em: EntityManager,
    ownerId: string,
    useConceptId: string,
  ): Promise<Addresses | null> {
    const ahora = new Date();
    return em.findOne(
      Addresses,
      {
        ownerId,
        useConceptId,
        $or: [{ validTo: null }, { validTo: { $gt: ahora } }],
      },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  /**
   * Da de baja una dirección poniéndole fin de vigencia.
   *
   * Mismo criterio que los puntos de contacto: mudarse no borra dónde vivía
   * antes. `valid_to` es una columna `date`, así que con la fecha de hoy la
   * dirección deja de ser vigente en la misma petición.
   *
   * @param direccion - La dirección a cerrar.
   * @param validTo - Fecha de fin de vigencia (normalmente hoy).
   * @param actorUserId - Quién la cierra, para la auditoría.
   * @returns La misma dirección, ya cerrada.
   */
  closeVigente(
    direccion: Addresses,
    validTo: Date,
    actorUserId?: string,
  ): Addresses {
    direccion.validTo = validTo;
    return touch(direccion, actorUserId);
  }

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
        latitude: data.latitude,
        longitude: data.longitude,
        ...createdBy(data.actorUserId),
        // `partial: true`: la columna `row_version` (version: true) tiene DEFAULT en
        // BD y la gestiona MikroORM; el tipo la exigiría sin este relajo.
      },
      { partial: true },
    );
  }
}
