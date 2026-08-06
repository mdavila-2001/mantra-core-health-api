/**
 * Superficie pública de la capa de persistencia.
 *
 * Un módulo de dominio debe poder escribir un puerto y su adaptador importando
 * solo desde aquí. Lo que este barril deliberadamente NO exporta es
 * `PostgresDataConnection`: si un servicio pudiera obtenerla, podría pedirle el
 * `EntityManager` y saltarse los puertos, y la separación duraría lo que tarde
 * alguien en tener prisa.
 */

export * from './errors/persistence.errors';
export { mapPostgresError } from './errors/postgres-error.mapper';

export * from './capabilities/adapter-capabilities';

export * from './ports/persistence-context';
export * from './ports/repository.port';
export * from './ports/transaction.port';
export * from './ports/session.port';

export { RoutedPersistenceSession } from './session/routed.session';
export { DirectPersistenceSession } from './session/direct.session';
export {
  createPersistenceSessionProvider,
  isModuleRouted,
  PERSISTENCE_PORTS_MODULES_VAR,
} from './session/session.provider';

export type {
  ConnectionRole,
  PostgresConnectionConfig,
} from './config/connection-descriptor';
export {
  areEquivalent,
  connectionFingerprint,
  redactConnectionUrl,
} from './config/connection-descriptor';
export type {
  ReadFallbackStrategy,
  ResolvedDataSources,
} from './config/data-sources.env';
export {
  resolveDataSources,
  dataSourcesEnvSchema,
} from './config/data-sources.env';

export * from './registry/data-connection.contract';
export { ConnectionRegistry } from './registry/connection.registry';

export * from './routing/routing.config';
export {
  DataSourceRouter,
  type DataRoute,
  type ResolvedDataSource,
} from './routing/data-source.router';

export { PersistenceSessionFactory } from './factory/persistence-session.factory';
// `describeEquivalence` NO se reexporta aquí, por el mismo motivo que
// `PostgresDataConnection`: vive en `postgres-connection.factory`, que importa
// `orm/config/orm.config`, y ese módulo llama a `buildOrmConfig()` en el nivel
// superior (es el default que resuelve la CLI de MikroORM). Reexportarlo hacía
// que importar un *tipo de puerto* desde este barril validara DB_HOST/PORT/
// USER/PASSWORD/NAME en tiempo de carga, y reventaba cualquier prueba unitaria
// sin entorno de base de datos. Quien la necesite la importa de la factoría.

export {
  PostgresTransactionManager,
  PostgresTransactionContext,
  unwrapTransaction,
} from './adapters/postgres/postgres-transaction.manager';

export {
  PersistenceMetrics,
  type PersistenceMetricsSnapshot,
  type PersistenceObservation,
} from './observability/persistence.metrics';

export {
  DataSourcesHealthService,
  type DataSourcesReport,
} from './health/data-sources.health';

// `PersistenceModule` tampoco se reexporta, por lo mismo: arrastra
// `persistence.module` → `postgres-connection.factory` → `orm/config/orm.config`.
// Y no hace falta: un módulo de dominio importa puertos y tokens, nunca el
// módulo de Nest. Lo cablea la raíz de composición (`app.module`), que sí tiene
// entorno, importándolo de `./persistence/persistence.module`.
export * from './persistence.tokens';
