import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type {
  DrainedErrors,
  ErrorEventRow,
  ErrorGroupDelta,
  HttpMinuteRow,
  InstanceIdentity,
  SlowRequestRow,
  SqlMinuteRow,
  SqlStatementRow,
} from '../../../observability/capture';
import { ERROR_GROUP_STATE } from '../observability.concepts';

/** Filas por sentencia: 23 parámetros × 500 queda muy por debajo del límite de 65 535. */
const CHUNK = 500;
const EVENT_CHUNK = 200;

function affectedOf(result: unknown): number {
  const affected = (result as { affectedRows?: number } | undefined)
    ?.affectedRows;
  return typeof affected === 'number' ? affected : 0;
}

function placeholders(rows: number, columns: number): string {
  const row = `(${new Array<string>(columns).fill('?').join(', ')})`;
  return new Array<string>(rows).fill(row).join(', ');
}

function chunked<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
}

export interface PersistedErrors {
  readonly groups: number;
  readonly eventsInserted: number;
  readonly eventsDuplicated: number;
}

/**
 * Escrituras del módulo 70. Todo recibe la transacción abierta por el servicio
 * de volcado: una sola transacción por lote.
 *
 * ## Por qué SQL directo y no `em.persist`
 *
 *  - Las series son **append-only** (un trigger prohíbe el `UPDATE`) y su clave
 *    primaria es la clave de idempotencia: lo correcto es
 *    `INSERT … ON CONFLICT DO NOTHING`, que el ORM no expresa.
 *  - `error_events` tiene RLS por `actor_tenant_id`: un `INSERT … RETURNING`
 *    sin contexto falla (la fila nueva debe pasar también la política de
 *    lectura; aviso de F1 §3). Estas sentencias **no usan `RETURNING`** sobre
 *    esa tabla; el id lo genera el sink.
 */
@Injectable()
export class ObservabilityWriteRepository {
  /** Registra (o refresca) la fila de esta instancia. Necesaria antes de insertar eventos (FK). */
  async upsertInstance(
    tx: EntityManager,
    identity: InstanceIdentity,
    status: 'starting' | 'running' | 'draining' | 'stopped',
    now: Date,
  ): Promise<void> {
    await tx.execute(
      `INSERT INTO observability.instances
         (id, kind, name, build_commit, build_version, host_hash, started_at,
          last_seen_at, status, expected, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
       ON CONFLICT (id) DO UPDATE
          SET last_seen_at = EXCLUDED.last_seen_at,
              status = EXCLUDED.status,
              updated_at = EXCLUDED.updated_at`,
      [
        identity.id,
        identity.kind,
        identity.name,
        identity.buildCommit,
        identity.buildVersion,
        identity.hostHash,
        identity.startedAt,
        now,
        status,
        now,
        now,
      ],
    );
  }

  /**
   * Inserta las filas HTTP. Devuelve cuántas quedaron **realmente** insertadas:
   * las que ya existían (reintento) no cuentan.
   */
  async insertHttpRows(
    tx: EntityManager,
    instanceId: string,
    rows: readonly HttpMinuteRow[],
    now: Date,
  ): Promise<number> {
    let inserted = 0;
    for (const batch of chunked(rows, CHUNK)) {
      const params: unknown[] = [];
      for (const r of batch) {
        params.push(
          r.time,
          instanceId,
          r.flushSeq,
          r.httpMethod,
          r.routeTemplate,
          r.httpStatus,
          r.operationKey,
          r.moduleCode,
          r.requests,
          r.sumMs,
          r.maxMs,
          ...r.buckets,
          now,
        );
      }
      const result = await tx.getConnection().execute(
        `INSERT INTO observability.http_request_minute_series
             (time, instance_id, flush_seq, http_method, route_template, http_status,
              operation_key, module_code, requests, sum_ms, max_ms,
              le5, le10, le25, le50, le100, le250, le500, le1000, le2000, le5000, le10000,
              created_at)
           VALUES ${placeholders(batch.length, 23)}
           ON CONFLICT DO NOTHING`,
        params,
        'run',
        tx.getTransactionContext(),
      );
      inserted += affectedOf(result);
    }
    return inserted;
  }

  /** Catálogo de sentencias normalizadas: alta o refresco de `last_seen_at`/`is_slow_ever`. */
  async upsertSqlStatements(
    tx: EntityManager,
    statements: readonly SqlStatementRow[],
    now: Date,
  ): Promise<number> {
    let touched = 0;
    for (const batch of chunked(statements, CHUNK)) {
      const params: unknown[] = [];
      for (const s of batch) {
        params.push(
          s.queryHash,
          s.statementClass,
          s.normalizedSql,
          s.primaryTable,
          s.firstSeenAt,
          s.lastSeenAt,
          s.slowEver,
          now,
          now,
        );
      }
      const result = await tx.getConnection().execute(
        `INSERT INTO observability.sql_statements
           (query_hash, statement_class, normalized_sql, primary_table,
            first_seen_at, last_seen_at, is_slow_ever, created_at, updated_at)
         VALUES ${placeholders(batch.length, 9)}
         ON CONFLICT (query_hash) DO UPDATE SET
           first_seen_at = LEAST(sql_statements.first_seen_at, EXCLUDED.first_seen_at),
           last_seen_at = GREATEST(sql_statements.last_seen_at, EXCLUDED.last_seen_at),
           is_slow_ever = sql_statements.is_slow_ever OR EXCLUDED.is_slow_ever,
           updated_at = EXCLUDED.updated_at`,
        params,
        'run',
        tx.getTransactionContext(),
      );
      touched += affectedOf(result);
    }
    return touched;
  }

