import { Module } from '@nestjs/common';
import {
  AppReadinessService,
  READINESS_TIMEOUT_MS,
} from '../../app-readiness.service';
import { RouteIndexModule } from '../../observability/route-index/route-index.module';
import { DocumentStoreModule } from '../document_store/document_store.module';
import { RedisRuntimeModule } from '../redis_runtime/redis_runtime.module';
import { SearchPlatformModule } from '../search_platform/search_platform.module';
import {
  InstanceLivenessService,
  INSTANCE_LIVENESS_ENV,
} from './application/instance-liveness.service';
import { OpsConsoleService } from './application/ops-console.service';
import { OpsToolsService } from './application/ops-tools.service';
import { OpsTrafficService } from './application/ops-traffic.service';
import { loadInstanceLivenessEnv } from './domain/instance-liveness.env';
import { InstanceHeartbeatRepository } from './infrastructure/repositories/instance-heartbeat.repository';
import { OpsConsoleRepository } from './infrastructure/repositories/ops-console.repository';
import { OpsTrafficRepository } from './infrastructure/repositories/ops-traffic.repository';
import { OpsConsoleController } from './presentation/controllers/ops-console.controller';
import { OpsHeartbeatController } from './presentation/controllers/ops-heartbeat.controller';
import { OpsLivenessController } from './presentation/controllers/ops-liveness.controller';
import { OpsToolsController } from './presentation/controllers/ops-tools.controller';

/**
 * Consola de operación y preparación para producción del portal
 * administrativo. Sin tablas propias: lee los schemas de los módulos que
 * poseen cada dato y nunca escribe en ellos.
 */
@Module({
  imports: [
    RouteIndexModule,
    // Las sondas LIVE de `/admin/ops/tools` reutilizan `AppReadinessService`,
    // que `AppModule` declara como proveedor propio sin exportarlo: acá se
    // construye otra instancia con las mismas dependencias.
    DocumentStoreModule,
    RedisRuntimeModule,
    SearchPlatformModule,
  ],
  controllers: [
    OpsConsoleController,
    OpsToolsController,
    OpsHeartbeatController,
    OpsLivenessController,
  ],
  providers: [
    OpsConsoleRepository,
    OpsConsoleService,
    OpsTrafficRepository,
    OpsTrafficService,
    AppReadinessService,
    OpsToolsService,
    // Sonda de vida de instancias. Los umbrales se validan acá, al construir
    // el módulo: un valor inválido aborta el arranque (regla 90.3).
    {
      provide: INSTANCE_LIVENESS_ENV,
      useFactory: () =>
        loadInstanceLivenessEnv(process.env, READINESS_TIMEOUT_MS),
    },
    InstanceHeartbeatRepository,
    InstanceLivenessService,
  ],
})
export class OpsConsoleModule {}
