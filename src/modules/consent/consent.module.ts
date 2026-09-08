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
  PractitionerAccessRequestsController,
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
  PractitionerAccessRequestsService,
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
import { ClinicalAccessGrantsRepository } from '../authz/repositories';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../profiles/repositories';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';
import { MessagingPractitionerAccessNoticeAdapter } from './adapters/messaging-practitioner-access-notice.adapter';
import { PRACTITIONER_ACCESS_NOTICE_PORT } from './ports/practitioner-access-notice.port';

/**
 * Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence):
 * captura/retiro de consentimientos, autorizaciones HIPAA, objeciones y
 * restricciones de privacidad, bases legales versionadas, consentimiento informado
 * de tratamiento, evidencia inmutable y barrido de expiraciones.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    AuditModule,
    MessagingModule,
  ],
  controllers: [
    ConsentsController,
    HipaaAuthorizationsController,
    PatientObjectionsController,
    PrivacyRestrictionsController,
    ProcessingLegalBasesController,
    TreatmentInformedConsentsController,
    ConsentEvidenceController,
    ConsentSweepController,
    PractitionerAccessRequestsController,
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
    // Repositorio de authz reutilizado para propagar la revocación de consent a
    // los accesos clínicos que se apoyaban en él (C-20), y ahora también para
    // crear el grant que nace de FT-07 al aceptarse una solicitud.
    ClinicalAccessGrantsRepository,
    // Repositorios de profiles reutilizados para resolver "mi perfil de
    // paciente" desde el token — mismo criterio que `ClinicalModule`: son
    // clases sin estado sobre el `EntityManager`, no una fuente de verdad
    // nueva. Importar `ProfilesModule` entero cerraría un ciclo.
    PatientProfilesRepository,
    PersonAccountLinksRepository,
    // Servicios
    ConsentsService,
    HipaaAuthorizationsService,
    PatientObjectionsService,
    PrivacyRestrictionsService,
    ProcessingLegalBasesService,
    TreatmentInformedConsentsService,
    ConsentEvidenceService,
    ConsentSweepService,
    PractitionerAccessRequestsService,
    {
      provide: PRACTITIONER_ACCESS_NOTICE_PORT,
      useClass: MessagingPractitionerAccessNoticeAdapter,
    },
  ],
})
export class ConsentModule {}
