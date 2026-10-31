import { randomUUID } from 'node:crypto';
import { instanceIdentity } from './instance-identity';
import {
  operationResolver,
  type OperationResolver,
} from './operation-resolver';
import {
  requestIdOf,
  routeTemplateOfRequest,
  type RequestContext,
} from './request-context';
import {
  normalizeMethod,
  sanitizeRoute,
} from '../http-sli/http-sli.aggregator';

/**
 * Muestras de peticiones lentas (H4): vuelven «buscar por `requestId`» algo más
 * que el error, porque muestran **qué SQL** corrió esa petición.
 *
 * Una petición se muestrea si:
 *  - `error`: terminó en 5xx;
 *  - `slow`: tardó `OBSERVABILITY_SLOW_REQUEST_MS` o más, **o** ejecutó alguna
 *    consulta por encima de `ORM_SLOW_QUERY_MS`;
 *  - `random`: el 1 % del resto.
 *
 * Tope de 60 muestras por minuto por instancia (el exceso se cuenta, no se
 * guarda). La muestra lleva plantilla, huellas de consulta y tiempos: ninguna
 * URL, ningún parámetro, ningún dato de la persona.
 */

export const MAX_SAMPLES_PER_MINUTE = 60;
const MAX_PENDING_SAMPLES = 2000;
const SQL_TOP = 5;
const MINUTE_MS = 60_000;

export type SampledBecause = 'slow' | 'error' | 'random';

/** Fila lista para `observability.slow_request_samples`. */
export interface SlowRequestRow {
  readonly id: string;
  readonly time: Date;
  readonly requestId: string;
  readonly traceId: string | null;
  readonly instanceId: string;
  readonly httpMethod: string;
  readonly routeTemplate: string;
  readonly operationKey: string | null;
  readonly moduleCode: string;
  readonly httpStatus: number;
  readonly durationMs: number;
  readonly sqlCount: number;
  readonly sqlTotalMs: number;
  readonly sqlTop: readonly {
    queryHash: string;
    executions: number;
    sumMs: number;
  }[];
  readonly sampledBecause: SampledBecause;
}

export class SlowRequestSink {
  private enabled = false;
  private slowRequestMs = 2000;
  private samples: SlowRequestRow[] = [];
  private readonly perMinute = new Map<number, number>();
  private overCap = 0;

  constructor(
    private readonly resolver: OperationResolver = operationResolver,
    private readonly instanceId: string = instanceIdentity.id,
    private readonly random: () => number = Math.random,
    private readonly randomRate = 0.01,
  ) {}

  configure(options: { enabled: boolean; slowRequestMs: number }): void {
    this.enabled = options.enabled;
    this.slowRequestMs = options.slowRequestMs;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get pendingSamples(): number {
    return this.samples.length;
  }

  /** Muestras que no se guardaron por el tope por minuto, desde el arranque. */
  get overCapSamples(): number {
    return this.overCap;
  }

  /** Decide y, si corresponde, guarda la muestra. Nunca lanza. */
  consider(
    context: RequestContext,
    result: {
      status: number;
      durationMs: number;
      at: Date;
      traceId?: string;
    },
  ): void {
    if (!this.enabled) return;
    try {
      let because: SampledBecause | null = null;
      if (result.status >= 500) because = 'error';
      else if (
        result.durationMs >= this.slowRequestMs ||
        context.slowSqlCount > 0
      ) {
        because = 'slow';
      } else if (this.random() < this.randomRate) because = 'random';
      if (!because) return;

      const requestId = requestIdOf(context.req);
      if (!requestId) return;

      const minute = Math.floor(result.at.getTime() / MINUTE_MS) * MINUTE_MS;
      const used = this.perMinute.get(minute) ?? 0;
      if (
        used >= MAX_SAMPLES_PER_MINUTE ||
        this.samples.length >= MAX_PENDING_SAMPLES
      ) {
        this.overCap += 1;
        return;
      }
      this.perMinute.set(minute, used + 1);
      if (this.perMinute.size > 120) {
        const oldest = [...this.perMinute.keys()].sort((a, b) => a - b)[0];
        this.perMinute.delete(oldest);
      }

      const method = normalizeMethod(context.req.method ?? 'GET');
      const route = sanitizeRoute(routeTemplateOfRequest(context.req) ?? '');
      const resolved = this.resolver.resolve(method, route);
      const top = [...context.sql.entries()]
        .map(([queryHash, v]) => ({
          queryHash,
          executions: v.executions,
          sumMs: Math.round(v.sumMs * 100) / 100,
        }))
        .sort(
          (a, b) => b.sumMs - a.sumMs || a.queryHash.localeCompare(b.queryHash),
        )
        .slice(0, SQL_TOP);

      this.samples.push({
        id: randomUUID(),
        time: result.at,
        requestId: requestId.slice(0, 128),
        traceId: result.traceId ?? null,
        instanceId: this.instanceId,
        httpMethod: method,
        routeTemplate: route,
        operationKey: resolved.operationKey,
        moduleCode: resolved.moduleCode,
        httpStatus: Math.trunc(result.status),
        durationMs: Math.max(0, Math.round(result.durationMs)),
        sqlCount: context.sqlCount,
        sqlTotalMs: Math.round(context.sqlMs * 100) / 100,
        sqlTop: top,
        sampledBecause: because,
      });
    } catch {
      // Medir no puede romper una respuesta que ya salió.
    }
  }

  drain(): SlowRequestRow[] {
    const out = this.samples;
    this.samples = [];
    return out;
  }
}

/** Sink del proceso. */
export const slowRequestSink = new SlowRequestSink();
