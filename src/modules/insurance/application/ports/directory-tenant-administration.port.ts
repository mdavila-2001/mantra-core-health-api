import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';

/** Tenant access decisions used by insurance application operations. */
export interface DirectoryTenantAdministrationPort {
  assertCanAdminister(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void>;
  canAdminister(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean>;
  assertCanRead(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void>;
}

export const DIRECTORY_TENANT_ADMINISTRATION_PORT = Symbol(
  'INSURANCE_DIRECTORY_TENANT_ADMINISTRATION_PORT',
);
