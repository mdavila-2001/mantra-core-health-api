import type { PinoLogger } from 'nestjs-pino';

/**
 * Envuelve un tick de `@Cron`/`@Interval`. Un tick que lanza tumbaría el
 * scheduler entero de `@nestjs/schedule` (que no atrapa errores de las
 * funciones que registra) — un fallo transitorio de un job (p. ej. la API
 * caída un momento) no debe apagar a los demás jobs del mismo proceso.
 */
export async function runTick(
  logger: PinoLogger,
  operation: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logger.error({ operation, err: error }, 'Worker tick failed');
  }
}
