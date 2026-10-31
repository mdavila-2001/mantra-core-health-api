import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { withSystemWrite } from '../../../common';
import { GrantUsageStats } from '../entities';

/** Incremento de uso de un permiso en un bloque horario. */
export interface UsageDelta {
  /** Organización. */
  readonly tenantId: string;
  /** Persona de apoyo. */
  readonly userId: string;
  /** Concesión. */
  readonly supportScopeGrantId: string;
  /** Átomo (o alias) usado. */
  readonly permissionCode: string;
  /** Hora UTC truncada del bloque. */
  readonly bucketStart: Date;
  /** Decisiones `PERMIT` a sumar. */
  readonly permit: number;
  /** Decisiones `DENY` a sumar. */
  readonly deny: number;
  /** Decisiones `CHALLENGE` a sumar. */
  readonly challenge: number;
  /** Usos fuera de horario a sumar. */
  readonly offHours: number;
  /** Pacientes distintos vistos en el bloque (se conserva el mayor, no se suma). */
  readonly distinctPatients: number;
  /** Último uso. */
  readonly lastUsedAt?: Date;
}

/** Filtro de la lectura de uso. */
export interface UsageFilter {
  /** Solo esta persona. */
  readonly userId?: string;
}

const TABLE = '"delegated_access"."grant_usage_stats"';

/** Acceso a datos de `delegated_access.grant_usage_stats` (uso agregado por hora). */
@Injectable()
export class GrantUsageStatsRepository {
  /**
   * Vuelca un lote de incrementos con UPSERT que SUMA contadores sobre la llave
   * `(tenant_id, support_scope_grant_id, permission_code, bucket_start)`. El
   * lote del grabador mezcla organizaciones, así que con RLS abre el contexto
   * de sistema solo para esta escritura (y lo devuelve); sin transacción abre
   * la suya. Perder ≤ 30 s de estadística en una caída es aceptable: no es
   * evidencia.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param deltas - Incrementos a volcar.
   */
  async upsertBuckets(
    em: EntityManager,
    deltas: readonly UsageDelta[],
  ): Promise<void> {
    if (deltas.length === 0) return;
    const now = new Date();
    const params: unknown[] = [];
    const tuples = deltas.map((d) => {
      params.push(
        randomUUID(),
        d.tenantId,
        d.userId,
        d.supportScopeGrantId,
        d.permissionCode,
        d.bucketStart,
        d.permit,
        d.deny,
        d.challenge,
        d.offHours,
        d.distinctPatients,
        d.lastUsedAt ?? null,
        now,
      );
      return '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    });
    const sql =
      `insert into ${TABLE} (id, tenant_id, user_id, support_scope_grant_id, permission_code, bucket_start, ` +
      'permit_count, deny_count, challenge_count, off_hours_count, distinct_patients_in_bucket, last_used_at, updated_at) values ' +
      tuples.join(', ') +
      ' on conflict (tenant_id, support_scope_grant_id, permission_code, bucket_start) do update set ' +
      'permit_count = grant_usage_stats.permit_count + excluded.permit_count, ' +
      'deny_count = grant_usage_stats.deny_count + excluded.deny_count, ' +
      'challenge_count = grant_usage_stats.challenge_count + excluded.challenge_count, ' +
      'off_hours_count = grant_usage_stats.off_hours_count + excluded.off_hours_count, ' +
      'distinct_patients_in_bucket = greatest(grant_usage_stats.distinct_patients_in_bucket, excluded.distinct_patients_in_bucket), ' +
      'last_used_at = greatest(grant_usage_stats.last_used_at, excluded.last_used_at), ' +
      'updated_at = excluded.updated_at';
    const run = (tx: EntityManager): Promise<void> =>
      withSystemWrite(tx, async (db) => {
        await db.execute(sql, params);
      });
    if (em.isInTransaction()) {
      await run(em);
    } else {
      await em.transactional(run);
    }
  }

  /**
   * Uso de una organización desde una fecha, en orden de tiempo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param since - Desde (inclusive).
   * @param filter - Filtro opcional por persona.
   * @returns Las filas de uso.
   */
  findSince(
    em: EntityManager,
    tenantId: string,
    since: Date,
    filter: UsageFilter = {},
  ): Promise<GrantUsageStats[]> {
    return em.find(
      GrantUsageStats,
      {
        tenantId,
        ...(filter.userId ? { userId: filter.userId } : {}),
        bucketStart: { $gte: since },
      },
      { orderBy: { bucketStart: 'asc', id: 'asc' } },
    );
  }

  /**
   * Último uso de cada concesión, en una sola consulta agregada.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param grantIds - Concesiones consultadas.
   * @returns Un mapa `concesión → último uso` (sin entrada si nunca se usó).
   */
  async lastUsedByGrant(
    em: EntityManager,
    tenantId: string,
    grantIds: readonly string[],
  ): Promise<Map<string, Date>> {
    const out = new Map<string, Date>();
    if (grantIds.length === 0) return out;
    const marks = grantIds.map(() => '?').join(', ');
    const rows = await em.execute<
      { support_scope_grant_id: string; last_used_at: Date | null }[]
    >(
      `select support_scope_grant_id, max(last_used_at) as last_used_at from ${TABLE} ` +
        `where tenant_id = ? and support_scope_grant_id in (${marks}) group by support_scope_grant_id`,
      [tenantId, ...grantIds],
    );
    for (const row of rows) {
      // `execute` crudo entrega el instante como texto (no hay entidad que lo convierta).
      if (row.last_used_at)
        out.set(row.support_scope_grant_id, new Date(row.last_used_at));
    }
    return out;
  }

  /**
   * Retención: purga los bloques anteriores a una fecha (400 días en producción).
   * Cruza organizaciones, así que corre con el contexto de sistema solo para esta escritura.
   *
   * @param em - Transacción activa o contexto de persistencia.
   * @param before - Se borra lo anterior a esta fecha.
   * @returns Cuántas filas se purgaron.
   */
  async purgeBefore(em: EntityManager, before: Date): Promise<number> {
    const run = (tx: EntityManager): Promise<number> =>
      withSystemWrite(tx, (db) =>
        db.nativeDelete(GrantUsageStats, { bucketStart: { $lt: before } }),
      );
    return em.isInTransaction() ? run(em) : em.transactional(run);
  }
}
