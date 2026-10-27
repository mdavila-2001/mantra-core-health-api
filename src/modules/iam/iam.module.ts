import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { ProfilesModule } from '../profiles/profiles.module';
import { CommonModule } from '../common/common.module';
import { MessagingModule } from '../messaging/messaging.module';
import { DirectoryModule } from '../directory/directory.module';
// El emisor del token pregunta a `authz` por los roles de negocio vigentes del
// sujeto; `authz` no importa `iam`, así que la dependencia no cierra ciclo.
import { AuthzModule } from '../authz/authz.module';
// El alta de paciente anota el seguro declarado; `insurance` no importa `iam`,
// así que la dependencia no cierra ciclo.
import { InsuranceModule } from '../insurance/insurance.module';
import { TerminologyModule } from '../terminology/terminology.module';
// El auto-registro de profesional (P20) da de alta el consultorio propio
// declarado en el alta con `OwnSiteProvisioningService`, dentro de su propia
// transacción; `practice` no importa `iam`, así que la dependencia no cierra
// ciclo.
import { PracticeModule } from '../practice/practice.module';
// El alta pública de farmacia (P50) provisiona la farmacia, su central y sus
// sucursales con `PharmacyProvisioningService`; `pharmacy` no importa `iam`.
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import {
  IamUsersController,
  IamAuthController,
  IamAccountSecurityController,
  IamOnboardingDraftsController,
} from './presentation/controllers';
import {
  IamUsersService,
  IamUsersReadService,
  IamCredentialsService,
  IamMfaService,
  IamDevicesService,
  IamAuthService,
  IamAssistedRegistrationService,
  IamPatientSelfRegistrationService,
  IamOrganizationRepresentativesService,
  IamOrganizationSelfRegistrationService,
  IamRegistrationDocumentUploadService,
  IamPractitionerSelfRegistrationService,
  IamPasswordResetService,
  IamEmailVerificationService,
  IamAccountSecurityService,
  IamOnboardingDraftsService,
} from './application/services';
import {
  UsersRepository,
  CredentialsRepository,
  SessionsRepository,
  RefreshTokensRepository,
  MfaFactorsRepository,
  DevicesRepository,
  UserGlobalRolesRepository,
  AccountLockoutsRepository,
  SecurityEventsRepository,
  AccountActivationsRepository,
  EmailVerificationsRepository,
  IamApiKeysRepository,
  PasswordResetsRepository,
} from './infrastructure/repositories';
import { AuthzBusinessRolesAdapter } from './infrastructure/adapters/authz-business-roles.adapter';
import { CommonRecordsAdapter } from './infrastructure/adapters/common-records.adapter';
import { CommonRegistrationFilesAdapter } from './infrastructure/adapters/common-registration-files.adapter';
import { DirectoryRegistrationAdapter } from './infrastructure/adapters/directory-registration.adapter';
import { DirectoryTenantClaimsAdapter } from './infrastructure/adapters/directory-tenant-claims.adapter';
import { InsuranceDeclaredCoverageAdapter } from './infrastructure/adapters/insurance-declared-coverage.adapter';
import { MessagingEmailNoticeAdapter } from './infrastructure/adapters/messaging-email-notice.adapter';
import { PharmacyRegistrationAdapter } from './infrastructure/adapters/pharmacy-registration.adapter';
import { PracticeOwnSiteProvisioningAdapter } from './infrastructure/adapters/practice-own-site-provisioning.adapter';
import { ProfilesAccountProfileIdsAdapter } from './infrastructure/adapters/profiles-account-profile-ids.adapter';
import { ProfilesRegistrationAdapter } from './infrastructure/adapters/profiles-registration.adapter';
import { ACCOUNT_PROFILE_IDS_PORT } from './application/ports/account-profile-ids.port';
import { BUSINESS_ROLES_PORT } from './application/ports/business-roles.port';
import { COMMON_RECORDS_PORT } from './application/ports/common-records.port';
import { DECLARED_COVERAGE_PORT } from './application/ports/declared-coverage.port';
import { DIRECTORY_REGISTRATION_PORT } from './application/ports/directory-registration.port';
import { EMAIL_NOTICE_PORT } from './application/ports/email-notice.port';
import { OWN_SITE_PROVISIONING_PORT } from './application/ports/own-site.port';
import { PHARMACY_REGISTRATION_PORT } from './application/ports/pharmacy-registration.port';
import { PROFILE_REGISTRATION_PORT } from './application/ports/profile-registration.port';
import { REGISTRATION_FILES_PORT } from './application/ports/registration-files.port';
import { TENANT_CLAIMS_PORT } from './application/ports/tenant-claims.port';

