import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  Public,
  Roles,
  clearRefreshCookie,
  loadRefreshCookieConfig,
  setRefreshCookie,
  type AuthenticatedUser,
  type RefreshCookieConfig,
} from '../../../common';
import {
  IamAuthService,
  IamAssistedRegistrationService,
  IamPatientSelfRegistrationService,
  IamOrganizationSelfRegistrationService,
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
    private readonly practitionerRegistrationService: IamPractitionerSelfRegistrationService,
    private readonly passwordResetService: IamPasswordResetService,
    private readonly emailVerificationService: IamEmailVerificationService,
  ) {
    this.refreshCookie = loadRefreshCookieConfig();
  }

  /**
   * Configuración de la cookie de refresco. Se lee una vez al construir el
   * controlador: el flag es una decisión de despliegue, no de petición.
   */
  private readonly refreshCookie: RefreshCookieConfig;

  /**
   * Entrega los tokens al cliente.
   *
   * Con el flag apagado —el estado por defecto— devuelve la respuesta tal cual,
   * con el refresh token en el cuerpo. Con el flag encendido lo mueve a una
   * cookie `httpOnly` y lo **quita** del cuerpo: dejarlo en los dos sitios
   * conservaría la superficie XSS que la cookie viene a cerrar.
   */
  private deliverTokens(
    tokens: TokenResponseDto,
    res: Response,
  ): TokenResponseDto {
    if (!this.refreshCookie.enabled) return tokens;

    setRefreshCookie(res, tokens.refreshToken, this.refreshCookie);
    const { refreshToken: _moved, ...rest } = tokens;
    return rest as TokenResponseDto;
  }

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
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    // Con el flag encendido, `RefreshCookieMiddleware` ya copió el token de la
    // cookie al cuerpo antes de la validación; aquí el flujo es el mismo.
    return this.deliverTokens(await this.authService.refresh(dto), res);
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar la sesión actual del usuario' })
  async logout(
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResultDto> {
    const result = await this.authService.logout(actor);
    // Cerrar sesión sin borrar la cookie dejaría la sesión renovable desde el
    // navegador aunque el servidor ya la haya revocado.
    if (this.refreshCookie.enabled) {
      clearRefreshCookie(res, this.refreshCookie);
    }
    return result;
  }

  /** UC-01-08. */
  @Post('logout-all')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar todas las sesiones del usuario actual' })
  async logoutAll(
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutAllResultDto> {
    const result = await this.authService.logoutAll(actor);
    if (this.refreshCookie.enabled) {
      clearRefreshCookie(res, this.refreshCookie);
    }
    return result;
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
