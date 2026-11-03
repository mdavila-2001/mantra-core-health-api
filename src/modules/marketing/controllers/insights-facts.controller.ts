import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  INSIGHTS_PLATFORM_ROLES,
  INSIGHTS_READ_ROLES,
} from '../marketing.insights-access';
import { InsightsFactsQueryDto } from '../dto/insights-query.dto';
import {
  InsightsCatalogResponseDto,
  InsightsFactsResponseDto,
} from '../dto/insights-facts.response.dto';
import { InsightsFactsService } from '../services/insights-facts.service';

/**
 * AloVida Insights: catálogo y hechos de campaña. Solo lectura, con ventana
 * obligatoria (máx. 92 días). Dataset de plataforma, sin `tenant_id`: la
 * autoridad es el rol. `PLATFORM_ADMIN` y `DATA_PLATFORM_ADMIN` leen sin
 * cabecera; `MARKETING_MANAGER` es un rol de tenant y necesita `X-Tenant-Id`
 * (o una sola membresía), pero el dato que recibe no se filtra por tenant.
 */
@ApiTags('marketing-insights')
@ApiBearerAuth()
@Controller('marketing/insights')
@PlatformTenantOptional(...INSIGHTS_PLATFORM_ROLES)
export class InsightsFactsController {
  constructor(private readonly insights: InsightsFactsService) {}

  @Get('catalog')
  @Roles(...INSIGHTS_READ_ROLES)
  @ApiOperation({
    summary: 'Campañas (con sus canales y objetivos) e hitos de Insights',
  })
  @ApiOkResponse({ type: InsightsCatalogResponseDto })
  catalog() {
    return this.insights.catalog();
  }

  @Get('campaign-facts')
  @Roles(...INSIGHTS_READ_ROLES)
  @ApiOperation({
    summary:
      'Hechos diarios por campaña y canal; lo que la fuente no reporta se declara en meta.notMeasured',
  })
  @ApiOkResponse({ type: InsightsFactsResponseDto })
  campaignFacts(@Query() query: InsightsFactsQueryDto) {
    return this.insights.campaignFacts(query);
  }
}
