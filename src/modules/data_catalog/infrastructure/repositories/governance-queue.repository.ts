import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../../common/pagination/iso-timestamp-sql';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { SOURCE_CODE } from '../../domain/catalog/catalog.constants';
import type {
  JobType,
  ReviewQueueKind,
} from '../../presentation/dto/governance-queue.dto';

export interface ReviewQueueRow {
  annotation_id: string;
  kind: ReviewQueueKind;
  object_id: string;
  column_id: string | null;
  schema_name: string;
  object_name: string;
  column_name: string | null;
  sensitivity: string;
  origin: string;
  revision_no: number;
  submitted_by_user_id: string | null;
  updated_at: string;
}

export interface ReviewQueueFilter {
  kind?: ReviewQueueKind;
  schema?: string;
  cursor?: { t: string; i: string };
  limit: number;
}

export interface JobRow {
  type: JobType;
  id: string;
  status: string;
  requested_by_user_id: string | null;
  requested_at: string;
  started_at: string | null;
  finished_at: string | null;
  lease_owner: string | null;
  lease_expires_at: string | null;
  counters: Record<string, number | string | null>;
  error_code: string | null;
  has_error: boolean;
  sort_at: string;
}

export interface JobsFilter {
  type?: JobType;
  status?: string;
  from: Date;
  to?: Date;
  cursor?: { t: string; ty: string; i: string };
  limit: number;
}

const ORIGEN = `'${SOURCE_CODE}'`;

/**
 * Agregadores de lectura del gobierno de datos: cola de revisión de fichas y trabajos (escaneos,
 * clasificaciones, retenciones). **Sólo `select`**, sólo metadatos: ningún texto de ficha, ningún
 * mensaje de error (pueden citar valores).
 */
@Injectable()
export class GovernanceQueueRepository {
  private q<T = unknown>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  private reviewWhere(f: { kind?: ReviewQueueKind; schema?: string }) {
    const where: string[] = [`a.review_status = 'NEEDS_REVIEW'`];
    const params: unknown[] = [];
    if (f.kind) {
      where.push('a.target_kind = ?');
      params.push(f.kind);
    }
    if (f.schema) {
      where.push('o.schema_name = ?');
      params.push(f.schema);
    }
    return { where, params };
  }

  /** Fichas `NEEDS_REVIEW`, la más antigua primero (orden `updated_at, id`). */
  reviewQueue(
    em: EntityManager,
    f: ReviewQueueFilter,
  ): Promise<ReviewQueueRow[]> {
    const { where, params } = this.reviewWhere(f);
    if (f.cursor) {
      where.push('(a.updated_at, a.id) > (?::timestamptz, ?::uuid)');
      params.push(f.cursor.t, f.cursor.i);
    }
    return this.q<ReviewQueueRow[]>(
      em,
      `select a.id as annotation_id, a.target_kind::text as kind, o.id as object_id, c.id as column_id,
              o.schema_name::text as schema_name, o.object_name::text as object_name, c.column_name::text as column_name,
              a.sensitivity::text as sensitivity, a.origin::text as origin, a.current_revision_no as revision_no,
              (select r.author_user_id from data_catalog.catalog_annotation_revisions r
                where r.annotation_id = a.id and r.revision_no = a.current_revision_no) as submitted_by_user_id,
              ${isoTimestampSql('a.updated_at')} as updated_at
         from data_catalog.catalog_annotations a
         join data_catalog.catalog_objects o on o.id = a.object_id and o.source_code = ${ORIGEN}
         left join data_catalog.catalog_columns c on c.id = a.column_id
        where ${where.join(' and ')}
        order by a.updated_at, a.id
        limit ?`,
      [...params, f.limit + 1],
    );
  }

  reviewQueueCounts(
    em: EntityManager,
    f: { schema?: string },
  ): Promise<{ kind: ReviewQueueKind; total: number }[]> {
    const { where, params } = this.reviewWhere({ schema: f.schema });
    return this.q(
      em,
      `select a.target_kind::text as kind, count(*)::int as total
         from data_catalog.catalog_annotations a
         join data_catalog.catalog_objects o on o.id = a.object_id and o.source_code = ${ORIGEN}
        where ${where.join(' and ')}
        group by 1`,
      params,
    );
  }

