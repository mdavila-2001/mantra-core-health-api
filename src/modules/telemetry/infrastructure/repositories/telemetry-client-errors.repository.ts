import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';

/** Fila ya saneada lista para insertar. */
export interface ClientErrorRow {
  receivedAt: Date;
  occurredAt: Date;
  portalTypeConceptId: string;
  actorTenantId: string | null;
  userId: string | null;
  sessionId: string | null;
  routeTemplate: string | null;
  fingerprint: string;
  errorClassConceptId: string;
  errorType: string;
  sanitizedMessage: string | null;
  httpMethod: string | null;
  apiRouteTemplate: string | null;
  httpStatus: number | null;
  apiErrorCode: string | null;
  requestId: string | null;
  supportCode: string | null;
  appVersion: string;
  buildId: string | null;
  screenSize: string | null;
  isOnline: boolean | null;
  suppressedCount: number;
}

/**
 * Escritura de `telemetry.client_error_events`.
 *
 * La política RLS de la tabla permite `INSERT ... WITH CHECK (true)` a cualquiera
 * pero el `SELECT` sólo al tenant del actor o al contexto de sistema: por eso el
 * insert es SQL directo **sin `RETURNING`** (un `RETURNING` exige poder leer la
 * fila y un anónimo no puede). Tampoco se usa el ORM, que lo añade.
 */
@Injectable()
export class TelemetryClientErrorsRepository {
  constructor(private readonly em: EntityManager) {}

  async insertMany(rows: readonly ClientErrorRow[]): Promise<void> {
    if (rows.length === 0) return;
    const cols = `id, received_at, occurred_at, portal_type_concept_id, actor_tenant_id, user_id,
      session_id, route_template, fingerprint, error_class_concept_id, error_type, sanitized_message,
      http_method, api_route_template, http_status, api_error_code, request_id, support_code,
      app_version, build_id, screen_size, is_online, suppressed_count`;
    const tuple = `(${Array.from({ length: 23 }, () => '?').join(', ')})`;
    const params: unknown[] = [];
    for (const r of rows) {
      params.push(
        randomUUID(), r.receivedAt, r.occurredAt, r.portalTypeConceptId, r.actorTenantId,
        r.userId, r.sessionId, r.routeTemplate, r.fingerprint, r.errorClassConceptId,
        r.errorType, r.sanitizedMessage, r.httpMethod, r.apiRouteTemplate, r.httpStatus,
        r.apiErrorCode, r.requestId, r.supportCode, r.appVersion, r.buildId, r.screenSize,
        r.isOnline, r.suppressedCount,
      );
    }
    await this.em
      .getConnection()
      .execute(
        `INSERT INTO telemetry.client_error_events (${cols}) VALUES ${rows.map(() => tuple).join(', ')}`,
        params,
        'run',
      );
  }

  /** `iam.sessions.id` del token del actor, o `null` si no es suya. */
  async sessionIdOf(userId: string, tokenId: string): Promise<string | null> {
    const rows = await this.em
      .getConnection()
      .execute<{ id: string }[]>(
        'SELECT id FROM iam.sessions WHERE user_id = ? AND token_id = ?',
        [userId, tokenId],
        'all',
      );
    return rows[0]?.id ?? null;
  }
}
