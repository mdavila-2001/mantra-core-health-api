import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ROLLUPS,
  TIMESERIES_TABLES,
  type RollupName,
  type TimeseriesTable,
} from '../constants';

const SCHEMA = 'time_series';

/**
 * Comprueba que la tabla está en la lista blanca del módulo antes de que su
 * nombre entre en una sentencia. Un identificador SQL no admite *bind*, así que
 * la lista blanca es lo que sustituye al parámetro.
 */
function assertTable(table: string): TimeseriesTable {
  if (!(TIMESERIES_TABLES as readonly string[]).includes(table)) {
    throw new InternalServerErrorException(
      'La tabla no pertenece al catálogo de series temporales del módulo.',
    );
  }
  return table as TimeseriesTable;
}

/**
 * Valida assert rollup.
 *
 * @param name - Valor de name requerido por la operación.
 * @returns Resultado de assert rollup conforme al contrato `RollupName`.
 * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
 */
function assertRollup(name: string): RollupName {
  if (!Object.prototype.hasOwnProperty.call(ROLLUPS, name)) {
    throw new InternalServerErrorException(
      'El rollup no pertenece al catálogo de agregados continuos del módulo.',
    );
  }
  return name as RollupName;
}

/** Identificador de columna admisible para el particionado por espacio. */
const SAFE_COLUMN = /^[a-z_][a-z0-9_]{0,62}$/;

/**
 * Describe el contrato estructural de chunk info.
 */
export interface ChunkInfo {
  /**
   * Valor de chunk mantenido por la instancia.
   */
  chunk: string;
}

/**
 * Operaciones nativas de TimescaleDB sobre el esquema `time_series`
 * (UC-58-04 … 09).
 *
 * Estas cinco operaciones no son CRUD: hypertables, chunks, compresión, retención
 * y agregados continuos son objetos del propio motor, y se manipulan con sus
 * funciones de catálogo. Todo nombre de tabla o de rollup pasa por la lista blanca
 * del módulo antes de entrar en la sentencia; los valores van parametrizados.
 */
@Injectable()
export class TimescaleRepository {
  // --- Hypertables y chunks (UC-58-04) ---

  /**
   * Convierte la tabla en hypertable si aún no lo es. `if_not_exists` la hace
   * inocua sobre una tabla ya convertida —el caso normal, porque el arranque del
   * ORM ya las convierte—, y `migrate_data` permite convertir una que ya tenga
   * filas.
   */
  async createHypertable(em: EntityManager, table: string): Promise<void> {
    const safe = assertTable(table);
    await em
      .getConnection()
      .execute(
        `SELECT create_hypertable('${SCHEMA}.${safe}', 'time', if_not_exists => TRUE, migrate_data => TRUE)`,
        [],
        'all',
        em.getTransactionContext(),
      );
  }

  /**
   * Añade la dimensión de espacio. Particionar sólo por tiempo deja todos los
   * tenants en el mismo chunk, y una consulta de un tenant acaba leyendo los datos
   * de todos.
   */
  async addSpaceDimension(
    em: EntityManager,
    table: string,
    column: string,
    partitions: number,
  ): Promise<void> {
    const safe = assertTable(table);
    if (!SAFE_COLUMN.test(column)) {
      throw new InternalServerErrorException(
        'La dimensión de espacio no es un identificador de columna válido.',
      );
    }
    await em
      .getConnection()
      .execute(
        `SELECT add_dimension('${SCHEMA}.${safe}', '${column}', number_partitions => ?, if_not_exists => TRUE)`,
        [partitions],
        'all',
        em.getTransactionContext(),
      );
  }

  /** Anchura temporal del chunk. Se pasa como intervalo parametrizado. */
  async setChunkTimeInterval(
    em: EntityManager,
    table: string,
    interval: string,
  ): Promise<void> {
    const safe = assertTable(table);
    await em
      .getConnection()
      .execute(
        `SELECT set_chunk_time_interval('${SCHEMA}.${safe}', ?::interval)`,
        [interval],
        'all',
        em.getTransactionContext(),
      );
  }

  /** Estado de la hypertable en el catálogo del motor, para poder informarlo. */
  async describeHypertable(
    em: EntityManager,
    table: string,
  ): Promise<{
    /**
     * Valor de num chunks mantenido por la instancia.
     */
    num_chunks: number; /**
     * Valor de compression enabled mantenido por la instancia.
     */
    compression_enabled: boolean;
  } | null> {
    const safe = assertTable(table);
    const rows = await em.getConnection().execute<
      {
        /**
         * Valor de num chunks mantenido por la instancia.
         */
        num_chunks: number; /**
         * Valor de compression enabled mantenido por la instancia.
         */
        compression_enabled: boolean;
      }[]
    >(
      `SELECT num_chunks, compression_enabled
           FROM timescaledb_information.hypertables
          WHERE hypertable_schema = ? AND hypertable_name = ?`,
      [SCHEMA, safe],
      'all',
      em.getTransactionContext(),
    );
    return rows?.[0] ?? null;
  }

