import { PreconditionFailedException } from '../../common';
import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import { GeoErrorReason } from './geo.error-reasons';

/** Mínimo que necesita la política para decidir el alcance de un sujeto. */
interface TenantOwned {
  /** Tenant propietario; `null`/`undefined` cuenta como ajeno. */
  readonly tenantId?: string | null;
}

/**
 * Exige que un sujeto rastreado pertenezca al tenant activo. Un sujeto ajeno o
 * inexistente responde igual: `404 RESOURCE_NOT_FOUND / GEO_TRACKED_SUBJECT_NOT_AVAILABLE`.
 *
 * @param subject - Sujeto cargado por UUID, o `null` si no existe.
 * @param activeTenantId - Tenant verificado del contexto.
 * @returns El mismo sujeto, ya acotado al tenant.
 */
export function assertSubjectInTenant<T extends TenantOwned>(
  subject: T | null | undefined,
  activeTenantId: string,
): T {
  return assertResourceInTenant(subject, subject?.tenantId, activeTenantId, {
    message: 'Sujeto rastreado no encontrado',
    reason: GeoErrorReason.TRACKED_SUBJECT_NOT_AVAILABLE,
  });
}

/**
 * Exige que un geofence pertenezca al tenant activo (404 uniforme).
 *
 * @param geofence - Geofence cargado por UUID, o `null` si no existe.
 * @param activeTenantId - Tenant verificado del contexto.
 * @returns El mismo geofence, ya acotado al tenant.
 */
export function assertGeofenceInTenant<T extends TenantOwned>(
  geofence: T | null | undefined,
  activeTenantId: string,
): T {
  return assertResourceInTenant(geofence, geofence?.tenantId, activeTenantId, {
    message: 'Geofence no encontrado',
    reason: GeoErrorReason.GEOFENCE_NOT_AVAILABLE,
  });
}

/**
 * Defensa en profundidad antes de insertar un evento de geofence: geofence y
 * sujeto deben compartir tenant. Con ambos ya acotados al tenant activo esto no
 * debería fallar; protege contra una ruta de servicio o worker mal cableada.
 *
 * @param geofence - Geofence ya cargado.
 * @param subject - Sujeto ya cargado.
 * @throws PreconditionFailedException `GEO_GEOFENCE_SUBJECT_TENANT_MISMATCH` si difieren.
 */
export function assertGeofenceSubjectSameTenant(
  geofence: TenantOwned,
  subject: TenantOwned,
): void {
  if (
    !geofence.tenantId ||
    !subject.tenantId ||
    geofence.tenantId !== subject.tenantId
  ) {
    throw new PreconditionFailedException(
      'El geofence y el sujeto rastreado pertenecen a organizaciones distintas',
      undefined,
      GeoErrorReason.GEOFENCE_SUBJECT_TENANT_MISMATCH,
    );
  }
}