  /** Serie por minuto de SQL. `ON CONFLICT DO NOTHING`: devuelve las filas realmente nuevas. */
  async insertSqlRows(
    tx: EntityManager,
    instanceId: string,
    rows: readonly SqlMinuteRow[],
    now: Date,
  ): Promise<number> {
    let inserted = 0;
    for (const batch of chunked(rows, CHUNK)) {
      const params: unknown[] = [];
      for (const r of batch) {
        params.push(
          r.time,
          instanceId,
          r.flushSeq,
          r.queryHash,
          r.operationKey,
          r.moduleCode,
          r.executions,
          r.sumMs,
          r.maxMs,
          r.slowCount,
          r.failedCount,
          r.rowsSum,
          ...r.buckets,
          now,
        );
      }
      const result = await tx.getConnection().execute(
        `INSERT INTO observability.sql_statement_minute_series
           (time, instance_id, flush_seq, query_hash, operation_key, module_code,
            executions, sum_ms, max_ms, slow_count, failed_count, rows_sum,
            le1, le5, le10, le25, le50, le100, le250, le500, le1000, le5000, inf,
            created_at)
         VALUES ${placeholders(batch.length, 24)}
         ON CONFLICT DO NOTHING`,
        params,
        'run',
        tx.getTransactionContext(),
      );
      inserted += affectedOf(result);
    }
    return inserted;
  }

  /** Muestras de peticiones lentas/erróneas. El id lo genera el sink: reenviar no duplica. */
  async insertSlowSamples(
    tx: EntityManager,
    samples: readonly SlowRequestRow[],
    now: Date,
  ): Promise<number> {
    let inserted = 0;
    for (const batch of chunked(samples, CHUNK)) {
      const params: unknown[] = [];
      const row = '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)';
      for (const s of batch) {
        params.push(
          s.id,
          s.time,
          s.requestId,
          s.traceId,
          s.instanceId,
          s.httpMethod,
          s.routeTemplate,
          s.operationKey,
          s.moduleCode,
          s.httpStatus,
          s.durationMs,
          s.sqlCount,
          s.sqlTotalMs,
          JSON.stringify(s.sqlTop),
          s.sampledBecause,
          now,
        );
      }
      const result = await tx.getConnection().execute(
        `INSERT INTO observability.slow_request_samples
           (id, time, request_id, trace_id, instance_id, http_method, route_template,
            operation_key, module_code, http_status, duration_ms, sql_count,
            sql_total_ms, sql_top_json, sampled_because, created_at)
         VALUES ${new Array<string>(batch.length).fill(row).join(', ')}
         ON CONFLICT DO NOTHING`,
        params,
        'run',
        tx.getTransactionContext(),
      );
      inserted += affectedOf(result);
    }
    return inserted;
  }

  /**
   * Upsert de los grupos, inserción de los eventos y suma de las ocurrencias.
   *
   * `occurrences_total` sube **sólo por las filas de evento efectivamente
   * insertadas** (más las ocurrencias sin evento del lote): reenviar el mismo
   * lote no vuelve a sumar. Los grupos se recorren ordenados por huella para
   * que dos instancias que vuelcan a la vez no se interbloqueen.
   */
  async persistErrors(
    tx: EntityManager,
    drained: DrainedErrors,
    now: Date,
  ): Promise<PersistedErrors> {
    const eventsByFingerprint = new Map<string, ErrorEventRow[]>();
    for (const event of drained.events) {
      const list = eventsByFingerprint.get(event.fingerprint) ?? [];
      list.push(event);
      eventsByFingerprint.set(event.fingerprint, list);
    }

    let inserted = 0;
    let duplicated = 0;
    for (const group of drained.groups) {
      const groupId = await this.upsertGroup(tx, group, now);
      const events = eventsByFingerprint.get(group.fingerprint) ?? [];
      let groupInserted = 0;
      for (const batch of chunked(events, EVENT_CHUNK)) {
        groupInserted += await this.insertEvents(tx, groupId, batch, now);
      }
      inserted += groupInserted;
      duplicated += events.length - groupInserted;

      // Si el lote entero ya estaba (reenvío tras un commit cuya respuesta se
      // perdió) y tenía eventos, tampoco se repiten las ocurrencias sin evento.
      const alreadyApplied = events.length > 0 && groupInserted === 0;
      const delta = groupInserted + (alreadyApplied ? 0 : group.countOnly);
      if (delta > 0) {
        await tx.execute(
          `UPDATE observability.error_groups
              SET occurrences_total = occurrences_total + ?,
                  updated_at = ?
            WHERE id = ?`,
          [delta, now, groupId],
        );
      }
    }
    return {
      groups: drained.groups.length,
      eventsInserted: inserted,
      eventsDuplicated: duplicated,
    };
  }

