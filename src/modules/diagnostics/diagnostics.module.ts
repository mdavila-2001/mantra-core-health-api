import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  DiagnosticsSpecimensController,
  DiagnosticsLabController,
  DiagnosticsReportsController,
  DiagnosticsImagingController,
} from './controllers';
import {
  DiagnosticsSpecimensService,
  DiagnosticsLabService,
  DiagnosticsReportsService,
  DiagnosticsImagingService,
  DiagnosticsMediaQualityService,
} from './services';
import {
  SpecimensRepository,
  LabWorkRepository,
  ReportsRepository,
  ImagingRepository,
  MediaQualityRepository,
} from './repositories';

/**
 * Módulo Diagnostics (20): laboratorio, imagen médica y media clínica. Registra
 * los controladores por subdominio (especímenes, laboratorio, informes, imagen)
 * y sus servicios/repositorios. `EntityManager` y `TokenService` llegan por los
 * módulos globales (MikroORM / AuthModule).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    DiagnosticsSpecimensController,
    DiagnosticsLabController,
    DiagnosticsReportsController,
    DiagnosticsImagingController,
  ],
  providers: [
    // Repositorios
    SpecimensRepository,
    LabWorkRepository,
    ReportsRepository,
    ImagingRepository,
    MediaQualityRepository,
    // Servicios
    DiagnosticsSpecimensService,
    DiagnosticsLabService,
    DiagnosticsReportsService,
    DiagnosticsImagingService,
    DiagnosticsMediaQualityService,
  ],
})
export class DiagnosticsModule {}
