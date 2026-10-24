import { Module } from '@nestjs/common';
import { SeriesIngestRepository } from '../../modules/time_series/repositories';
import { HttpSliFlushService } from './http-sli-flush.service';
import { loadHttpSliEnv } from './http-sli.env';
import {
  HTTP_SLI_AGGREGATOR,
  HTTP_SLI_ENV,
  httpSliAggregator,
} from './http-sli.tokens';

/**
 * Medición de peticiones HTTP (H1.1 del portal de superadministración).
 *
 * El middleware se instala en `main.ts`; este módulo aporta el volcado
 * periódico. `SeriesIngestRepository` se provee acá y no se importa
 * `TimeSeriesModule`: el repositorio no tiene dependencias, y así no se toca ni
 * se arrastra un módulo con controladores y servicios que no hacen falta.
 */
@Module({
  providers: [
    SeriesIngestRepository,
    { provide: HTTP_SLI_AGGREGATOR, useValue: httpSliAggregator },
    { provide: HTTP_SLI_ENV, useFactory: () => loadHttpSliEnv() },
    HttpSliFlushService,
  ],
  exports: [HTTP_SLI_AGGREGATOR],
})
export class HttpSliModule {}
