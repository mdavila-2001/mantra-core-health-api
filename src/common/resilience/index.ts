/**
 * Kernel de resiliencia: las primitivas con las que la API y los 20 workers se
 * protegen de sus dependencias.
 *
 * Son piezas **puras y sin dependencias de NestJS ni de terceros** a propósito:
 * las usan por igual un interceptor HTTP, un cliente axios y un tick de worker,
 * y varias de ellas (el registro de exclusión mutua, el cortacircuitos) se
 * construyen antes de que exista el contenedor de inyección. Todas aceptan un
 * reloj o una fuente de aleatoriedad inyectable, porque una primitiva de
 * resiliencia que no se puede probar de forma determinista no es una garantía,
 * es una esperanza.
 *
 * Cómo se combinan, de fuera hacia dentro:
 *
 * ```
 *   MutexRegistry        ¿ya hay uno igual corriendo?  → descartar
 *     └─ Bulkhead        ¿cuántos caben a la vez?      → rechazar si no cabe
 *         └─ CircuitBreaker  ¿está caído?              → rechazar sin llamar
 *             └─ retry       ¿el fallo se cura solo?   → reintentar con jitter
 *                 └─ withTimeout  ¿tarda demasiado?    → abortar de verdad
 *                     └─ la llamada real
 * ```
 *
 * El orden importa: el cortacircuitos va **por fuera** del reintento para que
 * un circuito abierto corte la escalera entera de intentos, y el plazo va por
 * dentro para que se aplique a cada intento y no al conjunto.
 */

export {
  OperationTimeoutError,
  CircuitOpenError,
  BulkheadFullError,
} from './resilience.errors';

export {
  isTransientError,
  retryAfterFromError,
  httpStatusOf,
  networkCodeOf,
} from './transient-error';

export { withTimeout, delay } from './with-timeout';

export { retry, DEFAULT_RETRY_POLICY } from './retry';
export type { RetryPolicy, RetryAttemptInfo, RetryClock } from './retry';

export { CircuitBreaker } from './circuit-breaker';
export type {
  CircuitState,
  CircuitBreakerOptions,
  CircuitStateChange,
  CircuitSnapshot,
} from './circuit-breaker';

export { Bulkhead } from './bulkhead';
export type { BulkheadOptions, BulkheadSnapshot } from './bulkhead';

export { MutexRegistry } from './mutex-registry';
export type { ExclusiveOutcome, MutexSnapshot } from './mutex-registry';
