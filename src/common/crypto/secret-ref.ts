/**
 * Resolución de referencias a secretos guardadas en configuración (p. ej.
 * `gateway_connections.webhook_secret_ref`).
 *
 * Una referencia nunca es la clave literal: nombra dónde vive el secreto. Hoy el
 * único proveedor es el entorno del proceso (que en despliegue alimenta el gestor
 * de secretos), con el formato `env:WEBHOOK_SECRET_<NOMBRE>`. El prefijo es
 * obligatorio para que quien configure una conexión no pueda apuntar a una
 * variable cualquiera de valor conocido (`env:NODE_ENV`) y así forjar firmas.
 *
 * Rotación: la referencia admite hasta dos entradas separadas por coma
 * (`env:WEBHOOK_SECRET_X_V2,env:WEBHOOK_SECRET_X_V1`). Durante la ventana valen
 * ambas; al cerrarla se deja sólo la nueva. Cada conexión tiene su propia
 * referencia, así que rotar una no toca a las demás.
 *
 * Fail-closed: si una sola entrada es inválida, no está definida o es corta, no
 * se devuelve ningún secreto.
 */

/** Nombre de variable permitido para secretos de webhook. */
const WEBHOOK_SECRET_ENV = /^WEBHOOK_SECRET_[A-Z0-9_]{1,64}$/;

/** Longitud mínima aceptada para un secreto HMAC. */
export const MIN_WEBHOOK_SECRET_LENGTH = 32;

/** Máximo de versiones simultáneas durante una rotación. */
const MAX_REF_ENTRIES = 2;

/**
 * Resuelve una referencia de secreto de webhook a su(s) valor(es).
 *
 * @param ref referencia configurada (puede venir nula o vacía).
 * @param env entorno del que se leen los valores (inyectable en pruebas).
 * @returns los secretos, en el orden de la referencia, o `null` si la
 *          referencia falta o alguna entrada no resuelve.
 */
export function resolveWebhookSecretRef(
  ref: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): string[] | null {
  if (!ref) return null;
  const entries = ref.split(',').map((e) => e.trim());
  if (entries.length === 0 || entries.length > MAX_REF_ENTRIES) return null;

  const secrets: string[] = [];
  for (const entry of entries) {
    const match = /^env:(.+)$/.exec(entry);
    if (!match || !WEBHOOK_SECRET_ENV.test(match[1])) return null;
    const value = env[match[1]];
    if (!value || value.length < MIN_WEBHOOK_SECRET_LENGTH) return null;
    secrets.push(value);
  }
  return secrets;
}
