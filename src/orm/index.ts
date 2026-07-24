/**
 * Superficie pública del núcleo ORM.
 *
 * El resto de la aplicación importa desde aquí; los archivos internos
 * (`bootstrap/layers/*`, `catalog/foreign-keys/*`) son detalle de
 * implementación. Mantener una única puerta de entrada es lo que permite
 * reorganizar el interior sin tocar los 59 módulos de dominio.
 */
export { OrmModule } from './orm.module';
export { ormEnvSchema, loadOrmEnv } from './config/orm.env';
export type { OrmEnv, SchemaSyncMode } from './config/orm.env';
export { buildOrmConfig } from './config/orm.config';
export { SchemaBootstrapService } from './bootstrap/schema-bootstrap.service';
export { SchemaFidelityService } from './fidelity/schema-fidelity.service';
export type { FidelityReport, SchemaDrift } from './fidelity/fidelity-report';
export { QueryMetrics } from './observability/query-metrics';
export type { QueryMetricsSnapshot } from './observability/query-metrics';
