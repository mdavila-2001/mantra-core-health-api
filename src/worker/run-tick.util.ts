import { randomUUID } from 'node:crypto';
import type { PinoLogger } from 'nestjs-pino';
import { APP_ATTR, runInTracedSpan } from '../observability';
import { OperationTimeoutError, withTimeout } from '../common/resilience';
import { currentTick, runWithTickContext } from './tick-context';
import { workerHealth } from './worker-health.registry';

/**
 * Plazo por defecto de un tick programado. Generoso a propósito: los ticks van
 * desde el relevo del outbox (subsegundo) hasta comprimir chunks de
 * `time_series` (minutos). No es el plazo de una llamada —de eso se ocupa el
 * cliente HTTP— sino el techo tras el cual una ejecución se declara perdida.
 */
const DEFAULT_TICK_TIMEOUT_MS = 5 * 60_000;

/** Configuración del envoltorio, fijada una vez en el arranque del worker. */
let tickTimeoutMs = DEFAULT_TICK_TIMEOUT_MS;
/** Cuando el proceso está drenando, no se admiten ticks nuevos. */
let draining = false;

/** Fija el plazo de los ticks. Lo llama `bootstrapWorker` desde el entorno. */
export function configureTicks(timeoutMs: number): void {
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    tickTimeoutMs = timeoutMs;
  }
}

/**
 * Deja de admitir ticks nuevos. A partir de aquí `runTick` devuelve sin hacer
 * nada, y los ticks en vuelo terminan solos: es lo que convierte un `SIGTERM`
 * en un apagado ordenado en vez de en un trabajo cortado por la mitad.
 *
 * Sólo frena los ticks **raíz**. Un tick que ya empezó conserva el derecho a
 * terminar su lote entero, incluidas sus operaciones por elemento: cortarlo a
 * la mitad es justo el estado parcial que el drenaje existe para evitar.
 */
export function startDraining(): void {
  draining = true;
}

/** Vuelve a admitir ticks. Sólo para pruebas. */
export function resetTickStateForTests(): void {
  draining = false;
  tickTimeoutMs = DEFAULT_TICK_TIMEOUT_MS;
  workerHealth.reset();
}

/**
 * Envuelve el trabajo de un job de worker. Es el único punto por el que pasan
 * los 30 jobs programados de los 20 workers, y por eso concentra las garantías
 * que ninguno implementa por su cuenta.
 *
 * Tiene **dos modos**, y distinguirlos no es un detalle: cinco jobs
 * (`expire-points`, `promote-waitlist`, `embedding-drain`, `release-expiry`,
 * `reconciliation`, …) llaman a `runTick` *dentro* de otro `runTick`, a veces
 * con el mismo nombre de operación, para que el fallo de un elemento no aborte
 * el lote. Tratar esas llamadas anidadas como ticks programados las habría
 * bloqueado entre sí y el trabajo por elemento habría dejado de ejecutarse.
 *
 * **Modo raíz** (no hay tick activo) — es un tick programado:
 *
 *   1. *No se solapa consigo mismo.* `@Interval` es un `setInterval`, y
 *      `setInterval` no espera a que termine la ejecución anterior. Si el relevo
 *      del outbox (cada 5 s) tarda 30 s porque la API va lenta, a los 30 s hay
 *      seis copias del mismo tick operando sobre las mismas filas:
 *      procesamiento duplicado, contención y una pila que crece mientras dure la
 *      degradación. La ejecución solapada se **descarta** —encolarla
 *      garantizaría que la cola crezca al ritmo de la lentitud— y se cuenta como
 *      `skipped`, que es la señal de que el intervalo del job está mal
 *      dimensionado.
 *   2. *Tiene plazo, y el plazo cancela de verdad.* El contexto de tick lleva un
 *      `AbortSignal` que `SystemApiClient` propaga a axios: vencer el plazo
 *      aborta el socket en vez de sólo dejar de mirarlo.
 *   3. *Se observa.* Cada ejecución alimenta `workerHealth`, que convierte "el
 *      proceso está vivo" en "el proceso está haciendo su trabajo". Un tick que
 *      no vuelve deja de ser invisible: pasado el umbral, la liveness falla y el
 *      orquestador reinicia el proceso — el único remedio real para un bloqueo
 *      que no se puede cancelar desde dentro.
 *
 * **Modo anidado** (ya hay un tick activo) — es una unidad de trabajo dentro del
 * lote: hereda el plazo y la señal del tick que la engloba, abre su propio span
 * hijo y absorbe su error. Sin exclusión mutua propia, que es lo que la haría
 * bloquearse contra su padre.
 *
 * En los dos modos se conserva el contrato original: `runTick` registra el fallo
 * y **no lo propaga**. Un tick que lanza tumbaría el scheduler entero de
 * `@nestjs/schedule`, que no atrapa los errores de las funciones que registra.
 */
