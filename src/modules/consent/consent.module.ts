import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  ConsentsController,
  HipaaAuthorizationsController,
  PatientObjectionsController,
  PrivacyRestrictionsController,
  ProcessingLegalBasesController,
  TreatmentInformedConsentsController,
  ConsentEvidenceController,
  ConsentSweepController,
} from './controllers';
import {
  ConsentsService,
  HipaaAuthorizationsService,
  PatientObjectionsService,
  PrivacyRestrictionsService,
  ProcessingLegalBasesService,
  TreatmentInformedConsentsService,
  ConsentEvidenceService,
  ConsentSweepService,
} from './services';
import {
  ConsentsRepository,
  ConsentProvisionsRepository,
  ConsentEventsRepository,
  ConsentEvidenceRepository,
  HipaaAuthorizationsRepository,
  PatientObjectionsRepository,
  PrivacyRestrictionsRepository,
  ProcessingLegalBasesRepository,
  TreatmentInformedConsentsRepository,
} from './repositories';

/**
 * Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence):
 * captura/retiro de consentimientos, autorizaciones HIPAA, objeciones y
 * restricciones de privacidad, bases legales versionadas, consentimiento informado
 * de tratamiento, evidencia inmutable y barrido de expiraciones.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    ConsentsController,
    HipaaAuthorizationsController,
    PatientObjectionsController,
    PrivacyRestrictionsController,
    ProcessingLegalBasesController,
    TreatmentInformedConsentsController,
    ConsentEvidenceController,
    ConsentSweepController,
  ],
  providers: [
    // Repositorios
    ConsentsRepository,
    ConsentProvisionsRepository,
    ConsentEventsRepository,
    ConsentEvidenceRepository,
    HipaaAuthorizationsRepository,
    PatientObjectionsRepository,
    PrivacyRestrictionsRepository,
    ProcessingLegalBasesRepository,
    TreatmentInformedConsentsRepository,
    // Servicios
    ConsentsService,
    HipaaAuthorizationsService,
    PatientObjectionsService,
    PrivacyRestrictionsService,
    ProcessingLegalBasesService,
    TreatmentInformedConsentsService,
    ConsentEvidenceService,
    ConsentSweepService,
  ],
})
export class ConsentModule {}
