import { Module } from '@nestjs/common';
import { DocumentStoreModule } from '../document_store/document_store.module';
import { RedisRuntimeModule } from '../redis_runtime/redis_runtime.module';
import { SearchPlatformModule } from '../search_platform/search_platform.module';
import { RouteIndexModule } from '../../observability/route-index/route-index.module';
import { OpsConsoleService } from './application/ops-console.service';
import {
  INSTANCE_REGISTRY_TOKEN,
  OpsInstancesService,
} from './application/ops-instances.service';
import { OpsTrafficService } from './application/ops-traffic.service';
import { resolveRegistry } from './domain/instance-liveness.env';
import { DependencyProbeService } from './infrastructure/probes/dependency-probe.service';
import { OpsConsoleRepository } from './infrastructure/repositories/ops-console.repository';
import { InstanceHeartbeatRepository } from './infrastructure/repositories/instance-heartbeat.repository';
import { OpsTrafficRepository } from './infrastructure/repositories/ops-traffic.repository';
import { OpsConsoleController } from './presentation/controllers/ops-console.controller';
import { OpsHeartbeatController } from './presentation/controllers/ops-heartbeat.controller';
import { OpsInstancesController } from './presentation/controllers/ops-instances.controller';

/**
 * Consola de operación y preparación para producción del portal
 * administrativo. Sin tablas propias: lee los schemas de los módulos que
 * poseen cada dato y nunca escribe en ellos.
 *
 * La sonda de vida de instancias guarda sus latidos en Redis (clave propia
 * `ops:heartbeat:v1`, sin DDL) y sondea las dependencias reutilizando los
 * servicios que ya exportan `redis_runtime`, `document_store` y
 * `search_platform`.
 */
@Module({
  imports: [
    RouteIndexModule,
    RedisRuntimeModule,
    DocumentStoreModule,
    SearchPlatformModule,
  ],
  controllers: [
    OpsConsoleController,
    OpsInstancesController,
    OpsHeartbeatController,
  ],
  providers: [
    OpsConsoleRepository,
    OpsConsoleService,
    OpsTrafficRepository,
    OpsTrafficService,
    InstanceHeartbeatRepository,
    DependencyProbeService,
    // Falla al arrancar si `OPS_LIVENESS_REQUIRED_WORKERS` es inválida.
    { provide: INSTANCE_REGISTRY_TOKEN, useFactory: () => resolveRegistry() },
    OpsInstancesService,
  ],
})
export class OpsConsoleModule {}
