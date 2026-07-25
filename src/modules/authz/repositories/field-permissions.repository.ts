import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FieldPermissions } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una regla de enmascaramiento de campo por rol. */
export interface UpsertFieldPermissionData {
  roleId: string;
  entity: string;
  columnName: string;
  canRead: boolean;
  canWrite: boolean;
  maskStrategyConceptId?: string;
  conditionJson?: unknown;
  actorUserId?: string;
}

/** Acceso a datos de `authz.field_permissions`. */
@Injectable()
export class FieldPermissionsRepository {
  /** Regla concreta (role, entity, column) si existe. */
  findOneByKey(
    em: EntityManager,
    roleId: string,
    entity: string,
    columnName: string,
  ): Promise<FieldPermissions | null> {
    return em.findOne(FieldPermissions, { roleId, entity, columnName });
  }

  /** Reglas de enmascaramiento de un conjunto de roles (para el PDP). */
  findForRoles(em: EntityManager, roleIds: string[]): Promise<FieldPermissions[]> {
    if (roleIds.length === 0) return Promise.resolve([]);
    return em.find(FieldPermissions, { roleId: { $in: roleIds } });
  }

  create(em: EntityManager, data: UpsertFieldPermissionData): FieldPermissions {
    return em.create(
      FieldPermissions,
      {
        roleId: data.roleId,
        entity: data.entity,
        columnName: data.columnName,
        canRead: data.canRead,
        canWrite: data.canWrite,
        maskStrategyConceptId: data.maskStrategyConceptId,
        conditionJson: data.conditionJson,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
