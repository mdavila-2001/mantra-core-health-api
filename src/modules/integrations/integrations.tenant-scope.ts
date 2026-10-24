import {
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  requireTenantId,
  type AuthenticatedUser,
} from '../../common';
import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import { IntegrationsErrorReason } from './integrations.error-reasons';

/** Mínimo que necesita la política para decidir el alcance de una conexión. */
interface TenantOwned {
  /** Tenant propietario; `null`/`undefined` cuenta como ajeno. */
  readonly tenantId?: string | null;
}

/**
 * Tenant al que se acota una operación sobre mensajes y conexiones.
 *
 * - Con tenant en el contexto, ése es el alcance (también para `SYSTEM` si
 *   declara `X-Tenant-Id`).
 * - Sin tenant, sólo el actor `SYSTEM` (los jobs internos de despacho,
 *   reintento y correlación, que barren todas las conexiones) opera sin
 *   alcance: devuelve `undefined`.
 * - Cualquier otro actor sin tenant se rechaza (`412 TENANT_REQUIRED`).
 *
 * @param actor - Actor autenticado.
 * @returns El tenant activo, o `undefined` para el barrido interno de `SYSTEM`.
 * @throws PreconditionFailedException `TENANT_REQUIRED` si un actor que no es `SYSTEM` no tiene tenant.
 */
export function integrationsScope(
  actor: Pick<AuthenticatedUser, 'roles'>,
): string | undefined {
  const tenantId = getCurrentTenantId();
  if (tenantId) return tenantId;
  if (actor.roles?.includes('SYSTEM')) return undefined;
  return requireTenantId();
}

/**
 * Tenant con el que se crea un recurso. Nunca viene del cuerpo: si el cuerpo
 * declara uno, debe coincidir con el activo.
 *
 * @param bodyTenantId - `tenantId` declarado en el cuerpo, si lo hay.
 * @returns El tenant verificado del contexto.
 * @throws PreconditionFailedException `TENANT_REQUIRED` sin tenant activo, o `INTEGRATIONS_TENANT_MISMATCH` si difiere.
 */
export function activeIntegrationsTenant(bodyTenantId?: string): string {
  const tenantId = requireTenantId();
  if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
    throw new PreconditionFailedException(
      'El tenantId del cuerpo no coincide con el tenant activo',
      undefined,
      IntegrationsErrorReason.INTEGRATIONS_TENANT_MISMATCH,
    );
  }
  return tenantId;
}

/**
 * 404 uniforme del módulo: mismo mensaje y mismo `reason`, sin `details`, para
 * un recurso inexistente y para uno que cuelga de una conexión ajena.
 *
 * @param message - Mensaje «no encontrado» del recurso.
 * @returns La excepción a lanzar.
 */
export function integrationsNotAvailable(
  message: string,
): ResourceNotFoundException {
  return new ResourceNotFoundException(
    message,
    undefined,
    IntegrationsErrorReason.INTEGRATIONS_RESOURCE_NOT_AVAILABLE,
  );
}

/**
 * Exige que una conexión exista y esté dentro del alcance. Los mensajes
 * salientes y entrantes se autorizan a través de su conexión.
 *
 * @param connection - Conexión cargada, o `null` si no se encontró.
 * @param scope - Resultado de {@link integrationsScope}.
 * @param message - Mensaje «no encontrado» del recurso que se resolvía.
 * @returns La misma conexión, ya acotada.
 * @throws ResourceNotFoundException `INTEGRATIONS_RESOURCE_NOT_AVAILABLE` si no existe o es ajena.
 */
export function assertConnectionInScope<T extends TenantOwned>(
  connection: T | null | undefined,
  scope: string | undefined,
  message = 'Conexión no encontrada',
): T {
  if (scope === undefined) {
    if (connection === null || connection === undefined) {
      throw integrationsNotAvailable(message);
    }
    return connection;
  }
  return assertResourceInTenant(connection, connection?.tenantId, scope, {
    message,
    reason: IntegrationsErrorReason.INTEGRATIONS_RESOURCE_NOT_AVAILABLE,
  });
}
