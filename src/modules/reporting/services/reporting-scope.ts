import {
  ResourceNotFoundException,
  getCurrentTenantId,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { ReportingErrorReason } from '../reporting.error-reasons';

/**
 * Tenant al que se acota una operación sobre un recurso de reportes por UUID.
 *
 * - Un actor con sesión de tenant (administrador, autor, lector) opera dentro
 *   del tenant activo: el del contexto, nunca el del cuerpo.
 * - El worker `SYSTEM` sin tenant en contexto es el barrido global explícito
 *   (cola de ejecuciones y programaciones de todos los tenants): devuelve
 *   `undefined`. Si el worker declara tenant, queda acotado a él.
 *
 * @param actor - Quien ejecuta la operación.
 * @returns El tenant activo, o `undefined` sólo para el barrido `SYSTEM`.
 * @throws PreconditionFailedException si un actor de tenant no tiene tenant activo.
 */
export function resolveReportingScope(
  actor: Pick<AuthenticatedUser, 'roles'>,
): string | undefined {
  if (actor.roles.includes('SYSTEM')) return getCurrentTenantId();
  return requireTenantId();
}

/**
 * Exige que un recurso de reportes ya cargado pertenezca al alcance del actor.
 *
 * Un recurso ajeno responde exactamente igual que uno inexistente (404, mismo
 * mensaje, `REPORTING_RESOURCE_OUT_OF_SCOPE`, sin `details`).
 *
 * @param resource - Recurso cargado, o `null` si no existe.
 * @param scope - Resultado de {@link resolveReportingScope}.
 * @param message - Mensaje de «no encontrado» propio del tipo de recurso.
 * @returns El mismo recurso.
 * @throws ResourceNotFoundException si no existe o es de otro tenant.
 */
export function assertReportingResource<T extends { tenantId?: string }>(
  resource: T | null | undefined,
  scope: string | undefined,
  message: string,
): T {
  const failure = {
    message,
    reason: ReportingErrorReason.REPORTING_RESOURCE_OUT_OF_SCOPE,
  };
  if (scope === undefined) {
    if (resource === null || resource === undefined) {
      throw new ResourceNotFoundException(message, undefined, failure.reason);
    }
    return resource;
  }
  return assertResourceInTenant(resource, resource?.tenantId, scope, failure);
}
