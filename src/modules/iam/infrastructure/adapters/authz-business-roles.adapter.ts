import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AuthzEffectiveRolesService } from '../../../authz/services';
import type { BusinessRolesPort } from '../../application/ports/business-roles.port';

/** Roles de negocio vigentes del sujeto, que decide `authz`. */
@Injectable()
export class AuthzBusinessRolesAdapter implements BusinessRolesPort {
  constructor(private readonly effectiveRoles: AuthzEffectiveRolesService) {}

  scopedAssignmentsForUser(em: EntityManager, userId: string) {
    return this.effectiveRoles.scopedAssignmentsForUser(em, userId);
  }

  ensureRoleByCode(
    ...args: Parameters<BusinessRolesPort['ensureRoleByCode']>
  ): Promise<boolean> {
    return this.effectiveRoles.ensureRoleByCode(...args);
  }
}
