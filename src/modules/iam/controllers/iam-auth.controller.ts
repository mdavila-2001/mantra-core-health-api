import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  Public,
  Roles,
  TenantAgnostic,
  clearRefreshCookie,
  loadRefreshCookieEnv,
  loadStorageEnv,
  readRefreshCookie,
  setRefreshCookie,
  type AuthenticatedUser,
  type RefreshCookieEnv,
} from '../../../common';
import type { UploadedFileBytes } from '../../common/services';
import {
  IamAuthService,
  IamAssistedRegistrationService,
  IamPatientSelfRegistrationService,
  IamOrganizationSelfRegistrationService,
  IamRegistrationDocumentUploadService,
  IamPractitionerSelfRegistrationService,
  IamPasswordResetService,
  IamEmailVerificationService,
} from '../services';
import {
  LoginDto,
  RefreshTokenDto,
  TokenResponseDto,
  LogoutAllResultDto,
  LogoutResultDto,
  PurgeResultDto,
  ActivateAccountDto,
  ActivationResultDto,
  RegisterPatientDto,
  RegisterPatientResponseDto,
  RegisterOrganizationDto,
  RegisterOrganizationResponseDto,
  RegistrationDocumentUploadResponseDto,
  RegisterPractitionerDto,
  RegisterPractitionerResponseDto,
  VerifyEmailDto,
  VerifyEmailResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  ResendVerificationDto,
  ResendVerificationResponseDto,
} from '../dto';

