import { InsurancePatientSettlementModule } from '../insurance/insurance-patient-settlement.module';
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
// Bytes de un archivo ya autorizado por contexto (`FileUploadService`); lo exporta
// `CommonModule`. La descarga del resultado del titular (CL-40) lo necesita.
import { CommonModule } from '../common/common.module';
// Membresías de tenant: `LabStaffGuard` reconoce al personal del laboratorio
// por su membresía, no por un rol del token.
import { DirectoryAuthorizationModule } from '../directory/directory-authorization.module';
import { LabStaffGuard } from './guards';
import {
  DiagnosticsSpecimensController,
  DiagnosticsLabController,
  DiagnosticsReportsController,
  DiagnosticsImagingController,
  DiagnosticsOrdersController,
  DiagnosticsPatientResultsController,
  DiagnosticsReceptionController,
} from './controllers';
import {
  DiagnosticsSpecimensService,
  DiagnosticsLabService,
  DiagnosticsReportsService,
  DiagnosticsImagingService,
  DiagnosticsMediaQualityService,
  DiagnosticsOrdersService,
  DiagnosticsPatientResultsService,
  DiagnosticsReceptionService,
} from './services';
import {
  SpecimensRepository,
  LabWorkRepository,
  ReportsRepository,
  ImagingRepository,
  MediaQualityRepository,
  DiagnosticOrdersRepository,
  LabReceptionRepository,
} from './repositories';

/**
 * Módulo Diagnostics (20): laboratorio, imagen médica y media clínica. Registra
 * los controladores por subdominio (especímenes, laboratorio, informes, imagen)
 * y sus servicios/repositorios. `EntityManager` y `TokenService` llegan por los
 * módulos globales (MikroORM / AuthModule).
 */
@Module({
  imports: [
    InsurancePatientSettlementModule,
    MikroOrmModule.forFeature([
      ...Object.values(entities),
      ServiceRequests,
      DiagnosticReports,
    ]),
    ProfilesModule,
    AuthzModule,
    CommonModule,
    DirectoryAuthorizationModule,
  ],
  controllers: [
    DiagnosticsSpecimensController,
    DiagnosticsLabController,
    DiagnosticsReportsController,
    DiagnosticsImagingController,
    DiagnosticsOrdersController,
    DiagnosticsPatientResultsController,
    DiagnosticsReceptionController,
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
    LabReceptionRepository,
    // Servicios
    DiagnosticsSpecimensService,
    DiagnosticsLabService,
    DiagnosticsReportsService,
    DiagnosticsImagingService,
    DiagnosticsMediaQualityService,
    DiagnosticsOrdersService,
    DiagnosticsPatientResultsService,
    DiagnosticsReceptionService,
    // Guard del personal de laboratorio (recepción y circuito de especímenes).
    LabStaffGuard,
  ],
})
export class DiagnosticsModule {}
