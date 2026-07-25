import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  IamUsersService,
  IamCredentialsService,
  IamMfaService,
  IamDevicesService,
} from '../services';
import {
  CreateUserDto,
  UserResponseDto,
  LinkFederatedCredentialDto,
  CredentialResponseDto,
  MfaFactorDto,
  MfaFactorResponseDto,
  CreateDeviceDto,
  DeviceResponseDto,
  LockUserDto,
  GlobalRoleDto,
  StatusResultDto,
} from '../dto';

/**
 * Endpoints administrativos y de auto-servicio sobre `/iam/users`. Es una capa
 * fina: valida parámetros y delega en el servicio de dominio correspondiente.
 */
@ApiTags('iam-users')
@ApiBearerAuth()
@Controller('iam/users')
export class IamUsersController {
  constructor(
    private readonly usersService: IamUsersService,
    private readonly credentialsService: IamCredentialsService,
    private readonly mfaService: IamMfaService,
    private readonly devicesService: IamDevicesService,
  ) {}

  /** UC-01-01. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un usuario con credencial de contraseña y rol inicial' })
  createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.usersService.createUser(dto, actor);
  }

  /** UC-01-02. */
  @Post(':id/credentials/federated')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enlazar una credencial de identidad federada' })
  linkFederated(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkFederatedCredentialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CredentialResponseDto> {
    return this.credentialsService.linkFederated(id, dto, actor);
  }

  /** UC-01-09. */
  @Post(':id/credentials/:cid/revoke')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar una credencial del usuario' })
  revokeCredential(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('cid', ParseUUIDPipe) cid: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.credentialsService.revokeCredential(id, cid, actor);
  }

  /** UC-01-03. */
  @Post(':id/mfa-factors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enrolar o verificar un factor MFA' })
  mfaFactor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MfaFactorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MfaFactorResponseDto> {
    return this.mfaService.enrollOrVerify(id, dto, actor);
  }

  /** UC-01-05. */
  @Post(':id/devices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un dispositivo del usuario' })
  registerDevice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDeviceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeviceResponseDto> {
    return this.devicesService.register(id, dto, actor);
  }

  /** UC-01-07. */
  @Post(':id/lock')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bloquear la cuenta y revocar sus sesiones' })
  lock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LockUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.usersService.lock(id, dto, actor);
  }

  /** UC-01-10. */
  @Post(':id/global-roles')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conceder o revocar un rol global' })
  changeGlobalRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GlobalRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.usersService.changeGlobalRole(id, dto, actor);
  }

  /** UC-01-12. */
  @Post(':id/anonymize')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anonimizar (DSAR) la cuenta' })
  anonymize(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.usersService.anonymize(id, actor);
  }
}
