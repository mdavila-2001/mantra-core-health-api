/**
 * Red de seguridad a nivel de proceso, común a la API y a los 20 workers.
 *
 * Node ya termina el proceso ante una excepción no capturada o una promesa
 * rechazada sin manejador, así que la tentación es no hacer nada. El problema
 * no es que el proceso muera —eso está bien, el estado ya no es de fiar— sino
 * **cómo** muere: el volcado por defecto va a `stderr` sin estructura, el
 * agregador de logs lo indexa como texto suelto sin `trace_id` ni servicio, y
 * los spans que quedaban en el búfer del exportador se pierden. El resultado es
 * el peor de los casos para un incidente: un contenedor que se reinicia en
 * bucle y ninguna traza que explique por qué.
 *
 * Estos manejadores no evitan la muerte del proceso. La documentan.
 *
 * Sobre no seguir vivo tras un `uncaughtException`: continuar significa operar
 * con invariantes rotas —una transacción a medio confirmar, un lock retenido,
 * un búfer parcialmente escrito— y en un backend clínico eso es peor que
 * reiniciar. El orquestador sabe reiniciar; nadie sabe reparar un estado
 * desconocido en caliente.
 */

/** Contrato mínimo de logger; evita acoplar esto a `nestjs-pino`. */
export interface FatalLogger {
  fatal: (context: Record<string, unknown>, message: string) => void;
  warn: (context: Record<string, unknown>, message: string) => void;
}

export interface ProcessGuardOptions {
  logger: FatalLogger;
  /** Nombre del proceso (`api`, `worker-messaging`), para el log. */
  processName: string;
  /**
   * Se invoca antes de terminar, para vaciar lo que esté en búfer (los spans
   * del exportador, sobre todo). Se le da `flushTimeoutMs` y ni un ms más: un
   * vaciado que se cuelga convertiría una caída limpia en un proceso zombi.
   */
  onFatal?: () => Promise<void>;
  /** Plazo máximo del vaciado previo a la salida. */
  flushTimeoutMs?: number;
  /** Salida real del proceso; se inyecta para poder probarlo. */
  exit?: (code: number) => void;
}

const DEFAULT_FLUSH_TIMEOUT_MS = 3_000;

/** Evita registrar los manejadores dos veces si el arranque se reevalúa. */
let installed = false;
/** Un segundo fallo durante el vaciado no debe reentrar en el mismo camino. */
let terminating = false;

/**
 * Instala los manejadores de fallo terminal. Idempotente.
 *
 * @returns función que los desinstala; sólo la usan las pruebas.
 */
export function installProcessGuards(options: ProcessGuardOptions): () => void {
  if (installed) return () => undefined;
  installed = true;

  const exit = options.exit ?? ((code: number) => process.exit(code));
  const flushTimeoutMs = options.flushTimeoutMs ?? DEFAULT_FLUSH_TIMEOUT_MS;

  const terminate = (
    reason: 'uncaughtException' | 'unhandledRejection',
    error: unknown,
  ): void => {
    if (terminating) return;
    terminating = true;

    options.logger.fatal(
      {
        err: error,
        reason,
        processName: options.processName,
        pid: process.pid,
      },
      reason === 'uncaughtException'
        ? 'Excepción no capturada: el proceso termina con estado desconocido'
        : 'Promesa rechazada sin manejador: el proceso termina con estado desconocido',
    );

    // El vaciado corre con su propio plazo. `Promise.race` basta aquí —a
    // diferencia del caso general, donde dejar viva a la perdedora es un fuga—
    // porque el proceso termina justo después: no queda nadie a quien filtrarle
    // nada.
    const flush = options.onFatal?.() ?? Promise.resolve();
    const deadline = new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, flushTimeoutMs);
      timer.unref?.();
    });

    void Promise.race([flush.catch(() => undefined), deadline]).finally(() => {
      exit(1);
    });
  };

  const onUncaught = (error: Error): void => {
    terminate('uncaughtException', error);
  };

  const onUnhandled = (reason: unknown): void => {
    terminate('unhandledRejection', reason);
  };

  /**
   * Los avisos de Node que sí importan. `MaxListenersExceededWarning` es la
   * huella clásica de una fuga de listeners —se registra un manejador por
   * petición y nunca se quita—, y sin este puente sale por `stderr` sin
   * estructura y nadie lo ve hasta que el proceso ocupa 4 GB.
   */
  const onWarning = (warning: Error): void => {
    options.logger.warn(
      {
        err: warning,
        warningName: warning.name,
        processName: options.processName,
      },
      'Aviso del runtime de Node',
    );
  };

  process.on('uncaughtException', onUncaught);
  process.on('unhandledRejection', onUnhandled);
  process.on('warning', onWarning);

  return () => {
    process.off('uncaughtException', onUncaught);
    process.off('unhandledRejection', onUnhandled);
    process.off('warning', onWarning);
    installed = false;
    terminating = false;
  };
}

/** Restablece el estado interno. Sólo para pruebas. */
export function resetProcessGuardsForTests(): void {
  installed = false;
  terminating = false;
}
