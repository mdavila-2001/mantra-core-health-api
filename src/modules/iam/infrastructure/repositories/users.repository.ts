import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Users } from '../../entities';
import { CONCEPTS, createdBy } from '../../../../common';

/** Datos mínimos para dar de alta un usuario. */
export interface CreateUserData {
  /**
   * Valor de display name mantenido por la instancia.
   */
  displayName: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a mfa status concept.
   */
  mfaStatusConceptId: string;
  /**
   * Valor de time zone mantenido por la instancia.
   */
  timeZone?: string;
  /** Exige cambio de credencial en el primer ingreso (registro asistido, C-18). */
  mustChangePassword?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `iam.users`.
 *
 * Los métodos reciben el `EntityManager` activo en lugar de inyectar uno propio:
 * así el servicio controla la unidad de trabajo y la transacción, y varios
 * repositorios pueden participar en el mismo `flush` atómico. Ninguna regla de
 * negocio vive aquí; solo construcción de consultas y materialización.
 */
@Injectable()
export class UsersRepository {
  /** Busca un usuario por id; devuelve `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Users | null> {
    return em.findOne(Users, { id });
  }

  /**
   * Busca un usuario por id tomando el cerrojo de la fila (`FOR UPDATE`) hasta el fin de la
   * transacción. Serializa dos cambios de ciclo de vida sobre la misma cuenta. Exige una
   * transacción abierta.
   */
  findByIdForUpdate(em: EntityManager, id: string): Promise<Users | null> {
    return em.findOne(Users, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  }

  /**
   * Serializa, hasta el fin de la transacción, los cambios que podrían dejar a la plataforma sin
   * cuenta administradora. El cerrojo de fila no alcanza: dos administradores distintos se
   * quitarían el acceso a la vez, cada uno viendo al otro todavía activo.
   */
  async lockAccessAdminChanges(em: EntityManager): Promise<void> {
    await em
      .getConnection()
      .execute(
        `select pg_advisory_xact_lock(hashtext('iam.access-admin-lifecycle'))`,
        [],
        'all',
        em.getTransactionContext(),
      );
  }

  /**
   * Cambia el estado de la cuenta **con la precondición en la escritura**: el `UPDATE` sólo
   * alcanza la fila si todavía está en uno de los estados `from`. Si otra transacción la movió,
   * devuelve `false` y no escribe.
   *
   * No pasa por la entidad: no hay lectura-modificación-escritura que pueda perder la carrera.
   * Sube `row_version` para que un escritor optimista que cargó la fila antes lo note.
   */
  async transitionStatus(
    em: EntityManager,
    id: string,
    from: readonly string[],
    to: string,
    actorUserId: string,
  ): Promise<boolean> {
    const rows = await em.getConnection().execute(
      `update iam.users
            set status_concept_id = ?::uuid, updated_at = now(), updated_by_user_id = ?::uuid,
                row_version = row_version + 1
          where id = ?::uuid
            and status_concept_id in (select value::uuid from jsonb_array_elements_text(?::jsonb))
        returning id`,
      [to, actorUserId, id, JSON.stringify(from)],
      'all',
      em.getTransactionContext(),
    );
    return rows.length === 1;
  }

  /** Crea la entidad de usuario en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateUserData): Users {
    return em.create(
      Users,
      {
        statusConceptId: data.statusConceptId,
        displayName: data.displayName,
        mfaStatusConceptId: data.mfaStatusConceptId,
        timeZone: data.timeZone,
        mustChangePassword: data.mustChangePassword,
        emailVerified: false,
        phoneVerified: false,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Una página del listado de usuarios, por cursor keyset sobre `(display_name, id)`.
   *
   * El desempate por `id` no es decorativo: `display_name` no es único —dos
   * personas pueden llamarse igual— y sin él dos páginas consecutivas repetirían u
   * omitirían filas. `id` sí es total dentro de la tabla.
   *
   * @param em - Contexto de persistencia.
   * @param filters - Estado, identificadores ya acotados y cursor.
   * @param limit - Tope de filas a devolver.
   * @returns Usuarios ordenados por `(display_name, id)`.
   */
  searchPage(
    em: EntityManager,
    filters: {
      /** Estado al que acotar. */
      statusConceptId?: string;
      /** Identificadores a los que acotar (resultado de la búsqueda por texto). */
      ids?: string[];
      /** Texto libre sobre el nombre visible. */
      query?: string;
      /** Última fila de la página anterior. */
      after?: {
        /** Nombre visible de la última fila. */
        displayName: string;
        /** Identificador de la última fila. */
        id: string;
      };
    },
    limit: number,
  ): Promise<Users[]> {
    const where: Record<string, unknown> = {};

    if (filters.statusConceptId) {
      where.statusConceptId = filters.statusConceptId;
    }

    if (filters.query) {
      const pattern = `%${filters.query}%`;
      // El texto casa contra el nombre visible o contra los identificadores que
      // ya resolvió el servicio (los sujetos de las credenciales). Un `$in` vacío
      // se traduce a `in (null)` y anularía también la rama del nombre, así que
      // sólo se añade cuando hay algo dentro.
      where.$or =
        filters.ids && filters.ids.length > 0
          ? [{ displayName: { $ilike: pattern } }, { id: { $in: filters.ids } }]
          : [{ displayName: { $ilike: pattern } }];
    } else if (filters.ids) {
      where.id = { $in: filters.ids };
    }

    if (filters.after) {
      const keyset = [
        { displayName: { $gt: filters.after.displayName } },
        {
          displayName: filters.after.displayName,
          id: { $gt: filters.after.id },
        },
      ];
      // El keyset se combina con `$and` para no pisar el `$or` de la búsqueda por
      // texto: dos `$or` en el mismo objeto se sobrescriben y el cursor dejaría
      // de aplicarse en silencio.
      where.$and = [{ $or: keyset }];
    }

    return em.find(Users, where, {
      orderBy: [{ displayName: 'ASC' }, { id: 'ASC' }],
      limit,
    });
  }

  /** Cuenta usuarios activos; utilidad para métricas/pruebas. */
  countActive(em: EntityManager): Promise<number> {
    return em.count(Users, { statusConceptId: CONCEPTS.USER_ACTIVE });
  }
}
