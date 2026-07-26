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
import { IntegrationExchangesService, IntegrationWebhooksService } from '../services';
import {
  DeliverWebhookDto,
  DeliveryEvidenceResponseDto,
  ExchangeAttemptResponseDto,
  RetryExchangeDto,
} from '../dto';

/**
 * Endpoints de workers de intercambio y webhooks bajo `/integration`, fuera del
 * árbol `/integration/contracts/{id}`: reintento de un intercambio por su id y
 * entrega de un webhook por id de suscripción. Operaciones gobernadas → rol
 * `SECURITY_ADMIN`.
 */
@ApiTags('integration-exchanges')
@ApiBearerAuth()
@Roles('SECURITY_ADMIN')
@Controller('integration')
export class IntegrationExchangesController {
  constructor(
    private readonly exchangesService: IntegrationExchangesService,
    private readonly webhooksService: IntegrationWebhooksService,
  ) {}

  /** UC-31-07. */
  @Post('exchanges/:recordId/retry')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reintentar un intercambio fallido' })
  retry(
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() dto: RetryExchangeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExchangeAttemptResponseDto> {
    return this.exchangesService.retry(recordId, dto, actor);
  }

  /** UC-31-09. */
  @Post('webhooks/:subscriptionId/deliveries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Entregar y verificar un webhook firmado' })
  deliver(
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() dto: DeliverWebhookDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeliveryEvidenceResponseDto> {
    return this.webhooksService.deliver(subscriptionId, dto, actor);
  }
}
