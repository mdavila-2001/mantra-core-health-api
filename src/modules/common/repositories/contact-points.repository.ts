import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ContactPoints } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta un punto de contacto. */
export interface CreateContactPointData {
  /**
   * Identificador asociado a owner type concept.
   */
  ownerTypeConceptId: string;
  /**
   * Identificador asociado a owner.
   */
  ownerId: string;
  /**
   * Identificador asociado a system concept.
   */
  systemConceptId: string;
  /**
   * Valor de value mantenido por la instancia.
   */
  value: string;
  /**
   * Identificador asociado a use concept.
   */
  useConceptId?: string;
  /**
   * Valor de rank mantenido por la instancia.
   */
  rank?: number;
  /**
   * Identificador asociado a actor user.
   */
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

  /**
   * Los puntos de contacto vigentes de un dueño, del más preferente al menos.
   *
   * Vigente = sin `validTo`, o con uno todavía por venir. Un contacto dado de
   * baja sigue en la tabla —es historia, no basura— pero no es por donde se
   * llega a alguien hoy, y devolverlo mezclado haría que la pantalla mostrara
   * un teléfono que ya no atiende.
   *
   * El orden es `rank` ascendente: es la columna que dice cuál es el preferido
   * cuando hay varios del mismo sistema. Las filas sin `rank` van al final.
   *
   * @param em - Contexto de persistencia.
   * @param ownerId - El dueño (para un profesional, su `personId`).
   * @returns Sus contactos vigentes; lista vacía si no tiene.
   */
  async findVigentesByOwner(
    em: EntityManager,
    ownerId: string,
  ): Promise<ContactPoints[]> {
    const ahora = new Date();
    return em.find(
      ContactPoints,
      { ownerId, $or: [{ validTo: null }, { validTo: { $gt: ahora } }] },
      { orderBy: { rank: 'asc nulls last', createdAt: 'asc' } },
    );
  }

  /** Construye la entidad en la unidad de trabajo (sin flush). Nace no verificado. */
  create(em: EntityManager, data: CreateContactPointData): ContactPoints {
    return em.create(
      ContactPoints,
      {
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
      },
      { partial: true },
    );
  }
}
