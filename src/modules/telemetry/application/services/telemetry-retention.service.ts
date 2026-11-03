import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

/** Tope de eventos por lote y de lotes por corrida: la purga no monopoliza la base. */
export const RETENTION_DEFAULT_BATCH = 1_000;
export const RETENTION_MAX_BATCH = 5_000;
export const RETENTION_DEFAULT_MAX_BATCHES = 10;
export const RETENTION_MAX_BATCHES = 100;
/** Retención de `client_error_events` si el entorno no la fija (03 §4.3). */
export const CLIENT_ERROR_RETENTION_DEFAULT_DAYS = 90;

const DAY_MS = 86_400_000;

export interface RetentionPurposeResult {
  purposeCode: string;
  retentionDays: number;
  cutoff: string;
  events: number;
  properties: number;
  batches: number;
  /** `true` si quedan filas vencidas por tope de lotes: otra corrida las toma. */
  more: boolean;
}

export interface RetentionResult {
  now: string;
  purposes: RetentionPurposeResult[];
  clientErrors: {
    retentionDays: number;
    cutoff: string;
    deleted: number;
    batches: number;
    more: boolean;
  };
  totalEvents: number;
  totalProperties: number;
  totalClientErrors: number;
  /** Propósitos sin `default_retention_days`: conservan indefinidamente y se declaran. */
  withoutRetention: string[];
}

export interface RetentionOptions {
  batchSize?: number;
  maxBatches?: number;
  now?: Date;
}

const placeholders = (n: number) =>
  Array.from({ length: n }, () => '?').join(', ');

/**
 * Purga por retención de `telemetry.user_activity_events` (y sus propiedades)
 * según `tracking_purpose_definitions.default_retention_days` del propósito de
 * cada evento (vía su esquema), y de `client_error_events` (90 días por
 * defecto). Corre en contexto de sistema (`SYSTEM`), en lotes acotados y es
 * idempotente: una segunda corrida sobre el mismo corte no borra nada.
 *
 * Un propósito sin retención declarada NO se purga (decisión de privacidad
 * pendiente) y se informa en `withoutRetention`. Las referencias a un evento
 * borrado (`session_journeys.entry/exit_event_id`, `web_vitals`,
 * `conversion_events`) se ponen en NULL antes de borrar: el agregado sobrevive,
 * el evento no.
 */
