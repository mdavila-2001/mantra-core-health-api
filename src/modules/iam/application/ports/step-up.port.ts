/**
 * El paso extra (verificación en dos pasos fresca) de una sesión, visto desde
 * quien lo consume.
 *
 * `delegated_access` decide si una acción exige paso extra (átomos con
 * `requires_step_up`, `obligations.stepUp`, exportaciones…) y le pregunta a este
 * puerto qué edad tiene el último de la sesión. El token no cambia: el sello vive
 * en Redis, atado a la sesión (`sid`), y lo escribe `POST /iam/me/step-up`.
 */
export interface StepUpPort {
  /**
   * Minutos transcurridos desde el último paso extra de la sesión.
   *
   * @param sessionId - `sid` del token que hace la petición.
   * @param nowMs - Instante de referencia en milisegundos (por defecto, ahora).
   * @returns Minutos (fraccionarios, `>= 0`), o `null` si la sesión no tiene
   *   sello vigente (nunca lo hizo, venció o la sesión se cerró).
   * @throws StepUpUnavailableError si no se puede comprobar (Redis caído o sin
   *   responder). El consumidor DEBE tratarlo como negación (`DENY
   *   STEP_UP_UNAVAILABLE`): jamás como «sin sello» ni como «fresco».
   */
  ageMinutes(sessionId: string, nowMs?: number): Promise<number | null>;
}

/** Token de inyección de {@link StepUpPort}. */
export const STEP_UP_PORT = Symbol('IAM_STEP_UP_PORT');

/**
 * No se pudo comprobar el paso extra. Falla cerrado: quien la reciba niega, no
 * finge un resultado.
 */
export class StepUpUnavailableError extends Error {
  /** Código estable, el mismo `reason` que ve la política y el cliente. */
  readonly code = 'STEP_UP_UNAVAILABLE';

  /**
   * @param cause - Causa técnica, sin datos de la persona (solo para el log).
   */
  constructor(cause?: string) {
    super(
      cause
        ? `No se pudo comprobar el paso extra: ${cause}`
        : 'No se pudo comprobar el paso extra',
    );
    this.name = 'StepUpUnavailableError';
  }
}
