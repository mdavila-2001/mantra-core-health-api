/**
 * Resolución de secretos con default de desarrollo y corte duro en producción.
 *
 * El criterio ya estaba aplicado a mano en `common/auth/auth.env.ts` (JWT) y en
 * `common/crypto/secret-cipher.ts` (MFA). Al aparecer dos secretos más con la
 * misma necesidad —firma de URLs de descarga y firma de webhooks— se extrae aquí
 * en lugar de repetir el `if (isProduction && ...) throw` una cuarta vez.
 *
 * La regla es una sola: un secreto que vive en el repositorio es un secreto
 * público. Sirve para levantar el entorno de desarrollo sin fricción, pero si
 * llega a producción cualquiera puede forjar lo que ese secreto firma. Por eso
 * el arranque se aborta en vez de degradar en silencio.
 */

/**
 * Devuelve el secreto de `envVar`, o `devFallback` fuera de producción.
 *
 * @param envVar      nombre de la variable de entorno que lo aporta.
 * @param devFallback valor conocido y público, solo apto para desarrollo.
 * @param purpose     qué firma o cifra este secreto; se usa en el mensaje de
 *                    error para que quien lo vea sepa qué queda expuesto.
 * @throws Error si `NODE_ENV==='production'` y la variable falta o repite el
 *         valor de desarrollo.
 */
export function resolveSecret(
  envVar: string,
  devFallback: string,
  purpose: string,
): string {
  const configured = process.env[envVar];

  if (
    process.env.NODE_ENV === 'production' &&
    (!configured || configured === devFallback)
  ) {
    throw new Error(
      `${envVar} es obligatoria en producción y no puede ser el valor de ` +
        `desarrollo: ${purpose}. Configúrela desde el gestor de secretos ` +
        '(>= 32 caracteres).',
    );
  }

  return configured ?? devFallback;
}
