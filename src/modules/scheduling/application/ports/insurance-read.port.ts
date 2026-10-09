import type { UnitOfWork } from './unit-of-work';

/** La solicitud de seguro de un encuentro, resumida para la agenda. */
export interface InsuranceClaimSummary {
  readonly id: string;
  readonly encounterId: string;
  readonly claimIdentifier: string;
  readonly statusCode: string;
  readonly statusDisplay: string;
  readonly submittedAt: Date | null;
}

/**
 * Lecturas de seguros que la agenda muestra junto a la cita (contexto
 * `insurance`). Sólo lectura: la agenda nunca escribe en ese contexto.
 */
export interface InsuranceReadPort {
  /** Mapa `patientProfileId → nombre legal de la aseguradora vigente`. */
  findActiveCarriersByPatients(
    uow: UnitOfWork,
    patientProfileIds: readonly string[],
  ): Promise<Map<string, string>>;

  /**
   * Las solicitudes de seguro de los encuentros, de la más reciente a la más
   * vieja.
   */
  findClaimSummariesByEncounterIds(
    uow: UnitOfWork,
    encounterIds: readonly string[],
  ): Promise<InsuranceClaimSummary[]>;
}

/** Token de inyección de las lecturas de seguros. */
export const INSURANCE_READ_PORT = Symbol('INSURANCE_READ_PORT');
