import { MutexRegistry } from '../common/resilience';
import type { CircuitSnapshot } from '../common/resilience';

/**
 * Estado de salud del proceso worker, alimentado por los propios ticks.
 *
 * Antes de esto, un worker sólo tenía dos estados observables desde fuera:
 * "el proceso existe" y "el proceso no existe". Los tres modos de fallo que
 * más duelen caen entre medias y ninguno se veía:
 *
 *   1. **Worker zombi** — el proceso vive, el event loop responde, pero el tick
 *      lleva 40 minutos colgado en una llamada que nunca vuelve. Sin este
 *      registro, `docker ps` dice `Up 3 hours` y nadie se entera hasta que
 *      alguien pregunta por qué no se envían recordatorios.
 *   2. **Solapamiento** — el tick tarda más que su intervalo y se apilan
 *      copias. Se cuenta como `skipped`: si ese contador sube, el intervalo del
 *      job está mal dimensionado y hay evidencia para cambiarlo.
 *   3. **Fallo persistente** — el tick corre puntual y falla siempre. Se
 *      distingue del transitorio por `consecutiveFailures`.
 *
 * El registro es deliberadamente **por proceso y en memoria**: describe la
 * salud de *este* worker para que el orquestador decida si reiniciarlo. La
 * visión agregada de la flota la da la telemetría, no esto.
 */

export type TickOutcome = 'ok' | 'failed' | 'timeout' | 'skipped';

/** Estado acumulado de una operación programada. */
export interface TickHealth {
  operation: string;
  /** Instante de inicio si hay una ejecución en vuelo. */
  inFlightSince?: number;
  lastStartedAt?: number;
  lastFinishedAt?: number;
  lastDurationMs?: number;
  lastOutcome?: TickOutcome;
  /** Mensaje del último fallo, recortado. Para el diagnóstico de un vistazo. */
  lastError?: string;
  runs: number;
  failures: number;
  timeouts: number;
  /** Ejecuciones descartadas porque la anterior seguía en vuelo. */
  skipped: number;
  consecutiveFailures: number;
}

/** Veredicto de una sonda, con el porqué. */
export interface ProbeResult {
  healthy: boolean;
  reasons: string[];
}

/** Fotografía completa; es el cuerpo de `GET /status` del worker. */
export interface WorkerHealthSnapshot {
  worker: string;
  pid: number;
  status: 'starting' | 'running' | 'draining' | 'stopped';
  uptimeMs: number;
  startedAt: string;
  ticks: TickHealth[];
  circuits: CircuitSnapshot[];
  memory: {
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
  };
  liveness: ProbeResult;
  readiness: ProbeResult;
}

/** Longitud máxima del resumen de error, incluido el carácter de elisión. */
const ERROR_SUMMARY_MAX = 300;

/**
 * Recorta el mensaje de error para que un stack no inunde la respuesta.
 *
 * Sólo se leen las dos formas de las que se puede sacar texto útil. Un
 * `String(objeto)` daría `[object Object]`, que ocupa el sitio del diagnóstico
 * sin aportar ninguno — peor que decir abiertamente que no se conoce la causa.
 */
function summarizeError(error: unknown): string {
  let text: string;
  if (error instanceof Error) {
    text = error.message;
  } else if (typeof error === 'string') {
    text = error;
  } else {
    text = 'error desconocido';
  }

  return text.length > ERROR_SUMMARY_MAX
    ? `${text.slice(0, ERROR_SUMMARY_MAX - 1)}…`
    : text;
}

export class WorkerHealthRegistry {
  /** Exclusión mutua de ticks; también es la fuente de "qué hay en vuelo". */
  readonly mutex: MutexRegistry;

  private readonly ticks = new Map<string, TickHealth>();
  private readonly circuits = new Map<string, () => CircuitSnapshot>();
  private readonly startedAt: number;
  private status: WorkerHealthSnapshot['status'] = 'starting';
  private workerName = 'unknown';

  /**
   * Umbral a partir del cual un tick en vuelo se declara atascado. Lo fija el
   * arranque desde el entorno; el valor inicial sólo cubre el hueco entre la
   * construcción del registro y la lectura de la configuración.
   */
  private stuckThresholdMs = 10 * 60_000;

  constructor(private readonly now: () => number = () => Date.now()) {
    this.mutex = new MutexRegistry(now);
    this.startedAt = now();
  }

  /** Fija el nombre del worker y el umbral de atasco. Lo llama el arranque. */
  configure(workerName: string, stuckThresholdMs: number): void {
    this.workerName = workerName;
    if (Number.isFinite(stuckThresholdMs) && stuckThresholdMs > 0) {
      this.stuckThresholdMs = stuckThresholdMs;
    }
  }

  setStatus(status: WorkerHealthSnapshot['status']): void {
    this.status = status;
  }

  getStatus(): WorkerHealthSnapshot['status'] {
    return this.status;
  }

  /**
   * Registra un cortacircuitos para que aparezca en `/status` y pese en la
   * readiness. Se pasa la función y no la fotografía porque el estado cambia
   * entre lecturas.
   */
  registerCircuit(name: string, snapshot: () => CircuitSnapshot): void {
    this.circuits.set(name, snapshot);
  }

  tickStarted(operation: string): void {
    const health = this.ensure(operation);
    health.inFlightSince = this.now();
    health.lastStartedAt = health.inFlightSince;
  }

