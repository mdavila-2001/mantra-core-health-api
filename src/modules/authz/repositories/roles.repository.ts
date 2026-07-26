import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Roles } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de alta de un rol (de tenant o de sistema). */
export interface CreateRoleData {
  tenantId?: string;
  code: string;
  name: string;
  parentRoleId?: string;
  baseRoleConceptId?: string;
  scopeConceptId?: string;
  isSystem?: boolean;
  isAssignable?: boolean;
  priority?: number;
  actorUserId?: string;
}

/** Acceso a datos de `authz.roles`. */
@Injectable()
export class RolesRepository {
  findById(em: EntityManager, id: string): Promise<Roles | null> {
    return em.findOne(Roles, { id });
  }

  findByCode(em: EntityManager, code: string): Promise<Roles | null> {
    return em.findOne(Roles, { code });
  }

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
