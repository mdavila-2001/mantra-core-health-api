import { PractitionerSignatureAssetsController } from './presentation/controllers/practitioner-signature-assets.controller';
import { PractitionerSignatureAssetsService } from './application/services/practitioner-signature-assets.service';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
// Verificar una matrícula concede el rol asistencial: la autoridad sobre los
// roles es de `authz`, que no importa `profiles` (no cierra ciclo).
import { AuthzModule } from '../authz/authz.module';
// La foto del perfil profesional es un archivo de `common`: fijarla exige
// comprobar contra `common.files` que sea del titular y siga siendo utilizable.
import { CommonModule } from '../common/common.module';
import { TerminologyModule } from '../terminology/terminology.module';
// TP-2: quién administra cada organización lo decide `directory`, y de ahí sale
// el permiso para aprobar o rechazar un vínculo médico–organización.
import { DirectoryModule } from '../directory/directory.module';
// El seguro declarado por autoservicio (PATCH del propio perfil) reusa el
// mismo catálogo de planes y coberturas que ya usa el alta. Sin ciclo:
// `insurance` no importa `profiles`.
import { InsuranceModule } from '../insurance/insurance.module';
import * as entities from './entities';
import { MedicalSpecialtyCatalogService } from './application/services/medical-specialty-catalog.service';
import { AdministrativeAreaCatalogService } from './application/services/administrative-area-catalog.service';
import { HealthFacilityCatalogService } from './application/services/health-facility-catalog.service';
import {
  ProfilesDependentRequestsController,
  ProfilesPatientsController,
  ProfilesPractitionersController,
  TenantPractitionerRequestsController,
} from './presentation/controllers';
import {
  DependentLinkRequestsService,
  ProfilesAffiliationsService,
  ProfilesPatientsService,
  ProfilesPractitionersService,
} from './application/services';
import {
  PersonsRepository,
  PersonProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
  ProfessionalCredentialsRepository,
  PractitionerSpecialtiesRepository,
  PractitionerLanguagesRepository,
  PractitionerAffiliationsRepository,
  PatientIdentityLinksRepository,
  PatientMergeEventsRepository,
  RelatedPersonsRepository,
  PatientPortalProxiesRepository,
} from './infrastructure/repositories';
import { ProfileOwnershipService } from './application/services';
import { PatientRepresentationService } from './application/services/patient-representation.service';
import { LinkableOrganizationsService } from './application/services/linkable-organizations.service';
import { MessagingAffiliationNoticeAdapter } from './infrastructure/adapters/messaging-affiliation-notice.adapter';
import { AFFILIATION_NOTICE_PORT } from './application/ports/affiliation-notice.port';
import { MessagingModule } from '../messaging/messaging.module';
import { PROFILES_TERMINOLOGY_PORT } from './application/ports/profiles-terminology.port';
import { ProfilesTerminologyAdapter } from './infrastructure/adapters/profiles-terminology.adapter';
import { AFFILIATION_ORGANIZATIONS_PORT } from './application/ports/affiliation-organizations.port';
import { ATTACHABLE_FILES_PORT } from './application/ports/attachable-files.port';
import { DEPENDENT_LINK_IDENTIFIERS_PORT } from './application/ports/dependent-link-identifiers.port';
import { DEPENDENT_LINK_NOTIFICATIONS_PORT } from './application/ports/dependent-link-notifications.port';
import { AffiliationOrganizationsAdapter } from './infrastructure/adapters/affiliation-organizations.adapter';
import { AttachableFilesAdapter } from './infrastructure/adapters/attachable-files.adapter';
import { DependentLinkContextAdapter } from './infrastructure/adapters/dependent-link-context.adapter';
import { PRACTITIONER_CONTEXT_PORT } from './application/ports/practitioner-context.port';
import { PractitionerContextAdapter } from './infrastructure/adapters/practitioner-context.adapter';
import { PERSON_RECORDS_PORT } from './application/ports/person-records.port';
import { PersonRecordsAdapter } from './infrastructure/adapters/person-records.adapter';
import { PATIENT_COVERAGES_PORT } from './application/ports/patient-coverages.port';
import { PatientCoveragesAdapter } from './infrastructure/adapters/patient-coverages.adapter';

/**
 * Módulo Profiles (05): personas, pacientes y fuerza laboral de salud. Cubre alta
 * de pacientes, vinculación de cuenta de portal, onboarding de profesionales,
 * autorizaciones jurisdiccionales, verificación de credenciales, especialidades,
 * vínculos de identidad (MPI), fusión/reversión de pacientes, personas
 * relacionadas, proxies de portal y defunción/anonimización.
 */
