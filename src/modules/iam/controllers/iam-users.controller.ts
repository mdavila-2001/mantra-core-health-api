import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  IamUsersService,
  IamUsersReadService,
  IamCredentialsService,
  IamMfaService,
  IamDevicesService,
  IamAssistedRegistrationService,
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
  AssistedRegistrationDto,
  AssistedRegistrationResponseDto,
  SearchUsersResponseDto,
  UserDetailResponseDto,
  ListCredentialsResponseDto,
  ListDevicesResponseDto,
  ListMfaFactorsResponseDto,
  ListSessionsResponseDto,
  ListGlobalRolesResponseDto,
} from '../dto';

/** Tope de usuarios por página cuando el cliente no pide uno. */
const DEFAULT_USERS_PAGE_SIZE = 50;

/**
 * Endpoints administrativos y de auto-servicio sobre `/iam/users`. Es una capa
 * fina: valida parámetros y delega en el servicio de dominio correspondiente.
 */
@ApiTags('iam-users')
@ApiBearerAuth()
@Controller('iam/users')
export class IamUsersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param usersService - Valor de users service requerido por la operación.
   * @param credentialsService - Valor de credentials service requerido por la operación.
   * @param mfaService - Valor de mfa service requerido por la operación.
   * @param devicesService - Valor de devices service requerido por la operación.
   * @param assistedRegistrationService - Valor de assisted registration service requerido por la operación.
   * @param usersReadService - Cara de lectura de usuarios y sus sub-colecciones.
   */
  constructor(
    private readonly usersService: IamUsersService,
    private readonly usersReadService: IamUsersReadService,
    private readonly credentialsService: IamCredentialsService,
    private readonly mfaService: IamMfaService,
    private readonly devicesService: IamDevicesService,
    private readonly assistedRegistrationService: IamAssistedRegistrationService,
  ) {}

  /**
   * UC-01-01 (cara de lectura): listado paginado de usuarios.
   *
   * Se declara antes que las rutas con parámetro para que ninguna de ellas capture
   * un segmento fijo.
   *
   * @param query - Texto sobre el nombre visible o el sujeto de la credencial.
   * @param statusConceptId - Estado al que acotar.
   * @param cursor - Cursor opaco de la página anterior.
   * @param limit - Tope de filas.
   * @returns Página de usuarios.
   */
  @Get()
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listado paginado de usuarios' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto a buscar en el nombre visible o en el correo de acceso',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Concepto de estado al que acotar',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: `Tope de resultados (por defecto ${DEFAULT_USERS_PAGE_SIZE})`,
  })
  searchUsers(
    @Query('q') query?: string,
    @Query('status', new ParseUUIDPipe({ optional: true }))
    statusConceptId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<SearchUsersResponseDto> {
    return this.usersReadService.searchUsers({
      query,
      statusConceptId,
      cursor,
      limit: limit ?? DEFAULT_USERS_PAGE_SIZE,
    });
  }

  /**
   * Ficha de un usuario.
   *
   * @param id - Usuario a leer.
   * @returns Ficha de la cuenta, sin material secreto.
   */
  @Get(':id')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Ficha de un usuario' })
  getUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserDetailResponseDto> {
    return this.usersReadService.getUserById(id);
  }

  /** UC-01-02 / UC-01-11 (cara de lectura). */
  @Get(':id/credentials')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Credenciales del usuario',
    description: 'Nunca devuelve el hash de la contraseña ni la clave pública.',
  })
  listCredentials(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListCredentialsResponseDto> {
    return this.usersReadService.listCredentials(id);
  }

  /** UC-01-05 (cara de lectura). */
  @Get(':id/devices')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Dispositivos del usuario',
    description: 'Nunca devuelve el token de notificaciones.',
  })
  listDevices(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListDevicesResponseDto> {
    return this.usersReadService.listDevices(id);
  }

  /** UC-01-03 (cara de lectura). */
  @Get(':id/mfa-factors')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Factores de MFA del usuario',
    description: 'Nunca devuelve el secreto del factor.',
  })
  listMfaFactors(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListMfaFactorsResponseDto> {
    return this.usersReadService.listMfaFactors(id);
  }

  /** UC-01-06 (cara de lectura). */
  @Get(':id/sessions')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Sesiones del usuario',
    description: 'Nunca devuelve el identificador del token de sesión.',
  })
  listSessions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListSessionsResponseDto> {
    return this.usersReadService.listSessions(id);
  }

  /** UC-01-10 (cara de lectura). */
  @Get(':id/global-roles')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Roles globales del usuario' })
  listGlobalRoles(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListGlobalRolesResponseDto> {
    return this.usersReadService.listGlobalRoles(id);
  }

  /**
   * C-18 / CAN-IDENT: registro asistido de un paciente. Devuelve el token de
   * activación de un solo uso para entregar al titular por canal seguro — NUNCA
   * una contraseña.
   */
  @Post('assisted-registration')
  @Roles('CLINICIAN', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registro asistido de un paciente (devuelve token de activación)',
  })
  assistedRegistration(
    @Body() dto: AssistedRegistrationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssistedRegistrationResponseDto> {
    return this.assistedRegistrationService.assistedRegistration(dto, actor);
  }

  /** UC-01-01. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un usuario con credencial de contraseña y rol inicial',
  })
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
