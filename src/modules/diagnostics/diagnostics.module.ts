import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
// Las dos tablas del circuito diagnóstico que **no** son de este módulo: la
// orden (`clinical.service_requests`) y el informe (`clinical.diagnostic_reports`).
// Se registran para poder leerlas; escribirlas sigue siendo del módulo clínico.
import { ServiceRequests, DiagnosticReports } from '../clinical/entities';
import {
  DiagnosticsSpecimensController,
  DiagnosticsLabController,
  DiagnosticsReportsController,
  DiagnosticsImagingController,
  DiagnosticsOrdersController,
} from './controllers';
import {
  DiagnosticsSpecimensService,
  DiagnosticsLabService,
  DiagnosticsReportsService,
  DiagnosticsImagingService,
  DiagnosticsMediaQualityService,
  DiagnosticsOrdersService,
} from './services';
import {
  SpecimensRepository,
  LabWorkRepository,
  ReportsRepository,
  ImagingRepository,
  MediaQualityRepository,
  DiagnosticOrdersRepository,
} from './repositories';

/**
 * Módulo Diagnostics (20): laboratorio, imagen médica y media clínica. Registra
 * los controladores por subdominio (especímenes, laboratorio, informes, imagen)
 * y sus servicios/repositorios. `EntityManager` y `TokenService` llegan por los
 * módulos globales (MikroORM / AuthModule).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      ...Object.values(entities),
      ServiceRequests,
      DiagnosticReports,
    ]),
  ],
  controllers: [
    DiagnosticsSpecimensController,
    DiagnosticsLabController,
    DiagnosticsReportsController,
    DiagnosticsImagingController,
    DiagnosticsOrdersController,
  ],
  providers: [
    // Repositorios
    SpecimensRepository,
    LabWorkRepository,
    ReportsRepository,
    ImagingRepository,
    MediaQualityRepository,
    // Sin estado y recibe el `EntityManager` por parámetro, así que proveerlo
    // acá no crea una segunda fuente de verdad — mismo criterio con el que
    // `scheduling` provee `AppointmentsRepository`.
    DiagnosticOrdersRepository,
    // Servicios
    DiagnosticsSpecimensService,
    DiagnosticsLabService,
    DiagnosticsReportsService,
    DiagnosticsImagingService,
    DiagnosticsMediaQualityService,
    DiagnosticsOrdersService,
  ],
})
export class DiagnosticsModule {}
