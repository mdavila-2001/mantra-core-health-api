import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';

export interface SummaryBucketRow {
  key: string | null;
  events: number;
  distinct_actors: number;
}

export interface SummaryTotalsRow {
  events: number;
  distinct_actors: number;
  patient_scoped_events: number;
}

export interface DailyRow {
  day: string;
  events: number;
}

export interface DsarRow {
  id: string;
  user_id: string;
  type: string | null;
  status: string | null;
  jurisdiction: string | null;
  requested_at: string;
  completed_at: string | null;
  has_result_file: boolean;
  row_version: number;
  created_at: string;
  updated_at: string;
}

export interface DsarFilter {
  status?: string;
  type?: string;
  from?: Date;
  to?: Date;
  cursor?: { t: string; i: string };
  limit: number;
}

/** Dimensiones agregables de `data_access_log` (lista blanca: se interpolan en el SQL). */
export type SummaryDimension = 'purpose' | 'resource_type' | 'operation';

/** Ver `nombreConcepto` de system_ops: el código almacenado de un concepto de módulo es su clave. */
const nombreConcepto = (columna: string): string =>
  `regexp_replace(${columna}, '^.*:', '')`;

const DIMENSION_SQL: Record<SummaryDimension, string> = {
  purpose: 'd.purpose',
  resource_type: 'd.resource_type',
  operation: nombreConcepto('ac.code'),
};

/**
 * Lecturas agregadas de supervisión: resumen de accesos a datos y solicitudes DSAR. **Sólo `select`**.
 * El resumen nunca devuelve ids de paciente ni de recurso: sólo conteos por grupo.
 */
@Injectable()
export class AuditOversightReadRepository {
  private q<T = unknown>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  async accessTotals(
    em: EntityManager,
    from: Date,
    to: Date,
  ): Promise<SummaryTotalsRow> {
    const [fila] = await this.q<SummaryTotalsRow[]>(
      em,
      `select count(*)::int as events, count(distinct d.user_id)::int as distinct_actors,
              (count(*) filter (where d.patient_profile_id is not null))::int as patient_scoped_events
         from audit.data_access_log d
        where d.recorded_at >= ?::timestamptz and d.recorded_at < ?::timestamptz`,
      [from, to],
    );
    return fila ?? { events: 0, distinct_actors: 0, patient_scoped_events: 0 };
  }

  accessBuckets(
    em: EntityManager,
    dim: SummaryDimension,
    from: Date,
    to: Date,
  ): Promise<SummaryBucketRow[]> {
    const col = DIMENSION_SQL[dim];
    return this.q<SummaryBucketRow[]>(
      em,
      `select ${col}::text as key, count(*)::int as events, count(distinct d.user_id)::int as distinct_actors
         from audit.data_access_log d
         left join terminology.catalog_concepts ac on ac.id = d.action_concept_id
        where d.recorded_at >= ?::timestamptz and d.recorded_at < ?::timestamptz
        group by 1
        order by events desc, key asc nulls last`,
      [from, to],
    );
  }

  accessDaily(em: EntityManager, from: Date, to: Date): Promise<DailyRow[]> {
    return this.q<DailyRow[]>(
      em,
      `select to_char(date_trunc('day', d.recorded_at at time zone 'UTC'), 'YYYY-MM-DD') as day, count(*)::int as events
         from audit.data_access_log d
        where d.recorded_at >= ?::timestamptz and d.recorded_at < ?::timestamptz
        group by 1 order by 1`,
      [from, to],
    );
  }

  private dsarSelect(): string {
    return `select r.id, r.user_id, ${nombreConcepto('tc.code')}::text as type, ${nombreConcepto('sc.code')}::text as status, ${nombreConcepto('jc.code')}::text as jurisdiction,
              ${isoTimestampSql('r.requested_at')} as requested_at, ${isoTimestampSql('r.completed_at')} as completed_at,
              (r.result_file_id is not null) as has_result_file, r.row_version,
              ${isoTimestampSql('r.created_at')} as created_at, ${isoTimestampSql('r.updated_at')} as updated_at
         from audit.dsar_requests r
         left join terminology.catalog_concepts tc on tc.id = r.type_concept_id
         left join terminology.catalog_concepts sc on sc.id = r.status_concept_id
         left join terminology.catalog_concepts jc on jc.id = r.jurisdiction_concept_id`;
  }

  dsarList(em: EntityManager, f: DsarFilter): Promise<DsarRow[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (sql: string, ...v: unknown[]): void => {
      where.push(sql);
      params.push(...v);
    };
    if (f.status) add(`${nombreConcepto('sc.code')} = ?`, f.status);
    if (f.type) add(`${nombreConcepto('tc.code')} = ?`, f.type);
    if (f.from) add('r.requested_at >= ?::timestamptz', f.from);
    if (f.to) add('r.requested_at < ?::timestamptz', f.to);
    if (f.cursor)
      add(
        '(r.requested_at, r.id) < (?::timestamptz, ?::uuid)',
        f.cursor.t,
        f.cursor.i,
      );
    return this.q<DsarRow[]>(
      em,
      `${this.dsarSelect()}
       ${where.length ? `where ${where.join(' and ')}` : ''}
       order by r.requested_at desc, r.id desc
       limit ?`,
      [...params, f.limit + 1],
    );
  }

  async dsarById(em: EntityManager, id: string): Promise<DsarRow | null> {
    const [fila] = await this.q<DsarRow[]>(
      em,
      `${this.dsarSelect()} where r.id = ?::uuid`,
      [id],
    );
    return fila ?? null;
  }
}
