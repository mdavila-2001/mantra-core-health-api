import {
  shapeHashOfNormalized,
  storableNormalizedSql,
  statementClass,
  type StatementClass,
} from '../../orm/observability/sql-redaction';
import {
  operationResolver,
  type OperationResolver,
} from './operation-resolver';
import {
  currentRequestContext,
  noteSqlInRequest,
  routeTemplateOfRequest,
} from './request-context';

/**
 * Sink de consultas SQL (H4 del portal «Sistema»), alimentado por
 * `OrmLogger.logQuery`.
 *
 * Por minuto × huella (`sqlShapeHash`) × operación guarda ejecuciones, tiempo
 * total y máximo, lentas, fallidas, filas y un histograma acumulado. El texto
 * va **una sola vez** al catálogo `sql_statements` y es el SQL **normalizado**
 * (literales, números y listas de parámetros reemplazados por `?`): nunca un
 * parámetro ni un valor de fila.
 *
 * ## Qué no se mide
 *
 *  - Las consultas del propio módulo (`observability.*`): medirlas haría que el
 *    volcado alimentara lo que vuelca.
 *  - SQL que no pase por MikroORM (`pg` directo): `notMeasured.sqlOnlyOrm`.
 *
 * `record` no lanza ni hace E/S.
 */

/** Cortes del histograma de SQL en milisegundos (las columnas `le1…le5000`). */
export const SQL_LATENCY_BUCKETS_MS: readonly number[] = [
  1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000,
];

/** Huellas distintas por minuto y por instancia; el exceso va a `__overflow__`. */
export const MAX_SQL_HASHES_PER_MINUTE = 5000;
export const SQL_OVERFLOW_HASH = '__overflow__';
export const UNKNOWN_OPERATION = 'UNKNOWN';
const MAX_NORMALIZED_SQL_CHARS = 2000;
const MAX_CATALOG_PENDING = 5000;
const MINUTE_MS = 60_000;
const SEQ_MEMORY_MINUTES = 180;

/** Fila lista para `observability.sql_statement_minute_series`. */
export interface SqlMinuteRow {
  readonly time: Date;
  readonly flushSeq: number;
  readonly queryHash: string;
  readonly operationKey: string;
  readonly moduleCode: string;
  readonly executions: number;
  readonly sumMs: number;
  readonly maxMs: number;
  readonly slowCount: number;
  readonly failedCount: number;
  readonly rowsSum: number;
  /** Acumulados: `le1 … le5000` (10 cortes) e `inf` (todas). */
  readonly buckets: readonly number[];
}

/** Fila para el catálogo `observability.sql_statements`. */
export interface SqlStatementRow {
  readonly queryHash: string;
  readonly statementClass: StatementClass;
  readonly normalizedSql: string | null;
  readonly primaryTable: string | null;
  readonly firstSeenAt: Date;
  readonly lastSeenAt: Date;
  readonly slowEver: boolean;
}

export interface DrainedSql {
  readonly series: SqlMinuteRow[];
  readonly statements: SqlStatementRow[];
}

interface Cell {
  readonly minute: number;
  readonly hash: string;
  readonly operationKey: string;
  readonly moduleCode: string;
  executions: number;
  sumMs: number;
  maxMs: number;
  slow: number;
  failed: number;
  rows: number;
  /** No acumulado mientras se cuenta; el último índice es `inf`. */
  buckets: number[];
}

const PRIMARY_TABLE =
  /\b(?:from|into|update)\s+("?[a-z_][a-z0-9_]*"?\."?[a-z_][a-z0-9_]*"?)/i;

/**
 * Primera `schema.tabla` tras `FROM`/`INTO`/`UPDATE`, o `null` si no se
 * reconoce. Conservador a propósito: ante la duda, no inventa una tabla.
 */
