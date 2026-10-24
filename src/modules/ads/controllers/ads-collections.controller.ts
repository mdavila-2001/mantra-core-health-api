import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { AdsCollectionsService } from '../services';
import {
  AdEventDataPolicyPageDto,
  AdPlatformConnectionPageDto,
  ListEventDataPoliciesQueryDto,
  ListPlatformConnectionsQueryDto,
} from '../dto';

/**
 * `GET` de colección de `ads` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('ads-collections')
@ApiBearerAuth()
@Controller()
export class AdsCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: AdsCollectionsService) {}

  /** V43-13: listar políticas de datos de evento del tenant. */
  @Get('ads/event-data-policies')
  @Roles('DATA_PRIVACY_OFFICER', 'ADS_ADMIN')
  @ApiOperation({ summary: 'Listar políticas de datos de evento del tenant' })
  @ApiOkResponse({ type: AdEventDataPolicyPageDto })
  listEventDataPolicies(
    @Query() query: ListEventDataPoliciesQueryDto,
  ): Promise<AdEventDataPolicyPageDto> {
    return this.collections.listEventDataPolicies(query);
  }

  /** V43-16: listar conexiones con plataformas de anuncios del tenant. */
  @Get('ads/platform-connections')
  @Roles('ADS_ADMIN', 'BUSINESS_ADMIN')
  @ApiOperation({
    summary: 'Listar conexiones con plataformas de anuncios del tenant',
  })
  @ApiOkResponse({ type: AdPlatformConnectionPageDto })
  listPlatformConnections(
    @Query() query: ListPlatformConnectionsQueryDto,
  ): Promise<AdPlatformConnectionPageDto> {
    return this.collections.listPlatformConnections(query);
  }
}
