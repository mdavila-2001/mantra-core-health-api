import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HttpDispatcherService } from '../../common';
import * as entities from './entities';
import {
  IntegrationsProvidersController,
  IntegrationsConnectionsController,
  IntegrationsMessagesController,
  IntegrationsWebhooksController,
  IntegrationsCollectionsController,
} from './controllers';
import {
  IntegrationsProvidersService,
  IntegrationsConnectionsService,
  IntegrationsMessagingService,
  IntegrationsWebhooksService,
  IntegrationsCollectionsService,
} from './services';
import {
  ExternalProvidersRepository,
  ProviderConnectionsRepository,
  ProviderCredentialsRepository,
  IntegrationEndpointsRepository,
  OutboundMessagesRepository,
  MessageResponsesRepository,
  MessageRetriesRepository,
  InboundMessagesRepository,
  WebhookSubscriptionsRepository,
} from './repositories';

/**
 * Módulo Integrations (12): conectividad externa y mensajería. Proveedores,
 * conexiones y credenciales, endpoints versionados con mapeos, cola saliente
 * (dispatch/retry/dead-letter), webhooks entrantes y correlación de callbacks.
 * La autenticación llega vía `AuthModule` (global); las escrituras son
 * transaccionales con `flush` padre-antes-de-hijo.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    IntegrationsProvidersController,
    IntegrationsConnectionsController,
    IntegrationsMessagesController,
    IntegrationsWebhooksController,
    IntegrationsCollectionsController,
  ],
  providers: [
    IntegrationsCollectionsService,
    // Repositorios
    ExternalProvidersRepository,
    ProviderConnectionsRepository,
    ProviderCredentialsRepository,
    IntegrationEndpointsRepository,
    OutboundMessagesRepository,
    MessageResponsesRepository,
    MessageRetriesRepository,
    InboundMessagesRepository,
    WebhookSubscriptionsRepository,
    // Infraestructura HTTP saliente
    HttpDispatcherService,
    // Servicios
    IntegrationsProvidersService,
    IntegrationsConnectionsService,
    IntegrationsMessagingService,
    IntegrationsWebhooksService,
  ],
})
export class IntegrationsModule {}
