import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AuditModule } from '../audit/audit.module';
import { PharmaLabScopeGuard } from './guards';
import {
  MedicalVisitorsController,
  PharmaCatalogController,
  PharmaLabNoticesController,
  PharmaLabReferenceController,
  PharmaLabSocialController,
  PharmaLabsController,
  PharmacovigilanceController,
  RegulatoryDocumentsController,
  VisitAgendaController,
  VisitRecordsController,
  VisitRequestsController,
  VisitSurveysController,
} from './controllers';
import {
  MedicalVisitorsService,
  PharmaAnalyticsService,
  PharmaCatalogService,
  PharmaLabAccessService,
  PharmaLabNotificationsService,
  PharmaLabOrganizationService,
  PharmaSocialService,
  PharmacovigilanceService,
  RegulatoryDocumentsService,
  VisitAgendaService,
  VisitRecordsService,
  VisitRequestsService,
  VisitSurveysService,
} from './services';
import {
  AgendaRepository,
  AnalyticsRepository,
  CatalogRepository,
  DoctorCalendarRepository,
  OrganizationRepository,
  PharmacovigilanceRepository,
  RegulatoryRepository,
  SurveysRepository,
  VisitorsRepository,
  VisitsRepository,
} from './repositories';

/**
 * Módulo Pharma Lab (carril 17): organización laboratorio farmacéutico,
 * personal, visitadores médicos con dependencia obligatoria, solicitudes y
 * agenda de visitas, catálogo de medicamentos, material informativo con
 * aprobación, registro/calificación/encuestas de visita, publicaciones sujetas a
 * autorización, farmacovigilancia, documentación regulatoria y contabilidad
 * analítica.
 *
 * Consume `AuditModule` para sellar cada mutación en la cadena WORM
 * `audit.audit_log`. No exporta nada: ningún otro dominio necesita entrar acá,
 * y mantenerlo cerrado impide que la información comercial del laboratorio se
 * cuele en un flujo clínico.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities)), AuditModule],
  controllers: [
    PharmaLabsController,
    PharmaLabReferenceController,
    PharmaLabNoticesController,
    MedicalVisitorsController,
    VisitAgendaController,
    VisitRequestsController,
    VisitRecordsController,
    PharmaCatalogController,
    VisitSurveysController,
    PharmacovigilanceController,
    RegulatoryDocumentsController,
    PharmaLabSocialController,
  ],
  providers: [
    PharmaLabScopeGuard,
    // Repositorios
    AgendaRepository,
    AnalyticsRepository,
    CatalogRepository,
    DoctorCalendarRepository,
    OrganizationRepository,
    PharmacovigilanceRepository,
    RegulatoryRepository,
    SurveysRepository,
    VisitorsRepository,
    VisitsRepository,
    // Servicios
    PharmaLabAccessService,
    PharmaLabNotificationsService,
    PharmaLabOrganizationService,
    MedicalVisitorsService,
    VisitAgendaService,
    VisitRequestsService,
    VisitRecordsService,
    PharmaCatalogService,
    VisitSurveysService,
    PharmacovigilanceService,
    RegulatoryDocumentsService,
    PharmaSocialService,
    PharmaAnalyticsService,
  ],
})
export class PharmaLabModule {}
