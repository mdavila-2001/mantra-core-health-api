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
  ConsentMeController,
  EncounterInformedConsentsController,
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
  PractitionerAccessRevocationService,
  ConsentMeService,
  EncounterInformedConsentsService,
  ConsentScopeService,
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
  ProcessingPurposesRepository,
  TreatmentInformedConsentsRepository,
} from './repositories';
import { ClinicalAccessGrantsRepository } from '../authz/repositories';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../profiles/infrastructure/repositories';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';
// Cada especialidad pedida o autorizada se valida contra `VS_MEDICAL_SPECIALTY`
// con el mismo servicio que el alta de profesional. Se provee la clase suelta
// (y su adaptador) y no `ProfilesModule` entero, por lo mismo que hace
// `CommunityModule`: importarlo cerraría un ciclo. `terminology` no depende
// de ningún módulo de dominio.
import { TerminologyModule } from '../terminology/terminology.module';
import { ProfilesTerminologyAdapter } from '../profiles/infrastructure/adapters/profiles-terminology.adapter';
import { PROFILES_TERMINOLOGY_PORT } from '../profiles/application/ports/profiles-terminology.port';
import { MedicalSpecialtyCatalogService } from '../profiles/application/services/medical-specialty-catalog.service';
// El médico registra el consentimiento informado desde su consulta (CL-77): hace
// falta el encuentro y la autorización de escritura sobre la historia. `clinical`
// no conoce a `consent`, así que no hay ciclo.
import { ClinicalModule } from '../clinical/clinical.module';
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
    ClinicalModule,
    TerminologyModule,
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
    ConsentMeController,
    EncounterInformedConsentsController,
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
    ProcessingPurposesRepository,
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
    MedicalSpecialtyCatalogService,
    {
      provide: PROFILES_TERMINOLOGY_PORT,
      useClass: ProfilesTerminologyAdapter,
    },
    // Servicios
    ConsentScopeService,
    ConsentsService,
    HipaaAuthorizationsService,
    PatientObjectionsService,
    PrivacyRestrictionsService,
    ProcessingLegalBasesService,
    TreatmentInformedConsentsService,
    ConsentEvidenceService,
    ConsentSweepService,
    PractitionerAccessRequestsService,
    PractitionerAccessRevocationService,
    ConsentMeService,
    EncounterInformedConsentsService,
    {
      provide: PRACTITIONER_ACCESS_NOTICE_PORT,
      useClass: MessagingPractitionerAccessNoticeAdapter,
    },
  ],
})
export class ConsentModule {}
