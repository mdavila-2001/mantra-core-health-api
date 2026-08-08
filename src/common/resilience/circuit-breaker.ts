import { CircuitOpenError } from './resilience.errors';
import { isTransientError } from './transient-error';

/**
 * Cortacircuitos: deja de llamar a una dependencia que ya demostró estar caída.
 *
 * El fallo que previene no es "la llamada falla" —eso ya pasa— sino la **cascada**:
 * mientras la dependencia está caída, cada llamada consume un socket, un hilo del
 * pool y el plazo completo del timeout antes de fallar. Con 20 workers y 30 jobs
 * llamando cada pocos segundos, un minuto de caída de la API se traduce en miles
 * de conexiones colgadas y en un proceso que se queda sin descriptores de fichero
 * mucho antes de que la dependencia vuelva. Fallar rápido y barato es lo que
 * mantiene sano al llamador mientras el llamado se recupera.
 *
 * Ventana **por conteo** y no por tiempo: los ticks de los workers son
 * esporádicos (uno cada 5–300 s), y una ventana temporal de 60 s se vaciaría
 * entre tick y tick sin llegar a acumular evidencia. Contando las últimas N
 * llamadas, la decisión no depende de la frecuencia del llamador.
 *
 * Estados:
 *   - `closed`   — pasa todo; se cuenta el resultado.
 *   - `open`     — rechaza sin llamar; tras `openDurationMs` pasa a `half-open`.
 *   - `half-open`— deja pasar **una sola** llamada de prueba. Si va bien, cierra
 *                  y limpia la ventana; si va mal, vuelve a abrir con el plazo
 *                  duplicado (hasta el techo), para no sondear cada pocos
 *                  segundos una dependencia que lleva media hora caída.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Nombre de la dependencia protegida; aparece en errores, logs y métricas. */
  operation: string;
  /** Tamaño de la ventana deslizante de resultados. */
  windowSize?: number;
  /** Llamadas mínimas en la ventana antes de poder abrir. */
  minimumThroughput?: number;
  /** Proporción de fallos (0..1) a partir de la cual se abre. */
  failureRateThreshold?: number;
  /** Tiempo en `open` antes del primer sondeo. */
  openDurationMs?: number;
  /** Techo del plazo de apertura tras sondeos fallidos consecutivos. */
  maxOpenDurationMs?: number;
  /**
   * Qué cuenta como fallo. Por defecto **sólo los errores transitorios**: un
   * `404` o un `422` son respuestas correctas de una dependencia sana y abrir
   * el circuito por ellos dejaría fuera de servicio a un sistema que funciona.
   */
  isFailure?: (error: unknown) => boolean;
  /** Gancho de observabilidad para cada transición de estado. */
  onStateChange?: (change: CircuitStateChange) => void;
  /** Reloj inyectable; sólo lo sustituyen las pruebas. */
  now?: () => number;
}

export interface CircuitStateChange {
  operation: string;
  from: CircuitState;
  to: CircuitState;
  /** Proporción de fallos observada al decidir la transición. */
  failureRate: number;
  /** Plazo de apertura aplicado, cuando la transición es hacia `open`. */
  openForMs?: number;
}

/** Estado observable del cortacircuitos, para `/status` y métricas. */
export interface CircuitSnapshot {
  operation: string;
  state: CircuitState;
  failureRate: number;
  samples: number;
  consecutiveOpenings: number;
  /** ms que faltan para el próximo sondeo; `0` si no está abierto. */
  retryAfterMs: number;
}

const DEFAULTS = {
  windowSize: 20,
  minimumThroughput: 5,
  failureRateThreshold: 0.5,
  openDurationMs: 30_000,
  maxOpenDurationMs: 5 * 60_000,
};

export class CircuitBreaker {
  private readonly options: Required<
    Omit<CircuitBreakerOptions, 'onStateChange'>
  > & {
    onStateChange?: (change: CircuitStateChange) => void;
  };

  /** Ventana deslizante: `true` = fallo. Se recorta a `windowSize`. */
  private readonly window: boolean[] = [];

