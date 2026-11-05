import { ResourceNotFoundException } from '../../common';
import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import { IntegrationContractsErrorReason } from './integration_contracts.error-reasons';

/** Mínimo que necesita la política para decidir el alcance de un contrato. */
interface TenantOwned {
  /** Tenant propietario; `null`/`undefined` cuenta como ajeno. */
  readonly tenantId?: string | null;
}

/**
 * 404 uniforme del módulo: mismo mensaje y mismo `reason`, sin `details`, para
 * un recurso inexistente y para uno que cuelga de un contrato de otro tenant.
 *
 * @param message - Mensaje «no encontrado» del recurso.
 * @returns La excepción a lanzar.
 */
export function integrationResourceOutOfScope(
  message: string,
): ResourceNotFoundException {
  return new ResourceNotFoundException(
    message,
    undefined,
    IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
  );
}

/**
 * Exige que un contrato pertenezca al tenant activo. Todo recurso hijo
 * (versión, perfil, suscripción, intercambio, cursor) se autoriza a través de
 * su contrato: se carga primero el hijo, luego su contrato por `id + tenantId`.
 *
 * @param contract - Contrato cargado, o `null` si no se encontró.
 * @param activeTenantId - Tenant verificado del contexto.
 * @param message - Mensaje «no encontrado» del recurso que se resolvía.
 * @returns El mismo contrato, ya acotado al tenant.
 * @throws ResourceNotFoundException `INTEGRATION_RESOURCE_OUT_OF_SCOPE` si no existe o es ajeno.
 */
export function assertContractInTenant<T extends TenantOwned>(
  contract: T | null | undefined,
  activeTenantId: string,
  message = 'Contrato no encontrado',
): T {
  return assertResourceInTenant(contract, contract?.tenantId, activeTenantId, {
    message,
    reason: IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
  });
}
