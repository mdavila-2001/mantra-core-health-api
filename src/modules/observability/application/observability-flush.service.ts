import {
  Inject,
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  errorSink,
  httpSink,
  instanceIdentity,
  slowRequestSink,
  sqlSink,
  type DrainedErrors,
  type DrainedSql,
  type ErrorSink,
  type HttpMinuteRow,
  type HttpSink,
  type InstanceIdentity,
  type ObservabilityEnv,
  type SlowRequestRow,
  type SlowRequestSink,
  type SqlSink,
} from '../../../observability/capture';
import { ObservabilityWriteRepository } from '../infrastructure/observability-write.repository';

export const OBSERVABILITY_ENV = Symbol('OBSERVABILITY_ENV');
export const OBSERVABILITY_SINKS = Symbol('OBSERVABILITY_SINKS');

/** Los sinks que el servicio drena (inyectables para las pruebas). */
export interface ObservabilitySinks {
  readonly http: HttpSink;
  readonly errors: ErrorSink;
  readonly sql: SqlSink;
  readonly slow: SlowRequestSink;
  readonly identity: InstanceIdentity;
}

export const defaultSinks: ObservabilitySinks = {
  http: httpSink,
  errors: errorSink,
  sql: sqlSink,
  slow: slowRequestSink,
  identity: instanceIdentity,
};

/** Un lote tal como se drenó: es lo que se reintenta, con las mismas claves. */
interface FlushBatch {
  readonly http: HttpMinuteRow[];
  readonly errors: DrainedErrors;
  readonly sql: DrainedSql;
  readonly slow: SlowRequestRow[];
}

/** Estado de la propia medición, para `GET /coverage`. */
export interface FlushStatus {
  readonly lastFlushAt: Date | null;
  readonly lastFlushRows: number;
  readonly lastFlushDurationMs: number | null;
  readonly droppedFlushes: number;
  readonly lastFailureAt: Date | null;
  readonly lastFailureType: string | null;
}

function isEmpty(batch: FlushBatch): boolean {
  return (
    batch.http.length === 0 &&
    batch.errors.groups.length === 0 &&
    batch.errors.events.length === 0 &&
    batch.sql.series.length === 0 &&
    batch.sql.statements.length === 0 &&
    batch.slow.length === 0
  );
}

/**
 * Vuelca cada `OBSERVABILITY_FLUSH_SECONDS` lo que los sinks acumularon a
 * `observability.*` (H2/H3). Patrón de `HttpSliFlushService`, con tres
 * diferencias que importan:
 *
 *  - **Idempotente por clave**: cada fila lleva su clave natural
 *    (`instance_id`, `flush_seq`…) y el insert es `ON CONFLICT DO NOTHING`.
 *    Reintentar un lote cuyo primer intento sí confirmó no duplica nada.
 *  - **Una transacción por lote** que incluye el registro de la instancia (las
 *    filas de `error_events` tienen FK a ella).
 *  - **Sin concurrencia consigo mismo**: si el volcado anterior sigue en curso,
 *    el siguiente espera.
 *
 * Si la base falla, el lote se reintenta **una vez** en el ciclo siguiente; si
 * vuelve a fallar se descarta con un aviso y `droppedFlushes` sube. Nunca lanza
 * hacia afuera: las métricas no son auditoría.
 */
