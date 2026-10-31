import {
  ageMinutesOf,
  DEFAULT_STEP_UP_TTL_MINUTES,
} from '../../domain/step-up';
import { StepUpUnavailableError, type StepUpPort } from './step-up.port';

/**
 * Doble de {@link StepUpPort} para las pruebas de quien lo consume
 * (`delegated_access`, `scheduling`…): sellos en memoria con el mismo contrato
 * que el real (edad fraccionaria, `null` sin sello o vencido, sello por sesión y
 * `StepUpUnavailableError` cuando se simula Redis caído).
 *
 * @example
 *   const stepUp = new InMemoryStepUp();
 *   stepUp.stamp('sid-1', Date.now() - 4 * 60_000);
 *   await stepUp.ageMinutes('sid-1'); // ≈ 4
 */
export class InMemoryStepUp implements StepUpPort {
  /** Si es `true`, toda consulta lanza `StepUpUnavailableError` (Redis caído). */
  unavailable = false;

  private readonly stamps = new Map<string, number>();
  private readonly ttlMinutes: number;

  /**
   * @param options - `ttlMinutes`: vida del sello (por defecto 60).
   */
  constructor(options: { readonly ttlMinutes?: number } = {}) {
    this.ttlMinutes = options.ttlMinutes ?? DEFAULT_STEP_UP_TTL_MINUTES;
  }

  /** Deja un sello en la sesión en el instante dado (por defecto, ahora). */
  stamp(sessionId: string, atMs: number = Date.now()): void {
    this.stamps.set(sessionId, atMs);
  }

  /** Borra el sello de la sesión (cierre de sesión). */
  clear(sessionId: string): void {
    this.stamps.delete(sessionId);
  }

  /** @inheritdoc */
  ageMinutes(
    sessionId: string,
    nowMs: number = Date.now(),
  ): Promise<number | null> {
    if (this.unavailable) {
      return Promise.reject(new StepUpUnavailableError('doble: no disponible'));
    }
    const at = this.stamps.get(sessionId);
    if (at === undefined) return Promise.resolve(null);
    const age = ageMinutesOf(at, nowMs);
    return Promise.resolve(age > this.ttlMinutes ? null : age);
  }
}
