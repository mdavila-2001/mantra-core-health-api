import type { EntityManager } from '@mikro-orm/postgresql';

/** Aceptación explícita del paciente del costo total de un servicio. */
export interface PatientChargeAcceptance {
  readonly acceptedAmount: string;
  readonly acceptedAt: Date;
  readonly acceptedByUserId: string;
}

/**
 * Dónde queda la aceptación previa del paciente para un cobro particular
 * (carril 16, REQ-16-030).
 *
 * **Persistencia BLOQUEADA.** El modelo no tiene hoy ninguna tabla que guarde
 * {paciente, línea del reclamo, importe aceptado, fecha, usuario}: las tablas de
 * `consent.*` no guardan importes y `billing.quotations` no tiene aceptación.
 * Crearla es un cambio de esquema que nace en el `.puml` del repositorio del
 * modelo (ADR-0021), en un PR aparte. Mientras tanto el adaptador enlazado es
 * `NoPatientChargeAcceptanceAdapter`, que responde siempre «no hay aceptación»:
 * ante la duda, no se cobra como particular.
 */
export interface PatientChargeAcceptancePort {
  /**
   * La aceptación más reciente del paciente para esa línea, sin filtrar por
   * importe, para poder distinguir «no aceptó» de «aceptó otro importe».
   */
  findLatestAcceptance(
    em: EntityManager,
    query: { patientProfileId: string; claimLineId: string },
  ): Promise<PatientChargeAcceptance | null>;
}

export const PATIENT_CHARGE_ACCEPTANCE_PORT = Symbol(
  'INSURANCE_PATIENT_CHARGE_ACCEPTANCE_PORT',
);
