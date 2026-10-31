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
  UseGuards,
} from '@nestjs/common';
import { PlatformAdminScopeGuard } from '../../../../common/auth/platform-admin-scope.guard';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPreconditionFailedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  NotAudited,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import {
  IamUsersService,
  IamUsersReadService,
  IamCredentialsService,
  IamMfaService,
  IamDevicesService,
  IamAssistedRegistrationService,
  IamPractitionerSelfRegistrationService,
} from '../../application/services';
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
  AssistedPractitionerRegistrationDto,
  AssistedPractitionerRegistrationResponseDto,
  AssistedRegistrationDto,
  AssistedRegistrationResponseDto,
  SearchUsersBodyDto,
  SearchUsersResponseDto,
  UserDetailResponseDto,
  ListCredentialsResponseDto,
  ListDevicesResponseDto,
  ListMfaFactorsResponseDto,
  ListSessionsResponseDto,
  ListGlobalRolesResponseDto,
  UserLifecycleReasonDto,
  UserLifecycleResultDto,
  UserLifecycleViewDto,
  UserLifecycleHistoryQueryDto,
} from '../dto';

/** Tope de usuarios por página cuando el cliente no pide uno. */
const DEFAULT_USERS_PAGE_SIZE = 50;

/**
 * Endpoints administrativos y de auto-servicio sobre `/iam/users`. Es una capa
 * fina: valida parámetros y delega en el servicio de dominio correspondiente.
 *
 * ## Contrato H5: ciclo de vida de la cuenta (todo `SECURITY_ADMIN`)
 *
 * | Ruta | Cuerpo / query | Respuesta |
 * |---|---|---|
 * | `POST /iam/users/:id/suspend` | `{ reason }` (obligatorio, ≤ 500) | 200 `{ id, state, changed, revokedSessions }` |
 * | `POST /iam/users/:id/reactivate` | `{ reason }` | 200 igual |
 * | `POST /iam/users/:id/deactivate` | `{ reason }` | 200 igual (la baja no borra; no se reactiva) |
 * | `GET /iam/users/:id/lifecycle` | `?limit=1..100&cursor=` | 200 `{ userId, state, items[], nextCursor, limit }` |
 *
 * `state`: `ACTIVE | SUSPENDED | DEACTIVATED | ANONYMIZED`. Idempotentes: repetir la acción sobre
 * la cuenta que ya está en ese estado responde 200 con `changed: false` y no escribe. Errores:
 * 400 (`reason` ausente o vacío, clave no declarada), 404 `USER_NOT_FOUND`, 409
 * `USER_LIFECYCLE_TRANSITION_INVALID`, 412 `USER_SELF_LIFECYCLE_FORBIDDEN` /
 * `USER_LAST_SECURITY_ADMIN`, 401 sin token, 403 `ROLE_INSUFFICIENT`.
 * Contrato completo: `docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H5-permisos-y-usuarios.md`.
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
   * @param practitionerRegistrationService - Alta de profesionales (autoservicio y administrativa).
   * @param usersReadService - Cara de lectura de usuarios y sus sub-colecciones.
   */
  constructor(
    private readonly usersService: IamUsersService,
    private readonly usersReadService: IamUsersReadService,
    private readonly credentialsService: IamCredentialsService,
    private readonly mfaService: IamMfaService,
    private readonly devicesService: IamDevicesService,
    private readonly assistedRegistrationService: IamAssistedRegistrationService,
    private readonly practitionerRegistrationService: IamPractitionerSelfRegistrationService,
  ) {}

  /**
   * UC-01-01 (cara de lectura): listado paginado de usuarios.
   *
   * Se declara antes que las rutas con parámetro para que ninguna de ellas capture
   * un segmento fijo.
   *
   * Obsoleto: el cliente usa `POST /iam/users/search`, que lleva el texto en el
   * cuerpo. Se conserva sólo por compatibilidad, con los mismos roles, filtros
   * y respuesta.
   *
   * @param query - Texto sobre el nombre visible o el sujeto de la credencial.
   * @param statusConceptId - Estado al que acotar.
   * @param cursor - Cursor opaco de la página anterior.
   * @param limit - Tope de filas.
   * @returns Página de usuarios.
   */
  @Get()
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listado paginado de usuarios (obsoleto)',
    description:
      'Obsoleto: usar `POST /iam/users/search`. Un nombre o un correo en la query string queda en los logs de acceso de cualquier proxy.',
    deprecated: true,
  })
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
   * UC-01-01 (cara de lectura): listado paginado de usuarios, con los filtros
   * en el cuerpo.
   *
   * Existe porque el texto de búsqueda es un nombre o un correo, y los
   * parámetros de la URL quedan en los logs de acceso de cualquier proxy, en el
   * historial del navegador y en el `Referer`. Es el camino que usa el cliente
   * (por ejemplo, para elegir al owner en el alta administrativa de una
   * organización); el `GET /iam/users` sigue vivo, obsoleto.
   *
   * Responde `200` y no `201`: no crea nada. Va declarada antes que cualquier
   * ruta `:id`: Nest las resuelve por orden de declaración. Los filtros, los
   * límites y el tope por defecto son los del `GET`; una clave de más responde
   * `400`.
   *
   * @param body - Filtros de la búsqueda.
   * @returns Página de usuarios.
   */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  @Roles('SECURITY_ADMIN')
  @NotAudited(
    'Listado de sólo lectura, sin efectos: es el mismo listado que `GET /iam/users` (que no muta), con los filtros en el cuerpo para que no queden en la URL. No hay estado que sellar.',
  )
  @ApiOperation({
    summary: 'Listado paginado de usuarios, con los filtros en el cuerpo',
    description:
      'Igual que `GET /iam/users`, pero el texto de búsqueda viaja en el cuerpo y no en la URL. Una clave no declarada responde 400.',
  })
  @ApiOkResponse({ type: SearchUsersResponseDto })
  searchUsersByBody(
    @Body() body: SearchUsersBodyDto,
  ): Promise<SearchUsersResponseDto> {
    return this.usersReadService.searchUsers({
      query: body.q,
      statusConceptId: body.status,
      cursor: body.cursor,
      limit: body.limit ?? DEFAULT_USERS_PAGE_SIZE,
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

  /** Estado de ciclo de vida de la cuenta y su historia (suspensiones, reactivaciones, bajas). */
  @Get(':id/lifecycle')
  @Roles('SECURITY_ADMIN')
  @UseGuards(PlatformAdminScopeGuard)
  @ApiOperation({
    summary: 'Estado de ciclo de vida de la cuenta y su historia, paginada',
  })
  @ApiOkResponse({ type: UserLifecycleViewDto })
  @ApiNotFoundResponse({ description: 'No existe el usuario' })
  lifecycle(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: UserLifecycleHistoryQueryDto,
  ): Promise<UserLifecycleViewDto> {
    return this.usersService.lifecycleOf(id, query);
  }

  /**
   * C-18 / CAN-IDENT: registro asistido de un paciente. Devuelve el token de
   * activación de un solo uso para entregar al titular por canal seguro — NUNCA
   * una contraseña.
   */
  @Audited({
    action: 'USER_ASSISTED_REGISTERED',
    entity: 'user',
    entityId: 'result.id',
  })
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

  /**
   * P6: alta de un profesional **por un administrador**.
   *
   * El equivalente de `assisted-registration` para el otro lado del mostrador.
   * Faltaba: el único alta de profesional era `POST /iam/auth/register-practitioner`,
   * que es `@Public()` y está limitado a 10 peticiones por minuto porque su
   * superficie es un formulario abierto — su propio DTO declara que «el
   * profesional se da de alta él mismo». Construir la pantalla de administración
   * encima habría contradicho el contrato.
   *
   * Devuelve el token de activación de un solo uso para entregar al titular por
   * canal seguro — **NUNCA** una contraseña.
   */
  @Audited({
    action: 'PRACTITIONER_ASSISTED_REGISTERED',
    entity: 'user',
    entityId: 'result.id',
  })
  @Post('assisted-practitioner-registration')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Alta administrativa de un profesional (devuelve token de activación)',
  })
  assistedPractitionerRegistration(
    @Body() dto: AssistedPractitionerRegistrationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssistedPractitionerRegistrationResponseDto> {
    return this.practitionerRegistrationService.assistedRegisterPractitioner(
      dto,
      actor,
    );
  }

  /** UC-01-01. */
  @Audited({
    action: 'USER_CREATED',
    entity: 'user',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'FEDERATED_CREDENTIAL_LINKED',
    entity: 'authentication_credential',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'CREDENTIAL_REVOKED',
    entity: 'authentication_credential',
    entityId: 'param:cid',
  })
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
  @Audited({
    action: 'MFA_FACTOR_ENROLLED',
    entity: 'mfa_factor',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'DEVICE_REGISTERED',
    entity: 'device',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'USER_LOCKED',
    entity: 'user',
    entityId: 'param:id',
  })
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

  /** Suspende la cuenta (reversible): bloquea el acceso y cierra sus sesiones. */
  @Audited({
    action: 'USER_SUSPENDED',
    entity: 'user',
    entityId: 'param:id',
  })
  @Post(':id/suspend')
  @Roles('SECURITY_ADMIN')
  @UseGuards(PlatformAdminScopeGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Suspender la cuenta con motivo (idempotente, cierra sus sesiones)',
  })
  @ApiOkResponse({ type: UserLifecycleResultDto })
  @ApiNotFoundResponse({ description: 'No existe el usuario' })
  @ApiConflictResponse({ description: 'Transición inválida desde ese estado' })
  @ApiPreconditionFailedResponse({
    description: 'Cuenta propia o última cuenta administradora',
  })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UserLifecycleReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserLifecycleResultDto> {
    return this.usersService.suspend(id, dto.reason, actor);
  }

  /** Reactiva una cuenta suspendida. */
  @Audited({
    action: 'USER_REACTIVATED',
    entity: 'user',
    entityId: 'param:id',
  })
  @Post(':id/reactivate')
  @Roles('SECURITY_ADMIN')
  @UseGuards(PlatformAdminScopeGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reactivar una cuenta suspendida con motivo (idempotente)',
  })
  @ApiOkResponse({ type: UserLifecycleResultDto })
  @ApiNotFoundResponse({ description: 'No existe el usuario' })
  @ApiConflictResponse({
    description: 'Una baja o una cuenta anonimizada no se reactiva',
  })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UserLifecycleReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserLifecycleResultDto> {
    return this.usersService.reactivate(id, dto.reason, actor);
  }

  /** Da de baja la cuenta: no borra nada; revoca credenciales, roles globales y sesiones. */
  @Audited({
    action: 'USER_DEACTIVATED',
    entity: 'user',
    entityId: 'param:id',
  })
  @Post(':id/deactivate')
  @Roles('SECURITY_ADMIN')
  @UseGuards(PlatformAdminScopeGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Dar de baja la cuenta con motivo (sin borrado físico; idempotente)',
  })
  @ApiOkResponse({ type: UserLifecycleResultDto })
  @ApiNotFoundResponse({ description: 'No existe el usuario' })
  @ApiConflictResponse({ description: 'Transición inválida desde ese estado' })
  @ApiPreconditionFailedResponse({
    description: 'Cuenta propia o última cuenta administradora',
  })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UserLifecycleReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserLifecycleResultDto> {
    return this.usersService.deactivate(id, dto.reason, actor);
  }

  /** UC-01-10. */
  @Audited({
    action: 'USER_GLOBAL_ROLE_CHANGED',
    entity: 'user',
    entityId: 'param:id',
  })
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
  @Audited({
    action: 'USER_ANONYMIZED',
    entity: 'user',
    entityId: 'param:id',
  })
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