export function primaryTableOf(normalizedSql: string): string | null {
  const match = PRIMARY_TABLE.exec(normalizedSql);
  return match ? match[1].replace(/"/g, '').toLowerCase() : null;
}

/** Consultas que no se miden: las del propio módulo y el contexto de RLS. */
export function isSelfSql(sql: string): boolean {
  const head = sql.slice(0, 400);
  return /"?\bobservability\b"?\./i.test(head) || /set_config\s*\(/i.test(head);
}

function bucketIndex(ms: number): number {
  const index = SQL_LATENCY_BUCKETS_MS.findIndex((limit) => ms <= limit);
  return index === -1 ? SQL_LATENCY_BUCKETS_MS.length : index;
}

export class SqlSink {
  private enabled = false;
  private readonly cells = new Map<string, Cell>();
  private readonly hashesByMinute = new Map<number, Set<string>>();
  private readonly statements = new Map<string, SqlStatementRow>();
  private readonly seqByMinute = new Map<number, number>();
  private slowQueriesCount = 0;

  constructor(
    private readonly resolver: OperationResolver = operationResolver,
  ) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get pendingGroups(): number {
    return this.cells.size;
  }

  /** Consultas lentas vistas desde el arranque. */
  get slowQueries(): number {
    return this.slowQueriesCount;
  }

  /**
   * Anota una consulta terminada.
   *
   * @param sql - SQL tal como lo entrega el ORM (con parámetros interpolados).
   * @param tookMs - Duración medida por el driver.
   * @param options.slow - Si superó `ORM_SLOW_QUERY_MS`.
   * @param options.failed - Si la consulta falló.
   * @param options.rows - Filas devueltas o afectadas.
   */
  record(
    sql: string,
    tookMs: number,
    options: { slow: boolean; failed?: boolean; rows?: number },
    at: Date = new Date(),
  ): void {
    if (!this.enabled) return;
    try {
      if (isSelfSql(sql)) return;
      // Se normaliza la sentencia COMPLETA y recién después se acota: cortar
      // antes puede dejar un literal sin cerrar con su valor adentro.
      const normalizedFull = storableNormalizedSql(
        sql,
        MAX_NORMALIZED_SQL_CHARS,
      );
      const ms = Number.isFinite(tookMs) && tookMs > 0 ? tookMs : 0;
      const minute = Math.floor(at.getTime() / MINUTE_MS) * MINUTE_MS;

      // Operación que dispara la consulta: la petición en curso, si la hay.
      const context = currentRequestContext();
      let operationKey = UNKNOWN_OPERATION;
      let moduleCode = 'UNKNOWN';
      if (context) {
        const resolved = this.resolver.resolve(
          (context.req.method ?? 'GET').toUpperCase(),
          routeTemplateOfRequest(context.req),
        );
        operationKey = resolved.operationKey ?? UNKNOWN_OPERATION;
        moduleCode = resolved.moduleCode;
      }

      let hash = shapeHashOfNormalized(normalizedFull);
      const known = this.hashesByMinute.get(minute) ?? new Set<string>();
      if (!known.has(hash)) {
        if (known.size >= MAX_SQL_HASHES_PER_MINUTE) hash = SQL_OVERFLOW_HASH;
        known.add(hash);
        this.hashesByMinute.set(minute, known);
      }

      if (hash !== SQL_OVERFLOW_HASH) {
        this.noteStatement(hash, sql, normalizedFull, options.slow, at);
      }
      noteSqlInRequest(hash, ms);
      if (context && options.slow) context.slowSqlCount += 1;

      const key = `${minute}|${hash}|${operationKey}`;
      let cell = this.cells.get(key);
      if (!cell) {
        cell = {
          minute,
          hash,
          operationKey,
          moduleCode,
          executions: 0,
          sumMs: 0,
          maxMs: 0,
          slow: 0,
          failed: 0,
          rows: 0,
          buckets: new Array<number>(SQL_LATENCY_BUCKETS_MS.length + 1).fill(0),
        };
        this.cells.set(key, cell);
      }
      cell.executions += 1;
      cell.sumMs += ms;
      cell.maxMs = Math.max(cell.maxMs, ms);
      if (options.slow) {
        cell.slow += 1;
        this.slowQueriesCount += 1;
      }
      if (options.failed) cell.failed += 1;
      if (typeof options.rows === 'number' && options.rows > 0) {
        cell.rows += options.rows;
      }
      cell.buckets[bucketIndex(ms)] += 1;
    } catch {
      // Medir no puede romper una consulta.
    }
  }

  private noteStatement(
    hash: string,
    sql: string,
    normalized: string,
    slow: boolean,
    at: Date,
  ): void {
    const existing = this.statements.get(hash);
    if (existing) {
      this.statements.set(hash, {
        ...existing,
        lastSeenAt: at > existing.lastSeenAt ? at : existing.lastSeenAt,
        slowEver: existing.slowEver || slow,
      });
      return;
    }
    if (this.statements.size >= MAX_CATALOG_PENDING) return;
    this.statements.set(hash, {
      queryHash: hash,
      statementClass: statementClass(sql),
      normalizedSql: normalized,
      primaryTable: primaryTableOf(normalized),
      firstSeenAt: at,
      lastSeenAt: at,
      slowEver: slow,
    });
  }

  /** Entrega lo acumulado con su `flushSeq` y lo olvida. */
  drain(): DrainedSql {
    const seqForMinute = new Map<number, number>();
    const series = [...this.cells.values()]
      .sort(
        (a, b) =>
          a.minute - b.minute ||
          a.hash.localeCompare(b.hash) ||
          a.operationKey.localeCompare(b.operationKey),
      )
      .map((cell): SqlMinuteRow => {
        let seq = seqForMinute.get(cell.minute);
        if (seq === undefined) {
          seq = (this.seqByMinute.get(cell.minute) ?? 0) + 1;
          seqForMinute.set(cell.minute, seq);
          this.seqByMinute.set(cell.minute, seq);
        }
        let running = 0;
        const buckets = cell.buckets.map((n) => (running += n));
        return {
          time: new Date(cell.minute),
          flushSeq: seq,
          queryHash: cell.hash,
          operationKey: cell.operationKey,
          moduleCode: cell.moduleCode,
          executions: cell.executions,
          sumMs: cell.sumMs,
          maxMs: cell.maxMs,
          slowCount: cell.slow,
          failedCount: cell.failed,
          rowsSum: cell.rows,
          buckets,
        };
      });
    const drained: DrainedSql = {
      series,
      statements: [...this.statements.values()].sort((a, b) =>
        a.queryHash.localeCompare(b.queryHash),
      ),
    };
    this.cells.clear();
    this.hashesByMinute.clear();
    this.statements.clear();
    const horizon = Date.now() - SEQ_MEMORY_MINUTES * MINUTE_MS;
    for (const minute of this.seqByMinute.keys()) {
      if (minute < horizon) this.seqByMinute.delete(minute);
    }
    return drained;
  }
}

/** Sink del proceso: lo comparten el logger del ORM y el servicio de volcado. */
export const sqlSink = new SqlSink();
