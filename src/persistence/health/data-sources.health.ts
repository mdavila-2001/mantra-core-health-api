import { Inject, Injectable } from '@nestjs/common';
import { ConnectionRegistry } from '../registry/connection.registry';
import { DataSourceRouter } from '../routing/data-source.router';
import { PersistenceMetrics } from '../observability/persistence.metrics';
import { RESOLVED_DATA_SOURCES } from '../persistence.tokens';
import type { ResolvedDataSources } from '../config/data-sources.env';
import type { ConnectionHealth } from '../registry/data-connection.contract';

/** Informe de salud de las fuentes de datos, ya sanitizado para servirlo por HTTP. */
export interface DataSourcesReport {
  /** `up` si todas responden; `degraded` si alguna falla; `down` si ninguna responde. */
  readonly status: 'up' | 'degraded' | 'down';
  /** Estado por nombre lógico de conexión. */
  readonly connections: Readonly<Record<string, ConnectionHealth>>;
  /** Número de pools distintos, que puede ser menor que el de nombres. */
  readonly pools: number;
  /** Si lectura y escritura comparten instancia. */
  readonly sharesConnection: boolean;
  /** Estrategia de fallback de lectura vigente. */
  readonly readFallback: string;
  /** Enrutado vigente por operación. */
  readonly routing: {
    readonly default: { readonly read: string; readonly write: string };
    readonly overrides: Readonly<
      Record<string, { read: string; write: string }>
    >;
  };
}

/**
 * Compone el informe de `/health/data-sources`.
 *
 * Lo que este informe NO lleva es tan deliberado como lo que lleva: ni host, ni
 * puerto, ni usuario, ni base, ni cadena de conexión. El §44 lo prohíbe porque
 * un health check suele ser el endpoint menos protegido de un servicio, y
 * publicar la topología interna en él regala el primer paso de un movimiento
 * lateral. Lo que sí lleva -qué papel juega cada conexión, si responde y por
 * dónde se enruta cada módulo- basta para operar.
 */
@Injectable()
export class DataSourcesHealthService {
  constructor(
    private readonly registry: ConnectionRegistry,
    private readonly router: DataSourceRouter,
    private readonly metrics: PersistenceMetrics,
    @Inject(RESOLVED_DATA_SOURCES)
    private readonly dataSources: ResolvedDataSources,
  ) {}

  /** Comprueba todas las conexiones y compone el informe. */
  async report(): Promise<DataSourcesReport> {
    const connections = await this.registry.healthCheckAll();
    const states = Object.values(connections);
    const up = states.filter((state) => state.status === 'up').length;

    const rules = this.router.snapshot();
    return {
      status: up === states.length ? 'up' : up === 0 ? 'down' : 'degraded',
      connections,
      pools: this.registry.distinctConnections().length,
      sharesConnection: this.dataSources.sharesConnection,
      readFallback: this.dataSources.readFallback,
      routing: {
        default: rules.default,
        overrides: rules.modules,
      },
    };
  }

  /** Contadores de la capa de persistencia, para el endpoint de métricas. */
  metricsSnapshot(): ReturnType<PersistenceMetrics['snapshot']> {
    return this.metrics.snapshot();
  }
}
