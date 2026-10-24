import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { MarketingCollectionsService } from '../services';
import {
  JourneyPageDto,
  ListCampaignsQueryDto,
  ListJourneysQueryDto,
  ListSegmentsQueryDto,
  MarketingCampaignPageDto,
  MarketingSegmentPageDto,
} from '../dto';

/**
 * `GET` de colección de `marketing` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('marketing-collections')
@ApiBearerAuth()
@Controller()
export class MarketingCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: MarketingCollectionsService) {}

  /** V50-02: listar recorridos de marketing del tenant. */
  @Get('marketing/journeys')
  @Roles('MARKETING_MANAGER')
  @ApiOperation({ summary: 'Listar recorridos de marketing del tenant' })
  @ApiOkResponse({ type: JourneyPageDto })
  listJourneys(@Query() query: ListJourneysQueryDto): Promise<JourneyPageDto> {
    return this.collections.listJourneys(query);
  }

  /** V50-04: listar segmentos de marketing del tenant. */
  @Get('marketing/segments')
  @Roles('MARKETING_MANAGER')
  @ApiOperation({ summary: 'Listar segmentos de marketing del tenant' })
  @ApiOkResponse({ type: MarketingSegmentPageDto })
  listSegments(
    @Query() query: ListSegmentsQueryDto,
  ): Promise<MarketingSegmentPageDto> {
    return this.collections.listSegments(query);
  }

  /** V50-06: listar campañas de marketing del tenant. */
  @Get('marketing/campaigns')
  @Roles('MARKETING_MANAGER')
  @ApiOperation({ summary: 'Listar campañas de marketing del tenant' })
  @ApiOkResponse({ type: MarketingCampaignPageDto })
  listCampaigns(
    @Query() query: ListCampaignsQueryDto,
  ): Promise<MarketingCampaignPageDto> {
    return this.collections.listCampaigns(query);
  }
}
