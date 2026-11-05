import { HttpStatus } from '@nestjs/common';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import type { ResourceScopeFailure } from '../../../common/tenant/resource-scope';
import { CrmErrorReason } from '../crm.error-reasons';

/**
 * Describe cómo se informa «no existe» de un recurso CRM: el mismo mensaje y el
 * mismo `reason` para el que no existe y para el que es de otro tenant.
 *
 * @param message - Mensaje para humanos.
 * @param reason - Sub-código del catálogo del módulo.
 * @returns La descripción que consume `assertResourceInTenant`.
 */
export function crmNotFound(
  message: string,
  reason: CrmErrorReason,
): ResourceScopeFailure {
  return { message, reason };
}

/**
 * El 404 uniforme de un recurso CRM (mismo mensaje, mismo `reason`, sin `details`).
 *
 * @param failure - Descripción de «no existe» del recurso.
 * @returns La excepción lista para lanzar.
 */
export function notFound(
  failure: ResourceScopeFailure,
): ResourceNotFoundException {
  return new ResourceNotFoundException(
    failure.message,
    undefined,
    failure.reason,
  );
}

/**
 * El tenant del cuerpo no es fuente de verdad: si viene, tiene que ser el del
 * contexto verificado.
 *
 * @param bodyTenantId - Tenant enviado por el cliente.
 * @param activeTenantId - Tenant activo del actor (`requireTenantId()`).
 * @throws DomainException 403 `CRM_TENANT_SCOPE_REQUIRED` si el cuerpo contradice al contexto.
 */
export function assertBodyTenantMatches(
  bodyTenantId: string | undefined,
  activeTenantId: string,
): void {
  if (bodyTenantId !== undefined && bodyTenantId !== activeTenantId) {
    throw new DomainException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'El tenant indicado no es el tenant activo.',
      undefined,
      CrmErrorReason.CRM_TENANT_SCOPE_REQUIRED,
    );
  }
}

/**
 * La etapa existe en el tenant pero pertenece a otro pipeline que el de la
 * oportunidad: 422 catalogado.
 *
 * @returns La excepción lista para lanzar.
 */
export function stageMismatch(): PreconditionFailedException {
  return new PreconditionFailedException(
    'La etapa no pertenece al pipeline de la oportunidad',
    undefined,
    CrmErrorReason.CRM_STAGE_PIPELINE_MISMATCH,
  );
}
