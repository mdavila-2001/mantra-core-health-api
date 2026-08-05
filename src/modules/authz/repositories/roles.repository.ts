import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Roles } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de alta de un rol (de tenant o de sistema). */
export interface CreateRoleData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a parent role.
   */
  parentRoleId?: string;
  /**
   * Identificador asociado a base role concept.
   */
  baseRoleConceptId?: string;
  /**
   * Identificador asociado a scope concept.
   */
  scopeConceptId?: string;
  /**
   * Valor de is system mantenido por la instancia.
   */
  isSystem?: boolean;
  /**
   * Valor de is assignable mantenido por la instancia.
   */
  isAssignable?: boolean;
  /**
   * Valor de priority mantenido por la instancia.
   */
  priority?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `authz.roles`. */
@Injectable()
export class RolesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Roles | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Roles | null> {
    return em.findOne(Roles, { id });
  }

  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<Roles | null>`.
   */
  findByCode(em: EntityManager, code: string): Promise<Roles | null> {
    return em.findOne(Roles, { code });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Roles`.
   */
  create(em: EntityManager, data: CreateRoleData): Roles {
    return em.create(
      Roles,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        parentRoleId: data.parentRoleId,
        baseRoleConceptId: data.baseRoleConceptId,
        scopeConceptId: data.scopeConceptId,
        isSystem: data.isSystem ?? false,
        isAssignable: data.isAssignable ?? true,
        priority: data.priority,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