  /**
   * Trabajos de tres fuentes en una relación común, estado normalizado a
   * `QUEUED|RUNNING|SUCCEEDED|FAILED|CANCELLED`:
   *  - `catalog_scan_runs` (tabla propia),
   *  - `retention_executions` (tabla propia, código `SO_EXEC_*`),
   *  - corridas de clasificación: **no se persisten**; sólo queda el sello de `audit.audit_log`
   *    (`CATALOG_CLASSIFICATION_RUN`): quién, cuándo y si salió bien, sin contadores ni duración.
   */
  jobs(em: EntityManager, f: JobsFilter): Promise<JobRow[]> {
    const where: string[] = ['sort_at >= ?::timestamptz'];
    const params: unknown[] = [f.from];
    if (f.to) {
      where.push('sort_at < ?::timestamptz');
      params.push(f.to);
    }
    if (f.type) {
      where.push('type = ?');
      params.push(f.type);
    }
    if (f.status) {
      where.push('status = ?');
      params.push(f.status);
    }
    if (f.cursor) {
      where.push('(sort_at, type, id) < (?::timestamptz, ?, ?::uuid)');
      params.push(f.cursor.t, f.cursor.ty, f.cursor.i);
    }
    return this.q<JobRow[]>(
      em,
      `with j as (
         select 'CATALOG_SCAN'::text as type, s.id, s.status::text as status, s.requested_by_user_id,
                s.requested_at, s.started_at, s.finished_at, s.lease_owner::text as lease_owner, s.lease_expires_at,
                jsonb_build_object('objectsObserved', s.objects_observed, 'columnsObserved', s.columns_observed,
                  'objectsAdded', s.objects_added, 'objectsChanged', s.objects_changed,
                  'objectsNotObserved', s.objects_not_observed, 'columnsAdded', s.columns_added,
                  'columnsChanged', s.columns_changed, 'columnsNotObserved', s.columns_not_observed,
                  'attempt', s.attempt) as counters,
                s.error_code::text as error_code, (s.error_code is not null or s.error_message is not null) as has_error,
                s.requested_at as sort_at
           from data_catalog.catalog_scan_runs s
         union all
         select 'RETENTION', e.id,
                coalesce(replace(regexp_replace(sc.code, '^.*:', ''), 'EXEC_', ''), 'UNKNOWN')::text,
                e.recorded_by_user_id, e.recorded_at, e.started_at, e.finished_at, null::text, null::timestamptz,
                jsonb_build_object('scanned', e.total_scanned, 'deleted', e.total_deleted,
                  'anonymized', e.total_anonymized, 'archived', e.total_archived),
                null::text, (e.error_text is not null), e.recorded_at
           from system_ops.retention_executions e
           left join terminology.catalog_concepts sc on sc.id = e.status_concept_id
         union all
         select 'CLASSIFICATION', l.id,
                (case when l.outcome_concept_id = ?::uuid then 'SUCCEEDED' else 'FAILED' end)::text,
                l.user_id, l.recorded_at, null::timestamptz, l.recorded_at, null::text, null::timestamptz,
                '{}'::jsonb, null::text, (l.outcome_concept_id <> ?::uuid), l.recorded_at
           from audit.audit_log l
          where l.action = 'CATALOG_CLASSIFICATION_RUN' and l.recorded_at >= ?::timestamptz
       )
       select type, id, status, requested_by_user_id, ${isoTimestampSql('requested_at')} as requested_at,
              ${isoTimestampSql('started_at')} as started_at, ${isoTimestampSql('finished_at')} as finished_at,
              lease_owner, ${isoTimestampSql('lease_expires_at')} as lease_expires_at, counters, error_code, has_error,
              ${isoTimestampSql('sort_at')} as sort_at
         from j
        where ${where.join(' and ')}
        order by sort_at desc, type desc, id desc
        limit ?`,
      [
        CONCEPTS.OUTCOME_SUCCESS,
        CONCEPTS.OUTCOME_SUCCESS,
        f.from,
        ...params,
        f.limit + 1,
      ],
    );
  }
}
