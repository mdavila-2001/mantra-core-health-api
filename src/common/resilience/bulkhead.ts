import { BulkheadFullError } from './resilience.errors';

/**
 * Mamparo: acota cuántas operaciones de un tipo pueden estar **en vuelo** a la
 * vez, y cuántas pueden esperar turno.
 *
 * Un timeout acota lo que dura una operación; un mamparo acota cuántas hay. Son
 * problemas distintos y sólo el segundo protege de la saturación: 500 llamadas
 * concurrentes con un plazo de 30 s son 500 sockets abiertos durante 30 s
 * —descriptores de fichero, memoria de búfer y conexiones del pool— aunque
 * todas terminen a tiempo. El nombre viene de los mamparos estancos de un
 * barco: una vía de agua inunda un compartimento, no el casco.
 *
 * La cola es **acotada a propósito**. Una cola sin límite convierte la
 * saturación en un problema de memoria: las peticiones se aceptan, se apilan y
 * el proceso muere por OOM sin haber rechazado ni una. Rechazar rápido con
 * `CONCURRENCY_LIMIT` le da a quien llama la oportunidad de reintentar más
 * tarde o de degradar; morir por OOM no le da ninguna.
 */
export interface BulkheadOptions {
  /** Nombre del recurso protegido; aparece en el error y en las métricas. */
  operation: string;
  /** Operaciones simultáneas permitidas. */
  maxConcurrent: number;
  /** Operaciones en espera permitidas. `0` = rechazar en cuanto no haya hueco. */
  maxQueued?: number;
}

/** Ocupación observable del mamparo, para `/status` y métricas. */
export interface BulkheadSnapshot {
  operation: string;
  inFlight: number;
  queued: number;
  maxConcurrent: number;
  maxQueued: number;
  /** Rechazos acumulados por saturación desde el arranque del proceso. */
  rejected: number;
}

interface Waiter {
  resolve: () => void;
  reject: (error: Error) => void;
  onAbort?: () => void;
  signal?: AbortSignal;
}

export class Bulkhead {
  private readonly maxConcurrent: number;
  private readonly maxQueued: number;
  private readonly waiters: Waiter[] = [];
  private inFlight = 0;
  private rejected = 0;

  constructor(private readonly options: BulkheadOptions) {
    this.maxConcurrent = Math.max(1, Math.trunc(options.maxConcurrent));
    this.maxQueued = Math.max(0, Math.trunc(options.maxQueued ?? 0));
  }

  /**
   * Ejecuta `fn` ocupando un hueco del mamparo.
   *
   * @throws {BulkheadFullError} cuando no hay hueco ni sitio en la cola.
   */
  async execute<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    await this.acquire(signal);
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  snapshot(): BulkheadSnapshot {
    return {
      operation: this.options.operation,
      inFlight: this.inFlight,
      queued: this.waiters.length,
      maxConcurrent: this.maxConcurrent,
      maxQueued: this.maxQueued,
      rejected: this.rejected,
    };
  }

  private acquire(signal?: AbortSignal): Promise<void> {
    if (this.inFlight < this.maxConcurrent) {
      this.inFlight += 1;
      return Promise.resolve();
    }

    if (this.waiters.length >= this.maxQueued) {
      this.rejected += 1;
      return Promise.reject(
        new BulkheadFullError(
          this.options.operation,
          this.maxConcurrent,
          this.maxQueued,
        ),
      );
    }

    return new Promise<void>((resolve, reject) => {
      const waiter: Waiter = { resolve, reject, signal };

      if (signal) {
        // Quien está en la cola y ya no interesa (el llamador se rindió, el
        // proceso se apaga) debe salir de ella. Si no, un apagado tendría que
        // esperar a que se drene una cola cuyos resultados nadie va a recoger.
        waiter.onAbort = () => {
          const index = this.waiters.indexOf(waiter);
          if (index >= 0) this.waiters.splice(index, 1);
          reject(
            signal.reason instanceof Error
              ? signal.reason
              : new Error(`espera en "${this.options.operation}" cancelada`),
          );
        };
        signal.addEventListener('abort', waiter.onAbort, { once: true });
      }

      this.waiters.push(waiter);
    });
  }

  private release(): void {
    this.inFlight -= 1;
    const next = this.waiters.shift();
    if (!next) return;

    if (next.onAbort && next.signal) {
      next.signal.removeEventListener('abort', next.onAbort);
    }
    this.inFlight += 1;
    next.resolve();
  }
}
