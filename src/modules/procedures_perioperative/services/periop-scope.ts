import type { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException, requireTenantId } from '../../../common';
import {
  assertResourceInTenant,
  type ResourceScopeFailure,
} from '../../../common/tenant/resource-scope';
import type { ProcedureCases } from '../entities';
import { ProceduresPerioperativeErrorReason } from '../procedures_perioperative.error-reasons';
import type { PeriopCasesRepository } from '../repositories';

/**
 * Cómo informa el módulo «el caso no existe».
 *
 * Un caso de otro tenant responde con **exactamente** esto: el mismo mensaje y
 * el mismo `reason` que uno inexistente, sin `details`. Un mensaje o un `reason`
 * distintos le confirmarían a un tercero que el uuid existe en otra organización.
 */
export const PERIOP_CASE_NOT_FOUND: ResourceScopeFailure = {
  message: 'Caso quirúrgico no encontrado',
  reason: ProceduresPerioperativeErrorReason.PERIOP_CASE_NOT_FOUND,
};

/**
 * El 404 uniforme del caso quirúrgico: inexistente, de otro tenant o sin base
 * para que el actor lo vea. Siempre el mismo mensaje y `reason`, sin `details`.
 *
 * @returns La excepción lista para lanzar.
 */
export function periopCaseNotFound(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    PERIOP_CASE_NOT_FOUND.message,
    undefined,
    PERIOP_CASE_NOT_FOUND.reason,
  );
}

/**
 * Acota un caso ya cargado por UUID al tenant activo (su tenant custodio).
 *
 * @param surgicalCase - Caso cargado, o `null` si no se encontró.
 * @param activeTenantId - Tenant del contexto de la petición.
 * @returns El mismo caso, ya acotado.
 * @throws ResourceNotFoundException (`PERIOP_CASE_NOT_FOUND`) si no existe o es de otro tenant.
 */
export function assertCaseInScope(
  surgicalCase: ProcedureCases | null | undefined,
  activeTenantId: string,
): ProcedureCases {
  return assertResourceInTenant(
    surgicalCase,
    surgicalCase?.custodianTenantId,
    activeTenantId,
    PERIOP_CASE_NOT_FOUND,
  );
}

/**
 * Carga el caso por UUID para escribir y exige que sea del tenant activo.
 *
 * El tenant sale del contexto verificado de la petición. El filtro va en la
 * consulta que bloquea la fila —no se bloquea un caso ajeno— y se vuelve a
 * comprobar sobre lo cargado.
 *
 * @param casesRepo - Repositorio de casos.
 * @param tx - Transacción activa.
 * @param caseId - Caso pedido por el cliente.
 * @returns El caso bloqueado, del tenant activo.
 * @throws PreconditionFailedException si la petición no tiene tenant activo.
 * @throws ResourceNotFoundException (`PERIOP_CASE_NOT_FOUND`) si no existe o es de otro tenant.
 */
export async function loadCaseForUpdateInScope(
  casesRepo: PeriopCasesRepository,
  tx: EntityManager,
  caseId: string,
): Promise<ProcedureCases> {
  const tenantId = requireTenantId();
  return assertCaseInScope(
    await casesRepo.findCaseForUpdate(tx, caseId, tenantId),
    tenantId,
  );
}

/**
 * Carga el caso por UUID **sin bloquearlo** y exige que sea del tenant activo.
 * Para operaciones que escriben en un hijo del caso (checklist, informe) y no
 * en el caso mismo: la pertenencia al tenant se prueba antes de tocar el hijo.
 *
 * @param casesRepo - Repositorio de casos.
 * @param tx - Transacción activa.
 * @param caseId - Caso pedido por el cliente.
 * @returns El caso, del tenant activo.
 * @throws PreconditionFailedException si la petición no tiene tenant activo.
 * @throws ResourceNotFoundException (`PERIOP_CASE_NOT_FOUND`) si no existe o es de otro tenant.
 */
export async function loadCaseInScope(
  casesRepo: PeriopCasesRepository,
  tx: EntityManager,
  caseId: string,
): Promise<ProcedureCases> {
  const tenantId = requireTenantId();
  return assertCaseInScope(
    await casesRepo.findCaseById(tx, caseId, tenantId),
    tenantId,
  );
}

/**
 * Comprueba, sin bloquear, que un caso (el de un recurso hijo cargado por su
 * propio UUID) es del tenant activo. Sirve para no revelar que el hijo existe
 * en un caso ajeno: si el caso es de otro tenant, el hijo es «inexistente».
 *
 * @param casesRepo - Repositorio de casos.
 * @param tx - Transacción activa.
 * @param caseId - Caso al que pertenece el hijo.
 * @returns `true` si el caso existe y es del tenant activo.
 */
export async function isCaseInScope(
  casesRepo: PeriopCasesRepository,
  tx: EntityManager,
  caseId: string,
): Promise<boolean> {
  const tenantId = requireTenantId();
  const surgicalCase = await casesRepo.findCaseById(tx, caseId, tenantId);
  return surgicalCase?.custodianTenantId === tenantId;
}

/**
 * Exige que un procedimiento que mandó el cliente sea del paciente y del tenant
 * custodio del caso. Sin esto, el id de un procedimiento de otro paciente quedaría
 * enlazado al caso.
 *
 * @param casesRepo - Repositorio de casos.
 * @param tx - Transacción activa.
 * @param procedureId - Procedimiento pedido por el cliente.
 * @param owner - Paciente y tenant custodio del caso.
 * @throws ResourceNotFoundException (`PROCEDURE_NOT_FOUND_FOR_CASE_PATIENT`) si no existe, es de otro paciente o de otro tenant.
 */
export async function assertProcedureOfCasePatient(
  casesRepo: PeriopCasesRepository,
  tx: EntityManager,
  procedureId: string,
  owner: { patientProfileId: string; custodianTenantId: string },
): Promise<void> {
  const procedure = await casesRepo.findProcedureOfPatient(
    tx,
    procedureId,
    owner.patientProfileId,
    owner.custodianTenantId,
  );
  if (!procedure) {
    throw new ResourceNotFoundException(
      'Procedimiento no encontrado para el paciente del caso',
      undefined,
      ProceduresPerioperativeErrorReason.PROCEDURE_NOT_FOUND_FOR_CASE_PATIENT,
    );
  }
}
