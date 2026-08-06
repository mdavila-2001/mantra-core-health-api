import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { registerPostgresConnections } from './factory/postgres-connection.factory';
import { PersistenceSessionFactory } from './factory/persistence-session.factory';
import { PostgresTransactionManager } from './adapters/postgres/postgres-transaction.manager';
import { ConnectionRegistry } from './registry/connection.registry';
import { DataSourceRouter } from './routing/data-source.router';
import {
  defaultRoutingRules,
  type RoutingRules,
} from './routing/routing.config';
import { PersistenceMetrics } from './observability/persistence.metrics';
import { DataSourcesHealthService } from './health/data-sources.health';
import { DataSourcesController } from './health/data-sources.controller';
import {
  resolveDataSources,
  type ResolvedDataSources,
} from './config/data-sources.env';
import { TRANSACTION_MANAGER } from './ports/transaction.port';
import {
  OWNED_ORM_INSTANCES,
  READ_FALLBACK_STRATEGY,
  RESOLVED_DATA_SOURCES,
  ROUTING_RULES,
} from './persistence.tokens';

/**
 * Capa de puertos, adaptadores y enrutado de datos.
 *
 * Se monta **junto a** `OrmModule`, no en su lugar. `OrmModule` sigue siendo el
 * dueño de la instancia primaria de MikroORM y del arranque del esquema, y los
 * 60 módulos que hoy inyectan `EntityManager` siguen funcionando exactamente
 * igual. Este módulo añade la ruta nueva sin retirar la vieja, que es la fase
 * «expand» del §47 y lo que permite migrar módulo a módulo con rollback.
 *
 * Es `@Global` por la misma razón que `OrmModule`: los puertos de cualquier
 * módulo necesitan la fábrica de sesiones, y obligar a 60 módulos a reimportarlo
 * añadiría ruido sin aislar nada.
 */
@Global()
@Module({
  controllers: [DataSourcesController],
  providers: [
    ConnectionRegistry,
    PersistenceMetrics,

    {
      // La resolución del entorno ocurre una sola vez, al construir el
      // contenedor. Si es inválida, el proceso muere aquí y no acepta tráfico.
      provide: RESOLVED_DATA_SOURCES,
      useFactory: (): ResolvedDataSources => resolveDataSources(),
    },
    {
      provide: READ_FALLBACK_STRATEGY,
      useFactory: (sources: ResolvedDataSources) => sources.readFallback,
      inject: [RESOLVED_DATA_SOURCES],
    },
    {
      provide: ROUTING_RULES,
      useFactory: (sources: ResolvedDataSources): RoutingRules =>
        defaultRoutingRules(sources.read.name, sources.write.name),
      inject: [RESOLVED_DATA_SOURCES],
    },

    {
      // Las conexiones se publican antes de construir el router, porque el
      // router valida en su constructor que toda conexión referenciada exista.
      // El orden lo garantiza `inject`: Nest resuelve las dependencias primero.
      provide: OWNED_ORM_INSTANCES,
      useFactory: async (
        primaryOrm: MikroORM,
        registry: ConnectionRegistry,
        dataSources: ResolvedDataSources,
        logger: PinoLogger,
      ): Promise<MikroORM[]> => {
        logger.setContext('PersistenceModule');
        return registerPostgresConnections({
          primaryOrm,
          registry,
          dataSources,
          log: (message) => logger.info(message),
        });
      },
      inject: [MikroORM, ConnectionRegistry, RESOLVED_DATA_SOURCES, PinoLogger],
    },

    {
      provide: DataSourceRouter,
      useFactory: (
        registry: ConnectionRegistry,
        rules: RoutingRules,
        // Se inyecta aunque no se use: obliga a Nest a publicar las conexiones
        // antes de construir el router. Sin esta dependencia explícita, el
        // orden de construcción de dos proveedores independientes no está
        // garantizado y la validación del enrutado correría contra un registro
        // todavía vacío.
        _connections: MikroORM[],
      ) => new DataSourceRouter(registry, rules),
      inject: [ConnectionRegistry, ROUTING_RULES, OWNED_ORM_INSTANCES],
    },

    PersistenceSessionFactory,
    PostgresTransactionManager,
    { provide: TRANSACTION_MANAGER, useExisting: PostgresTransactionManager },
    DataSourcesHealthService,
  ],
  exports: [
    ConnectionRegistry,
    DataSourceRouter,
    PersistenceSessionFactory,
    PersistenceMetrics,
    PostgresTransactionManager,
    TRANSACTION_MANAGER,
    DataSourcesHealthService,
    RESOLVED_DATA_SOURCES,
  ],
})
export class PersistenceModule implements OnApplicationShutdown {
  constructor(
    private readonly registry: ConnectionRegistry,
    @Inject(OWNED_ORM_INSTANCES)
    private readonly ownedOrms: MikroORM[],
  ) {}

  /**
   * Apagado ordenado (§40).
   *
   * Cierra solo los pools que esta capa creó. La instancia primaria la cierra
   * `OrmModule` por su cuenta; cerrarla también aquí produciría un segundo
   * `close` sobre un pool ya cerrado, que en el mejor caso es ruido en el log
   * del apagado y en el peor deja el proceso colgado sin salir.
   */
  async onApplicationShutdown(): Promise<void> {
    await this.registry.closeAll();
    // `closeAll` ya cerró las conexiones cuyo `owned` es true, que son
    // exactamente estas. Se recorren igualmente por si alguna instancia se creó
    // pero no llegó a registrarse por un fallo a medio arranque: sin esto, un
    // arranque abortado entre `MikroORM.init` y `registry.register` dejaría un
    // pool huérfano impidiendo que el proceso terminara. `allSettled` absorbe
    // el segundo cierre de las que ya estaban cerradas.
    await Promise.allSettled(this.ownedOrms.map((orm) => orm.close(true)));
  }
}
