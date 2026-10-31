import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DSAR_JURISDICTION_CONCEPT,
  DSAR_STATUS_CONCEPT,
  DSAR_TYPE_CONCEPT,
  type DsarJurisdiction,
  type DsarStatus,
  type DsarType,
} from '../governance_admin.constants';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import { SqlFilter } from '../sql-filter';
import type { Keyset } from '../keyset';

export interface DsarRow {
  id: string;
  user_id: string;
  type_concept_id: string;
  status_concept_id: string;
  jurisdiction_concept_id: string | null;
  requested_at: Date;
  /** Marca con microsegundos, para el cursor. */
  requested_at_key: string;
  completed_at: Date | null;
  result_file_id: string | null;
  updated_at: Date;
  row_version: number;
}

export interface DsarFilters {
  status?: DsarStatus;
  type?: DsarType;
  jurisdiction?: DsarJurisdiction;
}

const COLS = `id, user_id, type_concept_id, status_concept_id, jurisdiction_concept_id,
  requested_at, ${isoTimestampSql('requested_at')} as requested_at_key,
  completed_at, result_file_id, updated_at, row_version`;

/** Lecturas de `audit.dsar_requests`. La escritura sigue siendo `PATCH /privacy/dsar/:id`. */
@Injectable()
export class PrivacyRequestsRepository {
  private q<T = unknown>(em: EntityManager, sql: string, params: unknown[] = []): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  private filter(f: DsarFilters): SqlFilter {
    const w = new SqlFilter();
    if (f.status) w.add('status_concept_id = ?', DSAR_STATUS_CONCEPT[f.status]);
    if (f.type) w.add('type_concept_id = ?', DSAR_TYPE_CONCEPT[f.type]);
    if (f.jurisdiction)
      w.add('jurisdiction_concept_id = ?', DSAR_JURISDICTION_CONCEPT[f.jurisdiction]);
    return w;
  }

  async count(em: EntityManager, f: DsarFilters): Promise<number> {
    const w = this.filter(f);
    const rows = await this.q<{ n: string }[]>(
      em,
      `select count(*) as n from audit.dsar_requests ${w.where}`,
      w.params,
    );
    return Number(rows[0]?.n ?? 0);
  }

  /** Más antiguas primero: una solicitud sin atender no puede quedar enterrada bajo las nuevas. */
  list(em: EntityManager, f: DsarFilters, limit: number, after?: Keyset): Promise<DsarRow[]> {
    const w = this.filter(f);
    if (after) {
      const c = w.param(after.c);
      const i = w.param(after.i);
      w.addRaw(`(requested_at, id) > (${c}::timestamptz, ${i}::uuid)`);
    }
    const lim = w.param(limit);
    return this.q<DsarRow[]>(
      em,
      `select ${COLS} from audit.dsar_requests ${w.where}
       order by requested_at asc, id asc limit ${lim}`,
      w.params,
    );
  }

  async find(em: EntityManager, id: string): Promise<DsarRow | null> {
    const rows = await this.q<DsarRow[]>(
      em,
      `select ${COLS} from audit.dsar_requests where id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  /** Cantidad por estado, sobre toda la tabla: es lo que el resumen de la lista enseña. */
  countsByStatus(em: EntityManager): Promise<{ status_concept_id: string; n: string }[]> {
    return this.q(
      em,
      `select status_concept_id, count(*) as n from audit.dsar_requests group by status_concept_id`,
    );
  }
}
