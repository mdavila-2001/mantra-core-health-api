import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { IamUsersController, IamAuthController } from './controllers';
import {
  IamUsersService,
  IamCredentialsService,
  IamMfaService,
  IamDevicesService,
  IamAuthService,
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
} from './repositories';

/**
 * Módulo IAM: identidad, credenciales, sesiones, MFA, dispositivos, roles
 * globales y eventos de seguridad. `TokenService` llega vía `AuthModule` (global).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
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
    // Servicios
    IamUsersService,
    IamCredentialsService,
    IamMfaService,
    IamDevicesService,
    IamAuthService,
  ],
})
export class IamModule {}
