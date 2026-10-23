/**
 * Configuración de la medición de peticiones HTTP (H1.1 del portal de
 * superadministración).
 *
 * | Variable | Por defecto | Qué hace |
 * |---|---|---|
 * | `OBSERVABILITY_HTTP_SLI_ENABLED` | `false` | Enciende el middleware y el volcado a `time_series.service_sli_series` |
 * | `OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS` | `60` | Cada cuánto se vuelca lo agregado (10–3600) |
 *
 * Apagada por defecto a propósito: encenderla escribe en la base cada minuto, y
 * eso es una decisión del entorno, no un efecto secundario de arrancar la API
 * (el mismo criterio de `OTEL_ENABLED`, `telemetry.config.ts`).
 *
 * Un valor inválido **falla al arrancar** en vez de caer en el valor por
 * defecto: una medición que parece encendida y no lo está es peor que una caída
 * visible (regla 90.3 de la casa).
 */

export interface HttpSliEnv {
  readonly enabled: boolean;
  readonly flushSeconds: number;
}

export const HTTP_SLI_DEFAULT_FLUSH_SECONDS = 60;
export const HTTP_SLI_MIN_FLUSH_SECONDS = 10;
export const HTTP_SLI_MAX_FLUSH_SECONDS = 3600;

/**
 * Lee y valida la configuración.
 *
 * @param source - Variables de entorno; por defecto, las del proceso.
 * @throws Error si una variable tiene un valor que no se puede interpretar.
 */
export function loadHttpSliEnv(
  source: NodeJS.ProcessEnv = process.env,
): HttpSliEnv {
  const rawEnabled = (source.OBSERVABILITY_HTTP_SLI_ENABLED ?? '').trim();
  if (rawEnabled !== '' && rawEnabled !== 'true' && rawEnabled !== 'false') {
    throw new Error(
      `OBSERVABILITY_HTTP_SLI_ENABLED debe ser "true" o "false"; llegó "${rawEnabled}"`,
    );
  }

  const rawFlush = (source.OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS ?? '').trim();
  let flushSeconds = HTTP_SLI_DEFAULT_FLUSH_SECONDS;
  if (rawFlush !== '') {
    const parsed = Number(rawFlush);
    if (
      !Number.isInteger(parsed) ||
      parsed < HTTP_SLI_MIN_FLUSH_SECONDS ||
      parsed > HTTP_SLI_MAX_FLUSH_SECONDS
    ) {
      throw new Error(
        `OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS debe ser un entero entre ${HTTP_SLI_MIN_FLUSH_SECONDS} y ${HTTP_SLI_MAX_FLUSH_SECONDS}; llegó "${rawFlush}"`,
      );
    }
    flushSeconds = parsed;
  }

  return { enabled: rawEnabled === 'true', flushSeconds };
}
