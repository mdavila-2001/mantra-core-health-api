import type { EntityManager } from '@mikro-orm/postgresql';

/** Nombre y tipo de cada tenant que el token va a declarar, indexados por id. */
export interface TenantDisplay {
  readonly tenantNames: Record<string, string>;
  readonly tenantTypes: Record<string, string>;
}

/**
 * Lectura de `directory` acotada al límite de autenticación: al emitir el
 * token se resuelven las membresías de tenant del sujeto para embeberlas como
 * claim.
 */
export interface TenantClaimsPort {
  /** Tenants de los que el usuario es miembro ACTIVO. */
  listActiveTenantIds(em: EntityManager, userId: string): Promise<string[]>;

  /** Nombre comercial (o legal, o código) y código de tipo de cada tenant. */
  describeTenants(
    em: EntityManager,
    tenantIds: readonly string[],
  ): Promise<TenantDisplay>;
}

export const TENANT_CLAIMS_PORT = Symbol('IAM_TENANT_CLAIMS_PORT');
