import { diag } from '@opentelemetry/api';

/**
 * Cierre limpio del SDK de OpenTelemetry.
 *
 * Sin esto, los spans que quedan en el búfer del `BatchSpanProcessor` cuando
 * llega un `docker stop` se pierden — justo los de la última operación, que
 * suele ser la que se está investigando. `shutdown()` fuerza el vaciado y cierra
 * el exportador.
 *
 * Regla estricta: este módulo **no llama a `process.exit`**. `main.ts` ya
 * registra `app.enableShutdownHooks()` y el proceso debe drenar las peticiones
 * en vuelo y cerrar sus conexiones (MikroORM, Redis) por su cuenta; terminar el
 * proceso desde la capa de telemetría cortaría ese drenaje en seco.
 */

/** Señales que disparan el cierre. Las mismas que atiende NestJS. */
const SHUTDOWN_SIGNALS: readonly NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

/** Contrato mínimo que necesita este módulo del SDK. */
export interface ShutdownableSdk {
  shutdown(): Promise<void>;
}

/** Evita registrar los manejadores dos veces si el bootstrap se reevalúa. */
let hooksRegistered = false;

/** Evita ejecutar el cierre dos veces (p. ej. SIGINT seguido de SIGTERM). */
let shutdownStarted = false;

/**
 * Cierra el SDK vaciando lo que quede en el búfer, sin propagar errores.
 *
 * Un fallo al exportar el último lote no debe impedir que el proceso termine ni
 * generar un error no capturado durante el apagado: se registra por el canal de
 * diagnóstico del propio SDK y se continúa.
 */
export async function shutdownTelemetry(sdk: ShutdownableSdk): Promise<void> {
  if (shutdownStarted) return;
  shutdownStarted = true;

  try {
    await sdk.shutdown();
  } catch (error) {
    diag.error(
      'Fallo al cerrar el SDK de OpenTelemetry',
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Engancha el cierre del SDK a las señales de terminación.
 *
 * Usa `process.on` (no `removeAllListeners`) para sumarse a los manejadores que
 * NestJS ya registró, no para reemplazarlos.
 */
export function registerTelemetryShutdown(sdk: ShutdownableSdk): void {
  if (hooksRegistered) return;
  hooksRegistered = true;

  for (const signal of SHUTDOWN_SIGNALS) {
    process.on(signal, () => {
      void shutdownTelemetry(sdk);
    });
  }
}

/** Restablece el estado interno. Solo para pruebas. */
export function resetShutdownStateForTests(): void {
  hooksRegistered = false;
  shutdownStarted = false;
}
