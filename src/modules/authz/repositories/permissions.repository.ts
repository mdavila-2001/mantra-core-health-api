import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Permissions } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de alta de un permiso del catálogo global. */
export interface CreatePermissionData {
  code: string;
  name: string;
  resource: string;
  actionConceptId: string;
  categoryId?: string;
  defaultScopeConceptId?: string;
  isFieldLevel?: boolean;
  isDangerous?: boolean;
  isRoleRestricted?: boolean;
  requiredRoleCode?: string;
  allowDirectUserGrant?: boolean;
  actorUserId?: string;
}

/** Acceso a datos de `authz.permissions` (catálogo global, sin tenant). */
@Injectable()
export class PermissionsRepository {
  findByCode(em: EntityManager, code: string): Promise<Permissions | null> {
    return em.findOne(Permissions, { code });
  }

  findById(em: EntityManager, id: string): Promise<Permissions | null> {
    return em.findOne(Permissions, { id });
  }

  /** Permiso por (recurso, acción) para resolver una decisión del PDP. */
  findByResourceAction(
    em: EntityManager,
    resource: string,
    actionConceptId: string,
  ): Promise<Permissions | null> {
    return em.findOne(Permissions, { resource, actionConceptId });
  }

  /** Crea el permiso en estado ACTIVO (sin flush). */
  create(em: EntityManager, data: CreatePermissionData): Permissions {
    return em.create(
      Permissions,
      {
        code: data.code,
        name: data.name,
        resource: data.resource,
        actionConceptId: data.actionConceptId,
        categoryId: data.categoryId,
        defaultScopeConceptId: data.defaultScopeConceptId,
        isFieldLevel: data.isFieldLevel ?? false,
        isDangerous: data.isDangerous ?? false,
        isRoleRestricted: data.isRoleRestricted ?? false,
        requiredRoleCode: data.requiredRoleCode,
        allowDirectUserGrant: data.allowDirectUserGrant ?? true,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
