import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Contexto ambiental del tick en ejecución.
 *
 * Existe para resolver un problema de propagación: el plazo de un tick sólo
 * sirve de algo si llega hasta la llamada que de verdad bloquea —el `POST` a la
 * API—, y los 30 jobs reciben su trabajo como `() => Promise<void>` sin ningún
 * parámetro. Cambiar esa firma obligaría a tocar los 30 jobs y a que cada uno
 * enhebrara la señal a mano hasta cada llamada: mucho ruido y un olvido
 * garantizado.
 *
 * `AsyncLocalStorage` propaga el contexto por la cadena asíncrona sin tocar
 * ninguna firma: `runTick` lo abre, `SystemApiClient` lo lee. Es el mismo
 * mecanismo con el que ya viaja el tenant (`common/tenant/tenant-context.ts`).
 *
 * Fuera de un tick (la API HTTP, una prueba) `currentTick()` devuelve
 * `undefined` y todo funciona igual, sin plazo ambiental.
 */

export interface TickContext {
  /** Nombre de la operación, el mismo que viaja en logs y en el span. */
  operation: string;
  /** Identificador único de esta ejecución concreta. */
  executionId: string;
  /**
   * Señal del plazo del tick. Abortarla cancela de verdad lo que esté en vuelo
   * (axios la acepta como `signal`), en vez de sólo dejar de esperarlo.
   */
  signal: AbortSignal;
  /** Instante límite del tick, en epoch ms. */
  deadlineAt: number;
}

const storage = new AsyncLocalStorage<TickContext>();

/** Ejecuta `fn` con el contexto de tick activo. */
export function runWithTickContext<T>(
  context: TickContext,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(context, fn);
}

/** Contexto del tick actual, o `undefined` fuera de todo tick. */
export function currentTick(): TickContext | undefined {
  return storage.getStore();
}

/**
 * Presupuesto de tiempo que le queda al tick, en ms.
 *
 * Lo consume el cliente HTTP para no lanzar una llamada con un plazo de 30 s
 * cuando al tick le quedan 2: sin este recorte, el plazo del tick vencería
 * mientras la llamada sigue esperando el suyo, y el aborto llegaría igual pero
 * después de haber ocupado un socket para nada.
 */
export function remainingTickBudgetMs(
  now: number = Date.now(),
): number | undefined {
  const context = storage.getStore();
  if (!context) return undefined;
  return Math.max(0, context.deadlineAt - now);
}
