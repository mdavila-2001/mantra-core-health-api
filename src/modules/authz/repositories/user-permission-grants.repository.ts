import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserPermissionGrants } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de una excepción de permiso por usuario (allow/deny fuera del rol). */
export interface CreatePermissionGrantData {
  userId: string;
  permissionId: string;
  effectConceptId: string;
  scopeConceptId?: string;
  resourceSelectorJson?: unknown;
  tenantId?: string;
  reason: string;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `authz.user_permission_grants`. */
@Injectable()
export class UserPermissionGrantsRepository {
  findById(em: EntityManager, id: string): Promise<UserPermissionGrants | null> {
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
  findActiveForUser(em: EntityManager, userId: string): Promise<UserPermissionGrants[]> {
    return em.find(UserPermissionGrants, {
      userId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  create(em: EntityManager, data: CreatePermissionGrantData): UserPermissionGrants {
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
