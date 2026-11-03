import type { EntityManager } from '@mikro-orm/postgresql';

export const IAM_PDP_ROLES = Symbol('AUTHZ_IAM_PDP_ROLES');
/** La autoridad de concesiones globales sigue siendo IAM, no el claim del solicitante. */
export interface IamGlobalRolesPort {
  codesForUser(em: EntityManager, userId: string): Promise<string[]>;
}
