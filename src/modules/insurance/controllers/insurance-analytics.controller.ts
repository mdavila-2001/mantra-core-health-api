import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { InsuranceAnalyticsService } from '../services';
import {
  InsuranceAnalyticsQueryDto,
  InsuranceDashboardAnalyticsResponseDto,
} from '../dto';

/**
 * Tablero de siniestralidad, gasto per cápita y métricas de salud de la
 * aseguradora — subtarea 3.1, v4.2.14.
 *
 * **Sin `@Roles`**: los roles que pedía el pedido original (`BILLING_OPERATOR`,
 * `FINANCIAL_AUDITOR`) no aplican acá — el primero es el rol del PRESTADOR
 * (`ClaimsReadController`), y el segundo no existe en ningún catálogo de roles
 * del proyecto. La barrera real es OWNER/ADMIN del tenant de la aseguradora
 * (la misma membresía que administra su catálogo) o el rol `INSURANCE_OPERATOR`,
 * y se evalúa en `InsuranceAnalyticsService` porque depende de a QUÉ
 * aseguradora pertenece el actor, no de un rol fijo declarable en el decorador.
 */
@ApiTags('insurance-analytics')
@ApiBearerAuth()
@Controller('insurance/analytics')
export class InsuranceAnalyticsController {
  constructor(private readonly service: InsuranceAnalyticsService) {}

  /**
   * Loss ratio estimado, gasto per cápita, reclamos, afiliados, tendencia
   * mensual, top de medicamentos, especialidades, patologías CIE-10 e
   * inmunización de la aseguradora del tenant activo.
   */
  @Get('loss-ratio')
  @ApiOperation({
    summary:
      'Tablero de siniestralidad, gasto per cápita y epidemiología de la aseguradora del tenant activo',
  })
  @ApiOkResponse({ type: InsuranceDashboardAnalyticsResponseDto })
  @ApiForbiddenResponse({
    description:
      'El actor no administra el tenant de la aseguradora ni tiene rol INSURANCE_OPERATOR/SECURITY_ADMIN.',
  })
  @ApiNotFoundResponse({
    description:
      'El tenant activo no tiene aseguradora, o planId no pertenece a la aseguradora.',
  })
  getLossRatioAnalytics(
    @Query() query: InsuranceAnalyticsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InsuranceDashboardAnalyticsResponseDto> {
    return this.service.getLossRatioAnalytics(query, actor);
  }
}