@Injectable()
export class TelemetryRetentionService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelemetryRetentionService.name);
  }

  private sql<T>(query: string, params: unknown[] = []) {
    return this.em.getConnection().execute<T[]>(query, params, 'all');
  }

  async purge(options: RetentionOptions = {}): Promise<RetentionResult> {
    const now = options.now ?? new Date();
    const batchSize = Math.min(
      RETENTION_MAX_BATCH,
      Math.max(1, options.batchSize ?? RETENTION_DEFAULT_BATCH),
    );
    const maxBatches = Math.min(
      RETENTION_MAX_BATCHES,
      Math.max(1, options.maxBatches ?? RETENTION_DEFAULT_MAX_BATCHES),
    );

    const purposes = await this.sql<{
      id: string;
      purpose_code: string;
      days: number | null;
    }>(
      `SELECT id, purpose_code, default_retention_days AS days
         FROM telemetry.tracking_purpose_definitions ORDER BY purpose_code`,
    );
    const results: RetentionPurposeResult[] = [];
    const withoutRetention: string[] = [];
    for (const purpose of purposes) {
      const days = purpose.days === null ? null : Number(purpose.days);
      if (days === null || !(days > 0)) {
        withoutRetention.push(purpose.purpose_code);
        continue;
      }
      results.push(
        await this.purgePurpose(
          purpose.id,
          purpose.purpose_code,
          days,
          now,
          batchSize,
          maxBatches,
        ),
      );
    }

    const errDays = Number(process.env.TELEMETRY_CLIENT_ERROR_RETENTION_DAYS);
    const clientDays =
      Number.isInteger(errDays) && errDays > 0
        ? errDays
        : CLIENT_ERROR_RETENTION_DEFAULT_DAYS;
    const clientErrors = await this.purgeClientErrors(
      clientDays,
      now,
      batchSize,
      maxBatches,
    );

    const result: RetentionResult = {
      now: now.toISOString(),
      purposes: results,
      clientErrors,
      totalEvents: results.reduce((a, r) => a + r.events, 0),
      totalProperties: results.reduce((a, r) => a + r.properties, 0),
      totalClientErrors: clientErrors.deleted,
      withoutRetention,
    };
    this.logger.info(
      {
        operation: 'telemetry.retention.purge',
        events: result.totalEvents,
        properties: result.totalProperties,
        clientErrors: result.totalClientErrors,
        withoutRetention,
      },
      'Retention purge finished',
    );
    return result;
  }

  private async purgePurpose(
    purposeId: string,
    purposeCode: string,
    days: number,
    now: Date,
    batchSize: number,
    maxBatches: number,
  ): Promise<RetentionPurposeResult> {
    const cutoff = new Date(now.getTime() - days * DAY_MS);
    let events = 0;
    let properties = 0;
    let batches = 0;
    let more = false;
    while (batches < maxBatches) {
      const ids = (
        await this.sql<{ id: string }>(
          `SELECT e.id FROM telemetry.user_activity_events e
             JOIN telemetry.activity_event_schema_definitions d ON d.id = e.event_schema_definition_id
            WHERE d.purpose_definition_id = ? AND coalesce(e.received_at, e.created_at) < ?
            ORDER BY coalesce(e.received_at, e.created_at), e.id LIMIT ?`,
          [purposeId, cutoff, batchSize],
        )
      ).map((r) => r.id);
      if (ids.length === 0) break;
      const removed = await this.em.transactional(async (tx) => {
        const ph = placeholders(ids.length);
        await tx.execute(
          `UPDATE telemetry.session_journeys SET entry_event_id = NULL WHERE entry_event_id IN (${ph})`,
          ids,
          'run',
        );
        await tx.execute(
          `UPDATE telemetry.session_journeys SET exit_event_id = NULL WHERE exit_event_id IN (${ph})`,
          ids,
          'run',
        );
        await tx.execute(
          `UPDATE telemetry.web_vitals SET user_activity_event_id = NULL WHERE user_activity_event_id IN (${ph})`,
          ids,
          'run',
        );
        await tx.execute(
          `UPDATE telemetry.conversion_events SET completion_event_id = NULL WHERE completion_event_id IN (${ph})`,
          ids,
          'run',
        );
        const props = await tx.execute<{ n: number }[]>(
          `WITH d AS (DELETE FROM telemetry.user_activity_event_properties WHERE user_activity_event_id IN (${ph}) RETURNING 1)
           SELECT count(*)::int AS n FROM d`,
          ids,
          'all',
        );
        const evs = await tx.execute<{ n: number }[]>(
          `WITH d AS (DELETE FROM telemetry.user_activity_events WHERE id IN (${ph}) RETURNING 1)
           SELECT count(*)::int AS n FROM d`,
          ids,
          'all',
        );
        return { props: props[0]?.n ?? 0, evs: evs[0]?.n ?? 0 };
      });
      events += removed.evs;
      properties += removed.props;
      batches += 1;
      if (ids.length < batchSize) break;
      if (batches === maxBatches) more = true;
    }
    return {
      purposeCode,
      retentionDays: days,
      cutoff: cutoff.toISOString(),
      events,
      properties,
      batches,
      more,
    };
  }

  private async purgeClientErrors(
    days: number,
    now: Date,
    batchSize: number,
    maxBatches: number,
  ) {
    const cutoff = new Date(now.getTime() - days * DAY_MS);
    let deleted = 0;
    let batches = 0;
    let more = false;
    while (batches < maxBatches) {
      const rows = await this.sql<{ n: number }>(
        `WITH d AS (
           DELETE FROM telemetry.client_error_events
            WHERE id IN (SELECT id FROM telemetry.client_error_events WHERE received_at < ? ORDER BY received_at LIMIT ?)
           RETURNING 1)
         SELECT count(*)::int AS n FROM d`,
        [cutoff, batchSize],
      );
      const n = rows[0]?.n ?? 0;
      if (n === 0) break;
      deleted += n;
      batches += 1;
      if (n < batchSize) break;
      if (batches === maxBatches) more = true;
    }
    return {
      retentionDays: days,
      cutoff: cutoff.toISOString(),
      deleted,
      batches,
      more,
    };
  }
}
