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
import { IamUsersController, IamAuthController } from './controllers';
import {
  IamUsersService,
  IamUsersReadService,
  IamCredentialsService,
  IamMfaService,
  IamDevicesService,
  IamAuthService,
  IamAssistedRegistrationService,
  IamPatientSelfRegistrationService,
  IamOrganizationSelfRegistrationService,
  IamPractitionerSelfRegistrationService,
  IamPasswordResetService,
  IamEmailVerificationService,
} from './services';
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
} from './repositories';

/**
 * Módulo IAM: identidad, credenciales, sesiones, MFA, dispositivos, roles
 * globales y eventos de seguridad. `TokenService` llega vía `AuthModule` (global).
 *
 * Importa Profiles, Common, Messaging y Directory porque los tres auto-registros
 * cruzan módulos en una sola transacción: el de pacientes crea la cuenta con su
 * persona y su perfil, su documento de identidad y su correo, y su membresía en
 * el tenant por defecto; el de organizaciones crea la cuenta del owner junto al
 * tenant y su membresía OWNER. Ambos encolan la verificación del correo.
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
  ],
  controllers: [IamUsersController, IamAuthController],
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
    // Servicios
    IamUsersService,
    IamUsersReadService,
    IamCredentialsService,
    IamMfaService,
    IamDevicesService,
    IamAuthService,
    IamAssistedRegistrationService,
    IamPatientSelfRegistrationService,
    IamOrganizationSelfRegistrationService,
    IamPractitionerSelfRegistrationService,
    IamPasswordResetService,
    IamEmailVerificationService,
  ],
  // `IamUsersService` se exporta para el seed de arranque (`SeedModule`), que
  // necesita crear el primer `SECURITY_ADMIN` con el mismo hasheo que la API.
  exports: [IamUsersService],
})
export class IamModule {}
