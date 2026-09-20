import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import type {
  AgendaNotice,
  AgendaNoticeKind,
  AgendaNoticePort,
  AgendaNoticeResult,
} from '../../src/modules/scheduling/ports/agenda-notice.port';

/**
 * Laboratorio de la capacidad de emisión de avisos de agenda (P8), contra
 * PostgreSQL real (H2, carril de Pablo — Corte, laboratorio del piloto y
 * regresión de aislamiento).
 *
 * ## Qué es y qué NO es
 *
 * Es un `AgendaNoticePort` real que persiste cada solicitud en una tabla
 * propia de Postgres, para poder listarla y compararla entre corridas. NO es
 * un mock in-memory ni un doble que vive sólo en el proceso: el registro de
 * solicitudes sobrevive al proceso que lo escribió, igual que la fila real
 * que escribiría `MessagingAgendaNoticeAdapter`.
 *
 * NO decide si la capacidad "está verificada" — eso lo dice la prueba de
 * ausencia de Itzan y los tests dirigidos existentes
 * (`scheduling-agenda-notices.service.spec.ts`,
 * `messaging-agenda-notice.adapter.spec.ts`). Este laboratorio sólo habilita
 * ejercitar la capacidad contra una base real con reset y reloj controlados.
 *
 * ## La regla de fallo (ADV-02)
 *
 * `emit()` respeta el contrato real del puerto: **nunca lanza**. Una
 * operación con un `kind` no registrado para el caso, o un error interno del
 * propio laboratorio, no interrumpen la llamada — se acumulan como fallos
 * pendientes. `close()` los revisa y **lanza si quedó alguno sin consumir**,
 * aunque el código de aplicación que llamó a `emit()` haya atrapado
 * cualquier excepción en el camino. El laboratorio falla al cierre, no en el
 * momento de la llamada — es la única forma de imponer la regla sin violar
 * el contrato del puerto que implementa.
 */

const SCHEMA = 'agenda_notice_lab';
const TABLE = 'emitted_requests';

/** Una fila del registro de solicitudes, tal como quedó en Postgres. */
export interface AgendaNoticeLabRequestRow {
  readonly seq: number;
  readonly runId: string;
  readonly kind: AgendaNoticeKind;
  readonly registered: boolean;
  readonly recipient: AgendaNotice['recipient'];
  readonly subject: string;
  readonly relatedResourceType: string;
  readonly relatedResourceId: string | null;
  readonly debounceKey: string | null;
  readonly occurredAt: Date;
}

export interface AgendaNoticeCapabilityLabOptions {
  /** Identifica esta corrida; separa sus filas de las de cualquier otra. */
  readonly runId: string;
  /** Los `kind` que este caso espera. Cualquier otro es una violación. */
  readonly registeredKinds: readonly AgendaNoticeKind[];
  /**
   * Reloj inyectado. Sin esto, `occurredAt` saldría de `Date.now()` y el caso
   * dejaría de ser reproducible entre corridas (H2.S2.M2).
   */
  readonly clock?: () => Date;
  /** Conexión ya abierta; `AgendaNoticeCapabilityLab.start` la crea si falta. */
  readonly client?: pg.Client;
}

/** Se lanza en `close()` cuando quedó al menos un fallo sin consumir. */
export class AgendaNoticeLabUnconsumedFailuresError extends Error {
  constructor(public readonly failures: readonly Error[]) {
    super(
      `El laboratorio cierra con ${failures.length} fallo(s) sin consumir: ` +
        failures.map((f) => f.message).join(' | '),
    );
    this.name = 'AgendaNoticeLabUnconsumedFailuresError';
  }
}

/** Se lanza por una operación (`kind`) que el caso no declaró esperar. */
export class UnregisteredAgendaNoticeOperationError extends Error {
  constructor(kind: string) {
    super(
      `Operación no registrada para este caso del laboratorio: kind="${kind}". ` +
        'Un harness que no falla acá está fabricando un verde falso (ADV-02).',
    );
    this.name = 'UnregisteredAgendaNoticeOperationError';
  }
}

function dbClientFromEnv(): pg.Client {
  return new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5434),
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'mantra_redesa_health',
  });
}

export class AgendaNoticeCapabilityLab implements AgendaNoticePort {
  private readonly pendingFailures: Error[] = [];
  private readonly registeredKinds: ReadonlySet<AgendaNoticeKind>;
  private readonly clock: () => Date;
  private closed = false;

  private constructor(
    private readonly runId: string,
    private readonly client: pg.Client,
    registeredKinds: readonly AgendaNoticeKind[],
    clock: (() => Date) | undefined,
  ) {
    this.registeredKinds = new Set(registeredKinds);
    this.clock = clock ?? (() => new Date());
  }

