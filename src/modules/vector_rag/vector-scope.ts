import {
  getCurrentTenantId,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../common';
import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import { ResourceNotFoundException } from '../../common/errors/domain.exception';
import { VectorErrorReason } from './vector_rag.error-reasons';

/**
 * Alcance de tenant de una operación del módulo.
 *
 * - `tenantId` definido: la operación sólo alcanza recursos de ese tenant.
 * - `tenantId` indefinido: sólo lo produce la credencial de servicio `SYSTEM`
 *   cuando la petición no fija tenant (los barridos del worker cruzan
 *   organizaciones por diseño). Un `SYSTEM` concedido con ámbito de tenant
 *   (`scopedRoles`) no es la credencial de servicio y no barre; el recurso resuelto por UUID fija entonces el
 *   tenant de todo lo que se escriba a partir de él.
 */
export interface VectorScope {
  readonly tenantId: string | undefined;
}

/**
 * Resuelve el alcance de la petición.
 *
 * El tenant sale del contexto que verificó el guard, nunca del cuerpo ni de la
 * ruta. Todo actor que no sea la credencial `SYSTEM` necesita tenant activo: sin
 * él la operación falla cerrada (412) en lugar de alcanzar cualquier tenant.
 * `SYSTEM` cuenta sólo como rol global: si aparece en `scopedRoles` vale dentro de
 * ese tenant y fuera de él no concede el barrido (misma regla que `RolesGuard`).
 *
 * @param actor - Usuario autenticado.
 * @returns El alcance de la operación.
 * @throws PreconditionFailedException si falta el tenant y el actor no es `SYSTEM`.
 */
export function resolveVectorScope(actor: AuthenticatedUser): VectorScope {
  const tenantId = getCurrentTenantId();
  if (tenantId) return { tenantId };
  if (roleAuthorizesInTenant(actor, 'SYSTEM', undefined)) {
    return { tenantId: undefined };
  }
  return { tenantId: requireTenantId() };
}

/**
 * Devuelve el recurso si existe y está dentro del alcance; si no, `404`
 * uniforme (mismo mensaje, mismo `reason`, sin `details`) tanto para el
 * inexistente como para el de otro tenant.
 *
 * @param scope - Alcance de la petición.
 * @param resource - Recurso ya cargado, o `null` si no se encontró.
 * @param message - Mensaje «no encontrado» propio del tipo de recurso.
 * @returns El mismo recurso, acotado al tenant.
 * @throws ResourceNotFoundException si no existe o es de otro tenant.
 */
export function inScopeOrNotFound<T extends { tenantId?: string }>(
  scope: VectorScope,
  resource: T | null | undefined,
  message: string,
): T {
  if (scope.tenantId === undefined) {
    if (!resource) {
      throw new ResourceNotFoundException(
        message,
        undefined,
        VectorErrorReason.RESOURCE_OUT_OF_SCOPE,
      );
    }
    return resource;
  }
  return assertResourceInTenant(resource, resource?.tenantId, scope.tenantId, {
    message,
    reason: VectorErrorReason.RESOURCE_OUT_OF_SCOPE,
  });
}

/**
 * Tenant sobre el que opera una creación que además recibe `tenantId` en el
 * cuerpo (colección, política, borrado).
 *
 * Con alcance fijado, el cuerpo sólo puede repetir ese tenant; cualquier otro
 * responde `404` uniforme. Sin alcance (`SYSTEM`) el cuerpo declara el tenant.
 *
 * @param scope - Alcance de la petición.
 * @param bodyTenantId - `tenantId` del cuerpo.
 * @param message - Mensaje «no encontrado».
 * @param reason - `reason` del catálogo para el rechazo.
 * @returns El tenant efectivo.
 */
export function effectiveTenant(
  scope: VectorScope,
  bodyTenantId: string,
  message: string,
  reason: VectorErrorReason = VectorErrorReason.RESOURCE_OUT_OF_SCOPE,
): string {
  if (scope.tenantId === undefined) return bodyTenantId;
  assertResourceInTenant(bodyTenantId, bodyTenantId, scope.tenantId, {
    message,
    reason,
  });
  return scope.tenantId;
}
