import { Injectable } from '@nestjs/common';

/**
 * Contadores de la capa de puertos y adaptadores.
 *
 * No duplican a `QueryMetrics` de `src/orm/observability`: aquel cuenta
 * consultas de MikroORM y no sabe por qué ruta lógica llegaron, mientras que
 * este cuenta operaciones **por conexión y por tipo de ruta**, que es lo que
 * responde a la pregunta operativa de esta refactorización -«¿cuánto tráfico
 * está yendo de verdad a la réplica?»- y lo que el §43 pide instrumentar.
 *
 * Se mantiene en memoria y por proceso, igual que `QueryMetrics`: alimenta un
 * backend de métricas, no lo sustituye.
 */

/** Una observación de la capa de persistencia. */
export interface PersistenceObservation {
  /** Nombre lógico de la conexión que atendió la operación. */
  readonly connectionName: string;
  /** Motor. */
  readonly engine: string;
  /** Nombre lógico de la operación. */
  readonly operation: string;
  /** Ruta por la que fue. */
  readonly kind: 'read' | 'write';
  /** Duración en milisegundos. */
  readonly durationMs: number;
  /** Desenlace. */
  readonly outcome: 'ok' | 'error';
  /** Tipo de error normalizado, cuando lo hubo. */
  readonly errorType?: string;
  /** Si la lectura se desvió a la primaria por exigencia de consistencia. */
  readonly redirected?: boolean;
  /** Si la lectura se desvió a la primaria por fallo de la de lectura (§33). */
  readonly fellBack?: boolean;
}

/** Acumulados de una conexión. */
export interface ConnectionCounters {
  /** Operaciones totales. */
  total: number;
  /** Operaciones de lectura. */
  reads: number;
  /** Operaciones de escritura. */
  writes: number;
  /** Operaciones fallidas. */
  errors: number;
  /** Lecturas desviadas a la primaria por consistencia. */
  redirects: number;
  /** Lecturas desviadas a la primaria por fallo. */
  fallbacks: number;
  /** Tiempo acumulado en milisegundos. */
  totalMs: number;
  /** Duración máxima observada. */
  maxMs: number;
  /** Errores por tipo normalizado. */
  errorsByType: Record<string, number>;
}

/** Instantánea serializable de todos los contadores. */
export type PersistenceMetricsSnapshot = Readonly<
  Record<string, Readonly<ConnectionCounters>>
>;

/** Contadores vacíos. */
function emptyCounters(): ConnectionCounters {
  return {
    total: 0,
    reads: 0,
    writes: 0,
    errors: 0,
    redirects: 0,
    fallbacks: 0,
    totalMs: 0,
    maxMs: 0,
    errorsByType: {},
  };
}

/** Acumulador por conexión. Una única instancia por proceso. */
@Injectable()
export class PersistenceMetrics {
  private readonly counters = new Map<string, ConnectionCounters>();

  /**
   * Registra una observación.
   *
   * Está en el camino caliente de cada operación de los puertos, así que solo
   * hace aritmética entera y una búsqueda en un mapa: no formatea, no serializa
   * y no reserva memoria por operación salvo la primera vez que ve una conexión
   * o un tipo de error nuevos.
   */
  record(observation: PersistenceObservation): void {
    let counters = this.counters.get(observation.connectionName);
    if (!counters) {
      counters = emptyCounters();
      this.counters.set(observation.connectionName, counters);
    }

    counters.total += 1;
    if (observation.kind === 'read') counters.reads += 1;
    else counters.writes += 1;
    if (observation.outcome === 'error') {
      counters.errors += 1;
      const type = observation.errorType ?? 'PersistenceError';
      counters.errorsByType[type] = (counters.errorsByType[type] ?? 0) + 1;
    }
    if (observation.redirected) counters.redirects += 1;
    if (observation.fellBack) counters.fallbacks += 1;
    counters.totalMs += observation.durationMs;
    if (observation.durationMs > counters.maxMs) {
      counters.maxMs = observation.durationMs;
    }
  }

  /** Instantánea inmutable, apta para serializar a JSON. */
  snapshot(): PersistenceMetricsSnapshot {
    return Object.fromEntries(
      [...this.counters.entries()].map(([name, counters]) => [
        name,
        { ...counters, errorsByType: { ...counters.errorsByType } },
      ]),
    );
  }

  /** Vacía los contadores. Solo para pruebas. */
  reset(): void {
    this.counters.clear();
  }
}