  // --- Compresión (UC-58-05) ---

  /**
   * Habilita la compresión declarando por qué columnas se segmenta. `segmentBy`
   * viene de `COMPRESSION_SEGMENTS`, no de la petición: es texto dentro del
   * `ALTER TABLE` y no admite bind.
   */
  async enableCompression(
    em: EntityManager,
    table: string,
    segmentBy: string,
  ): Promise<void> {
    const safe = assertTable(table);
    for (const column of segmentBy.split(',')) {
      if (!SAFE_COLUMN.test(column.trim())) {
        throw new InternalServerErrorException(
          'La segmentación de compresión declara una columna que no es válida.',
        );
      }
    }
    await em.getConnection().execute(
      `ALTER TABLE ${SCHEMA}.${safe} SET (
           timescaledb.compress,
           timescaledb.compress_segmentby = '${segmentBy}',
           timescaledb.compress_orderby = 'time DESC'
         )`,
      [],
      'all',
      em.getTransactionContext(),
    );
  }

  /** Chunks más antiguos que el umbral; son los candidatos a comprimir o tirar. */
  async listChunksOlderThan(
    em: EntityManager,
    table: string,
    olderThan: string,
  ): Promise<string[]> {
    const safe = assertTable(table);
    const rows = await em
      .getConnection()
      .execute<ChunkInfo[]>(
        `SELECT show_chunks('${SCHEMA}.${safe}', older_than => ?::interval)::text AS chunk`,
        [olderThan],
        'all',
        em.getTransactionContext(),
      );
    return (rows ?? []).map((row) => row.chunk);
  }

  /**
   * Comprime un chunk. `if_not_compressed` evita que un reintento del worker
   * falle sobre uno que ya comprimió otro.
   */
  async compressChunk(em: EntityManager, chunk: string): Promise<void> {
    await em
      .getConnection()
      .execute(
        'SELECT compress_chunk(?::regclass, if_not_compressed => TRUE)',
        [chunk],
        'all',
        em.getTransactionContext(),
      );
  }

  // --- Retención (UC-58-06) ---

  /**
   * Tira los chunks fuera de ventana. Es metadata, no borrado fila a fila: por eso
   * la retención de una serie de mil millones de filas cuesta lo mismo que la de
   * una de mil.
   */
  async dropChunksOlderThan(
    em: EntityManager,
    table: string,
    olderThan: string,
  ): Promise<string[]> {
    const safe = assertTable(table);
    const rows = await em
      .getConnection()
      .execute<ChunkInfo[]>(
        `SELECT drop_chunks('${SCHEMA}.${safe}', older_than => ?::interval)::text AS chunk`,
        [olderThan],
        'all',
        em.getTransactionContext(),
      );
    return (rows ?? []).map((row) => row.chunk);
  }

  // --- Agregados continuos (UC-58-07, 08) ---

  /**
   * Crea el agregado continuo si no existe, con su definición de la lista blanca.
   * `WITH NO DATA` a propósito: materializar en la creación bloquearía la tabla de
   * origen el tiempo que tarde en recorrer todo el histórico. El refresco posterior
   * lo hace por ventanas.
   */
  async ensureContinuousAggregate(
    em: EntityManager,
    name: string,
  ): Promise<void> {
    const safe = assertRollup(name);
    await em.getConnection().execute(
      `CREATE MATERIALIZED VIEW IF NOT EXISTS ${SCHEMA}.${safe}
           WITH (timescaledb.continuous) AS ${ROLLUPS[safe].definition}
           WITH NO DATA`,
      [],
      'all',
      em.getTransactionContext(),
    );
  }

  /**
   * Refresca la ventana del agregado.
   *
   * **Se ejecuta fuera de transacción a propósito.** `refresh_continuous_aggregate`
   * es un procedimiento que TimescaleDB no permite llamar dentro de un bloque
   * transaccional: hace su propio control de transacciones por bucket para no
   * mantener bloqueada la tabla de origen mientras materializa. Por eso este método
   * no recibe el contexto transaccional y el servicio lo llama antes de abrir la
   * suya para registrar la métrica.
   */
  async refreshContinuousAggregate(
    em: EntityManager,
    name: string,
    from: Date,
    to: Date,
  ): Promise<void> {
    const safe = assertRollup(name);
    await em
      .getConnection()
      .execute(`CALL refresh_continuous_aggregate('${SCHEMA}.${safe}', ?, ?)`, [
        from,
        to,
      ]);
  }

  /** Cuántos buckets tiene materializados el rollup en la ventana refrescada. */
  async countRollupBuckets(
    em: EntityManager,
    name: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const safe = assertRollup(name);
    const rows = await em.getConnection().execute<
      {
        /**
         * Valor de total mantenido por la instancia.
         */
        total: string;
      }[]
    >(`SELECT count(*)::text AS total FROM ${SCHEMA}.${safe} WHERE bucket >= ? AND bucket < ?`, [from, to], 'all', em.getTransactionContext());
    return Number(rows?.[0]?.total ?? 0);
  }

