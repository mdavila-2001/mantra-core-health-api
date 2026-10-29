/**
 * Marca de tiempo firmada de un webhook entrante y ventana anti-replay.
 *
 * La firma HMAC prueba que el cuerpo lo emitió quien conoce el secreto, no que
 * se emitió *ahora*: una entrega capturada se puede reenviar tal cual. Si la
 * marca de tiempo forma parte de lo firmado, `isWithinReplayWindow` acota esa
 * reutilización a unos minutos. La idempotencia por identificador de evento
 * (que cada módulo mantiene) cubre el resto de la ventana.
 */

/** Tolerancia por defecto entre el reloj del emisor y el del receptor. */
export const DEFAULT_REPLAY_WINDOW_SECONDS = 300;

/** Segundos desde la época (hasta 10 dígitos: ~año 2286) o ISO-8601 con zona. */
const EPOCH_SECONDS = /^\d{1,10}$/;
const ISO_8601 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Interpreta la marca de tiempo recibida en una cabecera.
 *
 * @param raw - Valor de la cabecera tal como llegó.
 * @returns La fecha, o `null` si falta o no tiene una de las formas admitidas.
 */
export function parseWebhookTimestamp(
  raw: string | null | undefined,
): Date | null {
  if (!raw) return null;
  const value = raw.trim();
  let date: Date;
  if (EPOCH_SECONDS.test(value)) {
    date = new Date(Number(value) * 1000);
  } else if (ISO_8601.test(value)) {
    date = new Date(value);
  } else {
    return null;
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Si la marca de tiempo cae dentro de la ventana, hacia el pasado o hacia el
 * futuro (relojes desfasados).
 *
 * @param timestamp - Marca ya interpretada.
 * @param now - Instante de recepción.
 * @param windowSeconds - Tolerancia en segundos.
 * @returns `true` si `|now - timestamp| <= windowSeconds`.
 */
export function isWithinReplayWindow(
  timestamp: Date,
  now: Date,
  windowSeconds: number = DEFAULT_REPLAY_WINDOW_SECONDS,
): boolean {
  return Math.abs(now.getTime() - timestamp.getTime()) <= windowSeconds * 1000;
}
