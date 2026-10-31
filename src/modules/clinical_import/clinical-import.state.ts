import type { BatchStatus } from './clinical-import.types';

/* ============================================================================
    Estados del lote y transiciones válidas. Una sola tabla: el repositorio, el
    servicio y el ejecutor consultan ésta y ninguna otra.

      VALIDADO ──confirmar──▶ EN_COLA ──tomar──▶ PROCESANDO ──┬─▶ COMPLETADO
                                                              └─▶ FALLIDO
      RECHAZADO (terminal: nace así si ninguna fila quedó lista)
    ========================================================================== */

const TRANSITIONS: Readonly<Record<BatchStatus, readonly BatchStatus[]>> = {
  VALIDADO: ['EN_COLA'],
  EN_COLA: ['PROCESANDO'],
  PROCESANDO: ['COMPLETADO', 'FALLIDO'],
  COMPLETADO: [],
  FALLIDO: [],
  RECHAZADO: [],
};

export function canTransition(from: BatchStatus, to: BatchStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Lanza si la transición no existe; el repositorio la aplica además con compare-and-set. */
export function assertTransition(from: BatchStatus, to: BatchStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: BatchStatus,
    readonly to: BatchStatus,
  ) {
    super(`Transición inválida del lote: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function isInFlight(status: BatchStatus): boolean {
  return status === 'EN_COLA' || status === 'PROCESANDO';
}

export function isFinished(status: BatchStatus): boolean {
  return (
    status === 'COMPLETADO' || status === 'FALLIDO' || status === 'RECHAZADO'
  );
}