/**
 * Módulo IAM: identidad, credenciales, sesiones, MFA, dispositivos, roles
 * globales y eventos de seguridad. `TokenService` llega vía `AuthModule` (global).
 *
 * Importa Profiles, Common, Messaging y Directory porque los tres auto-registros
 * cruzan módulos en una sola transacción: el de pacientes crea la cuenta con su
 * persona y su perfil, su documento de identidad y su correo, y su membresía en
 * el tenant por defecto; el de organizaciones crea la cuenta del owner junto al
 * tenant y su membresía OWNER. Ambos encolan la verificación del correo.
 * Importa además Practice: el auto-registro de profesional cruza un quinto
 * módulo cuando declara `ownSite` (ALV-005/006 · P20), dando de alta su
 * consultorio propio en la misma transacción del alta.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    ProfilesModule,
    CommonModule,
    MessagingModule,
    DirectoryModule,
    AuthzModule,
    InsuranceModule,
    TerminologyModule,
    PracticeModule,
    PharmacyModule,
  ],
  controllers: [
    IamUsersController,
    IamAuthController,
    IamAccountSecurityController,
    IamOnboardingDraftsController,
  ],
  providers: [
    // Repositorios
    UsersRepository,
    CredentialsRepository,
    SessionsRepository,
    RefreshTokensRepository,
    MfaFactorsRepository,
    DevicesRepository,
    UserGlobalRolesRepository,
    AccountLockoutsRepository,
    SecurityEventsRepository,
    AccountActivationsRepository,
    EmailVerificationsRepository,
    IamApiKeysRepository,
    PasswordResetsRepository,
    // Adaptadores a otros contextos (uno por puerto)
    AuthzBusinessRolesAdapter,
    CommonRecordsAdapter,
    CommonRegistrationFilesAdapter,
    DirectoryRegistrationAdapter,
    DirectoryTenantClaimsAdapter,
    InsuranceDeclaredCoverageAdapter,
    MessagingEmailNoticeAdapter,
    PharmacyRegistrationAdapter,
    PracticeOwnSiteProvisioningAdapter,
    ProfilesAccountProfileIdsAdapter,
    ProfilesRegistrationAdapter,
    { provide: BUSINESS_ROLES_PORT, useExisting: AuthzBusinessRolesAdapter },
    { provide: COMMON_RECORDS_PORT, useExisting: CommonRecordsAdapter },
    {
      provide: REGISTRATION_FILES_PORT,
      useExisting: CommonRegistrationFilesAdapter,
    },
    {
      provide: DIRECTORY_REGISTRATION_PORT,
      useExisting: DirectoryRegistrationAdapter,
    },
    { provide: TENANT_CLAIMS_PORT, useExisting: DirectoryTenantClaimsAdapter },
    {
      provide: DECLARED_COVERAGE_PORT,
      useExisting: InsuranceDeclaredCoverageAdapter,
    },
    { provide: EMAIL_NOTICE_PORT, useExisting: MessagingEmailNoticeAdapter },
    {
      provide: PHARMACY_REGISTRATION_PORT,
      useExisting: PharmacyRegistrationAdapter,
    },
    {
      provide: OWN_SITE_PROVISIONING_PORT,
      useExisting: PracticeOwnSiteProvisioningAdapter,
    },
    {
      provide: ACCOUNT_PROFILE_IDS_PORT,
      useExisting: ProfilesAccountProfileIdsAdapter,
    },
    {
      provide: PROFILE_REGISTRATION_PORT,
      useExisting: ProfilesRegistrationAdapter,
    },
    // Servicios
    IamUsersService,
    IamUsersReadService,
    IamCredentialsService,
    IamMfaService,
    IamDevicesService,
    IamAuthService,
    IamAssistedRegistrationService,
    IamPatientSelfRegistrationService,
    IamOrganizationRepresentativesService,
    IamOrganizationSelfRegistrationService,
    IamRegistrationDocumentUploadService,
    IamPractitionerSelfRegistrationService,
    IamPasswordResetService,
    IamEmailVerificationService,
    IamAccountSecurityService,
    IamOnboardingDraftsService,
  ],
  // `IamUsersService` se exporta para el seed de arranque (`SeedModule`), que
  // necesita crear el primer `SECURITY_ADMIN` con el mismo hasheo que la API.
  // Los dos de autorregistro se exportan por lo mismo (H2, `PeopleSeedService`):
  // reusan la alta completa (persona + perfil + licencia en una transacción) en
  // vez de reimplementarla a mano por segunda vez con MikroORM directo.
  exports: [
    IamUsersService,
    IamPractitionerSelfRegistrationService,
    IamPatientSelfRegistrationService,
    IamOnboardingDraftsService,
  ],
})
export class IamModule {}
