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
// P40: `ClinicalRecordAccessGuard` en la ficha diagnóstica; Nest lo resuelve en
// este contenedor y necesita `ClinicalReadService`, que `ClinicalModule` exporta
// (mismo criterio que `chart` y `clinical_ext`).
import { ClinicalModule } from '../clinical/clinical.module';
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
  DiagnosticsWorklistService,
  DiagnosticsScopeService,
  DiagnosticsPatientAccessService,
} from './services';
import { SuggestedSiteNamesReader } from '../clinical/services/suggested-site-names.reader';
import { ServiceRequestNotesService } from '../clinical/services/service-request-notes.service';
import {
  SpecimensRepository,
  LabWorkRepository,
  ReportsRepository,
  ImagingRepository,
  MediaQualityRepository,
  DiagnosticOrdersRepository,
  LabReceptionRepository,
  ServiceRequestWorklistRepository,
  ClinicalRefsRepository,
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
    ClinicalModule,
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
    ServiceRequestWorklistRepository,
    ClinicalRefsRepository,
    // Nombre de la sede sugerida en la orden: lectura sin estado, se registra la clase.
    SuggestedSiteNamesReader,
    // P40: las notas que motivan cada orden, en la ficha diagnóstica.
    ServiceRequestNotesService,
    // Servicios
    DiagnosticsSpecimensService,
    DiagnosticsLabService,
    DiagnosticsReportsService,
    DiagnosticsImagingService,
    DiagnosticsMediaQualityService,
    DiagnosticsOrdersService,
    DiagnosticsPatientResultsService,
    DiagnosticsReceptionService,
    DiagnosticsWorklistService,
    // Alcance de tenant de los writes clínicos y política paciente–profesional.
    DiagnosticsScopeService,
    DiagnosticsPatientAccessService,
    // Guard del personal de laboratorio (recepción y circuito de especímenes).
    LabStaffGuard,
  ],
})
export class DiagnosticsModule {}
