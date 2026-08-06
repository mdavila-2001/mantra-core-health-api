import type { FatalLogger } from './process-guards';

/**
 * Vigilante del apagado: garantiza que un `SIGTERM` termine, pase lo que pase.
 *
 * `app.enableShutdownHooks()` hace que NestJS drene y cierre sus dependencias
 * al recibir la señal, que es lo correcto. Lo que no hace es acotar cuánto
 * puede tardar en hacerlo. Si un `onModuleDestroy` se queda esperando —una
 * conexión de MikroORM con una consulta en vuelo, un socket de Redis que no
 * responde, un tick de worker que no vuelve— el proceso se queda a medio
 * apagar, sin atender tráfico y sin terminar.
 *
 * Ese estado es especialmente dañino durante un despliegue: el orquestador ya
 * sacó la instancia del balanceo y espera su confirmación de salida. Docker
 * manda `SIGKILL` a los 10 s por defecto; Kubernetes, al agotarse
 * `terminationGracePeriodSeconds`. En ambos casos el proceso muere sin dejar
 * dicho **qué** lo estaba bloqueando, y el mismo despliegue vuelve a colgarse
 * la próxima vez sin que nadie sepa dónde mirar.
 *
 * Este vigilante no acelera el apagado ni compite con NestJS: arma un plazo, y
 * si se agota registra **qué seguía pendiente** y sale con código 1. La
 * diferencia entre un `SIGKILL` mudo y una línea de log que nombra el recurso
 * atascado es toda la diferencia a la hora de arreglarlo.
 */

/** Señales de terminación; las mismas que atiende NestJS. */
const SIGNALS: readonly NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

export interface ShutdownWatchdogOptions {
  logger: FatalLogger;
  processName: string;
  /** Plazo máximo del apagado. Debe ser menor que el del orquestador. */
  timeoutMs: number;
  /**
   * Describe qué sigue pendiente cuando vence el plazo (ticks en vuelo,
   * peticiones sin terminar). Es lo único que hace útil al log de la salida
   * forzada.
   */
  describePending?: () => Record<string, unknown>;
  exit?: (code: number) => void;
}

let armed = false;

/**
 * Arma el vigilante. Idempotente.
 *
 * @returns función que lo desarma; sólo la usan las pruebas.
 */
export function installShutdownWatchdog(
  options: ShutdownWatchdogOptions,
): () => void {
  if (armed) return () => undefined;
  armed = true;

  const exit = options.exit ?? ((code: number) => process.exit(code));
  let timer: NodeJS.Timeout | undefined;

  const onSignal = (signal: NodeJS.Signals): void => {
    if (timer) return;

    timer = setTimeout(() => {
      options.logger.fatal(
        {
          processName: options.processName,
          signal,
          timeoutMs: options.timeoutMs,
          pending: options.describePending?.() ?? {},
        },
        'El apagado excedió su plazo: se fuerza la salida',
      );
      exit(1);
    }, options.timeoutMs);

    // `unref` es la clave de que esto no cambie el comportamiento normal: si el
    // apagado termina a tiempo, este temporizador no es motivo para que el
    // proceso siga vivo, y la salida ocurre igual de rápido que sin vigilante.
    timer.unref?.();
  };

  const handlers = SIGNALS.map((signal) => {
    const handler = () => onSignal(signal);
    process.on(signal, handler);
    return { signal, handler };
  });

  return () => {
    if (timer) clearTimeout(timer);
    for (const { signal, handler } of handlers) {
      process.off(signal, handler);
    }
    armed = false;
  };
}

/** Restablece el estado interno. Sólo para pruebas. */
export function resetShutdownWatchdogForTests(): void {
  armed = false;
}
