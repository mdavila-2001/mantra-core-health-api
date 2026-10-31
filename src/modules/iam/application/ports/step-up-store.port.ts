import type { StepUpPort } from './step-up.port';

/** Resultado de sellar la sesión. */
export interface StepUpStamp {
  /** Instante del sello. */
  readonly verifiedAt: Date;
  /** Minutos que vale el sello (su TTL). */
  readonly ttlMinutes: number;
}

/**
 * El almacén del paso extra por sesión, visto desde los servicios de aplicación:
 * quien sella (`POST /iam/me/step-up`), quien limpia al cerrar sesión y quien
 * comprueba que se puede sellar antes de gastar un código de un solo uso. Es una
 * clase abstracta para poder inyectarla por tipo (la implementación vive en
 * `infrastructure/adapters/redis-step-up.store.ts`); `application/` depende de
 * este puerto y no de `infrastructure/` (ADR-0026).
 */
export abstract class StepUpStorePort implements StepUpPort {
  /**
   * Sella la sesión: guarda el instante con su TTL.
   *
   * @param sessionId - `sid` del token.
   * @param nowMs - Instante del sello (por defecto, ahora).
   * @throws StepUpUnavailableError si no se pudo escribir.
   */
  abstract stamp(sessionId: string, nowMs?: number): Promise<StepUpStamp>;

  /** @inheritdoc */
  abstract ageMinutes(
    sessionId: string,
    nowMs?: number,
  ): Promise<number | null>;

  /**
   * Borra el sello de la sesión (al cerrarla). Nunca lanza.
   *
   * @param sessionId - `sid` del token.
   */
  abstract clear(sessionId: string): Promise<void>;

  /**
   * Comprueba que el almacén responde.
   *
   * @throws StepUpUnavailableError si no responde.
   */
  abstract assertAvailable(): Promise<void>;
}