@Module({
  // DirectoryModule: TP-2 necesita saber quién administra cada organización
  // para decidir quién aprueba un vínculo, y ese criterio ya vive allá. No hay
  // ciclo: `directory` no depende de `profiles`.
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    AuthzModule,
    CommonModule,
    // Sólo para leer el catálogo de especialidades: la regla de qué uuid es
    // una especialidad válida vive en terminología, no en una lista de acá.
    TerminologyModule,
    DirectoryModule,
    MessagingModule,
    InsuranceModule,
  ],
  controllers: [
    PractitionerSignatureAssetsController,
    ProfilesPatientsController,
    ProfilesDependentRequestsController,
    ProfilesPractitionersController,
    TenantPractitionerRequestsController,
  ],
  providers: [
    PractitionerSignatureAssetsService,
    PractitionerContextAdapter,
    {
      provide: PRACTITIONER_CONTEXT_PORT,
      useExisting: PractitionerContextAdapter,
    },
    ProfileOwnershipService,
    PatientRepresentationService,
    MedicalSpecialtyCatalogService,
    AdministrativeAreaCatalogService,
    HealthFacilityCatalogService,
    ProfilesAffiliationsService,
    LinkableOrganizationsService,
    // El emisor de avisos del vínculo entra por su puerto: el servicio que
    // decide no sabe que existe un canal in-app, y eso es lo que deja probar la
    // decisión sin levantar mensajería.
    {
      provide: AFFILIATION_NOTICE_PORT,
      useClass: MessagingAffiliationNoticeAdapter,
    },
    {
      provide: PROFILES_TERMINOLOGY_PORT,
      useClass: ProfilesTerminologyAdapter,
    },
    {
      provide: AFFILIATION_ORGANIZATIONS_PORT,
      useClass: AffiliationOrganizationsAdapter,
    },
    {
      provide: ATTACHABLE_FILES_PORT,
      useClass: AttachableFilesAdapter,
    },
    PersonRecordsAdapter,
    PatientCoveragesAdapter,
    {
      provide: PERSON_RECORDS_PORT,
      useExisting: PersonRecordsAdapter,
    },
    {
      provide: PATIENT_COVERAGES_PORT,
      useExisting: PatientCoveragesAdapter,
    },
    DependentLinkContextAdapter,
    {
      provide: DEPENDENT_LINK_IDENTIFIERS_PORT,
      useExisting: DependentLinkContextAdapter,
    },
    {
      provide: DEPENDENT_LINK_NOTIFICATIONS_PORT,
      useExisting: DependentLinkContextAdapter,
    },
    // Repositorios
    PersonsRepository,
    PersonProfilesRepository,
    PatientProfilesRepository,
    PersonAccountLinksRepository,
    HealthPractitionerProfilesRepository,
    JurisdictionAuthorizationsRepository,
    ProfessionalCredentialsRepository,
    PractitionerSpecialtiesRepository,
    PractitionerLanguagesRepository,
    PractitionerAffiliationsRepository,
    PatientIdentityLinksRepository,
    PatientMergeEventsRepository,
    RelatedPersonsRepository,
    PatientPortalProxiesRepository,
    // Servicios
    ProfilesPatientsService,
    ProfilesPractitionersService,
    DependentLinkRequestsService,
  ],
  // Los repositorios que necesita el auto-registro de pacientes (IAM crea en la
  // misma transacción la cuenta y su persona/perfil). Se exportan los
  // repositorios y no el servicio porque `registerPatient` de este módulo es
  // admin-only y abre su propia transacción.
  exports: [
    // `DirectoryNetworksSeedService` (H3) carga los consultorios de las redes
    // con el mismo caso de uso que el alta administrativa de una afiliación.
    ProfilesPractitionersService,
    PersonsRepository,
    PersonProfilesRepository,
    PatientProfilesRepository,
    PersonAccountLinksRepository,
    // Los necesita identity_assurance para activar la matrícula (y con ella al
    // profesional) cuando la autoridad externa la aprueba.
    JurisdictionAuthorizationsRepository,
    HealthPractitionerProfilesRepository,
    // Los necesita iam para el auto-registro público de profesionales, que crea
    // perfil, licencia, título e idioma en la misma transacción que la cuenta.
    ProfessionalCredentialsRepository,
    PractitionerLanguagesRepository,
    // Y desde que la especialidad se elige EN el alta (registro del cliente,
    // módulo Médico §1.4.2), también estas dos: la fila y su validación de
    // dominio — la base acepta cualquier concepto, el catálogo decide cuáles
    // son especialidades.
    PractitionerSpecialtiesRepository,
    MedicalSpecialtyCatalogService,
    AdministrativeAreaCatalogService,
    // Y desde que el alta de paciente registra al tutor o persona autorizada
    // que lo acompaña, también la de personas relacionadas.
    RelatedPersonsRepository,
    // Quién puede actuar por un paciente. Lo necesita `scheduling` para no
    // dejar que una cuenta pida turno por alguien que no es ni representa; la
    // regla vive acá porque la representación es un dato de perfiles.
    PatientRepresentationService,
    PatientPortalProxiesRepository,
  ],
})
export class ProfilesModule {}
