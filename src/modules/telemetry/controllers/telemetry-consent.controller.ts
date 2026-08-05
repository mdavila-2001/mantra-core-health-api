import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { TelemetryConsentService } from '../services';
import {
  CreateDisclosureAcceptanceDto,
  DisclosureAcceptanceResponseDto,
  CreateTrackingConsentDto,
  TrackingConsentResponseDto,
  ProvisionAnalyticsSubjectDto,
  AnalyticsSubjectResponseDto,
} from '../dto';

/**
 * Endpoints de consentimiento y sujetos de analítica. Capa fina que delega en
 * `TelemetryConsentService`.
 */
@ApiTags('telemetry-consent')
@ApiBearerAuth()
@Controller('telemetry')
export class TelemetryConsentController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param consent - Valor de consent requerido por la operación.
   */
  constructor(private readonly consent: TelemetryConsentService) {}

  /** UC-28-04. */
  @Post('disclosure-acceptances')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar aceptación de disclosure por usuario/sesión',
  })
  acceptDisclosure(
    @Body() dto: CreateDisclosureAcceptanceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DisclosureAcceptanceResponseDto> {
    return this.consent.acceptDisclosure(dto, actor);
  }

  /** UC-28-05. */
  @Post('tracking-consents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Otorgar consentimiento de tracking por propósito' })
  grantConsent(
    @Body() dto: CreateTrackingConsentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TrackingConsentResponseDto> {
    return this.consent.grantConsent(dto, actor);
  }

  /** UC-28-06 (interno del worker de ingesta). */
  @Post('analytics-subjects')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Provisionar sujeto de analítica pseudónimo' })
  provisionSubject(
    @Body() dto: ProvisionAnalyticsSubjectDto,
  ): Promise<AnalyticsSubjectResponseDto> {
    return this.consent.provisionSubject(dto);
  }

  /** UC-28-12. */
  @Post('tracking-consents/:id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirar consentimiento y desactivar sujeto (cascada)',
  })
  withdrawConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TrackingConsentResponseDto> {
    return this.consent.withdrawConsent(id, actor);
  }
}