  // --- Consulta con downsampling (UC-58-09) ---

  /**
   * Lectura de rango agrupada por bucket sobre el dato crudo.
   *
   * `agg` y `valueColumn` se validan contra listas cerradas antes de componerse:
   * una función de agregación y un nombre de columna son identificadores y no
   * admiten bind. El rango, el bucket y la serie sí van parametrizados.
   *
   * `valueColumn` nulo significa que la serie no tiene columna numérica que
   * agregar: sólo se puede contar cuántos eventos hay en cada bucket.
   */
  async queryRawRange(
    em: EntityManager,
    table: string,
    valueColumn: string | null,
    agg: string,
    params: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a series.
       */
      seriesId: string;
      /**
       * Valor de from mantenido por la instancia.
       */
      from: Date;
      /**
       * Valor de to mantenido por la instancia.
       */
      to: Date;
      /**
       * Valor de bucket mantenido por la instancia.
       */
      bucket: string;
      /**
       * Valor de limit mantenido por la instancia.
       */
      limit: number;
    },
  ): Promise<
    {
      /**
       * Valor de bucket mantenido por la instancia.
       */
      bucket: string; /**
       * Valor de value mantenido por la instancia.
       */
      value: number | null; /**
       * Valor de samples mantenido por la instancia.
       */
      samples: string;
    }[]
  > {
    const safe = assertTable(table);
    if (!SAFE_COLUMN.test(agg)) {
      throw new InternalServerErrorException(
        'La consulta declara una agregación que no es válida.',
      );
    }
    if (valueColumn !== null && !SAFE_COLUMN.test(valueColumn)) {
      throw new InternalServerErrorException(
        'La consulta declara una columna que no es válida.',
      );
    }
    if (valueColumn === null && agg !== 'count') {
      throw new InternalServerErrorException(
        'La serie no tiene columna numérica: sólo admite conteo.',
      );
    }

    // La columna se entrecomilla porque varias series la llaman `count` o
    // `value`, que son palabras que el analizador trata de forma especial según
    // el contexto.
    const expression =
      valueColumn === null ? 'count(*)' : `${agg}("${valueColumn}")`;

    const rows = await em.getConnection().execute<
      {
        /**
         * Valor de bucket mantenido por la instancia.
         */
        bucket: string; /**
         * Valor de value mantenido por la instancia.
         */
        value: number | null; /**
         * Valor de samples mantenido por la instancia.
         */
        samples: string;
      }[]
    >(
      `SELECT time_bucket(?::interval, time)::text AS bucket,
              ${expression} AS value,
              count(*)::text AS samples
         FROM ${SCHEMA}.${safe}
        WHERE tenant_id = ? AND series_id = ? AND time >= ? AND time < ?
        GROUP BY 1
        ORDER BY 1
        LIMIT ?`,
      [
        params.bucket,
        params.tenantId,
        params.seriesId,
        params.from,
        params.to,
        params.limit,
      ],
      'all',
      em.getTransactionContext(),
    );
    return rows ?? [];
  }

  /**
   * Lectura desde el rollup en vez del crudo. Es lo que hace que pedir un mes de
   * datos con bucket diario no recorra treinta millones de filas.
   */
  async queryRollupRange(
    em: EntityManager,
    name: string,
    params: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string; /**
       * Valor de from mantenido por la instancia.
       */
      from: Date; /**
       * Valor de to mantenido por la instancia.
       */
      to: Date; /**
       * Valor de limit mantenido por la instancia.
       */
      limit: number;
    },
  ): Promise<
    {
      /**
       * Valor de bucket mantenido por la instancia.
       */
      bucket: string; /**
       * Valor de value mantenido por la instancia.
       */
      value: number | null; /**
       * Valor de samples mantenido por la instancia.
       */
      samples: string;
    }[]
  > {
    const safe = assertRollup(name);
    const valueExpression =
      safe === 'continuous_audit_daily' ? 'event_count' : 'value';
    const rows = await em.getConnection().execute<
      {
        /**
         * Valor de bucket mantenido por la instancia.
         */
        bucket: string; /**
         * Valor de value mantenido por la instancia.
         */
        value: number | null; /**
         * Valor de samples mantenido por la instancia.
         */
        samples: string;
      }[]
    >(
      `SELECT bucket::text AS bucket, ${valueExpression} AS value, '1' AS samples
         FROM ${SCHEMA}.${safe}
        WHERE tenant_id = ? AND bucket >= ? AND bucket < ?
        ORDER BY bucket
        LIMIT ?`,
      [params.tenantId, params.from, params.to, params.limit],
      'all',
      em.getTransactionContext(),
    );
    return rows ?? [];
  }
}
