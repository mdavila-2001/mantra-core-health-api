import { Module } from '@nestjs/common';
import { READINESS_TIMEOUT_MS } from '../../../app-readiness.service';
import { loadInstanceLivenessEnv } from '../../ops_console/domain/instance-liveness.env';
import { InstanceHeartbeatRepository } from '../../ops_console/infrastructure/repositories/instance-heartbeat.repository';
import { RedisRuntimeModule } from '../../redis_runtime/redis_runtime.module';
import { HeartbeatReader } from './heartbeat-reader';
import { RuntimePiecesController } from './runtime-pieces.controller';
import { RuntimePiecesRepository } from './runtime-pieces.repository';
import {
  RUNTIME_PIECES_CLOCK,
  RUNTIME_PIECES_LIVENESS_ENV,
  RUNTIME_PIECES_SQL,
  RuntimePiecesService,
} from './runtime-pieces.service';
import { RuntimePiecesSeedService } from './runtime-pieces-seed.service';
import { ScanCache } from './scan-cache';
import { MikroSqlPort } from './sql-port';

/**
 * Piezas en ejecución (`/admin/ops/runtime-pieces`): extiende la sonda de vida y
 * el registro de herramientas, no los duplica. Sin tablas propias: escribe sólo
 * filas `rtp.*` en `platform_ops.tool_registry`. Los umbrales son los de la
 * sonda (`OPS_LIVENESS_*`), validados con la misma función al construir el módulo.
 */
@Module({
  imports: [RedisRuntimeModule],
  controllers: [RuntimePiecesController],
  providers: [
    ScanCache,
    RuntimePiecesRepository,
    RuntimePiecesSeedService,
    RuntimePiecesService,
    HeartbeatReader,
    InstanceHeartbeatRepository,
    MikroSqlPort,
    { provide: RUNTIME_PIECES_SQL, useExisting: MikroSqlPort },
    {
      provide: RUNTIME_PIECES_LIVENESS_ENV,
      useFactory: () =>
        loadInstanceLivenessEnv(process.env, READINESS_TIMEOUT_MS),
    },
    { provide: RUNTIME_PIECES_CLOCK, useValue: () => new Date() },
  ],
  exports: [RuntimePiecesSeedService],
})
export class RuntimePiecesModule {}
