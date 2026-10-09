import type { AuthenticatedUser } from '../../../../common';
import type { UnitOfWork } from './unit-of-work';

/**
 * Quién puede actuar por un paciente (contexto `profiles`).
 *
 * B.1 — hasta que la agenda lo preguntó, cualquier cuenta con rol `PATIENT`
 * podía retener un cupo y confirmar una cita a nombre de un perfil ajeno con
 * sólo escribir su uuid. La regla vive en `profiles` porque la representación
 * es un dato de perfiles.
 */
export interface PatientRepresentationPort {
  /**
   * Exige que el actor sea el titular o tenga apoderamiento vigente.
   *
   * @throws ForbiddenException si no lo es.
   */
  assertMayActForPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    uow?: UnitOfWork,
  ): Promise<void>;

  /** Si el actor es el titular o tiene apoderamiento vigente. */
  representsPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    uow?: UnitOfWork,
  ): Promise<boolean>;

  /** Los perfiles de paciente que el usuario representa, vigentes hoy. */
  findActiveProxiedPatientIds(
    userId: string,
    uow?: UnitOfWork,
  ): Promise<Set<string>>;
}

/** Token de inyección de la representación de pacientes. */
export const PATIENT_REPRESENTATION_PORT = Symbol(
  'PATIENT_REPRESENTATION_PORT',
);
