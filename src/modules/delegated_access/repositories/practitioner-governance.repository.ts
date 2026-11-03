import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { GOVERNANCE } from '../delegated_access.governance-concepts';

/** Una alerta abierta, tal como sale de `access_anomalies`. */
export interface OpenAnomalyRow {
  readonly id: string;
  readonly userId: string;
  /** Código completo del tipo (`delegated_access:ANOMALY_CANCEL_SPIKE`). */
  readonly kindCode: string;
  readonly windowStart: Date;
  readonly observed: number;
  readonly threshold: number;
}

/** Una aprobación de cuatro ojos que espera a quien decide. */
export interface PendingApprovalRow {
  readonly id: string;
  readonly tenantId: string;
  /** Código completo del tipo (`delegated_access:FOUR_EYES_KIND_ACTION`). */
  readonly kindCode: string;
  readonly requesterUserId: string;
  readonly subjectUserId: string | null;
  readonly permissionCode: string | null;
  readonly reasonText: string | null;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

interface RawAnomalyRow {
  id: string;
  user_id: string;
  kind_code: string;
  window_start: Date | string;
  observed_value: string | number;
  threshold_value: string | number;
}

interface RawApprovalRow {
  id: string;
  tenant_id: string;
  kind_code: string;
  requester_user_id: string;
  subject_user_id: string | null;
  permission_code: string | null;
  reason_text: string | null;
  created_at: Date | string;
  expires_at: Date | string;
}

/** Hasta dónde llegó la página anterior: el orden es (creada, id) descendente. */
export interface ApprovalsCursor {
  readonly createdAt: Date;
  readonly id: string;
}

const asDate = (value: Date | string): Date =>
  value instanceof Date ? value : new Date(value);

const placeholders = (n: number): string =>
  Array.from({ length: n }, () => '?').join(', ');

/**
 * Lecturas del gobierno de accesos que necesita «Mi equipo» del doctor. SQL
 * explícito, como `SupportLinksRepository`: cruzan `delegated_access` con
 * `terminology` para decir el tipo en palabras de la pantalla.
 */
@Injectable()
export class PractitionerGovernanceRepository {
  /**
   * Tareas de revisión de acceso que esperan a ese revisor.
   *
   * @param em - Contexto de persistencia.
   * @param reviewerUserId - Quien revisa.
   * @returns Cuántas tiene sin decidir.
   */
  async countPendingReviews(
    em: EntityManager,
    reviewerUserId: string,
  ): Promise<number> {
    const [row] = await em.execute<{ n: number | string }[]>(
      `SELECT count(*)::int AS n
         FROM delegated_access.access_review_items
        WHERE reviewer_user_id = ?
          AND decision_concept_id = ?`,
      [reviewerUserId, GOVERNANCE.REVIEW_ITEM_PENDING],
    );
    return Number(row?.n ?? 0);
  }

  /**
   * Alertas abiertas sobre la actividad de esas personas, las más recientes primero.
   *
   * @param em - Contexto de persistencia.
   * @param userIds - Las personas de su equipo.
   * @param limit - Tope de filas.
   * @returns Las alertas.
   */
  async findOpenAnomalies(
    em: EntityManager,
    userIds: readonly string[],
    limit: number,
  ): Promise<OpenAnomalyRow[]> {
    if (userIds.length === 0) return [];
    const rows = await em.execute<RawAnomalyRow[]>(
      `SELECT a.id, a.user_id, k.code AS kind_code, a.window_start,
              a.observed_value, a.threshold_value
         FROM delegated_access.access_anomalies a
         JOIN terminology.catalog_concepts k ON k.id = a.kind_concept_id
        WHERE a.status_concept_id = ?
          AND a.user_id IN (${placeholders(userIds.length)})
        ORDER BY a.window_start DESC, a.id DESC
        LIMIT ?`,
      [GOVERNANCE.ANOMALY_OPEN, ...userIds, limit],
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      kindCode: r.kind_code,
      windowStart: asDate(r.window_start),
      observed: Number(r.observed_value),
      threshold: Number(r.threshold_value),
    }));
  }

  /**
   * Aprobaciones vigentes que el doctor decide: las que pide su equipo y le
   * tocan por ser el doctor responsable. Nunca una que pidió él mismo.
   *
   * @param em - Contexto de persistencia.
   * @param filter - El doctor, su equipo, la página.
   * @returns Hasta `limit` filas, más nuevas primero.
   */
  async findPendingForDoctor(
    em: EntityManager,
    filter: {
      readonly doctorUserId: string;
      readonly teamUserIds: readonly string[];
      readonly limit: number;
      readonly after?: ApprovalsCursor;
    },
  ): Promise<PendingApprovalRow[]> {
    if (filter.teamUserIds.length === 0) return [];
    const params: unknown[] = [
      GOVERNANCE.FOUR_EYES_PENDING,
      GOVERNANCE.REVIEWER_KIND_DOCTOR_OWNER,
      filter.doctorUserId,
      ...filter.teamUserIds,
    ];
    let after = '';
    if (filter.after) {
      after = 'AND (f.created_at, f.id) < (?::timestamptz, ?::uuid)';
      params.push(filter.after.createdAt.toISOString(), filter.after.id);
    }
    params.push(filter.limit);
    const rows = await em.execute<RawApprovalRow[]>(
      `SELECT f.id, f.tenant_id, k.code AS kind_code, f.requester_user_id,
              f.subject_user_id, f.permission_code, f.reason_text,
              f.created_at, f.expires_at
         FROM delegated_access.four_eyes_requests f
         JOIN terminology.catalog_concepts k ON k.id = f.kind_concept_id
        WHERE f.status_concept_id = ?
          AND f.expires_at > now()
          AND f.approver_kind_concept_id = ?
          AND f.requester_user_id <> ?
          AND f.subject_user_id IN (${placeholders(filter.teamUserIds.length)})
          ${after}
        ORDER BY f.created_at DESC, f.id DESC
        LIMIT ?`,
      params,
    );
    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      kindCode: r.kind_code,
      requesterUserId: r.requester_user_id,
      subjectUserId: r.subject_user_id,
      permissionCode: r.permission_code,
      reasonText: r.reason_text,
      createdAt: asDate(r.created_at),
      expiresAt: asDate(r.expires_at),
    }));
  }
}
