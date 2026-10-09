import type { UnitOfWork } from './unit-of-work';

/** El bloque de filiación que declara quien atiende el mostrador. */
export interface WalkInPatientData {
  readonly name: string;
  readonly middleName?: string;
  readonly lastName: string;
  readonly motherLastName?: string;
  readonly nationalId: string;
  readonly issuerAdministrativeAreaConceptId?: string;
  readonly birthDate?: string;
  readonly phone: string;
  readonly occupationConceptId?: string;
  readonly occupationFreeText?: string;
  readonly guardianName?: string;
  readonly guardianPhone?: string;
  readonly guardianRelationshipConceptId?: string;
  /** Quién escribe las filas, para la auditoría. */
  readonly actorUserId: string;
}

/** Lo que queda disponible para el resto del alta de mostrador (la cita). */
export interface WalkInPatientResult {
  readonly personId: string;
  readonly patientProfileId: string;
  readonly patientCode: string;
}

/**
 * Alta del paciente de mostrador (contextos `profiles` y `common`): persona,
 * perfil, documento, teléfono y tutor opcional, dentro de la transacción del
 * llamador (regla 11 v4.0.7: padre e hija en la misma transacción).
 */
export interface WalkInPatientRegistryPort {
  /**
   * Registra al paciente.
   *
   * @throws ConflictException (409) si ya existe un paciente con ese documento.
   */
  register(
    uow: UnitOfWork,
    data: WalkInPatientData,
  ): Promise<WalkInPatientResult>;
}

/** Token de inyección del alta de pacientes de mostrador. */
export const WALK_IN_PATIENT_REGISTRY_PORT = Symbol(
  'WALK_IN_PATIENT_REGISTRY_PORT',
);
