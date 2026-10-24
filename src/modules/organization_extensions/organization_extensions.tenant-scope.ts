import { requireTenantId, ResourceNotFoundException } from '../../common';
import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import { OrganizationExtensionsErrorReason } from './organization_extensions.error-reasons';

/** Mensaje único con el que el módulo informa "no existe" para cualquier recurso fuera de alcance. */
const NOT_AVAILABLE_MESSAGE = 'Recurso no disponible';

/**
 * Falla uniforme del módulo: un recurso ajeno y uno inexistente responden con
 * el mismo mensaje y el mismo `reason`, sin `details`.
 */
export const ORGEXT_NOT_AVAILABLE = {
  message: NOT_AVAILABLE_MESSAGE,
  reason: OrganizationExtensionsErrorReason.ORGEXT_RESOURCE_NOT_AVAILABLE,
} as const;

/**
 * Exige que un recurso cargado por UUID pertenezca al tenant activo.
 *
 * @param resource - Recurso ya cargado, o `null` si no se encontró.
 * @param resourceTenantId - Tenant propietario del recurso.
 * @param activeTenantId - Tenant verificado del request.
 * @returns El mismo recurso, acotado al tenant.
 * @throws ResourceNotFoundException si no existe o es de otro tenant.
 */
export function requireOrgextResource<T>(
  resource: T | null | undefined,
  resourceTenantId: string | null | undefined,
  activeTenantId: string,
): T {
  return assertResourceInTenant(
    resource,
    resourceTenantId,
    activeTenantId,
    ORGEXT_NOT_AVAILABLE,
  );
}

/**
 * Tenant propietario de un alta: sale del contexto verificado, nunca del
 * cuerpo. Un cuerpo que declara otro tenant se rechaza como recurso no disponible.
 *
 * @param declaredTenantId - `tenantId` que trae el DTO.
 * @returns El tenant activo del request.
 * @throws ResourceNotFoundException si el cuerpo declara un tenant distinto.
 * @throws PreconditionFailedException si el request no fijó tenant.
 */
export function resolveOwnerTenantId(declaredTenantId: string): string {
  const activeTenantId = requireTenantId();
  if (declaredTenantId !== activeTenantId) {
    throw new ResourceNotFoundException(
      ORGEXT_NOT_AVAILABLE.message,
      undefined,
      ORGEXT_NOT_AVAILABLE.reason,
    );
  }
  return activeTenantId;
}