export async function runTick(
  logger: PinoLogger,
  operation: string,
  fn: () => Promise<void>,
): Promise<void> {
  if (currentTick()) {
    await runNestedUnit(logger, operation, fn);
    return;
  }

  if (draining) {
    logger.debug(
      { operation },
      'Tick omitido: el worker está drenando para apagarse',
    );
    return;
  }

  const outcome = await workerHealth.mutex.runExclusive(operation, () =>
    runRootTick(logger, operation, fn),
  );

  if (!outcome.ran) {
    // Un solapamiento no es un error del que alarmarse la primera vez, pero sí
    // un hecho que debe quedar registrado: si se repite, el intervalo del job
    // está por debajo de lo que el trabajo tarda de verdad.
    workerHealth.tickSkipped(operation);
    logger.warn(
      { operation, heldForMs: outcome.heldForMs },
      'Tick omitido: la ejecución anterior sigue en vuelo',
    );
  }
}

/** Tick programado: traza raíz, plazo propio y contabilidad de salud. */
async function runRootTick(
  logger: PinoLogger,
  operation: string,
  fn: () => Promise<void>,
): Promise<void> {
  const executionId = randomUUID();

  await runInTracedSpan(
    operation,
    {
      [APP_ATTR.JOB_NAME]: operation,
      // Identifica esta ejecución concreta. Alta cardinalidad, permitida como
      // atributo: es lo que convierte "este job falla a veces" en "esta
      // ejecución falló, y aquí está su traza".
      [APP_ATTR.JOB_EXECUTION_ID]: executionId,
    },
    async (span) => {
      workerHealth.tickStarted(operation);
      const startedAt = Date.now();

      try {
        await withTimeout(operation, tickTimeoutMs, (signal) =>
          runWithTickContext(
            {
              operation,
              executionId,
              signal,
              deadlineAt: startedAt + tickTimeoutMs,
            },
            fn,
          ),
        );
        workerHealth.tickFinished(operation, 'ok');
      } catch (error) {
        const timedOut = error instanceof OperationTimeoutError;
        workerHealth.tickFinished(
          operation,
          timedOut ? 'timeout' : 'failed',
          error,
        );

        // El error se absorbe para no tumbar el scheduler, así que hay que
        // marcar la traza explícitamente: si no, el tick aparecería como
        // exitoso en Jaeger pese a haber fallado.
        span.recordException(error);
        logger.error(
          { operation, executionId, timedOut, err: error },
          timedOut ? 'Worker tick timed out' : 'Worker tick failed',
        );
      }
    },
  );
}

/**
 * Unidad de trabajo dentro de un tick ya en marcha.
 *
 * Deliberadamente **no** toca `workerHealth`: el estado de salud describe ticks
 * programados, y varias de estas llamadas comparten nombre con el tick que las
 * engloba. Contarlas ahí mezclaría "el lote corrió" con "el elemento 7 del lote
 * falló" en el mismo contador y dejaría el registro sin significado. El fallo
 * del elemento queda en su span y en el log, que es donde se diagnostica.
 */
async function runNestedUnit(
  logger: PinoLogger,
  operation: string,
  fn: () => Promise<void>,
): Promise<void> {
  await runInTracedSpan(
    operation,
    { [APP_ATTR.JOB_NAME]: operation },
    async (span) => {
      try {
        await fn();
      } catch (error) {
        span.recordException(error);
        logger.error(
          { operation, parentTick: currentTick()?.operation, err: error },
          'Worker tick unit failed',
        );
      }
    },
  );
}
