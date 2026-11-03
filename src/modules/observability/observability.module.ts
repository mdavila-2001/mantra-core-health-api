import { Module } from '@nestjs/common';
import { RouteIndexModule } from '../../observability/route-index/route-index.module';
import {
  configureCapture,
  loadObservabilityEnv,
} from '../../observability/capture';
import {
  OBSERVABILITY_ENV,
  OBSERVABILITY_SINKS,
  ObservabilityFlushService,
  defaultSinks,
} from './application/observability-flush.service';
import { OperationCatalogService } from './application/operation-catalog.service';
import { ObservabilityReadService } from './application/observability-read.service';
import { ObservabilityReadRepository } from './infrastructure/observability-read.repository';
import { ObservabilityWriteRepository } from './infrastructure/observability-write.repository';
import { ObservabilityController } from './presentation/controllers/observability.controller';
import { ObservabilitySelftestController } from './presentation/controllers/observability-selftest.controller';

/**
 * Portal «Sistema» (módulo 70): captura persistida de peticiones, errores y
 * consultas SQL, y su lectura bajo `GET /admin/observability/*`.
 *
 * - `src/observability/capture/` es la capa transversal (sinks en memoria, ALS)
 *   que se instala antes del contenedor de Nest; este módulo aporta el volcado
 *   periódico y las lecturas.
 * - No importa `TimeSeriesModule` ni `OpsConsoleModule` (patrón de
 *   `HttpSliModule`): el volcado y las lecturas usan SQL propio sobre el schema
 *   `observability`.
 * - Con `OBSERVABILITY_ENABLED=false` (por defecto) los sinks no capturan y no
 *   se escribe nada; las rutas de lectura responden vacías con su `notMeasured`.
 */
@Module({
  imports: [RouteIndexModule],
  controllers: [
    ObservabilityController,
    // Ruta de falla controlada (D-06): no existe en producción.
    ...(process.env.NODE_ENV === 'production'
      ? []
      : [ObservabilitySelftestController]),
  ],
  providers: [
    {
      provide: OBSERVABILITY_ENV,
      useFactory: () => {
        // Valida al construir el módulo: un valor inválido aborta el arranque.
        const env = loadObservabilityEnv();
        configureCapture(env);
        return env;
      },
    },
    { provide: OBSERVABILITY_SINKS, useValue: defaultSinks },
    ObservabilityWriteRepository,
    ObservabilityReadRepository,
    ObservabilityReadService,
    OperationCatalogService,
    ObservabilityFlushService,
  ],
  exports: [ObservabilityFlushService],
})
export class SystemObservabilityModule {}
