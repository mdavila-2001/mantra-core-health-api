import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserPermissionGrants } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de una excepción de permiso por usuario (allow/deny fuera del rol). */
export interface CreatePermissionGrantData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a permission.
   */
  permissionId: string;
  /**
   * Identificador asociado a effect concept.
   */
  effectConceptId: string;
  /**
   * Identificador asociado a scope concept.
   */
  scopeConceptId?: string;
  /**
   * Valor de resource selector json mantenido por la instancia.
   */
  resourceSelectorJson?: unknown;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de reason mantenido por la instancia.
   */
  reason: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `authz.user_permission_grants`. */
@Injectable()
export class UserPermissionGrantsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<UserPermissionGrants | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<UserPermissionGrants | null> {
    return em.findOne(UserPermissionGrants, { id });
  }

  /** Excepción activa concreta (user, permission) si existe. */
  findActive(
    em: EntityManager,
    userId: string,
    permissionId: string,
  ): Promise<UserPermissionGrants | null> {
    return em.findOne(UserPermissionGrants, {
      userId,
      permissionId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Excepciones activas del usuario (para el PDP). */
  findActiveForUser(
    em: EntityManager,
    userId: string,
  ): Promise<UserPermissionGrants[]> {
    return em.find(UserPermissionGrants, {
      userId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `UserPermissionGrants`.
   */
  create(
    em: EntityManager,
    data: CreatePermissionGrantData,
  ): UserPermissionGrants {
    return em.create(
      UserPermissionGrants,
      {
        userId: data.userId,
        permissionId: data.permissionId,
        effectConceptId: data.effectConceptId,
        scopeConceptId: data.scopeConceptId,
        resourceSelectorJson: data.resourceSelectorJson,
        tenantId: data.tenantId,
        reason: data.reason,
        validFrom: data.validFrom,
        validTo: data.validTo,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
