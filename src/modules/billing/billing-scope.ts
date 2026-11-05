import { requireTenantId } from '../../common';
import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import type { ResourceScopeFailure } from '../../common/tenant/resource-scope';
import type { PracticeTenantLookupService } from '../practice/services';
import { BillingErrorReason } from './billing.error-reasons';

/**
 * Cómo informa `billing` que una práctica "no existe". Una práctica de otra
 * organización responde con exactamente esto: mismo mensaje, mismo `reason`, sin
 * `details`.
 */
export const BILLING_PRACTICE_FAILURE: ResourceScopeFailure = {
  message: 'Práctica no encontrada',
  reason: BillingErrorReason.BILLING_PRACTICE_NOT_FOUND,
};

/**
 * Tenant activo de la petición. Los documentos financieros (`invoices`, `bills`,
 * pagos…) no tienen `tenant_id`: su tenant es el de su práctica, y la práctica
 * sólo se puede contrastar contra un tenant del contexto, nunca contra el que
 * traiga el cuerpo.
 *
 * @returns El tenant verificado del actor.
 * @throws PreconditionFailedException si el request no fijó ningún tenant.
 */
export function activeTenantId(): string {
  return requireTenantId();
}

/**
 * Exige que `practiceId` pertenezca al tenant activo, antes de leer o escribir.
 *
 * @param lookup - Puerto de lectura de `practice`.
 * @param practiceId - Práctica recibida del cliente.
 * @param tenantId - Tenant activo.
 * @param failure - Respuesta de "no existe" del recurso que se estaba resolviendo.
 * @throws ResourceNotFoundException si la práctica no existe o es de otro tenant.
 */
export async function assertPracticeInTenant(
  lookup: PracticeTenantLookupService,
  practiceId: string,
  tenantId: string,
  failure: ResourceScopeFailure = BILLING_PRACTICE_FAILURE,
): Promise<void> {
  const owner = await lookup.findTenantOfPractice(practiceId);
  assertResourceInTenant(practiceId, owner, tenantId, failure);
}

/**
 * Acota un documento financiero cargado por UUID al tenant activo, a través de
 * su práctica.
 *
 * @param lookup - Puerto de lectura de `practice`.
 * @param document - Documento cargado, o `null` si no se encontró.
 * @param tenantId - Tenant activo.
 * @param failure - Respuesta de "no existe" del documento.
 * @returns El mismo documento, ya acotado al tenant.
 * @throws ResourceNotFoundException si no existe o su práctica es de otro tenant.
 */
export async function assertDocumentInTenant<T extends { practiceId: string }>(
  lookup: PracticeTenantLookupService,
  document: T | null | undefined,
  tenantId: string,
  failure: ResourceScopeFailure,
): Promise<T> {
  const owner = document
    ? await lookup.findTenantOfPractice(document.practiceId)
    : null;
  return assertResourceInTenant(document, owner, tenantId, failure);
}

/**
 * Exige que un documento pertenezca a la práctica de la operación. Se usa tras
 * validar la práctica: un pago de la práctica A no se asigna a la factura de la
 * práctica B aunque ambas sean del mismo tenant.
 *
 * @param document - Documento cargado, o `null` si no se encontró.
 * @param practiceId - Práctica ya verificada de la operación.
 * @param failure - Respuesta de "no existe" del documento.
 * @returns El mismo documento.
 * @throws ResourceNotFoundException si no existe o es de otra práctica.
 */
export function assertDocumentInPractice<T extends { practiceId: string }>(
  document: T | null | undefined,
  practiceId: string,
  failure: ResourceScopeFailure,
): T {
  return assertResourceInTenant(
    document,
    document?.practiceId,
    practiceId,
    failure,
  );
}
