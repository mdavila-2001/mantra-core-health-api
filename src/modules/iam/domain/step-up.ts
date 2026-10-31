/**
 * «Paso extra» (verificación en dos pasos fresca) de una sesión: reglas puras.
 *
 * El sello de paso extra es un instante guardado por sesión; esta capa decide
 * cómo se nombra la clave, cuánto vive, cómo se lee el valor y cuándo cuenta como
 * fresco. No toca Redis ni el reloj: todo recibe el entorno y el instante.
 */

/** Cuánto vive el sello, en minutos, si `SUPPORT_STEP_UP_TTL_MIN` no dice otra cosa. */
export const DEFAULT_STEP_UP_TTL_MINUTES = 60;

/** Techo del TTL configurable (un día): más allá, la variable se tiene por inválida. */
export const MAX_STEP_UP_TTL_MINUTES = 1440;

/** Edad máxima por defecto con la que se acepta un sello (contrato §3.7). */
export const DEFAULT_STEP_UP_MAX_AGE_MINUTES = 10;

/** Edad máxima que una obligación puede pedir (contrato §3.7: 1-60). */
export const MAX_STEP_UP_MAX_AGE_MINUTES = 60;

/** Prefijo de la clave Redis del sello. */
export const STEP_UP_KEY_PREFIX = 'stepup:';

/**
 * Clave Redis del sello de una sesión.
 *
 * @param sessionId - `sid` del token (`iam.sessions.token_id`).
 * @returns `stepup:<sessionId>`.
 */
export function stepUpKey(sessionId: string): string {
  return `${STEP_UP_KEY_PREFIX}${sessionId}`;
}

/**
 * TTL del sello en minutos, de `SUPPORT_STEP_UP_TTL_MIN`. Un valor ausente o
 * inválido (no entero, cero, negativo, mayor de un día) deja el de por defecto:
 * la variable nunca abre un control, a lo sumo lo deja como está.
 *
 * @param env - Variables de entorno.
 * @returns Minutos de vida del sello.
 */
export function stepUpTtlMinutes(
  env: Readonly<Record<string, string | undefined>>,
): number {
  const raw = env.SUPPORT_STEP_UP_TTL_MIN;
  if (raw === undefined || !/^\d+$/.test(raw.trim())) {
    return DEFAULT_STEP_UP_TTL_MINUTES;
  }
  const minutes = Number(raw.trim());
  return minutes >= 1 && minutes <= MAX_STEP_UP_TTL_MINUTES
    ? minutes
    : DEFAULT_STEP_UP_TTL_MINUTES;
}

/**
 * Lee el instante guardado (milisegundos desde la época).
 *
 * @param raw - Valor leído de Redis.
 * @returns Los milisegundos, o `null` si el valor no es un instante legible (un
 *   valor ilegible equivale a no haber sello: se vuelve a pedir el paso extra).
 */
export function parseStepUpStamp(
  raw: string | null | undefined,
): number | null {
  if (raw === null || raw === undefined || !/^\d+$/.test(raw)) return null;
  const ms = Number(raw);
  return Number.isSafeInteger(ms) && ms > 0 ? ms : null;
}

/**
 * Edad del sello en minutos (fraccionaria). Un sello «del futuro» por desfase de
 * reloj entre réplicas cuenta como recién hecho, nunca como edad negativa.
 *
 * @param stampMs - Instante del sello.
 * @param nowMs - Instante actual.
 * @returns Minutos transcurridos, `>= 0`.
 */
export function ageMinutesOf(stampMs: number, nowMs: number): number {
  return Math.max(0, nowMs - stampMs) / 60_000;
}

/**
 * ¿El sello cumple la edad máxima pedida? Sin sello (`null`) nunca.
 *
 * @param ageMinutes - Edad del sello o `null`.
 * @param maxAgeMinutes - Edad máxima aceptada, inclusive.
 */
export function isStepUpFresh(
  ageMinutes: number | null,
  maxAgeMinutes: number,
): boolean {
  return ageMinutes !== null && ageMinutes <= maxAgeMinutes;
}

/**
 * Normaliza una edad máxima pedida: entera, entre 1 y 60; sin valor, 10.
 *
 * @param requested - Valor pedido (puede faltar o ser basura).
 */
export function clampMaxAgeMinutes(requested: number | undefined): number {
  if (requested === undefined || !Number.isFinite(requested)) {
    return DEFAULT_STEP_UP_MAX_AGE_MINUTES;
  }
  return Math.min(
    MAX_STEP_UP_MAX_AGE_MINUTES,
    Math.max(1, Math.floor(requested)),
  );
}
