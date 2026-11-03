import {
  requireTenantId,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { hasPrivilegedTenantRole } from '../../../common/tenant/tenant-resolution';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { Pharmacies } from '../entities';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import type { PharmaciesRepository } from '../repositories';

/** Falla uniforme: una farmacia ajena y una inexistente responden igual. */
const PHARMACY_NOT_AVAILABLE = {
  message: 'Farmacia no disponible',
  reason: PharmacyErrorReason.PHARMACY_NOT_AVAILABLE,
} as const;

/** Falla uniforme de una referencia (sede, práctica, aseguradora) fuera de alcance. */
const REFERENCE_NOT_AVAILABLE = {
  message: 'Referencia no disponible',
  reason: PharmacyErrorReason.PHARMACY_REFERENCE_NOT_AVAILABLE,
} as const;

/**
 * Si el actor puede operar sobre el tenant: es miembro de él o es de
 * plataforma (`SUPERADMIN`/`SYSTEM`, que eligen el tenant por cabecera).
 */
function actorOperatesOnTenant(
  actor: AuthenticatedUser,
  tenantId: string,
): boolean {
  return (
    hasPrivilegedTenantRole(actor) ||
    (actor.tenantIds?.includes(tenantId) ?? false)
  );
}

/**
 * Tenant propietario de una farmacia que se da de alta: sale del contexto
 * verificado, nunca del cuerpo. Un cuerpo que declara otro tenant, o un actor
 * sin membresía en el tenant activo, se rechaza como farmacia no disponible.
 *
 * @param declaredTenantId - `tenantId` que trae el DTO.
 * @param actor - Sujeto autenticado.
 * @returns El tenant activo del request.
 * @throws ResourceNotFoundException si el cuerpo contradice el contexto o el actor no pertenece al tenant.
 */
export function resolvePharmacyOwnerTenantId(
  declaredTenantId: string,
  actor: AuthenticatedUser,
): string {
  const tenantId = requireTenantId();
  if (
    declaredTenantId !== tenantId ||
    !actorOperatesOnTenant(actor, tenantId)
  ) {
    throw new ResourceNotFoundException(
      PHARMACY_NOT_AVAILABLE.message,
      undefined,
      PHARMACY_NOT_AVAILABLE.reason,
    );
  }
  return tenantId;
}

/**
 * Resuelve la farmacia que el actor administra: del tenant activo y con el
 * actor como miembro (o actor de plataforma). Se invoca antes de cualquier
 * lectura o escritura que cuelgue de un `pharmacyId` de la ruta.
 *
 * Una farmacia de otro tenant responde exactamente igual que una inexistente
 * (`404`, mismo mensaje, mismo `reason`, sin `details`).
 *
 * @param pharmaciesRepo - Repositorio de farmacias.
 * @param em - Unidad de trabajo activa.
 * @param pharmacyId - Farmacia de la ruta.
 * @param actor - Sujeto autenticado.
 * @returns La farmacia, ya acotada al tenant.
 * @throws ResourceNotFoundException si no existe o no es administrable por el actor.
 * @throws PreconditionFailedException si el request no fijó tenant.
 */
export async function requireManagedPharmacy(
  pharmaciesRepo: Pick<PharmaciesRepository, 'findByIdInTenant'>,
  em: EntityManager,
  pharmacyId: string,
  actor: AuthenticatedUser,
): Promise<Pharmacies> {
  const tenantId = requireTenantId();
  const pharmacy = actorOperatesOnTenant(actor, tenantId)
    ? await pharmaciesRepo.findByIdInTenant(em, pharmacyId, tenantId)
    : null;
  return assertResourceInTenant(
    pharmacy,
    pharmacy?.tenantId,
    tenantId,
    PHARMACY_NOT_AVAILABLE,
  );
}

/**
 * Rechaza una referencia del cuerpo que no pertenece a la farmacia o al tenant
 * autorizados, con la misma respuesta que si no existiera.
 *
 * @param belongs - Si la referencia resolvió dentro del alcance.
 * @throws ResourceNotFoundException cuando `belongs` es falso.
 */
export function assertReferenceInScope(belongs: boolean): void {
  if (!belongs) {
    throw new ResourceNotFoundException(
      REFERENCE_NOT_AVAILABLE.message,
      undefined,
      REFERENCE_NOT_AVAILABLE.reason,
    );
  }
}
