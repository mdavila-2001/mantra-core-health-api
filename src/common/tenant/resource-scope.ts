import { ResourceNotFoundException } from '../errors/domain.exception';

/** Describe cómo se presenta al cliente un recurso que no pertenece al tenant activo. */
export interface ResourceScopeFailure {
  /** Mensaje para humanos. Debe ser el mismo que el de "no existe". */
  readonly message: string;
  /** Sub-código estable del catálogo del módulo (`<modulo>.error-reasons.ts`). */
  readonly reason: string;
}

/**
 * Exige que un recurso cargado por UUID pertenezca al tenant activo.
 *
 * Los servicios resuelven muchos recursos con `findOne({ id })`: el UUID es
 * lo único que separa a un tenant de otro, y un UUID ajeno que llega en la ruta
 * o en el cuerpo se cargaba y se modificaba como si fuera propio. Esta
 * comprobación se hace **después** de cargar y **antes** de leer o escribir.
 *
 * Un recurso de otro tenant responde exactamente igual que uno inexistente
 * (`404`, mismo mensaje, mismo `reason`, sin `details`): distinguirlos le
 * confirmaría a un tercero que ese UUID existe en otra organización.
 *
 * @param resource - Recurso ya cargado, o `null`/`undefined` si no se encontró.
 * @param resourceTenantId - `tenantId` del recurso; `null`/`undefined` cuenta como ajeno.
 * @param activeTenantId - Tenant verificado del actor (`requireTenantId()` o el del worker).
 * @param failure - Mensaje y `reason` con los que el módulo informa "no existe".
 * @returns El mismo recurso, ya acotado al tenant.
 * @throws ResourceNotFoundException si no existe o pertenece a otro tenant.
 */
export function assertResourceInTenant<T>(
  resource: T | null | undefined,
  resourceTenantId: string | null | undefined,
  activeTenantId: string,
  failure: ResourceScopeFailure,
): T {
  if (
    resource === null ||
    resource === undefined ||
    !resourceTenantId ||
    resourceTenantId !== activeTenantId
  ) {
    throw new ResourceNotFoundException(
      failure.message,
      undefined,
      failure.reason,
    );
  }
  return resource;
}
