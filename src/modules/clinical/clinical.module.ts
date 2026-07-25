import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  ClinicalEncountersController,
  ClinicalObservationsController,
  ClinicalOrdersController,
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
    ProceduresService,
    ImmunizationsService,
  ],
})
export class ClinicalModule {}