  private state: CircuitState = 'closed';
  /** Instante a partir del cual se permite el sondeo de media apertura. */
  private openUntil = 0;
  /** Aperturas encadenadas sin un cierre exitoso; alimenta el backoff. */
  private consecutiveOpenings = 0;
  /** Evita que dos llamadas simultáneas entren a la vez como sondeo. */
  private probeInFlight = false;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      operation: options.operation,
      windowSize: options.windowSize ?? DEFAULTS.windowSize,
      minimumThroughput:
        options.minimumThroughput ?? DEFAULTS.minimumThroughput,
      failureRateThreshold:
        options.failureRateThreshold ?? DEFAULTS.failureRateThreshold,
      openDurationMs: options.openDurationMs ?? DEFAULTS.openDurationMs,
      maxOpenDurationMs:
        options.maxOpenDurationMs ?? DEFAULTS.maxOpenDurationMs,
      isFailure: options.isFailure ?? isTransientError,
      now: options.now ?? (() => Date.now()),
      onStateChange: options.onStateChange,
    };
  }

  /**
   * Ejecuta `fn` bajo la protección del cortacircuitos.
   *
   * @throws {CircuitOpenError} si el circuito está abierto o ya hay un sondeo
   *         en vuelo. Es un rechazo inmediato y sin coste, que es justo el
   *         punto: no consume socket, ni plazo, ni capacidad de la dependencia.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const permitted = this.tryAcquire();
    if (!permitted) {
      throw new CircuitOpenError(this.options.operation, this.retryAfterMs());
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      // Sólo los fallos que `isFailure` reconoce cuentan para abrir. Un error
      // de negocio se propaga tal cual sin ensuciar la ventana, pero sí libera
      // el permiso de sondeo: la dependencia respondió, luego está viva.
      if (this.options.isFailure(error)) {
        this.onFailure();
      } else {
        this.onSuccess();
      }
      throw error;
    }
  }

  /** Estado observable; lo consumen la sonda de salud y las métricas. */
  snapshot(): CircuitSnapshot {
    return {
      operation: this.options.operation,
      state: this.currentState(),
      failureRate: this.failureRate(),
      samples: this.window.length,
      consecutiveOpenings: this.consecutiveOpenings,
      retryAfterMs: this.retryAfterMs(),
    };
  }

  /** Vuelve al estado inicial. Para pruebas y para un reinicio manual operado. */
  reset(): void {
    this.window.length = 0;
    this.state = 'closed';
    this.openUntil = 0;
    this.consecutiveOpenings = 0;
    this.probeInFlight = false;
  }

  /**
   * Estado efectivo, resolviendo la transición `open` → `half-open` por tiempo.
   * Se calcula al leer y no con un temporizador: un `setTimeout` por circuito
   * sería un temporizador huérfano más que mantener vivo el event loop.
   */
  private currentState(): CircuitState {
    if (this.state === 'open' && this.options.now() >= this.openUntil) {
      return 'half-open';
    }
    return this.state;
  }

  private retryAfterMs(): number {
    if (this.state !== 'open') return 0;
    return Math.max(0, this.openUntil - this.options.now());
  }

  private tryAcquire(): boolean {
    const state = this.currentState();

    if (state === 'closed') return true;

    if (state === 'half-open') {
      // Un único sondeo a la vez. Sin esta guarda, al vencer el plazo entrarían
      // de golpe todas las llamadas represadas y volverían a tumbar la
      // dependencia que acababa de levantarse.
      if (this.probeInFlight) return false;
      this.transitionTo('half-open');
      this.probeInFlight = true;
      return true;
    }

    return false;
  }

  private onSuccess(): void {
    const wasProbing = this.state === 'half-open';
    this.probeInFlight = false;
    this.record(false);

    if (wasProbing) {
      // El sondeo salió bien: la ventana anterior describe un mundo que ya no
      // existe. Limpiarla evita que los fallos viejos vuelvan a abrir el
      // circuito en la siguiente llamada.
      this.window.length = 0;
      this.consecutiveOpenings = 0;
      this.transitionTo('closed');
    }
  }

  private onFailure(): void {
    const wasProbing = this.state === 'half-open';
    this.probeInFlight = false;
    this.record(true);

    if (wasProbing) {
      this.open();
      return;
    }

    if (
      this.window.length >= this.options.minimumThroughput &&
      this.failureRate() >= this.options.failureRateThreshold
    ) {
      this.open();
    }
  }

  private open(): void {
    // Backoff exponencial del propio circuito: 30 s, 60 s, 120 s… hasta el
    // techo. Una dependencia con una caída larga no debe recibir un sondeo cada
    // 30 s indefinidamente.
    const backoff = this.options.openDurationMs * 2 ** this.consecutiveOpenings;
    const openForMs = Math.min(backoff, this.options.maxOpenDurationMs);

    this.consecutiveOpenings += 1;
    this.openUntil = this.options.now() + openForMs;
    this.transitionTo('open', openForMs);
  }

  private record(failed: boolean): void {
    this.window.push(failed);
    if (this.window.length > this.options.windowSize) {
      this.window.shift();
    }
  }

  private failureRate(): number {
    if (this.window.length === 0) return 0;
    const failures = this.window.reduce(
      (total, failed) => total + (failed ? 1 : 0),
      0,
    );
    return failures / this.window.length;
  }

  private transitionTo(to: CircuitState, openForMs?: number): void {
    const from = this.state;
    if (from === to) return;
    this.state = to;
    this.options.onStateChange?.({
      operation: this.options.operation,
      from,
      to,
      failureRate: this.failureRate(),
      openForMs,
    });
  }
}
