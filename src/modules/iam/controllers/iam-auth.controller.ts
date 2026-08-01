import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  Public,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  IamAuthService,
  IamAssistedRegistrationService,
  IamPatientSelfRegistrationService,
  IamOrganizationSelfRegistrationService,
  IamPractitionerSelfRegistrationService,
} from '../services';
import {
  LoginDto,
  RefreshTokenDto,
  TokenResponseDto,
  LogoutAllResultDto,
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
  ) {}

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
  login(@Body() dto: LoginDto, @Ip() ip: string): Promise<TokenResponseDto> {
    return this.authService.login(dto, ip);
  }

  /** UC-01-06. */
  @Post('token/refresh')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotar el refresh token' })
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refresh(dto);
  }

  /** UC-01-08. */
  @Post('logout-all')
  @ApiBearerAuth()
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
