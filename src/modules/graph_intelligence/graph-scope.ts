import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import { GraphErrorReason } from './graph_intelligence.error-reasons';

/** Recurso del grafo que porta su tenant propietario. */
interface TenantOwned {
  /** Tenant propietario del recurso. */
  readonly tenantId?: string | null;
}

/**
 * Exige que un agregado del grafo cargado por UUID pertenezca al tenant activo.
 *
 * Inexistente y ajeno responden igual: `404 NOT_FOUND / GRAPH_RESOURCE_OUT_OF_SCOPE`,
 * con el mismo mensaje y sin `details`.
 *
 * @param resource - Agregado ya cargado, o `null` si no existe.
 * @param message - Mensaje de "no existe" del agregado.
 * @param activeTenantId - Tenant verificado del contexto (`requireTenantId()`).
 * @returns El mismo agregado, ya acotado al tenant.
 */
export function assertGraphResourceInTenant<T extends TenantOwned>(
  resource: T | null | undefined,
  message: string,
  activeTenantId: string,
): T {
  return assertResourceInTenant(resource, resource?.tenantId, activeTenantId, {
    message,
    reason: GraphErrorReason.RESOURCE_OUT_OF_SCOPE,
  });
}