  private async upsertGroup(
    tx: EntityManager,
    g: ErrorGroupDelta,
    now: Date,
  ): Promise<string> {
    const regressed = `(error_groups.state_concept_id = ?
        AND EXCLUDED.last_seen_at > COALESCE(error_groups.resolved_at, '-infinity'::timestamptz))`;
    const rows = await tx.execute<{ id: string }[]>(
      `INSERT INTO observability.error_groups
         (id, fingerprint, source, http_status, error_code, error_reason, exception_type,
          module_code, operation_key, http_method, route_template, title, sample_message,
          sample_frames_json, first_seen_at, last_seen_at, occurrences_total, occurrences_24h,
          state_concept_id, last_request_id, created_at, updated_at)
       VALUES (gen_random_uuid(), ?, 'api', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, 0, 0, ?, ?, ?, ?)
       ON CONFLICT (fingerprint) DO UPDATE SET
         first_seen_at = LEAST(error_groups.first_seen_at, EXCLUDED.first_seen_at),
         last_request_id = CASE WHEN EXCLUDED.last_seen_at >= error_groups.last_seen_at
                                THEN EXCLUDED.last_request_id ELSE error_groups.last_request_id END,
         last_seen_at = GREATEST(error_groups.last_seen_at, EXCLUDED.last_seen_at),
         regressed_at = CASE WHEN ${regressed} THEN EXCLUDED.last_seen_at
                             ELSE error_groups.regressed_at END,
         row_version = CASE WHEN ${regressed} THEN error_groups.row_version + 1
                            ELSE error_groups.row_version END,
         updated_at = CASE WHEN ${regressed} THEN EXCLUDED.updated_at
                           ELSE error_groups.updated_at END,
         state_concept_id = CASE WHEN ${regressed} THEN ?
                                 ELSE error_groups.state_concept_id END
       RETURNING id`,
      [
        g.fingerprint,
        g.httpStatus,
        g.errorCode,
        g.errorReason,
        g.exceptionType,
        g.moduleCode,
        g.operationKey,
        g.httpMethod,
        g.routeTemplate,
        g.title,
        g.sampleMessage,
        g.sampleFrames ? JSON.stringify(g.sampleFrames) : null,
        g.firstSeenAt,
        g.lastSeenAt,
        ERROR_GROUP_STATE.NEW,
        g.lastRequestId,
        now,
        now,
        // Los marcadores del ON CONFLICT, en el orden en que aparecen.
        ERROR_GROUP_STATE.RESOLVED,
        ERROR_GROUP_STATE.RESOLVED,
        ERROR_GROUP_STATE.RESOLVED,
        ERROR_GROUP_STATE.RESOLVED,
        ERROR_GROUP_STATE.NEW,
      ],
    );
    const id = rows[0]?.id;
    if (!id) throw new Error('error_groups upsert no devolvió id');
    return id;
  }

  /** Inserta eventos de un grupo; devuelve las filas realmente nuevas. Sin `RETURNING`. */
  private async insertEvents(
    tx: EntityManager,
    groupId: string,
    events: readonly ErrorEventRow[],
    now: Date,
  ): Promise<number> {
    const params: unknown[] = [];
    for (const e of events) {
      params.push(
        e.id,
        e.occurredAt,
        groupId,
        e.requestId,
        e.traceId,
        e.instanceId,
        e.source,
        e.httpStatus,
        e.errorCode,
        e.errorReason,
        e.exceptionType,
        e.moduleCode,
        e.operationKey,
        e.httpMethod,
        e.routeTemplate,
        e.actorTenantId,
        e.actorHash,
        e.durationMs,
        e.sqlstate,
        e.constraintName,
        e.tableName,
        e.columnName,
        e.violationsJson ? JSON.stringify(e.violationsJson) : null,
        e.messageRedacted,
        e.framesJson ? JSON.stringify(e.framesJson) : null,
        now,
      );
    }
    const row = `(${new Array<string>(26)
      .fill('?')
      .map((p, i) => (i === 22 || i === 24 ? '?::jsonb' : p))
      .join(', ')})`;
    const result = await tx.getConnection().execute(
      `INSERT INTO observability.error_events
           (id, occurred_at, error_group_id, request_id, trace_id, instance_id, source,
            http_status, error_code, error_reason, exception_type, module_code, operation_key,
            http_method, route_template, actor_tenant_id, actor_hash, duration_ms, sqlstate,
            constraint_name, table_name, column_name, violations_json, message_redacted,
            frames_json, created_at)
         VALUES ${new Array<string>(events.length).fill(row).join(', ')}
         ON CONFLICT DO NOTHING`,
      params,
      'run',
      tx.getTransactionContext(),
    );
    return affectedOf(result);
  }
}
