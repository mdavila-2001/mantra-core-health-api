import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { RolePermissions } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de un binding rol↔permiso. */
export interface CreateRolePermissionData {
  /**
   * Identificador asociado a role.
   */
  roleId: string;
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
   * Valor de constraint json mantenido por la instancia.
   */
  constraintJson?: unknown;
  /**
   * Identificador asociado a field value set.
   */
  fieldValueSetId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `authz.role_permissions`. */
@Injectable()
export class RolePermissionsRepository {
  /** Bindings activos de un conjunto de roles (para el PDP). */
  findActiveForRoles(
    em: EntityManager,
    roleIds: string[],
  ): Promise<RolePermissions[]> {
    if (roleIds.length === 0) return Promise.resolve([]);
    return em.find(RolePermissions, {
      roleId: { $in: roleIds },
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Binding activo concreto (role, permission) si existe. */
  findActive(
    em: EntityManager,
    roleId: string,
    permissionId: string,
  ): Promise<RolePermissions | null> {
    return em.findOne(RolePermissions, {
      roleId,
      permissionId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `RolePermissions`.
   */
  create(em: EntityManager, data: CreateRolePermissionData): RolePermissions {
    return em.create(
      RolePermissions,
      {
        roleId: data.roleId,
        permissionId: data.permissionId,
        effectConceptId: data.effectConceptId,
        scopeConceptId: data.scopeConceptId,
        constraintJson: data.constraintJson,
        fieldValueSetId: data.fieldValueSetId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Soft-delete (REVOKED) de todos los bindings activos de un rol. */
  revokeAllForRole(em: EntityManager, roleId: string): Promise<number> {
    return em.nativeUpdate(
      RolePermissions,
      { roleId, stateConceptId: CONCEPTS.STATE_ACTIVE },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }
}
