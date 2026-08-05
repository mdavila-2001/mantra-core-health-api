import { randomUUID } from 'node:crypto';
import type { PinoLogger } from 'nestjs-pino';
import { APP_ATTR, runInTracedSpan } from '../observability';

/**
 * Envuelve un tick de `@Cron`/`@Interval`. Un tick que lanza tumbaría el
 * scheduler entero de `@nestjs/schedule` (que no atrapa errores de las
 * funciones que registra) — un fallo transitorio de un job (p. ej. la API
 * caída un momento) no debe apagar a los demás jobs del mismo proceso.
 *
 * Es además el único punto por el que pasan los 30 jobs programados de los 20
 * workers, y por eso es donde nace la **traza raíz** de todo el trabajo
 * asíncrono del sistema: una traza nueva por ejecución, nunca un span de vida
 * infinita. Sin ella, la llamada HTTP que el tick hace a la API no tendría
 * contexto que propagar y el trabajo del worker aparecería en Jaeger como
 * peticiones sueltas sin origen.
 *
 * El nombre del span es el mismo `operation` que ya viaja en los logs, de modo
 * que buscar `worker.messaging.outbox-relay` devuelve lo mismo en el agregador
 * de logs y en el buscador de trazas.
 *
 * El contrato original se conserva: `runTick` registra el fallo y **no lo
 * propaga**.
 */
export async function runTick(
  logger: PinoLogger,
  operation: string,
  fn: () => Promise<void>,
): Promise<void> {
  await runInTracedSpan(
    operation,
    {
      [APP_ATTR.JOB_NAME]: operation,
      // Identifica esta ejecución concreta. Alta cardinalidad, permitida como
      // atributo: es lo que convierte "este job falla a veces" en "esta
      // ejecución falló, y aquí está su traza".
      [APP_ATTR.JOB_EXECUTION_ID]: randomUUID(),
    },
    async (span) => {
      try {
        await fn();
      } catch (error) {
        // El error se absorbe para no tumbar el scheduler, así que hay que
        // marcar la traza explícitamente: si no, el tick aparecería como
        // exitoso en Jaeger pese a haber fallado.
        span.recordException(error);
        logger.error({ operation, err: error }, 'Worker tick failed');
      }
    },
  );
}
