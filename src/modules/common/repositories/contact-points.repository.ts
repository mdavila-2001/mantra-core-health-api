import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ContactPoints } from '../entities';
import { createdBy, touch } from '../../../common';

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

  /**
   * El punto de contacto vigente y preferente de un dueño para un sistema
   * (teléfono, correo).
   *
   * Es {@link findVigentesByOwner} acotado a un sistema y quedándose con el
   * primero: el mismo criterio de vigencia y el mismo orden por `rank`, para que
   * «el teléfono de esta persona» signifique lo mismo al leerlo que al
   * reemplazarlo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ownerId - El dueño (para un paciente, su `personId`).
   * @param systemConceptId - Sistema del contacto (`CONCEPTS.CONTACT_PHONE`…).
   * @returns El contacto vigente preferente, o `null` si no tiene ninguno.
   */
  async findVigenteByOwnerAndSystem(
    em: EntityManager,
    ownerId: string,
    systemConceptId: string,
  ): Promise<ContactPoints | null> {
    const ahora = new Date();
    return em.findOne(
      ContactPoints,
      {
        ownerId,
        systemConceptId,
        $or: [{ validTo: null }, { validTo: { $gt: ahora } }],
      },
      { orderBy: { rank: 'asc nulls last', createdAt: 'asc' } },
    );
  }

  /**
   * El punto de contacto vigente de un dueño para un sistema **y un uso**.
   *
   * Es {@link findVigenteByOwnerAndSystem} con una condición más, y existe
   * porque desde que el registro del profesional pide correo y celular
   * personales además de los del trabajo, el sistema dejó de alcanzar para
   * identificar un contacto: hay dos correos y dos celulares por persona, y lo
   * único que los separa es el uso. Buscar sólo por sistema devolvería
   * cualquiera de los dos y una edición del personal podría cerrar el laboral.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ownerId - El dueño (para un paciente, su `personId`).
   * @param systemConceptId - Sistema del contacto (`CONCEPTS.CONTACT_MOBILE`…).
   * @param useConceptId - Uso del contacto (`CONCEPTS.CONTACT_USE_WORK`…).
   * @returns El contacto vigente preferente de ese par, o `null`.
   */
  async findVigenteByOwnerSystemAndUse(
    em: EntityManager,
    ownerId: string,
    systemConceptId: string,
    useConceptId: string,
  ): Promise<ContactPoints | null> {
    const ahora = new Date();
    return em.findOne(
      ContactPoints,
      {
        ownerId,
        systemConceptId,
        useConceptId,
        $or: [{ validTo: null }, { validTo: { $gt: ahora } }],
      },
      { orderBy: { rank: 'asc nulls last', createdAt: 'asc' } },
    );
  }

  /**
   * Da de baja un punto de contacto poniéndole fin de vigencia.
   *
   * No lo borra ni lo pisa: el teléfono anterior es historia —por ahí se llamó a
   * esta persona— y sobrescribirlo dejaría al expediente afirmando que nunca
   * existió. Quien cambia de número cierra el vigente y crea el nuevo.
   *
   * `valid_to` es una columna `date`: con la fecha de hoy el contacto deja de
   * ser vigente para {@link findVigentesByOwner} en la misma petición.
   *
   * @param punto - El contacto a cerrar.
   * @param validTo - Fecha de fin de vigencia (normalmente hoy).
   * @param actorUserId - Quién lo cierra, para la auditoría.
   * @returns El mismo contacto, ya cerrado.
   */
  closeVigente(
    punto: ContactPoints,
    validTo: Date,
    actorUserId?: string,
  ): ContactPoints {
    punto.validTo = validTo;
    return touch(punto, actorUserId);
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
