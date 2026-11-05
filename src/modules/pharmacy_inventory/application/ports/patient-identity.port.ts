import type { UnitOfWork } from './unit-of-work';

/**
 * Lo mínimo de la identidad del paciente para **enmascararla** (S-4): las
 * partes del nombre y el valor del documento nacional vigente. Nunca sale tal
 * cual en una respuesta: la pantalla de la farmacia recibe solo las iniciales
 * y los últimos 3 dígitos.
 */
export interface PatientIdentitySnapshot {
  readonly name: string | null;
  readonly middleName: string | null;
  readonly lastName: string | null;
  readonly motherLastName: string | null;
  readonly displayName: string | null;
  /** Valor del documento nacional vigente, o `null` si no lo declaró. */
  readonly nationalDocument: string | null;
}

/** Identidad del paciente (contexto profiles y sus identificadores). */
export interface PatientIdentityPort {
  findByPatientProfile(
    uow: UnitOfWork,
    patientProfileId: string,
  ): Promise<PatientIdentitySnapshot | null>;
}

/** Token de inyección de la identidad del paciente. */
export const PATIENT_IDENTITY_PORT = Symbol('PATIENT_IDENTITY_PORT');
