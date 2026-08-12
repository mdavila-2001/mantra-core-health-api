/**
 * Cadencia de los dos ticks del worker de audio.
 *
 * Son constantes de módulo, como en los otros 30 jobs, porque `@Interval(...)` es
 * un decorador: su argumento se evalúa cuando se **carga la clase**, mucho antes
 * de que exista el contenedor de inyección, así que no puede venir de un servicio
 * de configuración. Se leen del entorno con un valor por defecto y sin depender de
 * que `ConfigModule` haya escrito ya sus defaults en `process.env`.
 *
 * El resto de la configuración del dominio sí pasa por `AUDIO_TTS_CONFIG` y su
 * validación cruzada; estos dos valores son la excepción que impone el decorador,
 * y por eso se acotan aquí a un rango sensato: un intervalo de 0 convertiría el
 * tick en un bucle ocupado, y uno de horas dejaría el audio sin generar.
 */

function intervalFromEnv(
  name: string,
  fallbackMs: number,
  minMs: number,
  maxMs: number,
): number {
  const parsed = Number(process.env[name]);
  if (!Number.isFinite(parsed)) return fallbackMs;
  return Math.min(maxMs, Math.max(minMs, Math.trunc(parsed)));
}

/** Cada cuánto se reclama un lote de generación. */
export const AUDIO_GENERATION_INTERVAL_MS = intervalFromEnv(
  'AUDIO_GENERATION_INTERVAL_MS',
  5000,
  1000,
  600_000,
);

/** Cada cuánto corre el barrido de agotados y la retención del cupo por actor. */
export const AUDIO_RECONCILE_INTERVAL_MS = intervalFromEnv(
  'AUDIO_RECONCILE_INTERVAL_MS',
  300_000,
  10_000,
  86_400_000,
);
