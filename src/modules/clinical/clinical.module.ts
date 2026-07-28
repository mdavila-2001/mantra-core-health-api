import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  ClinicalEncountersController,
  ClinicalObservationsController,
  ClinicalOrdersController,
  ClinicalPrescriptionPoliciesController,
  ClinicalRecordsController,
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
} from './services';
import {
  CareEpisodesRepository,
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
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    ClinicalEncountersController,
    ClinicalObservationsController,
    ClinicalOrdersController,
    ClinicalPrescriptionPoliciesController,
    ClinicalRecordsController,
  ],
  providers: [
    // Repositorios
    CareEpisodesRepository,
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
  ],
})
export class ClinicalModule {}
