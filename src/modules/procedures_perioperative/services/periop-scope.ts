import type { EntityManager } from '@mikro-orm/postgresql';
import { ForbiddenException } from '@nestjs/common';
import {
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import type { AuthzClinicalScopeService } from '../../authz/services/authz-clinical-scope.service';
import type { ClinicalReadService } from '../../clinical/services/clinical-read.service';
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
 * Cómo informa el módulo «el procedimiento no existe para el paciente del caso».
 *
 * Un procedimiento de otro paciente o de otro tenant responde con **exactamente**
 * esto, igual que uno inexistente: sin `details` y con el mismo `reason`.
 */
export const PERIOP_PROCEDURE_NOT_FOUND: ResourceScopeFailure = {
  message: 'Procedimiento no encontrado para el paciente del caso',
  reason:
    ProceduresPerioperativeErrorReason.PROCEDURE_NOT_FOUND_FOR_CASE_PATIENT,
};

/**
 * Exige que un id de procedimiento que manda el cliente exista y sea del
 * paciente del caso y del tenant activo. Sin esto, el id de un procedimiento de
 * otro paciente quedaría enlazado al caso.
 *
 * El paciente sale del caso (o del cuerpo, al programarlo) y el tenant del
 * contexto verificado: ninguno se toma del procedimiento que se está probando.
 *
 * @param casesRepo - Repositorio de casos.
 * @param tx - Transacción activa.
 * @param procedureId - Procedimiento citado por el cliente.
 * @param patientProfileId - Paciente del caso quirúrgico.
 * @throws PreconditionFailedException si la petición no tiene tenant activo.
 * @throws ResourceNotFoundException (`PROCEDURE_NOT_FOUND_FOR_CASE_PATIENT`) si no existe, es de otro paciente o de otro tenant.
 */
export async function assertProcedureOfCasePatient(
  casesRepo: PeriopCasesRepository,
  tx: EntityManager,
  procedureId: string,
  patientProfileId: string,
): Promise<void> {
  const tenantId = requireTenantId();
  const procedure = await casesRepo.findProcedureOfPatient(
    tx,
    procedureId,
    patientProfileId,
    tenantId,
  );
  // Se vuelve a comprobar sobre lo cargado: el filtro de la consulta no es la
  // única barrera, y el paciente ajeno responde igual que el tenant ajeno.
  assertResourceInTenant(
    procedure?.patientProfileId === patientProfileId ? procedure : null,
    procedure?.custodianTenantId,
    tenantId,
    PERIOP_PROCEDURE_NOT_FOUND,
  );
}

/**
 * Cómo informa el módulo «el paciente no existe en esta organización».
 *
 * Un paciente sin vínculo con el tenant activo responde con **exactamente**
 * esto, igual que uno inexistente: sin `details` y con el mismo `reason`.
 */
export const PERIOP_PATIENT_NOT_FOUND: ResourceScopeFailure = {
  message: 'Paciente no encontrado',
  reason: ProceduresPerioperativeErrorReason.PATIENT_NOT_FOUND_IN_TENANT,
};

/** Lo que `assertPatientInScope` necesita de `authz` y de `clinical`. */
export interface PatientScopeDeps {
  clinicalScope: Pick<AuthzClinicalScopeService, 'isPatientInTenant'>;
  clinicalRead: Pick<ClinicalReadService, 'assertCanWriteHistory'>;
}

/**
 * Exige que el paciente que manda el cliente tenga base para quedar ligado a
 * un caso quirúrgico de esta organización (#893). Sin esto, un
 * `patientProfileId` ajeno quedaba ligado al caso, y todo lo que después cuelga
 * de él (informe, pasos, implantes, servicios recibidos) lo heredaba.
 *
 * No hay una regla nueva: el padrón de personas es único para la plataforma y
 * el modelo no guarda el tenant del paciente, así que se usan las dos que ya
 * existen.
 *
 * 1. `AuthzClinicalScopeService.isPatientInTenant`: la huella que **el propio
 *    paciente** deja en el tenant (una reserva suya o su membresía). Es la
 *    regla de los accesos clínicos y de las relaciones asistenciales, y el
 *    personal no la puede fabricar con un check-in, un turno directo o un
 *    episodio de atención.
 * 2. Si no la hay, la base clínica del actor sobre ese paciente
 *    (`ClinicalReadService.assertCanWriteHistory`): lo está atendiendo, tiene
 *    una relación asistencial vigente o un acceso de escritura que el paciente
 *    autorizó. Es lo que exige escribir en la historia, y cubre al cirujano del
 *    paciente que todavía no reservó nada en esta organización.
 *
 * Sin ninguna de las dos, el mismo 404 que un paciente inexistente.
 *
 * @param deps - Regla de `authz` y base clínica de `clinical`.
 * @param em - Contexto de persistencia o transacción activa.
 * @param patientProfileId - Paciente citado por el cliente.
 * @param tenantId - Tenant activo, del contexto verificado de la petición.
 * @param actor - Quien programa o modifica el caso.
 * @throws ResourceNotFoundException (`PATIENT_NOT_FOUND_IN_TENANT`) si no existe o no hay base.
 */
export async function assertPatientInScope(
  deps: PatientScopeDeps,
  em: EntityManager,
  patientProfileId: string,
  tenantId: string,
  actor: AuthenticatedUser,
): Promise<void> {
  if (
    await deps.clinicalScope.isPatientInTenant(em, patientProfileId, tenantId)
  ) {
    return;
  }
  try {
    await deps.clinicalRead.assertCanWriteHistory(patientProfileId, actor);
    return;
  } catch (error) {
    if (!(error instanceof ForbiddenException)) throw error;
  }
  assertResourceInTenant(null, null, tenantId, PERIOP_PATIENT_NOT_FOUND);
}
