/**
 * Contadores en memoria de la actividad del ORM.
 *
 * Por qué existe: sin esto, la única señal disponible sobre la capa de datos es
 * el log de consultas, que solo sirve si alguien lo está mirando. Un contador
 * acumulado permite responder preguntas operativas concretas -"¿cuántas
 * consultas lentas llevamos desde el arranque?", "¿qué tabla concentra la
 * latencia?"- desde un endpoint de salud o un scrape de métricas.
 *
 * Coste: se actualiza en el camino caliente de cada consulta, así que todo lo
 * que hace es aritmética entera y, como mucho, una expresión regular sobre la
 * primera línea del SQL. No formatea, no serializa y no reserva memoria por
 * consulta. El coste marginal por consulta es de nanosegundos.
 *
 * Límite deliberado: es por proceso y se pierde al reiniciar. No sustituye a un
 * backend de métricas; alimenta uno.
 */

/** Familias de sentencia que se contabilizan por separado. */
export type QueryKind =
  'select' | 'insert' | 'update' | 'delete' | 'ddl' | 'other';

/** Instantánea inmutable de los contadores, apta para serializar a JSON. */
export interface QueryMetricsSnapshot {
  /**
   * Valor de total mantenido por la instancia.
   */
  readonly total: number;
  /**
   * Valor de by kind mantenido por la instancia.
   */
  readonly byKind: Readonly<Record<QueryKind, number>>;
  /**
   * Valor de slow queries mantenido por la instancia.
   */
  readonly slowQueries: number;
  /**
   * Valor de failed queries mantenido por la instancia.
   */
  readonly failedQueries: number;
  /**
   * Valor de total ms mantenido por la instancia.
   */
  readonly totalMs: number;
  /**
   * Valor de max ms mantenido por la instancia.
   */
  readonly maxMs: number;
  /** Consulta más lenta observada, ya recortada a una longitud manejable. */
  readonly slowestQuery: string | null;
}

/** Longitud máxima del SQL que se conserva en memoria para la consulta más lenta. */
const MAX_SQL_SAMPLE = 500;

/**
 * Clasifica la sentencia por su primera palabra.
 *
 * Se evita una expresión regular con backtracking sobre el SQL completo: se
 * recorta a los primeros 16 caracteres, que siempre bastan para el verbo.
 */
export function classifyQuery(sql: string): QueryKind {
  const head = sql.trimStart().slice(0, 16).toLowerCase();
  if (head.startsWith('select')) return 'select';
  if (head.startsWith('insert')) return 'insert';
  if (head.startsWith('update')) return 'update';
  if (head.startsWith('delete')) return 'delete';
  if (
    head.startsWith('create') ||
    head.startsWith('alter') ||
    head.startsWith('drop')
  ) {
    return 'ddl';
  }
  return 'other';
}

/** Acumulador mutable. Una única instancia por proceso, expuesta como proveedor Nest. */
export class QueryMetrics {
  /**
   * Valor de total mantenido por la instancia.
   */
  private total = 0;
  /**
   * Valor de slow mantenido por la instancia.
   */
  private slow = 0;
  /**
   * Valor de failed mantenido por la instancia.
   */
  private failed = 0;
  /**
   * Valor de total ms mantenido por la instancia.
   */
  private totalMs = 0;
  /**
   * Valor de max ms mantenido por la instancia.
   */
  private maxMs = 0;
  /**
   * Valor de slowest query mantenido por la instancia.
   */
  private slowestQuery: string | null = null;
  /**
   * Valor de by kind mantenido por la instancia.
   */
  private readonly byKind: Record<QueryKind, number> = {
    select: 0,
    insert: 0,
    update: 0,
    delete: 0,
    ddl: 0,
    other: 0,
  };

  /**
   * Registra una consulta ejecutada.
   *
   * @param sql        sentencia ejecutada
   * @param tookMs     duración medida por el driver
   * @param slow       si superó el umbral configurado de consulta lenta
   */
  record(sql: string, tookMs: number, slow: boolean): void {
    this.total += 1;
    this.byKind[classifyQuery(sql)] += 1;
    this.totalMs += tookMs;
    if (slow) this.slow += 1;
    if (tookMs > this.maxMs) {
      this.maxMs = tookMs;
      this.slowestQuery = sql.slice(0, MAX_SQL_SAMPLE);
    }
  }

  /** Registra una consulta que terminó en error del driver. */
  recordFailure(): void {
    this.failed += 1;
  }

  /** Copia defensiva: quien la reciba no puede alterar los contadores vivos. */
  snapshot(): QueryMetricsSnapshot {
    return {
      total: this.total,
      byKind: { ...this.byKind },
      slowQueries: this.slow,
      failedQueries: this.failed,
      totalMs: Math.round(this.totalMs),
      maxMs: Math.round(this.maxMs),
      slowestQuery: this.slowestQuery,
    };
  }

  /** Latencia media por consulta desde el arranque, en milisegundos. */
  averageMs(): number {
    return this.total === 0 ? 0 : this.totalMs / this.total;
  }
}
