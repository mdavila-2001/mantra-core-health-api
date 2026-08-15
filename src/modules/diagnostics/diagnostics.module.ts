import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
// Las dos tablas del circuito diagnóstico que **no** son de este módulo: la
// orden (`clinical.service_requests`) y el informe (`clinical.diagnostic_reports`).
// Se registran para poder leerlas; escribirlas sigue siendo del módulo clínico.
import { ServiceRequests, DiagnosticReports } from '../clinical/entities';
// El portal del paciente necesita dos cosas de otros dominios y las toma por su
// módulo, no por sus tablas: quién es el titular de la sesión (`profiles`) y
// dónde vive un acceso compartido (`authz`).
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthzModule } from '../authz/authz.module';
import {
  DiagnosticsSpecimensController,
  DiagnosticsLabController,
  DiagnosticsReportsController,
  DiagnosticsImagingController,
  DiagnosticsOrdersController,
  DiagnosticsPatientResultsController,
} from './controllers';
import {
  DiagnosticsSpecimensService,
  DiagnosticsLabService,
  DiagnosticsReportsService,
  DiagnosticsImagingService,
  DiagnosticsMediaQualityService,
  DiagnosticsOrdersService,
  DiagnosticsPatientResultsService,
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
    ProfilesModule,
    AuthzModule,
  ],
  controllers: [
    DiagnosticsSpecimensController,
    DiagnosticsLabController,
    DiagnosticsReportsController,
    DiagnosticsImagingController,
    DiagnosticsOrdersController,
    DiagnosticsPatientResultsController,
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
    DiagnosticsPatientResultsService,
  ],
})
export class DiagnosticsModule {}
