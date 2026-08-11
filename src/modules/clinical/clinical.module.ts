import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AuditModule } from '../audit/audit.module';
import {
  ClinicalEncountersController,
  ClinicalObservationsController,
  ClinicalOrdersController,
  ClinicalPrescriptionPoliciesController,
  ClinicalRecordsController,
  ClinicalReadController,
} from './controllers';
import {
  CareEpisodesService,
  EncountersService,
  ObservationsService,
  ServiceRequestsService,
  DiagnosticReportsService,
  ConditionsService,
  AllergyIntolerancesService,
  MedicationsService,
  PrescriptionSignaturePoliciesService,
  ProceduresService,
  ImmunizationsService,
  ClinicalReadService,
} from './services';
import {
  CareEpisodesRepository,
  AppointmentsRepository,
  EncountersRepository,
  ObservationsRepository,
  ServiceRequestsRepository,
  DiagnosticReportsRepository,
  ConditionsRepository,
  AllergyIntolerancesRepository,
  MedicationRequestsRepository,
  MedicationRecordsRepository,
  PrescriptionSignaturePoliciesRepository,
  ProceduresRepository,
  ImmunizationsRepository,
} from './repositories';

/**
 * Módulo Clinical (08): registro clínico nuclear, órdenes y logística del
 * encuentro. Cubre los 14 casos de uso UC-08-01..14 (episodio, encuentro,
 * observación, orden de servicio, reporte diagnóstico, condición, alergia,
 * medicación, procedimiento, inmunización y cierre de encuentro).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities)), AuditModule],
  controllers: [
    ClinicalEncountersController,
    ClinicalObservationsController,
    ClinicalOrdersController,
    ClinicalPrescriptionPoliciesController,
    ClinicalRecordsController,
    ClinicalReadController,
  ],
  providers: [
    // Repositorios
    CareEpisodesRepository,
    AppointmentsRepository,
    EncountersRepository,
    ObservationsRepository,
    ServiceRequestsRepository,
    DiagnosticReportsRepository,
    ConditionsRepository,
    AllergyIntolerancesRepository,
    MedicationRequestsRepository,
    MedicationRecordsRepository,
    PrescriptionSignaturePoliciesRepository,
    ProceduresRepository,
    ImmunizationsRepository,
    // Servicios
    CareEpisodesService,
    EncountersService,
    ObservationsService,
    ServiceRequestsService,
    DiagnosticReportsService,
    ConditionsService,
    AllergyIntolerancesService,
    MedicationsService,
    PrescriptionSignaturePoliciesService,
    ProceduresService,
    ImmunizationsService,
    ClinicalReadService,
  ],
})
export class ClinicalModule {}