/** Endpoints de sesión bajo `/iam/auth`. Capa fina sobre `IamAuthService`. */
@ApiTags('iam-auth')
@Controller('iam/auth')
export class IamAuthController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param authService - Valor de auth service requerido por la operación.
   * @param assistedRegistrationService - Valor de assisted registration service requerido por la operación.
   * @param selfRegistrationService - Valor de self registration service requerido por la operación.
   */
  constructor(
    private readonly authService: IamAuthService,
    private readonly assistedRegistrationService: IamAssistedRegistrationService,
    private readonly selfRegistrationService: IamPatientSelfRegistrationService,
    private readonly organizationRegistrationService: IamOrganizationSelfRegistrationService,
    private readonly registrationDocumentUploadService: IamRegistrationDocumentUploadService,
    private readonly practitionerRegistrationService: IamPractitionerSelfRegistrationService,
    private readonly passwordResetService: IamPasswordResetService,
    private readonly emailVerificationService: IamEmailVerificationService,
  ) {}

  /**
   * Modo de entrega del refresh token, resuelto una sola vez al construir el
   * controlador. Es configuración de arranque: releerla por petición sólo
   * añadiría la posibilidad de que dos peticiones de la misma sesión usaran
   * modos distintos.
   */
  private readonly cookieEnv: RefreshCookieEnv = loadRefreshCookieEnv();

  /**
   * Auto-registro de un paciente con su documento de identidad. El correo es
   * opcional y no condiciona el acceso: la cuenta queda usable de inmediato.
   */
  @Post('register-patient')
  @Public()
  // Mismo límite estricto que el resto de rutas públicas de escritura: crear
  // cuentas es la superficie más golpeada por automatización.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrarse como paciente con documento de identidad',
  })
  registerPatient(
    @Body() dto: RegisterPatientDto,
    @Ip() ip: string,
  ): Promise<RegisterPatientResponseDto> {
    return this.selfRegistrationService.registerPatient(dto, ip);
  }

  /**
   * Auto-registro de una organización con la cuenta de su owner. La
   * organización queda PENDIENTE de verificación por la plataforma; el owner
   * puede iniciar sesión de inmediato y preparar su cuenta mientras tanto.
   */
  @Post('register-organization')
  @Public()
  // Mismo límite estricto que el resto de rutas públicas de escritura: crear
  // cuentas es la superficie más golpeada por automatización.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una organización con su cuenta owner',
  })
  registerOrganization(
    @Body() dto: RegisterOrganizationDto,
    @Ip() ip: string,
  ): Promise<RegisterOrganizationResponseDto> {
    return this.organizationRegistrationService.registerOrganization(dto, ip);
  }

  /**
   * Pre-carga pública de un documento legal en PDF para el alta de
   * organización (subtarea 1.2).
   *
   * El archivo nace sin dueño (`common.files.created_by_user_id` NULL) y
   * queda inutilizable hasta que `POST /iam/auth/register-organization` lo
   * reclama por su `fileId` dentro de `organization.legalDocuments`, en la
   * misma transacción que crea el tenant.
   *
   * Límite de 30/min y no el estándar de 10: un alta legítima de aseguradora
   * sube hasta 5 PDF y puede reintentar alguno, y sigue diez veces por
   * debajo del backstop global (300/min, `app.module.ts`).
   *
   * Deuda conocida, declarada y no resuelta acá: nada purga las subidas
   * anónimas que nunca se reclaman (abandono del formulario, rechazo del
   * alta). Quedan en `common.files` con el tenant DEFAULT y sin dueño.
   */
  @Post('upload-registration-document')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: loadStorageEnv().maxSizeBytes, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Pre-cargar un documento legal (PDF) del registro de organización',
  })
  uploadRegistrationDocument(
    @UploadedFile() file: UploadedFileBytes | undefined,
  ): Promise<RegistrationDocumentUploadResponseDto> {
    return this.registrationDocumentUploadService.upload(file);
  }

  /**
   * Auto-registro de un profesional de salud. Crea su cuenta, su persona, su
   * perfil profesional y su licencia en una sola operación. La matrícula queda
   * PENDIENTE de verificación: puede iniciar sesión de inmediato, pero no está
   * habilitado para ejercer hasta que la plataforma valide la documentación.
   */
  @Post('register-practitioner')
  @Public()
  // Mismo límite estricto que el resto de rutas públicas de escritura: crear
  // cuentas es la superficie más golpeada por automatización.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrarse como profesional de salud con su matrícula',
  })
  registerPractitioner(
    @Body() dto: RegisterPractitionerDto,
    @Ip() ip: string,
  ): Promise<RegisterPractitionerResponseDto> {
    return this.practitionerRegistrationService.registerPractitioner(dto, ip);
  }

  /**
   * Consume el token de verificación de correo. No desbloquea nada: sólo deja
   * constancia de que la dirección es alcanzable por su titular.
   */
  /**
   * Reemite el enlace de verificación de correo.
   *
   * Responde **202 y el mismo mensaje siempre**, exista o no la cuenta, esté o
   * no verificada: las tres respuestas distinguibles convertirían un formulario
   * público en un oráculo de qué direcciones tienen cuenta aquí.
   *
   * Mismo techo que `forgot-password`: cada solicitud válida dispara un correo,
   * y sin límite el formulario es un amplificador de spam contra un tercero.
   */
  @Post('resend-verification')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Reenviar el enlace de verificación del correo',
  })
  resendVerification(
    @Body() dto: ResendVerificationDto,
    @Ip() ip: string,
  ): Promise<ResendVerificationResponseDto> {
    return this.emailVerificationService.resend(dto, ip);
  }

  @Post('verify-email')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar el correo con el token recibido' })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    return this.selfRegistrationService.verifyEmail(dto);
  }

  /**
   * C-18: el titular consume el token de activación de un solo uso y fija su
   * contraseña definitiva. El creador de la cuenta nunca ve esta contraseña.
   */
  @Post('activate')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Activar la cuenta con el token de un solo uso y fijar la contraseña',
  })
  activate(
    @Body() dto: ActivateAccountDto,
    @Ip() ip: string,
  ): Promise<ActivationResultDto> {
    return this.assistedRegistrationService.activateAccount(dto, ip);
  }

  /** UC-01-04. */
  @Post('login')
  @Public()
  // Límite estricto contra fuerza bruta / credential stuffing sobre el login,
  // por encima del backstop global. El lockout por cuenta complementa este límite
  // por IP.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión con email o documento de identidad y contraseña',
  })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    return this.deliverTokens(await this.authService.login(dto, ip), res);
  }

  /**
   * UC-01-13: pide el enlace de restablecimiento.
   *
   * Responde **202 y el mismo mensaje siempre**, exista o no la cuenta. Un 404
   * cuando el correo no está registrado convertiría este formulario, que es
   * público, en un oráculo de qué direcciones tienen cuenta en una plataforma
   * de salud.
   *
   * El límite es más estricto que el del login porque cada solicitud válida
   * dispara un correo: sin techo, el formulario es un amplificador de spam
   * contra la bandeja de un tercero.
   */
  @Post('forgot-password')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Solicitar el restablecimiento de la contraseña',
  })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Ip() ip: string,
  ): Promise<ForgotPasswordResponseDto> {
    return this.passwordResetService.requestReset(dto, ip);
  }

  /**
   * UC-01-13: consume el token recibido por correo y fija la contraseña nueva.
   *
   * Cierra todas las sesiones abiertas del usuario: quien recupera su cuenta lo
   * hace porque perdió el control de la clave anterior.
   */
  @Post('reset-password')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fijar una contraseña nueva con el token recibido por correo',
  })
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Ip() ip: string,
  ): Promise<ResetPasswordResponseDto> {
    return this.passwordResetService.resetPassword(dto, ip);
  }

  /** UC-01-06. */
  @Post('token/refresh')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotar el refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const presented = this.cookieEnv.enabled
      ? readRefreshCookie(req)
      : dto.refreshToken;
    if (!presented) {
      // Con la cookie encendida el DTO ya no exige el campo, así que la
      // ausencia del token deja de ser un 400 de validación y tiene que
      // rechazarse aquí. Es 401 y no 400 a propósito: para el cliente es "no
      // tengo sesión que rotar", el mismo caso que una cookie caducada.
      throw new UnauthorizedException('No se presentó un refresh token');
    }
    return this.deliverTokens(await this.authService.refresh(presented), res);
  }

  /**
   * Entrega el par de tokens según el modo configurado.
   *
   * Con la cookie apagada —el default— devuelve la respuesta tal cual y el
   * contrato no cambia en absoluto. Con la cookie encendida escribe el refresh
   * token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos
   * sitios no protegería de nada, porque el objetivo del ejercicio es que el
   * token deje de estar al alcance de JavaScript.
   *
   * @param tokens - Par emitido por el dominio.
   * @param res - Respuesta de Express en curso.
   * @returns La respuesta que ve el cliente.
   */
  private deliverTokens(
    tokens: TokenResponseDto,
    res: Response,
  ): TokenResponseDto {
    if (!this.cookieEnv.enabled) return tokens;

    setRefreshCookie(res, tokens.refreshToken, this.cookieEnv);
    return { ...tokens, refreshToken: '' };
  }

  /**
   * Cierra la sesión del token en uso.
   *
   * Complementa a `logout-all`, que cierra todas. Sin esta ruta, salir de la
   * aplicación sólo limpiaba el navegador y el refresh token seguía sirviendo
   * hasta caducar.
   */
  @Post('logout')
  @ApiBearerAuth()
  // Cerrar la sesión propia no toca datos de ningún tenant: exigir contexto de
  // tenant dejaba a las cuentas sin membresía sin forma de revocar su sesión.
  @TenantAgnostic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar la sesión actual del usuario' })
  async logout(
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResultDto> {
    const result = await this.authService.logout(actor);
    // Sin esto la cookie sobreviviría al cierre de sesión: el token de dentro ya
    // no serviría, pero el navegador seguiría mandándola en cada refresco y el
    // cliente vería un 401 en vez de un estado limpio de "sin sesión".
    if (this.cookieEnv.enabled) clearRefreshCookie(res, this.cookieEnv);
    return result;
  }

  /** UC-01-08. */
  @Post('logout-all')
  @ApiBearerAuth()
  @TenantAgnostic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar todas las sesiones del usuario actual' })
  logoutAll(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LogoutAllResultDto> {
    return this.authService.logoutAll(actor);
  }

  /** UC-01-11. */
  @Post('sessions/purge')
  @Roles('SECURITY_ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expirar sesiones y tokens vencidos' })
  purge(@CurrentUser() actor: AuthenticatedUser): Promise<PurgeResultDto> {
    return this.authService.purgeSessions(actor);
  }
}
