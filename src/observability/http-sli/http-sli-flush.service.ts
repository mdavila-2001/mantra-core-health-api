import {
  Inject,
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import { SEED, deterministicId } from '../../common/constants/concepts';
import { SeriesIngestRepository } from '../../modules/time_series/repositories';
import {
  HTTP_SLI_CODE,
  type HttpSliAggregator,
  type HttpSliPoint,
} from './http-sli.aggregator';
import type { HttpSliEnv } from './http-sli.env';
import { HTTP_SLI_AGGREGATOR, HTTP_SLI_ENV } from './http-sli.tokens';

/** Versión del formato de las filas; sube si cambia `dimensions`. */
export const HTTP_SLI_SOURCE_VERSION = 'http-sli/1';

export { HTTP_SLI_CODE };

/** Servicio lógico bajo el que se agrupan las series: la API. */
export const HTTP_SLI_SERVICE_ID = deterministicId('observability:service:api');

/**
 * Vuelca cada `OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS` lo que el middleware agregó
 * a `time_series.service_sli_series` (H1.1 del portal de superadministración).
 *
 * ## Por qué no llama a `POST /ts/metrics/service_sli_series/batch-ingest`
 *
 * Esa ruta existe para clientes externos: pasaría por HTTP interno (y se
 * mediría a sí misma) y emitiría un evento de outbox por minuto. Acá se escribe
 * con el mismo `SeriesIngestRepository`, que es lo que hace el servicio de esa
 * ruta, directo y en una transacción.
 *
 * ## Qué pasa si la base falla
 *
 * Las métricas no son auditoría: perder un minuto es aceptable, bloquear o
 * tumbar la API por eso no. Un volcado que falla se reintenta **una vez**, en el
 * ciclo siguiente y por separado de lo nuevo; si vuelve a fallar se descarta con
 * un aviso y `droppedFlushes` sube. Nunca se lanza hacia afuera.
 *
 * ## Tenant
 *
 * `tenant_id` es obligatorio en la tabla. Las métricas son de la plataforma, no
 * de una organización: se guardan bajo el tenant por defecto del seed (deuda
 * TS-07 del backlog de superadmin, anotada en ADR-0026). Con `RLS_ENFORCE=true`
 * la transacción fija ese tenant, igual que el interceptor de auditoría.
 */
@Injectable()
export class HttpSliFlushService
  implements OnModuleInit, OnApplicationShutdown
{
  private timer?: NodeJS.Timeout;
  private retry: HttpSliPoint[] | null = null;
  private dropped = 0;
  private readonly enforceRls = process.env.RLS_ENFORCE === 'true';

  constructor(
    private readonly orm: MikroORM,
    private readonly repository: SeriesIngestRepository,
    @Inject(HTTP_SLI_AGGREGATOR) private readonly aggregator: HttpSliAggregator,
    @Inject(HTTP_SLI_ENV) private readonly env: HttpSliEnv,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HttpSliFlushService.name);
  }

  /** Cuántos volcados se descartaron tras fallar dos veces. */
  get droppedFlushes(): number {
    return this.dropped;
  }

  onModuleInit(): void {
    if (!this.env.enabled) return;
    this.timer = setInterval(() => {
      void this.flush();
    }, this.env.flushSeconds * 1000);
    // Un temporizador de métricas no puede mantener vivo el proceso.
    this.timer.unref();
    this.logger.info(
      { operation: 'http_sli.start', flushSeconds: this.env.flushSeconds },
      'Medición de peticiones HTTP encendida',
    );
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    if (this.env.enabled) await this.flush();
  }

  /**
   * Vuelca lo pendiente. Nunca lanza.
   *
   * @returns Cuántas filas quedaron persistidas en esta pasada.
   */
  async flush(): Promise<number> {
    let persisted = 0;

    if (this.retry) {
      const batch = this.retry;
      this.retry = null;
      if (await this.persist(batch)) {
        persisted += batch.length;
      } else {
        this.dropped += 1;
        this.logger.warn(
          {
            operation: 'http_sli.flush',
            rows: batch.length,
            dropped: this.dropped,
          },
          'Volcado de métricas HTTP descartado tras dos intentos',
        );
      }
    }

    const fresh = this.aggregator.drain();
    if (fresh.length === 0) return persisted;
    if (await this.persist(fresh)) {
      persisted += fresh.length;
    } else {
      this.retry = fresh;
    }
    return persisted;
  }

  /** Una transacción por lote. Devuelve si se persistió. */
  private async persist(points: readonly HttpSliPoint[]): Promise<boolean> {
    const ingestionId = randomUUID();
    const rows = points.map((point) => ({
      time: point.time,
      tenantId: SEED.tenantId,
      seriesId: point.seriesId,
      ingestionId,
      sourceVersion: HTTP_SLI_SOURCE_VERSION,
      qualityState: 'received',
      serviceId: HTTP_SLI_SERVICE_ID,
      sliCode: HTTP_SLI_CODE,
      numerator: point.numerator,
      denominator: point.denominator,
      value: point.value,
      dimensions: point.dimensions,
    }));

    try {
      await this.orm.em.fork().transactional(async (tx: EntityManager) => {
        await this.applyRlsContext(tx);
        this.repository.insertPoints(tx, 'service_sli_series', rows);
      });
      this.logger.info(
        { operation: 'http_sli.flush', rows: rows.length },
        'Métricas HTTP volcadas',
      );
      return true;
    } catch (error) {
      this.logger.warn(
        {
          operation: 'http_sli.flush',
          rows: rows.length,
          error: error instanceof Error ? error.message : String(error),
        },
        'No se pudieron volcar las métricas HTTP',
      );
      return false;
    }
  }

  /** Con RLS, fija el tenant en la transacción (local a ella). */
  private async applyRlsContext(tx: EntityManager): Promise<void> {
    if (!this.enforceRls) return;
    await tx.execute("select set_config('app.system_context', 'false', true)");
    await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
      SEED.tenantId,
    ]);
  }
}
