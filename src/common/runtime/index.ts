/**
 * Garantías de ciclo de vida del proceso, compartidas por la API y los 20
 * workers.
 *
 * Las dos piezas cubren los dos extremos del mismo problema —que un proceso
 * termine de forma observable—: `installProcessGuards` para la muerte
 * imprevista (excepción no capturada, promesa rechazada sin manejador) y
 * `installShutdownWatchdog` para la prevista que se atasca (un `SIGTERM` cuyo
 * drenaje no vuelve).
 */

export {
  installProcessGuards,
  resetProcessGuardsForTests,
} from './process-guards';
export type { FatalLogger, ProcessGuardOptions } from './process-guards';

export {
  installShutdownWatchdog,
  resetShutdownWatchdogForTests,
} from './shutdown-watchdog';
export type { ShutdownWatchdogOptions } from './shutdown-watchdog';
