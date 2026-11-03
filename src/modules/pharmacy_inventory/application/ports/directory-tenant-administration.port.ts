import type { AuthenticatedUser } from '../../../../common';
import type { UnitOfWork } from './unit-of-work';

/** Consulta de autorización de tenant provista por el contexto directory. */
export interface DirectoryTenantAdministrationPort {
  canAdminister(
    uow: UnitOfWork,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean>;
}

/** Token de inyección para la autorización de administración de tenant. */
export const DIRECTORY_TENANT_ADMINISTRATION_PORT = Symbol(
  'DIRECTORY_TENANT_ADMINISTRATION_PORT',
);
