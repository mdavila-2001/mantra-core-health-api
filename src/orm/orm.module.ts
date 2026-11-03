import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { buildOrmConfig } from './config/orm.config';
import { RuntimeRoleGuardService } from './config/runtime-role.guard';
import { SchemaBootstrapService } from './bootstrap/schema-bootstrap.service';
import { SchemaFidelityService } from './fidelity/schema-fidelity.service';
import { SchemaIntegrityState } from './bootstrap/schema-integrity.state';
import { QueryMetrics } from './observability/query-metrics';
import { ormQueryMetrics } from './observability/orm.logger';

/**
 * Raíz de la capa de persistencia relacional.
 *
 * Reúne cuatro responsabilidades que antes estaban dispersas entre
 * `src/database`, `src/config` y `src/mikro-orm.config.ts`:
 *
 *   1. la conexión y el ciclo de vida del Unit of Work / Identity Map de MikroORM;
 *   2. la inyección idempotente del DDL en el arranque (`SchemaBootstrapService`);
 *   3. la verificación de fidelidad modelo-base (`SchemaFidelityService`);
 *   4. los contadores de actividad del ORM (`QueryMetrics`).
 *
 * Es `@Global` a propósito. Los 59 módulos de dominio necesitan el
 * `EntityManager`; sin ámbito global cada uno tendría que reimportar el módulo
 * de persistencia, lo que multiplica el ruido sin aportar aislamiento real
 * (todos comparten la misma conexión de todos modos).
 */
@Global()
@Module({
  imports: [
    // La configuración se construye aquí y no se importa ya construida para que
    // el entorno se lea en el momento del arranque del módulo, no en el momento
    // en que Node evalúa el archivo. Facilita además sustituirla en tests.
    MikroOrmModule.forRoot(buildOrmConfig()),
  ],
  providers: [
    // Primero: si el rol de conexión ignora RLS en producción, el proceso
    // aborta antes de tocar el esquema o sembrar nada (HZ-05).
    RuntimeRoleGuardService,
    SchemaFidelityService,
    SchemaBootstrapService,
    SchemaIntegrityState,
    {
      // Los contadores se crean fuera del contenedor porque el logger de
      // MikroORM se construye antes que él. Aquí se vuelven a exponer como
      // proveedor para que cualquier servicio los inyecte con normalidad.
      provide: QueryMetrics,
      useValue: ormQueryMetrics,
    },
  ],
  // No se reexporta `MikroOrmModule`: `forRoot` registra internamente un módulo
  // ya marcado como global, así que el `EntityManager` y los repositorios están
  // disponibles en toda la aplicación sin reexportarlos. Intentar exportarlo
  // desde aquí falla, porque lo que este módulo importa es el módulo dinámico
  // que devuelve `forRoot`, no la clase `MikroOrmModule`.
  exports: [SchemaFidelityService, QueryMetrics, SchemaIntegrityState],
})
export class OrmModule {}