@Injectable()
export class ObservabilityFlushService
  implements OnModuleInit, OnApplicationShutdown
{
  private timer?: NodeJS.Timeout;
  private retry: FlushBatch | null = null;
  private running: Promise<number> = Promise.resolve(0);
  private dropped = 0;
  private lastFlushAt: Date | null = null;
  private lastFlushRows = 0;
  private lastFlushDurationMs: number | null = null;
  private lastFailureAt: Date | null = null;
  private lastFailureType: string | null = null;

  constructor(
    private readonly orm: MikroORM,
    private readonly repository: ObservabilityWriteRepository,
    @Inject(OBSERVABILITY_ENV) private readonly env: ObservabilityEnv,
    private readonly logger: PinoLogger,
    @Inject(OBSERVABILITY_SINKS)
    private readonly sinks: ObservabilitySinks = defaultSinks,
  ) {
    this.logger.setContext(ObservabilityFlushService.name);
  }

  get droppedFlushes(): number {
    return this.dropped;
  }

  get status(): FlushStatus {
    return {
      lastFlushAt: this.lastFlushAt,
      lastFlushRows: this.lastFlushRows,
      lastFlushDurationMs: this.lastFlushDurationMs,
      droppedFlushes: this.dropped,
      lastFailureAt: this.lastFailureAt,
      lastFailureType: this.lastFailureType,
    };
  }

  async onModuleInit(): Promise<void> {
    if (!this.env.enabled) return;
    await this.registerInstance('running');
    this.timer = setInterval(() => {
      void this.flush();
    }, this.env.flushSeconds * 1000);
    // Un temporizador de métricas no puede mantener vivo el proceso.
    this.timer.unref();
    this.logger.info(
      {
        operation: 'observability.start',
        flushSeconds: this.env.flushSeconds,
        instanceId: this.sinks.identity.id,
        actorHash: this.sinks.errors.actorHashAvailable,
      },
      'Captura de observabilidad encendida',
    );
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    if (!this.env.enabled) return;
    await this.flush();
    await this.registerInstance('stopped');
  }

  /**
   * Vuelca lo pendiente. Nunca lanza. Dos llamadas simultáneas se encolan.
   *
   * @returns Cuántas filas (series + grupos + eventos) quedaron persistidas.
   */
  flush(): Promise<number> {
    const next = this.running.then(
      () => this.flushOnce(),
      () => this.flushOnce(),
    );
    this.running = next.catch(() => 0);
    return next;
  }

  private async flushOnce(): Promise<number> {
    const startedAt = Date.now();
    let persisted = 0;
    try {
      if (this.retry) {
        const batch = this.retry;
        this.retry = null;
        const rows = await this.persist(batch);
        if (rows === null) {
          this.dropped += 1;
          this.logger.warn(
            { operation: 'observability.flush', dropped: this.dropped },
            'Volcado de observabilidad descartado tras dos intentos',
          );
        } else {
          persisted += rows;
        }
      }

      const fresh: FlushBatch = {
        http: this.sinks.http.drain(),
        errors: this.sinks.errors.drain(),
        sql: this.sinks.sql.drain(),
        slow: this.sinks.slow.drain(),
      };
      if (isEmpty(fresh)) {
        // Aun sin datos, refresca el latido de la instancia.
        await this.registerInstance('running');
      } else {
        const rows = await this.persist(fresh);
        if (rows === null) this.retry = fresh;
        else persisted += rows;
      }
    } catch (error) {
      this.noteFailure(error);
    }
    this.lastFlushAt = new Date();
    this.lastFlushRows = persisted;
    this.lastFlushDurationMs = Date.now() - startedAt;
    return persisted;
  }

  /** Persiste un lote en una transacción. `null` si falló. */
  private async persist(batch: FlushBatch): Promise<number | null> {
    const now = new Date();
    try {
      const rows = await this.orm.em
        .fork()
        .transactional(async (tx: EntityManager) => {
          await this.repository.upsertInstance(
            tx,
            this.sinks.identity,
            'running',
            now,
          );
          const http = await this.repository.insertHttpRows(
            tx,
            this.sinks.identity.id,
            batch.http,
            now,
          );
          const errors = await this.repository.persistErrors(
            tx,
            batch.errors,
            now,
          );
          await this.repository.upsertSqlStatements(
            tx,
            batch.sql.statements,
            now,
          );
          const sql = await this.repository.insertSqlRows(
            tx,
            this.sinks.identity.id,
            batch.sql.series,
            now,
          );
          const slow = await this.repository.insertSlowSamples(
            tx,
            batch.slow,
            now,
          );
          return http + errors.groups + errors.eventsInserted + sql + slow;
        });
      this.logger.info(
        {
          operation: 'observability.flush',
          http: batch.http.length,
          groups: batch.errors.groups.length,
          events: batch.errors.events.length,
          sql: batch.sql.series.length,
          slow: batch.slow.length,
          persisted: rows,
        },
        'Observabilidad volcada',
      );
      return rows;
    } catch (error) {
      this.noteFailure(error);
      return null;
    }
  }

  private async registerInstance(status: 'running' | 'stopped'): Promise<void> {
    try {
      await this.orm.em.fork().transactional(async (tx: EntityManager) => {
        await this.repository.upsertInstance(
          tx,
          this.sinks.identity,
          status,
          new Date(),
        );
      });
    } catch (error) {
      this.noteFailure(error);
    }
  }

  private noteFailure(error: unknown): void {
    this.lastFailureAt = new Date();
    this.lastFailureType =
      error instanceof Error ? error.constructor.name : typeof error;
    this.logger.warn(
      {
        operation: 'observability.flush',
        // Sólo el tipo: el mensaje del driver puede citar valores.
        errorType: this.lastFailureType,
      },
      'No se pudo volcar la observabilidad',
    );
  }
}
