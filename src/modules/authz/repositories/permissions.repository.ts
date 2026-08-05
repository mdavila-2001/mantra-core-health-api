import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Permissions } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de alta de un permiso del catálogo global. */
export interface CreatePermissionData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de resource mantenido por la instancia.
   */
  resource: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a category.
   */
  categoryId?: string;
  /**
   * Identificador asociado a default scope concept.
   */
  defaultScopeConceptId?: string;
  /**
   * Valor de is field level mantenido por la instancia.
   */
  isFieldLevel?: boolean;
  /**
   * Valor de is dangerous mantenido por la instancia.
   */
  isDangerous?: boolean;
  /**
   * Valor de is role restricted mantenido por la instancia.
   */
  isRoleRestricted?: boolean;
  /**
   * Valor de required role code mantenido por la instancia.
   */
  requiredRoleCode?: string;
  /**
   * Valor de allow direct user grant mantenido por la instancia.
   */
  allowDirectUserGrant?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `authz.permissions` (catálogo global, sin tenant). */
@Injectable()
export class PermissionsRepository {
  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<Permissions | null>`.
   */
  findByCode(em: EntityManager, code: string): Promise<Permissions | null> {
    return em.findOne(Permissions, { code });
  }

  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Permissions | null>`.
   */
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
