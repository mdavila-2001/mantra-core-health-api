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
import {
  IntegrationsProvidersService,
  IntegrationsConnectionsService,
} from '../services';
import {
  RegisterProviderDto,
  ProvisionConnectionDto,
  PublishEndpointDto,
  CreateWebhookSubscriptionDto,
  ProviderResponseDto,
  ConnectionResponseDto,
  EndpointResponseDto,
  WebhookSubscriptionResponseDto,
} from '../dto';

/**
 * Endpoints administrativos sobre proveedores externos y sus recursos hijos
 * (conexiones, endpoints versionados, suscripciones de webhook). Capa fina:
 * valida parámetros y delega en los servicios de dominio.
 */
@ApiTags('integrations-providers')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsProvidersController {
  constructor(
    private readonly providersService: IntegrationsProvidersService,
    private readonly connectionsService: IntegrationsConnectionsService,
  ) {}

  /** UC-12-01. */
  @Post('providers')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un proveedor externo' })
  registerProvider(
    @Body() dto: RegisterProviderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProviderResponseDto> {
    return this.providersService.registerProvider(dto, actor);
  }

  /** UC-12-02. */
  @Post('providers/:id/connections')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Aprovisionar una conexión de tenant y su credencial',
  })
  provisionConnection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProvisionConnectionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConnectionResponseDto> {
    return this.connectionsService.provisionConnection(id, dto, actor);
  }

  /** UC-12-04. */
  @Post('providers/:id/endpoints')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar un endpoint versionado y su mapeo de campos',
  })
  publishEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishEndpointDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EndpointResponseDto> {
    return this.providersService.publishEndpoint(id, dto, actor);
  }

  /** UC-12-11. */
  @Post('providers/:id/webhook-subscriptions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Gestionar (crear/actualizar) una suscripción de webhook',
  })
  createWebhookSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWebhookSubscriptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<WebhookSubscriptionResponseDto> {
    return this.providersService.createWebhookSubscription(id, dto, actor);
  }
}
