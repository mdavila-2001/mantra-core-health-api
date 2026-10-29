import {
  ResourceNotFoundException,
  getCurrentTenantId,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../../common';
import { assertResourceInTenant } from '../../../../common/tenant/resource-scope';
import { QaLabErrorReason } from '../../qa_lab.error-reasons';

/**
 * Tenant al que se acota una operación sobre un recurso de `qa_lab` por UUID.
 *
 * - Un actor con sesión de tenant (`QA_ADMIN`, `QA_ENGINEER`, …) opera dentro
 *   del tenant activo: el del contexto, nunca el del cuerpo.
 * - El worker `SYSTEM` (rol global; uno concedido con ámbito de tenant no
 *   barre) sin tenant en contexto es el barrido global explícito
 *   (corridas y programaciones de todos los tenants): devuelve `undefined`. Si
 *   el worker declara tenant, queda acotado a él.
 *
 * @param actor - Quien ejecuta la operación.
 * @returns El tenant activo, o `undefined` sólo para el barrido `SYSTEM`.
 * @throws PreconditionFailedException si un actor de tenant no tiene tenant activo.
 */
export function resolveQaScope(actor: AuthenticatedUser): string | undefined {
  if (roleAuthorizesInTenant(actor, 'SYSTEM', undefined)) {
    return getCurrentTenantId();
  }
  return requireTenantId();
}

/**
 * El 404 uniforme de `qa_lab` para un recurso inexistente o de otro tenant.
 *
 * @param message - Mensaje de «no encontrado» propio del tipo de recurso.
 * @returns La excepción lista para lanzar (sin `details`).
 */
export function qaOutOfScope(message: string): ResourceNotFoundException {
  return new ResourceNotFoundException(
    message,
    undefined,
    QaLabErrorReason.QA_LAB_RESOURCE_OUT_OF_SCOPE,
  );
}

/**
 * Exige que un recurso de `qa_lab` ya cargado pertenezca al alcance del actor.
 *
 * Un recurso ajeno responde exactamente igual que uno inexistente (404, mismo
 * mensaje, `QA_LAB_RESOURCE_OUT_OF_SCOPE`, sin `details`).
 *
 * @param resource - Recurso cargado, o `null` si no existe.
 * @param scope - Resultado de {@link resolveQaScope}.
 * @param message - Mensaje de «no encontrado» propio del tipo de recurso.
 * @returns El mismo recurso.
 * @throws ResourceNotFoundException si no existe o es de otro tenant.
 */
export function assertQaResource<T extends { tenantId?: string | null }>(
  resource: T | null | undefined,
  scope: string | undefined,
  message: string,
): T {
  if (scope === undefined) {
    if (resource === null || resource === undefined) {
      throw qaOutOfScope(message);
    }
    return resource;
  }
  return assertResourceInTenant(resource, resource?.tenantId, scope, {
    message,
    reason: QaLabErrorReason.QA_LAB_RESOURCE_OUT_OF_SCOPE,
  });
}

/**
 * Si dos recursos tienen el mismo tenant propietario (`null` y `undefined`
 * cuentan como «sin tenant»). Sirve para encadenar hijos hasta la suite: un
 * entorno de otro tenant no puede colgarse de la suite de este.
 */
export function sameQaOwner(
  a: { tenantId?: string | null },
  b: { tenantId?: string | null },
): boolean {
  return (a.tenantId ?? null) === (b.tenantId ?? null);
}