  tickFinished(
    operation: string,
    outcome: Exclude<TickOutcome, 'skipped'>,
    error?: unknown,
  ): void {
    const health = this.ensure(operation);
    const finishedAt = this.now();

    health.lastFinishedAt = finishedAt;
    health.lastDurationMs =
      health.inFlightSince === undefined
        ? undefined
        : finishedAt - health.inFlightSince;
    health.inFlightSince = undefined;
    health.lastOutcome = outcome;
    health.runs += 1;

    if (outcome === 'ok') {
      health.consecutiveFailures = 0;
      health.lastError = undefined;
      return;
    }

    health.failures += 1;
    health.consecutiveFailures += 1;
    health.lastError = summarizeError(error);
    if (outcome === 'timeout') {
      health.timeouts += 1;
    }
  }

  tickSkipped(operation: string): void {
    const health = this.ensure(operation);
    health.skipped += 1;
    health.lastOutcome = 'skipped';
  }

  /**
   * Liveness: ¿debe el orquestador reiniciar este proceso?
   *
   * Sólo un motivo dice que sí: un tick en vuelo desde hace más que el umbral.
   * Un tick que **falla** no justifica reiniciar —el fallo puede estar en la
   * dependencia y reiniciar no la arregla, sólo suma un arranque en frío—. Un
   * tick que **no vuelve** sí: el proceso ya no puede recuperarse solo porque
   * la exclusión mutua impide que ese job vuelva a arrancar nunca.
   */
  liveness(): ProbeResult {
    if (this.status === 'stopped') {
      return { healthy: false, reasons: ['el proceso está detenido'] };
    }

    const reasons = this.mutex
      .stuckKeys(this.stuckThresholdMs)
      .map(
        (stuck) =>
          `el tick "${stuck.key}" lleva ${Math.round(
            (stuck.heldForMs ?? 0) / 1000,
          )} s en vuelo (umbral ${Math.round(this.stuckThresholdMs / 1000)} s)`,
      );

    return { healthy: reasons.length === 0, reasons };
  }

  /**
   * Readiness: ¿puede este worker hacer trabajo útil ahora mismo?
   *
   * Se separa de la liveness a propósito. Un cortacircuitos abierto significa
   * que la dependencia está caída: el worker no sirve para nada en este momento
   * y debe salir del balanceo o dejar de recibir trabajo, **pero reiniciarlo
   * sería contraproducente** —perdería el estado del circuito y volvería a
   * castigar a la dependencia que se está recuperando—. Confundir las dos
   * sondas es la causa clásica del bucle de reinicios durante un incidente.
   */
  readiness(): ProbeResult {
    const reasons: string[] = [];

    if (this.status === 'starting') reasons.push('el worker aún no arrancó');
    if (this.status === 'draining') reasons.push('el worker está drenando');
    if (this.status === 'stopped') reasons.push('el proceso está detenido');

    for (const [name, read] of this.circuits) {
      const circuit = read();
      if (circuit.state === 'open') {
        reasons.push(
          `el cortacircuitos "${name}" está abierto ` +
            `(reintento en ${Math.ceil(circuit.retryAfterMs / 1000)} s)`,
        );
      }
    }

    return { healthy: reasons.length === 0, reasons };
  }

  snapshot(): WorkerHealthSnapshot {
    const memory = process.memoryUsage();
    return {
      worker: this.workerName,
      pid: process.pid,
      status: this.status,
      uptimeMs: this.now() - this.startedAt,
      startedAt: new Date(this.startedAt).toISOString(),
      ticks: [...this.ticks.values()].map((tick) => ({ ...tick })),
      circuits: [...this.circuits.values()].map((read) => read()),
      memory: {
        rssBytes: memory.rss,
        heapUsedBytes: memory.heapUsed,
        heapTotalBytes: memory.heapTotal,
      },
      liveness: this.liveness(),
      readiness: this.readiness(),
    };
  }

  /** `true` si queda algún tick en vuelo. Lo consulta el drenaje del apagado. */
  hasInFlightTicks(): boolean {
    return [...this.ticks.values()].some(
      (tick) => tick.inFlightSince !== undefined,
    );
  }

  /** Nombres de los ticks en vuelo, para el log del apagado. */
  inFlightOperations(): string[] {
    return [...this.ticks.values()]
      .filter((tick) => tick.inFlightSince !== undefined)
      .map((tick) => tick.operation);
  }

  private ensure(operation: string): TickHealth {
    let health = this.ticks.get(operation);
    if (!health) {
      health = {
        operation,
        runs: 0,
        failures: 0,
        timeouts: 0,
        skipped: 0,
        consecutiveFailures: 0,
      };
      this.ticks.set(operation, health);
    }
    return health;
  }

  /** Vuelve al estado inicial. Sólo para pruebas. */
  reset(): void {
    this.ticks.clear();
    this.circuits.clear();
    this.mutex.reset();
    this.status = 'starting';
  }
}

/**
 * Instancia única del proceso.
 *
 * Es un singleton de módulo y no un proveedor de NestJS porque `runTick` es una
 * función libre que se llama desde 30 jobs: pasar el registro por inyección
 * obligaría a cambiar la firma de `runTick` y, con ella, esos 30 jobs. El
 * ámbito real del registro es el proceso, que es exactamente lo que un módulo
 * de Node ya garantiza.
 */
export const workerHealth = new WorkerHealthRegistry();
