import type { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { PracticeErrorReason } from '../practice.error-reasons';
import type { PracticeSites, Practices } from '../entities';
import type {
  PracticesRepository,
  PracticeSitesRepository,
} from '../repositories';

/**
 * El 404 uniforme de `practice` para un recurso inexistente o de otro tenant.
 *
 * Sin `details`: un ID en el detalle es el único dato que distinguiría, en una
 * traza o un cliente descuidado, un recurso ajeno de uno inexistente.
 *
 * @param message - Mensaje de «no encontrado» propio del tipo de recurso.
 * @returns La excepción lista para lanzar.
 */
export function practiceOutOfScope(message: string): ResourceNotFoundException {
  return new ResourceNotFoundException(
    message,
    undefined,
    PracticeErrorReason.PRACTICE_RESOURCE_OUT_OF_SCOPE,
  );
}

/**
 * Exige que un recurso de `practice` pertenezca al tenant activo.
 *
 * Los recursos hijos (sede, vinculación, acreditación, insumo) no llevan tenant:
 * es el de su práctica, que se pasa en `ownerTenantId`. Un recurso ajeno
 * responde exactamente igual que uno inexistente.
 *
 * @param resource - Recurso ya cargado, o `null` si no existe.
 * @param ownerTenantId - Tenant de la práctica a la que cuelga.
 * @param activeTenantId - Tenant del contexto de la petición.
 * @param message - Mensaje de «no encontrado» propio del tipo de recurso.
 * @returns El mismo recurso, ya acotado.
 * @throws ResourceNotFoundException (`PRACTICE_RESOURCE_OUT_OF_SCOPE`) si no
 * existe o es de otro tenant.
 */
export function assertPracticeScope<T>(
  resource: T | null | undefined,
  ownerTenantId: string | null | undefined,
  activeTenantId: string,
  message: string,
): T {
  return assertResourceInTenant(resource, ownerTenantId, activeTenantId, {
    message,
    reason: PracticeErrorReason.PRACTICE_RESOURCE_OUT_OF_SCOPE,
  });
}

/**
 * Resuelve una práctica por UUID y exige que sea del tenant activo.
 *
 * Es el resolver central de las escrituras administrativas: se llama **antes**
 * de cualquier creación hija, transición o `flush`.
 *
 * @param practicesRepo - Repositorio de prácticas.
 * @param em - Transacción o contexto de persistencia.
 * @param practiceId - Práctica recibida del cliente.
 * @param tenantId - Tenant del contexto (`requireTenantId()`).
 * @returns La práctica, del tenant activo.
 * @throws ResourceNotFoundException (`PRACTICE_RESOURCE_OUT_OF_SCOPE`).
 */
export async function loadPracticeInScope(
  practicesRepo: PracticesRepository,
  em: EntityManager,
  practiceId: string,
  tenantId: string,
): Promise<Practices> {
  const practice = await practicesRepo.findById(em, practiceId);
  return assertPracticeScope(
    practice,
    practice?.tenantId,
    tenantId,
    'Práctica no encontrada',
  );
}

/**
 * Resuelve una sede por UUID hasta su práctica y exige que sea del tenant activo.
 *
 * @param sitesRepo - Repositorio de sedes.
 * @param practicesRepo - Repositorio de prácticas.
 * @param em - Transacción o contexto de persistencia.
 * @param siteId - Sede recibida del cliente.
 * @param tenantId - Tenant del contexto (`requireTenantId()`).
 * @returns La sede y su práctica.
 * @throws ResourceNotFoundException (`PRACTICE_RESOURCE_OUT_OF_SCOPE`).
 */
export async function loadSiteInScope(
  sitesRepo: PracticeSitesRepository,
  practicesRepo: PracticesRepository,
  em: EntityManager,
  siteId: string,
  tenantId: string,
): Promise<{
  /** Sede, de una práctica del tenant activo. */
  site: PracticeSites;
  /** Práctica a la que pertenece la sede. */
  practice: Practices;
}> {
  const site = await sitesRepo.findById(em, siteId);
  const practice = site
    ? await practicesRepo.findById(em, site.practiceId)
    : null;
  if (!site || !practice) throw practiceOutOfScope('Sitio no encontrado');
  assertPracticeScope(site, practice.tenantId, tenantId, 'Sitio no encontrado');
  return { site, practice };
}