  /** Conecta, crea el esquema del laboratorio si falta, y devuelve la instancia lista. */
  static async start(
    opts: AgendaNoticeCapabilityLabOptions,
  ): Promise<AgendaNoticeCapabilityLab> {
    const client = opts.client ?? dbClientFromEnv();
    if (!opts.client) {
      await client.connect();
    }
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${SCHEMA}"."${TABLE}" (
        seq bigserial PRIMARY KEY,
        run_id text NOT NULL,
        kind text NOT NULL,
        registered boolean NOT NULL,
        recipient jsonb NOT NULL,
        subject text NOT NULL,
        related_resource_type text NOT NULL,
        related_resource_id text,
        debounce_key text,
        occurred_at timestamptz NOT NULL
      )
    `);
    return new AgendaNoticeCapabilityLab(
      opts.runId,
      client,
      opts.registeredKinds,
      opts.clock,
    );
  }

  /**
   * Emite un aviso. Nunca lanza — igual que `AgendaNoticePort` real — pero
   * un `kind` no registrado, o un error interno, quedan como fallo pendiente
   * para `close()` (ADV-02 y H2.S1.M4).
   */
  async emit(notice: AgendaNotice): Promise<AgendaNoticeResult> {
    try {
      return await this.handle(notice);
    } catch (err) {
      this.pendingFailures.push(
        err instanceof Error ? err : new Error(String(err)),
      );
      return { delivered: false, skippedReason: 'lab_internal_error' };
    }
  }

  async emitMany(
    notices: readonly AgendaNotice[],
  ): Promise<AgendaNoticeResult[]> {
    const results: AgendaNoticeResult[] = [];
    for (const notice of notices) {
      results.push(await this.emit(notice));
    }
    return results;
  }

  private async handle(notice: AgendaNotice): Promise<AgendaNoticeResult> {
    if (this.closed) {
      throw new Error('El laboratorio ya cerró: no admite más solicitudes.');
    }
    const registered = this.registeredKinds.has(notice.kind);
    if (!registered) {
      // Se registra IGUAL, para que quede trazada en el listado — descartar
      // la fila escondería justamente la operación que el caso no esperaba.
      this.pendingFailures.push(
        new UnregisteredAgendaNoticeOperationError(notice.kind),
      );
    }
    const occurredAt = this.clock();
    await this.client.query(
      `INSERT INTO "${SCHEMA}"."${TABLE}"
         (run_id, kind, registered, recipient, subject, related_resource_type,
          related_resource_id, debounce_key, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        this.runId,
        notice.kind,
        registered,
        JSON.stringify(notice.recipient),
        notice.subject,
        notice.relatedResourceType,
        notice.relatedResourceId ?? null,
        notice.debounceKey ?? null,
        occurredAt,
      ],
    );
    return {
      delivered: true,
      inAppNotificationId: randomUUID(),
      notificationRequestId: randomUUID(),
    };
  }

  /** Lista lo que se le pidió a este run, en el orden en que llegó. */
  async listRequests(): Promise<AgendaNoticeLabRequestRow[]> {
    const { rows } = await this.client.query<{
      seq: string;
      run_id: string;
      kind: AgendaNoticeKind;
      registered: boolean;
      recipient: AgendaNotice['recipient'];
      subject: string;
      related_resource_type: string;
      related_resource_id: string | null;
      debounce_key: string | null;
      occurred_at: Date;
    }>(
      `SELECT * FROM "${SCHEMA}"."${TABLE}" WHERE run_id = $1 ORDER BY seq ASC`,
      [this.runId],
    );
    return rows.map((r) => ({
      seq: Number(r.seq),
      runId: r.run_id,
      kind: r.kind,
      registered: r.registered,
      recipient: r.recipient,
      subject: r.subject,
      relatedResourceType: r.related_resource_type,
      relatedResourceId: r.related_resource_id,
      debounceKey: r.debounce_key,
      occurredAt: r.occurred_at,
    }));
  }

  /**
   * Reset completo del estado de ESTE run (H2.S2.M1): borra su registro y
   * limpia los fallos pendientes, para que el próximo caso arranque limpio.
   * No toca las filas de otros run — dos corridas con `runId` distinto no se
   * pisan aunque compartan la misma base.
   */
  async reset(): Promise<void> {
    await this.client.query(
      `DELETE FROM "${SCHEMA}"."${TABLE}" WHERE run_id = $1`,
      [this.runId],
    );
    this.pendingFailures.length = 0;
    this.closed = false;
  }

  /**
   * Cierra el laboratorio. Lanza si quedó algún fallo sin consumir —
   * incluida una operación no registrada — aunque el llamador de `emit()`
   * haya atrapado toda excepción en su propio código (ADV-02).
   */
  async close(): Promise<void> {
    this.closed = true;
    if (this.pendingFailures.length > 0) {
      const failures = [...this.pendingFailures];
      this.pendingFailures.length = 0;
      throw new AgendaNoticeLabUnconsumedFailuresError(failures);
    }
  }

  /**
   * Limpieza destructiva del esquema del laboratorio (DROP). Se niega si
   * `expectedDatabase` no coincide con la base a la que está conectado
   * (H2.S2.M3): sin este chequeo, correrla contra la `.env` equivocada borra
   * el laboratorio de otra persona, no el propio.
   */
  async dropSchema(expectedDatabase: string): Promise<void> {
    const { rows } = await this.client.query<{ db: string }>(
      'SELECT current_database() AS db',
    );
    const actual = rows[0]?.db;
    if (actual !== expectedDatabase) {
      throw new Error(
        `Limpieza rechazada: current_database()="${actual}" no coincide con ` +
          `"${expectedDatabase}". Se esperaba la base del run, no una arbitraria.`,
      );
    }
    await this.client.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  }

  /** Cierra la conexión de base. No confundir con `close()` (regla de fallo). */
  async disconnect(): Promise<void> {
    await this.client.end();
  }
}
