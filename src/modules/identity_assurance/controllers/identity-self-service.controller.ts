import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { IdentitySelfServiceService } from '../services';
import {
  RequestLicenseVerificationDto,
  RequestVerificationDto,
  VerificationRequestResponseDto,
  VerificationStatusResponseDto,
} from '../dto';

/**
 * Verificaciones que inicia el propio titular.
 *
 * No llevan `@Roles`: el control no es qué rol global tiene la cuenta —los
 * roles globales del sistema son sólo `USER`/`SECURITY_ADMIN`/`SUPERADMIN`—
 * sino que el sujeto que se verifica sea suyo, que es lo que comprueba el
 * servicio resolviéndolo del usuario autenticado en vez de leerlo del cuerpo.
 */
@ApiTags('identity-self-service')
@ApiBearerAuth()
@Controller('identity/me')
export class IdentitySelfServiceController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param selfService - Valor de self service requerido por la operación.
   */
  constructor(private readonly selfService: IdentitySelfServiceService) {}

  /** El paciente sube su foto con el carnet para verificar su identidad. */
  @Post('identity-verification')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar la verificación de la propia identidad (paciente)',
  })
  requestPatientIdentity(
    @Body() dto: RequestVerificationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    return this.selfService.requestPatientIdentity(dto, actor);
  }

  /** El profesional verifica su identidad. */
  @Post('practitioner/identity-verification')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar la verificación de la propia identidad (profesional)',
  })
  requestPractitionerIdentity(
    @Body() dto: RequestVerificationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    return this.selfService.requestPractitionerIdentity(dto, actor);
  }

  /** El profesional verifica su matrícula. */
  @Post('practitioner/license-verification')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar la verificación de la propia matrícula' })
  requestPractitionerLicense(
    @Body() dto: RequestLicenseVerificationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    return this.selfService.requestPractitionerLicense(dto, actor);
  }

  /** El responsable de una institución pide verificarla. */
  @Post('tenants/:tenantId/verification')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar la verificación de una institución propia',
  })
  requestTenantVerification(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: RequestVerificationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VerificationRequestResponseDto> {
    return this.selfService.requestTenantVerification(tenantId, dto, actor);
  }

  /** Estado del caso propio, para esperar el veredicto de la autoridad. */
  @Get('verification-cases/:caseId')
  @ApiOperation({ summary: 'Consultar el estado de un caso propio' })
  getOwnCaseStatus(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VerificationStatusResponseDto> {
    return this.selfService.getOwnCaseStatus(caseId, actor);
  }
}
