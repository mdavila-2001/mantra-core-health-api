/**
 * Secreto con el que se acota la clave de idempotencia de un evento anónimo.
 *
 * El evento anónimo no guarda a quién pertenece; su clave de reenvío, en
 * cambio, se deriva de la persona que la envía. Se firma con HMAC y un secreto
 * del servidor que no ven quienes consultan la analítica: un hash simple de
 * datos conocidos (persona, organización y una clave que el cliente suele
 * elegir con poca variación) se podría reconstruir probando candidatos y
 * volvería a ligar el evento con la persona.
 *
 * Sin secreto fuera de `development` y `test` **no se deduplica** (cada evento recibe una clave
 * aleatoria): es preferible un reenvío repetido a un evento re-identificable.
 */
const DEV_IDEMPOTENCY_SECRET =
  'dev-only-telemetry-idempotency-secret-change-before-production';
const MIN_SECRET_LENGTH = 16;

/** Secreto vigente, o `null` si no hay uno utilizable (producción sin configurar). */
export function loadAnonymousIdempotencySecret(): string | null {
  const configured = process.env.TELEMETRY_IDEMPOTENCY_SECRET;
  if (configured !== undefined && configured.length >= MIN_SECRET_LENGTH) {
    return configured;
  }
  // El secreto de desarrollo es público (está en el repositorio): sólo vale donde
  // no hay datos reales. Staging o cualquier otro entorno sin secreto propio no
  // deduplica, igual que producción.
  const env = process.env.NODE_ENV;
  return env === 'development' || env === 'test'
    ? DEV_IDEMPOTENCY_SECRET
    : null;
}
