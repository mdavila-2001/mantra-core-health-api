import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserGlobalRoles } from '../../entities';
import { CONCEPTS, createdBy } from '../../../../common';

/** Alta de una concesión de rol global ACTIVA. */
export interface CreateRoleData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a role concept.
   */
  roleConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `iam.user_global_roles`. */
@Injectable()
export class UserGlobalRolesRepository {
  /** Crea una concesión de rol ACTIVA (sin flush). */
  create(em: EntityManager, data: CreateRoleData): UserGlobalRoles {
    return em.create(
      UserGlobalRoles,
      {
        userId: data.userId,
        roleConceptId: data.roleConceptId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Concesión ACTIVA concreta (usuario, rol) si existe. */
  findActive(
    em: EntityManager,
    userId: string,
    roleConceptId: string,
  ): Promise<UserGlobalRoles | null> {
    return em.findOne(UserGlobalRoles, {
      userId,
      roleConceptId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Todas las concesiones ACTIVAS del usuario (para construir el token). */
  findActiveForUser(
    em: EntityManager,
    userId: string,
  ): Promise<UserGlobalRoles[]> {
    return em.find(UserGlobalRoles, {
      userId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Revoca en bloque las concesiones ACTIVAS del usuario (anonimización). */
  revokeAllForUser(em: EntityManager, userId: string): Promise<number> {
    return em.nativeUpdate(
      UserGlobalRoles,
      { userId, stateConceptId: CONCEPTS.STATE_ACTIVE },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }
  /** Roles globales del usuario, vigentes y revocados. */
  findByUser(em: EntityManager, userId: string): Promise<UserGlobalRoles[]> {
    return em.find(
      UserGlobalRoles,
      { userId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * Cuántas cuentas ACTIVAS, distintas de `excludeUserId`, tienen alguno de estos roles activos.
   * Sustenta la guarda de «última cuenta administradora».
   */
  async countOtherActiveHolders(
    em: EntityManager,
    roleConceptIds: readonly string[],
    excludeUserId: string,
  ): Promise<number> {
    const rows = await em.getConnection().execute<Array<{ n: number }>>(
      `select count(distinct g.user_id)::int as n
           from iam.user_global_roles g join iam.users u on u.id = g.user_id
          where g.state_concept_id = ?::uuid
            and u.status_concept_id = ?::uuid
            and g.user_id <> ?::uuid
            and g.role_concept_id in (select value::uuid from jsonb_array_elements_text(?::jsonb))`,
      [
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.USER_ACTIVE,
        excludeUserId,
        JSON.stringify(roleConceptIds),
      ],
      'all',
      em.getTransactionContext(),
    );
    return rows[0]?.n ?? 0;
  }
}
