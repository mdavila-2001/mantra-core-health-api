import {
  getCurrentTenantId,
  requireTenantId,
  roleAuthorizesInTenant,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { PromotionsErrorReason } from '../promotions.error-reasons';

/**
 * Tenant al que se acota una operación sobre un recurso de `promotions` por UUID.
 *
 * - Un actor con sesión de tenant (administrador, cajero, miembro, paciente)
 *   opera dentro del tenant activo: el del contexto, nunca el del cuerpo.
 * - El worker `SYSTEM` (rol global; uno concedido con ámbito de tenant no
 *   barre) sin tenant en contexto es el barrido global explícito
 *   (acumulación por eventos, expiración, calificación de referidos de todos los
 *   tenants): devuelve `undefined`. Si el worker declara tenant, queda acotado a él.
 *
 * @param actor - Quien ejecuta la operación.
 * @returns El tenant activo, o `undefined` sólo para el barrido `SYSTEM`.
 * @throws PreconditionFailedException si un actor de tenant no tiene tenant activo.
 */
export function resolvePromotionsScope(
  actor: AuthenticatedUser,
): string | undefined {
  if (roleAuthorizesInTenant(actor, 'SYSTEM', undefined)) {
    return getCurrentTenantId();
  }
  return requireTenantId();
}

/**
 * El 404 uniforme de `promotions` para un recurso inexistente o de otro tenant.
 *
 * @param message - Mensaje de «no encontrado» propio del tipo de recurso.
 * @returns La excepción lista para lanzar (sin `details`).
 */
export function promotionsOutOfScope(
  message: string,
): ResourceNotFoundException {
  return new ResourceNotFoundException(
    message,
    undefined,
    PromotionsErrorReason.PROMOTIONS_RESOURCE_OUT_OF_SCOPE,
  );
}

/**
 * Exige que un recurso de `promotions` ya cargado pertenezca al alcance del actor.
 *
 * Los recursos hijos (membresía, cupón, redención, referido) no llevan tenant:
 * se pasa el del agregado raíz al que cuelgan (programa o promoción), que es
 * quien lo decide. Un recurso ajeno responde exactamente igual que uno
 * inexistente (404, mismo mensaje, `PROMOTIONS_RESOURCE_OUT_OF_SCOPE`, sin
 * `details`).
 *
 * @param resource - Recurso cargado, o `null` si no existe.
 * @param ownerTenantId - Tenant del agregado raíz del recurso.
 * @param scope - Resultado de {@link resolvePromotionsScope}.
 * @param message - Mensaje de «no encontrado» propio del tipo de recurso.
 * @returns El mismo recurso.
 * @throws ResourceNotFoundException si no existe o es de otro tenant.
 */
export function assertPromotionsScope<T>(
  resource: T | null | undefined,
  ownerTenantId: string | null | undefined,
  scope: string | undefined,
  message: string,
): T {
  if (scope === undefined) {
    if (resource === null || resource === undefined) {
      throw promotionsOutOfScope(message);
    }
    return resource;
  }
  return assertResourceInTenant(resource, ownerTenantId, scope, {
    message,
    reason: PromotionsErrorReason.PROMOTIONS_RESOURCE_OUT_OF_SCOPE,
  });
}
