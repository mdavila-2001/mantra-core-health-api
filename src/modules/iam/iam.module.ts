import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { ProfilesModule } from '../profiles/profiles.module';
import { CommonModule } from '../common/common.module';
import { MessagingModule } from '../messaging/messaging.module';
import { DirectoryModule } from '../directory/directory.module';
import { IamUsersController, IamAuthController } from './controllers';
import {
  IamUsersService,
  IamCredentialsService,
  IamMfaService,
  IamDevicesService,
  IamAuthService,
  IamAssistedRegistrationService,
  IamPatientSelfRegistrationService,
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
} from './repositories';

/**
 * Módulo IAM: identidad, credenciales, sesiones, MFA, dispositivos, roles
 * globales y eventos de seguridad. `TokenService` llega vía `AuthModule` (global).
 *
 * Importa Profiles, Common, Messaging y Directory porque el auto-registro de
 * pacientes crea, en una sola transacción, la cuenta con su persona y su
 * perfil, su documento de identidad y su correo, su membresía en el tenant
 * por defecto, y encola la verificación del correo.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    ProfilesModule,
    CommonModule,
    MessagingModule,
    DirectoryModule,
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
    // Servicios
    IamUsersService,
    IamCredentialsService,
    IamMfaService,
    IamDevicesService,
    IamAuthService,
    IamAssistedRegistrationService,
    IamPatientSelfRegistrationService,
  ],
})
export class IamModule {}
