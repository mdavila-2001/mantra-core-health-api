import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import { HealthDataErrorReason } from './health_data.error-reasons';

/** Recurso de health_data que porta su tenant propietario. */
interface TenantOwned {
  /** Tenant propietario (en recursos canónicos, el custodio). */
  readonly tenantId?: string | null;
}

/**
 * Exige que un agregado cargado por UUID pertenezca al tenant activo.
 *
 * Inexistente y ajeno responden igual (`404 NOT_FOUND` con el mismo mensaje y
 * `reason`, sin `details`).
 *
 * @param resource - Agregado ya cargado, o `null` si no existe.
 * @param activeTenantId - Tenant verificado del contexto (`requireTenantId()`).
 * @param message - Mensaje de "no existe" del agregado.
 * @param reason - Sub-código `*_NOT_AVAILABLE` del agregado.
 * @returns El mismo agregado, ya acotado al tenant.
 */
export function assertHealthResourceInTenant<T extends TenantOwned>(
  resource: T | null | undefined,
  activeTenantId: string,
  message: string,
  reason: HealthDataErrorReason,
): T {
  return assertResourceInTenant(resource, resource?.tenantId, activeTenantId, {
    message,
    reason,
  });
}
