import type { EntityManager } from '@mikro-orm/postgresql';

/** Una asignación vigente de un rol de negocio, con su ámbito si lo tiene. */
export interface BusinessRoleAssignment {
  readonly code: string;
  readonly tenantId?: string;
}

/**
 * Roles de negocio del sujeto (los diez actores clínicos incluidos). Viven en
 * `authz`, no en `iam.user_global_roles`: `iam` los pide a su dueño.
 */
export interface BusinessRolesPort {
  scopedAssignmentsForUser(
    em: EntityManager,
    userId: string,
  ): Promise<BusinessRoleAssignment[]>;

  /** Concede el rol `code` si existe y es asignable; devuelve si quedó en pie. */
  ensureRoleByCode(
    em: EntityManager,
    userId: string,
    code: string,
    options: { tenantId?: string; actorUserId?: string },
  ): Promise<boolean>;
}

export const BUSINESS_ROLES_PORT = Symbol('IAM_BUSINESS_ROLES_PORT');
