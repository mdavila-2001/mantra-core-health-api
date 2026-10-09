import type { AuthenticatedUser } from '../../../../common';
import type { UnitOfWork } from './unit-of-work';

/**
 * Pertenencia a organizaciones y nombres de personas (contextos `directory` y
 * `profiles`), para la agenda de una organización.
 */
export interface TenantDirectoryPort {
  /**
   * Exige que el actor pueda leer la organización.
   *
   * @throws ForbiddenException si no puede.
   */
  assertCanRead(
    uow: UnitOfWork,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void>;

  /** Mapa `personId → nombre para mostrar`, sólo de quienes lo tienen. */
  findDisplayNames(
    uow: UnitOfWork,
    personIds: readonly string[],
  ): Promise<Map<string, string>>;
}

/** Token de inyección del directorio de organizaciones. */
export const TENANT_DIRECTORY_PORT = Symbol('TENANT_DIRECTORY_PORT');
