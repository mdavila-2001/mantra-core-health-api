import { BadRequestException } from '@nestjs/common';
import {
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../common';
import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import { LakehouseErrorReason } from './lakehouse.error-reasons';

/** Mínimo que necesita la política para decidir el alcance de un recurso. */
interface TenantOwned {
  /** Tenant propietario; `null`/`undefined` cuenta como ajeno. */
  readonly tenantId?: string | null;
}

/**
 * Tenant activo del actor. El `tenantId` del cuerpo nunca es la fuente de
 * verdad: si llega, debe coincidir con el del contexto o se rechaza.
 *
 * @param bodyTenantId - `tenantId` declarado en el cuerpo, si lo hay.
 * @returns El tenant verificado del contexto.
 * @throws PreconditionFailedException `TENANT_REQUIRED` sin tenant, o `LAKEHOUSE_TENANT_MISMATCH` si difiere.
 */
export function activeLakehouseTenant(bodyTenantId?: string): string {
  const tenantId = requireTenantId();
  if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
    throw new PreconditionFailedException(
      'El tenantId del cuerpo no coincide con el tenant activo',
      undefined,
      LakehouseErrorReason.LAKEHOUSE_TENANT_MISMATCH,
    );
  }
  return tenantId;
}

/**
 * Tenant al que se acota el cierre y el descubrimiento de releases.
 *
 * - Con tenant en el contexto, ése es el alcance.
 * - Sin tenant, sólo el actor `SYSTEM` como rol global (uno concedido con
 *   ámbito de tenant no barre; el worker que barre los releases
 *   vencidos de todas las organizaciones) opera sin alcance: `undefined`.
 * - Cualquier otro actor sin tenant se rechaza (`412 TENANT_REQUIRED`).
 *
 * @param actor - Actor autenticado.
 * @returns El tenant activo, o `undefined` para el barrido interno de `SYSTEM`.
 */
export function lakehouseSweepScope(
  actor: AuthenticatedUser,
): string | undefined {
  const tenantId = getCurrentTenantId();
  if (tenantId) return tenantId;
  if (roleAuthorizesInTenant(actor, 'SYSTEM', undefined)) return undefined;
  return requireTenantId();
}

/**
 * 404 uniforme del módulo: mismo mensaje y mismo `reason`, sin `details`, para
 * un recurso inexistente y para uno que pertenece a otro tenant.
 *
 * @param message - Mensaje «no encontrado» del recurso.
 * @returns La excepción a lanzar.
 */
export function lakehouseOutsideTenant(
  message: string,
): ResourceNotFoundException {
  return new ResourceNotFoundException(
    message,
    undefined,
    LakehouseErrorReason.LAKEHOUSE_RESOURCE_OUTSIDE_TENANT,
  );
}

/**
 * Exige que un recurso con `tenantId` propio pertenezca al tenant activo.
 *
 * @param resource - Recurso cargado, o `null` si no se encontró.
 * @param activeTenantId - Tenant verificado del contexto.
 * @param message - Mensaje «no encontrado» del recurso.
 * @returns El mismo recurso, ya acotado al tenant.
 * @throws ResourceNotFoundException `LAKEHOUSE_RESOURCE_OUTSIDE_TENANT` si no existe o es ajeno.
 */
export function assertLakehouseResourceInTenant<T extends TenantOwned>(
  resource: T | null | undefined,
  activeTenantId: string,
  message: string,
): T {
  return assertResourceInTenant(resource, resource?.tenantId, activeTenantId, {
    message,
    reason: LakehouseErrorReason.LAKEHOUSE_RESOURCE_OUTSIDE_TENANT,
  });
}

/**
 * Exige que un recurso ya acotado por el repositorio exista. Para las filas que
 * no llevan `tenant_id` propio (p. ej. una versión de producto, cuyo tenant es
 * el de su producto): el repositorio resuelve la cadena hasta el tenant y
 * devuelve `null` si es ajena, así que aquí sólo queda tratar `null` como
 * «no existe» con la misma respuesta uniforme.
 *
 * @param resource - Recurso resuelto dentro del tenant, o `null`.
 * @param message - Mensaje «no encontrado» del recurso.
 * @returns El mismo recurso.
 * @throws ResourceNotFoundException `LAKEHOUSE_RESOURCE_OUTSIDE_TENANT` si es `null`.
 */
export function assertLakehouseFound<T>(
  resource: T | null | undefined,
  message: string,
): T {
  if (resource === null || resource === undefined) {
    throw lakehouseOutsideTenant(message);
  }
  return resource;
}

/**
 * Exige que un recurso exista y, si hay alcance, que pertenezca a ese tenant.
 * Sin alcance (barrido interno de `SYSTEM`) sólo exige que exista.
 *
 * @param resource - Recurso cargado, o `null` si no se encontró.
 * @param scope - Resultado de {@link lakehouseSweepScope}.
 * @param message - Mensaje «no encontrado» del recurso.
 * @returns El mismo recurso, ya acotado.
 */
export function assertLakehouseResourceInScope<T extends TenantOwned>(
  resource: T | null | undefined,
  scope: string | undefined,
  message: string,
): T {
  if (scope === undefined) {
    if (resource === null || resource === undefined) {
      throw lakehouseOutsideTenant(message);
    }
    return resource;
  }
  return assertLakehouseResourceInTenant(resource, scope, message);
}

/**
 * Exige que los campos indicados tengan valor. La tabla los declara
 * `NOT NULL` y no tienen un default de negocio: se rechaza antes de persistir
 * en lugar de dejar que PostgreSQL lo haga a media transacción.
 *
 * @param source - Objeto (DTO o fila de entrada) que debe traer los campos.
 * @param fields - Nombres de los campos obligatorios.
 * @param context - Qué se estaba registrando, para el mensaje.
 * @throws BadRequestException `VALIDATION_FAILED` con `reason` `LAKEHOUSE_REQUIRED_FIELD_MISSING`.
 */
export function requireFields(
  source: object,
  fields: readonly string[],
  context: string,
): void {
  const record = source as Record<string, unknown>;
  const missing = fields.filter(
    (field) =>
      record[field] === undefined ||
      record[field] === null ||
      record[field] === '',
  );
  if (missing.length === 0) return;
  throw new BadRequestException({
    code: ErrorCode.VALIDATION_FAILED,
    message: `Faltan campos obligatorios para ${context}`,
    details: { fields: missing },
    reason: LakehouseErrorReason.LAKEHOUSE_REQUIRED_FIELD_MISSING,
  });
}
