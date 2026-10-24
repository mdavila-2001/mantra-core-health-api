import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { IntegrationsCollectionsService } from '../services';
import {
  IntegrationProviderConnectionPageDto,
  IntegrationWebhookSubscriptionPageDto,
  ListConnectionsQueryDto,
  ListProviderConnectionsQueryDto,
  ListProviderWebhookSubscriptionsQueryDto,
} from '../dto';

/**
 * `GET` de colección de `integrations` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('integrations-collections')
@ApiBearerAuth()
@Controller()
export class IntegrationsCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: IntegrationsCollectionsService) {}

  /** V12-08: listar conexiones con proveedores del tenant. */
  @Get('integrations/connections')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar conexiones con proveedores del tenant' })
  @ApiOkResponse({ type: IntegrationProviderConnectionPageDto })
  listConnections(
    @Query() query: ListConnectionsQueryDto,
  ): Promise<IntegrationProviderConnectionPageDto> {
    return this.collections.listConnections(query);
  }

  /** V12-11: listar conexiones de un proveedor del tenant. */
  @Get('integrations/providers/:id/connections')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar conexiones de un proveedor del tenant' })
  @ApiOkResponse({ type: IntegrationProviderConnectionPageDto })
  listProviderConnections(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListProviderConnectionsQueryDto,
  ): Promise<IntegrationProviderConnectionPageDto> {
    return this.collections.listProviderConnections(id, query);
  }

  /** V12-13: listar suscripciones de webhook de un proveedor del tenant. */
  @Get('integrations/providers/:id/webhook-subscriptions')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar suscripciones de webhook de un proveedor del tenant',
  })
  @ApiOkResponse({ type: IntegrationWebhookSubscriptionPageDto })
  listProviderWebhookSubscriptions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListProviderWebhookSubscriptionsQueryDto,
  ): Promise<IntegrationWebhookSubscriptionPageDto> {
    return this.collections.listProviderWebhookSubscriptions(id, query);
  }
}
