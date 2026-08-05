import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { HealthDataController, FhirR5Controller } from './controllers';
import {
  HealthIngestionService,
  CanonicalResourcesService,
  HealthValidationService,
  PatientIdentityService,
  DataReleaseService,
} from './services';
import {
  HealthIngestionRepository,
  CanonicalResourcesRepository,
  HealthValidationRepository,
  PatientIdentityRepository,
  DataReleaseRepository,
  HealthProvenanceRepository,
  HealthTerminologyMappingRepository,
} from './repositories';

/**
 * Módulo de la plataforma de datos de salud: ingesta y proyección canónica,
 * identificadores, relaciones y bindings, validación FHIR R5, reglas de
 * calidad, identidad longitudinal (MPI), línea de tiempo del paciente,
 * de-identificación, exportación de Bundles y retiro gobernado
 * (UC-52-01 … 14).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [HealthDataController, FhirR5Controller],
  providers: [
    HealthIngestionRepository,
    CanonicalResourcesRepository,
    HealthValidationRepository,
    PatientIdentityRepository,
    DataReleaseRepository,
    HealthProvenanceRepository,
    HealthTerminologyMappingRepository,
    HealthIngestionService,
    CanonicalResourcesService,
    HealthValidationService,
    PatientIdentityService,
    DataReleaseService,
  ],
})
export class HealthDataModule {}
